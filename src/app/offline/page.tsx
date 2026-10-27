import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="af-site">
      <header className="af-header">
        <Link href="/" className="af-brand">
          <span className="af-brand-mark">G<span>✦</span></span>
          <span><strong>GRANDYNAMIC</strong><small>WELDING · FABRICATION</small></span>
        </Link>
      </header>
      <section className="af-page-intro af-compact">
        <p className="af-eyebrow">GRANDYNAMIC · OFFLINE MODE</p>
        <h1>You’re offline.<br /><em>Your project can wait.</em></h1>
        <p>Previously loaded pages may still be available on this device. Reconnect before submitting an enquiry, and wait for the on-screen confirmation that it was saved.</p>
        <div className="af-hero-actions">
          <Link className="af-button" href="/enquiry">Prepare a project enquiry</Link>
          <Link className="af-button af-button-outline" href="/">Return to Grandynamic</Link>
        </div>
      </section>
    </main>
  );
}
