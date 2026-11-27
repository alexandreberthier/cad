import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "ElektroCAD – Raum- & Elektroplanung",
  description:
    "Local-First PWA für 2D/3D Elektro- und Raumplanung – offlinefähig für Baustelle und Büro.",
  applicationName: "ElektroCAD",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ElektroCAD",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#e8eef4",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`${dmSans.variable} ${fraunces.variable} ${plexMono.variable} h-full`}
    >
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
