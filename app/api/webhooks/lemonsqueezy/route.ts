import { NextRequest, NextResponse } from "next/server";
import { recordPurchase } from "@/lib/data-store";
import { type LemonWebhookPayload, verifyLemonSignature } from "@/lib/lemonsqueezy";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");

  if (!verifyLemonSignature(rawBody, signature)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  let payload: LemonWebhookPayload;

  try {
    payload = JSON.parse(rawBody) as LemonWebhookPayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const event = payload.meta?.event_name;

  if (event === "order_created" || event === "subscription_created" || event === "subscription_payment_success") {
    const fallbackOrderId = payload.data?.id;
    const orderId = payload.data?.attributes?.identifier ?? fallbackOrderId;
    const email = payload.data?.attributes?.user_email ?? payload.data?.attributes?.email;

    if (orderId) {
      await recordPurchase(orderId, email);
    }
  }

  return NextResponse.json({ received: true });
}
