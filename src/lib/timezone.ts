import { format, parseISO, addMinutes, subMinutes, isBefore, isAfter } from "date-fns";
import { toZonedTime, fromZonedTime, format as formatTz } from "date-fns-tz";

export const DEFAULT_TIMEZONE = "Asia/Kolkata";

/**
 * Returns current Date in Asia/Kolkata timezone
 */
export function getNowInTimezone(tz: string = DEFAULT_TIMEZONE): Date {
  return new Date();
}

/**
 * Format a UTC/local Date in Asia/Kolkata timezone
 */
export function formatInCafeTz(
  date: Date | string | number,
  formatPattern: string = "yyyy-MM-dd HH:mm",
  tz: string = DEFAULT_TIMEZONE
): string {
  const d = typeof date === "string" ? parseISO(date) : new Date(date);
  return formatTz(toZonedTime(d, tz), formatPattern, { timeZone: tz });
}

/**
 * Business Day Rule:
 * The business day for a café typically begins at opening time (e.g., 08:00 AM)
 * and extends late into the night (past midnight) until `cutoffHour` (e.g., 04:00 AM).
 * If the current local time in Asia/Kolkata is between 00:00 and 03:59:59,
 * it is counted as part of the previous calendar date's business day.
 */
export function getBusinessDayString(
  date: Date = new Date(),
  cutoffHour: number = 4,
  tz: string = DEFAULT_TIMEZONE
): string {
  const zoned = toZonedTime(date, tz);
  const hours = zoned.getHours();
  
  if (hours < cutoffHour) {
    // Subtract 1 day
    const prevDay = new Date(zoned.getTime() - 24 * 60 * 60 * 1000);
    return format(prevDay, "yyyy-MM-dd");
  }
  return format(zoned, "yyyy-MM-dd");
}

/**
 * Returns the business day start and end bounds in UTC for querying database records.
 */
export function getBusinessDayDateRange(
  dateStr: string, // "YYYY-MM-DD"
  openingTime: string = "08:00",
  cutoffHour: number = 4,
  tz: string = DEFAULT_TIMEZONE
): { start: Date; end: Date } {
  // Business day starts at YYYY-MM-DD 08:00 (or openingTime) in Asia/Kolkata
  // and ends at YYYY-MM-(DD+1) cutoffHour:00 in Asia/Kolkata
  const [year, month, day] = dateStr.split("-").map(Number);
  
  // Format local string for start
  const startZoned = new Date(year, month - 1, day, 0, 0, 0);
  const startUtc = fromZonedTime(startZoned, tz);

  // Next calendar day + cutoffHour
  const endZoned = new Date(year, month - 1, day + 1, cutoffHour, 0, 0);
  const endUtc = fromZonedTime(endZoned, tz);

  return {
    start: startUtc,
    end: endUtc,
  };
}

/**
 * Combine date string "YYYY-MM-DD" and time string "HH:mm" into a UTC Date object
 * with respect to Asia/Kolkata timezone.
 */
export function parseDateTimeInCafeTz(
  dateStr: string, // "2026-10-04"
  timeStr: string, // "18:30"
  tz: string = DEFAULT_TIMEZONE
): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);
  
  // Create Date object representing that local time
  const localDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
  return fromZonedTime(localDate, tz);
}

/**
 * Calculate effective interval with buffer times:
 * [startDateTime - bufferBeforeMinutes, endDateTime + bufferAfterMinutes]
 */
export function getEffectiveBookingWindow(
  startDateTime: Date,
  endDateTime: Date,
  bufferBeforeMinutes: number = 15,
  bufferAfterMinutes: number = 15
): { effectiveStart: Date; effectiveEnd: Date } {
  return {
    effectiveStart: subMinutes(startDateTime, bufferBeforeMinutes),
    effectiveEnd: addMinutes(endDateTime, bufferAfterMinutes),
  };
}

/**
 * Checks if two intervals with buffers overlap
 */
export function doIntervalsOverlap(
  startA: Date,
  endA: Date,
  bufferBeforeA: number,
  bufferAfterA: number,
  startB: Date,
  endB: Date,
  bufferBeforeB: number,
  bufferAfterB: number
): boolean {
  const effectiveStartA = subMinutes(startA, bufferBeforeA);
  const effectiveEndA = addMinutes(endA, bufferAfterA);

  const effectiveStartB = subMinutes(startB, bufferBeforeB);
  const effectiveEndB = addMinutes(endB, bufferAfterB);

  // Overlap condition: StartA < EndB AND EndA > StartB
  return isBefore(effectiveStartA, effectiveEndB) && isAfter(effectiveEndA, effectiveStartB);
}
