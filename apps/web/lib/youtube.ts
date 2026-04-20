import type { ImportedTrack } from "@burner/core";

const YOUTUBE_VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_PLAYLIST_ID = /^[A-Za-z0-9_-]{13,42}$/;
const YOUTUBE_TITLE_SPLIT = /\s[-–—:|]\s/;
const DISPOSABLE_YOUTUBE_TITLE_MARKERS = [
  "official music video",
  "official video",
  "music video",
  "official lyric video",
  "lyric video",
  "lyrics video",
  "official audio",
  "audio",
  "official visualizer",
  "visualizer",
  "official studio video",
  "studio video",
  "official animated video",
  "animated video",
  "4k remaster",
  "remaster",
  "remastered",
] as const;

function normalizeYouTubeVideoId(candidate: string | null | undefined) {
  const trimmed = candidate?.trim();
  if (!trimmed || !YOUTUBE_VIDEO_ID.test(trimmed)) {
    return null;
  }

  return trimmed;
}

export function parseYouTubePlaylistId(rawValue: string) {
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

  const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  if (!["youtube.com", "music.youtube.com", "m.youtube.com", "youtu.be"].includes(hostname)) {
    return null;
  }

  const listParam = url.searchParams.get("list");
  if (!listParam) {
    return null;
  }

  const normalized = listParam.trim();
  if (!YOUTUBE_PLAYLIST_ID.test(normalized)) {
    return null;
  }

  return normalized;
}

export function parseYouTubeVideoId(rawValue: string) {
  const trimmed = rawValue.trim();
  if (!trimmed) {
    return null;
  }

  const directId = normalizeYouTubeVideoId(trimmed);
  if (directId) {
    return directId;
  }

  let url: URL;

  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  if (hostname === "youtu.be") {
    return normalizeYouTubeVideoId(url.pathname.slice(1));
  }

  if (!["youtube.com", "music.youtube.com", "m.youtube.com"].includes(hostname)) {
    return null;
  }

  if (url.pathname === "/watch") {
    return normalizeYouTubeVideoId(url.searchParams.get("v"));
  }

  if (url.pathname.startsWith("/embed/") || url.pathname.startsWith("/shorts/") || url.pathname.startsWith("/live/")) {
    return normalizeYouTubeVideoId(url.pathname.split("/")[2] ?? null);
  }

  return null;
}

function normalizeComparableYouTubeText(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "");
}

function humanizeYouTubeChannelName(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
}

export function cleanYouTubeAuthorName(rawValue: string | null | undefined) {
  const trimmed = rawValue?.trim();
  if (!trimmed) {
    return "";
  }

  const cleaned = humanizeYouTubeChannelName(
    trimmed
      .replace(/\s*-\s*topic$/i, "")
      .replace(/\s*vevo$/i, "")
      .replace(/\s*official(?:\s+artist\s+channel)?$/i, "")
      .trim(),
  );

  return cleaned || trimmed;
}

function isDisposableYouTubeTitleDecoration(rawValue: string) {
  const normalized = rawValue
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  if (!normalized) {
    return false;
  }

  if (
    DISPOSABLE_YOUTUBE_TITLE_MARKERS.some(
      (marker) =>
        normalized === marker ||
        normalized.startsWith(`${marker} `) ||
        normalized.endsWith(` ${marker}`),
    )
  ) {
    return true;
  }

  if (
    /^official\b/.test(normalized) &&
    /\b(video|audio|visualizer|lyric|lyrics|studio|animated|remaster)\b/.test(
      normalized,
    )
  ) {
    return true;
  }

  return /\b\d+k\b/.test(normalized) && /\b(video|remaster|remastered)\b/.test(normalized);
}

function trimTrailingYouTubeBracketGroups(rawValue: string) {
  const trailingGroups = rawValue.match(
    /(?:\s*(?:\([^()]*\)|\[[^[\]]*\]))+\s*$/,
  );

  if (!trailingGroups) {
    return rawValue;
  }

  const groupMatches = Array.from(
    trailingGroups[0].matchAll(/\(([^()]*)\)|\[([^[\]]*)\]/g),
  );
  const keptGroups = groupMatches
    .filter((group) => {
      const content = (group[1] ?? group[2] ?? "").trim();
      return !isDisposableYouTubeTitleDecoration(content);
    })
    .map((group) => group[0]);

  if (keptGroups.length === groupMatches.length) {
    return rawValue;
  }

  const base = rawValue
    .slice(0, rawValue.length - trailingGroups[0].length)
    .replace(/\s*[-–—:|]\s*$/, "")
    .trimEnd();

  return keptGroups.length > 0 ? `${base} ${keptGroups.join(" ")}`.trim() : base.trim();
}

