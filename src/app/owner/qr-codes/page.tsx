"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Printer,
  Coffee,
  ArrowLeft,
  QrCode,
  Sparkles,
  Download,
  Share2,
} from "lucide-react";
import QRCode from "qrcode";

interface TableQRItem {
  id: string;
  tableNumber: string;
  name: string;
  section: string;
  capacityMin: number;
  capacityMax: number;
  qrDataUrl: string;
  targetUrl: string;
}

export default function OwnerQRCodesPage() {
  const [tablesWithQR, setTablesWithQR] = useState<TableQRItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAllTableQRs() {
      try {
        const res = await fetch("/api/tables");
        const data = await res.json();

        if (data.success && data.data) {
          const origin = window.location.origin;
          const qrList: TableQRItem[] = [];

          for (const tbl of data.data) {
            const targetUrl = `${origin}/table/${tbl.id}`;
            let qrDataUrl = "";
            try {
              qrDataUrl = await QRCode.toDataURL(targetUrl, {
                width: 400,
                margin: 2,
                color: {
                  dark: "#1c1917",
                  light: "#ffffff",
                },
              });
            } catch (qrErr) {
              console.error("Local QR generation fallback for table", tbl.tableNumber, qrErr);
              qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(
                targetUrl
              )}`;
            }

            qrList.push({
              id: tbl.id,
              tableNumber: tbl.tableNumber,
              name: tbl.name,
              section: tbl.section,
              capacityMin: tbl.capacityMin,
              capacityMax: tbl.capacityMax,
              qrDataUrl,
              targetUrl,
            });
          }

          setTablesWithQR(qrList);
        }
      } catch (err) {
        console.error("Failed to load tables", err);
      } finally {
        setLoading(false);
      }
    }

    loadAllTableQRs();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Top Header Controls (Hidden on Print) */}
      <div className="print:hidden flex flex-wrap items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-stone-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/owner/dashboard"
              className="text-stone-400 hover:text-white text-xs flex items-center gap-1 font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Link>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-100 flex items-center gap-2.5">
            <QrCode className="w-7 h-7 text-amber-500" />
            <span>Printable Table QR Stand Cards</span>
          </h1>
          <p className="text-xs text-stone-400">
            High-resolution scannable QR stands ready to print and place on café tables.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            disabled={loading || tablesWithQR.length === 0}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-sm shadow-xl shadow-amber-500/20 flex items-center gap-2 transition-all disabled:opacity-40"
          >
            <Printer className="w-4 h-4" />
            <span>Print All Table Stands</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center space-y-3 print:hidden">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-stone-400">Generating high-res vector QR codes for all tables...</p>
        </div>
      ) : tablesWithQR.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-3xl text-stone-400 text-sm">
          No active tables found.
        </div>
      ) : (
        /* Printable QR Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:grid-cols-2 print:gap-4 print:p-0">
          {tablesWithQR.map((item) => (
            <div
              key={item.id}
              className="bg-white text-stone-950 rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-between text-center border-2 border-stone-200 shadow-xl print:shadow-none print:border-stone-400 print:break-inside-avoid print:p-6"
            >
              {/* Card Header Branding */}
              <div className="space-y-1 w-full pb-4 border-b border-stone-200">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-stone-950 text-amber-500 flex items-center justify-center shadow">
                    <Coffee className="w-4 h-4" />
                  </div>
                  <span className="font-serif text-lg font-bold tracking-tight text-stone-900">
                    The Roasted Bean
                  </span>
                </div>
                <div className="text-[10px] uppercase font-bold tracking-widest text-amber-700">
                  Café & Roastery
                </div>
              </div>

              {/* Table Big Number & Details */}
              <div className="my-5 space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-widest text-stone-500">
                  Table Number
                </div>
                <div className="font-mono text-3xl sm:text-4xl font-extrabold text-stone-950 tracking-wider">
                  {item.tableNumber}
                </div>
                <div className="text-xs font-semibold text-stone-700">
                  {item.name} • {item.section || "Main Dining Hall"}
                </div>
              </div>

              {/* QR Code */}
              <div className="p-3 bg-stone-50 rounded-2xl border-2 border-stone-100 shadow-inner">
                <img
                  src={item.qrDataUrl}
                  alt={`QR Code for Table ${item.tableNumber}`}
                  className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
                />
              </div>

              {/* Scan Instructions */}
              <div className="mt-5 space-y-1 w-full pt-4 border-t border-stone-200">
                <div className="text-xs font-bold text-stone-900 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Scan to Order Contactlessly</span>
                </div>
                <p className="text-[11px] text-stone-600 leading-snug">
                  Point phone camera to browse live menu, customize & place instant orders to the kitchen.
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
