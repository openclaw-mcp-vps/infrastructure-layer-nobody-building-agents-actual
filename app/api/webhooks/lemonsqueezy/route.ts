import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { PurchaseRecordSchema, parseCollection } from "@/lib/db/schema";
import { readJsonFile, writeJsonFile } from "@/lib/storage";
import { normalizeLegacyWebhook } from "@/lib/lemonsqueezy";

const PURCHASES_FILE = "purchases.json";

function safeTimingEqual(a: string, b: string) {
  if (a.length !== b.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

function verifyStripeSignature(rawBody: string, signatureHeader: string, webhookSecret: string) {
  const parts = signatureHeader.split(",").map((part) => part.trim());
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  const signatures = parts
    .filter((part) => part.startsWith("v1="))
    .map((part) => part.slice(3))
    .filter(Boolean);

  if (!timestamp || signatures.length === 0) {
    return false;
  }

  const signedPayload = `${timestamp}.${rawBody}`;
  const expected = crypto.createHmac("sha256", webhookSecret).update(signedPayload).digest("hex");

  const timestampMs = Number(timestamp) * 1000;
  const maxSkewMs = 5 * 60 * 1000;
  if (Number.isNaN(timestampMs) || Math.abs(Date.now() - timestampMs) > maxSkewMs) {
    return false;
  }

  return signatures.some((candidate) => safeTimingEqual(candidate, expected));
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const stripeSignature = req.headers.get("stripe-signature");

  let email: string | null = null;
  let source: "stripe" | "lemonsqueezy" = "stripe";
  let eventId: string = crypto.randomUUID();
  let amount: number | null = null;
  let currency: string | null = null;

  try {
    if (stripeSignature) {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        return NextResponse.json(
          { error: "Missing STRIPE_WEBHOOK_SECRET." },
          { status: 500 }
        );
      }

      const valid = verifyStripeSignature(rawBody, stripeSignature, webhookSecret);
      if (!valid) {
        return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
      }

      const event = JSON.parse(rawBody) as {
        id?: string;
        type?: string;
        data?: { object?: Record<string, unknown> };
      };

      eventId = event.id || eventId;

      if (event.type === "checkout.session.completed") {
        const object = event.data?.object || {};
        const customerDetails = object.customer_details as { email?: string } | undefined;

        email =
          customerDetails?.email ||
          (typeof object.customer_email === "string" ? object.customer_email : null);

        amount = typeof object.amount_total === "number" ? object.amount_total / 100 : null;
        currency = typeof object.currency === "string" ? object.currency : null;
      }
    } else {
      const payload = JSON.parse(rawBody) as Record<string, unknown>;
      const normalized = normalizeLegacyWebhook(payload);

      source = "lemonsqueezy";
      email = normalized.email;
      eventId = typeof payload.id === "string" ? payload.id : eventId;
    }
  } catch {
    return NextResponse.json({ error: "Webhook payload could not be processed." }, { status: 400 });
  }

  if (!email) {
    return NextResponse.json({ received: true, ignored: true });
  }

  const rawPurchases = await readJsonFile<unknown[]>(PURCHASES_FILE, []);
  const purchases = parseCollection(rawPurchases, PurchaseRecordSchema);

  const exists = purchases.some((record) => record.id === eventId);

  if (!exists) {
    purchases.unshift(
      PurchaseRecordSchema.parse({
        id: eventId,
        email: email.toLowerCase(),
        source,
        amount,
        currency,
        createdAt: new Date().toISOString()
      })
    );

    await writeJsonFile(PURCHASES_FILE, purchases);
  }

  return NextResponse.json({ received: true });
}
