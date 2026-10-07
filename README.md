# The Roasted Bean Café & Roastery — Reservation & Ordering Web App

A responsive café reservation and live table ordering full-stack web application built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Prisma ORM** (relational SQLite/PostgreSQL).

---

## ☕ Key Features

### 🌟 Customer Portal
1. **Menu & Live Pricing Exploration**:
   - Categorized menu (Specialty Coffee, Artisanal Teas, All-Day Breakfast, Mains & Sandwiches, Pastries & Desserts).
   - Dietary tags (Vegetarian, Vegan, Gluten-Free, Spicy), prep times, descriptions, and live in-stock / sold-out status.
2. **Table Reservation Flow**:
   - Pick date, guest count, duration (60/90/120/150 mins), and specific table preference (or "Any suitable table").
   - Real-time 30-min slot checker with setup/cleanup buffer indicators.
   - Initial status marked as **Requested** until owner explicitly confirms.
   - Optional occasion selector and special seating/dietary requests.
   - Secure Booking Reference (e.g. `RES-8319-K9A1`) and secret **Security Token** for lookup and modification.
3. **Booking Management & Rescheduling**:
   - Real-time lookup by Reference + Token or phone number.
   - Safe atomic rescheduling: if the new slot conflicts or capacity fails, the previous reservation slot is preserved without corruption.
   - Hassle-free self-cancellation.
4. **In-Café QR Dine-In Ordering & Live Bill Hub**:
   - Guests arrive and check in with staff to receive their 4-digit **Visit Code** (e.g. `7492`).
   - Scan table QR code to enter the ordering portal.
   - Multi-round ordering (Round 1 drinks/starters, Round 2 mains, Round 3 desserts) with custom cooking instructions.
   - Price snapshotting: item unit prices and names are snapshotted at time of order placement.
   - Live order stream: `Pending` &rarr; `Accepted` &rarr; `Preparing` &rarr; `Served`.
   - Running live bill with subtotal, 5% GST, 5% Service charge, total amount, and recorded external payments.

---

### 🛡️ Owner & Staff Portal
1. **Secure Access**:
   - PIN login (Default PIN: `8899`) or Password (`admin_cafe_2026`).
2. **Dashboard & Analytics**:
   - Business day sales collected and active unpaid floor balance.
   - Documented business day rule (Asia/Kolkata timezone with customizable cutover e.g. 04:00 AM).
   - Real-time operational alerts: late guests past 15m grace period, pending special requests requiring review.
3. **Live Kitchen Display System (KDS)**:
   - Live stream with round numbers, items, quantities, custom instructions, and elapsed timers.
   - One-click state transitions (`Accept` &rarr; `Start Cooking` &rarr; `Mark Served`) and cancellation with bill recalculation.
4. **Floor & Table Operations**:
   - Live table occupancy grid with active guest names, visit codes, and bill balances.
   - Instant Walk-in guest check-in (creates active Visit with 4-digit code).
   - Multi-table combining/merging for large parties.
   - View, download, and print table QR code tent cards.
   - Table checkout / Visit closure: verifies settled bill, closes visit, and frees table.
5. **Reservation Queue Management**:
   - Filter by status (`Requested`, `Confirmed`, `Checked-In`, `Completed`, `Cancelled`, `No-Show`).
   - Accept with table assignment and special request approval.
   - Reject with custom note.
   - Direct check-in to seat guests.
6. **Billing & External Payments**:
   - Consolidated billing per table visit.
   - Record external payments in **Cash**, **UPI / QR**, **Credit Card**, **Debit Card**, or **Other**.
   - Automatic bill status progression: `UNPAID` &rarr; `PARTIALLY_PAID` &rarr; `PAID`.
7. **Menu & Cafe Settings**:
   - Add/edit items, prices, descriptions, and dietary tags.
   - 1-click In-Stock / Sold-Out toggle.
   - Opening/closing hours, buffer periods (15m before/after), grace period (15m), GST rate (5%), service charge (5%).
   - Closures and holiday calendar blocking.

---

## ⚙️ Setup & Running

### 1. Prerequisites
- Node.js (v18+ recommended, v24 supported)
- npm (v9+)

### 2. Installation
```bash
# Clone or navigate to project directory
cd "d:\Cafe System"

# Install dependencies
npm install --legacy-peer-deps
```

### 3. Environment Variables
Copy `.env.example` to `.env`:
```bash
# SQLite (Local file out of the box)
DATABASE_URL="file:./dev.db"

# PostgreSQL (Production)
# DATABASE_URL="postgresql://user:password@localhost:5432/cafedb?schema=public"

OWNER_SECRET_PIN="8899"
OWNER_PASSWORD="admin_cafe_2026"
NEXT_PUBLIC_APP_TIMEZONE="Asia/Kolkata"
NEXT_PUBLIC_CAFE_NAME="The Roasted Bean Café"
```

### 4. Database Sync & Seeding
```bash
# Sync schema
npx prisma db push

# Seed sample Bengaluru café data (8 tables, 14 menu items, sample active visit)
npx tsx prisma/seed.ts
```

### 5. Running the Application
```bash
# Start Next.js development server
npm run dev

# Or build and start production server
npm run build
npm start
```
Visit `http://localhost:3000` in your browser.

---

## 🧪 Automated Test Suite

Run the full end-to-end test suite:
```bash
npx tsx tests/run-tests.ts
```

### Verified Test Cases:
1. **Asia/Kolkata Timezone & Business Day Cutoff**: Validates shift date resolution across midnight up to 04:00 AM.
2. **Booking Engine & Overlap Conflict Prevention**: Verifies atomic blocking of reservations overlapping table duration and 15m before/after buffers.
3. **Out-of-Hours Rejection**: Rejects bookings requested outside 08:00 AM – 11:00 PM.
4. **Reschedule Slot Preservation**: Proves that failed rescheduling leaves the original valid slot intact without corruption.
5. **Visit Access & QR Security**: Ensures only checked-in active visits can order; expired visits are immediately blocked.
6. **Price Snapshotting & Bill Totals**: Confirms unit prices and item names are permanently snapshotted at ordering time; verifies GST and Service Charge calculations.
7. **Payment Recording & Visit Closure**: Tests partial payments, overpayment rejection, full balance settlement, and visit closure table release.

---

## 🔑 Demo Credentials

- **Owner PIN**: `8899`
- **Owner Password**: `admin_cafe_2026`
- **Sample Active Demo Visit**: Table `T-01` with Visit Code `7492` (Accessible at `/table/demo` or `/table/[tableId]?visit=7492`)
- **Sample Booking References**: `RES-8319-K9A1` (Token: `demo_token_priya_123`), `RES-4920-W3B8` (Token: `demo_token_rohan_456`)

---

## 📌 Remaining Scope / v1 Boundary
As specified in requirements, v1 excludes online payment gateway processing (external payment records are maintained), preordering before arrival, inventory deduction tracking, event packages, and customer loyalty rewards.
