"use client";

import { useEffect } from "react";

export default function DemoTablePage() {
  useEffect(() => {
    window.location.href = "/table";
  }, []);

  return (
    <div className="min-h-[50vh] flex items-center justify-center text-stone-400 text-sm">
      <div className="space-y-3 text-center">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p>Loading café tables...</p>
      </div>
    </div>
  );
}
