import type { Metadata } from "next";
import FinancePortal from "@/components/FinancePortal";

export const metadata: Metadata = {
  title: "Finance & records",
  description: "Private Grandynamic quotations, invoices, receipts, payments and expenses.",
  robots: { index: false, follow: false },
};

export default function FinancePage() {
  return <FinancePortal />;
}
