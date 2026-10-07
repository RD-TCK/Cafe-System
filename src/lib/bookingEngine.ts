import { prisma } from "./prisma";
import {
  parseDateTimeInCafeTz,
  doIntervalsOverlap,
  DEFAULT_TIMEZONE,
} from "./timezone";
import { addMinutes, isBefore, isAfter, parseISO } from "date-fns";
import { CreateReservationInput, RescheduleReservationInput } from "./types";
import crypto from "crypto";

export function generateBookingReference(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  const code = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `RES-${num}-${code}`;
}

export function generateSecurityToken(): string {
  return crypto.randomBytes(16).toString("hex");
}

export function generateVisitCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Validates if the café is open and not blocked by a closure at the requested time
 */
export async function validateOperatingHoursAndClosures(
  startDateTime: Date,
  endDateTime: Date
): Promise<{ ok: boolean; error?: string; settings?: any }> {
  const settings = await prisma.cafeSetting.findFirst();
  if (!settings) {
    return { ok: false, error: "Café settings not configured" };
  }

  // Check closures
  const closures = await prisma.closure.findMany({
    where: {
      startDate: { lte: endDateTime },
      endDate: { gte: startDateTime },
    },
  });

  if (closures.length > 0) {
    return {
      ok: false,
      error: `Café is closed during this time: ${closures[0].title}${
        closures[0].reason ? ` (${closures[0].reason})` : ""
      }`,
    };
  }

  // Check opening and closing hours
  const startHoursMinutes =
    startDateTime.getHours() * 60 + startDateTime.getMinutes();
  const endHoursMinutes =
    endDateTime.getHours() * 60 + endDateTime.getMinutes();

  const [openH, openM] = settings.openingTime.split(":").map(Number);
  const [closeH, closeM] = settings.closingTime.split(":").map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  if (startHoursMinutes < openMinutes || endHoursMinutes > closeMinutes) {
    return {
      ok: false,
      error: `Booking time must be between opening (${settings.openingTime}) and closing (${settings.closingTime})`,
      settings,
    };
  }

  return { ok: true, settings };
}

/**
 * Checks if a specific table or set of tables is available for the given timeframe
 */
export async function checkTableAvailability(
  tableId: string,
  startDateTime: Date,
  endDateTime: Date,
  bufferBeforeMinutes: number,
  bufferAfterMinutes: number,
  excludeReservationId?: string
): Promise<boolean> {
  // Check active/confirmed reservations on this table
  const existingReservations = await prisma.reservation.findMany({
    where: {
      status: { in: ["REQUESTED", "CONFIRMED", "CHECKED_IN"] },
      id: excludeReservationId ? { not: excludeReservationId } : undefined,
      OR: [
        { tableId: tableId },
        { combinedTableIds: { contains: tableId } },
      ],
    },
  });

  for (const res of existingReservations) {
    const overlaps = doIntervalsOverlap(
      startDateTime,
      endDateTime,
      bufferBeforeMinutes,
      bufferAfterMinutes,
      res.startDateTime,
      res.endDateTime,
      res.bufferBeforeMinutes,
      res.bufferAfterMinutes
    );
    if (overlaps) {
      return false;
    }
  }

  return true;
}

/**
 * Finds all suitable tables for a given guest count and time slot
 */
export async function findAvailableTables(
  startDateTime: Date,
  endDateTime: Date,
  guestCount: number,
  bufferBeforeMinutes: number,
  bufferAfterMinutes: number,
  requestedTableId?: string | null,
  excludeReservationId?: string
) {
  const allTables = await prisma.table.findMany({
    where: {
      isActive: true,
      ...(requestedTableId ? { id: requestedTableId } : {}),
    },
    orderBy: { capacityMin: "asc" },
  });

  const suitableTables = [];

  for (const table of allTables) {
    // Check capacity
    const fitsCapacity =
      guestCount >= table.capacityMin && guestCount <= table.capacityMax;
    if (!fitsCapacity && !requestedTableId) {
      continue;
    }

    const isAvailable = await checkTableAvailability(
      table.id,
      startDateTime,
      endDateTime,
      bufferBeforeMinutes,
      bufferAfterMinutes,
      excludeReservationId
    );

    if (isAvailable) {
      suitableTables.push(table);
    }
  }

  return suitableTables;
}

/**
 * Create a new Reservation atomically with buffer and conflict checks
 */
