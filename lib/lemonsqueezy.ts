import { lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";

let initialized = false;

export function initLemonSqueezy() {
  if (initialized) {
    return;
  }

  if (process.env.LEMONSQUEEZY_API_KEY) {
    lemonSqueezySetup({ apiKey: process.env.LEMONSQUEEZY_API_KEY });
  }

  initialized = true;
}

export function normalizeLegacyWebhook(payload: Record<string, unknown>) {
  const maybeEmail =
    typeof payload?.meta === "object" && payload.meta && "custom_data" in payload.meta
      ? payload.meta
      : null;

  return {
    source: "lemonsqueezy",
    email:
      typeof payload.data === "object" &&
      payload.data &&
      "attributes" in payload.data &&
      typeof payload.data.attributes === "object" &&
      payload.data.attributes &&
      "user_email" in payload.data.attributes
        ? String((payload.data.attributes as Record<string, unknown>).user_email)
        : typeof maybeEmail === "object" && maybeEmail && "email" in maybeEmail
          ? String((maybeEmail as Record<string, unknown>).email)
          : null
  };
}
