import { NextResponse } from "next/server";
import { requireCurrentUser } from "../../../lib/server/auth";
import { sql } from "../../../lib/server/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const burners = await sql`
      select id, slug, title, sender_name, cover_image_url, total_tracks, is_revoked, created_at
      from burners
      where sender_id = ${user.id}
      order by created_at desc
    `;
    const burnerIds = burners.map((row) => (row as { id: string }).id);
    const shareLinks =
      burnerIds.length > 0
        ? await sql`
            select burner_id, created_at, short_code, slug
            from burner_share_links
            where burner_id = any(${burnerIds})
            order by created_at asc
          `
        : [];
    return NextResponse.json({ burners, shareLinks });
  } catch (error) {
    const status = (error as Error).message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: (error as Error).message }, { status });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const body = (await request.json().catch(() => ({}))) as { burnerId?: unknown };
    const burnerId = typeof body.burnerId === "string" ? body.burnerId : "";
    if (!burnerId) {
      return NextResponse.json({ error: "burnerId is required" }, { status: 400 });
    }
    await sql`delete from burners where id = ${burnerId} and sender_id = ${user.id}`;
    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = (error as Error).message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: (error as Error).message }, { status });
  }
}
