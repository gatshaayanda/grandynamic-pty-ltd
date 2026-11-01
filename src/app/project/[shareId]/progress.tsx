"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Timeline = { status: string; update: string; createdAt: string };
type Message = { id: string; message: string; from: string; createdAt: string };
type Project = { project: string; description: string; status: string; customerUpdate: string; createdAt: string; updatedAt: string; timeline: Timeline[] };
const stages = ["Queued", "Accepted", "In progress", "Awaiting customer", "Ready for collection", "Completed"];
export default function ProjectProgress({ shareId }: { shareId: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [p, m] = await Promise.all([fetch("/api/workshop/share/" + shareId, { cache: "no-store" }), fetch("/api/workshop/share/" + shareId + "/messages", { cache: "no-store" })]);
        const pd = await p.json();
        if (!p.ok) throw new Error(pd.error || "Project progress could not be loaded.");
        const md = await m.json();
        if (active) { setProject(pd.project); setMessages(m.ok && Array.isArray(md.messages) ? md.messages : []); }
      } catch (e) { if (active) setNotice(e instanceof Error ? e.message : "Project progress could not be loaded."); }
      finally { if (active) setLoading(false); }
    };
    void load();
    const timer = window.setInterval(() => { void load(); }, 45000);
    return () => { active = false; window.clearInterval(timer); };
  }, [shareId]);
  async function send() {
    if (!message.trim() || sending) return;
    setSending(true); setNotice("");
    try {
      const response = await fetch("/api/workshop/share/" + shareId + "/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: message.trim() }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Message could not be sent.");
      setMessages(items => [...items, data]); setMessage(""); setNotice("Message sent to the Grandynamic workshop.");
    } catch (e) { setNotice(e instanceof Error ? e.message : "Message could not be sent."); }
    finally { setSending(false); }
  }
  return <main className="af-site af-project-page">
    <div className="af-topline"><span>BOTSWANA · STEEL FABRICATION</span><span>Customer project access</span></div>
    <header className="af-header"><Link href="/" className="af-brand"><span className="af-brand-mark">G</span><span><strong>GRANDYNAMIC</strong><small>WELDING · FABRICATION</small></span></Link><Link className="af-button af-button-small af-button-outline" href="/">Visit Grandynamic ↗</Link></header>
    <section className="af-project-wrap">
      <div className="af-project-heading"><p className="af-eyebrow">YOUR WORKSHOP PROJECT</p><h1>Project<br/><em>progress.</em></h1><p>Use this private link to follow the latest update from the Grandynamic workshop.</p></div>
      {loading ? <article className="af-project-panel"><p>Loading your project update…</p></article> : !project ? <article className="af-project-panel"><h2>Project link unavailable</h2><p>{notice || "This link may be incorrect or no longer active. Contact Grandynamic for help."}</p></article> : <>
        <article className="af-project-panel">
          <div className="af-project-status"><span>Current status</span><strong>{project.status}</strong></div>
          <p className="af-eyebrow">PROJECT</p><h2>{project.project}</h2><p>{project.description}</p>
          <div className="af-project-update"><span>Latest workshop update</span><p>{project.customerUpdate}</p><small>Updated {new Date(project.updatedAt).toLocaleString()}</small></div>
          <div className="af-project-stages" aria-label="Project progress">
            {stages.filter(s => s !== "Cancelled").map((stage, index) => <div className={stages.indexOf(project.status) >= index ? "af-project-stage done" : "af-project-stage"} key={stage}><span>{index + 1}</span><strong>{stage}</strong></div>)}
          </div>
          <h3>Project updates</h3>
          <div className="af-project-timeline">{project.timeline.map((item, index) => <article key={index}><strong>{item.status}</strong><p>{item.update}</p><small>{new Date(item.createdAt).toLocaleString()}</small></article>)}</div>
          <p className="af-project-private-note">This page does not display your phone number, quotation or internal workshop notes.</p>
        </article>
        <article className="af-project-panel">
          <p className="af-eyebrow">DIRECT CONVERSATION</p><h2>Talk to the workshop.</h2><p>Ask a question or send information about this project. Messages are attached to this project link.</p>
          <div className="af-project-messages">{messages.map(item => <article key={item.id} className={item.from === "workshop" ? "workshop" : "customer"}><strong>{item.from === "workshop" ? "Grandynamic workshop" : "You"}</strong><p>{item.message}</p><small>{new Date(item.createdAt).toLocaleString()}</small></article>)}{!messages.length && <p>No messages yet. You can contact the workshop below.</p>}</div>
          <label className="af-project-message-label">Your message<textarea rows={3} maxLength={1000} value={message} onChange={e => setMessage(e.target.value)} placeholder="Write a message about this project…"/></label>
          <button className="af-button" type="button" disabled={!message.trim() || sending} onClick={() => void send()}>{sending ? "Sending…" : "Send to Grandynamic"}</button>
          {notice && <p className="af-form-message" role="status">{notice}</p>}
        </article>
      </>}
      <p className="af-project-footnote">Keep this link private. Anyone with the link can view the project progress shown here.</p>
    </section>
    <footer className="af-footer"><div><strong>GRANDYNAMIC</strong><p>Thoughtful metalwork. Made for the job.</p></div><Link href="/">Return to Grandynamic ↗</Link></footer>
  </main>;
}
