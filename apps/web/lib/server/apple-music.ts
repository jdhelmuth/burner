import "server-only";

import { createSign } from "node:crypto";
import { readFile } from "node:fs/promises";

import type { ImportedTrack } from "@burner/core";

import { parseAppleMusicUrl } from "../apple-music";

type AppleMusicArtwork = {
  url?: string;
};

type AppleMusicPreview = {
  url?: string;
};

type AppleMusicSongAttributes = {
  albumName?: string;
  artistName?: string;
  artwork?: AppleMusicArtwork;
  name?: string;
  previews?: AppleMusicPreview[];
  url?: string;
};

type AppleMusicResource = {
  attributes?: AppleMusicSongAttributes;
  id?: string;
  type?: string;
};

type AppleMusicResponse = {
  data?: AppleMusicResource[];
  next?: string;
  errors?: Array<{ detail?: string; title?: string }>;
};

const APPLE_MUSIC_API_ORIGIN = "https://api.music.apple.com";
const TOKEN_MAX_AGE_SECONDS = 15_777_000 - 300;
const MAX_APPLE_MUSIC_TRACKS = 50;

let cachedGeneratedToken: {
  expiresAt: number;
  fingerprint: string;
  token: string;
} | null = null;

function base64Url(input: Buffer | string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function normalizePrivateKey(value: string) {
  return value.replace(/\\n/g, "\n").trim();
}

async function readPrivateKey() {
  const inlineKey = process.env.APPLE_MUSIC_PRIVATE_KEY?.trim();
  if (inlineKey) {
    return normalizePrivateKey(inlineKey);
  }

  const keyPath = process.env.APPLE_MUSIC_PRIVATE_KEY_PATH?.trim();
  if (keyPath) {
    return readFile(keyPath, "utf8");
  }

  throw new Error(
    "Apple Music is not configured. Set APPLE_MUSIC_DEVELOPER_TOKEN or APPLE_MUSIC_KEY_ID, APPLE_MUSIC_TEAM_ID, and APPLE_MUSIC_PRIVATE_KEY.",
  );
}

function signDeveloperToken(input: {
  keyId: string;
  privateKey: string;
  teamId: string;
}) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + TOKEN_MAX_AGE_SECONDS;
  const header = base64Url(
    JSON.stringify({
      alg: "ES256",
      kid: input.keyId,
      typ: "JWT",
    }),
  );
  const payload = base64Url(
    JSON.stringify({
      exp: expiresAt,
      iat: issuedAt,
      iss: input.teamId,
    }),
  );
  const signingInput = `${header}.${payload}`;
  const signer = createSign("SHA256");
  signer.update(signingInput);
  signer.end();
  const signature = signer.sign({
    dsaEncoding: "ieee-p1363",
    key: input.privateKey,
  });

  return {
    expiresAt,
    token: `${signingInput}.${base64Url(signature)}`,
  };
}

export async function getAppleMusicDeveloperToken() {
  const configuredToken = process.env.APPLE_MUSIC_DEVELOPER_TOKEN?.trim();
  if (configuredToken) {
    return configuredToken;
  }

  const keyId = process.env.APPLE_MUSIC_KEY_ID?.trim();
  const teamId = process.env.APPLE_MUSIC_TEAM_ID?.trim();
  if (!keyId || !teamId) {
    throw new Error(
      "Apple Music is not configured. Set APPLE_MUSIC_KEY_ID and APPLE_MUSIC_TEAM_ID.",
    );
  }

  const privateKey = await readPrivateKey();
  const fingerprint = `${keyId}:${teamId}:${privateKey.length}`;
  const now = Math.floor(Date.now() / 1000);
  if (
    cachedGeneratedToken?.fingerprint === fingerprint &&
    cachedGeneratedToken.expiresAt - now > 300
  ) {
    return cachedGeneratedToken.token;
  }

  cachedGeneratedToken = {
    fingerprint,
    ...signDeveloperToken({ keyId, privateKey, teamId }),
  };
  return cachedGeneratedToken.token;
}

async function appleMusicFetch(path: string) {
  return fetch(`${APPLE_MUSIC_API_ORIGIN}${path}`, {
    headers: {
      Authorization: `Bearer ${await getAppleMusicDeveloperToken()}`,
    },
  });
}

