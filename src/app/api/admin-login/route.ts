import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { notificationServices } from "@/lib/server/firebase-admin";

export const runtime = "nodejs";
const ACCESS_UID = "grandynamic-one-word-admin";

function matchesAccessWord(input: string, expected: string) {
  const actual = createHash("sha256").update(input).digest();
  const wanted = createHash("sha256").update(expected).digest();
  return input.length > 0 && timingSafeEqual(actual, wanted);
}

export async function POST(request: Request) {
  try {
    const expected = process.env.ADMIN_PASSWORD;
    if (!expected) return NextResponse.json(
      { error: "One-word admin access is not configured. Set ADMIN_PASSWORD in the server environment." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
    const body = await request.json().catch(() => null) as { word?: unknown } | null;
    const word = typeof body?.word === "string" ? body.word : "";
    if (!matchesAccessWord(word, expected)) return NextResponse.json(
      { error: "Access denied. Check the access word and try again." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );

    const { auth, db } = notificationServices();
    const roleRef = db.doc("admins/" + ACCESS_UID);
    const role = await roleRef.get();
    if (!role.exists) {
      await roleRef.create({ role: "owner", temporaryAccess: true, accessMethod: "one-word-admin", createdAt: new Date().toISOString() });
    } else if (!["owner", "staff"].includes(String(role.data()?.role || "").toLowerCase())) {
      return NextResponse.json({ error: "This access account is not authorized for Grandynamic Operations." }, { status: 403, headers: { "Cache-Control": "no-store" } });
    }
    const token = await auth.createCustomToken(ACCESS_UID);
    return NextResponse.json({ token }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "";
    console.error("Grandynamic one-word admin sign-in failed:", detail || "Unknown server error");
    const message = /FIREBASE_ADMIN_KEY/.test(detail)
      ? "One-word access is connected, but the server-only Firebase Admin credential is missing or invalid. Configure FIREBASE_ADMIN_KEY."
      : "Admin sign-in is temporarily unavailable. Check the server configuration.";
    return NextResponse.json({ error: message }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
