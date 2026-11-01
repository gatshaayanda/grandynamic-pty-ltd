import { NextResponse } from "next/server";
import { randomBytes, randomUUID } from "node:crypto";
import { notificationServices } from "@/lib/server/firebase-admin";

export const runtime = "nodejs";
const ALLOWED = ["gatshaayanda@gmail.com", "chikohoraknowledge4@gmail.com"];
const STATUSES = ["Queued", "Accepted", "In progress", "Awaiting customer", "Ready for collection", "Completed", "Cancelled"] as const;

async function requireStaff(request: Request) {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) throw new Error("SIGN_IN_REQUIRED");
  const { auth, db } = notificationServices();
  const user = await auth.verifyIdToken(token);
  if (!ALLOWED.includes(String(user.email || "").toLowerCase())) throw new Error("ACCESS_DENIED");
  const role = await db.doc("admins/" + user.uid).get();
  if (!role.exists || !["owner", "staff"].includes(String(role.data()?.role))) throw new Error("ACCESS_DENIED");
  return { user, db };
}
function fail(error: unknown) {
  const message = error instanceof Error ? error.message : "Workshop request failed.";
  const status = message === "SIGN_IN_REQUIRED" ? 401 : message === "ACCESS_DENIED" ? 403 : 400;
  return NextResponse.json({ error: status === 401 ? "Sign in to Grandynamic Operations again." : status === 403 ? "Your account is not authorized for workshop operations." : message }, { status, headers: { "Cache-Control": "no-store" } });
}
function clean(value: unknown, max: number) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }

export async function GET(request: Request) {
  try {
    const { db } = await requireStaff(request);
    const snapshot = await db.collection("workshopJobs").get();
    const rows: Array<{ id: string; status?: string; createdAt?: string; [key: string]: unknown }> = snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
    const jobs = rows.sort((a, b) => { const aClosed = ["Completed", "Cancelled"].includes(String(a.status)); const bClosed = ["Completed", "Cancelled"].includes(String(b.status)); return Number(aClosed) - Number(bClosed) || String(a.createdAt || "").localeCompare(String(b.createdAt || "")); });
    return NextResponse.json({ jobs }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return fail(error); }
}

export async function POST(request: Request) {
  try {
    const { user, db } = await requireStaff(request);
    const body = await request.json();
    const customerName = clean(body?.customerName, 120);
    const phone = clean(body?.phone, 40);
    const project = clean(body?.project, 180);
    const description = clean(body?.description, 3000);
    const source = ["Walk-in", "Existing enquiry", "Phone / WhatsApp"].includes(body?.source) ? body.source : "Walk-in";
    if (!customerName || !/^\+?[0-9][0-9 ()-]{6,38}$/.test(phone) || !project || !description) {
      return NextResponse.json({ error: "Enter the customer's name, a valid phone number, project title and work description." }, { status: 422 });
    }
    const now = new Date().toISOString();
    const id = randomUUID();
    const shareId = randomBytes(20).toString("hex");
    const job = { id, shareId, customerName, phone, project, description, source, status: "Queued", waitEstimate: "", customerUpdate: "Your project has been added to the workshop queue.", internalNotes: "", progressMedia: [], createdAt: now, updatedAt: now, createdBy: user.uid };
    const batch = db.batch();
    batch.create(db.doc("workshopJobs/" + id), job);
    batch.create(db.doc("publicProjects/" + shareId), { project, description, status: job.status, customerUpdate: job.customerUpdate, progressMedia: [], createdAt: now, updatedAt: now, timeline: [{ status: job.status, update: job.customerUpdate, createdAt: now }] });
    await batch.commit();
    return NextResponse.json({ job }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) { return fail(error); }
}

export async function PATCH(request: Request) {
  try {
    const { db } = await requireStaff(request);
    const body = await request.json();
    const id = clean(body?.id, 80);
    if (!/^[a-f0-9-]{20,80}$/i.test(id)) return NextResponse.json({ error: "Choose a valid workshop job." }, { status: 422 });
    const ref = db.doc("workshopJobs/" + id);
    const snapshot = await ref.get();
    if (!snapshot.exists) return NextResponse.json({ error: "This workshop job could not be found." }, { status: 404 });
    const current = snapshot.data()!;
    const status = clean(body?.status, 50);
    const customerUpdate = clean(body?.customerUpdate, 1000);
    const internalNotes = clean(body?.internalNotes, 3000);
    const waitEstimate = clean(body?.waitEstimate, 80);
    const progressMedia = Array.isArray(body?.progressMedia) ? body.progressMedia.slice(-12).filter((item: unknown): item is { url: string; caption?: string; createdAt?: string } => !!item && typeof item === "object" && "url" in item && typeof item.url === "string" && item.url.startsWith("https://") && item.url.length <= 2048).map(item => ({ url: item.url, caption: clean(item.caption, 180), createdAt: clean(item.createdAt, 40) })) : (Array.isArray(current.progressMedia) ? current.progressMedia : []);
    if (!STATUSES.includes(status as typeof STATUSES[number])) return NextResponse.json({ error: "Choose a valid job status." }, { status: 422 });
    const now = new Date().toISOString();
    const update = customerUpdate || (status !== current.status ? "Your project status has been updated by the workshop." : String(current.customerUpdate || ""));
    const next = { status, customerUpdate: update, internalNotes, waitEstimate, progressMedia, updatedAt: now };
    const batch = db.batch();
    batch.update(ref, next);
    const publicRef = db.doc("publicProjects/" + String(current.shareId));
    const publicSnap = await publicRef.get();
    if (publicSnap.exists) {
      const timeline = Array.isArray(publicSnap.data()?.timeline) ? publicSnap.data()!.timeline : [];
      const changed = status !== current.status || update !== current.customerUpdate;
      batch.set(publicRef, { project: current.project, description: current.description, status, customerUpdate: update, waitEstimate, progressMedia, updatedAt: now, ...(changed ? { timeline: [...timeline, { status, update, createdAt: now }].slice(-30) } : {}) }, { merge: true });
    }
    await batch.commit();
    return NextResponse.json({ job: { ...current, ...next } }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return fail(error); }
}
