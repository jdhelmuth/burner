import { describe, expect, it } from "vitest";

import {
  extractAppleMusicImportCandidates,
  parseAppleMusicSongUrl,
} from "./apple-music";

describe("parseAppleMusicSongUrl", () => {
  it("extracts the song id from album links with an i query parameter", () => {
    expect(
      parseAppleMusicSongUrl(
        "https://music.apple.com/us/album/some-album/1440818588?i=1440818660",
      ),
    ).toEqual({ storefront: "us", songId: "1440818660" });
  });

  it("extracts the song id from direct song links", () => {
    expect(
      parseAppleMusicSongUrl(
        "https://music.apple.com/gb/song/example/1234567890",
      ),
    ).toEqual({ storefront: "gb", songId: "1234567890" });
  });

  it("rejects non-Apple Music links", () => {
    expect(parseAppleMusicSongUrl("https://example.com/song/123")).toBeNull();
  });
});

describe("extractAppleMusicImportCandidates", () => {
  it("keeps unique Apple Music song links from multiline text", () => {
    const first =
      "https://music.apple.com/us/album/example/1440818588?i=1440818660";
    const second = "https://music.apple.com/us/song/example/1234567890";

    expect(
      extractAppleMusicImportCandidates(
        `${first}\n${second}\n${first}\nnot a link`,
      ),
    ).toEqual([first, second]);
  });
});
