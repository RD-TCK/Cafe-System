"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  Coffee,
  CalendarDays,
  Search,
  QrCode,
  Menu as MenuIcon,
  X,
  UtensilsCrossed,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-stone-950/90 backdrop-blur-md border-b border-stone-800 shadow-xl"
          : "bg-transparent border-b border-white/5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center space-x-3 group focus:outline-none"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-stone-950 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform duration-200">
              <Coffee className="w-6 h-6" />
            </div>
            <div>
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-stone-100 flex items-center gap-1.5">
                The Roasted Bean
              </span>
              <span className="text-[10px] tracking-widest uppercase font-semibold text-amber-500/90 block">
                Café & Roastery
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <Link
              href="/"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/"
                  ? "text-amber-400 bg-stone-900/80"
                  : "text-stone-300 hover:text-white hover:bg-stone-900/40"
              }`}
            >
              Home
            </Link>
            <Link
              href="/menu"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                pathname === "/menu"
                  ? "text-amber-400 bg-stone-900/80"
                  : "text-stone-300 hover:text-white hover:bg-stone-900/40"
              }`}
            >
              <UtensilsCrossed className="w-4 h-4" />
              Menu & Pricing
            </Link>
            <Link
              href="/reserve"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                pathname === "/reserve"
                  ? "text-amber-400 bg-stone-900/80"
                  : "text-stone-300 hover:text-white hover:bg-stone-900/40"
              }`}
            >
              <CalendarDays className="w-4 h-4 text-amber-500" />
              Reserve Table
            </Link>
            <Link
              href="/my-booking"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                pathname === "/my-booking"
                  ? "text-amber-400 bg-stone-900/80"
                  : "text-stone-300 hover:text-white hover:bg-stone-900/40"
              }`}
            >
              <Search className="w-4 h-4" />
              Lookup Booking
            </Link>
            <Link
              href="/table"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                pathname?.startsWith("/table")
                  ? "text-amber-400 bg-stone-900/80"
                  : "text-stone-300 hover:text-white hover:bg-stone-900/40"
              }`}
            >
              <QrCode className="w-4 h-4 text-emerald-400" />
              In-Café QR Order
            </Link>
          </nav>

          {/* Customer Call to Action */}
          <div className="hidden md:flex items-center space-x-3">
            <Link
              href="/reserve"
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 shadow-md shadow-amber-500/20 hover:shadow-amber-500/30 transition-all duration-200 flex items-center gap-2"
            >
              <CalendarDays className="w-4 h-4" />
              <span>Book a Table</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center space-x-2">
            <Link
              href="/reserve"
              className="px-3 py-1.5 rounded-lg bg-amber-500 text-stone-950 text-xs font-bold flex items-center gap-1 shadow-sm"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Book</span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-stone-900 text-stone-300 hover:text-white border border-stone-800 focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-stone-950/95 border-b border-stone-800 px-4 pt-2 pb-6 space-y-2 backdrop-blur-xl">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-base font-medium text-stone-200 hover:bg-stone-900"
          >
            Home
          </Link>
          <Link
            href="/menu"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-base font-medium text-stone-200 hover:bg-stone-900 flex items-center gap-2"
          >
            <UtensilsCrossed className="w-5 h-5 text-amber-500" />
            Menu & Pricing
          </Link>
          <Link
            href="/reserve"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-base font-medium text-amber-400 hover:bg-stone-900 flex items-center gap-2"
          >
            <CalendarDays className="w-5 h-5 text-amber-500" />
            Reserve a Table
          </Link>
          <Link
            href="/my-booking"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-base font-medium text-stone-200 hover:bg-stone-900 flex items-center gap-2"
          >
            <Search className="w-5 h-5 text-stone-400" />
            Find / Reschedule Booking
          </Link>
          <Link
            href="/table"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-base font-medium text-emerald-400 hover:bg-stone-900 flex items-center gap-2"
          >
            <QrCode className="w-5 h-5 text-emerald-400" />
            Scan Table QR / Dine-in Order
          </Link>
        </div>
      )}
    </header>
  );
}
