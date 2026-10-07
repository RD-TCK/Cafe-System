import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isOwnerAuthenticated } from "@/lib/auth";
import { checkTableAvailability } from "@/lib/bookingEngine";

export async function PATCH(
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
    const body = await req.json();
    const {
      status,
      tableId,
      combinedTableIds,
      specialRequestApproved,
      rejectionReason,
    } = body;

    const existing = await prisma.reservation.findUnique({
      where: { id },
      include: { table: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Reservation not found" },
        { status: 404 }
      );
    }

    // Atomic table availability re-check if confirming or assigning/changing table
    if (tableId && tableId !== existing.tableId) {
      const isAvail = await checkTableAvailability(
        tableId,
        existing.startDateTime,
        existing.endDateTime,
        existing.bufferBeforeMinutes,
        existing.bufferAfterMinutes,
        existing.id
      );

      if (!isAvail) {
        return NextResponse.json(
          {
            success: false,
            error: "The selected table is occupied or conflicting with another booking buffer.",
          },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.reservation.update({
      where: { id },
      data: {
        status: status !== undefined ? status : existing.status,
        tableId: tableId !== undefined ? tableId : existing.tableId,
        combinedTableIds:
          combinedTableIds !== undefined
            ? typeof combinedTableIds === "string"
              ? combinedTableIds
              : JSON.stringify(combinedTableIds)
            : existing.combinedTableIds,
        specialRequestApproved:
          specialRequestApproved !== undefined
            ? Boolean(specialRequestApproved)
            : existing.specialRequestApproved,
        rejectionReason:
          rejectionReason !== undefined ? rejectionReason : existing.rejectionReason,
      },
      include: { table: true },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Reservation ${updated.bookingReference} updated to ${updated.status}.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update reservation" },
      { status: 500 }
    );
  }
}
