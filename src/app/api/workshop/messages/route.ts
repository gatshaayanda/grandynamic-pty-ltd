import { NextResponse } from "next/server";
import { notificationServices } from "@/lib/server/firebase-admin";
export const runtime = "nodejs";
const ALLOWED = ["gatshaayanda@gmail.com", "chikohoraknowledge4@gmail.com"];
async function requireStaff(request: Request) {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) throw new Error("SIGN_IN_REQUIRED");
  const { auth, db } = notificationServices();
  const user = await auth.verifyIdToken(token);
  if (!ALLOWED.includes(String(user.email || "").toLowerCase())) throw new Error("ACCESS_DENIED");
  const role = await db.doc("admins/" + user.uid).get();
  if (!role.exists || !["owner", "staff"].includes(String(role.data()?.role))) throw new Error("ACCESS_DENIED");
  return db;
}
function failure(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  return NextResponse.json({ error: message === "SIGN_IN_REQUIRED" ? "Sign in to Operations again." : message === "ACCESS_DENIED" ? "Workshop access is not authorized." : "Workshop message could not be saved." }, { status: message === "SIGN_IN_REQUIRED" ? 401 : message === "ACCESS_DENIED" ? 403 : 400 });
}
export async function GET(request: Request) {
  try {
    const db = await requireStaff(request);
    const shareId = new URL(request.url).searchParams.get("shareId") || "";
    if (!/^[a-f0-9]{40}$/.test(shareId)) return NextResponse.json({ error: "Choose a valid project." }, { status: 422 });
    const ref = db.doc("publicProjects/" + shareId);
    if (!(await ref.get()).exists) return NextResponse.json({ error: "Project not found." }, { status: 404 });
    const snap = await ref.collection("messages").orderBy("createdAt", "asc").limit(100).get();
    return NextResponse.json({ messages: snap.docs.map(d => ({ id: d.id, ...d.data() })) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return failure(error); }
}
export async function POST(request: Request) {
  try {
    const db = await requireStaff(request);
    const body = await request.json();
    const shareId = typeof body?.shareId === "string" ? body.shareId : "";
    const message = typeof body?.message === "string" ? body.message.trim().slice(0, 1000) : "";
    if (!/^[a-f0-9]{40}$/.test(shareId) || !message) return NextResponse.json({ error: "Choose a project and enter a message." }, { status: 422 });
    const ref = db.doc("publicProjects/" + shareId);
    if (!(await ref.get()).exists) return NextResponse.json({ error: "Project not found." }, { status: 404 });
    const item = { message, from: "workshop", createdAt: new Date().toISOString() };
    const messageRef = ref.collection("messages").doc();
    await messageRef.create(item);
    return NextResponse.json({ id: messageRef.id, ...item }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) { return failure(error); }
}
