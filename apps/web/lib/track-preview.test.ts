import { describe, expect, it } from "vitest";

import { buildInAppPreviewEmbedUrl, supportsInAppPreview } from "./track-preview";

describe("buildInAppPreviewEmbedUrl", () => {
  it("builds a YouTube embed URL from a watch page", () => {
    expect(
      buildInAppPreviewEmbedUrl({
        externalUrl: "https://music.youtube.com/watch?v=dQw4w9WgXcQ",
      }),
    ).toBe("https://www.youtube.com/embed/dQw4w9WgXcQ?playsinline=1&rel=0&autoplay=1");
  });

  it("returns null for unsupported providers", () => {
    expect(
      buildInAppPreviewEmbedUrl({
        externalUrl: "https://example.com/songs/previewless-track",
      }),
    ).toBeNull();
  });

  it("rejects fake YouTube ids", () => {
    expect(
      buildInAppPreviewEmbedUrl({
        externalUrl: "https://music.youtube.com/watch?v=mall-food-court-echo",
      }),
    ).toBeNull();
  });
});

describe("supportsInAppPreview", () => {
  it("accepts direct audio previews", () => {
    expect(
      supportsInAppPreview({
        previewUrl: "https://audio.example.com/preview.mp3",
      }),
    ).toBe(true);
  });

  it("accepts provider links that can be embedded", () => {
    expect(
      supportsInAppPreview({
        externalUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      }),
    ).toBe(true);
  });

  it("rejects tracks with no in-app preview source", () => {
    expect(
      supportsInAppPreview({
        externalUrl: "https://example.com/no-embed-here",
      }),
    ).toBe(false);
  });
});
