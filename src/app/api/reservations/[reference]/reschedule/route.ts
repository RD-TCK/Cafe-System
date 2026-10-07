import { NextRequest, NextResponse } from "next/server";
import { rescheduleReservation } from "@/lib/bookingEngine";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;
    const body = await req.json();
    const {
      securityToken,
      newDate,
      newTime,
      newDurationMinutes,
      newGuestCount,
      requestedTableId,
    } = body;

    if (!securityToken || !newDate || !newTime) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: securityToken, newDate, newTime",
        },
        { status: 400 }
      );
    }

    const updated = await rescheduleReservation({
      bookingReference: reference.trim().toUpperCase(),
      securityToken,
      newDate,
      newTime,
      newDurationMinutes: newDurationMinutes ? Number(newDurationMinutes) : undefined,
      newGuestCount: newGuestCount ? Number(newGuestCount) : undefined,
      requestedTableId: requestedTableId || null,
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Reservation rescheduled successfully. Status returned to Requested for owner confirmation.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to reschedule reservation" },
      { status: 400 }
    );
  }
}