function buildArtworkUrl(artwork: AppleMusicArtwork | undefined) {
  const url = artwork?.url;
  if (!url) {
    return undefined;
  }

  return url.replace("{w}x{h}", "1200x1200").replace("{f}", "jpg");
}

function getAppleMusicErrorMessage(payload: AppleMusicResponse) {
  const error = payload.errors?.[0];
  return (
    error?.detail ?? error?.title ?? "Apple Music could not resolve that link."
  );
}

function buildAppleMusicTrack(
  storefront: string,
  resource: AppleMusicResource | undefined,
): ImportedTrack | null {
  const attributes = resource?.attributes;
  const title = attributes?.name?.trim();
  const artist = attributes?.artistName?.trim();

  if (!resource?.id || !title || !artist) {
    return null;
  }

  return {
    albumArtUrl: buildArtworkUrl(attributes?.artwork),
    albumName: attributes?.albumName,
    artist,
    externalUrl: attributes?.url,
    handoffUri: attributes?.url,
    previewUrl: attributes?.previews?.find((preview) => preview.url)?.url,
    provider: "appleMusic",
    providerTrackId: `appleMusic:${storefront}:${resource.id}`,
    title,
  };
}

async function fetchAppleMusicSong(
  storefront: string,
  songId: string,
): Promise<ImportedTrack> {
  const response = await appleMusicFetch(
    `/v1/catalog/${storefront}/songs/${songId}`,
  );
  const payload = (await response
    .json()
    .catch(() => ({}))) as AppleMusicResponse;

  if (!response.ok) {
    throw new Error(getAppleMusicErrorMessage(payload));
  }

  const track = buildAppleMusicTrack(storefront, payload.data?.[0]);
  if (!track) {
    throw new Error("Apple Music returned incomplete song metadata.");
  }

  return track;
}

async function fetchAppleMusicRelationshipTracks(
  initialPath: string,
  storefront: string,
  limit = MAX_APPLE_MUSIC_TRACKS,
): Promise<ImportedTrack[]> {
  const tracks: ImportedTrack[] = [];
  const seen = new Set<string>();
  let nextPath: string | null = initialPath;

  while (nextPath && tracks.length < limit) {
    const response = await appleMusicFetch(nextPath);
    const payload = (await response
      .json()
      .catch(() => ({}))) as AppleMusicResponse;

    if (!response.ok) {
      throw new Error(getAppleMusicErrorMessage(payload));
    }

    for (const resource of payload.data ?? []) {
      const track = buildAppleMusicTrack(storefront, resource);
      if (!track || seen.has(track.providerTrackId)) {
        continue;
      }

      seen.add(track.providerTrackId);
      tracks.push(track);
      if (tracks.length >= limit) {
        break;
      }
    }

    nextPath = typeof payload.next === "string" ? payload.next : null;
  }

  if (tracks.length === 0) {
    throw new Error("Apple Music returned no playable tracks for that link.");
  }

  return tracks;
}

export async function resolveAppleMusicTrack(
  rawValue: string,
): Promise<ImportedTrack> {
  const parsed = parseAppleMusicUrl(rawValue);
  if (parsed?.kind !== "song") {
    throw new Error("Paste a valid Apple Music song link.");
  }

  return fetchAppleMusicSong(parsed.storefront, parsed.songId);
}

export async function resolveAppleMusicCandidate(
  rawValue: string,
): Promise<ImportedTrack[]> {
  const parsed = parseAppleMusicUrl(rawValue);
  if (!parsed) {
    throw new Error("Paste a valid Apple Music song, album, or playlist link.");
  }

  if (parsed.kind === "song") {
    return [await fetchAppleMusicSong(parsed.storefront, parsed.songId)];
  }

  if (parsed.kind === "album") {
    return fetchAppleMusicRelationshipTracks(
      `/v1/catalog/${parsed.storefront}/albums/${parsed.albumId}/tracks`,
      parsed.storefront,
    );
  }

  return fetchAppleMusicRelationshipTracks(
    `/v1/catalog/${parsed.storefront}/playlists/${parsed.playlistId}/tracks`,
    parsed.storefront,
  );
}
