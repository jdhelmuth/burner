import { NextResponse } from "next/server";
import { createSession, verifyPassword } from "../../../../lib/server/auth";
import { sql } from "../../../../lib/server/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      email?: unknown;
      password?: unknown;
    };
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!email || !password) {
      return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
    }

    const rows = await sql`
      select id, email, password_hash, display_name
      from users
      where email = ${email}
      limit 1
    `;
    const user = rows[0] as
      | { id: string; email: string; password_hash: string; display_name: string | null }
      | undefined;
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    return NextResponse.json({ session: await createSession(user) });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
