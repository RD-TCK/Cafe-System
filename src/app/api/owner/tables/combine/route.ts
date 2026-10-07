import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isOwnerAuthenticated } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const isAuth = await isOwnerAuthenticated();
    if (!isAuth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { primaryTableId, combinedTableIds, visitId, reservationId } = body;

    if (!primaryTableId || !Array.isArray(combinedTableIds) || combinedTableIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Primary table and combined table IDs array required" },
        { status: 400 }
      );
    }

    // Check all combined tables are active and not currently occupied by another active visit
    const allTableIds = Array.from(new Set([primaryTableId, ...combinedTableIds]));

    const tables = await prisma.table.findMany({
      where: { id: { in: allTableIds }, isActive: true },
    });

    if (tables.length !== allTableIds.length) {
      return NextResponse.json(
        { success: false, error: "One or more tables are invalid or inactive" },
        { status: 400 }
      );
    }

    // Atomic update
    const result = await prisma.$transaction(async (tx) => {
      // Check for conflicts with other active visits
      const otherActiveVisits = await tx.visit.findMany({
        where: {
          status: "ACTIVE",
          id: visitId ? { not: visitId } : undefined,
          OR: [
            { tableId: { in: allTableIds } },
            ...allTableIds.map((tId) => ({ combinedTableIds: { contains: tId } })),
          ],
        },
      });

      if (otherActiveVisits.length > 0) {
        throw new Error(
          "One or more of the selected tables are currently occupied by another active visit."
        );
      }

      if (visitId) {
        const updatedVisit = await tx.visit.update({
          where: { id: visitId },
          data: {
            tableId: primaryTableId,
            combinedTableIds: JSON.stringify(allTableIds),
          },
          include: { table: true },
        });
        return updatedVisit;
      }

      if (reservationId) {
        const updatedRes = await tx.reservation.update({
          where: { id: reservationId },
          data: {
            tableId: primaryTableId,
            combinedTableIds: JSON.stringify(allTableIds),
          },
          include: { table: true },
        });
        return updatedRes;
      }

      return { tablesCombined: allTableIds };
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: `Tables combined successfully (${allTableIds.length} tables linked).`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to combine tables" },
      { status: 400 }
    );
  }
}
