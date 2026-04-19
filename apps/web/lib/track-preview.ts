import type { ImportedTrack } from "@burner/core";

import { buildYouTubeEmbedUrl, getYouTubeVideoId } from "./youtube";

export function buildInAppPreviewEmbedUrl(track: Pick<ImportedTrack, "externalUrl" | "handoffUri">) {
  const videoId = getYouTubeVideoId(track);
  return videoId ? buildYouTubeEmbedUrl(videoId, { autoplay: true }) : null;
}

export function supportsInAppPreview(track: Pick<ImportedTrack, "previewUrl" | "externalUrl" | "handoffUri">) {
  return Boolean(track.previewUrl || buildInAppPreviewEmbedUrl(track));
}
