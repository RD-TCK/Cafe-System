"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Coffee,
  CalendarDays,
  UtensilsCrossed,
  QrCode,
  Search,
  Sparkles,
  Clock,
  MapPin,
  ShieldCheck,
  ChevronRight,
  CheckCircle2,
  Users,
  Flame,
  Award,
} from "lucide-react";

export default function HomePage() {
  const [cafeInfo, setCafeInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cafe/info")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCafeInfo(data.data.settings);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-12">
        {/* Background glow and decorative elements */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900/20 via-stone-950/80 to-stone-950 -z-10" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs sm:text-sm font-semibold tracking-wide uppercase">
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
            Specialty Roastery & European Bistro • Indiranagar, Bangalore
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-stone-100 max-w-4xl mx-auto leading-[1.15]">
            Where Every Sip is an{" "}
            <span className="bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 bg-clip-text text-transparent italic">
              Artisan Craft
            </span>
          </h1>

          <p className="text-stone-300 text-base sm:text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed font-light">
            Indulge in single-origin pour overs, freshly baked flaky pastries, and gourmet European-fusion brunch. Reserve your favorite table or order live from your seat.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/reserve"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-base shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              <CalendarDays className="w-5 h-5" />
              Reserve a Table
            </Link>
            <Link
              href="/menu"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-stone-900/90 hover:bg-stone-800 text-stone-200 hover:text-white font-semibold text-base border border-stone-800 hover:border-stone-700 transition-all flex items-center justify-center gap-2"
            >
              <UtensilsCrossed className="w-5 h-5 text-amber-500" />
              Explore Menu & Prices
            </Link>
            <Link
              href="/table/demo"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-950/60 hover:bg-emerald-950 text-emerald-300 font-semibold text-base border border-emerald-800/60 hover:border-emerald-600 transition-all flex items-center justify-center gap-2"
            >
              <QrCode className="w-5 h-5 text-emerald-400" />
              In-Café QR Ordering
            </Link>
          </div>

          {/* Quick status bar */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-stone-400">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Open Daily: <strong>08:00 AM – 11:00 PM IST</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-500" />
              <span>Indiranagar 100ft Road, Bangalore</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Zero Double-Bookings Guarantee</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-panel p-8 rounded-3xl space-y-4 hover:border-amber-500/30 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <CalendarDays className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl font-bold text-stone-100">
              Seamless Table Reservations
            </h3>
            <p className="text-stone-400 text-sm leading-relaxed">
              Choose from sunlit courtyard patios, private booths, or romantic rooftop terrace views. Guaranteed buffer times protect every reservation.
            </p>
            <Link
              href="/reserve"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 pt-2"
            >
              Book in 60 seconds <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="glass-panel p-8 rounded-3xl space-y-4 hover:border-amber-500/30 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl font-bold text-stone-100">
              Contactless Table Ordering
            </h3>
            <p className="text-stone-400 text-sm leading-relaxed">
              Arrive at the café, check in with staff, scan your table QR code, and order appetizers, mains, and dessert rounds with live status tracking.
            </p>
            <Link
              href="/table/demo"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 pt-2"
            >
              Test live QR order <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="glass-panel p-8 rounded-3xl space-y-4 hover:border-amber-500/30 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl font-bold text-stone-100">
              Instant Booking Management
            </h3>
            <p className="text-stone-400 text-sm leading-relaxed">
              Securely look up your booking, view owner confirmation status, reschedule with automatic rollback safety, or cancel with zero hassle.
            </p>
            <Link
              href="/my-booking"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 pt-2"
            >
              Lookup existing booking <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Dual Portal Architecture Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-3">
          <span className="text-amber-400 uppercase tracking-widest text-xs font-bold">
            System Architecture & Portals
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-100">
            Divided into Two Powerful Portals
          </h2>
          <p className="text-stone-400 max-w-2xl mx-auto text-sm">
            Carefully crafted interfaces tailored separately for guests dining in and managers running café operations.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Customer Portal Card */}
          <div className="p-8 rounded-3xl bg-gradient-to-br from-stone-900/90 to-stone-950 border-2 border-stone-800 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-6 shadow-xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
                  Customer Portal
                </span>
                <span className="text-xs text-stone-400">For Guests & Diners</span>
              </div>
              <h3 className="font-serif text-2xl font-bold text-stone-100">
                Guest Experience & Table Dining
              </h3>
              <p className="text-stone-400 text-xs leading-relaxed">
                Clean, mobile-first experience for browsing, booking, ordering and settling bills without waiter delays.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-2xl bg-stone-950/60 border border-stone-800/80 text-xs space-y-1">
                  <div className="font-bold text-stone-200 flex items-center gap-1.5">
                    <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400" />
                    <span>Live Menu & Filters</span>
                  </div>
                  <p className="text-[11px] text-stone-400">Dietary filters (Veg, Vegan, Gluten-Free, Spicy) & live prices.</p>
                </div>

                <div className="p-3 rounded-2xl bg-stone-950/60 border border-stone-800/80 text-xs space-y-1">
                  <div className="font-bold text-stone-200 flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5 text-amber-400" />
                    <span>Online Table Booking</span>
                  </div>
                  <p className="text-[11px] text-stone-400">Instant slot validation with guaranteed buffer protection.</p>
                </div>

                <div className="p-3 rounded-2xl bg-stone-950/60 border border-stone-800/80 text-xs space-y-1">
                  <div className="font-bold text-stone-200 flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                    <span>In-Café QR Ordering</span>
                  </div>
                  <p className="text-[11px] text-stone-400">Order rounds directly to kitchen and track live prep status.</p>
                </div>

                <div className="p-3 rounded-2xl bg-stone-950/60 border border-stone-800/80 text-xs space-y-1">
                  <div className="font-bold text-stone-200 flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-blue-400" />
                    <span>Lookup & Reschedule</span>
                  </div>
                  <p className="text-[11px] text-stone-400">Manage existing reservations with instant rollback safety.</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-800/80 flex flex-wrap items-center gap-3">
              <Link
                href="/reserve"
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5"
              >
                <span>Reserve a Table</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/menu"
                className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-200 font-semibold text-xs border border-stone-800 transition-all"
              >
                Browse Menu
              </Link>
              <Link
                href="/table/demo"
                className="px-4 py-2.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 font-semibold text-xs border border-emerald-800/60 transition-all"
              >
                Test Table QR
              </Link>
            </div>
          </div>

          {/* Owner & Staff Portal Card */}
          <div className="p-8 rounded-3xl bg-gradient-to-br from-stone-900/90 to-stone-950 border-2 border-stone-800 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-6 shadow-xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-amber-500 text-stone-950 text-xs font-extrabold uppercase tracking-wider">
                  Owner & Staff Portal
                </span>
                <span className="text-xs text-amber-400 font-semibold">Protected Operations Center</span>
              </div>
              <h3 className="font-serif text-2xl font-bold text-stone-100">
                Kitchen, Floor & Cafe Management
              </h3>
              <p className="text-stone-400 text-xs leading-relaxed">
                Centralized POS & operations station for baristas, floor managers, and café owners.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-2xl bg-stone-950/60 border border-stone-800/80 text-xs space-y-1">
                  <div className="font-bold text-stone-200 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-red-400" />
                    <span>Live Kitchen KDS</span>
                  </div>
                  <p className="text-[11px] text-stone-400">Accept, cook, and serve incoming rounds with audio/visual alerts.</p>
                </div>

                <div className="p-3 rounded-2xl bg-stone-950/60 border border-stone-800/80 text-xs space-y-1">
                  <div className="font-bold text-stone-200 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-400" />
                    <span>Floor & Walk-In Desk</span>
                  </div>
                  <p className="text-[11px] text-stone-400">Live table occupancy, combine tables, and register walk-ins.</p>
                </div>

                <div className="p-3 rounded-2xl bg-stone-950/60 border border-stone-800/80 text-xs space-y-1">
                  <div className="font-bold text-stone-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Reservation Check-In</span>
                  </div>
                  <p className="text-[11px] text-stone-400">Confirm requests, assign tables, and generate dynamic visit tokens.</p>
                </div>

                <div className="p-3 rounded-2xl bg-stone-950/60 border border-stone-800/80 text-xs space-y-1">
                  <div className="font-bold text-stone-200 flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-amber-400" />
                    <span>QR Printable Stands</span>
                  </div>
                  <p className="text-[11px] text-stone-400">Printable high-res tent stand cards for every table on the floor.</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-800/80 flex flex-wrap items-center gap-3">
              <Link
                href="/owner/dashboard"
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5"
              >
                <span>Open Owner Command Center</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/owner/qr-codes"
                className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-200 font-semibold text-xs border border-stone-800 transition-all"
              >
                Print Table QRs
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Ambiance & Seating Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-3">
          <span className="text-amber-400 uppercase tracking-widest text-xs font-bold">
            Curated Atmosphere
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-100">
            Find Your Ideal Spot
          </h2>
          <p className="text-stone-400 max-w-xl mx-auto text-sm">
            Each section is designed with distinct character, lighting, and seating capacities.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="group rounded-3xl overflow-hidden glass-panel border border-stone-800 hover:border-amber-500/40 transition-all">
            <div className="h-48 overflow-hidden relative">
              <img
                src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=80"
                alt="Indoor Plush Booths"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-stone-900/80 text-amber-400 text-[11px] font-semibold backdrop-blur-md">
                Indoor Booth
              </span>
            </div>
            <div className="p-5 space-y-2">
              <h4 className="font-bold text-stone-100 text-base">Garden Corner Booths</h4>
              <p className="text-xs text-stone-400">Plush velvet booths with warm lighting and greenery. 2–4 Guests.</p>
            </div>
          </div>

          <div className="group rounded-3xl overflow-hidden glass-panel border border-stone-800 hover:border-amber-500/40 transition-all">
            <div className="h-48 overflow-hidden relative">
              <img
                src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80"
                alt="Courtyard Patio"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-stone-900/80 text-amber-400 text-[11px] font-semibold backdrop-blur-md">
                Outdoor Patio
              </span>
            </div>
            <div className="p-5 space-y-2">
              <h4 className="font-bold text-stone-100 text-base">Courtyard Garden</h4>
              <p className="text-xs text-stone-400">Open-air dining shaded by trees with gentle evening breeze. 2–6 Guests.</p>
            </div>
          </div>

          <div className="group rounded-3xl overflow-hidden glass-panel border border-stone-800 hover:border-amber-500/40 transition-all">
            <div className="h-48 overflow-hidden relative">
              <img
                src="https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=800&auto=format&fit=crop&q=80"
                alt="Rooftop Terrace"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-stone-900/80 text-amber-400 text-[11px] font-semibold backdrop-blur-md">
                Terrace Vista
              </span>
            </div>
            <div className="p-5 space-y-2">
              <h4 className="font-bold text-stone-100 text-base">Skyline Rooftop</h4>
              <p className="text-xs text-stone-400">Panoramic skyline views, ideal for romantic sunsets and birthdays. 2–4 Guests.</p>
            </div>
          </div>

          <div className="group rounded-3xl overflow-hidden glass-panel border border-stone-800 hover:border-amber-500/40 transition-all">
            <div className="h-48 overflow-hidden relative">
              <img
                src="https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800&auto=format&fit=crop&q=80"
                alt="Private Alcove"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-stone-900/80 text-amber-400 text-[11px] font-semibold backdrop-blur-md">
                Private Dining
              </span>
            </div>
            <div className="p-5 space-y-2">
              <h4 className="font-bold text-stone-100 text-base">Private Alcove</h4>
              <p className="text-xs text-stone-400">Acoustically quiet section for celebrations and business lunches. 6–10 Guests.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Step-by-Step Experience Workflow */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel-glow p-8 sm:p-12 rounded-3xl space-y-8">
          <div className="text-center space-y-2">
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-stone-100">
              The Seamless Café Experience
            </h3>
            <p className="text-stone-400 text-sm">
              Designed for effortless dining from home to table.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 font-bold flex items-center justify-center text-base">
                1
              </div>
              <h4 className="font-bold text-stone-100 text-sm">Book Online</h4>
              <p className="text-xs text-stone-400 leading-relaxed">
                Pick your date, time, guest count, and optional occasion or table preference. Initial status shows <em>Requested</em>.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold flex items-center justify-center text-base">
                2
              </div>
              <h4 className="font-bold text-stone-100 text-sm">Owner Confirmation</h4>
              <p className="text-xs text-stone-400 leading-relaxed">
                Our manager reviews table buffers and confirms your reservation, approving any special arrangements.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold flex items-center justify-center text-base">
                3
              </div>
              <h4 className="font-bold text-stone-100 text-sm">Check-in & QR Code</h4>
              <p className="text-xs text-stone-400 leading-relaxed">
                Upon arrival, staff checks you in with a secure Visit Code. Scan your table QR to unlock instant ordering.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-400 font-bold flex items-center justify-center text-base">
                4
              </div>
              <h4 className="font-bold text-stone-100 text-sm">Live Ordering & Settle</h4>
              <p className="text-xs text-stone-400 leading-relaxed">
                Order multiple rounds, track kitchen progress live, view itemized bill, and settle seamlessly via UPI, Card, or Cash.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
