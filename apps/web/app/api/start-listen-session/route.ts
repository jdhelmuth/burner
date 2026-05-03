import { NextResponse } from "next/server";
import { sha256 } from "../../../lib/server/crypto";
import { sql } from "../../../lib/server/db";
import { getRevealedTrack } from "../../../lib/server/burners";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      burnerId?: unknown;
      position?: unknown;
      provider?: unknown;
      sessionToken?: unknown;
    };
    const burnerId = typeof body.burnerId === "string" ? body.burnerId : "";
    const position = typeof body.position === "number" ? body.position : 0;
    const provider = typeof body.provider === "string" ? body.provider : "";
    const sessionToken = typeof body.sessionToken === "string" ? body.sessionToken : "";
    const sessionTokenHash = await sha256(sessionToken);
    const sessions = await sql`
      select id, current_position from burner_recipient_sessions
      where burner_id = ${burnerId} and session_token_hash = ${sessionTokenHash}
      limit 1
    `;
    const session = sessions[0] as { id: string; current_position: number } | undefined;
    if (!session) throw new Error("Recipient session not found");
    if (session.current_position !== position) {
      return NextResponse.json({
        status: "blocked",
        reason: "invalid-sequence",
        nextPosition: session.current_position,
      });
    }
    const rows = await sql`
      insert into listen_sessions (burner_id, recipient_session_id, position, provider)
      values (${burnerId}, ${session.id}, ${position}, ${provider})
      returning id, started_at
    `;
    return NextResponse.json({
      ...(rows[0] as { id: string; started_at: string | Date }),
      track: await getRevealedTrack(burnerId, position),
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
