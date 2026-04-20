import { NextRequest, NextResponse } from "next/server";
import { applyPaidCookie } from "@/lib/auth";
import { hasRecordedPurchase } from "@/lib/data-store";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let payload: { purchaseId?: string };

  try {
    payload = (await request.json()) as { purchaseId?: string };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const purchaseId = payload.purchaseId?.trim();

  if (!purchaseId) {
    return NextResponse.json(
      {
        error: "invalid_request",
        message: "purchaseId is required"
      },
      { status: 400 }
    );
  }

  const purchaseExists = await hasRecordedPurchase(purchaseId);

  if (!purchaseExists && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        error: "purchase_not_found",
        message:
          "This purchase has not been validated by webhook yet. Please wait a few seconds and retry."
      },
      { status: 403 }
    );
  }

  const response = NextResponse.json({ ok: true, unlocked: true });
  return applyPaidCookie(response);
}
