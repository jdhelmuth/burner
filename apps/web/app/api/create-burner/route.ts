import { NextResponse } from "next/server";
import { requireCurrentUser } from "../../../lib/server/auth";
import { createBurner } from "../../../lib/server/burners";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const body = await request.json().catch(() => null);
    return NextResponse.json(await createBurner({ body, request, user }));
  } catch (error) {
    const status = (error as Error).message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: (error as Error).message }, { status });
  }
}
