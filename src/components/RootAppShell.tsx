"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ConnectionBanner } from "@/components/ConnectionBanner";

export function RootAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOwnerPortal = pathname?.startsWith("/owner");

  return (
    <>
      {!isOwnerPortal && <Navbar />}
      <main className="flex-grow">{children}</main>
      {!isOwnerPortal && <Footer />}
      <ConnectionBanner />
    </>
  );
}
