import { describe, expect, it } from "vitest";

import {
  buildYouTubeEmbedUrl,
  buildYouTubeThumbnailUrl,
  buildYouTubeWatchUrl,
  cleanYouTubeAuthorName,
  deriveYouTubeTrackIdentity,
  extractYouTubeImportCandidates,
  getYouTubeVideoId,
  normalizeYouTubeTrackMetadata,
  parseYouTubeVideoId,
} from "./youtube";

describe("parseYouTubeVideoId", () => {
  it("extracts a video id from youtube watch links", () => {
    expect(parseYouTubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(parseYouTubeVideoId("https://music.youtube.com/watch?v=dQw4w9WgXcQ&si=test")).toBe("dQw4w9WgXcQ");
    expect(
      parseYouTubeVideoId(
        "https://www.youtube.com/watch?v=J6YlaeACE4E&pp=ygUKbHVrZSBjb21icw%3D%3D",
      ),
    ).toBe("J6YlaeACE4E");
  });

  it("extracts a video id from short links and embed links", () => {
    expect(parseYouTubeVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(parseYouTubeVideoId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(parseYouTubeVideoId("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("rejects non-youtube values", () => {
    expect(parseYouTubeVideoId("https://example.com/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(parseYouTubeVideoId("https://www.youtube.com/watch?v=not-real")).toBeNull();
  });
});

describe("youtube helpers", () => {
  it("builds canonical watch and thumbnail urls", () => {
    expect(buildYouTubeWatchUrl("dQw4w9WgXcQ")).toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(buildYouTubeThumbnailUrl("dQw4w9WgXcQ")).toBe("https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg");
  });

  it("builds an embed url with the expected player params", () => {
    expect(
      buildYouTubeEmbedUrl("dQw4w9WgXcQ", {
        autoplay: true,
        enableJsApi: true,
        origin: "http://localhost:3000",
      }),
    ).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ?playsinline=1&rel=0&autoplay=1&enablejsapi=1&origin=http%3A%2F%2Flocalhost%3A3000",
    );
  });

  it("extracts a video id from an imported track", () => {
    expect(
      getYouTubeVideoId({
        externalUrl: "https://youtu.be/dQw4w9WgXcQ",
      }),
    ).toBe("dQw4w9WgXcQ");
  });

  it("extracts unique import candidates from multiline input", () => {
    expect(
      extractYouTubeImportCandidates(`
        https://youtu.be/dQw4w9WgXcQ
        https://www.youtube.com/watch?v=3JWTaaS7LdU
        dQw4w9WgXcQ
      `),
    ).toEqual(["https://youtu.be/dQw4w9WgXcQ", "https://www.youtube.com/watch?v=3JWTaaS7LdU"]);
  });

  it("cleans common youtube channel suffixes", () => {
    expect(cleanYouTubeAuthorName("LukeCombsVEVO")).toBe("Luke Combs");
    expect(cleanYouTubeAuthorName("Cody Johnson - Topic")).toBe("Cody Johnson");
  });

  it("derives artist and title from artist-prefixed video names", () => {
    expect(
      deriveYouTubeTrackIdentity({
        authorName: "Cody Johnson",
        title: "Cody Johnson - The Fall (Official Music Video)",
      }),
    ).toEqual({
      artist: "Cody Johnson",
      title: "The Fall",
    });

    expect(
      deriveYouTubeTrackIdentity({
        authorName: "LukeCombsVEVO",
        title: "Luke Combs - Seeing Someone (Official Studio Video)",
      }),
    ).toEqual({
      artist: "Luke Combs",
      title: "Seeing Someone",
    });
  });

  it("falls back to a cleaned channel name when the title is only the song", () => {
    expect(
      deriveYouTubeTrackIdentity({
        authorName: "CodyJohnsonVEVO",
        title: "The Fall (Official Music Video)",
      }),
    ).toEqual({
      artist: "Cody Johnson",
      title: "The Fall",
    });
  });

  it("drops stacked video decorations from the end of the title", () => {
    expect(
      deriveYouTubeTrackIdentity({
        authorName: "RickAstleyVEVO",
        title: "Never Gonna Give You Up (Official Video) (4K Remaster)",
      }),
    ).toEqual({
      artist: "Rick Astley",
      title: "Never Gonna Give You Up",
    });

    expect(
      deriveYouTubeTrackIdentity({
        authorName: "Whitney Houston",
        title: "I Will Always Love You (Official 4K Video)",
      }),
    ).toEqual({
      artist: "Whitney Houston",
      title: "I Will Always Love You",
    });
  });

  it("normalizes saved youtube tracks without keeping the generic album label", () => {
    expect(
      normalizeYouTubeTrackMetadata({
        albumName: "YouTube",
        artist: "LukeCombsVEVO",
        provider: "youtubeMusic" as const,
        title: "Luke Combs - Seeing Someone (Official Studio Video)",
      }),
    ).toEqual({
      albumName: undefined,
      artist: "Luke Combs",
      provider: "youtubeMusic",
      title: "Seeing Someone",
    });
  });
});
