import "server-only";

import { createSign } from "node:crypto";
import { readFile } from "node:fs/promises";

import type { ImportedTrack } from "@burner/core";

import { parseAppleMusicSongUrl } from "../apple-music";

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

type AppleMusicSongResource = {
  attributes?: AppleMusicSongAttributes;
  id?: string;
};

type AppleMusicSongResponse = {
  data?: AppleMusicSongResource[];
  errors?: Array<{ detail?: string; title?: string }>;
};

const APPLE_MUSIC_API_ORIGIN = "https://api.music.apple.com";
const TOKEN_MAX_AGE_SECONDS = 15_777_000 - 300;

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

function buildArtworkUrl(artwork: AppleMusicArtwork | undefined) {
  const url = artwork?.url;
  if (!url) {
    return undefined;
  }

  return url.replace("{w}x{h}", "1200x1200").replace("{f}", "jpg");
}

function getAppleMusicErrorMessage(payload: AppleMusicSongResponse) {
  const error = payload.errors?.[0];
  return (
    error?.detail ?? error?.title ?? "Apple Music could not resolve that song."
  );
}

export async function resolveAppleMusicTrack(
  rawValue: string,
): Promise<ImportedTrack> {
  const parsed = parseAppleMusicSongUrl(rawValue);
  if (!parsed) {
    throw new Error("Paste a valid Apple Music song link.");
  }

  const response = await fetch(
    `${APPLE_MUSIC_API_ORIGIN}/v1/catalog/${parsed.storefront}/songs/${parsed.songId}`,
    {
      headers: {
        Authorization: `Bearer ${await getAppleMusicDeveloperToken()}`,
      },
    },
  );
  const payload = (await response
    .json()
    .catch(() => ({}))) as AppleMusicSongResponse;

  if (!response.ok) {
    throw new Error(getAppleMusicErrorMessage(payload));
  }

  const song = payload.data?.[0];
  const attributes = song?.attributes;
  const title = attributes?.name?.trim();
  const artist = attributes?.artistName?.trim();

  if (!song?.id || !title || !artist) {
    throw new Error("Apple Music returned incomplete song metadata.");
  }

  return {
    albumArtUrl: buildArtworkUrl(attributes?.artwork),
    albumName: attributes?.albumName,
    artist,
    externalUrl: attributes?.url,
    handoffUri: attributes?.url,
    previewUrl: attributes?.previews?.find((preview) => preview.url)?.url,
    provider: "appleMusic",
    providerTrackId: `appleMusic:${parsed.storefront}:${song.id}`,
    title,
  };
}
