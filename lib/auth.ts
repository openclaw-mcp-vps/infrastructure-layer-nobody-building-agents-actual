import crypto from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const ACCESS_COOKIE_NAME = "agentinfra_access";

type AccessPayload = {
  email: string;
  exp: number;
};

function getCookieSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET || "local-dev-secret-change-me";
}

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string) {
  return crypto.createHmac("sha256", getCookieSecret()).update(value).digest("base64url");
}

export function createSignedAccessToken(email: string, daysValid = 30) {
  const payload: AccessPayload = {
    email,
    exp: Date.now() + daysValid * 24 * 60 * 60 * 1000
  };

  const encoded = toBase64Url(JSON.stringify(payload));
  return `${encoded}.${sign(encoded)}`;
}

export function verifySignedAccessToken(rawToken?: string): AccessPayload | null {
  if (!rawToken || !rawToken.includes(".")) {
    return null;
  }

  const [encoded, signature] = rawToken.split(".");
  const expected = sign(encoded);

  if (!signature || signature.length !== expected.length) {
    return null;
  }

  const valid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!valid) {
    return null;
  }

  try {
    const payload = JSON.parse(fromBase64Url(encoded)) as AccessPayload;
    if (!payload.email || payload.exp < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function getSessionFromCookie() {
  const store = await cookies();
  return verifySignedAccessToken(store.get(ACCESS_COOKIE_NAME)?.value);
}

export async function requirePaidAccess() {
  const session = await getSessionFromCookie();
  if (!session) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Paid access required. Complete checkout, then unlock with your purchase email." },
        { status: 401 }
      )
    };
  }

  return {
    ok: true as const,
    email: session.email
  };
}

export function setAccessCookie(response: NextResponse, email: string) {
  const token = createSignedAccessToken(email);
  response.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 30 * 24 * 60 * 60
  });
}

export function clearAccessCookie(response: NextResponse) {
  response.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0)
  });
}
