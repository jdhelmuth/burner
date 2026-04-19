import { describe, expect, it } from "vitest";

import {
  clampCoverTransform,
  createInitialCoverTransform,
  getCoverArtRenderSize,
  updateCoverZoom,
} from "./cover-art";

describe("cover-art helpers", () => {
  it("centers a landscape image inside the square frame", () => {
    const transform = createInitialCoverTransform({ width: 1600, height: 900 }, 200);

    expect(transform.zoom).toBe(1);
    expect(transform.offsetX).toBeCloseTo(-77.78, 2);
    expect(transform.offsetY).toBeCloseTo(0, 5);
  });

  it("clamps offsets so the frame always stays covered", () => {
    const transform = clampCoverTransform(
      {
        zoom: 1,
        offsetX: 80,
        offsetY: -300,
      },
      { width: 1600, height: 900 },
      200,
    );

    expect(transform.offsetX).toBe(0);
    expect(transform.offsetY).toBeCloseTo(0, 5);
  });

  it("preserves the visual center when zoom changes", () => {
    const dimensions = { width: 1600, height: 900 };
    const initial = createInitialCoverTransform(dimensions, 200);
    const initialRenderSize = getCoverArtRenderSize(dimensions, 200, initial.zoom);
    const initialCenterX = initial.offsetX + initialRenderSize.width / 2;
    const initialCenterY = initial.offsetY + initialRenderSize.height / 2;

    const next = updateCoverZoom(initial, 2, dimensions, 200);
    const nextRenderSize = getCoverArtRenderSize(dimensions, 200, next.zoom);

    expect(next.offsetX + nextRenderSize.width / 2).toBeCloseTo(initialCenterX, 5);
    expect(next.offsetY + nextRenderSize.height / 2).toBeCloseTo(initialCenterY, 5);
  });
});
