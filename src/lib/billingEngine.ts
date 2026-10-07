import { prisma } from "./prisma";
import { PlaceOrderInput, RecordPaymentInput } from "./types";
import crypto from "crypto";

export function generateOrderNumber(): string {
  const num = Math.floor(100 + Math.random() * 900);
  return `ORD-${Date.now().toString().slice(-4)}-${num}`;
}

export function generateBillNumber(): string {
  const d = new Date();
  const year = d.getFullYear();
  const num = Math.floor(1000 + Math.random() * 9000);
  return `BILL-${year}-${num}`;
}

/**
 * Validate customer visit credentials for ordering
 */
export async function validateActiveVisit(tableId: string, visitCode: string) {
  const visit = await prisma.visit.findFirst({
    where: {
      visitCode: visitCode.trim(),
      status: "ACTIVE",
      OR: [
        { tableId: tableId },
        { combinedTableIds: { contains: tableId } },
      ],
    },
    include: {
      table: true,
      reservation: true,
      orders: {
        include: {
          items: true,
        },
        orderBy: { createdAt: "desc" },
      },
      bill: {
        include: {
          payments: true,
        },
      },
    },
  });

  if (!visit) {
    throw new Error(
      "No active visit found for this table with the provided visit code. Please check in with café staff or verify your visit code."
    );
  }

  return visit;
}

/**
 * Recalculate bill for a visit based on active orders and items
 */
export async function recalculateVisitBill(visitId: string, tx?: any) {
  const db = tx || prisma;

  const visit = await db.visit.findUnique({
    where: { id: visitId },
    include: {
      orders: {
        where: { status: { not: "CANCELLED" } },
        include: {
          items: {
            where: { status: { not: "CANCELLED" } },
          },
        },
      },
      bill: {
        include: { payments: true },
      },
    },
  });

  if (!visit) return null;

  const settings = await db.cafeSetting.findFirst();
  const taxRate = settings?.taxRatePercent ?? 5.0;
  const serviceChargeRate = settings?.serviceChargePercent ?? 0.0;

  // Sum all non-cancelled item subtotals
  let subtotal = 0;
  for (const order of visit.orders) {
    for (const item of order.items) {
      subtotal += item.subtotalSnapshot;
    }
  }

  const taxAmount = (subtotal * taxRate) / 100;
  const serviceCharge = (subtotal * serviceChargeRate) / 100;
  const totalAmount = Math.round((subtotal + taxAmount + serviceCharge) * 100) / 100;

  // Check existing payments
  let existingPaymentsTotal = 0;
  if (visit.bill && visit.bill.payments) {
    existingPaymentsTotal = visit.bill.payments.reduce(
      (sum: number, p: any) => sum + (p.status === "COMPLETED" ? p.amount : 0),
      0
    );
  }

  let billStatus: "UNPAID" | "PARTIALLY_PAID" | "PAID" = "UNPAID";
  if (existingPaymentsTotal >= totalAmount && totalAmount > 0) {
    billStatus = "PAID";
  } else if (existingPaymentsTotal > 0) {
    billStatus = "PARTIALLY_PAID";
  }

  if (visit.bill) {
    const updatedBill = await db.bill.update({
      where: { id: visit.bill.id },
      data: {
        subtotal,
        taxRatePercent: taxRate,
        taxAmount,
        serviceChargePercent: serviceChargeRate,
        serviceCharge,
        totalAmount,
        status: billStatus,
      },
      include: { payments: true },
    });
    return updatedBill;
  } else {
    const newBill = await db.bill.create({
      data: {
        billNumber: generateBillNumber(),
        visitId: visit.id,
        tableId: visit.tableId,
        subtotal,
        taxRatePercent: taxRate,
        taxAmount,
        serviceChargePercent: serviceChargeRate,
        serviceCharge,
        totalAmount,
        status: billStatus,
      },
      include: { payments: true },
    });
    return newBill;
  }
}

/**
 * Place order with price snapshots and atomic bill recalculation
 */
