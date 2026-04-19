import { describe, expect, it } from "vitest";

import { buildBrowserApiUrl } from "./browser-origin";

describe("buildBrowserApiUrl", () => {
  it("builds an absolute localhost api url when the browser origin is numeric localhost", () => {
    expect(
      buildBrowserApiUrl("/api/youtube/resolve", "http://127.0.0.1:3000"),
    ).toBe("http://localhost:3000/api/youtube/resolve");
  });

  it("falls back to the provided path when the origin is not usable", () => {
    expect(buildBrowserApiUrl("/api/youtube/resolve", "null")).toBe(
      "/api/youtube/resolve",
    );
  });
});
