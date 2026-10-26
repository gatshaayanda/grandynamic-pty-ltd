import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import PwaRegister from "@/app/pwa-register";
import "./globals.css";
import "./pwa.css";

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://grandynamic-pty-ltd.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Grandynamic Pty Ltd | Welding & Steel Fabrication", template: "%s | Africhiko" },
  description: "Grandynamic Pty Ltd — welding, steel fabrication and custom metalwork in Botswana. Browse services and submit a project brief for review and quotation.",
  applicationName: "Grandynamic Pty Ltd",
  keywords: ["Grandynamic Pty Ltd", "Botswana steel fabrication", "welding", "gates", "steel structures"],
  alternates: { canonical: "/" },
  openGraph: { type: "website", url: siteUrl, siteName: "Grandynamic Pty Ltd", title: "Grandynamic Pty Ltd | Welding & Steel Fabrication", description: "Welding and steel fabrication in Botswana. Tell us about your project and request a quotation." },
  twitter: { card: "summary", title: "Grandynamic Pty Ltd | Welding & Steel Fabrication", description: "Welding and steel fabrication in Botswana. Tell us about your project and request a quotation." },
  icons: { icon: "/grandynamic-icon.svg", apple: "/grandynamic-icon.svg" },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Grandynamic Pty Ltd", statusBarStyle: "default" },
};

export const viewport: Viewport = { themeColor: "#d45113", colorScheme: "light" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><PwaRegister />{children}<Analytics /><SpeedInsights /></body></html>;
}
