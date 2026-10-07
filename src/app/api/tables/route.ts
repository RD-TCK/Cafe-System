import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const tables = await prisma.table.findMany({
      where: { isActive: true },
      select: {
        id: true,
        tableNumber: true,
        name: true,
        capacityMin: true,
        capacityMax: true,
        section: true,
        photoUrl: true,
        description: true,
      },
      orderBy: { tableNumber: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: tables,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch tables" },
      { status: 500 }
    );
  }
}
