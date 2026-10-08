"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  TrendingUp,
  CreditCard,
  UtensilsCrossed,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  LogOut,
  Users,
  Search,
  Plus,
  Flame,
  Check,
  QrCode,
  Printer,
  ChevronRight,
  Filter,
  DollarSign,
  Calendar,
  Layers,
  Settings as SettingsIcon,
  Eye,
  AlertCircle,
  X,
  FileText,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import QRCode from "qrcode";

export default function OwnerDashboardPage() {
  const router = useRouter();

  // Navigation Sub-tab
  const [activeTab, setActiveTab] = useState<
    "OVERVIEW" | "ORDERS" | "TABLES" | "RESERVATIONS" | "BILLS" | "MENU" | "SETTINGS"
  >("OVERVIEW");

  // Data States
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [liveOrders, setLiveOrders] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [menuCategories, setMenuCategories] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [closures, setClosures] = useState<any[]>([]);

  // Modals & Action States
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Walk-in modal
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInTableId, setWalkInTableId] = useState("");
  const [walkInGuestName, setWalkInGuestName] = useState("");
  const [walkInGuestCount, setWalkInGuestCount] = useState(2);

  // Reservation action modals
  const [selectedRes, setSelectedRes] = useState<any>(null);
  const [showConfirmResModal, setShowConfirmResModal] = useState(false);
  const [assignTableId, setAssignTableId] = useState("");
  const [approveSpecialReq, setApproveSpecialReq] = useState(true);
  const [showRejectResModal, setShowRejectResModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Payment Recording modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentBill, setPaymentBill] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState("UPI_QR");
  const [paymentNote, setPaymentNote] = useState("");

  // Close Visit modal
  const [showCloseVisitModal, setShowCloseVisitModal] = useState(false);
  const [visitToClose, setVisitToClose] = useState<any>(null);

  // Table QR modal
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedQrTable, setSelectedQrTable] = useState<any>(null);
  const [qrData, setQrData] = useState<any>(null);

  // Table Combine modal
  const [showCombineModal, setShowCombineModal] = useState(false);
  const [primaryCombineTable, setPrimaryCombineTable] = useState<any>(null);
  const [selectedCombineIds, setSelectedCombineIds] = useState<string[]>([]);

  // Menu item create/edit modal
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [editMenuItem, setEditMenuItem] = useState<any>(null);
  const [menuCategoryId, setMenuCategoryId] = useState("");
  const [menuName, setMenuName] = useState("");
  const [menuDesc, setMenuDesc] = useState("");
  const [menuPrice, setMenuPrice] = useState<number>(0);
  const [menuIsVeg, setMenuIsVeg] = useState(true);
  const [menuIsVegan, setMenuIsVegan] = useState(false);
  const [menuIsGf, setMenuIsGf] = useState(false);
  const [menuIsSpicy, setMenuIsSpicy] = useState(false);
  const [menuPrepTime, setMenuPrepTime] = useState(15);
  const [menuPhotoUrl, setMenuPhotoUrl] = useState("");

  // Filter States
  const [resStatusFilter, setResStatusFilter] = useState("ALL");
  const [resSearch, setResSearch] = useState("");
  const [billStatusFilter, setBillStatusFilter] = useState("ALL");

  // Fetch all core datasets
  const fetchAllData = async () => {
    try {
      // 1. Dashboard summary
      const dRes = await fetch("/api/owner/dashboard");
      if (dRes.status === 401) {
        router.push("/owner/login");
        return;
      }
      const dData = await dRes.json();
      if (dData.success) {
        setDashboardData(dData.data);
      }

      // 2. Live Orders
      const oRes = await fetch("/api/owner/orders/live?status=ALL");
      const oData = await oRes.json();
      if (oData.success) setLiveOrders(oData.data);

      // 3. Tables
      const tRes = await fetch("/api/owner/tables");
      const tData = await tRes.json();
      if (tData.success) setTables(tData.data);

      // 4. Reservations
      const rRes = await fetch("/api/owner/reservations");
      const rData = await rRes.json();
      if (rData.success) setReservations(rData.data);

      // 5. Bills
      const bRes = await fetch("/api/owner/bills");
      const bData = await bRes.json();
      if (bData.success) setBills(bData.data);

      // 6. Menu Categories
      const mRes = await fetch("/api/owner/menu");
      const mData = await mRes.json();
      if (mData.success) setMenuCategories(mData.data);

      // 7. Settings
      const sRes = await fetch("/api/owner/settings");
      const sData = await sRes.json();
      if (sData.success) setSettings(sData.data);

      // 8. Closures
      const cRes = await fetch("/api/owner/closures");
      const cData = await cRes.json();
      if (cData.success) setClosures(cData.data);
    } catch (err) {
      console.error("Dashboard fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    // Live polling every 5 seconds for orders and floor updates
    const timer = setInterval(() => {
      fetchAllData();
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/owner/auth/logout", { method: "POST" });
    router.push("/owner/login");
  };

  // Status transitions for orders
  const advanceOrderStatus = async (orderId: string, nextStatus: string) => {
    try {
      const res = await fetch(`/api/owner/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);
      setSuccessMsg(data.message);
      fetchAllData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update order");
    }
  };

  // Cancel order
  const cancelOrder = async (orderId: string) => {
    const reason = window.prompt("Reason for cancelling this order:", "Out of ingredients / Guest request");
    if (!reason) return;
    try {
      const res = await fetch(`/api/owner/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED", cancellationReason: reason }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);
      setSuccessMsg("Order cancelled and bill recalculated");
      fetchAllData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to cancel order");
    }
  };

  // Check In Reservation
  const checkInReservation = async (resId: string, tableId?: string) => {
    try {
      const res = await fetch(`/api/owner/reservations/${resId}/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);
      setSuccessMsg(data.message);
      fetchAllData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to check in reservation");
    }
  };

  // Confirm Reservation Modal Submit
  const handleConfirmReservation = async () => {
    if (!selectedRes) return;
    try {
      const res = await fetch(`/api/owner/reservations/${selectedRes.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "CONFIRMED",
          tableId: assignTableId || selectedRes.tableId,
          specialRequestApproved: approveSpecialReq,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);
      setSuccessMsg(`Reservation ${selectedRes.bookingReference} confirmed!`);
      setShowConfirmResModal(false);
      fetchAllData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to confirm reservation");
    }
  };

  // Reject Reservation Modal Submit
  const handleRejectReservation = async () => {
    if (!selectedRes) return;
    try {
      const res = await fetch(`/api/owner/reservations/${selectedRes.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "REJECTED",
          rejectionReason: rejectReason || "Fully booked for this timeframe",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);
      setSuccessMsg(`Reservation ${selectedRes.bookingReference} marked rejected.`);
      setShowRejectResModal(false);
      fetchAllData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to reject reservation");
    }
  };

  // Walk-in Submit
  const handleWalkInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInTableId) {
      setErrorMsg("Please select an available table for walk-in.");
      return;
    }
    try {
      const res = await fetch("/api/owner/walk-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableId: walkInTableId,
          guestName: walkInGuestName || "Walk-in Guest",
          guestCount: Number(walkInGuestCount),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);
      setSuccessMsg(data.message);
      setShowWalkInModal(false);
      setWalkInGuestName("");
      fetchAllData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to check in walk-in");
    }
  };

  // Record Payment Submit
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentBill || paymentAmount <= 0) return;

    try {
      const idempotencyKey = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const res = await fetch("/api/owner/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billId: paymentBill.id,
          amount: Number(paymentAmount),
          paymentMethod,
          referenceNote: paymentNote,
          idempotencyKey,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);
      setSuccessMsg(data.message);
      setShowPaymentModal(false);
      setPaymentNote("");
      fetchAllData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to record payment");
    }
  };

  // Close Visit & Free Table Submit
  const handleCloseVisit = async () => {
    if (!visitToClose) return;
    try {
      const res = await fetch(`/api/owner/visits/${visitToClose.id}/close`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);
      setSuccessMsg("Table visit concluded and table marked clean & free!");
      setShowCloseVisitModal(false);
      fetchAllData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to close visit");
    }
  };

  // Open Table QR code view
  const openQrCodeModal = async (tbl: any) => {
    setSelectedQrTable(tbl);
    setShowQrModal(true);
    const targetUrl = `${window.location.origin}/table/${tbl.id}`;
    try {
      const dataUrl = await QRCode.toDataURL(targetUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: "#1c1917",
          light: "#ffffff",
        },
      });
      setQrData({
        tableNumber: tbl.tableNumber,
        tableName: tbl.name,
        targetUrl,
        qrDataUrl: dataUrl,
      });
    } catch (err) {
      setQrData({
        tableNumber: tbl.tableNumber,
        tableName: tbl.name,
        targetUrl,
        qrDataUrl: `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(targetUrl)}`,
      });
    }
  };

  // Toggle Menu Item Availability
  const toggleItemAvailability = async (item: any) => {
    try {
      const res = await fetch(`/api/owner/menu/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: !item.isAvailable }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);
      fetchAllData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to toggle item availability");
    }
  };

  // Save / Edit Menu Item
  const handleSaveMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editMenuItem) {
        const res = await fetch(`/api/owner/menu/${editMenuItem.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            categoryId: menuCategoryId,
            name: menuName,
            description: menuDesc,
            price: Number(menuPrice),
            isVegetarian: menuIsVeg,
            isVegan: menuIsVegan,
            isGlutenFree: menuIsGf,
            isSpicy: menuIsSpicy,
            prepTimeMinutes: Number(menuPrepTime),
            photoUrl: menuPhotoUrl || null,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error);
        setSuccessMsg(`Menu item ${menuName} updated!`);
      } else {
        const res = await fetch("/api/owner/menu", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            categoryId: menuCategoryId,
            name: menuName,
            description: menuDesc,
            price: Number(menuPrice),
            isVegetarian: menuIsVeg,
            isVegan: menuIsVegan,
            isGlutenFree: menuIsGf,
            isSpicy: menuIsSpicy,
            prepTimeMinutes: Number(menuPrepTime),
            photoUrl: menuPhotoUrl || null,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error);
        setSuccessMsg(`Menu item ${menuName} added!`);
      }
      setShowMenuModal(false);
      fetchAllData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save menu item");
    }
  };

  // Update Settings Submit
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/owner/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);
      setSuccessMsg("Café settings updated!");
      fetchAllData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update settings");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-stone-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-stone-950 font-bold shadow-lg shadow-amber-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-xl sm:text-2xl font-bold text-stone-100">
                The Roasted Bean • Owner Command Center
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/50 text-[10px] font-bold uppercase">
                Live
              </span>
            </div>
            <div className="text-xs text-stone-400 flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
              <span>Timezone: <strong className="text-amber-400">Asia/Kolkata (IST)</strong></span>
              <span>•</span>
              <span>
                Business Day:{" "}
                <strong className="text-stone-200">
                  {dashboardData?.businessDay || format(new Date(), "yyyy-MM-dd")}
                </strong>{" "}
                (Cutover 04:00 AM)
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions & Navigation */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            href="/"
            target="_blank"
            className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 hover:text-white font-medium text-xs flex items-center gap-1.5 transition-colors"
          >
            <span>🌐 View Customer Website</span>
          </Link>
          <button
            onClick={() => setShowWalkInModal(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" /> Quick Walk-In
          </button>
          <button
            onClick={fetchAllData}
            className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-white"
            title="Refresh data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleLogout}
            className="px-3 py-2 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-stone-800">
        {[
          { id: "OVERVIEW", label: "Overview & KPIs", icon: TrendingUp },
          {
            id: "ORDERS",
            label: `Kitchen KDS (${liveOrders.filter((o) => o.status !== "SERVED" && o.status !== "CANCELLED").length})`,
            icon: Flame,
          },
          {
            id: "TABLES",
            label: `Floor & Tables (${tables.filter((t) => t.visits?.length > 0).length}/${tables.length} Seated)`,
            icon: Layers,
          },
          {
            id: "RESERVATIONS",
            label: `Reservations (${reservations.filter((r) => r.status === "REQUESTED").length} Pending)`,
            icon: Calendar,
          },
          { id: "BILLS", label: "Billing & Payments", icon: CreditCard },
          { id: "MENU", label: "Menu & Stock", icon: UtensilsCrossed },
          { id: "SETTINGS", label: "Cafe Settings & Closures", icon: SettingsIcon },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                isActive
                  ? "bg-amber-500 text-stone-950 shadow-lg shadow-amber-500/20"
                  : "bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800 hover:border-stone-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
        <Link
          href="/owner/qr-codes"
          className="px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap bg-stone-900 hover:bg-stone-800 text-amber-400 hover:text-amber-300 border border-stone-800 flex items-center gap-2 shrink-0 transition-colors"
        >
          <QrCode className="w-4 h-4 text-amber-500" />
          <span>Print Table QR Cards &rarr;</span>
        </Link>
      </div>

      {/* Toast Alerts */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg("")} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg("")} className="text-red-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Active Alerts Banner (e.g. Late arrivals, pending approvals) */}
      {dashboardData?.alerts && dashboardData.alerts.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-950/50 border border-amber-500/40 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <AlertCircle className="w-4 h-4" /> Live Operational Alerts ({dashboardData.alerts.length})
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {dashboardData.alerts.map((alt: any, idx: number) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-stone-900/90 border border-amber-500/30 text-xs text-stone-200 flex items-center justify-between gap-2"
              >
                <span>{alt.message}</span>
                <button
                  onClick={() => {
                    const found = reservations.find((r) => r.id === alt.reservationId);
                    if (found) {
                      setSelectedRes(found);
                      setAssignTableId(found.tableId || "");
                      setShowConfirmResModal(true);
                    }
                  }}
                  className="px-2 py-1 rounded bg-amber-500 text-stone-950 font-bold text-[10px] shrink-0"
                >
                  Review
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ----------------- SUB-TAB 1: OVERVIEW & KPIS ----------------- */}
      {activeTab === "OVERVIEW" && (
        <div className="space-y-8">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="glass-panel p-6 rounded-3xl border border-stone-800 space-y-2">
              <div className="flex items-center justify-between text-stone-400 text-xs font-semibold uppercase tracking-wider">
                <span>Today's Collected Sales</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="font-serif text-3xl font-extrabold text-emerald-400">
                ₹{dashboardData?.kpis?.collectedSales?.toFixed(2) || "0.00"}
              </div>
              <span className="text-[11px] text-stone-500">
                Shift: {dashboardData?.businessDay}
              </span>
            </div>

            <div className="glass-panel p-6 rounded-3xl border border-stone-800 space-y-2">
              <div className="flex items-center justify-between text-stone-400 text-xs font-semibold uppercase tracking-wider">
                <span>Active Unpaid Floor Balance</span>
                <CreditCard className="w-4 h-4 text-amber-400" />
              </div>
              <div className="font-serif text-3xl font-extrabold text-amber-400">
                ₹{dashboardData?.kpis?.unpaidBalance?.toFixed(2) || "0.00"}
              </div>
              <span className="text-[11px] text-stone-500">
                Across {dashboardData?.kpis?.activeVisitsCount || 0} seated tables
              </span>
            </div>

            <div className="glass-panel p-6 rounded-3xl border border-stone-800 space-y-2">
              <div className="flex items-center justify-between text-stone-400 text-xs font-semibold uppercase tracking-wider">
                <span>Today's Reservations</span>
                <Calendar className="w-4 h-4 text-blue-400" />
              </div>
              <div className="font-serif text-3xl font-extrabold text-blue-400">
                {dashboardData?.kpis?.reservationsTodayCount || 0}
              </div>
              <span className="text-[11px] text-stone-500">
                {dashboardData?.dayReservations?.filter((r: any) => r.status === "REQUESTED").length || 0} pending confirmation
              </span>
            </div>

            <div className="glass-panel p-6 rounded-3xl border border-stone-800 space-y-2">
              <div className="flex items-center justify-between text-stone-400 text-xs font-semibold uppercase tracking-wider">
                <span>Active Kitchen Orders</span>
                <Flame className="w-4 h-4 text-red-400" />
              </div>
              <div className="font-serif text-3xl font-extrabold text-red-400">
                {dashboardData?.kpis?.pendingOrdersCount + dashboardData?.kpis?.preparingOrdersCount || 0}
              </div>
              <span className="text-[11px] text-stone-500">
                {dashboardData?.kpis?.pendingOrdersCount || 0} pending, {dashboardData?.kpis?.preparingOrdersCount || 0} in prep
              </span>
            </div>
          </div>

          {/* Quick Floor Snapshot & Live Orders Split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Seated Tables */}
            <div className="glass-panel p-6 rounded-3xl border border-stone-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-base font-bold text-stone-100 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-500" />
                  Currently Occupied Tables ({dashboardData?.activeVisits?.length || 0})
                </h3>
                <button
                  onClick={() => setActiveTab("TABLES")}
                  className="text-amber-400 hover:text-amber-300 text-xs font-semibold"
                >
                  View Floor &rarr;
                </button>
              </div>

              {(!dashboardData?.activeVisits || dashboardData.activeVisits.length === 0) ? (
                <div className="p-8 text-center bg-stone-900/40 rounded-2xl text-stone-500 text-xs">
                  No active visits at this moment. Register a walk-in or check in guests.
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {dashboardData.activeVisits.map((v: any) => {
                    const paid = v.bill?.payments?.reduce((s: number, p: any) => s + (p.status === "COMPLETED" ? p.amount : 0), 0) || 0;
                    const balance = Math.max(0, (v.bill?.totalAmount || 0) - paid);
                    return (
                      <div
                        key={v.id}
                        className="p-4 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-stone-100 text-sm flex items-center gap-2">
                            <span>{v.table?.tableNumber}</span>
                            <span className="font-normal text-stone-400">• {v.guestName || "Walk-in"}</span>
                          </div>
                          <div className="text-stone-500 text-[11px] mt-0.5">
                            Visit Code: <strong className="text-amber-400 font-mono">{v.visitCode}</strong> • {v.orders?.length || 0} Orders Placed
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-serif font-bold text-stone-100 text-sm">
                            ₹{(v.bill?.totalAmount || 0).toFixed(2)}
                          </div>
                          <span
                            className={`text-[10px] font-bold uppercase ${
                              balance === 0 && v.bill?.totalAmount > 0
                                ? "text-emerald-400"
                                : "text-amber-400"
                            }`}
                          >
                            {balance === 0 && v.bill?.totalAmount > 0 ? "PAID" : `Unpaid: ₹${balance.toFixed(2)}`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Live Orders Preview */}
            <div className="glass-panel p-6 rounded-3xl border border-stone-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-base font-bold text-stone-100 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-red-500" />
                  Live Kitchen Queue
                </h3>
                <button
                  onClick={() => setActiveTab("ORDERS")}
                  className="text-amber-400 hover:text-amber-300 text-xs font-semibold"
                >
                  Open KDS Screen &rarr;
                </button>
              </div>

              {(!liveOrders || liveOrders.filter((o) => o.status !== "SERVED" && o.status !== "CANCELLED").length === 0) ? (
                <div className="p-8 text-center bg-stone-900/40 rounded-2xl text-stone-500 text-xs">
                  Kitchen queue is all caught up! No pending orders.
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {liveOrders
                    .filter((o) => o.status !== "SERVED" && o.status !== "CANCELLED")
                    .map((ord: any) => (
                      <div
                        key={ord.id}
                        className="p-4 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-between text-xs"
                      >
                        <div className="space-y-1">
                          <div className="font-bold text-stone-100 flex items-center gap-2">
                            <span>{ord.table?.tableNumber}</span>
                            <span className="text-amber-400 font-mono text-xs">{ord.orderNumber}</span>
                          </div>
                          <div className="text-stone-300">
                            {ord.items.map((i: any) => `${i.quantity}x ${i.itemNameSnapshot}`).join(", ")}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {ord.status === "PENDING" && (
                            <button
                              onClick={() => advanceOrderStatus(ord.id, "ACCEPTED")}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px]"
                            >
                              Accept
                            </button>
                          )}
                          {ord.status === "ACCEPTED" && (
                            <button
                              onClick={() => advanceOrderStatus(ord.id, "PREPARING")}
                              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px]"
                            >
                              Cook
                            </button>
                          )}
                          {ord.status === "PREPARING" && (
                            <button
                              onClick={() => advanceOrderStatus(ord.id, "SERVED")}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px]"
                            >
                              Serve
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- SUB-TAB 2: KITCHEN DISPLAY SYSTEM (KDS) ----------------- */}
      {activeTab === "ORDERS" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-xl font-bold text-stone-100 flex items-center gap-2">
              <Flame className="w-5 h-5 text-red-500" />
              Kitchen Display Stream (KDS)
            </h3>
            <span className="text-xs text-stone-400">
              Live updates every 5s • Audio alert ready
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {liveOrders.map((ord: any) => (
              <div
                key={ord.id}
                className={`glass-panel p-5 rounded-3xl border flex flex-col justify-between space-y-4 ${
                  ord.status === "PENDING"
                    ? "border-amber-500/60 shadow-lg shadow-amber-500/10"
                    : ord.status === "PREPARING"
                    ? "border-purple-500/60 shadow-lg shadow-purple-500/10"
                    : ord.status === "SERVED"
                    ? "border-stone-800 opacity-70"
                    : "border-stone-800 opacity-40"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 font-mono font-bold flex items-center justify-center text-sm">
                        {ord.table?.tableNumber}
                      </span>
                      <div>
                        <div className="font-mono text-xs font-bold text-stone-200">
                          {ord.orderNumber}
                        </div>
                        <div className="text-[11px] text-stone-500">
                          Round {ord.round} • {format(new Date(ord.placedAt), "hh:mm a")}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        ord.status === "PENDING"
                          ? "bg-amber-950 text-amber-300 border border-amber-500"
                          : ord.status === "ACCEPTED"
                          ? "bg-blue-950 text-blue-300 border border-blue-500"
                          : ord.status === "PREPARING"
                          ? "bg-purple-950 text-purple-300 border border-purple-500"
                          : ord.status === "SERVED"
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-500"
                          : "bg-red-950 text-red-400"
                      }`}
                    >
                      {ord.status}
                    </span>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-2 text-xs">
                    {ord.items.map((it: any) => (
                      <div
                        key={it.id}
                        className={`p-2 rounded-xl bg-stone-900 border border-stone-800 ${
                          it.status === "CANCELLED" ? "opacity-40 line-through" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold text-stone-200">
                          <span>{it.quantity}x {it.itemNameSnapshot}</span>
                          <span className="font-mono text-amber-400">₹{it.subtotalSnapshot.toFixed(0)}</span>
                        </div>
                        {it.customInstructions && (
                          <div className="text-[11px] text-amber-300 mt-1 italic">
                            Instruction: &quot;{it.customInstructions}&quot;
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {ord.notes && (
                    <div className="text-[11px] text-stone-400 italic bg-stone-950/60 p-2 rounded-xl border border-stone-800">
                      Table Note: {ord.notes}
                    </div>
                  )}
                </div>

                {/* State Transition Actions */}
                <div className="pt-3 border-t border-stone-800 flex items-center justify-between gap-2">
                  {ord.status !== "CANCELLED" && ord.status !== "SERVED" && (
                    <button
                      onClick={() => cancelOrder(ord.id)}
                      className="px-3 py-2 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-300 text-[11px] font-semibold"
                    >
                      Cancel Order
                    </button>
                  )}

                  <div className="flex items-center gap-1.5 ml-auto">
                    {ord.status === "PENDING" && (
                      <button
                        onClick={() => advanceOrderStatus(ord.id, "ACCEPTED")}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                      >
                        Accept Order
                      </button>
                    )}
                    {ord.status === "ACCEPTED" && (
                      <button
                        onClick={() => advanceOrderStatus(ord.id, "PREPARING")}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
                      >
                        Start Cooking
                      </button>
                    )}
                    {ord.status === "PREPARING" && (
                      <button
                        onClick={() => advanceOrderStatus(ord.id, "SERVED")}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                      >
                        Mark Served
                      </button>
                    )}
                    {ord.status === "SERVED" && (
                      <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Delivered to Table
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ----------------- SUB-TAB 3: FLOOR & TABLES ----------------- */}
      {activeTab === "TABLES" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-serif text-xl font-bold text-stone-100">
                Floor Plan & Seated Tables
              </h3>
              <p className="text-xs text-stone-400">
                Monitor live visits, generate QR cards, manage walk-in check-ins, or combine seating for large groups.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/owner/qr-codes"
                target="_blank"
                className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-800 hover:border-amber-500/50 font-semibold text-xs flex items-center gap-1.5 transition-all"
              >
                <Printer className="w-4 h-4 text-amber-500" />
                <span>Print Table QR Stands</span>
              </Link>
              <button
                onClick={() => setShowWalkInModal(true)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Check In Walk-In
              </button>
            </div>
          </div>

          {/* Tables Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {tables.map((tbl: any) => {
              const activeVisit = tbl.visits?.find((v: any) => v.status === "ACTIVE");
              const billTotal = activeVisit?.bill?.totalAmount || 0;
              const paidTotal =
                activeVisit?.bill?.payments?.reduce(
                  (s: number, p: any) => s + (p.status === "COMPLETED" ? p.amount : 0),
                  0
                ) || 0;
              const balance = Math.max(0, billTotal - paidTotal);

              return (
                <div
                  key={tbl.id}
                  className={`glass-panel p-5 rounded-3xl border flex flex-col justify-between space-y-4 transition-all ${
                    activeVisit
                      ? "border-amber-500/60 shadow-lg shadow-amber-500/10"
                      : "border-stone-800"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 font-mono font-bold flex items-center justify-center text-sm">
                          {tbl.tableNumber}
                        </span>
                        <div>
                          <h4 className="font-bold text-stone-100 text-sm">{tbl.name}</h4>
                          <span className="text-[11px] text-stone-400">
                            {tbl.section} • {tbl.capacityMin}–{tbl.capacityMax} Guests
                          </span>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          activeVisit
                            ? "bg-amber-950 text-amber-300 border border-amber-500/50 animate-pulse"
                            : "bg-emerald-950 text-emerald-300 border border-emerald-500/50"
                        }`}
                      >
                        {activeVisit ? "Occupied" : "Free"}
                      </span>
                    </div>

                    {/* Active visit details */}
                    {activeVisit ? (
                      <div className="p-3 rounded-2xl bg-stone-900 border border-stone-800 space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-stone-400">Guest:</span>
                          <strong className="text-stone-200">{activeVisit.guestName || "Walk-in"}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-400">Visit Code (PIN):</span>
                          <strong className="text-amber-400 font-mono text-sm">{activeVisit.visitCode}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-400">Orders / Bill:</span>
                          <span className="font-mono text-stone-200">
                            {activeVisit.orders?.length || 0} ords • ₹{billTotal.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-stone-800">
                          <span className="text-stone-400">Remaining Balance:</span>
                          <strong
                            className={`font-mono ${
                              balance === 0 && billTotal > 0 ? "text-emerald-400" : "text-amber-400"
                            }`}
                          >
                            ₹{balance.toFixed(2)}
                          </strong>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-stone-900/40 border border-stone-800/60 text-center text-xs text-stone-500 space-y-1">
                        <div>Table ready for guests.</div>
                        <div className="text-[11px] text-stone-600">Setup & cleanup verified</div>
                      </div>
                    )}
                  </div>

                  {/* Floor Actions */}
                  <div className="pt-3 border-t border-stone-800 flex flex-wrap items-center justify-between gap-2">
                    <button
                      onClick={() => openQrCodeModal(tbl)}
                      className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white text-xs flex items-center gap-1 border border-stone-800"
                      title="View QR Code"
                    >
                      <QrCode className="w-4 h-4 text-emerald-400" />
                    </button>

                    {activeVisit ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setPaymentBill(activeVisit.bill);
                            setPaymentAmount(balance > 0 ? balance : billTotal);
                            setShowPaymentModal(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1"
                        >
                          <CreditCard className="w-3.5 h-3.5" /> Settle
                        </button>
                        <button
                          onClick={() => {
                            setVisitToClose(activeVisit);
                            setShowCloseVisitModal(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-800 text-xs font-semibold"
                        >
                          Close Table
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setWalkInTableId(tbl.id);
                          setShowWalkInModal(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-400 text-xs font-semibold border border-stone-800"
                      >
                        Seat Walk-in
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ----------------- SUB-TAB 4: RESERVATIONS QUEUE ----------------- */}
      {activeTab === "RESERVATIONS" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="font-serif text-xl font-bold text-stone-100">
              Reservation Management Queue
            </h3>

            {/* Filter buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {["ALL", "REQUESTED", "CONFIRMED", "CHECKED_IN", "COMPLETED", "CANCELLED", "REJECTED"].map(
                (st) => (
                  <button
                    key={st}
                    onClick={() => setResStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      resStatusFilter === st
                        ? "bg-amber-500 text-stone-950"
                        : "bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800"
                    }`}
                  >
                    {st}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Search bar */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search reference, guest name, phone..."
              value={resSearch}
              onChange={(e) => setResSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-stone-900 border border-stone-800 focus:border-amber-500 focus:outline-none text-stone-100 text-xs"
            />
          </div>

          {/* Reservations List */}
          <div className="space-y-4">
            {reservations
              .filter((r) => {
                if (resStatusFilter !== "ALL" && r.status !== resStatusFilter) return false;
                if (resSearch.trim()) {
                  const q = resSearch.toLowerCase();
                  return (
                    r.bookingReference.toLowerCase().includes(q) ||
                    r.guestName.toLowerCase().includes(q) ||
                    r.guestPhone.toLowerCase().includes(q)
                  );
                }
                return true;
              })
              .map((res: any) => (
                <div
                  key={res.id}
                  className="glass-panel p-5 rounded-3xl border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono text-sm font-bold text-amber-400">
                        {res.bookingReference}
                      </span>
                      <span className="font-bold text-stone-100 text-base">{res.guestName}</span>
                      <span className="text-xs text-stone-400">({res.guestPhone})</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          res.status === "REQUESTED"
                            ? "bg-amber-950 text-amber-300 border border-amber-500/50"
                            : res.status === "CONFIRMED"
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-500/50"
                            : res.status === "CHECKED_IN"
                            ? "bg-blue-950 text-blue-300 border border-blue-500/50"
                            : "bg-stone-800 text-stone-400"
                        }`}
                      >
                        {res.status}
                      </span>
                    </div>

                    <div className="text-xs text-stone-400 flex flex-wrap items-center gap-3">
                      <span>
                        📅 {format(new Date(res.startDateTime), "dd MMM yyyy, hh:mm a")} ({res.durationMinutes} mins)
                      </span>
                      <span>•</span>
                      <span>👥 {res.guestCount} Guests</span>
                      <span>•</span>
                      <span>
                        🪑 Table: <strong className="text-stone-200">{res.table?.tableNumber || "Unassigned"}</strong>
                      </span>
                      {res.occasion && <span>• 🎉 {res.occasion}</span>}
                    </div>

                    {res.specialRequest && (
                      <div className="text-xs text-amber-200 bg-amber-950/40 p-2.5 rounded-xl border border-amber-900/60 flex items-center justify-between gap-4">
                        <span>Special Request: &quot;{res.specialRequest}&quot;</span>
                        {res.specialRequestApproved ? (
                          <span className="text-[10px] font-bold text-emerald-400 uppercase">
                            ✓ Accepted
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-400 uppercase">
                            ⏳ Needs Review
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {res.status === "REQUESTED" && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedRes(res);
                            setAssignTableId(res.tableId || "");
                            setApproveSpecialReq(true);
                            setShowConfirmResModal(true);
                          }}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Accept & Confirm
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRes(res);
                            setShowRejectResModal(true);
                          }}
                          className="px-3 py-2 rounded-xl bg-red-950 hover:bg-red-900 text-red-300 font-semibold text-xs border border-red-500/40"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {res.status === "CONFIRMED" && (
                      <button
                        onClick={() => checkInReservation(res.id, res.tableId)}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                      >
                        <UtensilsCrossed className="w-3.5 h-3.5" /> Check-in Guest
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ----------------- SUB-TAB 5: BILLING & EXTERNAL PAYMENTS ----------------- */}
      {activeTab === "BILLS" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-serif text-xl font-bold text-stone-100">
                Consolidated Bills & Payments History
              </h3>
              <p className="text-xs text-stone-400">
                Itemized bills snapshot prices at order time. Record full or partial payments in Cash, UPI, or Card.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {["ALL", "UNPAID", "PARTIALLY_PAID", "PAID"].map((st) => (
                <button
                  key={st}
                  onClick={() => setBillStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                    billStatusFilter === st
                      ? "bg-amber-500 text-stone-950"
                      : "bg-stone-900 text-stone-400 border border-stone-800"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {bills
              .filter((b) => billStatusFilter === "ALL" || b.status === billStatusFilter)
              .map((b: any) => {
                const paid =
                  b.payments?.reduce((s: number, p: any) => s + (p.status === "COMPLETED" ? p.amount : 0), 0) ||
                  0;
                const balance = Math.max(0, b.totalAmount - paid);

                return (
                  <div
                    key={b.id}
                    className="glass-panel p-6 rounded-3xl border border-stone-800 space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 pb-3">
                      <div>
                        <div className="font-mono text-base font-bold text-amber-400">{b.billNumber}</div>
                        <div className="text-xs text-stone-400">
                          Table: <strong className="text-stone-200">{b.table?.tableNumber}</strong> • Guest:{" "}
                          <strong className="text-stone-200">{b.visit?.guestName || "Guest"}</strong>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            b.status === "PAID"
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-500/50"
                              : b.status === "PARTIALLY_PAID"
                              ? "bg-amber-950 text-amber-400 border border-amber-500/50"
                              : "bg-red-950 text-red-400 border border-red-500/50"
                          }`}
                        >
                          {b.status}
                        </span>

                        {balance > 0 && (
                          <button
                            onClick={() => {
                              setPaymentBill(b);
                              setPaymentAmount(balance);
                              setShowPaymentModal(true);
                            }}
                            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5"
                          >
                            <CreditCard className="w-3.5 h-3.5" /> Record Payment
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Breakdown */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div className="p-3 rounded-xl bg-stone-900 border border-stone-800">
                        <span className="text-stone-500 block">Subtotal:</span>
                        <strong className="text-stone-200 font-mono text-sm">₹{b.subtotal.toFixed(2)}</strong>
                      </div>
                      <div className="p-3 rounded-xl bg-stone-900 border border-stone-800">
                        <span className="text-stone-500 block">GST ({b.taxRatePercent}%):</span>
                        <strong className="text-stone-200 font-mono text-sm">₹{b.taxAmount.toFixed(2)}</strong>
                      </div>
                      <div className="p-3 rounded-xl bg-stone-900 border border-stone-800">
                        <span className="text-stone-500 block">Total Billed:</span>
                        <strong className="text-amber-400 font-mono text-sm">₹{b.totalAmount.toFixed(2)}</strong>
                      </div>
                      <div className="p-3 rounded-xl bg-stone-900 border border-stone-800">
                        <span className="text-stone-500 block">Paid / Remaining:</span>
                        <strong className="text-emerald-400 font-mono text-sm">
                          ₹{paid.toFixed(2)} / ₹{balance.toFixed(2)}
                        </strong>
                      </div>
                    </div>

                    {/* Payments log */}
                    {b.payments && b.payments.length > 0 && (
                      <div className="text-xs text-stone-400 space-y-1">
                        <span className="font-semibold text-stone-300">Payment Transactions:</span>
                        {b.payments.map((p: any) => (
                          <div key={p.id} className="flex items-center gap-2">
                            <span>• {p.paymentMethod}</span>
                            <span>(₹{p.amount.toFixed(2)})</span>
                            <span className="text-stone-500">at {format(new Date(p.paidAt), "hh:mm a")}</span>
                            {p.referenceNote && <span className="italic text-stone-500">- {p.referenceNote}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ----------------- SUB-TAB 6: MENU MANAGEMENT ----------------- */}
      {activeTab === "MENU" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-serif text-xl font-bold text-stone-100">
                Menu & Real-Time Availability
              </h3>
              <p className="text-xs text-stone-400">
                Instantly toggle In-Stock / Sold-Out or update dish prices and descriptions.
              </p>
            </div>

            <button
              onClick={() => {
                setEditMenuItem(null);
                setMenuCategoryId(menuCategories[0]?.id || "");
                setMenuName("");
                setMenuDesc("");
                setMenuPrice(250);
                setMenuIsVeg(true);
                setShowMenuModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Menu Item
            </button>
          </div>

          <div className="space-y-6">
            {menuCategories.map((cat: any) => (
              <div key={cat.id} className="glass-panel p-6 rounded-3xl border border-stone-800 space-y-4">
                <h4 className="font-serif text-lg font-bold text-amber-400 border-b border-stone-800 pb-2">
                  {cat.name} ({cat.items?.length || 0} Items)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cat.items?.map((item: any) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <strong className="text-stone-100 text-sm">{item.name}</strong>
                          <span className="font-serif font-bold text-amber-400">₹{item.price}</span>
                        </div>
                        <p className="text-xs text-stone-400 line-clamp-2">{item.description}</p>
                      </div>

                      <div className="pt-2 border-t border-stone-800 flex items-center justify-between">
                        <button
                          onClick={() => toggleItemAvailability(item)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                            item.isAvailable
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-500/40"
                              : "bg-red-950 text-red-400 border border-red-500/40"
                          }`}
                        >
                          {item.isAvailable ? "In Stock" : "Sold Out"}
                        </button>

                        <button
                          onClick={() => {
                            setEditMenuItem(item);
                            setMenuCategoryId(item.categoryId);
                            setMenuName(item.name);
                            setMenuDesc(item.description);
                            setMenuPrice(item.price);
                            setMenuIsVeg(item.isVegetarian);
                            setMenuIsVegan(item.isVegan);
                            setMenuIsGf(item.isGlutenFree);
                            setMenuIsSpicy(item.isSpicy);
                            setMenuPrepTime(item.prepTimeMinutes);
                            setMenuPhotoUrl(item.photoUrl || "");
                            setShowMenuModal(true);
                          }}
                          className="text-stone-400 hover:text-white text-xs"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ----------------- SUB-TAB 7: SETTINGS & CLOSURES ----------------- */}
      {activeTab === "SETTINGS" && settings && (
        <div className="space-y-8">
          <form onSubmit={handleSaveSettings} className="glass-panel p-6 sm:p-8 rounded-3xl border border-stone-800 space-y-6">
            <h3 className="font-serif text-xl font-bold text-stone-100 border-b border-stone-800 pb-3">
              Café Operational Parameters & Buffers
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-300">Daily Opening Time (HH:mm)</label>
                <input
                  type="time"
                  value={settings.openingTime}
                  onChange={(e) => setSettings({ ...settings, openingTime: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-300">Daily Closing Time (HH:mm)</label>
                <input
                  type="time"
                  value={settings.closingTime}
                  onChange={(e) => setSettings({ ...settings, closingTime: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-300">Business Day Cutoff Hour (e.g. 4 for 4 AM)</label>
                <input
                  type="number"
                  min={0}
                  max={12}
                  value={settings.businessDayCutoffHour}
                  onChange={(e) =>
                    setSettings({ ...settings, businessDayCutoffHour: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-300">Setup Buffer Before (Mins)</label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={settings.bufferBeforeMinutes}
                  onChange={(e) =>
                    setSettings({ ...settings, bufferBeforeMinutes: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-300">Cleanup Buffer After (Mins)</label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={settings.bufferAfterMinutes}
                  onChange={(e) =>
                    setSettings({ ...settings, bufferAfterMinutes: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-300">Late Grace Period (Mins)</label>
                <input
                  type="number"
                  min={5}
                  max={60}
                  value={settings.gracePeriodMinutes}
                  onChange={(e) =>
                    setSettings({ ...settings, gracePeriodMinutes: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md"
              >
                Save Settings
              </button>
            </div>
          </form>

          {/* Printable QR Tent Cards Section */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-stone-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-serif text-lg font-bold text-stone-100">
                  Table QR Tent Cards (Physical Printing)
                </h4>
                <p className="text-xs text-stone-400">
                  Generate high resolution printable cards for each table.
                </p>
              </div>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Print All QR Cards
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {tables.map((t: any) => (
                <div
                  key={t.id}
                  className="p-4 rounded-2xl bg-stone-900 border border-stone-800 text-center space-y-2"
                >
                  <strong className="text-stone-100 text-sm block">{t.tableNumber}</strong>
                  <span className="text-[11px] text-stone-400 block">{t.name}</span>
                  <button
                    onClick={() => openQrCodeModal(t)}
                    className="w-full py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500 border border-amber-500/40 text-amber-400 hover:text-stone-950 font-bold text-xs flex items-center justify-center gap-1"
                  >
                    <QrCode className="w-3.5 h-3.5" /> View QR
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- MODAL: WALK-IN CHECK-IN ----------------- */}
      {showWalkInModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl max-w-md w-full space-y-5 border border-amber-500/40 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl font-bold text-stone-100">Register Walk-in Guest</h3>
              <button onClick={() => setShowWalkInModal(false)} className="text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleWalkInSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-300">Select Table *</label>
                <select
                  required
                  value={walkInTableId}
                  onChange={(e) => setWalkInTableId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 text-xs"
                >
                  <option value="">-- Choose Free Table --</option>
                  {tables
                    .filter((t) => !t.visits?.some((v: any) => v.status === "ACTIVE"))
                    .map((t: any) => (
                      <option key={t.id} value={t.id}>
                        {t.tableNumber} - {t.name} ({t.capacityMin}–{t.capacityMax} Guests)
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-300">Guest Name / Party</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={walkInGuestName}
                  onChange={(e) => setWalkInGuestName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-300">Guest Count</label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={walkInGuestCount}
                  onChange={(e) => setWalkInGuestCount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowWalkInModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-900 text-stone-400 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs"
                >
                  Check In & Generate Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL: CONFIRM RESERVATION ----------------- */}
      {showConfirmResModal && selectedRes && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl max-w-lg w-full space-y-5 border border-emerald-500/40 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="font-serif text-xl font-bold text-stone-100">
                Accept Reservation {selectedRes.bookingReference}
              </h3>
              <button onClick={() => setShowConfirmResModal(false)} className="text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-stone-300">
              <div>Guest: <strong>{selectedRes.guestName}</strong> ({selectedRes.guestCount} Guests)</div>
              <div>Time: <strong>{format(new Date(selectedRes.startDateTime), "dd MMM, hh:mm a")}</strong></div>
              {selectedRes.specialRequest && (
                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-900 text-amber-200 italic">
                  Special Request: &quot;{selectedRes.specialRequest}&quot;
                </div>
              )}
            </div>

            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-300">Assign / Reassign Table</label>
                <select
                  value={assignTableId}
                  onChange={(e) => setAssignTableId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 text-xs"
                >
                  {tables.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.tableNumber} - {t.name} ({t.capacityMin}–{t.capacityMax} Guests)
                    </option>
                  ))}
                </select>
              </div>

              {selectedRes.specialRequest && (
                <label className="flex items-center gap-2 text-xs text-stone-200 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={approveSpecialReq}
                    onChange={(e) => setApproveSpecialReq(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500"
                  />
                  <span>Explicitly accept and accommodate special seating/occasion request</span>
                </label>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setShowConfirmResModal(false)}
                className="px-4 py-2 rounded-xl bg-stone-900 text-stone-400 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReservation}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- MODAL: REJECT RESERVATION ----------------- */}
      {showRejectResModal && selectedRes && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl max-w-md w-full space-y-5 border border-red-500/40 shadow-2xl">
            <h3 className="font-serif text-xl font-bold text-stone-100">
              Reject Reservation {selectedRes.bookingReference}
            </h3>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-300">Reason for Rejection</label>
              <input
                type="text"
                placeholder="e.g. Fully booked / Private event scheduled"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setShowRejectResModal(false)}
                className="px-4 py-2 rounded-xl bg-stone-900 text-stone-400 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectReservation}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
              >
                Reject Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- MODAL: RECORD PAYMENT ----------------- */}
      {showPaymentModal && paymentBill && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl max-w-md w-full space-y-5 border border-amber-500/40 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="font-serif text-xl font-bold text-stone-100">
                Record External Payment
              </h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div className="p-3 rounded-2xl bg-stone-900 border border-stone-800 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-stone-400">Bill Number:</span>
                  <strong className="text-amber-400 font-mono">{paymentBill.billNumber}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Total Billed:</span>
                  <strong className="text-stone-100 font-mono">₹{paymentBill.totalAmount.toFixed(2)}</strong>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-300">Payment Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 font-mono text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-300">Payment Method *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 text-xs"
                >
                  <option value="UPI_QR">UPI / QR Code Scan</option>
                  <option value="CASH">Cash Settlement</option>
                  <option value="CREDIT_CARD">Credit Card Terminal</option>
                  <option value="DEBIT_CARD">Debit Card Terminal</option>
                  <option value="OTHER">Other Method</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-300">Reference Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. UPI txn ref / Cash note"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-900 text-stone-400 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                >
                  Confirm Payment Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL: CLOSE VISIT & CHECKOUT ----------------- */}
      {showCloseVisitModal && visitToClose && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl max-w-md w-full space-y-5 border border-stone-700 shadow-2xl">
            <h3 className="font-serif text-xl font-bold text-stone-100">
              Close Table Visit & Free Table
            </h3>
            <p className="text-xs text-stone-400">
              This will conclude the active visit on Table{" "}
              <strong>{visitToClose.table?.tableNumber}</strong>, invalidate the Visit Code (
              {visitToClose.visitCode}), and mark the table clean and ready for new guests.
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setShowCloseVisitModal(false)}
                className="px-4 py-2 rounded-xl bg-stone-900 text-stone-400 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleCloseVisit}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs"
              >
                Confirm Table Checkout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- MODAL: VIEW TABLE QR CODE ----------------- */}
      {showQrModal && selectedQrTable && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel p-8 rounded-3xl max-w-sm w-full space-y-6 text-center border border-amber-500/40 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <strong className="text-stone-100 text-sm">
                {selectedQrTable.tableNumber} - {selectedQrTable.name}
              </strong>
              <button onClick={() => setShowQrModal(false)} className="text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {qrData?.qrDataUrl ? (
              <div className="space-y-3">
                <div className="p-4 bg-white rounded-2xl inline-block shadow-xl">
                  <img src={qrData.qrDataUrl} alt="Table QR Code" className="w-56 h-56 mx-auto" />
                </div>
                <div className="text-[11px] text-stone-400">
                  Scan to launch live table ordering for Table {selectedQrTable.tableNumber}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-stone-500">Generating QR code...</div>
            )}

            <div className="pt-2">
              <Link
                href={`/table/${selectedQrTable.id}?visit=7492`}
                target="_blank"
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <UtensilsCrossed className="w-3.5 h-3.5" /> Open Table Portal Directly
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- MODAL: ADD / EDIT MENU ITEM ----------------- */}
      {showMenuModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl max-w-lg w-full space-y-5 border border-amber-500/40 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="font-serif text-xl font-bold text-stone-100">
                {editMenuItem ? `Edit ${editMenuItem.name}` : "Add New Menu Item"}
              </h3>
              <button onClick={() => setShowMenuModal(false)} className="text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMenuItem} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-stone-300">Category *</label>
                  <select
                    value={menuCategoryId}
                    onChange={(e) => setMenuCategoryId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-100"
                  >
                    {menuCategories.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-stone-300">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={menuPrice}
                    onChange={(e) => setMenuPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-stone-300">Item Name *</label>
                <input
                  type="text"
                  required
                  value={menuName}
                  onChange={(e) => setMenuName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-100"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-stone-300">Description</label>
                <textarea
                  rows={2}
                  value={menuDesc}
                  onChange={(e) => setMenuDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-100"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={menuIsVeg}
                    onChange={(e) => setMenuIsVeg(e.target.checked)}
                    className="rounded text-amber-500"
                  />
                  <span>Vegetarian</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={menuIsVegan}
                    onChange={(e) => setMenuIsVegan(e.target.checked)}
                    className="rounded text-amber-500"
                  />
                  <span>Vegan</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={menuIsGf}
                    onChange={(e) => setMenuIsGf(e.target.checked)}
                    className="rounded text-amber-500"
                  />
                  <span>Gluten-Free</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={menuIsSpicy}
                    onChange={(e) => setMenuIsSpicy(e.target.checked)}
                    className="rounded text-amber-500"
                  />
                  <span>Spicy</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowMenuModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-900 text-stone-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
