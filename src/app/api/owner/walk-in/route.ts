import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isOwnerAuthenticated } from "@/lib/auth";
import { generateVisitCode } from "@/lib/bookingEngine";

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
    const { tableId, guestName, guestCount, combinedTableIds } = body;

    if (!tableId || !guestCount) {
      return NextResponse.json(
        { success: false, error: "Table ID and guest count are required" },
        { status: 400 }
      );
    }

    // Check table active visit
    const existingActiveVisit = await prisma.visit.findFirst({
      where: {
        status: "ACTIVE",
        OR: [
          { tableId: tableId },
          { combinedTableIds: { contains: tableId } },
        ],
      },
    });

    if (existingActiveVisit) {
      return NextResponse.json(
        {
          success: false,
          error: "Selected table already has an active visit.",
        },
        { status: 400 }
      );
    }

    let visitCode = generateVisitCode();
    let codeExists = await prisma.visit.findUnique({ where: { visitCode } });
    while (codeExists) {
      visitCode = generateVisitCode();
      codeExists = await prisma.visit.findUnique({ where: { visitCode } });
    }

    const visit = await prisma.visit.create({
      data: {
        visitCode,
        tableId,
        combinedTableIds: combinedTableIds
          ? typeof combinedTableIds === "string"
            ? combinedTableIds
            : JSON.stringify(combinedTableIds)
          : null,
        guestName: guestName ? guestName.trim() : "Walk-in Guest",
        guestCount: Number(guestCount),
        status: "ACTIVE",
        checkedInAt: new Date(),
      },
      include: { table: true },
    });

    return NextResponse.json({
      success: true,
      data: visit,
      message: `Walk-in registered on Table ${visit.table.tableNumber}! Visit Code: ${visit.visitCode}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to register walk-in" },
      { status: 500 }
    );
  }
}
