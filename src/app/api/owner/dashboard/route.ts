import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isOwnerAuthenticated } from "@/lib/auth";
import {
  getBusinessDayString,
  getBusinessDayDateRange,
  DEFAULT_TIMEZONE,
} from "@/lib/timezone";
import { addMinutes, isAfter, isBefore } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const isAuth = await isOwnerAuthenticated();
    if (!isAuth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Owner login required." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const dateQuery = searchParams.get("date"); // YYYY-MM-DD or undefined for current business day

    const settings = await prisma.cafeSetting.findFirst();
    const cutoffHour = settings?.businessDayCutoffHour ?? 4;
    const gracePeriod = settings?.gracePeriodMinutes ?? 15;

    // Get current business day date string
    const currentBusinessDay = dateQuery || getBusinessDayString(new Date(), cutoffHour, DEFAULT_TIMEZONE);
    const { start: dayStart, end: dayEnd } = getBusinessDayDateRange(
      currentBusinessDay,
      settings?.openingTime ?? "08:00",
      cutoffHour,
      DEFAULT_TIMEZONE
    );

    // 1. Payments collected during this business day
    const payments = await prisma.payment.findMany({
      where: {
        paidAt: { gte: dayStart, lte: dayEnd },
        status: "COMPLETED",
      },
    });

    const collectedSales = payments.reduce((sum, p) => sum + p.amount, 0);

    // 2. Active Visits & Unpaid Balances
    const activeVisits = await prisma.visit.findMany({
      where: { status: "ACTIVE" },
      include: {
        table: true,
        orders: {
          where: { status: { not: "CANCELLED" } },
          include: { items: { where: { status: { not: "CANCELLED" } } } },
        },
        bill: {
          include: { payments: true },
        },
        reservation: true,
      },
      orderBy: { checkedInAt: "asc" },
    });

    let totalActiveUnpaidBalance = 0;
    for (const v of activeVisits) {
      if (v.bill) {
        const paid = v.bill.payments.reduce(
          (sum, p) => sum + (p.status === "COMPLETED" ? p.amount : 0),
          0
        );
        const unpaid = Math.max(0, v.bill.totalAmount - paid);
        totalActiveUnpaidBalance += unpaid;
      }
    }

    // 3. Today's Reservations
    const dayReservations = await prisma.reservation.findMany({
      where: {
        startDateTime: { gte: dayStart, lte: dayEnd },
      },
      include: {
        table: true,
        visit: true,
      },
      orderBy: { startDateTime: "asc" },
    });

    // 4. Pending & Active Kitchen Orders
    const liveOrders = await prisma.order.findMany({
      where: {
        status: { in: ["PENDING", "ACCEPTED", "PREPARING"] },
      },
      include: {
        table: true,
        items: true,
        visit: true,
      },
      orderBy: { placedAt: "asc" },
    });

    // 5. Calculate Grace Period & Upcoming Booking Alerts
    const now = new Date();
    const alerts: {
      type: "LATE_GUEST" | "UPCOMING_SOON" | "SPECIAL_REQUEST_PENDING" | "PENDING_CONFIRMATION";
      message: string;
      reservationId: string;
      bookingReference: string;
      guestName: string;
      tableNumber?: string;
    }[] = [];

    for (const res of dayReservations) {
      // Pending confirmation
      if (res.status === "REQUESTED") {
        alerts.push({
          type: "PENDING_CONFIRMATION",
          message: `Booking ${res.bookingReference} for ${res.guestName} (${res.guestCount} guests) requires confirmation.`,
          reservationId: res.id,
          bookingReference: res.bookingReference,
          guestName: res.guestName,
          tableNumber: res.table?.tableNumber,
        });
      }

      // Special request pending approval
      if (
        res.specialRequest &&
        !res.specialRequestApproved &&
        res.status !== "REJECTED" &&
        res.status !== "CANCELLED"
      ) {
        alerts.push({
          type: "SPECIAL_REQUEST_PENDING",
          message: `Special request for ${res.guestName}: "${res.specialRequest}"`,
          reservationId: res.id,
          bookingReference: res.bookingReference,
          guestName: res.guestName,
          tableNumber: res.table?.tableNumber,
        });
      }

      // Confirmed but late arrival beyond grace period
      if (res.status === "CONFIRMED") {
        const graceTime = addMinutes(res.startDateTime, gracePeriod);
        if (isAfter(now, graceTime) && isBefore(now, res.endDateTime)) {
          alerts.push({
            type: "LATE_GUEST",
            message: `${res.guestName} is past the ${gracePeriod}-min grace period (${res.table?.tableNumber || "No table assigned"}). Consider calling or marking No-Show.`,
            reservationId: res.id,
            bookingReference: res.bookingReference,
            guestName: res.guestName,
            tableNumber: res.table?.tableNumber,
          });
        } else if (
          isBefore(now, res.startDateTime) &&
          isAfter(now, addMinutes(res.startDateTime, -30))
        ) {
          // Upcoming within 30 mins
          alerts.push({
            type: "UPCOMING_SOON",
            message: `Reservation for ${res.guestName} starting soon on ${res.table?.tableNumber || "Table"}.`,
            reservationId: res.id,
            bookingReference: res.bookingReference,
            guestName: res.guestName,
            tableNumber: res.table?.tableNumber,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        businessDay: currentBusinessDay,
        businessDayRange: { start: dayStart, end: dayEnd },
        kpis: {
          collectedSales,
          unpaidBalance: totalActiveUnpaidBalance,
          activeVisitsCount: activeVisits.length,
          reservationsTodayCount: dayReservations.length,
          pendingOrdersCount: liveOrders.filter((o) => o.status === "PENDING").length,
          preparingOrdersCount: liveOrders.filter((o) => o.status === "PREPARING" || o.status === "ACCEPTED").length,
        },
        alerts,
        activeVisits,
        dayReservations,
        liveOrders,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
