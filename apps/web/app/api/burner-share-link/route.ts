import { NextResponse } from "next/server";
import { requireCurrentUser } from "../../../lib/server/auth";
import { createOrGetShareLink } from "../../../lib/server/burners";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const body = (await request.json().catch(() => ({}))) as {
      burnerId?: unknown;
      mode?: unknown;
    };
    const burnerId = typeof body.burnerId === "string" ? body.burnerId.trim() : "";
    const mode = body.mode === "create" ? "create" : "get";
    if (!burnerId) {
      return NextResponse.json({ error: "burnerId is required" }, { status: 400 });
    }
    return NextResponse.json(
      await createOrGetShareLink({ burnerId, mode, request, userId: user.id }),
    );
  } catch (error) {
    const status = (error as Error).message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: (error as Error).message }, { status });
  }
}
