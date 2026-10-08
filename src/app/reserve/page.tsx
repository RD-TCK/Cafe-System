"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Clock,
  Users,
  UtensilsCrossed,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  ChevronRight,
  Info,
  Calendar,
  Phone,
  Mail,
  User,
  PartyPopper,
  MessageSquare,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";

interface Table {
  id: string;
  tableNumber: string;
  name: string;
  capacityMin: number;
  capacityMax: number;
  section: string;
  photoUrl?: string;
  description?: string;
}

interface Slot {
  time: string;
  available: boolean;
  availableTablesCount: number;
}

export default function ReservePage() {
  // Form State
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const [date, setDate] = useState(todayStr);
  const [guestCount, setGuestCount] = useState(2);
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [selectedTableId, setSelectedTableId] = useState<string>(""); // empty = Any suitable table

  const [tables, setTables] = useState<Table[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>("");

  // Step 2 Contact info
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [occasion, setOccasion] = useState("");
  const [specialRequest, setSpecialRequest] = useState("");

  // UI Flow State
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  // Fetch Tables
  useEffect(() => {
    fetch("/api/tables")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTables(data.data);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  // Fetch Available Slots whenever date, guestCount, duration, or selectedTableId changes
  useEffect(() => {
    if (!date) return;
    setLoadingSlots(true);
    setError("");
    setSelectedTime("");

    fetch("/api/reservations/check-slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        guestCount: Number(guestCount),
        durationMinutes: Number(durationMinutes),
        tableId: selectedTableId || undefined,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSlots(data.data.slots);
        } else {
          setError(data.error || "Failed to load slots");
        }
      })
      .catch((err) => {
        console.error(err);
        setError("Network error while checking slot availability");
      })
      .finally(() => setLoadingSlots(false));
  }, [date, guestCount, durationMinutes, selectedTableId]);

  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !guestPhone.trim() || !guestEmail.trim()) {
      setError("Please fill in your name, phone number, and email.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const idempotencyKey = `res_req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName,
          guestPhone,
          guestEmail,
          guestCount: Number(guestCount),
          date,
          time: selectedTime,
          durationMinutes: Number(durationMinutes),
          requestedTableId: selectedTableId || null,
          occasion: occasion || undefined,
          specialRequest: specialRequest || undefined,
          idempotencyKey,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Reservation request failed.");
      }

      setConfirmedBooking(data.data);
      setStep(3);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyBookingDetails = () => {
    if (!confirmedBooking) return;
    const text = `The Roasted Bean Café Reservation:\nReference: ${confirmedBooking.bookingReference}\nSecurity Token: ${confirmedBooking.securityToken}\nStatus: ${confirmedBooking.status}\nLookup: ${window.location.origin}/my-booking?ref=${confirmedBooking.bookingReference}&token=${confirmedBooking.securityToken}`;
    navigator.clipboard.writeText(text);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Title */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-xs font-semibold uppercase tracking-wider shadow-sm">
          <CalendarDays className="w-4 h-4 text-amber-700" />
          <span>Real-time Table Reservations</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-stone-900">
          Reserve Your Table at The Roasted Bean
        </h1>
        <p className="text-stone-600 text-sm max-w-xl mx-auto leading-relaxed">
          Book online with guaranteed setup and cleanup buffer protection. Special requests will be reviewed and explicitly accepted by the café owner.
        </p>
      </div>

      {/* Progress steps */}
      {step !== 3 && (
        <div className="flex items-center justify-center gap-3 text-xs font-semibold">
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
              step === 1
                ? "bg-amber-100 border-amber-300 text-amber-900 shadow-sm"
                : "bg-white border-stone-200 text-stone-500"
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] font-bold">
              1
            </span>
            <span>Date, Time & Table</span>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400" />
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
              step === 2
                ? "bg-amber-100 border-amber-300 text-amber-900 shadow-sm"
                : "bg-white border-stone-200 text-stone-500"
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center text-[10px] font-bold">
              2
            </span>
            <span>Guest Details & Requests</span>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <strong>Reservation Notice:</strong> {error}
          </div>
        </div>
      )}

      {/* Step 1: Date, Guest count, Duration, Table selection, Time slots */}
      {step === 1 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl space-y-8 border border-stone-200/90 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-600" /> Date (IST)
              </label>
              <input
                type="date"
                min={todayStr}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:border-amber-600 focus:bg-white focus:outline-none text-stone-900 text-sm"
              />
            </div>

            {/* Guests */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-600" /> Guests
              </label>
              <select
                value={guestCount}
                onChange={(e) => setGuestCount(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:border-amber-600 focus:bg-white focus:outline-none text-stone-900 text-sm"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? "Guest" : "Guests"}
                  </option>
                ))}
              </select>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" /> Duration
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:border-amber-600 focus:bg-white focus:outline-none text-stone-900 text-sm"
              >
                <option value={60}>60 Minutes (1 hour)</option>
                <option value={90}>90 Minutes (Standard)</option>
                <option value={120}>120 Minutes (2 hours)</option>
                <option value={150}>150 Minutes (2.5 hours)</option>
              </select>
            </div>

            {/* Table Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <UtensilsCrossed className="w-3.5 h-3.5 text-amber-600" /> Table Preference
              </label>
              <select
                value={selectedTableId}
                onChange={(e) => setSelectedTableId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:border-amber-600 focus:bg-white focus:outline-none text-stone-900 text-sm"
              >
                <option value="">Any Suitable Table (Recommended)</option>
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.tableNumber} - {t.name} ({t.capacityMin}–{t.capacityMax}p)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Time Slots Selector */}
          <div className="space-y-4 pt-4 border-t border-stone-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                Select Arrival Time Slot ({slots.filter((s) => s.available).length} Available)
              </h3>
              <span className="text-xs text-stone-500">
                15-min setup/cleanup buffer automatically reserved
              </span>
            </div>

            {loadingSlots ? (
              <div className="py-12 text-center space-y-2">
                <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-stone-600">Checking atomic table availability...</p>
              </div>
            ) : slots.length === 0 ? (
              <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 text-stone-600 text-xs">
                No slots available on this date or outside opening hours.
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {slots.map((slot) => {
                  const isSelected = selectedTime === slot.time;
                  return (
                    <button
                      key={slot.time}
                      disabled={!slot.available}
                      onClick={() => setSelectedTime(slot.time)}
                      className={`p-3 rounded-2xl border text-center transition-all ${
                        !slot.available
                          ? "bg-stone-100 border-stone-200 text-stone-400 cursor-not-allowed line-through"
                          : isSelected
                          ? "bg-amber-600 border-amber-600 text-white font-bold shadow-md shadow-amber-600/25 scale-[1.02]"
                          : "bg-stone-50 border-stone-200 hover:border-amber-500 hover:bg-amber-50/50 text-stone-800"
                      }`}
                    >
                      <div className="text-sm font-semibold">{slot.time}</div>
                      <div className="text-[10px] opacity-80 mt-0.5">
                        {slot.available ? `${slot.availableTablesCount} tbl avail` : "Booked"}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Next Button */}
          <div className="flex justify-end pt-4">
            <button
              disabled={!selectedTime}
              onClick={() => setStep(2)}
              className="px-8 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-bold text-sm shadow-md shadow-amber-600/20 flex items-center gap-2 transition-all"
            >
              <span>Continue to Guest Details</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Guest Details, Occasion & Special Requests */}
      {step === 2 && (
        <form
          onSubmit={handleCreateReservation}
          className="bg-white p-6 sm:p-8 rounded-3xl space-y-6 border border-stone-200/90 shadow-sm"
        >
          <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div>
              <span className="text-stone-500 block">Selected Slot:</span>
              <strong className="text-amber-900 text-sm">
                {date} at {selectedTime} ({durationMinutes} mins)
              </strong>
            </div>
            <div>
              <span className="text-stone-500 block">Party Size:</span>
              <strong className="text-stone-800 text-sm">{guestCount} Guests</strong>
            </div>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-amber-700 font-bold hover:underline text-xs"
            >
              Change Slot
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-600" /> Primary Guest Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Priya Sharma"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:border-amber-600 focus:bg-white focus:outline-none text-stone-900 text-sm"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-600" /> Phone Number *
              </label>
              <input
                type="tel"
                required
                placeholder="+91 98765 43210"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:border-amber-600 focus:bg-white focus:outline-none text-stone-900 text-sm"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-600" /> Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="priya@example.com"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:border-amber-600 focus:bg-white focus:outline-none text-stone-900 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Occasion */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <PartyPopper className="w-3.5 h-3.5 text-amber-600" /> Dining Occasion (Optional)
              </label>
              <select
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:border-amber-600 focus:bg-white focus:outline-none text-stone-900 text-sm"
              >
                <option value="">Casual Dining / Coffee</option>
                <option value="BIRTHDAY">Birthday Celebration 🎂</option>
                <option value="ANNIVERSARY">Anniversary Date 💖</option>
                <option value="BUSINESS">Business Meeting / Work 💼</option>
                <option value="FAMILY_REUNION">Family Gathering 👨‍👩‍👧‍👦</option>
              </select>
            </div>

            {/* Special Request */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-amber-600" /> Special Seating / Dietary Request
              </label>
              <input
                type="text"
                placeholder="e.g. Quiet corner table, high chair, birthday candle on dessert"
                value={specialRequest}
                onChange={(e) => setSpecialRequest(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:border-amber-600 focus:bg-white focus:outline-none text-stone-900 text-sm"
              />
            </div>
          </div>

          {/* Special request policy notice */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong>Reservation Policy:</strong> Your reservation will initially show as{" "}
              <span className="font-bold text-amber-800">Requested</span>. The café owner will review table allocations and explicitly confirm special requests. A 15-minute grace period applies upon arrival.
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-6 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs transition-colors"
            >
              &larr; Back to Slot
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-amber-600/25 flex items-center gap-2 transition-all"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating Reservation...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Table Reservation</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Step 3: Confirmation Screen */}
      {step === 3 && confirmedBooking && (
        <div className="bg-white p-8 sm:p-12 rounded-3xl space-y-8 text-center border border-amber-300 shadow-lg">
          <div className="w-16 h-16 rounded-3xl bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center mx-auto shadow-md">
            <Clock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-widest border border-amber-300">
              Status: Requested (Awaiting Owner Confirmation)
            </span>
            <h2 className="font-serif text-3xl font-extrabold text-stone-900">
              Reservation Request Received!
            </h2>
            <p className="text-stone-600 text-sm max-w-md mx-auto">
              Thank you, <strong>{confirmedBooking.guestName}</strong>. Your reservation has been logged and the table slot is temporarily held.
            </p>
          </div>

          {/* Reference & Security Details Box */}
          <div className="max-w-md mx-auto p-6 rounded-2xl bg-stone-50 border border-stone-200 space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <span className="text-xs text-stone-500">Booking Reference:</span>
              <strong className="text-amber-800 font-mono text-base tracking-wider">
                {confirmedBooking.bookingReference}
              </strong>
            </div>

            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <span className="text-xs text-stone-500">Date & Time:</span>
              <span className="text-stone-800 text-xs font-semibold">
                {format(new Date(confirmedBooking.startDateTime), "dd MMM yyyy, hh:mm a")} IST
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <span className="text-xs text-stone-500">Assigned Table:</span>
              <span className="text-stone-800 text-xs font-semibold">
                {confirmedBooking.table?.tableNumber || "Any suitable table"} (
                {confirmedBooking.table?.name || "Pending allocation"})
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <span className="text-xs text-stone-500">Guests & Duration:</span>
              <span className="text-stone-800 text-xs">
                {confirmedBooking.guestCount} Guests • {confirmedBooking.durationMinutes} Mins
              </span>
            </div>

            {confirmedBooking.specialRequest && (
              <div className="pt-1">
                <span className="text-xs text-stone-500 block mb-1">Special Request:</span>
                <p className="text-xs text-amber-900 italic bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                  &quot;{confirmedBooking.specialRequest}&quot;
                </p>
                <span className="text-[11px] text-stone-500 mt-1 block">
                  Pending owner acceptance
                </span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <button
              onClick={copyBookingDetails}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-300 text-xs font-semibold text-stone-800 flex items-center justify-center gap-2 transition-colors"
            >
              <Copy className="w-4 h-4 text-amber-700" />
              {copiedToken ? "Copied to Clipboard!" : "Copy Booking Details"}
            </button>
            <Link
              href={`/my-booking?ref=${confirmedBooking.bookingReference}&token=${confirmedBooking.securityToken}`}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-amber-600/20 transition-all"
            >
              <ExternalLink className="w-4 h-4" /> Manage / Track Booking
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
