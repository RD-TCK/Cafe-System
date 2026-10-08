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
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-xs font-semibold uppercase tracking-wider shadow-sm">
          <UtensilsCrossed className="w-4 h-4 text-amber-700" />
          <span>Handcrafted Culinary Selection</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl font-extrabold text-stone-900">
          Our Artisanal Menu & Live Pricing
        </h1>
        <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
          Carefully sourced organic ingredients, fresh micro-roasted beans, and European-fusion delicacies prepared fresh on order.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl space-y-4 border border-stone-200/90 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search coffee, brunch, desserts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:border-amber-600 focus:bg-white focus:outline-none text-stone-900 placeholder-stone-400 text-sm transition-colors"
            />
          </div>

          {/* Dietary Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setDietaryFilter("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                dietaryFilter === "ALL"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200"
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setDietaryFilter("VEG")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
                dietaryFilter === "VEG"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
              }`}
            >
              <Leaf className="w-3.5 h-3.5" /> Veg
            </button>
            <button
              onClick={() => setDietaryFilter("VEGAN")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
                dietaryFilter === "VEGAN"
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200"
              }`}
            >
              Vegan
            </button>
            <button
              onClick={() => setDietaryFilter("GF")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
                dietaryFilter === "GF"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
              }`}
            >
              Gluten-Free
            </button>
            <button
              onClick={() => setDietaryFilter("SPICY")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
                dietaryFilter === "SPICY"
                  ? "bg-red-600 text-white shadow-sm"
                  : "bg-red-50 text-red-800 hover:bg-red-100 border border-red-200"
              }`}
            >
              <Flame className="w-3.5 h-3.5" /> Spicy
            </button>
          </div>
        </div>

        {/* Categories Tab Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-t border-stone-200/80 pt-4">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === "ALL"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-stone-700 hover:bg-stone-100 border border-stone-200 bg-stone-50"
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
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-stone-700 hover:bg-stone-100 border border-stone-200 bg-stone-50"
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
          <div className="w-10 h-10 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-stone-600 text-sm">Loading artisanal menu...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white text-center py-16 rounded-3xl space-y-3 border border-stone-200 shadow-sm">
          <UtensilsCrossed className="w-12 h-12 text-stone-400 mx-auto" />
          <h3 className="font-semibold text-stone-900 text-lg">No menu items match your criteria</h3>
          <p className="text-stone-500 text-xs">Try searching for a different dish or clearing your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`group bg-white rounded-3xl overflow-hidden border border-stone-200/90 shadow-sm hover:shadow-md hover:border-amber-400 transition-all flex flex-col justify-between ${
                !item.isAvailable ? "opacity-60" : ""
              }`}
            >
              <div>
                {/* Photo */}
                <div className="h-48 relative overflow-hidden bg-stone-100">
                  {item.photoUrl ? (
                    <img
                      src={item.photoUrl}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-400">
                      <UtensilsCrossed className="w-12 h-12" />
                    </div>
                  )}

                  {/* Availability badge */}
                  {!item.isAvailable && (
                    <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center">
                      <span className="px-3 py-1 rounded-full bg-red-100 border border-red-300 text-red-800 text-xs font-bold uppercase tracking-wider shadow-sm">
                        Currently Sold Out
                      </span>
                    </div>
                  )}

                  {/* Top tags */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    {item.isVegetarian && (
                      <span className="w-6 h-6 rounded-md bg-white/95 border border-emerald-300 flex items-center justify-center text-emerald-700 shadow-sm" title="Vegetarian">
                        <Leaf className="w-3.5 h-3.5" />
                      </span>
                    )}
                    {item.isVegan && (
                      <span className="px-2 py-0.5 rounded-md bg-white/95 border border-emerald-300 text-[10px] font-bold text-emerald-800 shadow-sm">
                        VEGAN
                      </span>
                    )}
                    {item.isGlutenFree && (
                      <span className="px-2 py-0.5 rounded-md bg-white/95 border border-amber-300 text-[10px] font-bold text-amber-800 shadow-sm">
                        GF
                      </span>
                    )}
                    {item.isSpicy && (
                      <span className="w-6 h-6 rounded-md bg-white/95 border border-red-300 flex items-center justify-center text-red-700 shadow-sm" title="Spicy">
                        <Flame className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-white/95 backdrop-blur-md border border-stone-200 text-[11px] text-stone-700 font-semibold shadow-sm flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-600" />
                    ~{item.prepTimeMinutes} mins
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-stone-900 text-base group-hover:text-amber-700 transition-colors">
                      {item.name}
                    </h3>
                    <span className="font-serif text-lg font-extrabold text-amber-800 shrink-0">
                      ₹{item.price.toFixed(0)}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Action footer */}
              <div className="p-5 pt-0">
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="text-stone-500 text-[11px]">
                    Price snapshot preserved at order
                  </span>
                  <Link
                    href="/reserve"
                    className="text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1"
                  >
                    <span>Reserve Table</span> &rarr;
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dine In QR banner */}
      <div className="bg-emerald-50 border border-emerald-200/80 p-8 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <QrCode className="w-4 h-4 text-emerald-700" />
            <span>Already Seated in Café?</span>
          </div>
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
            Order Directly from Your Table
          </h3>
          <p className="text-stone-600 text-xs sm:text-sm max-w-xl">
            Scan your table QR code or launch the digital table order portal using your checked-in Visit Code.
          </p>
        </div>
        <Link
          href="/table/demo"
          className="px-6 py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-sm shadow-md shadow-emerald-700/20 whitespace-nowrap flex items-center gap-2 transition-all"
        >
          <QrCode className="w-4 h-4" /> Launch In-Café Ordering
        </Link>
      </div>
    </div>
  );
}
