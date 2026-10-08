import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";

import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";

const fontSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const fontDisplay = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const SITE_DESCRIPTION =
  "MindLoop Lab helps you visualize thought loops, separate facts from assumptions, review predictions, and turn overwhelming thoughts into practical next steps.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "MindLoop Lab",
  title: {
    default: "MindLoop Lab — Understand Your Overthinking Patterns",
    template: "%s — MindLoop Lab",
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "MindLoop Lab",
    title: "MindLoop Lab — Understand Your Overthinking Patterns",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "MindLoop Lab — Understand Your Overthinking Patterns",
    description: SITE_DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F6FA" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0C14" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${fontSans.variable} ${fontDisplay.variable}`}>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
