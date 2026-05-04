import { NextResponse } from "next/server";
import { Resend } from "resend";
import { randomToken, sha256 } from "../../../../lib/server/crypto";
import { sql } from "../../../../lib/server/db";

export const dynamic = "force-dynamic";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

function getBaseUrl(request: Request) {
  const configured = process.env.NEXT_PUBLIC_WEB_ORIGIN?.trim();
  return configured || new URL(request.url).origin;
}

async function sendResetEmail(input: {
  email: string;
  resetUrl: string;
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  const from =
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "Burner <noreply@deltaproconstruction.com>";
  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from,
    to: input.email,
    subject: "Reset your Burner password",
    text: [
      "Reset your Burner password using this link:",
      input.resetUrl,
      "",
      "This link expires in 1 hour. If you did not request this, you can ignore this email.",
    ].join("\n"),
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      email?: unknown;
    };
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (email) {
      const rows = await sql`
        select id, email from users where email = ${email} limit 1
      `;
      const user = rows[0] as { id: string; email: string } | undefined;

      if (user) {
        const token = randomToken(32);
        const tokenHash = await sha256(token);
        const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

        await sql`
          update password_reset_tokens
          set used_at = timezone('utc', now())
          where user_id = ${user.id} and used_at is null
        `;
        await sql`
          insert into password_reset_tokens (user_id, token_hash, expires_at)
          values (${user.id}, ${tokenHash}, ${expiresAt.toISOString()})
        `;

        const resetUrl = `${getBaseUrl(request).replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}`;
        await sendResetEmail({ email: user.email, resetUrl });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
