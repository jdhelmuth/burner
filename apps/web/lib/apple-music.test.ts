import { describe, expect, it } from "vitest";

import {
  extractAppleMusicImportCandidates,
  parseAppleMusicSongUrl,
  parseAppleMusicUrl,
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

  it("does not treat album or playlist links as songs", () => {
    expect(
      parseAppleMusicSongUrl(
        "https://music.apple.com/us/album/some-album/1440818588",
      ),
    ).toBeNull();
    expect(
      parseAppleMusicSongUrl(
        "https://music.apple.com/us/playlist/example/pl.u-abc123",
      ),
    ).toBeNull();
  });

  it("rejects non-Apple Music links", () => {
    expect(parseAppleMusicSongUrl("https://example.com/song/123")).toBeNull();
  });
});

describe("parseAppleMusicUrl", () => {
  it("classifies album links without an i parameter as albums", () => {
    expect(
      parseAppleMusicUrl(
        "https://music.apple.com/us/album/some-album/1440818588",
      ),
    ).toEqual({ kind: "album", storefront: "us", albumId: "1440818588" });
  });

  it("classifies album links with an i parameter as songs", () => {
    expect(
      parseAppleMusicUrl(
        "https://music.apple.com/us/album/some-album/1440818588?i=1440818660",
      ),
    ).toEqual({ kind: "song", storefront: "us", songId: "1440818660" });
  });

  it("classifies playlist links by their pl. identifier", () => {
    expect(
      parseAppleMusicUrl(
        "https://music.apple.com/gb/playlist/chill-mix/pl.u-aZb0X2",
      ),
    ).toEqual({ kind: "playlist", storefront: "gb", playlistId: "pl.u-aZb0X2" });
  });

  it("rejects playlist links with a malformed identifier", () => {
    expect(
      parseAppleMusicUrl(
        "https://music.apple.com/us/playlist/example/not-a-playlist-id",
      ),
    ).toBeNull();
  });
});

describe("extractAppleMusicImportCandidates", () => {
  it("keeps unique Apple Music song, album, and playlist links", () => {
    const song =
      "https://music.apple.com/us/album/example/1440818588?i=1440818660";
    const album = "https://music.apple.com/us/album/example/1440818588";
    const playlist = "https://music.apple.com/us/playlist/example/pl.u-abc123";

    expect(
      extractAppleMusicImportCandidates(
        `${song}\n${album}\n${playlist}\n${song}\nnot a link`,
      ),
    ).toEqual([song, album, playlist]);
  });
});
