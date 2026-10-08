"use client";

import Link from "next/link";
import { Coffee, MapPin, Phone, Mail, Clock, ShieldCheck, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-stone-100/90 border-t border-stone-200 text-stone-600 text-sm mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Col 1: Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center text-white shadow-md">
                <Coffee className="w-5 h-5" />
              </div>
              <div>
                <span className="font-serif text-xl font-bold text-stone-900">
                  The Roasted Bean
                </span>
                <span className="text-[10px] tracking-widest uppercase font-semibold text-amber-700 block">
                  Café & Roastery
                </span>
              </div>
            </div>
            <p className="text-stone-500 text-xs leading-relaxed">
              Artisanal single-origin brews, fresh woodfired oven eats, and European-fusion dining in Bangalore. Experience hospitality built with passion.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-stone-200 text-xs text-stone-700 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Timezone: <strong className="text-amber-700">Asia/Kolkata (IST)</strong>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h3 className="text-stone-900 font-bold uppercase tracking-wider text-xs mb-4">
              Explore & Reserve
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/menu" className="hover:text-amber-700 transition-colors">
                  Menu & Live Pricing
                </Link>
              </li>
              <li>
                <Link href="/reserve" className="hover:text-amber-700 transition-colors">
                  Table Reservations
                </Link>
              </li>
              <li>
                <Link href="/my-booking" className="hover:text-amber-700 transition-colors">
                  Manage / Reschedule Booking
                </Link>
              </li>
              <li>
                <Link href="/table/demo" className="hover:text-amber-700 transition-colors">
                  In-Café QR Ordering (Demo)
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Hours & Policies */}
          <div>
            <h3 className="text-stone-900 font-bold uppercase tracking-wider text-xs mb-4">
              Operating Hours & Buffers
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-stone-900 font-medium">Daily Service:</span>
                  <div className="text-stone-500">08:00 AM – 11:00 PM IST</div>
                </div>
              </li>
              <li className="text-stone-500">
                <strong className="text-stone-700">Grace Period:</strong> 15 minutes late-arrival grace.
              </li>
              <li className="text-stone-500">
                <strong className="text-stone-700">Buffers:</strong> 15 mins setup & cleanup between reservations.
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Staff */}
          <div>
            <h3 className="text-stone-900 font-bold uppercase tracking-wider text-xs mb-4">
              Location & Management
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>104 Indiranagar 100ft Road, Bangalore, Karnataka 560038</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-600 shrink-0" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-600 shrink-0" />
                <span>hello@theroastedbean.com</span>
              </li>
              <li className="pt-2">
                <Link
                  href="/owner/login"
                  className="inline-flex items-center gap-1.5 text-amber-700 hover:text-amber-800 font-semibold"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Staff / Owner Portal &rarr;
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
          <p>© {new Date().getFullYear()} The Roasted Bean Café. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Artisanal Dining & Table Experience
          </p>
        </div>
      </div>
    </footer>
  );
}
