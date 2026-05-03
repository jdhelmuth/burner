import { NextResponse } from "next/server";
import { updateUserPassword } from "../../../../../lib/server/auth";
import { sha256 } from "../../../../../lib/server/crypto";
import { sql } from "../../../../../lib/server/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      password?: unknown;
      token?: unknown;
    };
    const token = typeof body.token === "string" ? body.token.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Use a password with at least 8 characters." }, { status: 400 });
    }

    const tokenHash = await sha256(token);
    const rows = await sql`
      select id, user_id, expires_at, used_at
      from password_reset_tokens
      where token_hash = ${tokenHash}
      limit 1
    `;
    const resetToken = rows[0] as
      | { id: string; user_id: string; expires_at: string | Date; used_at: string | Date | null }
      | undefined;

    if (
      !resetToken ||
      resetToken.used_at ||
      new Date(resetToken.expires_at).getTime() <= Date.now()
    ) {
      return NextResponse.json({ error: "That reset link is invalid or expired." }, { status: 400 });
    }

    await updateUserPassword(resetToken.user_id, password);
    await sql`
      update password_reset_tokens
      set used_at = timezone('utc', now())
      where id = ${resetToken.id}
    `;

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
