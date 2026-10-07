"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  CalendarDays,
  Clock,
  Users,
  UtensilsCrossed,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Info,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";

export default function MyBookingPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto px-4 py-20 text-center text-stone-400 text-sm">
          Loading booking details...
        </div>
      }
    >
      <MyBookingContent />
    </Suspense>
  );
}

function MyBookingContent() {
  const searchParams = useSearchParams();
  const initialRef = searchParams.get("ref") || "";
  const initialToken = searchParams.get("token") || "";

  const [bookingRef, setBookingRef] = useState(initialRef);
  const [securityToken, setSecurityToken] = useState(initialToken);
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState<any>(null);

  // Reschedule Modal state
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleDuration, setRescheduleDuration] = useState(90);
  const [rescheduleGuests, setRescheduleGuests] = useState(2);
  const [rescheduling, setRescheduling] = useState(false);
  const [rescheduleError, setRescheduleError] = useState("");
  const [rescheduleSuccess, setRescheduleSuccess] = useState("");

  // Cancel Modal state
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const fetchBooking = async (ref: string, token: string, phoneNumber?: string) => {
    if (!ref.trim()) return;
    setLoading(true);
    setError("");
    setBooking(null);

    try {
      let url = `/api/reservations/${encodeURIComponent(ref.trim())}?`;
      if (token) url += `token=${encodeURIComponent(token.trim())}&`;
      if (phoneNumber) url += `phone=${encodeURIComponent(phoneNumber.trim())}&`;

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Reservation not found or credentials invalid.");
      }

      setBooking(data.data);
      setRescheduleDate(format(new Date(data.data.startDateTime), "yyyy-MM-dd"));
      setRescheduleTime(format(new Date(data.data.startDateTime), "HH:mm"));
      setRescheduleDuration(data.data.durationMinutes);
      setRescheduleGuests(data.data.guestCount);
    } catch (err: any) {
      setError(err.message || "Failed to find booking.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialRef) {
      fetchBooking(initialRef, initialToken);
    }
  }, [initialRef, initialToken]);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBooking(bookingRef, securityToken, phone);
  };

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setRescheduling(true);
    setRescheduleError("");
    setRescheduleSuccess("");

    try {
      const res = await fetch(
        `/api/reservations/${encodeURIComponent(booking.bookingReference)}/reschedule`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            securityToken: booking.securityToken,
            newDate: rescheduleDate,
            newTime: rescheduleTime,
            newDurationMinutes: Number(rescheduleDuration),
            newGuestCount: Number(rescheduleGuests),
          }),
        }
      );

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Rescheduling failed.");
      }

      setRescheduleSuccess(data.message);
      setBooking(data.data);
      setTimeout(() => setShowReschedule(false), 2000);
    } catch (err: any) {
      setRescheduleError(err.message || "Failed to reschedule.");
    } finally {
      setRescheduling(false);
    }
  };

  const handleCancelBooking = async () => {
    setCancelling(true);
    setError("");

    try {
      const res = await fetch(
        `/api/reservations/${encodeURIComponent(booking.bookingReference)}/cancel`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            securityToken: booking.securityToken,
            reason: cancelReason || "Cancelled by guest",
          }),
        }
      );

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Cancellation failed.");
      }

      setBooking(data.data);
      setShowCancel(false);
    } catch (err: any) {
      setError(err.message || "Failed to cancel.");
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "REQUESTED":
        return (
          <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Requested (Awaiting Owner Approval)
          </span>
        );
      case "CONFIRMED":
        return (
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed
          </span>
        );
      case "CHECKED_IN":
        return (
          <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/40 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <UtensilsCrossed className="w-3.5 h-3.5" /> Checked In & Seated
          </span>
        );
      case "COMPLETED":
        return (
          <span className="px-3 py-1 rounded-full bg-stone-700 text-stone-300 text-xs font-bold uppercase tracking-wider">
            Completed
          </span>
        );
      case "CANCELLED":
        return (
          <span className="px-3 py-1 rounded-full bg-red-950 text-red-400 border border-red-500/40 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" /> Cancelled
          </span>
        );
      case "REJECTED":
        return (
          <span className="px-3 py-1 rounded-full bg-red-950 text-red-400 border border-red-500/40 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" /> Rejected by Café
          </span>
        );
      case "NO_SHOW":
        return (
          <span className="px-3 py-1 rounded-full bg-stone-800 text-stone-400 text-xs font-bold uppercase tracking-wider">
            No Show
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider">
          <Search className="w-4 h-4" /> Booking Lookup & Management
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-stone-100">
          Find & Manage Your Reservation
        </h1>
        <p className="text-stone-400 text-sm max-w-xl mx-auto">
          Enter your Booking Reference (e.g. RES-8319-K9A1) and your Security Token or registered phone number.
        </p>
      </div>

      {/* Lookup Form */}
      <form
        onSubmit={handleLookup}
        className="glass-panel p-6 rounded-3xl space-y-4 border border-stone-800"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-300 uppercase tracking-wider">
              Booking Reference *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. RES-8319-K9A1"
              value={bookingRef}
              onChange={(e) => setBookingRef(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-stone-900 border border-stone-800 focus:border-amber-500 focus:outline-none text-stone-100 text-sm uppercase font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-300 uppercase tracking-wider">
              Security Token (or leave blank for Phone)
            </label>
            <input
              type="text"
              placeholder="Security token from booking"
              value={securityToken}
              onChange={(e) => setSecurityToken(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-stone-900 border border-stone-800 focus:border-amber-500 focus:outline-none text-stone-100 text-sm font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-300 uppercase tracking-wider">
              Phone Number (if no token)
            </label>
            <input
              type="tel"
              placeholder="Last 4 digits or full phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-stone-900 border border-stone-800 focus:border-amber-500 focus:outline-none text-stone-100 text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-3.5 h-3.5" /> Lookup Booking
              </>
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="p-4 rounded-2xl bg-red-950/80 border border-red-500/50 text-red-200 text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* Booking Details Card */}
      {booking && (
        <div className="glass-panel-glow p-6 sm:p-8 rounded-3xl space-y-6 border border-stone-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-5">
            <div className="space-y-1">
              <div className="text-xs text-stone-400">Booking Reference</div>
              <div className="font-mono text-xl sm:text-2xl font-bold text-amber-400 tracking-wider">
                {booking.bookingReference}
              </div>
            </div>
            <div>{getStatusBadge(booking.status)}</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-1">
              <span className="text-stone-400 block">Primary Guest</span>
              <strong className="text-stone-100 text-sm block">{booking.guestName}</strong>
              <span className="text-stone-500">{booking.guestPhone}</span>
            </div>

            <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-1">
              <span className="text-stone-400 block">Date & Time</span>
              <strong className="text-stone-100 text-sm block">
                {format(new Date(booking.startDateTime), "dd MMM yyyy, hh:mm a")}
              </strong>
              <span className="text-stone-500">Duration: {booking.durationMinutes} mins</span>
            </div>

            <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-1">
              <span className="text-stone-400 block">Table Assigned</span>
              <strong className="text-stone-100 text-sm block">
                {booking.table?.tableNumber || "Auto-assign"}
              </strong>
              <span className="text-stone-500">{booking.table?.name || "Pending allocation"}</span>
            </div>

            <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-1">
              <span className="text-stone-400 block">Party Size & Occasion</span>
              <strong className="text-stone-100 text-sm block">
                {booking.guestCount} Guests
              </strong>
              <span className="text-stone-500">{booking.occasion || "Casual"}</span>
            </div>
          </div>

          {/* Special request notice */}
          {booking.specialRequest && (
            <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-stone-400 font-semibold">Special Request:</span>
                {booking.specialRequestApproved ? (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-500/50 text-[10px] font-bold">
                    ✓ Accepted by Café
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-amber-950 text-amber-400 border border-amber-500/50 text-[10px] font-bold">
                    ⏳ Pending Review
                  </span>
                )}
              </div>
              <p className="text-stone-300 italic bg-stone-950/60 p-3 rounded-xl border border-stone-800/80">
                &quot;{booking.specialRequest}&quot;
              </p>
            </div>
          )}

          {booking.rejectionReason && (
            <div className="p-4 rounded-2xl bg-red-950/60 border border-red-500/40 text-xs text-red-200">
              <strong>Café Note:</strong> {booking.rejectionReason}
            </div>
          )}

          {/* Active Visit Link if Checked-In */}
          {booking.visit && booking.visit.status === "ACTIVE" && (
            <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs text-emerald-300 font-bold uppercase tracking-wider block">
                  You are checked in!
                </span>
                <span className="text-sm text-stone-200">
                  Visit Code: <strong className="text-emerald-400 font-mono">{booking.visit.visitCode}</strong>
                </span>
              </div>
              <Link
                href={`/table/${booking.tableId}?visit=${booking.visit.visitCode}`}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-bold flex items-center gap-1.5"
              >
                Open Table Ordering &rarr;
              </Link>
            </div>
          )}

          {/* Actions */}
          {!["CANCELLED", "REJECTED", "COMPLETED", "CHECKED_IN"].includes(booking.status) && (
            <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-stone-800">
              <button
                onClick={() => setShowCancel(true)}
                className="px-4 py-2.5 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 text-xs font-semibold flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Cancel Booking
              </button>
              <button
                onClick={() => setShowReschedule(true)}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reschedule Time / Date
              </button>
            </div>
          )}
        </div>
      )}

      {/* Reschedule Modal */}
      {showReschedule && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl max-w-lg w-full space-y-6 border border-amber-500/40 shadow-2xl">
            <div className="space-y-1">
              <h3 className="font-serif text-xl font-bold text-stone-100">
                Reschedule Reservation
              </h3>
              <p className="text-xs text-stone-400">
                If the new time slot conflicts or table is occupied, your existing slot is preserved safely.
              </p>
            </div>

            {rescheduleError && (
              <div className="p-3.5 rounded-xl bg-red-950 border border-red-500 text-red-200 text-xs">
                {rescheduleError}
              </div>
            )}

            {rescheduleSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-950 border border-emerald-500 text-emerald-200 text-xs">
                {rescheduleSuccess}
              </div>
            )}

            <form onSubmit={handleReschedule} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-300">New Date</label>
                  <input
                    type="date"
                    required
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-300">New Time (HH:mm)</label>
                  <input
                    type="time"
                    required
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-300">Guest Count</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={rescheduleGuests}
                    onChange={(e) => setRescheduleGuests(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-300">Duration</label>
                  <select
                    value={rescheduleDuration}
                    onChange={(e) => setRescheduleDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 text-xs"
                  >
                    <option value={60}>60 mins</option>
                    <option value={90}>90 mins</option>
                    <option value={120}>120 mins</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowReschedule(false)}
                  className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-400 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rescheduling}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold flex items-center gap-1.5"
                >
                  {rescheduling ? "Verifying slot..." : "Confirm Reschedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancel && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl max-w-md w-full space-y-5 border border-red-500/40 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-red-950/60 border border-red-500/50 text-red-400 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="font-serif text-xl font-bold text-stone-100">
                Cancel Reservation?
              </h3>
              <p className="text-xs text-stone-400">
                Are you sure you want to cancel booking <strong>{booking.bookingReference}</strong>? This action cannot be undone.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-300">Reason (Optional)</label>
              <input
                type="text"
                placeholder="Change of plans, unwell, etc."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setShowCancel(false)}
                className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-400 text-xs font-semibold"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={handleCancelBooking}
                disabled={cancelling}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold"
              >
                {cancelling ? "Cancelling..." : "Yes, Cancel Booking"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
