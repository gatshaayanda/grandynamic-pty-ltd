import { NextResponse } from "next/server";
import { notificationServices } from "@/lib/server/firebase-admin";
export const runtime = "nodejs";
async function projectRef(shareId: string) {
  if (!/^[a-f0-9]{40}$/.test(shareId)) throw new Error("NOT_FOUND");
  const { db } = notificationServices();
  const ref = db.doc("publicProjects/" + shareId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("NOT_FOUND");
  return { db, ref };
}
export async function GET(_request: Request, context: { params: Promise<{ shareId: string }> }) {
  try {
    const { shareId } = await context.params;
    const { db } = await projectRef(shareId);
    const snap = await db.collection("publicProjects").doc(shareId).collection("messages").orderBy("createdAt", "asc").limit(100).get();
    return NextResponse.json({ messages: snap.docs.map(d => ({ id: d.id, ...d.data() })) }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Messages are not available for this project." }, { status: 404 }); }
}
export async function POST(request: Request, context: { params: Promise<{ shareId: string }> }) {
  try {
    const { shareId } = await context.params;
    const { ref } = await projectRef(shareId);
    const body = await request.json();
    const message = typeof body?.message === "string" ? body.message.trim().slice(0, 1000) : "";
    if (!message) return NextResponse.json({ error: "Write a message before sending." }, { status: 422 });
    const item = { message, from: "customer", createdAt: new Date().toISOString() };
    const messageRef = ref.collection("messages").doc();
    await messageRef.create(item);
    return NextResponse.json({ id: messageRef.id, ...item }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Your message could not be sent. Please retry." }, { status: 404 }); }
}
