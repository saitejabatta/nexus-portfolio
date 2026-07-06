import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SITE_URL, personJsonLd } from "@/lib/seo";
import { ServiceWorkerRegister } from "@/components/system/ServiceWorkerRegister";

const display = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

const TITLE = "NEXUS — Sai Teja · AI Engineer";
const DESCRIPTION =
  "An AI portfolio you can talk to. Ask anything and watch the RAG pipeline think in real time.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "%s · NEXUS" },
  description: DESCRIPTION,
  applicationName: "NEXUS",
  authors: [{ name: "Sai Teja" }],
  creator: "Sai Teja",
  keywords: [
    "AI Engineer",
    "RAG",
    "Retrieval-Augmented Generation",
    "Portfolio",
    "Machine Learning",
    "Full-Stack",
    "Sai Teja",
  ],
  alternates: { canonical: "/" },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "NEXUS", statusBarStyle: "black-translucent" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: TITLE,
    description: DESCRIPTION,
    siteName: "NEXUS",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  themeColor: "#05070d",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {/* Accessibility: skip straight to the conversation */}
        <a
          href="#nexus-main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-md focus:border focus:border-cyan/50 focus:bg-bg-elevated focus:px-4 focus:py-2 focus:font-mono focus:text-sm focus:text-cyan"
        >
          Skip to chat
        </a>

        {children}

        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd()) }}
        />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
