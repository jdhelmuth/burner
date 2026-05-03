import { NextResponse } from "next/server";
import { exchangeShareAccess } from "../../../lib/server/burners";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      clientFingerprint?: unknown;
      slug?: unknown;
      token?: unknown;
    };
    const slug = typeof body.slug === "string" ? body.slug : "";
    const token = typeof body.token === "string" ? body.token : "";
    if (!slug || !token) {
      return NextResponse.json({ error: "Missing slug or token" }, { status: 400 });
    }
    return NextResponse.json(
      await exchangeShareAccess({
        slug,
        token,
        clientFingerprint:
          typeof body.clientFingerprint === "string" ? body.clientFingerprint : undefined,
      }),
    );
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
