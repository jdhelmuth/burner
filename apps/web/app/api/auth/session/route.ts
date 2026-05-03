import { NextResponse } from "next/server";
import { getCurrentSession } from "../../../../lib/server/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ session: await getCurrentSession() });
}
