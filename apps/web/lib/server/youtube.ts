import "server-only";

import type { ImportedTrack } from "@burner/core";

import {
  buildYouTubeThumbnailUrl,
  buildYouTubeWatchUrl,
  deriveYouTubeTrackIdentity,
  parseYouTubeVideoId,
} from "../youtube";

const PLAYLIST_VIDEO_ID_PATTERN =
  /"playlistVideoRenderer":\{"videoId":"([A-Za-z0-9_-]{11})"/g;
const MAX_PLAYLIST_VIDEOS = 50;

export async function fetchYouTubePlaylistVideoIds(
  playlistId: string,
): Promise<string[]> {
  const response = await fetch(
    `https://www.youtube.com/playlist?list=${encodeURIComponent(playlistId)}&hl=en`,
    {
      cache: "no-store",
      headers: {
        "Accept-Language": "en-US,en;q=0.9",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      "Burner could not load that YouTube playlist. Make sure it is public.",
    );
  }

  const html = await response.text();
  const seen = new Set<string>();
  const videoIds: string[] = [];

  for (const match of html.matchAll(PLAYLIST_VIDEO_ID_PATTERN)) {
    const id = match[1];
    if (!id || seen.has(id)) {
      continue;
    }
    seen.add(id);
    videoIds.push(id);
    if (videoIds.length >= MAX_PLAYLIST_VIDEOS) {
      break;
    }
  }

  if (videoIds.length === 0) {
    throw new Error(
      "Burner could not find any videos on that playlist. Is it public and has it got videos?",
    );
  }

  return videoIds;
}

export async function resolveYouTubeTrack(rawValue: string) {
  const videoId = parseYouTubeVideoId(rawValue);

  if (!videoId) {
    throw new Error("Paste a valid YouTube song link.");
  }

  const watchUrl = buildYouTubeWatchUrl(videoId);
  const fallbackTrack: ImportedTrack = {
    provider: "youtubeMusic",
    providerTrackId: videoId,
    title: `YouTube track ${videoId}`,
    artist: "YouTube upload",
    albumArtUrl: buildYouTubeThumbnailUrl(videoId),
    externalUrl: watchUrl,
    handoffUri: watchUrl,
  };

  const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return fallbackTrack;
  }

  const payload = (await response.json()) as {
    title?: string;
    author_name?: string;
    thumbnail_url?: string;
  };
  const resolvedIdentity = deriveYouTubeTrackIdentity({
    authorName: payload.author_name,
    title: payload.title,
  });

  return {
    ...fallbackTrack,
    title: resolvedIdentity.title || fallbackTrack.title,
    artist: resolvedIdentity.artist || fallbackTrack.artist,
    albumArtUrl: payload.thumbnail_url?.trim() || fallbackTrack.albumArtUrl,
  } satisfies ImportedTrack;
}
