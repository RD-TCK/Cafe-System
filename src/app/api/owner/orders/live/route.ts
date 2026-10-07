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
    const status = searchParams.get("status"); // ALL or specific
    const tableId = searchParams.get("tableId");

    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status;
    } else if (!status) {
      // Default to active kitchen orders
      where.status = { in: ["PENDING", "ACCEPTED", "PREPARING", "SERVED"] };
    }

    if (tableId) {
      where.tableId = tableId;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        table: true,
        visit: true,
        items: {
          include: {
            menuItem: {
              select: {
                isVegetarian: true,
                isVegan: true,
                isGlutenFree: true,
                isSpicy: true,
                prepTimeMinutes: true,
              },
            },
          },
        },
      },
      orderBy: { placedAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: orders,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch live orders" },
      { status: 500 }
    );
  }
}
