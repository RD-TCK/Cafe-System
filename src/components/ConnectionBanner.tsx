"use client";

import { useState, useEffect } from "react";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";

export function ConnectionBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl transition-all duration-300 flex items-center gap-3 text-sm font-medium ${
        isOnline
          ? "bg-emerald-950 border border-emerald-500/50 text-emerald-200"
          : "bg-red-950 border border-red-500/50 text-red-200 animate-pulse"
      }`}
    >
      {isOnline ? (
        <>
          <Wifi className="w-5 h-5 text-emerald-400" />
          <span>Connection restored. Live sync active.</span>
        </>
      ) : (
        <>
          <WifiOff className="w-5 h-5 text-red-400" />
          <span>Network disconnected. Live updates will resume on reconnect.</span>
          <button
            onClick={() => window.location.reload()}
            className="px-2 py-1 rounded bg-red-900/60 hover:bg-red-900 text-xs flex items-center gap-1 text-white ml-2"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </>
      )}
    </div>
  );
}
