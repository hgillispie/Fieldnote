import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Instrument_Sans, Inter } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import "./globals.css";

const display = Instrument_Sans({
  variable: "--font-display",
  subsets: ["latin"],
});

const body = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fieldnote — Gear for the long way round",
  description:
    "Outdoor and travel gear built for the long haul. Shop jackets, packs, footwear and more.",
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-surface text-ink">
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
