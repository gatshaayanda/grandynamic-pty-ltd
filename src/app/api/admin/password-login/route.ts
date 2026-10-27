import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { notificationServices } from "@/lib/server/firebase-admin";

export const runtime = "nodejs";

const ADMIN_EMAIL = "gatshaayanda@gmail.com";

export async function POST(request: Request) {
  try {
    const configuredPassword = process.env.ADMIN_PASSWORD;
    if (!configuredPassword) {
      return NextResponse.json({ error: "Admin password sign-in is not configured on the server." }, { status: 503 });
    }

    const body = await request.json().catch(() => ({}));
    const suppliedPassword = typeof body.password === "string" ? body.password : "";
    const expected = Buffer.from(configuredPassword, "utf8");
    const supplied = Buffer.from(suppliedPassword, "utf8");
    const matches = expected.length === supplied.length && timingSafeEqual(expected, supplied);
    if (!matches) {
      return NextResponse.json({ error: "The admin password is incorrect." }, { status: 401 });
    }

    const { auth } = notificationServices();
    let user;
    try {
      user = await auth.getUserByEmail(ADMIN_EMAIL);
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "auth/user-not-found") {
        user = await auth.createUser({ email: ADMIN_EMAIL, emailVerified: false, disabled: false });
      } else {
        throw error;
      }
    }

    if (user.disabled || user.email?.toLowerCase() !== ADMIN_EMAIL) {
      return NextResponse.json({ error: "This admin account is not available for password sign-in." }, { status: 403 });
    }

    const customToken = await auth.createCustomToken(user.uid, { adminPasswordSignIn: true });
    return NextResponse.json({ customToken }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Grandynamic admin password sign-in failed:", error);
    return NextResponse.json({ error: "Admin sign-in is temporarily unavailable. Check the server Firebase configuration." }, { status: 503 });
  }
}
