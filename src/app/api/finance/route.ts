import { NextResponse } from "next/server";
import { notificationServices } from "@/lib/server/firebase-admin";

export const runtime = "nodejs";

const ALLOWED_EMAILS = new Set(["gatshaayanda@gmail.com"]);
const QUOTE_STATES = new Set(["Draft", "Sent", "Accepted", "Declined", "Expired"]);
const EXPENSE_CATEGORIES = new Set(["Materials", "Labour", "Transport", "Tools & equipment", "Workshop", "Utilities", "Other"]);
type Line = { name: string; description: string; quantity: number; unitPrice: number; total: number };

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
function amount(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
}
function validLines(value: unknown): Line[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 30) throw new Error("Add between 1 and 30 quote line items.");
  return value.map((item: any) => {
    const name = clean(item?.name, 160);
    const description = clean(item?.description, 500);
    const quantity = Number(item?.quantity);
    const unitPrice = amount(item?.unitPrice);
    if (!name || !Number.isInteger(quantity) || quantity < 1 || quantity > 10000 || !Number.isFinite(unitPrice) || unitPrice < 0) {
      throw new Error("Each line needs a description, a whole-number quantity and a non-negative BWP unit price.");
    }
    return { name, description, quantity, unitPrice, total: Math.round(quantity * unitPrice * 100) / 100 };
  });
}
function totals(lines: Line[], settings: any) {
  const total = Math.round(lines.reduce((sum, line) => sum + line.total, 0) * 100) / 100;
  const registered = settings?.vatRegistered === true && Number(settings?.vatRate) > 0 && clean(settings?.vatNumber, 80);
  const rate = registered ? Number(settings.vatRate) : 0;
  const vatAmount = registered ? Math.round((total * rate / (100 + rate)) * 100) / 100 : 0;
  return { subtotal: total, vatRegistered: registered, vatRate: rate, vatAmount, total };
}
async function requireStaff(request: Request) {
  const match = (request.headers.get("authorization") || "").match(/^Bearer\s+(.+)$/i);
  if (!match) throw new Error("SIGN_IN_REQUIRED");
  const { auth, db } = notificationServices();
  const user = await auth.verifyIdToken(match[1]);
  const email = String(user.email || "").trim().toLowerCase();
  if (!ALLOWED_EMAILS.has(email) && user.uid !== "grandynamic-one-word-admin") throw new Error("ACCESS_DENIED");
  const role = await db.doc("admins/" + user.uid).get();
  if (!role.exists || !["owner", "staff"].includes(String(role.data()?.role || "").toLowerCase())) throw new Error("ACCESS_DENIED");
  return { user, db };
}
function failure(error: unknown) {
  const message = error instanceof Error ? error.message : "Finance operation failed.";
  const status = message === "SIGN_IN_REQUIRED" ? 401 : message === "ACCESS_DENIED" ? 403 : 400;
  return NextResponse.json({ error: status === 401 ? "Sign in to Grandynamic Operations again." : status === 403 ? "Your account is not authorized for finance records." : message }, { status, headers: { "Cache-Control": "no-store" } });
}
async function rows(db: FirebaseFirestore.Firestore, name: string) {
  const snap = await db.collection(name).get();
  return snap.docs.map(item => ({ id: item.id, ...item.data() })).sort((a: any, b: any) => String(b.createdAt || b.issuedAt || "").localeCompare(String(a.createdAt || a.issuedAt || "")));
}
function businessSnapshot(settings: any) {
  return {
    businessName: clean(settings?.businessName, 120) || "Grandynamic Pty Ltd",
    address: clean(settings?.address, 300),
    phone: clean(settings?.phone, 60),
    email: clean(settings?.email, 160),
    tin: clean(settings?.tin, 80),
    vatRegistered: settings?.vatRegistered === true && Boolean(clean(settings?.vatNumber, 80)),
    vatNumber: clean(settings?.vatNumber, 80),
    vatRate: Number(settings?.vatRate) || 0,
  };
}

