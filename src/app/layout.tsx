import type { Metadata } from "next";
import "./globals.css";
import { RootAppShell } from "@/components/RootAppShell";

export const metadata: Metadata = {
  title: "The Roasted Bean Café & Roastery | Artisanal Dining & Table Reservations",
  description:
    "Experience specialty single-origin coffees, gourmet breakfast, woodfired mains, and handcrafted pastries. Reserve tables online or order contactlessly with QR codes.",
  keywords: "cafe reservation, coffee shop Bangalore, artisan coffee, food ordering, live table QR ordering",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#FAF7F2] text-stone-900 selection:bg-amber-500 selection:text-white antialiased">
        <RootAppShell>{children}</RootAppShell>
      </body>
    </html>
  );
}
