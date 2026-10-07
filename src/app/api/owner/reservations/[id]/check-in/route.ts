import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isOwnerAuthenticated } from "@/lib/auth";
import { generateVisitCode } from "@/lib/bookingEngine";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuth = await isOwnerAuthenticated();
    if (!isAuth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { tableId: overrideTableId } = body;

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: { table: true, visit: true },
    });

    if (!reservation) {
      return NextResponse.json(
        { success: false, error: "Reservation not found" },
        { status: 404 }
      );
    }

    if (reservation.visit && reservation.visit.status === "ACTIVE") {
      return NextResponse.json({
        success: true,
        data: reservation.visit,
        message: "Guest is already checked in with active visit code.",
      });
    }

    const finalTableId = overrideTableId || reservation.tableId;
    if (!finalTableId) {
      return NextResponse.json(
        { success: false, error: "No table assigned to this reservation. Please select a table first." },
        { status: 400 }
      );
    }

    // Check if table already has an active visit
    const existingActiveVisit = await prisma.visit.findFirst({
      where: { tableId: finalTableId, status: "ACTIVE" },
    });

    if (existingActiveVisit) {
      return NextResponse.json(
        {
          success: false,
          error: "Selected table currently has another active guest visit. Please close that visit or select another table.",
        },
        { status: 400 }
      );
    }

    // Generate unique 4-digit numeric visit code
    let visitCode = generateVisitCode();
    let codeExists = await prisma.visit.findUnique({ where: { visitCode } });
    while (codeExists) {
      visitCode = generateVisitCode();
      codeExists = await prisma.visit.findUnique({ where: { visitCode } });
    }

    // Atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      const visit = await tx.visit.create({
        data: {
          visitCode,
          tableId: finalTableId,
          reservationId: reservation.id,
          guestName: reservation.guestName,
          guestCount: reservation.guestCount,
          status: "ACTIVE",
          checkedInAt: new Date(),
        },
        include: { table: true },
      });

      await tx.reservation.update({
        where: { id: reservation.id },
        data: {
          status: "CHECKED_IN",
          tableId: finalTableId,
        },
      });

      return visit;
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: `Checked in successfully! Visit code for Table ${result.table.tableNumber} is ${result.visitCode}.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to check in reservation" },
      { status: 500 }
    );
  }
}
