import { NextRequest, NextResponse } from "next/server";
import { createMemory, listMemory } from "@/lib/data-store";
import { createMemoryInputSchema } from "@/lib/db/schema";
import { requestHasPaidAccess, unauthorizedPaywallResponse } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!requestHasPaidAccess(request)) {
    return unauthorizedPaywallResponse();
  }

  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get("agentId") ?? undefined;
  const query = searchParams.get("query") ?? undefined;

  const records = await listMemory(agentId, query);
  return NextResponse.json(records);
}

export async function POST(request: NextRequest) {
  if (!requestHasPaidAccess(request)) {
    return unauthorizedPaywallResponse();
  }

  const json = await request.json();
  const parsed = createMemoryInputSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const memory = await createMemory(parsed.data);
  return NextResponse.json(memory, { status: 201 });
}
