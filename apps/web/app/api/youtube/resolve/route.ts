import { NextResponse } from "next/server";

import type { ImportedTrack } from "@burner/core";

import { createRateLimiter, readClientKey } from "../../../../lib/rate-limit";
import { resolveYouTubeTrack } from "../../../../lib/server/youtube";

export const dynamic = "force-dynamic";

interface YouTubeResolvePayload {
  track?: ImportedTrack;
  tracks?: ImportedTrack[];
  error?: string;
}

const MAX_URLS_PER_REQUEST = 12;

const consumeToken = createRateLimiter({
  capacity: 20,
  refillPerSecond: 20 / 60, // ~20 requests / minute steady state
});

export async function POST(request: Request) {
  const clientKey = readClientKey(request);
  if (!consumeToken(clientKey)) {
    return NextResponse.json(
      { error: "Too many requests. Slow down and try again." },
      { status: 429, headers: { "Retry-After": "30" } },
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      url?: string;
      urls?: string[];
    };
    const rawUrls = Array.isArray(body.urls)
      ? body.urls
      : body.url
        ? [body.url]
        : [];
    const candidates = rawUrls
      .filter((value): value is string => typeof value === "string")
      .map((url) => url.trim())
      .filter(Boolean);

    if (candidates.length === 0) {
      throw new Error("Paste at least one valid YouTube song link.");
    }

    if (candidates.length > MAX_URLS_PER_REQUEST) {
      throw new Error(
        `Resolve up to ${MAX_URLS_PER_REQUEST} links at a time.`,
      );
    }

    const tracks = await Promise.all(
      candidates.map((candidate) => resolveYouTubeTrack(candidate)),
    );
    if (tracks.length === 1) {
      return NextResponse.json({
        track: tracks[0],
        tracks,
      } satisfies YouTubeResolvePayload);
    }

    return NextResponse.json({
      tracks,
    } satisfies YouTubeResolvePayload);
  } catch (error) {
    return NextResponse.json(
      {
        error: (error as Error).message,
      } satisfies YouTubeResolvePayload,
      {
        status: 400,
      },
    );
  }
}
