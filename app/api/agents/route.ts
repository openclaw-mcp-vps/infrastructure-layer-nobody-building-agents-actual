import { NextRequest, NextResponse } from "next/server";
import { createAgent, listAgents } from "@/lib/data-store";
import { createAgentInputSchema } from "@/lib/db/schema";
import { requestHasPaidAccess, unauthorizedPaywallResponse } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!requestHasPaidAccess(request)) {
    return unauthorizedPaywallResponse();
  }

  const agents = await listAgents();
  return NextResponse.json(agents);
}

export async function POST(request: NextRequest) {
  if (!requestHasPaidAccess(request)) {
    return unauthorizedPaywallResponse();
  }

  const json = await request.json();
  const parsed = createAgentInputSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const agent = await createAgent(parsed.data);
  return NextResponse.json(agent, { status: 201 });
}
