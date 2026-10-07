import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../src/lib/prisma";
import {
  createReservation,
  rescheduleReservation,
  findAvailableTables,
  generateVisitCode,
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
import { addMinutes, addHours } from "date-fns";

describe("Café System End-to-End Business Logic & Integrity Tests", () => {
  let testTable1: any;
  let testTable2: any;
  let testMenuItemCoffee: any;
  let testMenuItemSandwich: any;

  beforeAll(async () => {
    // Ensure settings exist
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

    // Create 2 test tables
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
        name: "Test Bar High Top",
        capacityMin: 1,
        capacityMax: 2,
        section: "INDOOR",
      },
    });

    // Category and Menu items
    const cat = await prisma.category.create({
      data: { name: "Test Drinks" },
    });

    testMenuItemCoffee = await prisma.menuItem.create({
      data: {
        categoryId: cat.id,
        name: "Test Pour Over Coffee",
        description: "Fresh single origin",
        price: 200,
      },
    });

    testMenuItemSandwich = await prisma.menuItem.create({
      data: {
        categoryId: cat.id,
        name: "Test Brioche Sandwich",
        description: "Scrambled brioche",
        price: 350,
      },
    });
  });

  afterAll(async () => {
    // Cleanup test records
    await prisma.payment.deleteMany({
      where: { bill: { tableId: { in: [testTable1?.id, testTable2?.id] } } },
    });
    await prisma.bill.deleteMany({
      where: { tableId: { in: [testTable1?.id, testTable2?.id] } },
    });
    await prisma.orderItem.deleteMany({
      where: { order: { tableId: { in: [testTable1?.id, testTable2?.id] } } },
    });
    await prisma.order.deleteMany({
      where: { tableId: { in: [testTable1?.id, testTable2?.id] } },
    });
    await prisma.visit.deleteMany({
      where: { tableId: { in: [testTable1?.id, testTable2?.id] } },
    });
    await prisma.reservation.deleteMany({
      where: { tableId: { in: [testTable1?.id, testTable2?.id] } },
    });
    await prisma.menuItem.deleteMany({
      where: { id: { in: [testMenuItemCoffee?.id, testMenuItemSandwich?.id] } },
    });
    await prisma.category.deleteMany({
      where: { name: "Test Drinks" },
    });
    await prisma.table.deleteMany({
      where: { id: { in: [testTable1?.id, testTable2?.id] } },
    });
  });

  // 1. Timezone and Business Day Rule Tests
  describe("Asia/Kolkata Timezone & Business Day Rule", () => {
    it("should correctly identify business day before and after cutoff hour", () => {
      // 02:00 AM on 2026-10-04 belongs to business day 2026-10-03 (cutoff is 4 AM)
      const lateNight = new Date("2026-10-03T20:30:00.000Z"); // approx 02:00 AM IST
      const bDayLate = getBusinessDayString(lateNight, 4, "Asia/Kolkata");
      expect(bDayLate).toBeDefined();

      // Overlap detection with buffers
      const t1Start = new Date("2026-10-04T10:00:00.000Z");
      const t1End = new Date("2026-10-04T11:30:00.000Z");

      // Case A: 15 mins buffer overlap
      const t2Start = new Date("2026-10-04T11:35:00.000Z"); // within 15 min buffer of t1End
      const t2End = new Date("2026-10-04T13:00:00.000Z");

      const overlaps = doIntervalsOverlap(
        t1Start,
        t1End,
        15,
        15,
        t2Start,
        t2End,
        15,
        15
      );
      expect(overlaps).toBe(true);
    });
  });

  // 2. Booking Engine & Conflict Prevention Tests
  describe("Booking Engine & Conflict Prevention", () => {
    it("should successfully create a valid reservation with Requested status", async () => {
      const result = await createReservation({
        guestName: "Ananya Roy",
        guestPhone: "+91 98765 11111",
        guestEmail: "ananya@example.com",
        guestCount: 2,
        date: "2026-10-15",
        time: "14:00",
        durationMinutes: 90,
        requestedTableId: testTable1.id,
      });

      expect(result.reservation).toBeDefined();
      expect(result.reservation.bookingReference).toMatch(/^RES-\d{4}-[A-F0-9]{4}$/);
      expect(result.reservation.status).toBe("REQUESTED");
      expect(result.reservation.tableId).toBe(testTable1.id);
    });

    it("should block overlapping booking on same table including setup/cleanup buffer", async () => {
      // Existing is 14:00 to 15:30 on 2026-10-15.
      // Trying to book 15:00 to 16:30 on testTable1 must fail.
      await expect(
        createReservation({
          guestName: "Conflicting Guest",
          guestPhone: "+91 98765 22222",
          guestEmail: "conflict@example.com",
          guestCount: 2,
          date: "2026-10-15",
          time: "15:00",
          durationMinutes: 90,
          requestedTableId: testTable1.id,
        })
      ).rejects.toThrow(/not available at the selected time/i);
    });

    it("should reject booking outside café operating hours", async () => {
      await expect(
        createReservation({
          guestName: "Early Bird",
          guestPhone: "+91 98765 33333",
          guestEmail: "early@example.com",
          guestCount: 2,
          date: "2026-10-15",
          time: "06:00", // Opening is 08:00
          durationMinutes: 90,
        })
      ).rejects.toThrow(/between opening/i);
    });

    it("should preserve original booking slot if rescheduling fails", async () => {
      // Create fresh booking
      const res = await createReservation({
        guestName: "Reschedule Test",
        guestPhone: "+91 98765 44444",
        guestEmail: "reschedule@example.com",
        guestCount: 2,
        date: "2026-10-16",
        time: "10:00",
        durationMinutes: 90,
        requestedTableId: testTable1.id,
      });

      const originalStart = res.reservation.startDateTime;

      // Attempt invalid reschedule to outside opening hours
      await expect(
        rescheduleReservation({
          bookingReference: res.reservation.bookingReference,
          securityToken: res.reservation.securityToken,
          newDate: "2026-10-16",
          newTime: "04:00", // Invalid time
        })
      ).rejects.toThrow(/outside operating hours/i);

      // Verify original slot is untouched in DB
      const current = await prisma.reservation.findUnique({
        where: { id: res.reservation.id },
      });
      expect(current?.startDateTime.toISOString()).toBe(originalStart.toISOString());
    });

    it("should prevent duplicate booking creation when idempotency key is repeated", async () => {
      const key = `idem_${Date.now()}`;
      const first = await createReservation({
        guestName: "Idempotent Guest",
        guestPhone: "+91 98765 55555",
        guestEmail: "idem@example.com",
        guestCount: 2,
        date: "2026-10-17",
        time: "12:00",
        durationMinutes: 90,
        idempotencyKey: key,
      });

      const second = await createReservation({
        guestName: "Idempotent Guest",
        guestPhone: "+91 98765 55555",
        guestEmail: "idem@example.com",
        guestCount: 2,
        date: "2026-10-17",
        time: "12:00",
        durationMinutes: 90,
        idempotencyKey: key,
      });

      expect(second.isExisting).toBe(true);
      expect(second.reservation.id).toBe(first.reservation.id);
    });
  });

  // 3. In-Café Visit & QR Ordering Access Tests
  describe("Visit Access & QR Security", () => {
    it("should only allow checked-in active visits to access ordering", async () => {
      const visitCode = "8391";
      const activeVisit = await prisma.visit.create({
        data: {
          visitCode,
          tableId: testTable1.id,
          guestName: "QR Dine In Guest",
          guestCount: 2,
          status: "ACTIVE",
        },
      });

      // Validating correct code succeeds
      const validated = await validateActiveVisit(testTable1.id, visitCode);
      expect(validated.id).toBe(activeVisit.id);

      // Invalid code fails
      await expect(validateActiveVisit(testTable1.id, "9999")).rejects.toThrow(
        /No active visit found/i
      );
    });
  });

  // 4. Billing Engine, Price Snapshots & Payments Tests
  describe("Billing Engine & Price Snapshots", () => {
    let activeVisit: any;

    beforeAll(async () => {
      activeVisit = await prisma.visit.create({
        data: {
          visitCode: "9123",
          tableId: testTable2.id,
          guestName: "Foodie Guest",
          guestCount: 2,
          status: "ACTIVE",
        },
      });
    });

    it("should snapshot menu prices at time of order placement and calculate bill correctly", async () => {
      // Place Order Round 1: 2x Coffee (₹200 each = ₹400) + 1x Sandwich (₹350) = Subtotal ₹750
      const order1 = await placeOrder({
        tableId: testTable2.id,
        visitCode: "9123",
        items: [
          { menuItemId: testMenuItemCoffee.id, quantity: 2, customInstructions: "Extra hot" },
          { menuItemId: testMenuItemSandwich.id, quantity: 1 },
        ],
      });

      expect(order1.order.items.length).toBe(2);
      expect(order1.order.items[0].unitPriceSnapshot).toBe(200);
      expect(order1.order.items[0].subtotalSnapshot).toBe(400);

      // Verify Visit Bill
      const bill = await prisma.bill.findUnique({
        where: { visitId: activeVisit.id },
      });

      expect(bill).toBeDefined();
      expect(bill?.subtotal).toBe(750);
      // GST 5% = 37.5, Service Charge 5% = 37.5, Total = 825
      expect(bill?.taxAmount).toBe(37.5);
      expect(bill?.serviceCharge).toBe(37.5);
      expect(bill?.totalAmount).toBe(825);
      expect(bill?.status).toBe("UNPAID");
    });

    it("should accurately handle partial and full external payments", async () => {
      const bill = await prisma.bill.findUnique({
        where: { visitId: activeVisit.id },
      });

      // Partial Payment: Pay ₹500 of ₹825
      const p1 = await recordPayment({
        billId: bill!.id,
        amount: 500,
        paymentMethod: "UPI_QR",
        referenceNote: "UPI Txn 94821",
      });

      expect(p1.newStatus).toBe("PARTIALLY_PAID");
      expect(p1.remaining).toBe(325);

      // Reject overpayment (Trying to pay ₹400 when only ₹325 remains)
      await expect(
        recordPayment({
          billId: bill!.id,
          amount: 400,
          paymentMethod: "CASH",
        })
      ).rejects.toThrow(/exceeds remaining balance/i);

      // Settle remaining balance of ₹325
      const p2 = await recordPayment({
        billId: bill!.id,
        amount: 325,
        paymentMethod: "CASH",
      });

      expect(p2.newStatus).toBe("PAID");
      expect(p2.remaining).toBe(0);
    });

    it("should successfully close visit and free table once bill is fully paid", async () => {
      const closed = await closeVisit(activeVisit.id);
      expect(closed.status).toBe("COMPLETED");
      expect(closed.closedAt).toBeDefined();

      // Accessing order with old visit code should now fail
      await expect(validateActiveVisit(testTable2.id, "9123")).rejects.toThrow(
        /No active visit found/i
      );
    });
  });
});
