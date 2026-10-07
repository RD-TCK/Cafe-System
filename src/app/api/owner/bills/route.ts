import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isOwnerAuthenticated } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const isAuth = await isOwnerAuthenticated();
    if (!isAuth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const tableId = searchParams.get("tableId");

    const where: any = {};

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (tableId) {
      where.tableId = tableId;
    }

    if (search) {
      where.OR = [
        { billNumber: { contains: search } },
        { visit: { guestName: { contains: search } } },
        { visit: { visitCode: { contains: search } } },
      ];
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(`${startDate}T00:00:00.000Z`),
        lte: new Date(`${endDate}T23:59:59.999Z`),
      };
    }

    const bills = await prisma.bill.findMany({
      where,
      include: {
        table: true,
        payments: true,
        visit: {
          include: {
            orders: {
              include: { items: true },
            },
            reservation: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: bills,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch bills" },
      { status: 500 }
    );
  }
}
