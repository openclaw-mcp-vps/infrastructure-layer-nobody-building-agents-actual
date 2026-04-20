import { createHmac, timingSafeEqual } from "node:crypto";

export type LemonWebhookPayload = {
  meta?: {
    event_name?: string;
    custom_data?: Record<string, unknown>;
  };
  data?: {
    id?: string;
    attributes?: {
      identifier?: string;
      user_email?: string;
      email?: string;
      status?: string;
      total?: number;
    };
  };
};

export function getCheckoutUrl() {
  const productId = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID;
  const storeId = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_STORE_ID;

  if (!productId || !storeId) {
    return null;
  }

  return `https://${storeId}.lemonsqueezy.com/buy/${productId}?embed=1&checkout[dark]=true`;
}

export function verifyLemonSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;

  if (!secret || !signatureHeader) {
    return false;
  }

  const digest = createHmac("sha256", secret).update(rawBody).digest("hex");
  const expected = Buffer.from(digest);
  const received = Buffer.from(signatureHeader);

  if (expected.length !== received.length) {
    return false;
  }

  return timingSafeEqual(expected, received);
}