export async function GET(request: Request) {
  try {
    const { db } = await requireStaff(request);
    const [settings, quotes, invoices, payments, receipts, expenses] = await Promise.all([
      db.doc("financeSettings/business").get(),
      rows(db, "quotes"),
      rows(db, "invoices"),
      rows(db, "payments"),
      rows(db, "receipts"),
      rows(db, "expenses"),
    ]);
    return NextResponse.json({ settings: settings.exists ? settings.data() : {}, quotes, invoices, payments, receipts, expenses }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return failure(error); }
}

export async function POST(request: Request) {
  try {
    const { user, db } = await requireStaff(request);
    const body = await request.json().catch(() => ({}));
    const action = clean(body?.action, 40);
    const now = new Date().toISOString();

    if (action === "save-settings") {
      const businessName = clean(body.businessName, 120);
      const vatRegistered = body.vatRegistered === true;
      const vatNumber = clean(body.vatNumber, 80);
      const vatRate = amount(body.vatRate || 0);
      if (!businessName) throw new Error("Enter the legal or trading name to show on documents.");
      if (vatRegistered && (!vatNumber || !Number.isFinite(vatRate) || vatRate <= 0 || vatRate > 100)) throw new Error("A VAT-registered business needs its VAT number and a valid VAT rate.");
      const data = {
        businessName, address: clean(body.address, 300), phone: clean(body.phone, 60),
        email: clean(body.email, 160), tin: clean(body.tin, 80), vatRegistered,
        vatNumber: vatRegistered ? vatNumber : "", vatRate: vatRegistered ? vatRate : 0,
        invoicePrefix: clean(body.invoicePrefix, 12) || "GD-INV",
        quotePrefix: clean(body.quotePrefix, 12) || "GD-QT",
        receiptPrefix: clean(body.receiptPrefix, 12) || "GD-RC",
        updatedAt: now, updatedBy: user.uid,
      };
      await db.doc("financeSettings/business").set(data, { merge: true });
      return NextResponse.json({ settings: data });
    }

    if (action === "create-quote") {
      const customerName = clean(body.customerName, 120);
      const phone = clean(body.phone, 60);
      const email = clean(body.email, 160);
      const project = clean(body.project, 180);
      const notes = clean(body.notes, 2000);
      if (!customerName || !phone || !project) throw new Error("Enter the customer name, phone number and project title.");
      const lines = validLines(body.lines);
      const settingsSnap = await db.doc("financeSettings/business").get();
      const settings = businessSnapshot(settingsSnap.data() || {});
      const calc = totals(lines, settings);
      const ref = db.collection("quotes").doc();
      const counter = db.doc("financeCounters/quotes");
      const quoteNumber = await db.runTransaction(async tx => {
        const current = await tx.get(counter);
        const next = Number(current.data()?.value || 0) + 1;
        const prefix = clean(settingsSnap.data()?.quotePrefix, 12) || "GD-QT";
        const number = prefix + "-" + String(next).padStart(5, "0");
        tx.set(counter, { value: next, updatedAt: now });
        tx.create(ref, { quoteNumber: number, customerName, phone, email, project, notes, lines, ...calc, business: settings, status: "Draft", createdAt: now, updatedAt: now, createdBy: user.uid });
        return number;
      });
      return NextResponse.json({ id: ref.id, quoteNumber }, { status: 201 });
    }

    if (action === "update-quote-status") {
      const id = clean(body.id, 100);
      const status = clean(body.status, 30);
      if (!id || !QUOTE_STATES.has(status)) throw new Error("Choose a valid quote and status.");
      const ref = db.doc("quotes/" + id);
      const snap = await ref.get();
      if (!snap.exists) throw new Error("Quote not found.");
      await ref.update({ status, updatedAt: now, updatedBy: user.uid });
      return NextResponse.json({ id, status });
    }

    if (action === "issue-invoice") {
      const quoteId = clean(body.quoteId, 100);
      if (!quoteId) throw new Error("Choose a quote to invoice.");
      const quoteRef = db.doc("quotes/" + quoteId);
      const invoiceRef = db.collection("invoices").doc();
      const counter = db.doc("financeCounters/invoices");
      const result = await db.runTransaction(async tx => {
        const quoteSnap = await tx.get(quoteRef);
        const counterSnap = await tx.get(counter);
        if (!quoteSnap.exists) throw new Error("Quote not found.");
        const quote = quoteSnap.data()!;
        if (quote.status !== "Accepted") throw new Error("Only a quote marked Accepted can be invoiced.");
        if (quote.invoiceId) throw new Error("An invoice has already been issued for this quote.");
        const next = Number(counterSnap.data()?.value || 0) + 1;
        const settings = quote.business || {};
        const number = (clean(settings.invoicePrefix, 12) || "GD-INV") + "-" + String(next).padStart(5, "0");
        const invoice = {
          invoiceNumber: number, quoteId, quoteNumber: quote.quoteNumber,
          customerName: quote.customerName, phone: quote.phone, email: quote.email,
          project: quote.project, notes: quote.notes, lines: quote.lines,
          subtotal: quote.subtotal, vatRegistered: quote.vatRegistered,
          vatRate: quote.vatRate, vatAmount: quote.vatAmount, total: quote.total,
          amountPaid: 0, balanceDue: quote.total, status: "Unpaid",
          business: settings, issuedAt: now, createdAt: now, updatedAt: now, createdBy: user.uid,
        };
        tx.set(counter, { value: next, updatedAt: now });
        tx.create(invoiceRef, invoice);
        tx.update(quoteRef, { invoiceId: invoiceRef.id, status: "Invoiced", updatedAt: now });
        return { id: invoiceRef.id, invoiceNumber: number };
      });
      return NextResponse.json(result, { status: 201 });
    }

    if (action === "record-payment") {
      const invoiceId = clean(body.invoiceId, 100);
      const paid = amount(body.amount);
      const method = clean(body.method, 40);
      const reference = clean(body.reference, 120);
      const receivedAt = clean(body.receivedAt, 30) || now;
      if (!invoiceId || !Number.isFinite(paid) || paid <= 0 || !["Cash", "Orange Money", "Bank transfer", "Card", "Other"].includes(method)) throw new Error("Enter a valid payment amount and payment method.");
      const invoiceRef = db.doc("invoices/" + invoiceId);
      const paymentRef = db.collection("payments").doc();
      const receiptRef = db.collection("receipts").doc();
      const counter = db.doc("financeCounters/receipts");
      const receipt = await db.runTransaction(async tx => {
        const invoiceSnap = await tx.get(invoiceRef);
        const counterSnap = await tx.get(counter);
        if (!invoiceSnap.exists) throw new Error("Invoice not found.");
        const invoice = invoiceSnap.data()!;
        const balance = Math.max(0, Math.round((Number(invoice.total || 0) - Number(invoice.amountPaid || 0)) * 100) / 100);
        if (paid > balance + 0.01) throw new Error("Payment exceeds the outstanding invoice balance.");
        const next = Number(counterSnap.data()?.value || 0) + 1;
        const prefix = clean(invoice.business?.receiptPrefix, 12) || "GD-RC";
        const receiptNumber = prefix + "-" + String(next).padStart(5, "0");
        const newPaid = Math.round((Number(invoice.amountPaid || 0) + paid) * 100) / 100;
        const newBalance = Math.max(0, Math.round((Number(invoice.total || 0) - newPaid) * 100) / 100);
        const status = newBalance <= 0.01 ? "Paid" : "Partially paid";
        const payment = { invoiceId, invoiceNumber: invoice.invoiceNumber, customerName: invoice.customerName, amount: paid, method, reference, receivedAt, createdAt: now, createdBy: user.uid, receiptId: receiptRef.id, receiptNumber };
        tx.set(counter, { value: next, updatedAt: now });
        tx.create(paymentRef, payment);
        tx.create(receiptRef, { ...payment, id: receiptRef.id, business: invoice.business, project: invoice.project, receiptNumber });
        tx.update(invoiceRef, { amountPaid: newPaid, balanceDue: newBalance, status, updatedAt: now });
        return { id: receiptRef.id, ...payment, business: invoice.business, project: invoice.project };
      });
      return NextResponse.json({ receipt }, { status: 201 });
    }

    if (action === "create-expense" || action === "update-expense") {
      const description = clean(body.description, 180);
      const category = clean(body.category, 50);
      const paid = amount(body.amount);
      const supplier = clean(body.supplier, 140);
      const spentAt = clean(body.spentAt, 30) || now;
      const attachmentUrl = clean(body.attachmentUrl, 2048);
      if (!description || !EXPENSE_CATEGORIES.has(category) || !Number.isFinite(paid) || paid <= 0) throw new Error("Enter an expense description, category and positive BWP amount.");
      const data = { description, category, amount: paid, supplier, spentAt, reference: clean(body.reference, 120), notes: clean(body.notes, 1000), attachmentUrl, updatedAt: now, updatedBy: user.uid };
      if (action === "update-expense") {
        const id = clean(body.id, 100);
        if (!id) throw new Error("Choose an expense to update.");
        await db.doc("expenses/" + id).update(data);
        return NextResponse.json({ id });
      }
      const ref = db.collection("expenses").doc();
      await ref.create({ ...data, createdAt: now, createdBy: user.uid });
      return NextResponse.json({ id: ref.id }, { status: 201 });
    }

    throw new Error("Unknown finance action.");
  } catch (error) { return failure(error); }
}
