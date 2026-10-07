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
    const date = searchParams.get("date");

    const where: any = {};

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { bookingReference: { contains: search } },
        { guestName: { contains: search } },
        { guestPhone: { contains: search } },
        { guestEmail: { contains: search } },
      ];
    }

    if (date) {
      const startOfDay = new Date(`${date}T00:00:00.000Z`);
      const endOfDay = new Date(`${date}T23:59:59.999Z`);
      where.startDateTime = { gte: startOfDay, lte: endOfDay };
    }

    const reservations = await prisma.reservation.findMany({
      where,
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
      orderBy: { startDateTime: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: reservations,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch reservations" },
      { status: 500 }
    );
  }
}
