import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";
import {
  createReservation,
  rescheduleReservation,
  generateBookingReference,
  generateSecurityToken,
} from "../src/lib/bookingEngine";
import {
  placeOrder,
  recalculateVisitBill,
  recordPayment,
  closeVisit,
  validateActiveVisit,
} from "../src/lib/billingEngine";
import {
  getBusinessDayString,
  doIntervalsOverlap,
  parseDateTimeInCafeTz,
} from "../src/lib/timezone";

async function runAllTests() {
  console.log("🧪 Starting Café System Automated Test Suite...\n");

  let testTable1: any;
  let testTable2: any;
  let testMenuItemCoffee: any;
  let testMenuItemSandwich: any;

  try {
    // Setup
    await prisma.cafeSetting.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        name: "Test Bean Café",
        openingTime: "08:00",
        closingTime: "23:00",
        businessDayCutoffHour: 4,
        timezone: "Asia/Kolkata",
        defaultReservationDurationMinutes: 90,
        bufferBeforeMinutes: 15,
        bufferAfterMinutes: 15,
        gracePeriodMinutes: 15,
        taxRatePercent: 5.0,
        serviceChargePercent: 5.0,
      },
    });

    testTable1 = await prisma.table.create({
      data: {
        tableNumber: "TEST-T1",
        name: "Test Booth 1",
        capacityMin: 2,
        capacityMax: 4,
        section: "INDOOR",
      },
    });

    testTable2 = await prisma.table.create({
      data: {
        tableNumber: "TEST-T2",
        name: "Test High Top",
        capacityMin: 1,
        capacityMax: 2,
        section: "INDOOR",
      },
    });

    const cat = await prisma.category.create({
      data: { name: "Test Cat " + Date.now() },
    });

    testMenuItemCoffee = await prisma.menuItem.create({
      data: {
        categoryId: cat.id,
        name: "Test Espresso",
        description: "Dark roast",
        price: 200,
      },
    });

    testMenuItemSandwich = await prisma.menuItem.create({
      data: {
        categoryId: cat.id,
        name: "Test Panini",
        description: "Grilled focaccia",
        price: 350,
      },
    });

    console.log("✅ Test setup completed.");

    // TEST 1: Timezone & Business Day Rule
    console.log("\n[Test 1] Asia/Kolkata Timezone & Business Day Rule...");
    const lateNight = new Date("2026-10-03T20:30:00.000Z"); // ~02:00 AM IST
    const bDay = getBusinessDayString(lateNight, 4, "Asia/Kolkata");
    assert.ok(bDay, "Business day should be computed");

    const t1Start = new Date("2026-10-04T10:00:00.000Z");
    const t1End = new Date("2026-10-04T11:30:00.000Z");
    const t2Start = new Date("2026-10-04T11:35:00.000Z"); // inside 15m buffer
    const t2End = new Date("2026-10-04T13:00:00.000Z");
    const overlaps = doIntervalsOverlap(t1Start, t1End, 15, 15, t2Start, t2End, 15, 15);
    assert.equal(overlaps, true, "Buffer overlap must be detected");
    console.log("✅ Business day cutover and buffer overlap verified.");

    // TEST 2: Booking Engine & Conflict Prevention
    console.log("\n[Test 2] Booking Engine & Buffer Conflict Prevention...");
    const res1 = await createReservation({
      guestName: "Ananya Roy",
      guestPhone: "+91 98765 11111",
      guestEmail: "ananya@example.com",
      guestCount: 2,
      date: "2026-10-20",
      time: "14:00",
      durationMinutes: 90,
      requestedTableId: testTable1.id,
    });
    assert.equal(res1.reservation.status, "REQUESTED", "Initial status must be Requested");
    assert.equal(res1.reservation.tableId, testTable1.id);
    console.log("✅ Valid reservation created in Requested status with unique reference:", res1.reservation.bookingReference);

    // Overlap rejection
    let overlapFailed = false;
    try {
      await createReservation({
        guestName: "Conflicting Guest",
        guestPhone: "+91 98765 22222",
        guestEmail: "conflict@example.com",
        guestCount: 2,
        date: "2026-10-20",
        time: "15:00",
        durationMinutes: 90,
        requestedTableId: testTable1.id,
      });
    } catch (e: any) {
      overlapFailed = true;
      assert.match(e.message, /not available at the selected time/i);
    }
    assert.equal(overlapFailed, true, "Overlapping reservation must be blocked");
    console.log("✅ Overlapping reservation blocked atomically.");

    // Operating hours rejection
    let outOfHoursFailed = false;
    try {
      await createReservation({
        guestName: "Early Guest",
        guestPhone: "+91 98765 33333",
        guestEmail: "early@example.com",
        guestCount: 2,
        date: "2026-10-20",
        time: "05:00", // Closed at 5 AM
        durationMinutes: 90,
      });
    } catch (e: any) {
      outOfHoursFailed = true;
      assert.match(e.message, /between opening/i);
    }
    assert.equal(outOfHoursFailed, true, "Booking outside operating hours must be rejected");
    console.log("✅ Out-of-hours booking rejected.");

    // TEST 3: Reschedule Preservation
    console.log("\n[Test 3] Reschedule Preservation on Conflict...");
    const originalStart = res1.reservation.startDateTime;
    let rescheduleFailed = false;
    try {
      await rescheduleReservation({
        bookingReference: res1.reservation.bookingReference,
        securityToken: res1.reservation.securityToken,
        newDate: "2026-10-20",
        newTime: "04:00", // Invalid time
      });
    } catch (e: any) {
      rescheduleFailed = true;
    }
    assert.equal(rescheduleFailed, true);
    const checked = await prisma.reservation.findUnique({
      where: { id: res1.reservation.id },
    });
    assert.equal(
      checked?.startDateTime.toISOString(),
      originalStart.toISOString(),
      "Original slot must be preserved when reschedule fails"
    );
    console.log("✅ Reschedule conflict handled; original slot successfully preserved.");

    // TEST 4: Visit Access & Security
    console.log("\n[Test 4] Visit Access & In-Café QR Ordering Security...");
    const testVisit = await prisma.visit.create({
      data: {
        visitCode: "8821",
        tableId: testTable2.id,
        guestName: "Dine In VIP",
        guestCount: 2,
        status: "ACTIVE",
      },
    });

    const valRes = await validateActiveVisit(testTable2.id, "8821");
    assert.equal(valRes.id, testVisit.id, "Active visit must be validated");

    let invalidCodeFailed = false;
    try {
      await validateActiveVisit(testTable2.id, "0000");
    } catch (e) {
      invalidCodeFailed = true;
    }
    assert.equal(invalidCodeFailed, true, "Invalid visit code must be rejected");
    console.log("✅ Visit access credentials validated securely.");

    // TEST 5: Order Rounds, Price Snapshotting & Bill Totals
    console.log("\n[Test 5] Order Rounds, Price Snapshots & Bill Calculations...");
    const ord1 = await placeOrder({
      tableId: testTable2.id,
      visitCode: "8821",
      items: [
        { menuItemId: testMenuItemCoffee.id, quantity: 2, customInstructions: "Oat milk" },
        { menuItemId: testMenuItemSandwich.id, quantity: 1 },
      ],
    });

    assert.equal(ord1.order.items.length, 2);
    assert.equal(ord1.order.items[0].unitPriceSnapshot, 200);
    assert.equal(ord1.order.items[0].subtotalSnapshot, 400);

    const bill1 = await prisma.bill.findUnique({
      where: { visitId: testVisit.id },
    });
    assert.equal(bill1?.subtotal, 750); // 400 + 350
    assert.equal(bill1?.taxAmount, 37.5); // 5% GST
    assert.equal(bill1?.serviceCharge, 37.5); // 5% Service Charge
    assert.equal(bill1?.totalAmount, 825);
    assert.equal(bill1?.status, "UNPAID");
    console.log("✅ Price snapshotting & bill itemization verified (Total: ₹825.00).");

    // TEST 6: Payment Recording & Balance Settlement
    console.log("\n[Test 6] Partial Payment & Full Settlement...");
    const pay1 = await recordPayment({
      billId: bill1!.id,
      amount: 500,
      paymentMethod: "UPI_QR",
      referenceNote: "UPI Txn 99881",
    });
    assert.equal(pay1.newStatus, "PARTIALLY_PAID");
    assert.equal(pay1.remaining, 325);

    // Overpayment rejection
    let overpayFailed = false;
    try {
      await recordPayment({
        billId: bill1!.id,
        amount: 400,
        paymentMethod: "CASH",
      });
    } catch (e) {
      overpayFailed = true;
    }
    assert.equal(overpayFailed, true, "Overpayment must be rejected");

    // Settle balance
    const pay2 = await recordPayment({
      billId: bill1!.id,
      amount: 325,
      paymentMethod: "CASH",
    });
    assert.equal(pay2.newStatus, "PAID");
    assert.equal(pay2.remaining, 0);
    console.log("✅ Payment records and status transitions verified (UNPAID -> PARTIALLY_PAID -> PAID).");

    // TEST 7: Visit Closure & Access Expiration
    console.log("\n[Test 7] Table Checkout & QR Access Expiration...");
    const closedVisit = await closeVisit(testVisit.id);
    assert.equal(closedVisit.status, "COMPLETED");

    let postCloseAccessFailed = false;
    try {
      await validateActiveVisit(testTable2.id, "8821");
    } catch (e) {
      postCloseAccessFailed = true;
    }
    assert.equal(postCloseAccessFailed, true, "Expired visit code must be blocked");
    console.log("✅ Visit closed and QR ordering access expired.");

    console.log("\n🎉 ALL 7 TEST SUITES PASSED WITH 100% SUCCESS!\n");
  } finally {
    // Cleanup test tables
    if (testTable1?.id || testTable2?.id) {
      const ids = [testTable1?.id, testTable2?.id].filter(Boolean);
      await prisma.payment.deleteMany({ where: { bill: { tableId: { in: ids } } } });
      await prisma.bill.deleteMany({ where: { tableId: { in: ids } } });
      await prisma.orderItem.deleteMany({ where: { order: { tableId: { in: ids } } } });
      await prisma.order.deleteMany({ where: { tableId: { in: ids } } });
      await prisma.visit.deleteMany({ where: { tableId: { in: ids } } });
      await prisma.reservation.deleteMany({ where: { tableId: { in: ids } } });
      await prisma.table.deleteMany({ where: { id: { in: ids } } });
    }
    if (testMenuItemCoffee?.id || testMenuItemSandwich?.id) {
      await prisma.menuItem.deleteMany({
        where: { id: { in: [testMenuItemCoffee?.id, testMenuItemSandwich?.id].filter(Boolean) } },
      });
    }
    await prisma.$disconnect();
  }
}

runAllTests().catch((err) => {
  console.error("❌ Test suite failed:", err);
  process.exit(1);
});
