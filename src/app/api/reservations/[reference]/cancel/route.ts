import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;
    const body = await req.json();
    const { securityToken, reason } = body;

    const reservation = await prisma.reservation.findUnique({
      where: { bookingReference: reference.trim().toUpperCase() },
    });

    if (!reservation) {
      return NextResponse.json(
        { success: false, error: "Reservation not found" },
        { status: 404 }
      );
    }

    if (securityToken && reservation.securityToken !== securityToken) {
      return NextResponse.json(
        { success: false, error: "Invalid security token" },
        { status: 403 }
      );
    }

    if (["COMPLETED", "CHECKED_IN", "CANCELLED"].includes(reservation.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot cancel a reservation currently in ${reservation.status} state`,
        },
        { status: 400 }
      );
    }

    const cancelled = await prisma.reservation.update({
      where: { id: reservation.id },
      data: {
        status: "CANCELLED",
        rejectionReason: reason?.trim() || "Cancelled by customer",
      },
    });

    return NextResponse.json({
      success: true,
      data: cancelled,
      message: "Reservation successfully cancelled.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to cancel reservation" },
      { status: 500 }
    );
  }
}
