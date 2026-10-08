"use client";

import Link from "next/link";
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
  Heart,
  Star,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="space-y-24 pb-20">
      {/* 1. Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden pt-8">
        {/* Warm Ambient Cream & Amber Light Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-200/40 via-amber-50/60 to-[#FAF7F2] -z-10" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-400/15 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 border border-amber-300/80 text-amber-800 text-xs sm:text-sm font-semibold tracking-wide shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            <span>Artisanal Specialty Roastery & European Bistro</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-stone-900 max-w-4xl mx-auto leading-[1.12]">
            Artisan Coffee &{" "}
            <span className="bg-gradient-to-r from-amber-700 via-amber-600 to-amber-800 bg-clip-text text-transparent italic">
              Woodfired Dining
            </span>
          </h1>

          <p className="text-stone-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-normal">
            Single-origin pour overs, freshly baked flaky croissants, and gourmet brunch in Indiranagar, Bangalore. Reserve your favorite table or order live from your seat.
          </p>

          {/* Simple Customer Call to Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/reserve"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-base shadow-lg shadow-amber-600/25 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              <CalendarDays className="w-5 h-5" />
              <span>Reserve a Table</span>
            </Link>
            <Link
              href="/menu"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white hover:bg-stone-50 text-stone-800 font-semibold text-base border border-stone-300 shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <UtensilsCrossed className="w-5 h-5 text-amber-700" />
              <span>Explore Menu</span>
            </Link>
            <Link
              href="/table"
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-base border border-emerald-300 shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <QrCode className="w-5 h-5 text-emerald-700" />
              <span>Dine-In QR Order</span>
            </Link>
          </div>

          {/* Quick Café Facts */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-stone-600">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-700" />
              <span>Open Daily: <strong className="text-stone-800">08:00 AM – 11:00 PM IST</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-amber-700" />
              <span>100ft Road, Indiranagar, Bangalore</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Guaranteed Reserved Seating</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Three Simple Customer Pathways */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Menu */}
          <Link
            href="/menu"
            className="group bg-white p-8 rounded-3xl border border-stone-200/90 shadow-sm hover:shadow-md hover:border-amber-400 transition-all duration-300 space-y-4 hover:-translate-y-1 block"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300/80 flex items-center justify-center text-amber-800 group-hover:scale-110 transition-transform">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl font-bold text-stone-900 group-hover:text-amber-700 transition-colors">
              Menu & Specialties
            </h3>
            <p className="text-stone-600 text-sm leading-relaxed">
              Explore freshly brewed coffees, vegan & gluten-free options, woodfired pizzas, and artisan brunch.
            </p>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 pt-2">
              Browse Menu & Prices <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 2: Reserve */}
          <Link
            href="/reserve"
            className="group bg-white p-8 rounded-3xl border border-stone-200/90 shadow-sm hover:shadow-md hover:border-amber-400 transition-all duration-300 space-y-4 hover:-translate-y-1 block"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300/80 flex items-center justify-center text-amber-800 group-hover:scale-110 transition-transform">
              <CalendarDays className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl font-bold text-stone-900 group-hover:text-amber-700 transition-colors">
              Table Reservations
            </h3>
            <p className="text-stone-600 text-sm leading-relaxed">
              Select date, time, party size, and seating area. Instant booking code with guaranteed buffer times.
            </p>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 pt-2">
              Book Table in 60s <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 3: QR Dine-In */}
          <Link
            href="/table"
            className="group bg-white p-8 rounded-3xl border border-stone-200/90 shadow-sm hover:shadow-md hover:border-emerald-400 transition-all duration-300 space-y-4 hover:-translate-y-1 block"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-300/80 flex items-center justify-center text-emerald-800 group-hover:scale-110 transition-transform">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl font-bold text-stone-900 group-hover:text-emerald-700 transition-colors">
              Dine-In Table Ordering
            </h3>
            <p className="text-stone-600 text-sm leading-relaxed">
              Already at the café? Scan your table QR code to order dishes directly to the kitchen and track prep status.
            </p>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 pt-2">
              Open Table Order Screen <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </section>

      {/* 3. Signature Highlights Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-2">
          <span className="text-amber-800 uppercase tracking-widest text-xs font-bold">
            Chef & Barista Favorites
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
            Crafted for the Palate
          </h2>
          <p className="text-stone-600 max-w-xl mx-auto text-sm">
            Hand-selected single origin beans and farm-fresh ingredients.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-3xl overflow-hidden bg-white border border-stone-200/80 shadow-sm group hover:shadow-md hover:border-amber-400 transition-all">
            <div className="h-56 overflow-hidden relative">
              <img
                src="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80"
                alt="Ethiopian Yirgacheffe Pour Over"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/95 text-amber-800 border border-amber-200 text-xs font-bold shadow-sm backdrop-blur-md">
                ₹260 • Single Origin
              </span>
            </div>
            <div className="p-6 space-y-2">
              <h4 className="font-serif font-bold text-stone-900 text-lg">Ethiopian Pour Over (V60)</h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                Floral notes of jasmine, bergamot, and sweet peach with vibrant citrus acidity.
              </p>
            </div>
          </div>

          <div className="rounded-3xl overflow-hidden bg-white border border-stone-200/80 shadow-sm group hover:shadow-md hover:border-amber-400 transition-all">
            <div className="h-56 overflow-hidden relative">
              <img
                src="https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&auto=format&fit=crop&q=80"
                alt="Truffle Wild Mushroom Sourdough"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/95 text-amber-800 border border-amber-200 text-xs font-bold shadow-sm backdrop-blur-md">
                ₹420 • Gourmet Brunch
              </span>
            </div>
            <div className="p-6 space-y-2">
              <h4 className="font-serif font-bold text-stone-900 text-lg">Truffle Mushroom Toast</h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                Sauteed wild forest mushrooms on artisan country sourdough with truffle ricotta and microgreens.
              </p>
            </div>
          </div>

          <div className="rounded-3xl overflow-hidden bg-white border border-stone-200/80 shadow-sm group hover:shadow-md hover:border-amber-400 transition-all">
            <div className="h-56 overflow-hidden relative">
              <img
                src="https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&auto=format&fit=crop&q=80"
                alt="Flaky Almond Butter Croissant"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/95 text-amber-800 border border-amber-200 text-xs font-bold shadow-sm backdrop-blur-md">
                ₹240 • Freshly Baked
              </span>
            </div>
            <div className="p-6 space-y-2">
              <h4 className="font-serif font-bold text-stone-900 text-lg">Double Almond Croissant</h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                Laminated French butter pastry filled with rich almond frangipane and toasted almond flakes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Ambiance & Seating Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-amber-800 uppercase tracking-widest text-xs font-bold">
            Curated Spaces
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
            Pick Your Vibe
          </h2>
          <p className="text-stone-600 max-w-xl mx-auto text-sm">
            Whether for deep work, romantic dinners, or relaxed Sunday brunch.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="rounded-3xl overflow-hidden bg-white border border-stone-200/80 shadow-sm">
            <div className="h-48 overflow-hidden relative">
              <img
                src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80"
                alt="Courtyard Garden Patio"
                className="w-full h-full object-cover"
              />
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/95 text-amber-800 text-xs font-semibold shadow-sm backdrop-blur-md">
                Courtyard Garden
              </span>
            </div>
            <div className="p-5 space-y-1">
              <h4 className="font-bold text-stone-900 text-base">Outdoor Patio</h4>
              <p className="text-xs text-stone-600">Open-air dining shaded by trees with gentle evening breeze.</p>
            </div>
          </div>

          <div className="rounded-3xl overflow-hidden bg-white border border-stone-200/80 shadow-sm">
            <div className="h-48 overflow-hidden relative">
              <img
                src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=80"
                alt="Indoor Velvet Booths"
                className="w-full h-full object-cover"
              />
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/95 text-amber-800 text-xs font-semibold shadow-sm backdrop-blur-md">
                Main Dining Room
              </span>
            </div>
            <div className="p-5 space-y-1">
              <h4 className="font-bold text-stone-900 text-base">Indoor Cozy Booths</h4>
              <p className="text-xs text-stone-600">Plush seating, warm ambient acoustics, and high-speed Wi-Fi.</p>
            </div>
          </div>

          <div className="rounded-3xl overflow-hidden bg-white border border-stone-200/80 shadow-sm">
            <div className="h-48 overflow-hidden relative">
              <img
                src="https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=800&auto=format&fit=crop&q=80"
                alt="Skyline Rooftop Terrace"
                className="w-full h-full object-cover"
              />
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/95 text-amber-800 text-xs font-semibold shadow-sm backdrop-blur-md">
                Rooftop Vista
              </span>
            </div>
            <div className="p-5 space-y-1">
              <h4 className="font-bold text-stone-900 text-base">Skyline Rooftop</h4>
              <p className="text-xs text-stone-600">Sunset skyline views with specialty cocktails and desserts.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Booking Lookup Quick Strip */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="p-8 rounded-3xl bg-white border border-stone-200/90 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md text-center sm:text-left">
          <div className="space-y-1">
            <h3 className="font-serif text-xl font-bold text-stone-900">
              Already have a table reservation?
            </h3>
            <p className="text-xs text-stone-600">
              Look up your reference code anytime to check confirmation, reschedule, or cancel.
            </p>
          </div>
          <Link
            href="/my-booking"
            className="px-6 py-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold text-xs border border-amber-200 transition-all flex items-center gap-1.5 shrink-0"
          >
            <Search className="w-4 h-4 text-amber-700" />
            <span>Lookup Booking</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
