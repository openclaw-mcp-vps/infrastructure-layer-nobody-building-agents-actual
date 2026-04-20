import { NextRequest, NextResponse } from "next/server";
import {
  acknowledgeMessage,
  createMessage,
  listMessages
} from "@/lib/data-store";
import {
  acknowledgeMessageInputSchema,
  createMessageInputSchema
} from "@/lib/db/schema";
import { requestHasPaidAccess, unauthorizedPaywallResponse } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!requestHasPaidAccess(request)) {
    return unauthorizedPaywallResponse();
  }

  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get("agentId") ?? undefined;

  const messages = await listMessages(agentId);
  return NextResponse.json(messages);
}

export async function POST(request: NextRequest) {
  if (!requestHasPaidAccess(request)) {
    return unauthorizedPaywallResponse();
  }

  const json = await request.json();

  if (json?.action === "acknowledge") {
    const parsedAck = acknowledgeMessageInputSchema.safeParse(json);
    if (!parsedAck.success) {
      return NextResponse.json(
        { error: "invalid_request", details: parsedAck.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await acknowledgeMessage(parsedAck.data.id);
    if (!updated) {
      return NextResponse.json({ error: "not_found", message: "Message not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  }

  const parsed = createMessageInputSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const message = await createMessage(parsed.data);
  return NextResponse.json(message, { status: 201 });
}
