"use client";

import { useState, useEffect, use, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  QrCode,
  UtensilsCrossed,
  Clock,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Receipt,
  MessageSquare,
  Sparkles,
  RefreshCw,
  X,
  CreditCard,
  ChevronRight,
  Leaf,
  Flame,
  Check,
  Layers,
} from "lucide-react";
import { format } from "date-fns";

interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  customInstructions?: string;
}

export default function TableOrderingPage({
  params,
}: {
  params: Promise<{ tableId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto px-4 py-20 text-center text-stone-500 text-sm">
          Loading table session...
        </div>
      }
    >
      <TableOrderingContent params={params} />
    </Suspense>
  );
}

function TableOrderingContent({
  params,
}: {
  params: Promise<{ tableId: string }>;
}) {
  const resolvedParams = use(params);
  const tableId = resolvedParams.tableId;
  const searchParams = useSearchParams();
  const queryVisitCode = searchParams.get("visit") || "";

  // Visit & Authentication
  const [visitCode, setVisitCode] = useState(queryVisitCode);
  const [visitData, setVisitData] = useState<any>(null);
  const [isValidated, setIsValidated] = useState(false);
  const [validating, setValidating] = useState(false);
  const [valError, setValError] = useState("");

  // Menu & Categories
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState("ALL");
  const [search, setSearch] = useState("");

  // Cart & Order Placement
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderNotes, setOrderNotes] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState("");
  const [showCartDrawer, setShowCartDrawer] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<"MENU" | "ORDERS" | "BILL">("MENU");

  // Load Menu
  useEffect(() => {
    fetch("/api/menu")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setCategories(data.data);
      })
      .catch(console.error);
  }, []);

  // Check Table ID or Demo redirect
  useEffect(() => {
    if (tableId === "demo") {
      // Find first table with active visit or fallback to T-01
      fetch("/api/tables")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data.length > 0) {
            const firstT = data.data.find((t: any) => t.tableNumber === "T-01") || data.data[0];
            window.location.href = `/table/${firstT.id}?visit=7492`;
          }
        });
    }
  }, [tableId]);

  // Auto-connect to Table Session on QR scan
  useEffect(() => {
    if (!tableId || tableId === "demo") return;

    setValidating(true);
    setValError("");

    fetch(`/api/tables/${tableId}/session`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setVisitData(data.data);
          setVisitCode(data.data.visitCode || "");
          setIsValidated(true);
        } else {
          setValError(data.error || "Failed to connect to table session.");
          setIsValidated(false);
        }
      })
      .catch((err) => {
        console.error(err);
        setValError("Network error while connecting to table session.");
        setIsValidated(false);
      })
      .finally(() => {
        setValidating(false);
      });
  }, [tableId]);

  // Auto-polling for live order status & bill every 4 seconds when validated
  useEffect(() => {
    if (!isValidated || !visitData?.id) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/visit/${visitData.id}/live?code=${visitCode}`);
        const data = await res.json();
        if (data.success) {
          setVisitData(data.data);
          // If visit was closed, expire state
          if (data.data.status !== "ACTIVE") {
            setIsValidated(false);
            setValError("This table visit has concluded. Thank you for dining with us!");
          }
        }
      } catch (err) {
        console.error("Live poll error", err);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isValidated, visitData?.id, visitCode]);

  // Cart operations
  const addToCart = (item: any) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === item.id);
      if (existing) {
        return prev.map((c) =>
          c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [
        ...prev,
        {
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
        },
      ];
    });
  };

  const updateQuantity = (menuItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.menuItemId === menuItemId) {
            const newQ = c.quantity + delta;
            return newQ > 0 ? { ...c, quantity: newQ } : null;
          }
          return c;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const updateInstruction = (menuItemId: string, text: string) => {
    setCart((prev) =>
      prev.map((c) => (c.menuItemId === menuItemId ? { ...c, customInstructions: text } : c))
    );
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Place Order Round
  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    setPlacingOrder(true);
    setOrderError("");
    setOrderSuccess("");

    try {
      const idempotencyKey = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableId,
          visitCode,
          items: cart.map((c) => ({
            menuItemId: c.menuItemId,
            quantity: c.quantity,
            customInstructions: c.customInstructions,
          })),
          notes: orderNotes,
          idempotencyKey,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to place order round.");
      }

      setOrderSuccess(`Order ${data.data.orderNumber} sent to kitchen!`);
      setCart([]);
      setOrderNotes("");
      setShowCartDrawer(false);
      setActiveTab("ORDERS");

      // Refresh live visit state immediately
      const liveRes = await fetch(`/api/visit/${visitData.id}/live?code=${visitCode}`);
      const liveData = await liveRes.json();
      if (liveData.success) {
        setVisitData(liveData.data);
      }
    } catch (err: any) {
      setOrderError(err.message || "Failed to place order.");
    } finally {
      setPlacingOrder(false);
    }
  };

  // Helper for Order Status Badge
  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
            <Clock className="w-3 h-3 animate-pulse text-amber-600" /> Pending Kitchen Acceptance
          </span>
        );
      case "ACCEPTED":
        return (
          <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
            <Check className="w-3 h-3 text-blue-600" /> Accepted by Chef
          </span>
        );
      case "PREPARING":
        return (
          <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-800 border border-purple-200 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
            <Flame className="w-3 h-3 animate-bounce text-purple-600" /> Preparing in Kitchen
          </span>
        );
      case "SERVED":
        return (
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Served at Table
          </span>
        );
      case "CANCELLED":
        return (
          <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-800 border border-red-200 text-[11px] font-bold uppercase tracking-wider shadow-sm">
            Cancelled
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Connecting / Loading state or Error state */}
      {!isValidated ? (
        <div className="bg-white p-8 sm:p-12 rounded-3xl max-w-md mx-auto text-center space-y-6 border border-stone-200 shadow-xl">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center mx-auto shadow-sm">
            {validating ? (
              <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <QrCode className="w-8 h-8 text-amber-700" />
            )}
          </div>

          <div className="space-y-2">
            <h2 className="font-serif text-2xl font-bold text-stone-900">
              {validating ? "Opening Table Menu..." : "Table Session Error"}
            </h2>
            <p className="text-xs text-stone-600 leading-relaxed">
              {validating
                ? "Connecting your phone to this table to unlock instant QR dining..."
                : valError || "Unable to find or connect to this table."}
            </p>
          </div>

          {!validating && (
            <div className="pt-2">
              <Link
                href="/table"
                className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs inline-flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20"
              >
                <Layers className="w-4 h-4" />
                <span>Choose Your Table</span>
              </Link>
            </div>
          )}
        </div>
      ) : (
        /* Validated Active Visit Portal */
        <div className="space-y-6">
          {/* Table & Visit Header Bar */}
          <div className="bg-white p-4 sm:p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center font-bold text-lg font-mono">
                {visitData.table?.tableNumber || "T"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-serif text-lg sm:text-xl font-bold text-stone-900">
                    {visitData.table?.name || "Café Table"}
                  </h2>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold uppercase">
                    Live Active Visit
                  </span>
                </div>
                <div className="text-xs text-stone-600 flex flex-wrap items-center gap-2 sm:gap-3 mt-0.5">
                  <span>Guest: <strong className="text-stone-900">{visitData.guestName || "Guest"}</strong></span>
                  <span>•</span>
                  <span>Visit Code: <strong className="text-amber-800 font-mono">{visitData.visitCode}</strong></span>
                  <span>•</span>
                  <Link
                    href="/table"
                    className="inline-flex items-center gap-1 text-amber-700 hover:text-amber-800 font-semibold underline underline-offset-2 hover:opacity-90"
                    title="Choose a different table"
                  >
                    <Layers className="w-3 h-3" />
                    <span>Change Table</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* View Switching Tabs */}
            <div className="flex items-center gap-1 bg-stone-100 p-1.5 rounded-2xl border border-stone-200">
              <button
                onClick={() => setActiveTab("MENU")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === "MENU"
                    ? "bg-amber-600 text-white shadow-md shadow-amber-600/20 font-bold"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <UtensilsCrossed className="w-3.5 h-3.5" /> Order Menu
              </button>
              <button
                onClick={() => setActiveTab("ORDERS")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === "ORDERS"
                    ? "bg-amber-600 text-white shadow-md shadow-amber-600/20 font-bold"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Live Status ({visitData.orders?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab("BILL")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === "BILL"
                    ? "bg-amber-600 text-white shadow-md shadow-amber-600/20 font-bold"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <Receipt className="w-3.5 h-3.5" /> Running Bill
              </button>
            </div>
          </div>

          {orderSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{orderSuccess}</span>
              </div>
              <button onClick={() => setOrderSuccess("")} className="text-emerald-700 hover:text-emerald-950">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {orderError && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-center gap-2 shadow-sm">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span>{orderError}</span>
            </div>
          )}

          {/* TAB 1: ORDER MENU */}
          {activeTab === "MENU" && (
            <div className="space-y-6">
              {/* Category selector */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <button
                  onClick={() => setSelectedCat("ALL")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCat === "ALL"
                      ? "bg-amber-600 text-white font-bold shadow-sm"
                      : "bg-white text-stone-700 hover:text-stone-900 border border-stone-200 shadow-sm"
                  }`}
                >
                  All Items
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCat(cat.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      selectedCat === cat.id
                        ? "bg-amber-600 text-white font-bold shadow-sm"
                        : "bg-white text-stone-700 hover:text-stone-900 border border-stone-200 shadow-sm"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {categories
                  .filter((cat) => selectedCat === "ALL" || cat.id === selectedCat)
                  .flatMap((cat) => cat.items)
                  .map((item) => {
                    const cartItem = cart.find((c) => c.menuItemId === item.id);
                    return (
                      <div
                        key={item.id}
                        className={`bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex gap-4 justify-between items-center transition-all ${
                          !item.isAvailable ? "opacity-50" : "hover:border-amber-300"
                        }`}
                      >
                        <div className="space-y-1 max-w-[65%]">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-stone-900 text-sm">
                              {item.name}
                            </span>
                            {item.isVegetarian && (
                              <Leaf className="w-3 h-3 text-emerald-600 shrink-0" />
                            )}
                            {item.isSpicy && (
                              <Flame className="w-3 h-3 text-red-600 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-stone-600 line-clamp-2">
                            {item.description}
                          </p>
                          <div className="font-serif text-sm font-bold text-amber-800 pt-1">
                            ₹{item.price.toFixed(0)}
                          </div>
                        </div>

                        {/* Add to Cart Actions */}
                        <div className="shrink-0">
                          {!item.isAvailable ? (
                            <span className="text-[10px] text-red-600 font-semibold uppercase">
                              Sold Out
                            </span>
                          ) : cartItem ? (
                            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-1">
                              <button
                                onClick={() => updateQuantity(item.id, -1)}
                                className="w-7 h-7 rounded-lg bg-white hover:bg-stone-100 text-amber-800 flex items-center justify-center text-xs font-bold border border-stone-200 shadow-xs"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-xs font-bold text-amber-900 px-1">
                                {cartItem.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, 1)}
                                className="w-7 h-7 rounded-lg bg-white hover:bg-stone-100 text-amber-800 flex items-center justify-center text-xs font-bold border border-stone-200 shadow-xs"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(item)}
                              className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-600 border border-amber-200 text-amber-800 hover:text-white font-bold text-xs transition-all flex items-center gap-1 shadow-sm"
                            >
                              <Plus className="w-3.5 h-3.5" /> Add
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Floating Bottom Cart Bar */}
              {cart.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-md w-[92%] bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-amber-300 flex items-center justify-between shadow-2xl">
                  <div className="space-y-0.5">
                    <span className="text-xs text-stone-600 font-medium">
                      {cart.reduce((s, i) => s + i.quantity, 0)} Items Selected
                    </span>
                    <div className="font-serif text-lg font-bold text-amber-800">
                      ₹{cartTotal.toFixed(0)}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCartDrawer(true)}
                    className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-lg shadow-amber-600/25 flex items-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" /> Review & Send Order
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LIVE ORDERS TRACKER */}
          {activeTab === "ORDERS" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-600" />
                  Your Table Orders Stream
                </h3>
                <span className="text-xs text-stone-600 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live kitchen sync
                </span>
              </div>

              {(!visitData.orders || visitData.orders.length === 0) ? (
                <div className="bg-white p-12 rounded-3xl text-center space-y-3 border border-stone-200 shadow-sm">
                  <ShoppingBag className="w-10 h-10 text-stone-400 mx-auto" />
                  <h4 className="font-bold text-stone-900">No orders placed yet</h4>
                  <p className="text-xs text-stone-600">Switch to the menu tab to order food and drinks!</p>
                  <button
                    onClick={() => setActiveTab("MENU")}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm"
                  >
                    Browse Menu
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {visitData.orders.map((ord: any) => (
                    <div
                      key={ord.id}
                      className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
                        <div>
                          <span className="text-xs font-bold text-amber-800 font-mono">
                            {ord.orderNumber} (Round {ord.round})
                          </span>
                          <span className="text-stone-500 text-[11px] block">
                            Placed at {format(new Date(ord.placedAt), "hh:mm a")}
                          </span>
                        </div>
                        <div>{getOrderStatusBadge(ord.status)}</div>
                      </div>

                      {/* Items list */}
                      <div className="space-y-2">
                        {ord.items.map((it: any) => (
                          <div
                            key={it.id}
                            className={`flex items-start justify-between text-xs py-1 ${
                              it.status === "CANCELLED" ? "opacity-50 line-through" : ""
                            }`}
                          >
                            <div>
                              <strong className="text-stone-900">
                                {it.quantity}x {it.itemNameSnapshot}
                              </strong>
                              {it.customInstructions && (
                                <span className="text-[11px] text-amber-700 block italic">
                                  Note: {it.customInstructions}
                                </span>
                              )}
                            </div>
                            <span className="font-serif font-bold text-amber-800">
                              ₹{it.subtotalSnapshot.toFixed(0)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {ord.notes && (
                        <div className="pt-2 text-[11px] text-stone-600 italic bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                          Table Instructions: {ord.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: RUNNING BILL */}
          {activeTab === "BILL" && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                <div className="space-y-0.5">
                  <div className="text-xs text-stone-500">Table Bill Receipt</div>
                  <h3 className="font-mono text-lg font-bold text-amber-800">
                    {visitData.bill?.billNumber || "BILL-IN-PROGRESS"}
                  </h3>
                </div>
                <div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      visitData.bill?.status === "PAID"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : visitData.bill?.status === "PARTIALLY_PAID"
                        ? "bg-amber-50 text-amber-800 border border-amber-200"
                        : "bg-stone-100 text-stone-700 border border-stone-200"
                    }`}
                  >
                    {visitData.bill?.status || "UNPAID"}
                  </span>
                </div>
              </div>

              {/* Itemized active items */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  Consolidated Ordered Items (Snapshot Pricing)
                </h4>
                {visitData.orders?.flatMap((o: any) => o.items).filter((i: any) => i.status !== "CANCELLED").length === 0 ? (
                  <div className="text-xs text-stone-400 py-4 text-center">No active items on bill yet.</div>
                ) : (
                  <div className="space-y-2 text-xs">
                    {visitData.orders
                      ?.flatMap((o: any) => o.items)
                      .filter((i: any) => i.status !== "CANCELLED")
                      .map((item: any) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between py-1 border-b border-stone-100"
                        >
                          <span className="text-stone-800">
                            {item.quantity}x {item.itemNameSnapshot} (@ ₹{item.unitPriceSnapshot.toFixed(0)})
                          </span>
                          <span className="font-mono font-bold text-stone-900">
                            ₹{item.subtotalSnapshot.toFixed(2)}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Bill Totals breakdown */}
              {visitData.bill && (
                <div className="space-y-2 pt-4 border-t border-stone-100 text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>Items Subtotal:</span>
                    <span className="font-mono text-stone-900">₹{visitData.bill.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>GST ({visitData.bill.taxRatePercent}%):</span>
                    <span className="font-mono text-stone-900">₹{visitData.bill.taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Service Charge ({visitData.bill.serviceChargePercent}%):</span>
                    <span className="font-mono text-stone-900">₹{visitData.bill.serviceCharge.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-amber-800 pt-2 border-t border-stone-200">
                    <span>Total Amount:</span>
                    <span className="font-mono">₹{visitData.bill.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Payments breakdown */}
              {visitData.bill?.payments && visitData.bill.payments.length > 0 && (
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2 text-xs">
                  <div className="font-bold text-stone-800">Recorded External Payments:</div>
                  {visitData.bill.payments.map((p: any) => (
                    <div key={p.id} className="flex justify-between text-stone-600">
                      <span>
                        {p.paymentMethod} • {format(new Date(p.paidAt), "hh:mm a")}
                      </span>
                      <strong className="text-emerald-700 font-mono">+₹{p.amount.toFixed(2)}</strong>
                    </div>
                  ))}
                </div>
              )}

              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <CreditCard className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  Payments are recorded by café staff (UPI QR, Credit/Debit Card, or Cash). Request the final bill with your server when ready to settle.
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cart Review Drawer / Modal */}
      {showCartDrawer && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 sm:p-8 rounded-3xl max-w-lg w-full space-y-6 border border-stone-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div className="flex items-center gap-2 font-serif text-xl font-bold text-stone-900">
                <ShoppingBag className="w-5 h-5 text-amber-600" />
                Review Round Order
              </div>
              <button
                onClick={() => setShowCartDrawer(false)}
                className="p-2 rounded-xl hover:bg-stone-100 text-stone-500 hover:text-stone-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
              {cart.map((item) => (
                <div
                  key={item.menuItemId}
                  className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-stone-900 text-sm">{item.name}</strong>
                    <span className="font-mono font-bold text-amber-800">
                      ₹{(item.price * item.quantity).toFixed(0)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <input
                      type="text"
                      placeholder="Special instructions (e.g. less ice, extra hot)"
                      value={item.customInstructions || ""}
                      onChange={(e) => updateInstruction(item.menuItemId, e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-stone-200 text-stone-900 text-xs focus:outline-none focus:border-amber-500"
                    />

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => updateQuantity(item.menuItemId, -1)}
                        className="w-6 h-6 rounded bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 flex items-center justify-center"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-bold text-stone-900 px-1">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.menuItemId, 1)}
                        className="w-6 h-6 rounded bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 flex items-center justify-center"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-stone-700">Kitchen / Server Notes (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Please bring drinks first"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="border-t border-stone-100 pt-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-stone-500">Round Subtotal</span>
                <div className="font-serif text-xl font-bold text-amber-800">
                  ₹{cartTotal.toFixed(0)}
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={placingOrder || cart.length === 0}
                className="px-6 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs shadow-xl shadow-amber-600/20 flex items-center gap-2"
              >
                {placingOrder ? "Placing Order..." : "Send Order to Kitchen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
