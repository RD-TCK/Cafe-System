"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  UtensilsCrossed,
  Search,
  Filter,
  Clock,
  Sparkles,
  Leaf,
  Flame,
  Wheat,
  CalendarDays,
  QrCode,
  Check,
} from "lucide-react";

interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  isSpicy: boolean;
  isAvailable: boolean;
  prepTimeMinutes: number;
  photoUrl?: string | null;
}

interface Category {
  id: string;
  name: string;
  sortOrder: number;
  icon?: string;
  items: MenuItem[];
}

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [dietaryFilter, setDietaryFilter] = useState<"ALL" | "VEG" | "VEGAN" | "GF" | "SPICY">("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/menu")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCategories(data.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const allItems = categories.flatMap((cat) =>
    cat.items.map((it) => ({ ...it, categoryName: cat.name }))
  );

  const filteredItems = allItems.filter((item) => {
    // Category match
    if (selectedCategory !== "ALL" && item.categoryId !== selectedCategory) {
      return false;
    }

    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      if (!matchName && !matchDesc) return false;
    }

    // Dietary filter
    if (dietaryFilter === "VEG" && !item.isVegetarian) return false;
    if (dietaryFilter === "VEGAN" && !item.isVegan) return false;
    if (dietaryFilter === "GF" && !item.isGlutenFree) return false;
    if (dietaryFilter === "SPICY" && !item.isSpicy) return false;

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider">
          <UtensilsCrossed className="w-4 h-4" /> Handcrafted Culinary Selection
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl font-extrabold text-stone-100">
          Our Artisanal Menu & Live Pricing
        </h1>
        <p className="text-stone-400 text-sm sm:text-base leading-relaxed">
          Carefully sourced organic ingredients, fresh micro-roasted beans, and European-fusion delicacies prepared fresh on order.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 sm:p-6 rounded-3xl space-y-4 border border-stone-800">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search coffee, brunch, desserts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-stone-900/90 border border-stone-800 focus:border-amber-500 focus:outline-none text-stone-100 placeholder-stone-500 text-sm"
            />
          </div>

          {/* Dietary Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setDietaryFilter("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                dietaryFilter === "ALL"
                  ? "bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20"
                  : "bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800"
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setDietaryFilter("VEG")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
                dietaryFilter === "VEG"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "bg-stone-900 text-emerald-400 hover:bg-stone-800 border border-stone-800"
              }`}
            >
              <Leaf className="w-3.5 h-3.5" /> Veg
            </button>
            <button
              onClick={() => setDietaryFilter("VEGAN")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
                dietaryFilter === "VEGAN"
                  ? "bg-emerald-700 text-white"
                  : "bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800"
              }`}
            >
              Vegan
            </button>
            <button
              onClick={() => setDietaryFilter("GF")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
                dietaryFilter === "GF"
                  ? "bg-amber-600 text-white"
                  : "bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800"
              }`}
            >
              Gluten-Free
            </button>
            <button
              onClick={() => setDietaryFilter("SPICY")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
                dietaryFilter === "SPICY"
                  ? "bg-red-600 text-white"
                  : "bg-stone-900 text-red-400 hover:bg-stone-800 border border-stone-800"
              }`}
            >
              <Flame className="w-3.5 h-3.5" /> Spicy
            </button>
          </div>
        </div>

        {/* Categories Tab Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-t border-stone-800/80 pt-4">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === "ALL"
                ? "bg-stone-800 text-amber-400 border border-amber-500/40"
                : "text-stone-400 hover:text-stone-200 hover:bg-stone-900"
            }`}
          >
            All Categories ({allItems.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? "bg-stone-800 text-amber-400 border border-amber-500/40"
                  : "text-stone-400 hover:text-stone-200 hover:bg-stone-900"
              }`}
            >
              {cat.name} ({cat.items.length})
            </button>
          ))}
        </div>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="text-center py-20 space-y-3">
          <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-stone-400 text-sm">Loading artisanal menu...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="glass-panel text-center py-16 rounded-3xl space-y-3">
          <UtensilsCrossed className="w-12 h-12 text-stone-600 mx-auto" />
          <h3 className="font-semibold text-stone-200 text-lg">No menu items match your criteria</h3>
          <p className="text-stone-500 text-xs">Try searching for a different dish or clearing your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`group glass-panel rounded-3xl overflow-hidden border border-stone-800 hover:border-amber-500/30 transition-all flex flex-col justify-between ${
                !item.isAvailable ? "opacity-60" : ""
              }`}
            >
              <div>
                {/* Photo */}
                <div className="h-48 relative overflow-hidden bg-stone-900">
                  {item.photoUrl ? (
                    <img
                      src={item.photoUrl}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-700">
                      <UtensilsCrossed className="w-12 h-12" />
                    </div>
                  )}

                  {/* Availability badge */}
                  {!item.isAvailable && (
                    <div className="absolute inset-0 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center">
                      <span className="px-3 py-1 rounded-full bg-red-950 border border-red-500/50 text-red-200 text-xs font-bold uppercase tracking-wider">
                        Currently Sold Out
                      </span>
                    </div>
                  )}

                  {/* Top tags */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    {item.isVegetarian && (
                      <span className="w-6 h-6 rounded-md bg-emerald-950/90 border border-emerald-500/60 flex items-center justify-center text-emerald-400" title="Vegetarian">
                        <Leaf className="w-3.5 h-3.5" />
                      </span>
                    )}
                    {item.isVegan && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-950/90 border border-emerald-500/60 text-[10px] font-bold text-emerald-300">
                        VEGAN
                      </span>
                    )}
                    {item.isGlutenFree && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-950/90 border border-amber-500/60 text-[10px] font-bold text-amber-300">
                        GF
                      </span>
                    )}
                    {item.isSpicy && (
                      <span className="w-6 h-6 rounded-md bg-red-950/90 border border-red-500/60 flex items-center justify-center text-red-400" title="Spicy">
                        <Flame className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-stone-950/80 backdrop-blur-md border border-stone-800 text-[11px] text-stone-300 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-500" />
                    ~{item.prepTimeMinutes} mins
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-stone-100 text-base group-hover:text-amber-400 transition-colors">
                      {item.name}
                    </h3>
                    <span className="font-serif text-lg font-bold text-amber-400 shrink-0">
                      ₹{item.price.toFixed(0)}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Action footer */}
              <div className="p-5 pt-0">
                <div className="pt-3 border-t border-stone-800/80 flex items-center justify-between text-xs">
                  <span className="text-stone-500 text-[11px]">
                    Price snapshot preserved at ordering
                  </span>
                  <Link
                    href="/reserve"
                    className="text-amber-400 hover:text-amber-300 font-semibold"
                  >
                    Reserve Table &rarr;
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dine In QR banner */}
      <div className="glass-panel-glow p-8 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <QrCode className="w-4 h-4" /> Already Seated in Café?
          </div>
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-100">
            Order Directly from Your Table
          </h3>
          <p className="text-stone-400 text-xs sm:text-sm max-w-xl">
            Scan your table QR code or launch the digital table order portal using your checked-in Visit Code.
          </p>
        </div>
        <Link
          href="/table/demo"
          className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 whitespace-nowrap flex items-center gap-2"
        >
          <QrCode className="w-4 h-4" /> Launch In-Café Ordering
        </Link>
      </div>
    </div>
  );
}