function trimTrailingYouTubeTitleDecorations(rawValue: string) {
  let cleaned = rawValue.trim().replace(/\s+/g, " ");
  let updated = true;

  while (updated && cleaned) {
    updated = false;

    const cleanedGroups = trimTrailingYouTubeBracketGroups(cleaned);
    if (cleanedGroups !== cleaned) {
      cleaned = cleanedGroups.trim();
      updated = true;
      continue;
    }

    const bareSuffix = cleaned.match(/\s*[-–—:|]\s*([^()[\]]+)\s*$/);
    const bareContent = bareSuffix?.[1]?.trim() ?? "";

    if (bareSuffix && isDisposableYouTubeTitleDecoration(bareContent)) {
      cleaned = cleaned.slice(0, cleaned.length - bareSuffix[0].length).trim();
      updated = true;
    }
  }

  return cleaned;
}

function trimWrappedQuotes(rawValue: string) {
  return rawValue.replace(/^["'“”‘’]+/, "").replace(/["'“”‘’]+$/, "").trim();
}

export function deriveYouTubeTrackIdentity(input: {
  authorName?: string | null;
  title?: string | null;
}) {
  const cleanedAuthor = cleanYouTubeAuthorName(input.authorName);
  const cleanedTitle = trimTrailingYouTubeTitleDecorations(
    input.title?.trim() ?? "",
  );

  const splitMatch = cleanedTitle.match(YOUTUBE_TITLE_SPLIT);
  if (splitMatch) {
    const separatorIndex = splitMatch.index ?? -1;
    const separatorLength = splitMatch[0].length;

    if (separatorIndex >= 0) {
      const candidateArtist = cleanedTitle.slice(0, separatorIndex).trim();
      const candidateTitle = trimWrappedQuotes(
        trimTrailingYouTubeTitleDecorations(
          cleanedTitle.slice(separatorIndex + separatorLength),
        ),
      );
      const normalizedCandidateArtist = normalizeComparableYouTubeText(
        cleanYouTubeAuthorName(candidateArtist),
      );
      const normalizedAuthor = normalizeComparableYouTubeText(cleanedAuthor);
      const authorMatchesCandidate =
        normalizedAuthor.length > 0 &&
        (normalizedAuthor === normalizedCandidateArtist ||
          normalizedAuthor.includes(normalizedCandidateArtist) ||
          normalizedCandidateArtist.includes(normalizedAuthor));

      if (candidateArtist && candidateTitle && authorMatchesCandidate) {
        return {
          artist: candidateArtist,
          title: candidateTitle,
        };
      }
    }
  }

  return {
    artist: cleanedAuthor,
    title: trimWrappedQuotes(cleanedTitle),
  };
}

export function normalizeYouTubeTrackMetadata<
  T extends {
    albumName?: string;
    artist: string;
    provider: ImportedTrack["provider"];
    title: string;
  },
>(track: T) {
  if (track.provider !== "youtubeMusic") {
    return track;
  }

  const normalizedIdentity = deriveYouTubeTrackIdentity({
    authorName: track.artist,
    title: track.title,
  });

  return {
    ...track,
    albumName:
      track.albumName?.trim().toLowerCase() === "youtube"
        ? undefined
        : track.albumName,
    artist: normalizedIdentity.artist || track.artist,
    title: normalizedIdentity.title || track.title,
  };
}

export function getYouTubeVideoId(track: Pick<ImportedTrack, "externalUrl" | "handoffUri">) {
  return parseYouTubeVideoId(track.externalUrl ?? track.handoffUri ?? "");
}

export function buildYouTubeWatchUrl(videoId: string) {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
}

export function buildYouTubeThumbnailUrl(videoId: string) {
  return `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`;
}

export function extractYouTubeImportCandidates(rawValue: string) {
  const seenVideoIds = new Set<string>();
  const seenPlaylistIds = new Set<string>();

  return rawValue
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      const tokens = line.match(/https?:\/\/[^\s]+|youtu\.be\/[^\s]+|youtube\.com\/[^\s]+|[A-Za-z0-9_-]{11}/g);
      return tokens ?? [];
    })
    .filter((candidate) => {
      const playlistId = parseYouTubePlaylistId(candidate);
      if (playlistId) {
        if (seenPlaylistIds.has(playlistId)) return false;
        seenPlaylistIds.add(playlistId);
        return true;
      }

      const videoId = parseYouTubeVideoId(candidate);
      if (!videoId || seenVideoIds.has(videoId)) {
        return false;
      }

      seenVideoIds.add(videoId);
      return true;
    });
}

export function buildYouTubeEmbedUrl(
  videoId: string,
  options?: {
    autoplay?: boolean;
    enableJsApi?: boolean;
    origin?: string;
  },
) {
  const normalizedVideoId = normalizeYouTubeVideoId(videoId);
  if (!normalizedVideoId) {
    return null;
  }

  const url = new URL(`https://www.youtube.com/embed/${encodeURIComponent(normalizedVideoId)}`);
  url.searchParams.set("playsinline", "1");
  url.searchParams.set("rel", "0");

  if (options?.autoplay) {
    url.searchParams.set("autoplay", "1");
  }

  if (options?.enableJsApi) {
    url.searchParams.set("enablejsapi", "1");
  }

  if (options?.origin) {
    url.searchParams.set("origin", options.origin);
  }

  return url.toString();
}
