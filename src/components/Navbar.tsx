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
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[#FAF7F2]/95 backdrop-blur-md border-b border-stone-200/80 shadow-sm"
          : "bg-[#FAF7F2]/80 backdrop-blur-sm border-b border-stone-200/40"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <Link
            href="/"
            className="flex items-center space-x-3 group focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center text-white shadow-md shadow-amber-600/20 group-hover:scale-105 transition-transform duration-200">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <span className="font-serif text-xl font-bold tracking-tight text-stone-900 flex items-center gap-1.5">
                The Roasted Bean
              </span>
              <span className="text-[10px] tracking-widest uppercase font-semibold text-amber-700 block">
                Café & Roastery
              </span>
            </div>
          </Link>

          {/* Clean Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <Link
              href="/"
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                pathname === "/"
                  ? "text-amber-700 bg-amber-500/10 font-bold"
                  : "text-stone-700 hover:text-stone-900 hover:bg-stone-200/60"
              }`}
            >
              Home
            </Link>
            <Link
              href="/menu"
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5 ${
                pathname === "/menu"
                  ? "text-amber-700 bg-amber-500/10 font-bold"
                  : "text-stone-700 hover:text-stone-900 hover:bg-stone-200/60"
              }`}
            >
              <UtensilsCrossed className="w-4 h-4 text-amber-600" />
              <span>Menu</span>
            </Link>
            <Link
              href="/reserve"
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5 ${
                pathname === "/reserve"
                  ? "text-amber-700 bg-amber-500/10 font-bold"
                  : "text-stone-700 hover:text-stone-900 hover:bg-stone-200/60"
              }`}
            >
              <CalendarDays className="w-4 h-4 text-amber-600" />
              <span>Reserve Table</span>
            </Link>
            <Link
              href="/my-booking"
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5 ${
                pathname === "/my-booking"
                  ? "text-amber-700 bg-amber-500/10 font-bold"
                  : "text-stone-700 hover:text-stone-900 hover:bg-stone-200/60"
              }`}
            >
              <Search className="w-4 h-4 text-stone-500" />
              <span>My Booking</span>
            </Link>
          </nav>

          {/* Clear Customer Actions */}
          <div className="hidden md:flex items-center space-x-3">
            <Link
              href="/table"
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-stone-50 text-stone-700 hover:text-emerald-700 border border-stone-300 shadow-sm transition-all duration-200 flex items-center gap-1.5"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-600" />
              <span>Dine-In QR</span>
            </Link>

            <Link
              href="/reserve"
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-md shadow-amber-600/25 transition-all duration-200 flex items-center gap-1.5"
            >
              <CalendarDays className="w-4 h-4" />
              <span>Book Table</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center space-x-2">
            <Link
              href="/reserve"
              className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-bold flex items-center gap-1 shadow-sm"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Book</span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-white text-stone-700 hover:text-stone-900 border border-stone-200 focus:outline-none shadow-sm"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/98 border-b border-stone-200 px-4 pt-3 pb-6 space-y-2 backdrop-blur-2xl shadow-xl">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-xl text-base font-medium text-stone-800 hover:bg-stone-100"
          >
            Home
          </Link>
          <Link
            href="/menu"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-xl text-base font-medium text-stone-800 hover:bg-stone-100 flex items-center gap-2"
          >
            <UtensilsCrossed className="w-5 h-5 text-amber-600" />
            Menu
          </Link>
          <Link
            href="/reserve"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-xl text-base font-semibold text-amber-700 hover:bg-amber-50 flex items-center gap-2"
          >
            <CalendarDays className="w-5 h-5 text-amber-600" />
            Reserve a Table
          </Link>
          <Link
            href="/my-booking"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-xl text-base font-medium text-stone-800 hover:bg-stone-100 flex items-center gap-2"
          >
            <Search className="w-5 h-5 text-stone-500" />
            Find My Booking
          </Link>
          <Link
            href="/table"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-xl text-base font-medium text-emerald-700 hover:bg-emerald-50 flex items-center gap-2"
          >
            <QrCode className="w-5 h-5 text-emerald-600" />
            Dine-In QR Order
          </Link>
          <div className="pt-3 border-t border-stone-200">
            <Link
              href="/owner/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-stone-600 hover:text-amber-700 hover:bg-stone-100 flex items-center justify-between"
            >
              <span>Staff / Owner Login</span>
              <span className="text-xs">&rarr;</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