export async function placeOrder(input: PlaceOrderInput) {
  // Idempotency check
  if (input.idempotencyKey) {
    const existingOrder = await prisma.order.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      include: { items: true, table: true },
    });
    if (existingOrder) {
      return { order: existingOrder, isExisting: true };
    }
  }

  const visit = await validateActiveVisit(input.tableId, input.visitCode);

  if (!input.items || input.items.length === 0) {
    throw new Error("Order must contain at least one item");
  }

  // Fetch menu items to take current price snapshots
  const itemIds = input.items.map((i) => i.menuItemId);
  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: itemIds } },
  });

  const menuItemMap = new Map(menuItems.map((m) => [m.id, m]));

  for (const itemInput of input.items) {
    const found = menuItemMap.get(itemInput.menuItemId);
    if (!found) {
      throw new Error(`Menu item not found: ${itemInput.menuItemId}`);
    }
    if (!found.isAvailable) {
      throw new Error(`Item is currently out of stock: ${found.name}`);
    }
    if (itemInput.quantity <= 0) {
      throw new Error(`Invalid quantity for ${found.name}`);
    }
  }

  // Determine round number
  const roundCount = visit.orders.length + 1;
  const orderNumber = generateOrderNumber();

  return await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        orderNumber,
        visitId: visit.id,
        tableId: input.tableId,
        round: roundCount,
        status: "PENDING",
        notes: input.notes?.trim() || null,
        idempotencyKey: input.idempotencyKey || null,
        items: {
          create: input.items.map((it) => {
            const m = menuItemMap.get(it.menuItemId)!;
            const subtotal = Math.round(m.price * it.quantity * 100) / 100;
            return {
              menuItemId: m.id,
              itemNameSnapshot: m.name,
              unitPriceSnapshot: m.price,
              quantity: it.quantity,
              subtotalSnapshot: subtotal,
              customInstructions: it.customInstructions?.trim() || null,
              status: "ACTIVE",
            };
          }),
        },
      },
      include: {
        items: true,
        table: true,
      },
    });

    // Recalculate bill
    await recalculateVisitBill(visit.id, tx);

    return { order: newOrder, isExisting: false };
  });
}

/**
 * Record external payment for a bill
 */
export async function recordPayment(input: RecordPaymentInput) {
  if (input.amount <= 0) {
    throw new Error("Payment amount must be greater than zero");
  }

  // Idempotency check
  if (input.idempotencyKey) {
    const existing = await prisma.payment.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      include: { bill: true },
    });
    if (existing) {
      return {
        payment: existing,
        newStatus: (existing.bill?.status as any) || "PAID",
        remaining: 0,
        isExisting: true,
      };
    }
  }

  return await prisma.$transaction(async (tx) => {
    const bill = await tx.bill.findUnique({
      where: { id: input.billId },
      include: { payments: true, visit: true },
    });

    if (!bill) {
      throw new Error("Bill not found");
    }

    const currentPaid = bill.payments.reduce(
      (sum, p) => sum + (p.status === "COMPLETED" ? p.amount : 0),
      0
    );

    const remaining = Math.max(0, bill.totalAmount - currentPaid);
    if (input.amount > remaining + 0.01) {
      throw new Error(
        `Payment amount (₹${input.amount}) exceeds remaining balance (₹${remaining.toFixed(
          2
        )})`
      );
    }

    const payment = await tx.payment.create({
      data: {
        billId: bill.id,
        amount: input.amount,
        paymentMethod: input.paymentMethod,
        status: "COMPLETED",
        referenceNote: input.referenceNote?.trim() || null,
        idempotencyKey: input.idempotencyKey || null,
      },
    });

    const newTotalPaid = currentPaid + input.amount;
    let newStatus: "UNPAID" | "PARTIALLY_PAID" | "PAID" = "PARTIALLY_PAID";
    if (newTotalPaid >= bill.totalAmount - 0.01) {
      newStatus = "PAID";
    }

    await tx.bill.update({
      where: { id: bill.id },
      data: { status: newStatus },
    });

    return {
      payment,
      newStatus,
      remaining: Math.max(0, bill.totalAmount - newTotalPaid),
      isExisting: false,
    };
  });
}

/**
 * Close visit and table checkout
 */
export async function closeVisit(visitId: string) {
  return await prisma.$transaction(async (tx) => {
    const visit = await tx.visit.findUnique({
      where: { id: visitId },
      include: { bill: { include: { payments: true } }, reservation: true },
    });

    if (!visit) {
      throw new Error("Visit not found");
    }

    // Check if bill exists and is paid
    if (visit.bill && visit.bill.status !== "PAID" && visit.bill.totalAmount > 0) {
      const paid = visit.bill.payments.reduce(
        (sum, p) => sum + (p.status === "COMPLETED" ? p.amount : 0),
        0
      );
      if (paid < visit.bill.totalAmount) {
        throw new Error(
          `Cannot close visit with unpaid balance of ₹${(
            visit.bill.totalAmount - paid
          ).toFixed(2)}. Please record payment first.`
        );
      }
    }

    const closed = await tx.visit.update({
      where: { id: visitId },
      data: {
        status: "COMPLETED",
        closedAt: new Date(),
      },
    });

    if (visit.reservationId) {
      await tx.reservation.update({
        where: { id: visit.reservationId },
        data: { status: "COMPLETED" },
      });
    }

    return closed;
  });
}
