import { NextRequest, NextResponse } from "next/server";
import { createReservation } from "@/lib/bookingEngine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      guestName,
      guestPhone,
      guestEmail,
      guestCount,
      date,
      time,
      durationMinutes,
      requestedTableId,
      occasion,
      specialRequest,
      idempotencyKey,
    } = body;

    if (!guestName || !guestPhone || !guestEmail || !date || !time || !guestCount) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: guestName, guestPhone, guestEmail, guestCount, date, time",
        },
        { status: 400 }
      );
    }

    const result = await createReservation({
      guestName,
      guestPhone,
      guestEmail,
      guestCount: Number(guestCount),
      date,
      time,
      durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
      requestedTableId: requestedTableId || null,
      occasion,
      specialRequest,
      idempotencyKey,
    });

    return NextResponse.json({
      success: true,
      data: result.reservation,
      isExisting: result.isExisting,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create reservation" },
      { status: 400 }
    );
  }
}
