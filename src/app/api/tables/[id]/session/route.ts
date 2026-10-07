import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateVisitCode } from "@/lib/bookingEngine";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Find table by ID or tableNumber
    const table = await prisma.table.findFirst({
      where: {
        OR: [{ id: id }, { tableNumber: id.toUpperCase() }],
      },
    });

    if (!table) {
      return NextResponse.json(
        { success: false, error: "Table not found" },
        { status: 404 }
      );
    }

    // Find active visit on table
    let visit = await prisma.visit.findFirst({
      where: {
        status: "ACTIVE",
        OR: [
          { tableId: table.id },
          { combinedTableIds: { contains: table.id } },
        ],
      },
      include: {
        table: true,
        reservation: true,
        orders: {
          include: { items: true },
          orderBy: { createdAt: "desc" },
        },
        bill: {
          include: { payments: true },
        },
      },
    });

    // If no active visit exists for this table, auto-create one for seamless QR ordering
    if (!visit) {
      let visitCode = generateVisitCode();
      let codeExists = await prisma.visit.findUnique({ where: { visitCode } });
      while (codeExists) {
        visitCode = generateVisitCode();
        codeExists = await prisma.visit.findUnique({ where: { visitCode } });
      }

      visit = await prisma.visit.create({
        data: {
          tableId: table.id,
          visitCode,
          guestName: `Table ${table.tableNumber} Guest`,
          guestCount: table.capacityMin || 2,
          status: "ACTIVE",
        },
        include: {
          table: true,
          reservation: true,
          orders: {
            include: { items: true },
            orderBy: { createdAt: "desc" },
          },
          bill: {
            include: { payments: true },
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: visit,
      table,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load table session" },
      { status: 500 }
    );
  }
}
