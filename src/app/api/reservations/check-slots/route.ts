import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseDateTimeInCafeTz } from "@/lib/timezone";
import {
  findAvailableTables,
  validateOperatingHoursAndClosures,
} from "@/lib/bookingEngine";
import { addMinutes } from "date-fns";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { date, guestCount = 2, durationMinutes = 90, tableId } = body;

    if (!date) {
      return NextResponse.json(
        { success: false, error: "Date is required (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const settings = await prisma.cafeSetting.findFirst();
    if (!settings) {
      return NextResponse.json(
        { success: false, error: "Café settings not found" },
        { status: 500 }
      );
    }

    const [openH, openM] = settings.openingTime.split(":").map(Number);
    const [closeH, closeM] = settings.closingTime.split(":").map(Number);

    const bufferBefore = settings.bufferBeforeMinutes;
    const bufferAfter = settings.bufferAfterMinutes;

    // Generate slots in 30-min intervals
    const slots: { time: string; available: boolean; availableTablesCount: number }[] = [];

    const totalOpenMinutes = openH * 60 + openM;
    const totalCloseMinutes = closeH * 60 + closeM;

    for (let m = totalOpenMinutes; m + durationMinutes <= totalCloseMinutes; m += 30) {
      const hours = Math.floor(m / 60)
        .toString()
        .padStart(2, "0");
      const minutes = (m % 60).toString().padStart(2, "0");
      const timeStr = `${hours}:${minutes}`;

      const startDateTime = parseDateTimeInCafeTz(date, timeStr);
      const endDateTime = addMinutes(startDateTime, durationMinutes);

      // Check operating hours & closures
      const opCheck = await validateOperatingHoursAndClosures(
        startDateTime,
        endDateTime
      );

      if (!opCheck.ok) {
        slots.push({
          time: timeStr,
          available: false,
          availableTablesCount: 0,
        });
        continue;
      }

      const availableTables = await findAvailableTables(
        startDateTime,
        endDateTime,
        Number(guestCount),
        bufferBefore,
        bufferAfter,
        tableId || null
      );

      slots.push({
        time: timeStr,
        available: availableTables.length > 0,
        availableTablesCount: availableTables.length,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        date,
        durationMinutes,
        guestCount,
        slots,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to check slots" },
      { status: 500 }
    );
  }
}
