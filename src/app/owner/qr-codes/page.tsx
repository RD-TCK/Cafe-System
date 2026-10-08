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
  Copy,
  Check,
  ExternalLink,
  Layers,
  RefreshCw,
  Eye,
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
  const [selectedSection, setSelectedSection] = useState("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadAllTableQRs = async () => {
    setLoading(true);
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
              width: 450,
              margin: 2,
              color: {
                dark: "#1c1917",
                light: "#ffffff",
              },
            });
          } catch (qrErr) {
            qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=450x450&data=${encodeURIComponent(
              targetUrl
            )}`;
          }

          qrList.push({
            id: tbl.id,
            tableNumber: tbl.tableNumber,
            name: tbl.name,
            section: tbl.section || "Main Dining Hall",
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
  };

  useEffect(() => {
    loadAllTableQRs();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = (targetUrl: string, id: string) => {
    navigator.clipboard.writeText(targetUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadQR = (qrDataUrl: string, tableNumber: string) => {
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `QR-Table-${tableNumber}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const sections = ["ALL", ...Array.from(new Set(tablesWithQR.map((t) => t.section)))];
  const filteredTables =
    selectedSection === "ALL"
      ? tablesWithQR
      : tablesWithQR.filter((t) => t.section === selectedSection);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-[#FAF7F2] min-h-screen text-stone-900">
      {/* Top Header Controls (Hidden on Print) */}
      <div className="print:hidden flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200/90 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/owner/dashboard"
              className="text-stone-600 hover:text-stone-900 text-xs flex items-center gap-1 font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-amber-700" /> Back to Dashboard
            </Link>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-stone-900 flex items-center gap-2.5">
            <QrCode className="w-7 h-7 text-amber-600" />
            <span>Table QR Code & Stand Card Manager</span>
          </h1>
          <p className="text-xs text-stone-500">
            Generate, preview, download, and print table tent cards for contactless customer ordering.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={loadAllTableQRs}
            className="p-3 rounded-2xl bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-700 hover:text-stone-900 transition-colors"
            title="Refresh QRs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handlePrint}
            disabled={loading || tablesWithQR.length === 0}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-sm shadow-md shadow-amber-600/20 flex items-center gap-2 transition-all disabled:opacity-40"
          >
            <Printer className="w-4 h-4" />
            <span>Print All Table Stand Cards</span>
          </button>
        </div>
      </div>

      {/* Section Filter Pills (Hidden on Print) */}
      <div className="print:hidden flex items-center gap-2 overflow-x-auto pb-2">
        <div className="text-xs font-bold text-stone-700 flex items-center gap-1.5 mr-2">
          <Layers className="w-4 h-4 text-amber-600" />
          <span>Floor Section:</span>
        </div>
        {sections.map((sec) => (
          <button
            key={sec}
            onClick={() => setSelectedSection(sec)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
              selectedSection === sec
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-white text-stone-700 hover:bg-stone-100 border border-stone-200"
            }`}
          >
            {sec === "ALL" ? `All Tables (${tablesWithQR.length})` : sec}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-24 text-center space-y-3 print:hidden">
          <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-stone-500">Loading vector QR codes for floor tables...</p>
        </div>
      ) : filteredTables.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl text-stone-500 text-sm border border-stone-200 print:hidden">
          No active tables found for this section.
        </div>
      ) : (
        /* Printable QR Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:grid-cols-2 print:gap-4 print:p-0">
          {filteredTables.map((item) => (
            <div
              key={item.id}
              className="bg-white text-stone-950 rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-between text-center border-2 border-stone-200 shadow-md print:shadow-none print:border-stone-400 print:break-inside-avoid print:p-6"
            >
              {/* Card Header Branding */}
              <div className="space-y-1 w-full pb-4 border-b border-stone-200">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-stone-900 text-amber-400 flex items-center justify-center shadow">
                    <Coffee className="w-4 h-4" />
                  </div>
                  <span className="font-serif text-lg font-bold tracking-tight text-stone-900">
                    The Roasted Bean
                  </span>
                </div>
                <div className="text-[10px] uppercase font-bold tracking-widest text-amber-700">
                  Café & Roastery • Indiranagar
                </div>
              </div>

              {/* Table Big Number & Details */}
              <div className="my-4 space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-widest text-stone-500">
                  Table Number
                </div>
                <div className="font-mono text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-wider">
                  {item.tableNumber}
                </div>
                <div className="text-xs font-semibold text-stone-700">
                  {item.name} • {item.section} (Seats {item.capacityMin}–{item.capacityMax})
                </div>
              </div>

              {/* QR Code Container */}
              <div className="p-3 bg-stone-50 rounded-2xl border-2 border-stone-100 shadow-inner">
                <img
                  src={item.qrDataUrl}
                  alt={`QR Code for Table ${item.tableNumber}`}
                  className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
                />
              </div>

              {/* Scan Instructions */}
              <div className="mt-4 space-y-1 w-full pt-3 border-t border-stone-200">
                <div className="text-xs font-bold text-stone-900 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Scan to Order Contactlessly</span>
                </div>
                <p className="text-[11px] text-stone-600 leading-snug">
                  Point phone camera to browse live menu, customize & place instant orders to the kitchen.
                </p>
              </div>

              {/* Action Buttons (Hidden on Print) */}
              <div className="print:hidden w-full pt-4 mt-2 border-t border-stone-100 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadQR(item.qrDataUrl, item.tableNumber)}
                  className="py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
                  title="Download PNG QR Image"
                >
                  <Download className="w-3.5 h-3.5 text-stone-600" />
                  <span>PNG</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyLink(item.targetUrl, item.id)}
                  className="py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
                  title="Copy table link"
                >
                  {copiedId === item.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-stone-600" />
                      <span>Link</span>
                    </>
                  )}
                </button>

                <Link
                  href={`/table/${item.id}`}
                  target="_blank"
                  className="py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                  title="Test Live Customer View"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-700" />
                  <span>Test</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
