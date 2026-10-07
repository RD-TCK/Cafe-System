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
        <div className="max-w-4xl mx-auto px-4 py-20 text-center text-stone-400 text-sm">
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
          <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3 animate-pulse" /> Pending Kitchen Acceptance
          </span>
        );
      case "ACCEPTED":
        return (
          <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
            <Check className="w-3 h-3" /> Accepted by Chef
          </span>
        );
      case "PREPARING":
        return (
          <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
            <Flame className="w-3 h-3 animate-bounce" /> Preparing in Kitchen
          </span>
        );
      case "SERVED":
        return (
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Served at Table
          </span>
        );
      case "CANCELLED":
        return (
          <span className="px-2.5 py-1 rounded-full bg-red-950 text-red-400 border border-red-500/40 text-[11px] font-bold uppercase tracking-wider">
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
        <div className="glass-panel p-8 sm:p-12 rounded-3xl max-w-md mx-auto text-center space-y-6 border border-stone-800 shadow-2xl">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
            {validating ? (
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <QrCode className="w-8 h-8" />
            )}
          </div>

          <div className="space-y-2">
            <h2 className="font-serif text-2xl font-bold text-stone-100">
              {validating ? "Opening Table Menu..." : "Table Session Error"}
            </h2>
            <p className="text-xs text-stone-400 leading-relaxed">
              {validating
                ? "Connecting your phone to this table to unlock instant QR dining..."
                : valError || "Unable to find or connect to this table."}
            </p>
          </div>

          {!validating && (
            <div className="pt-2">
              <Link
                href="/table"
                className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs inline-flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
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
          <div className="glass-panel p-4 sm:p-6 rounded-3xl border border-stone-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold text-lg font-mono">
                {visitData.table?.tableNumber || "T"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-serif text-lg sm:text-xl font-bold text-stone-100">
                    {visitData.table?.name || "Café Table"}
                  </h2>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold uppercase">
                    Live Active Visit
                  </span>
                </div>
                <div className="text-xs text-stone-400 flex flex-wrap items-center gap-2 sm:gap-3 mt-0.5">
                  <span>Guest: <strong className="text-stone-200">{visitData.guestName || "Guest"}</strong></span>
                  <span>•</span>
                  <span>Visit Code: <strong className="text-amber-400 font-mono">{visitData.visitCode}</strong></span>
                  <span>•</span>
                  <Link
                    href="/table"
                    className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2 hover:opacity-90"
                    title="Choose a different table"
                  >
                    <Layers className="w-3 h-3" />
                    <span>Change Table</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* View Switching Tabs */}
            <div className="flex items-center gap-1 bg-stone-900/90 p-1.5 rounded-2xl border border-stone-800">
              <button
                onClick={() => setActiveTab("MENU")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === "MENU"
                    ? "bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20"
                    : "text-stone-400 hover:text-stone-200"
                }`}
              >
                <UtensilsCrossed className="w-3.5 h-3.5" /> Order Menu
              </button>
              <button
                onClick={() => setActiveTab("ORDERS")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === "ORDERS"
                    ? "bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20"
                    : "text-stone-400 hover:text-stone-200"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Live Status ({visitData.orders?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab("BILL")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === "BILL"
                    ? "bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20"
                    : "text-stone-400 hover:text-stone-200"
                }`}
              >
                <Receipt className="w-3.5 h-3.5" /> Running Bill
              </button>
            </div>
          </div>

          {orderSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{orderSuccess}</span>
              </div>
              <button onClick={() => setOrderSuccess("")} className="text-emerald-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {orderError && (
            <div className="p-4 rounded-2xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
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
                      ? "bg-amber-500 text-stone-950"
                      : "bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800"
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
                        ? "bg-amber-500 text-stone-950"
                        : "bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800"
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
                        className={`glass-panel p-4 rounded-2xl border border-stone-800 flex gap-4 justify-between items-center ${
                          !item.isAvailable ? "opacity-50" : ""
                        }`}
                      >
                        <div className="space-y-1 max-w-[65%]">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-stone-100 text-sm">
                              {item.name}
                            </span>
                            {item.isVegetarian && (
                              <Leaf className="w-3 h-3 text-emerald-400 shrink-0" />
                            )}
                            {item.isSpicy && (
                              <Flame className="w-3 h-3 text-red-400 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-stone-400 line-clamp-2">
                            {item.description}
                          </p>
                          <div className="font-serif text-sm font-bold text-amber-400 pt-1">
                            ₹{item.price.toFixed(0)}
                          </div>
                        </div>

                        {/* Add to Cart Actions */}
                        <div className="shrink-0">
                          {!item.isAvailable ? (
                            <span className="text-[10px] text-red-400 font-semibold uppercase">
                              Sold Out
                            </span>
                          ) : cartItem ? (
                            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/40 rounded-xl p-1">
                              <button
                                onClick={() => updateQuantity(item.id, -1)}
                                className="w-7 h-7 rounded-lg bg-stone-900 hover:bg-stone-800 text-amber-400 flex items-center justify-center text-xs font-bold"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-xs font-bold text-amber-300 px-1">
                                {cartItem.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, 1)}
                                className="w-7 h-7 rounded-lg bg-stone-900 hover:bg-stone-800 text-amber-400 flex items-center justify-center text-xs font-bold"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(item)}
                              className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500 border border-amber-500/40 text-amber-400 hover:text-stone-950 font-bold text-xs transition-all flex items-center gap-1"
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
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-md w-[92%] glass-panel-glow p-4 rounded-2xl border border-amber-500/50 flex items-center justify-between shadow-2xl">
                  <div className="space-y-0.5">
                    <span className="text-xs text-stone-400">
                      {cart.reduce((s, i) => s + i.quantity, 0)} Items Selected
                    </span>
                    <div className="font-serif text-lg font-bold text-amber-400">
                      ₹{cartTotal.toFixed(0)}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCartDrawer(true)}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-lg shadow-amber-500/25 flex items-center gap-2"
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
                <h3 className="font-serif text-lg font-bold text-stone-100 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                  Your Table Orders Stream
                </h3>
                <span className="text-xs text-stone-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live kitchen sync
                </span>
              </div>

              {(!visitData.orders || visitData.orders.length === 0) ? (
                <div className="glass-panel p-12 rounded-3xl text-center space-y-3 border border-stone-800">
                  <ShoppingBag className="w-10 h-10 text-stone-600 mx-auto" />
                  <h4 className="font-bold text-stone-200">No orders placed yet</h4>
                  <p className="text-xs text-stone-400">Switch to the menu tab to order food and drinks!</p>
                  <button
                    onClick={() => setActiveTab("MENU")}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs"
                  >
                    Browse Menu
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {visitData.orders.map((ord: any) => (
                    <div
                      key={ord.id}
                      className="glass-panel p-5 rounded-2xl border border-stone-800 space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800 pb-3">
                        <div>
                          <span className="text-xs font-bold text-amber-400 font-mono">
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
                              <strong className="text-stone-200">
                                {it.quantity}x {it.itemNameSnapshot}
                              </strong>
                              {it.customInstructions && (
                                <span className="text-[11px] text-amber-300 block italic">
                                  Note: {it.customInstructions}
                                </span>
                              )}
                            </div>
                            <span className="font-serif font-bold text-amber-400">
                              ₹{it.subtotalSnapshot.toFixed(0)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {ord.notes && (
                        <div className="pt-2 text-[11px] text-stone-400 italic bg-stone-900/60 p-2.5 rounded-xl border border-stone-800">
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
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-stone-800 space-y-6">
              <div className="flex items-center justify-between border-b border-stone-800 pb-4">
                <div className="space-y-0.5">
                  <div className="text-xs text-stone-400">Table Bill Receipt</div>
                  <h3 className="font-mono text-lg font-bold text-amber-400">
                    {visitData.bill?.billNumber || "BILL-IN-PROGRESS"}
                  </h3>
                </div>
                <div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      visitData.bill?.status === "PAID"
                        ? "bg-emerald-950 text-emerald-400 border border-emerald-500/50"
                        : visitData.bill?.status === "PARTIALLY_PAID"
                        ? "bg-amber-950 text-amber-400 border border-amber-500/50"
                        : "bg-stone-800 text-stone-300"
                    }`}
                  >
                    {visitData.bill?.status || "UNPAID"}
                  </span>
                </div>
              </div>

              {/* Itemized active items */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                  Consolidated Ordered Items (Snapshot Pricing)
                </h4>
                {visitData.orders?.flatMap((o: any) => o.items).filter((i: any) => i.status !== "CANCELLED").length === 0 ? (
                  <div className="text-xs text-stone-500 py-4 text-center">No active items on bill yet.</div>
                ) : (
                  <div className="space-y-2 text-xs">
                    {visitData.orders
                      ?.flatMap((o: any) => o.items)
                      .filter((i: any) => i.status !== "CANCELLED")
                      .map((item: any) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between py-1 border-b border-stone-900"
                        >
                          <span className="text-stone-300">
                            {item.quantity}x {item.itemNameSnapshot} (@ ₹{item.unitPriceSnapshot.toFixed(0)})
                          </span>
                          <span className="font-mono font-bold text-stone-100">
                            ₹{item.subtotalSnapshot.toFixed(2)}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Bill Totals breakdown */}
              {visitData.bill && (
                <div className="space-y-2 pt-4 border-t border-stone-800 text-xs">
                  <div className="flex justify-between text-stone-400">
                    <span>Items Subtotal:</span>
                    <span className="font-mono">₹{visitData.bill.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-stone-400">
                    <span>GST ({visitData.bill.taxRatePercent}%):</span>
                    <span className="font-mono">₹{visitData.bill.taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-stone-400">
                    <span>Service Charge ({visitData.bill.serviceChargePercent}%):</span>
                    <span className="font-mono">₹{visitData.bill.serviceCharge.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-amber-400 pt-2 border-t border-stone-800">
                    <span>Total Amount:</span>
                    <span className="font-mono">₹{visitData.bill.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Payments breakdown */}
              {visitData.bill?.payments && visitData.bill.payments.length > 0 && (
                <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-2 text-xs">
                  <div className="font-bold text-stone-300">Recorded External Payments:</div>
                  {visitData.bill.payments.map((p: any) => (
                    <div key={p.id} className="flex justify-between text-stone-400">
                      <span>
                        {p.paymentMethod} • {format(new Date(p.paidAt), "hh:mm a")}
                      </span>
                      <strong className="text-emerald-400 font-mono">+₹{p.amount.toFixed(2)}</strong>
                    </div>
                  ))}
                </div>
              )}

              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200/90 flex items-start gap-2">
                <CreditCard className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
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
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl max-w-lg w-full space-y-6 border border-amber-500/40 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-800 pb-4">
              <div className="flex items-center gap-2 font-serif text-xl font-bold text-stone-100">
                <ShoppingBag className="w-5 h-5 text-amber-500" />
                Review Round Order
              </div>
              <button
                onClick={() => setShowCartDrawer(false)}
                className="p-2 rounded-xl hover:bg-stone-800 text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
              {cart.map((item) => (
                <div
                  key={item.menuItemId}
                  className="p-3.5 rounded-2xl bg-stone-900 border border-stone-800 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-stone-100 text-sm">{item.name}</strong>
                    <span className="font-mono font-bold text-amber-400">
                      ₹{(item.price * item.quantity).toFixed(0)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <input
                      type="text"
                      placeholder="Special instructions (e.g. less ice, extra hot)"
                      value={item.customInstructions || ""}
                      onChange={(e) => updateInstruction(item.menuItemId, e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-stone-950 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-amber-500"
                    />

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => updateQuantity(item.menuItemId, -1)}
                        className="w-6 h-6 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 flex items-center justify-center"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-bold text-stone-200 px-1">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.menuItemId, 1)}
                        className="w-6 h-6 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 flex items-center justify-center"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-stone-300">Kitchen / Server Notes (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Please bring drinks first"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 text-xs"
              />
            </div>

            <div className="border-t border-stone-800 pt-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-stone-400">Round Subtotal</span>
                <div className="font-serif text-xl font-bold text-amber-400">
                  ₹{cartTotal.toFixed(0)}
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={placingOrder || cart.length === 0}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-stone-950 font-bold text-xs shadow-xl shadow-amber-500/20 flex items-center gap-2"
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
