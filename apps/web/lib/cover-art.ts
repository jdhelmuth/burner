export const COVER_EDITOR_FRAME_SIZE = 360;
export const COVER_EXPORT_SIZE = 840;
export const COVER_MIN_ZOOM = 1;
export const COVER_MAX_ZOOM = 3;

export interface CoverArtDimensions {
  width: number;
  height: number;
}

export interface CoverArtTransform {
  zoom: number;
  offsetX: number;
  offsetY: number;
}

export function clampCoverZoom(zoom: number) {
  return Math.min(COVER_MAX_ZOOM, Math.max(COVER_MIN_ZOOM, zoom));
}

export function getCoverArtRenderSize(
  dimensions: CoverArtDimensions,
  frameSize = COVER_EDITOR_FRAME_SIZE,
  zoom = COVER_MIN_ZOOM,
) {
  const baseScale = Math.max(frameSize / dimensions.width, frameSize / dimensions.height);
  const clampedZoom = clampCoverZoom(zoom);

  return {
    width: dimensions.width * baseScale * clampedZoom,
    height: dimensions.height * baseScale * clampedZoom,
  };
}

export function clampCoverTransform(
  transform: CoverArtTransform,
  dimensions: CoverArtDimensions,
  frameSize = COVER_EDITOR_FRAME_SIZE,
) {
  const renderSize = getCoverArtRenderSize(dimensions, frameSize, transform.zoom);
  const minX = Math.min(0, frameSize - renderSize.width);
  const minY = Math.min(0, frameSize - renderSize.height);

  return {
    zoom: clampCoverZoom(transform.zoom),
    offsetX: Math.min(0, Math.max(minX, transform.offsetX)),
    offsetY: Math.min(0, Math.max(minY, transform.offsetY)),
  };
}

export function createInitialCoverTransform(dimensions: CoverArtDimensions, frameSize = COVER_EDITOR_FRAME_SIZE) {
  const renderSize = getCoverArtRenderSize(dimensions, frameSize, COVER_MIN_ZOOM);

  return clampCoverTransform(
    {
      zoom: COVER_MIN_ZOOM,
      offsetX: (frameSize - renderSize.width) / 2,
      offsetY: (frameSize - renderSize.height) / 2,
    },
    dimensions,
    frameSize,
  );
}

export function updateCoverZoom(
  transform: CoverArtTransform,
  nextZoom: number,
  dimensions: CoverArtDimensions,
  frameSize = COVER_EDITOR_FRAME_SIZE,
) {
  const currentRenderSize = getCoverArtRenderSize(dimensions, frameSize, transform.zoom);
  const nextRenderSize = getCoverArtRenderSize(dimensions, frameSize, nextZoom);
  const focusX = transform.offsetX + currentRenderSize.width / 2;
  const focusY = transform.offsetY + currentRenderSize.height / 2;

  return clampCoverTransform(
    {
      zoom: nextZoom,
      offsetX: focusX - nextRenderSize.width / 2,
      offsetY: focusY - nextRenderSize.height / 2,
    },
    dimensions,
    frameSize,
  );
}
