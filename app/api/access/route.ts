import { NextResponse } from "next/server";
import {
  AccessUnlockSchema,
  PurchaseRecordSchema,
  parseCollection
} from "@/lib/db/schema";
import {
  clearAccessCookie,
  getSessionFromCookie,
  setAccessCookie
} from "@/lib/auth";
import { readJsonFile } from "@/lib/storage";

async function getPayload(req: Request) {
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return req.json();
  }

  const formData = await req.formData();
  return {
    email: String(formData.get("email") || "")
  };
}

export async function GET() {
  const session = await getSessionFromCookie();

  if (!session) {
    return NextResponse.json({ hasAccess: false });
  }

  return NextResponse.json({ hasAccess: true, email: session.email });
}

export async function POST(req: Request) {
  const body = await getPayload(req);
  const parsed = AccessUnlockSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter the exact email used at checkout." },
      { status: 400 }
    );
  }

  const purchasesRaw = await readJsonFile<unknown[]>("purchases.json", []);
  const purchases = parseCollection(purchasesRaw, PurchaseRecordSchema);

  const hasPurchase = purchases.some(
    (record) => record.email.toLowerCase() === parsed.data.email.toLowerCase()
  );

  if (!hasPurchase) {
    return NextResponse.json(
      {
        error:
          "No paid checkout found for that email yet. Complete payment and wait for the webhook confirmation."
      },
      { status: 404 }
    );
  }

  const response = NextResponse.json({ unlocked: true });
  setAccessCookie(response, parsed.data.email.toLowerCase());
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ unlocked: false });
  clearAccessCookie(response);
  return response;
}
