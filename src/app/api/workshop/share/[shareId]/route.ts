import { NextResponse } from "next/server";
import { notificationServices } from "@/lib/server/firebase-admin";
export const runtime = "nodejs";
export async function GET(_request: Request, context: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await context.params;
  if (!/^[a-f0-9]{40}$/.test(shareId)) return NextResponse.json({ error: "This project link is not valid." }, { status: 404 });
  try {
    const { db } = notificationServices();
    const snap = await db.doc("publicProjects/" + shareId).get();
    if (!snap.exists) return NextResponse.json({ error: "This project link is no longer available." }, { status: 404 });
    const data = snap.data()!;
    return NextResponse.json({ project: { project: data.project, description: data.description, status: data.status, customerUpdate: data.customerUpdate, createdAt: data.createdAt, updatedAt: data.updatedAt, timeline: Array.isArray(data.timeline) ? data.timeline : [] } }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch { return NextResponse.json({ error: "Project progress is temporarily unavailable." }, { status: 503 }); }
}
