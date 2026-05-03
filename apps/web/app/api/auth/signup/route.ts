import { NextResponse } from "next/server";
import { createSession, hashPassword } from "../../../../lib/server/auth";
import { sql } from "../../../../lib/server/db";

export const dynamic = "force-dynamic";

function usernameFromEmail(email: string) {
  return email.split("@")[0]?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "burner-sender";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      displayName?: unknown;
      email?: unknown;
      password?: unknown;
    };
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const displayName =
      typeof body.displayName === "string" && body.displayName.trim()
        ? body.displayName.trim()
        : usernameFromEmail(email);

    if (!email || !password) {
      return NextResponse.json({ error: "Enter an email and a password." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Use a password with at least 8 characters." }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const users = await sql`
      insert into users (email, password_hash, display_name)
      values (${email}, ${passwordHash}, ${displayName})
      returning id, email, display_name
    `;
    const user = users[0] as { id: string; email: string; display_name: string | null };
    await sql`
      insert into profiles (id, display_name, username)
      values (${user.id}, ${displayName}, ${usernameFromEmail(email)})
      on conflict (id) do nothing
    `;

    return NextResponse.json({ session: await createSession(user) });
  } catch (error) {
    const message = (error as Error).message.includes("duplicate key")
      ? "An account already exists for that email."
      : (error as Error).message;
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
