import { NextResponse } from "next/server";

import type { ImportedTrack } from "@burner/core";

import { extractAppleMusicImportCandidates } from "../../../../lib/apple-music";
import { createRateLimiter, readClientKey } from "../../../../lib/rate-limit";
import { resolveAppleMusicTrack } from "../../../../lib/server/apple-music";

export const dynamic = "force-dynamic";

interface AppleMusicResolvePayload {
  track?: ImportedTrack;
  tracks?: ImportedTrack[];
  error?: string;
}

const MAX_URLS_PER_REQUEST = 12;

const consumeToken = createRateLimiter({
  capacity: 20,
  refillPerSecond: 20 / 60,
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
    const rawText = Array.isArray(body.urls)
      ? body.urls.join("\n")
      : body.url
        ? body.url
        : "";
    const candidates = extractAppleMusicImportCandidates(rawText);

    if (candidates.length === 0) {
      throw new Error("Paste at least one valid Apple Music song link.");
    }

    if (candidates.length > MAX_URLS_PER_REQUEST) {
      throw new Error(
        `Resolve up to ${MAX_URLS_PER_REQUEST} Apple Music links at a time.`,
      );
    }

    const tracks = await Promise.all(
      candidates.map((candidate) => resolveAppleMusicTrack(candidate)),
    );
    if (tracks.length === 1) {
      return NextResponse.json({
        track: tracks[0],
        tracks,
      } satisfies AppleMusicResolvePayload);
    }

    return NextResponse.json({ tracks } satisfies AppleMusicResolvePayload);
  } catch (error) {
    return NextResponse.json(
      {
        error: (error as Error).message,
      } satisfies AppleMusicResolvePayload,
      { status: 400 },
    );
  }
}
