import { NextResponse } from "next/server";
import { getRevealedTrack } from "../../../lib/server/burners";
import { sha256 } from "../../../lib/server/crypto";
import { sql } from "../../../lib/server/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      burnerId?: unknown;
      elapsedSeconds?: unknown;
      observedCompletion?: unknown;
      position?: unknown;
      sessionToken?: unknown;
    };
    const burnerId = typeof body.burnerId === "string" ? body.burnerId : "";
    const position = typeof body.position === "number" ? body.position : 0;
    const elapsedSeconds = typeof body.elapsedSeconds === "number" ? body.elapsedSeconds : 0;
    const observedCompletion = Boolean(body.observedCompletion);
    const sessionToken = typeof body.sessionToken === "string" ? body.sessionToken : "";
    const sessionTokenHash = await sha256(sessionToken);
    const sessions = await sql`
      select id, current_position, completed_positions from burner_recipient_sessions
      where burner_id = ${burnerId} and session_token_hash = ${sessionTokenHash}
      limit 1
    `;
    const recipientSession = sessions[0] as
      | { id: string; current_position: number; completed_positions: number[] }
      | undefined;
    if (!recipientSession) throw new Error("Recipient session not found");
    if (recipientSession.current_position !== position) {
      return NextResponse.json({
        status: "blocked",
        reason: "invalid-sequence",
        nextPosition: recipientSession.current_position,
      });
    }
    const burnerRows = await sql`select total_tracks from burners where id = ${burnerId} limit 1`;
    const burner = burnerRows[0] as { total_tracks: number } | undefined;
    if (!burner) throw new Error("Burner not found");
    await sql`
      update listen_sessions
      set elapsed_seconds = ${elapsedSeconds}, observed_completion = ${observedCompletion}, completed_at = ${new Date().toISOString()}
      where burner_id = ${burnerId}
        and recipient_session_id = ${recipientSession.id}
        and position = ${position}
        and completed_at is null
    `;
    const nextPosition = position + 1;
    const completedPositions = [...recipientSession.completed_positions, position];
    await sql`
      update burner_recipient_sessions
      set current_position = ${Math.min(nextPosition, burner.total_tracks)}, completed_positions = ${completedPositions}
      where id = ${recipientSession.id}
    `;
    const reason = observedCompletion ? "provider-playback-finished" : "playback-started";
    await sql`
      insert into track_unlock_events (burner_id, recipient_session_id, position, reason)
      values (${burnerId}, ${recipientSession.id}, ${position}, ${reason})
    `;
    if (nextPosition > burner.total_tracks) {
      return NextResponse.json({ status: "unlocked", reason, nextPosition: null });
    }
    return NextResponse.json({
      status: "unlocked",
      reason,
      nextPosition,
      nextTrack: await getRevealedTrack(burnerId, nextPosition),
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
