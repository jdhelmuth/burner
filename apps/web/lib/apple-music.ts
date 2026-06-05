import type { ImportedTrack } from "@burner/core";

export type AppleMusicSongLocation = {
  storefront: string;
  songId: string;
};

const APPLE_MUSIC_HOSTS = new Set(["music.apple.com", "geo.music.apple.com"]);

function normalizeSongId(value: string | null | undefined) {
  const candidate = value?.trim();
  return candidate && /^\d+$/.test(candidate) ? candidate : null;
}

export function parseAppleMusicSongUrl(
  rawValue: string,
): AppleMusicSongLocation | null {
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
  const songId =
    normalizeSongId(url.searchParams.get("i")) ??
    normalizeSongId(segments.at(-1));

  if (!songId) {
    return null;
  }

  return { storefront, songId };
}

export function extractAppleMusicImportCandidates(rawValue: string) {
  const candidates = rawValue
    .split(/[\n,]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
  const seen = new Set<string>();

  return candidates.filter((candidate) => {
    if (!parseAppleMusicSongUrl(candidate) || seen.has(candidate)) {
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
