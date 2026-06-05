import type { ImportedTrack } from "@burner/core";

export type AppleMusicSongLocation = {
  storefront: string;
  songId: string;
};

export type AppleMusicLocation =
  | { kind: "song"; storefront: string; songId: string }
  | { kind: "album"; storefront: string; albumId: string }
  | { kind: "playlist"; storefront: string; playlistId: string };

const APPLE_MUSIC_HOSTS = new Set(["music.apple.com", "geo.music.apple.com"]);

function normalizeNumericId(value: string | null | undefined) {
  const candidate = value?.trim();
  return candidate && /^\d+$/.test(candidate) ? candidate : null;
}

function normalizePlaylistId(value: string | null | undefined) {
  const candidate = value?.trim();
  return candidate && /^pl\.[A-Za-z0-9_-]+$/.test(candidate) ? candidate : null;
}

export function parseAppleMusicUrl(rawValue: string): AppleMusicLocation | null {
  const trimmed = rawValue.trim();
  if (!trimmed) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  if (!APPLE_MUSIC_HOSTS.has(url.hostname.toLowerCase())) {
    return null;
  }

  const segments = url.pathname.split("/").filter(Boolean);
  const storefront = segments[0]?.toLowerCase() || "us";
  const type = segments[1]?.toLowerCase();
  const lastSegment = segments.at(-1);

  if (type === "playlist") {
    const playlistId = normalizePlaylistId(lastSegment);
    return playlistId ? { kind: "playlist", storefront, playlistId } : null;
  }

  if (type === "album") {
    // Album links carry the song id in the `i` query param when they point at
    // a single track; otherwise the trailing segment is the album id.
    const songId = normalizeNumericId(url.searchParams.get("i"));
    if (songId) {
      return { kind: "song", storefront, songId };
    }

    const albumId = normalizeNumericId(lastSegment);
    return albumId ? { kind: "album", storefront, albumId } : null;
  }

  const songId =
    normalizeNumericId(url.searchParams.get("i")) ??
    normalizeNumericId(lastSegment);

  return songId ? { kind: "song", storefront, songId } : null;
}

export function parseAppleMusicSongUrl(
  rawValue: string,
): AppleMusicSongLocation | null {
  const parsed = parseAppleMusicUrl(rawValue);
  return parsed?.kind === "song"
    ? { storefront: parsed.storefront, songId: parsed.songId }
    : null;
}

export function extractAppleMusicImportCandidates(rawValue: string) {
  const candidates = rawValue
    .split(/[\n,]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
  const seen = new Set<string>();

  return candidates.filter((candidate) => {
    if (!parseAppleMusicUrl(candidate) || seen.has(candidate)) {
      return false;
    }

    seen.add(candidate);
    return true;
  });
}

export function getAppleMusicTrackKey(
  track: Pick<ImportedTrack, "provider" | "providerTrackId">,
) {
  return `${track.provider}:${track.providerTrackId}`;
}
