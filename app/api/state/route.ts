import { NextRequest, NextResponse } from "next/server";
import { listState, upsertState } from "@/lib/data-store";
import { upsertStateInputSchema } from "@/lib/db/schema";
import { requestHasPaidAccess, unauthorizedPaywallResponse } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!requestHasPaidAccess(request)) {
    return unauthorizedPaywallResponse();
  }

  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get("agentId");
  const key = searchParams.get("key") ?? undefined;

  if (!agentId) {
    return NextResponse.json(
      { error: "invalid_request", message: "agentId is required" },
      { status: 400 }
    );
  }

  const records = await listState(agentId, key);
  return NextResponse.json(records);
}

export async function POST(request: NextRequest) {
  if (!requestHasPaidAccess(request)) {
    return unauthorizedPaywallResponse();
  }

  const json = await request.json();
  const parsed = upsertStateInputSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const state = await upsertState(parsed.data);
  return NextResponse.json(state, { status: 201 });
}
