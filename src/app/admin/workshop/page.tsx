"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, hasFirebaseWebConfig } from "@/lib/firebase/client";

type Message = { id: string; message: string; from: string; createdAt: string };
type Job = { id: string; shareId: string; customerName: string; phone: string; project: string; description: string; source: string; status: string; waitEstimate: string; customerUpdate: string; internalNotes: string; createdAt: string; updatedAt: string };
const STATUSES = ["Queued", "Accepted", "In progress", "Awaiting customer", "Ready for collection", "Completed", "Cancelled"];
const allowed = ["gatshaayanda@gmail.com", "chikohoraknowledge4@gmail.com"];
function WorkshopBoard() {
  const [user, setUser] = useState<User | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selected, setSelected] = useState<Job | null>(null);
  const [draft, setDraft] = useState({ customerName: "", phone: "", project: "", description: "", source: "Walk-in" });
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const token = useCallback(async () => {
    if (!auth.currentUser) throw new Error("Sign in to Operations again.");
    return auth.currentUser.getIdToken();
  }, []);
  const request = useCallback(async (path: string, init: RequestInit = {}) => {
    const idToken = await token();
    const response = await fetch(path, { ...init, headers: { "Content-Type": "application/json", Authorization: "Bearer " + idToken, ...(init.headers || {}) } });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || "Workshop operation failed.");
    return body;
  }, [token]);
  const load = useCallback(async () => {
    setLoading(true);
    try { const data = await request("/api/workshop/jobs"); setJobs(data.jobs || []); }
    catch (e) { setNotice(e instanceof Error ? e.message : "Workshop queue could not be loaded."); }
    finally { setLoading(false); }
  }, [request]);
  useEffect(() => onAuthStateChanged(auth, async next => {
    setUser(next); setAuthorized(false);
    if (!next) { setChecking(false); return; }
    setChecking(true);
    try {
      const email = String(next.email || "").toLowerCase();
      if (!allowed.includes(email)) throw new Error("This Google account is not authorized for Grandynamic Operations.");
      const idToken = await next.getIdToken();
      const response = await fetch("/api/admin/access", { method: "POST", headers: { Authorization: "Bearer " + idToken } });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Admin access could not be verified.");
      const role = await getDoc(doc(db, "admins", next.uid));
      if (!role.exists() || !["owner", "staff"].includes(String(role.data().role))) throw new Error("Your account has no Grandynamic workshop role.");
      setAuthorized(true);
    } catch (e) { setNotice(e instanceof Error ? e.message : "Admin access could not be verified."); await signOut(auth); }
    finally { setChecking(false); }
  }), []);
  useEffect(() => { if (authorized) void load(); }, [authorized, load]);
  useEffect(() => { if (!authorized || !selected) { setMessages([]); return; } let active = true; void request("/api/workshop/messages?shareId=" + selected.shareId).then(data => { if (active) setMessages(data.messages || []); }).catch(e => { if (active) setNotice(e instanceof Error ? e.message : "Project messages could not be loaded."); }); return () => { active = false; }; }, [authorized, selected?.shareId, request]);
  async function login() {
    if (!hasFirebaseWebConfig) { setNotice("Grandynamic Google sign-in is not configured."); return; }
    setBusy(true); setNotice("");
    try { const provider = new GoogleAuthProvider(); await signInWithPopup(auth, provider); }
    catch (e) { setNotice(e instanceof Error ? e.message : "Google sign-in failed."); }
    finally { setBusy(false); }
  }
  async function createJob() {
    if (!draft.customerName.trim() || !draft.phone.trim() || !draft.project.trim() || !draft.description.trim()) { setNotice("Complete the customer, phone, project title and work description."); return; }
    setBusy(true); setNotice("");
    try {
      const data = await request("/api/workshop/jobs", { method: "POST", body: JSON.stringify(draft) });
      setJobs(items => [data.job, ...items]); setSelected(data.job);
      setDraft({ customerName: "", phone: "", project: "", description: "", source: "Walk-in" });
      setNotice("Workshop job saved. The private customer progress link is ready to share.");
    } catch (e) { setNotice(e instanceof Error ? e.message : "Workshop job could not be saved."); }
    finally { setBusy(false); }
  }
  async function saveUpdate() {
    if (!selected) return;
    setBusy(true); setNotice("");
    try { const data = await request("/api/workshop/jobs", { method: "PATCH", body: JSON.stringify(selected) }); setSelected(data.job); setJobs(items => items.map(j => j.id === selected.id ? data.job : j)); setNotice("Workshop update saved and the customer progress page is updated."); }
    catch (e) { setNotice(e instanceof Error ? e.message : "Update could not be saved."); }
    finally { setBusy(false); }
  }
  async function sendReply() { if (!selected || !reply.trim()) return; setBusy(true); setNotice(""); try { const data = await request("/api/workshop/messages", { method: "POST", body: JSON.stringify({ shareId: selected.shareId, message: reply.trim() }) }); setMessages(items => [...items, data]); setReply(""); setNotice("Reply sent to the customer project page."); } catch (e) { setNotice(e instanceof Error ? e.message : "Reply could not be sent."); } finally { setBusy(false); } }
  const share = selected && typeof window !== "undefined" ? window.location.origin + "/project/" + selected.shareId : "";
  const whatsappPhone = selected ? selected.phone.replace(/\D/g, "").replace(/^0/, "267").replace(/^(?!267)(7\d{7})$/, "267$1") : "";
  const whatsapp = selected ? "https://wa.me/" + whatsappPhone + "?text=" + encodeURIComponent("Hello " + selected.customerName + ", Grandynamic has set up a private progress page for your project: " + share + " — you can follow workshop updates and message us there.") : "#";
  if (checking) return <main className="af-site"><section className="af-project-wrap"><p>Checking workshop access…</p></section></main>;
  if (!user || !authorized) return <main className="af-site"><header className="af-header"><Link href="/" className="af-brand"><span className="af-brand-mark">G</span><span><strong>GRANDYNAMIC</strong><small>WELDING · FABRICATION</small></span></Link><Link href="/admin" className="af-button af-button-outline">Operations dashboard</Link></header><section className="af-project-wrap"><div className="af-project-heading"><p className="af-eyebrow">GRANDYNAMIC / WORKSHOP</p><h1>Keep the work<br/><em>moving.</em></h1><p>Create a workshop job, update its progress and share a private customer link.</p></div><article className="af-project-panel"><h2>Authorized workshop access</h2><p>Continue with an approved Grandynamic Google account.</p>{notice && <p className="af-form-message af-error" role="alert">{notice}</p>}<button className="af-button" type="button" disabled={busy} onClick={() => void login()}>{busy ? "Checking account…" : "Continue with Google ↗"}</button></article></section></main>;
  return <main className="af-site"><header className="af-header"><Link href="/" className="af-brand"><span className="af-brand-mark">G</span><span><strong>GRANDYNAMIC</strong><small>WORKSHOP OPERATIONS</small></span></Link><nav><Link href="/admin">Operations dashboard</Link><Link href="/">Public site</Link></nav><button className="af-button af-button-outline af-button-small" onClick={() => void signOut(auth)}>Sign out</button></header>
    <section className="af-workshop-wrap"><div className="af-workshop-heading"><div><p className="af-eyebrow">WORKSHOP / LIVE QUEUE</p><h1>Keep the work<br/><em>moving.</em></h1><p>Register walk-ins and customer projects, then share progress directly with each customer.</p></div><div className="af-workshop-count"><strong>{jobs.filter(j => !["Completed", "Cancelled"].includes(j.status)).length}</strong><span>active projects</span></div></div>
      {notice && <p className="af-form-message" role="status">{notice}</p>}
      <div className="af-workshop-grid"><section className="af-project-panel"><p className="af-eyebrow">NEW WALK-IN / PROJECT</p><h2>Add work to the queue.</h2><div className="af-form"><label>Customer name<input value={draft.customerName} onChange={e => setDraft(v => ({ ...v, customerName: e.target.value }))} maxLength={120}/></label><label>WhatsApp / phone<input value={draft.phone} onChange={e => setDraft(v => ({ ...v, phone: e.target.value }))} placeholder="+267 …" inputMode="tel" maxLength={40}/></label><label>Project title<input value={draft.project} onChange={e => setDraft(v => ({ ...v, project: e.target.value }))} placeholder="e.g. Double driveway gate"/></label><label>Work description<textarea rows={4} value={draft.description} onChange={e => setDraft(v => ({ ...v, description: e.target.value }))} placeholder="What needs to be fabricated, repaired or installed?"/></label><label>How did the work arrive?<select value={draft.source} onChange={e => setDraft(v => ({ ...v, source: e.target.value }))}><option>Walk-in</option><option>Existing enquiry</option><option>Phone / WhatsApp</option></select></label><button className="af-button" type="button" disabled={busy} onClick={() => void createJob()}>{busy ? "Saving…" : "Add to workshop queue"}</button><p className="af-form-footnote">The customer is not told the job is accepted or completed until you update its status.</p></div></section>
      <section className="af-project-panel"><div className="af-workshop-list-heading"><div><p className="af-eyebrow">WORKSHOP QUEUE</p><h2>{jobs.length} recorded projects</h2></div><button className="af-button af-button-outline af-button-small" type="button" onClick={() => void load()} disabled={loading}>{loading ? "Refreshing…" : "Refresh"}</button></div>
        {loading ? <p>Loading workshop jobs…</p> : jobs.length ? <div className="af-workshop-list">{jobs.map(job => <button key={job.id} type="button" className={selected?.id === job.id ? "selected" : ""} onClick={() => setSelected(job)}><span><strong>{job.customerName}</strong><small>{job.project} · {job.source}</small></span><b>{job.status}</b></button>)}</div> : <p>No workshop jobs yet. Add the first walk-in or customer project.</p>}
        {selected && <div className="af-workshop-detail"><p className="af-eyebrow">PROJECT CONTROL / {selected.id.slice(0, 8).toUpperCase()}</p><h2>{selected.project}</h2><p>{selected.customerName} · {selected.phone}</p><div className="af-form"><label>Job status<select value={selected.status} onChange={e => setSelected(v => v ? ({ ...v, status: e.target.value }) : v)}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></label><label>Customer-facing progress update<textarea rows={3} maxLength={1000} value={selected.customerUpdate} onChange={e => setSelected(v => v ? ({ ...v, customerUpdate: e.target.value }) : v)} /></label><label>Wait estimate (optional)<input value={selected.waitEstimate} onChange={e => setSelected(v => v ? ({ ...v, waitEstimate: e.target.value }) : v)} placeholder="e.g. Reviewing this week (only if realistic)"/></label><label>Internal workshop notes (not shared)<textarea rows={3} maxLength={3000} value={selected.internalNotes} onChange={e => setSelected(v => v ? ({ ...v, internalNotes: e.target.value }) : v)} /></label><button className="af-button" type="button" disabled={busy} onClick={() => void saveUpdate()}>{busy ? "Saving…" : "Save workshop update"}</button></div>
          <div className="af-workshop-share"><a className="af-button" href={whatsapp} target="_blank" rel="noreferrer">Share progress on WhatsApp ↗</a><button className="af-button af-button-outline" type="button" onClick={() => { void navigator.clipboard.writeText(share); setNotice("Customer project link copied."); }}>Copy customer link</button><a className="af-text-link" href={share} target="_blank" rel="noreferrer">Open customer view ↗</a></div><div className="af-workshop-conversation"><p className="af-eyebrow">CUSTOMER CONVERSATION</p><h3>{messages.length ? messages.length + " messages" : "No messages yet"}</h3><div className="af-project-messages">{messages.map(item => <article key={item.id} className={item.from === "workshop" ? "workshop" : "customer"}><strong>{item.from === "workshop" ? "Grandynamic workshop" : "Customer"}</strong><p>{item.message}</p><small>{new Date(item.createdAt).toLocaleString()}</small></article>)}{!messages.length && <p>No customer messages yet. Replies from the customer progress page will appear here.</p>}</div><label className="af-project-message-label">Reply to customer<textarea rows={3} maxLength={1000} value={reply} onChange={e => setReply(e.target.value)} placeholder="Write a project update or answer…"/></label><button className="af-button" type="button" disabled={!reply.trim() || busy} onClick={() => void sendReply()}>{busy ? "Sending…" : "Send customer reply"}</button></div>
        </div>}
      </section></div>
      <p className="af-form-footnote">Customer progress links show only the project description, public status and updates. Customer phone numbers and internal notes remain in Operations.</p>
    </section></main>;
}
export default function WorkshopPage() { return <WorkshopBoard />; }
