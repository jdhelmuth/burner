import { NextResponse } from "next/server";

import { createRateLimiter, readClientKey } from "../../../lib/rate-limit";
import { sql } from "../../../lib/server/db";

export const dynamic = "force-dynamic";

type BrowserBurnEventSource = "anonymous-browser" | "local-fallback";

const VALID_SOURCES = new Set<BrowserBurnEventSource>([
  "anonymous-browser",
  "local-fallback",
]);

const consumeToken = createRateLimiter({
  capacity: 10,
  refillPerSecond: 10 / 60,
});

export async function POST(request: Request) {
  const clientKey = readClientKey(request);
  if (!consumeToken(clientKey)) {
    return NextResponse.json(
      { error: "Too many burns counted from this connection. Try again soon." },
      { status: 429, headers: { "Retry-After": "30" } },
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      source?: unknown;
      trackCount?: unknown;
      hasCover?: unknown;
    };

    const source =
      typeof body.source === "string" &&
      VALID_SOURCES.has(body.source as BrowserBurnEventSource)
        ? (body.source as BrowserBurnEventSource)
        : null;
    const trackCount =
      typeof body.trackCount === "number" && Number.isInteger(body.trackCount)
        ? body.trackCount
        : null;

    if (!source) {
      return NextResponse.json({ error: "source is required" }, { status: 400 });
    }

    if (!trackCount || trackCount < 1 || trackCount > 30) {
      return NextResponse.json(
        { error: "trackCount must be between 1 and 30" },
        { status: 400 },
      );
    }

    const hasCover = body.hasCover === true;

    await sql`
      insert into browser_burn_events (source, track_count, has_cover)
      values (${source}, ${trackCount}, ${hasCover})
    `;

    return NextResponse.json({ counted: true });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Burn count could not be recorded." },
      { status: 500 },
    );
  }
}
