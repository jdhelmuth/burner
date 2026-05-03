import type { ImportedTrack } from "@burner/core";
import { NextResponse } from "next/server";
import { decryptJson } from "../../../lib/server/crypto";
import { requireCurrentUser } from "../../../lib/server/auth";
import { sql } from "../../../lib/server/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const body = (await request.json().catch(() => ({}))) as { burnerId?: unknown };
    const burnerId = typeof body.burnerId === "string" ? body.burnerId.trim() : "";
    if (!burnerId) {
      return NextResponse.json({ error: "burnerId is required" }, { status: 400 });
    }
    const burnerRows = await sql`
      select id, title, sender_name, note, cover_image_url, reveal_mode
      from burners
      where id = ${burnerId} and sender_id = ${user.id}
      limit 1
    `;
    const burner = burnerRows[0] as
      | {
          title: string;
          sender_name: string;
          note: string | null;
          cover_image_url: string | null;
          reveal_mode: "timed" | "verified-or-timed";
        }
      | undefined;
    if (!burner) {
      return NextResponse.json({ error: "Burner not found" }, { status: 404 });
    }
    const trackRows = await sql`
      select position, encrypted_payload
      from burner_tracks
      where burner_id = ${burnerId}
      order by position asc
    `;
    const tracks: ImportedTrack[] = [];
    for (const row of trackRows as { encrypted_payload: string }[]) {
      const payload = await decryptJson<{ position: number; track: ImportedTrack }>(
        row.encrypted_payload,
      );
      tracks.push(payload.track);
    }
    return NextResponse.json({
      title: burner.title,
      senderName: burner.sender_name,
      note: burner.note ?? undefined,
      coverImageUrl: burner.cover_image_url ?? undefined,
      revealMode: burner.reveal_mode,
      tracks,
    });
  } catch (error) {
    const status = (error as Error).message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: (error as Error).message }, { status });
  }
}
