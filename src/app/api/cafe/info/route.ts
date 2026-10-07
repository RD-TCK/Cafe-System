import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const settings = await prisma.cafeSetting.findFirst();
    const closures = await prisma.closure.findMany({
      where: {
        endDate: { gte: new Date() },
      },
      orderBy: { startDate: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: {
        settings,
        closures,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch cafe info" },
      { status: 500 }
    );
  }
}
