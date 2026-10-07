"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  QrCode,
  UtensilsCrossed,
  Users,
  Sparkles,
  ArrowRight,
  Coffee,
  CheckCircle2,
  Layers,
  MapPin,
} from "lucide-react";

interface Table {
  id: string;
  tableNumber: string;
  name: string;
  capacityMin: number;
  capacityMax: number;
  section: string;
  description?: string;
  photoUrl?: string;
}

export default function TableSelectionPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState<string>("ALL");
  const [sections, setSections] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/tables")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTables(data.data);
          const uniqSections = Array.from(
            new Set(data.data.map((t: Table) => t.section).filter(Boolean))
          ) as string[];
          setSections(uniqSections);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredTables =
    selectedSection === "ALL"
      ? tables
      : tables.filter((t) => t.section === selectedSection);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider">
          <QrCode className="w-3.5 h-3.5" />
          <span>In-Café Digital Dining</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-100 tracking-tight">
          Select Your Table to Order
        </h1>
        <p className="text-sm text-stone-400 leading-relaxed">
          Sitting in our café? Choose your table below or scan the QR code on your table stand to browse the live menu and place orders straight to the kitchen.
        </p>
      </div>

      {/* Section Filters */}
      {sections.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setSelectedSection("ALL")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              selectedSection === "ALL"
                ? "bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20 font-bold"
                : "bg-stone-900/80 text-stone-300 hover:text-white hover:bg-stone-900 border border-stone-800"
            }`}
          >
            All Tables ({tables.length})
          </button>
          {sections.map((sec) => (
            <button
              key={sec}
              onClick={() => setSelectedSection(sec)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedSection === sec
                  ? "bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20 font-bold"
                  : "bg-stone-900/80 text-stone-300 hover:text-white hover:bg-stone-900 border border-stone-800"
              }`}
            >
              {sec} ({tables.filter((t) => t.section === sec).length})
            </button>
          ))}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-stone-400">Loading café floor tables...</p>
        </div>
      ) : filteredTables.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-3xl border border-stone-800 text-stone-400 text-sm">
          No tables found in this section.
        </div>
      ) : (
        /* Table Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredTables.map((t) => {
            // For convenience in testing/live demo, T-01 has demo code 7492
            const defaultVisitParam = t.tableNumber === "T-01" ? "?visit=7492" : "";
            return (
              <div
                key={t.id}
                className="glass-panel group rounded-3xl border border-stone-800/80 hover:border-amber-500/50 p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-1"
              >
                <div className="space-y-4">
                  {/* Table Number Badge & Capacity */}
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-lg font-mono group-hover:scale-105 group-hover:bg-amber-500/20 transition-all">
                      {t.tableNumber}
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-900 border border-stone-800 text-stone-300 text-xs font-medium">
                      <Users className="w-3.5 h-3.5 text-amber-500" />
                      <span>
                        {t.capacityMin}–{t.capacityMax} seats
                      </span>
                    </div>
                  </div>

                  {/* Name & Section */}
                  <div>
                    <h3 className="font-serif text-lg font-bold text-stone-100 group-hover:text-amber-400 transition-colors">
                      {t.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-stone-400 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-stone-500" />
                      <span>{t.section || "Main Dining Hall"}</span>
                    </div>
                  </div>

                  {/* Description if present */}
                  {t.description && (
                    <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed">
                      {t.description}
                    </p>
                  )}
                </div>

                {/* Action CTA */}
                <div className="pt-6 mt-4 border-t border-stone-800/80">
                  <Link
                    href={`/table/${t.id}${defaultVisitParam}`}
                    className="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-amber-500 hover:text-stone-950 text-stone-200 border border-stone-800 hover:border-amber-400 font-semibold text-xs transition-all duration-200 flex items-center justify-center gap-2 group-hover:border-amber-500/40"
                  >
                    <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400 group-hover:text-stone-950 transition-colors" />
                    <span>Open Table Menu</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info helper note */}
      <div className="glass-panel p-6 rounded-2xl border border-stone-800 text-center max-w-xl mx-auto space-y-2">
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Quick Note for In-Café Diners</span>
        </div>
        <p className="text-xs text-stone-400 leading-relaxed">
          When dining in person, staff provides a 4-digit Visit Code upon seating to protect your table bill. For testing and quick preview, Table <strong className="text-amber-400">T-01</strong> is preloaded with demo code <strong className="text-amber-400">7492</strong>.
        </p>
      </div>
    </div>
  );
}
