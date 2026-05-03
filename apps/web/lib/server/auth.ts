import { cookies } from "next/headers";
import { scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { sql } from "./db";
import { randomToken, sha256 } from "./crypto";

export type AppSession = {
  access_token: string;
  expires_at: number;
  user: {
    id: string;
    email: string;
    user_metadata: {
      display_name?: string;
      full_name?: string;
    };
  };
};

const SESSION_COOKIE = "burner_session";
const SESSION_DAYS = 30;
const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string, salt = randomToken(16)) {
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [salt, digest] = storedHash.split(":");
  if (!salt || !digest) {
    return false;
  }
  const candidate = Buffer.from((await hashPassword(password, salt)).split(":")[1] ?? "", "hex");
  const expected = Buffer.from(digest, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export async function createSession(user: {
  id: string;
  email: string;
  display_name: string | null;
}) {
  const token = randomToken(32);
  const tokenHash = await sha256(token);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await sql`
    insert into user_sessions (user_id, token_hash, expires_at)
    values (${user.id}, ${tokenHash}, ${expiresAt.toISOString()})
  `;
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
  return toAppSession(user, token, expiresAt);
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }
  return getSessionFromToken(token);
}

export async function getSessionFromToken(token: string) {
  const tokenHash = await sha256(token);
  const rows = await sql`
    select s.expires_at, u.id, u.email, u.display_name
    from user_sessions s
    join users u on u.id = s.user_id
    where s.token_hash = ${tokenHash}
    limit 1
  `;
  const row = rows[0] as
    | { expires_at: string | Date; id: string; email: string; display_name: string | null }
    | undefined;
  if (!row || new Date(row.expires_at).getTime() <= Date.now()) {
    return null;
  }
  return toAppSession(
    { id: row.id, email: row.email, display_name: row.display_name },
    token,
    new Date(row.expires_at),
  );
}

export async function requireCurrentUser(request?: Request) {
  const bearerToken = request?.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  const session = bearerToken ? await getSessionFromToken(bearerToken) : await getCurrentSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export async function updateUserPassword(userId: string, password: string) {
  await sql`
    update users
    set password_hash = ${await hashPassword(password)}
    where id = ${userId}
  `;
  await sql`delete from user_sessions where user_id = ${userId}`;
}

function toAppSession(
  user: { id: string; email: string; display_name: string | null },
  token: string,
  expiresAt: Date,
): AppSession {
  return {
    access_token: token,
    expires_at: Math.floor(expiresAt.getTime() / 1000),
    user: {
      id: user.id,
      email: user.email,
      user_metadata: {
        display_name: user.display_name ?? undefined,
        full_name: user.display_name ?? undefined,
      },
    },
  };
}
