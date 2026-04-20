import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const PAYWALL_COOKIE_NAME = "agentinfra_paid";

export async function hasPaidAccess(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(PAYWALL_COOKIE_NAME)?.value === "true";
}

export function requestHasPaidAccess(request: NextRequest): boolean {
  return request.cookies.get(PAYWALL_COOKIE_NAME)?.value === "true";
}

export function applyPaidCookie(response: NextResponse): NextResponse {
  response.cookies.set({
    name: PAYWALL_COOKIE_NAME,
    value: "true",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production"
  });

  return response;
}

export function unauthorizedPaywallResponse() {
  return NextResponse.json(
    {
      error: "paid_plan_required",
      message:
        "This API is part of the paid AgentInfra platform. Complete checkout to unlock access."
    },
    { status: 402 }
  );
}
