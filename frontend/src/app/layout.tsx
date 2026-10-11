import type { Metadata, Viewport } from "next";
import { Figtree, Fraunces } from "next/font/google";
import "./globals.css";
import { RegisterSW } from "@/components/pwa/RegisterSW";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
  style: ["normal", "italic"],
  display: "swap",
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Bloom: Try your next hair before you need it",
    template: "%s · Bloom",
  },
  description:
    "Before chemotherapy, make a hair passport, try matched wigs, head wraps and brows on your own face, and choose together with the people you love.",
  applicationName: "Bloom",
  appleWebApp: { capable: true, title: "Bloom", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#fbf6f2",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fraunces.variable} ${figtree.variable} antialiased`} suppressHydrationWarning>
      {/* suppressHydrationWarning: browser extensions (e.g. video speed controllers) add classes to <body> before React loads */}
      <body className="min-h-dvh" suppressHydrationWarning>
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
