import "server-only";

import type { ImportedTrack } from "@burner/core";

import {
  buildYouTubeThumbnailUrl,
  buildYouTubeWatchUrl,
  deriveYouTubeTrackIdentity,
  parseYouTubeVideoId,
} from "../youtube";

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