export async function createReservation(input: CreateReservationInput) {
  // Idempotency check
  if (input.idempotencyKey) {
    const existing = await prisma.reservation.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      include: { table: true },
    });
    if (existing) {
      return { reservation: existing, isExisting: true };
    }
  }

  const settings = await prisma.cafeSetting.findFirst();
  const duration =
    input.durationMinutes || settings?.defaultReservationDurationMinutes || 90;
  const bufferBefore = settings?.bufferBeforeMinutes || 15;
  const bufferAfter = settings?.bufferAfterMinutes || 15;

  const startDateTime = parseDateTimeInCafeTz(input.date, input.time);
  const endDateTime = addMinutes(startDateTime, duration);

  // Validate operating hours and closures
  const opCheck = await validateOperatingHoursAndClosures(
    startDateTime,
    endDateTime
  );
  if (!opCheck.ok) {
    throw new Error(opCheck.error || "Cannot reserve outside operating hours");
  }

  // Atomic database transaction to prevent race conditions
  return await prisma.$transaction(async (tx) => {
    // If a specific table was requested, verify its availability
    let assignedTableId: string | null = null;

    if (input.requestedTableId) {
      const targetTable = await tx.table.findUnique({
        where: { id: input.requestedTableId, isActive: true },
      });

      if (!targetTable) {
        throw new Error("The requested table was not found or is inactive");
      }

      if (
        input.guestCount < targetTable.capacityMin ||
        input.guestCount > targetTable.capacityMax
      ) {
        throw new Error(
          `Table ${targetTable.tableNumber} accommodates ${targetTable.capacityMin}-${targetTable.capacityMax} guests`
        );
      }

      // Check conflict
      const conflicts = await tx.reservation.findMany({
        where: {
          status: { in: ["REQUESTED", "CONFIRMED", "CHECKED_IN"] },
          OR: [
            { tableId: targetTable.id },
            { combinedTableIds: { contains: targetTable.id } },
          ],
        },
      });

      for (const res of conflicts) {
        if (
          doIntervalsOverlap(
            startDateTime,
            endDateTime,
            bufferBefore,
            bufferAfter,
            res.startDateTime,
            res.endDateTime,
            res.bufferBeforeMinutes,
            res.bufferAfterMinutes
          )
        ) {
          throw new Error(
            `Table ${targetTable.tableNumber} is not available at the selected time due to a conflicting booking or buffer period.`
          );
        }
      }

      assignedTableId = targetTable.id;
    } else {
      // Find any suitable table
      const availableTables = await findAvailableTables(
        startDateTime,
        endDateTime,
        input.guestCount,
        bufferBefore,
        bufferAfter
      );

      if (availableTables.length === 0) {
        throw new Error(
          "No suitable tables available for this guest count and time slot. Please choose another time or duration."
        );
      }

      // Auto-assign the best-fit table
      assignedTableId = availableTables[0].id;
    }

    const bookingReference = generateBookingReference();
    const securityToken = generateSecurityToken();

    const reservation = await tx.reservation.create({
      data: {
        bookingReference,
        securityToken,
        guestName: input.guestName.trim(),
        guestPhone: input.guestPhone.trim(),
        guestEmail: input.guestEmail.trim(),
        guestCount: input.guestCount,
        occasion: input.occasion || null,
        specialRequest: input.specialRequest ? input.specialRequest.trim() : null,
        specialRequestApproved: false,
        status: "REQUESTED", // Initial state
        requestedTableId: input.requestedTableId || null,
        tableId: assignedTableId,
        startDateTime,
        endDateTime,
        durationMinutes: duration,
        bufferBeforeMinutes: bufferBefore,
        bufferAfterMinutes: bufferAfter,
        idempotencyKey: input.idempotencyKey || null,
      },
      include: {
        table: true,
      },
    });

    return { reservation, isExisting: false };
  });
}

/**
 * Reschedule an existing reservation atomically.
 * If new slot conflicts, original slot remains untouched.
 */
export async function rescheduleReservation(input: RescheduleReservationInput) {
  const existing = await prisma.reservation.findUnique({
    where: { bookingReference: input.bookingReference },
    include: { table: true },
  });

  if (!existing) {
    throw new Error("Reservation not found with given booking reference");
  }

  if (existing.securityToken !== input.securityToken) {
    throw new Error("Invalid security token for this reservation");
  }

  if (["CANCELLED", "REJECTED", "COMPLETED", "NO_SHOW"].includes(existing.status)) {
    throw new Error(`Cannot reschedule a reservation in ${existing.status} status`);
  }

  const settings = await prisma.cafeSetting.findFirst();
  const duration =
    input.newDurationMinutes ||
    existing.durationMinutes ||
    settings?.defaultReservationDurationMinutes ||
    90;
  const bufferBefore = settings?.bufferBeforeMinutes || 15;
  const bufferAfter = settings?.bufferAfterMinutes || 15;
  const guestCount = input.newGuestCount || existing.guestCount;

  const startDateTime = parseDateTimeInCafeTz(input.newDate, input.newTime);
  const endDateTime = addMinutes(startDateTime, duration);

  const opCheck = await validateOperatingHoursAndClosures(
    startDateTime,
    endDateTime
  );
  if (!opCheck.ok) {
    throw new Error(opCheck.error || "Selected time is outside operating hours");
  }

  // Atomic transaction
  return await prisma.$transaction(async (tx) => {
    let targetTableId = input.requestedTableId || existing.tableId;

    if (targetTableId) {
      const table = await tx.table.findUnique({
        where: { id: targetTableId, isActive: true },
      });

      if (
        !table ||
        guestCount < table.capacityMin ||
        guestCount > table.capacityMax
      ) {
        // Find alternative suitable table
        const suitable = await findAvailableTables(
          startDateTime,
          endDateTime,
          guestCount,
          bufferBefore,
          bufferAfter,
          undefined,
          existing.id
        );

        if (suitable.length === 0) {
          throw new Error(
            "No suitable tables available for the rescheduled time. Your previous slot has been preserved."
          );
        }
        targetTableId = suitable[0].id;
      } else {
        // Verify table availability excluding this reservation
        const isAvail = await checkTableAvailability(
          targetTableId,
          startDateTime,
          endDateTime,
          bufferBefore,
          bufferAfter,
          existing.id
        );

        if (!isAvail) {
          throw new Error(
            "The requested table is not available at the new time. Your previous slot has been preserved."
          );
        }
      }
    }

    const updated = await tx.reservation.update({
      where: { id: existing.id },
      data: {
        startDateTime,
        endDateTime,
        durationMinutes: duration,
        guestCount,
        tableId: targetTableId,
        status: "REQUESTED", // Re-requires owner confirmation on time change
        specialRequestApproved: false, // Re-requires explicit review
      },
      include: {
        table: true,
      },
    });

    return updated;
  });
}
