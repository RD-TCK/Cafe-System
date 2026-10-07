import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    const phone = searchParams.get("phone");

    const reservation = await prisma.reservation.findUnique({
      where: { bookingReference: reference.trim().toUpperCase() },
      include: {
        table: true,
        visit: {
          select: {
            id: true,
            visitCode: true,
            status: true,
            checkedInAt: true,
          },
        },
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { success: false, error: "Reservation not found" },
        { status: 404 }
      );
    }

    // Security check: match security token or phone digits
    if (token && reservation.securityToken !== token) {
      return NextResponse.json(
        { success: false, error: "Invalid security token" },
        { status: 403 }
      );
    }

    if (phone && !reservation.guestPhone.includes(phone.trim())) {
      return NextResponse.json(
        { success: false, error: "Phone number verification failed" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: reservation,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch reservation" },
      { status: 500 }
    );
  }
}
