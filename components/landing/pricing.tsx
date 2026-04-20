"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, Lock, ReceiptText } from "lucide-react";

declare global {
  interface Window {
    LemonSqueezy?: {
      Setup: (config: {
        eventHandler?: (event: {
          event?: string;
          data?: {
            order_id?: string | number;
            identifier?: string;
            id?: string | number;
          };
          [key: string]: unknown;
        }) => void;
      }) => void;
      Url: {
        Open: (url: string) => void;
      };
    };
  }
}

type PricingProps = {
  checkoutUrl: string | null;
};

async function activateAccess(purchaseId: string) {
  const response = await fetch("/api/paywall/activate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ purchaseId })
  });

  if (!response.ok) {
    const payload = (await response.json()) as { message?: string };
    throw new Error(payload.message ?? "Unable to verify purchase yet");
  }
}

export function Pricing({ checkoutUrl }: PricingProps) {
  const [manualPurchaseId, setManualPurchaseId] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);

  useEffect(() => {
    if (!checkoutUrl) {
      return;
    }

    const script = document.createElement("script");
    script.src = "https://app.lemonsqueezy.com/js/lemon.js";
    script.defer = true;
    script.onload = () => {
      window.LemonSqueezy?.Setup({
        eventHandler: async (event) => {
          if (event.event !== "Checkout.Success") {
            return;
          }

          const purchaseId = String(
            event.data?.identifier ?? event.data?.order_id ?? event.data?.id ?? ""
          );

          if (!purchaseId) {
            setStatusMessage(
              "Checkout completed. Paste your order ID below to unlock access immediately."
            );
            return;
          }

          try {
            setIsUnlocking(true);
            await activateAccess(purchaseId);
            window.location.href = "/dashboard";
          } catch (error) {
            const message =
              error instanceof Error
                ? error.message
                : "Purchase received, but verification is still processing.";
            setStatusMessage(`${message} You can retry unlock with your order ID.`);
          } finally {
            setIsUnlocking(false);
          }
        }
      });
    };

    document.body.appendChild(script);
    return () => {
      script.remove();
    };
  }, [checkoutUrl]);

  const hasCheckout = useMemo(() => Boolean(checkoutUrl), [checkoutUrl]);

  const handleOpenCheckout = () => {
    if (!checkoutUrl) {
      setStatusMessage(
        "Set NEXT_PUBLIC_LEMON_SQUEEZY_STORE_ID and NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID to launch checkout."
      );
      return;
    }

    if (window.LemonSqueezy?.Url?.Open) {
      window.LemonSqueezy.Url.Open(checkoutUrl);
      return;
    }

    window.open(checkoutUrl, "_blank", "noopener,noreferrer");
  };

  const handleManualUnlock = async () => {
    if (!manualPurchaseId.trim()) {
      setStatusMessage("Enter your Lemon Squeezy order identifier to unlock access.");
      return;
    }

    try {
      setIsUnlocking(true);
      await activateAccess(manualPurchaseId.trim());
      window.location.href = "/dashboard";
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to verify the purchase right now.";
      setStatusMessage(message);
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <section id="pricing" className="container py-14">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <article className="panel p-6 sm:p-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">
            Straight pricing
          </p>
          <h2 className="text-3xl font-semibold text-white">$19/mo for production agent infrastructure</h2>
          <p className="mt-3 max-w-2xl text-gray-300">
            Built for engineering teams that moved beyond demos and now need predictable agent operations.
            Includes dashboard monitoring, APIs, webhook ingestion, and SDK examples.
          </p>

          <ul className="mt-6 grid gap-3 text-sm text-gray-200 sm:grid-cols-2">
            {[
              "Unlimited agents",
              "Persistent memory namespaces",
              "Task queue + status APIs",
              "Shared state records",
              "Usage analytics dashboard",
              "Lemon Squeezy billing"
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 rounded-lg border border-[#243043] bg-[#0f172a]/55 p-3">
                <Check className="mt-0.5 h-4 w-4 text-emerald-300" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <button onClick={handleOpenCheckout} className="btn-primary mt-7 w-full sm:w-auto">
            <Lock className="mr-2 h-4 w-4" />
            Open checkout overlay
          </button>
          {!hasCheckout && (
            <p className="mt-3 text-sm text-yellow-300">
              Checkout URL unavailable until Lemon Squeezy environment variables are configured.
            </p>
          )}
        </article>

        <aside className="panel p-6">
          <h3 className="text-lg font-semibold text-white">Unlock after purchase</h3>
          <p className="mt-2 text-sm text-gray-300">
            If webhook verification is delayed, paste your order ID and unlock dashboard access instantly.
          </p>

          <label className="mt-4 block text-sm text-gray-300" htmlFor="purchaseId">
            Lemon Squeezy order ID
          </label>
          <input
            id="purchaseId"
            value={manualPurchaseId}
            onChange={(event) => setManualPurchaseId(event.target.value)}
            className="mt-2 w-full rounded-lg border border-[#2b3648] bg-[#0e1726] px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
            placeholder="e.g. 987654"
          />

          <button
            onClick={handleManualUnlock}
            disabled={isUnlocking}
            className="btn-secondary mt-4 w-full disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isUnlocking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying purchase
              </>
            ) : (
              <>
                <ReceiptText className="mr-2 h-4 w-4" />
                Activate paid access
              </>
            )}
          </button>

          {statusMessage && (
            <p className="mt-3 rounded-lg border border-[#2a3550] bg-[#121d30] p-3 text-xs text-gray-200">
              {statusMessage}
            </p>
          )}
        </aside>
      </div>
    </section>
  );
}
