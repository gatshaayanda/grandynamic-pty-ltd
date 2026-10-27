"use client";

import { GoogleAuthProvider, onAuthStateChanged, signInWithCustomToken, signInWithPopup, signOut, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState, type FormEvent } from "react";
import { auth, db, hasFirebaseWebConfig } from "@/lib/firebase/client";

const ALLOWED_ADMIN_EMAILS = ["gatshaayanda@gmail.com"];
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

async function verifyAdminAccess(user: User) {
  const email = String(user.email || "").trim().toLowerCase();
  if (!ALLOWED_ADMIN_EMAILS.includes(email)) {
    throw new Error("This account is not authorized for Grandynamic workshop operations.");
  }

  const token = await user.getIdToken();
  const response = await fetch("/api/admin/access", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof result.error === "string" ? result.error : "Grandynamic could not verify admin access.");
  }

  const role = await getDoc(doc(db, "admins", user.uid));
  if (!role.exists() || !["owner", "staff"].includes(String(role.data().role))) {
    throw new Error("Your account has no authorized Grandynamic workshop role.");
  }
}

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");

  useEffect(() => {
    return onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAuthorized(false);
      if (!nextUser) {
        setChecking(false);
        return;
      }

      setChecking(true);
      setError("");
      try {
        await verifyAdminAccess(nextUser);
        setAuthorized(true);
      } catch (err) {
        setAuthorized(false);
        setError(err instanceof Error ? err.message : "We could not verify this account.");
        await signOut(auth);
      } finally {
        setChecking(false);
      }
    });
  }, []);

  async function signInWithGoogle() {
    if (!hasFirebaseWebConfig) {
      setError("Admin sign-in is not configured yet. Please contact the site owner.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const code = err && typeof err === "object" && "code" in err ? String(err.code) : "";
      setError(code === "auth/popup-closed-by-user"
        ? "Google sign-in was cancelled."
        : err instanceof Error ? err.message : "Google sign-in could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  async function signInWithAdminPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasFirebaseWebConfig) {
      setError("Admin sign-in is not configured yet. Please contact the site owner.");
      return;
    }
    if (!adminPassword.trim()) {
      setError("Enter the admin password.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/password-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPassword }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || typeof result.customToken !== "string") {
        throw new Error(typeof result.error === "string" ? result.error : "Admin sign-in could not be completed.");
      }
      await signInWithCustomToken(auth, result.customToken);
      setAdminPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Admin sign-in could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  if (checking) return <main className="adminPage"><div className="adminShell"><div className="emptyState"><div>🔐</div><h1>Opening Operations</h1><p>Checking access…</p></div></div></main>;

  if (user && authorized) {
    return <div className="adminAuthorized"><div className="adminAccountBar"><span>Signed in as {user.email ?? "authorized staff"}</span><button className="button buttonLight" type="button" onClick={() => void signOut(auth)}>Sign out</button></div>{children}</div>;
  }

  return <main className="adminPage"><div className="adminShell"><section className="adminPanel" style={{ maxWidth: 520, margin: "80px auto" }}>
    <span className="kicker">GRANDYNAMIC · Operations</span>
    <h1>Sign in to Operations</h1>
    <p>Use the approved admin password or continue with your authorized Google account to manage fabrication enquiries and workshop content.</p>
    {error && <p role="alert">{error}</p>}
    <form onSubmit={signInWithAdminPassword} style={{ display: "grid", gap: 10, marginTop: 20 }}>
      <label htmlFor="admin-password">Admin password</label>
      <input id="admin-password" name="password" type="password" autoComplete="current-password" value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} required className="formInput" />
      <button className="button buttonPrimary" type="submit" disabled={busy}>{busy ? "Signing in…" : "Admin sign in"}</button>
    </form>
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "18px 0", fontSize: 12, opacity: 0.7 }}><span style={{ flex: 1, height: 1, background: "currentColor" }} />OR<span style={{ flex: 1, height: 1, background: "currentColor" }} /></div>
    <button className="button buttonLight" type="button" onClick={() => void signInWithGoogle()} disabled={busy}>{busy ? "Please wait…" : "Continue with Google ↗"}</button>
    <p style={{ fontSize: 13, marginTop: 16 }}>Workshop access is limited to approved Grandynamic admin credentials.</p>
  </section></div></main>;
}
