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

    const tables = await prisma.table.findMany({
      include: {
        visits: {
          where: { status: "ACTIVE" },
          include: {
            orders: {
              where: { status: { not: "CANCELLED" } },
              include: { items: true },
            },
            bill: {
              include: { payments: true },
            },
            reservation: true,
          },
        },
        reservations: {
          where: {
            status: { in: ["REQUESTED", "CONFIRMED", "CHECKED_IN"] },
            endDateTime: { gte: new Date() },
          },
          orderBy: { startDateTime: "asc" },
        },
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
    const { tableNumber, name, capacityMin, capacityMax, section, description, photoUrl, isActive } = body;

    if (!tableNumber || !name || !capacityMin || !capacityMax) {
      return NextResponse.json(
        { success: false, error: "Missing required table fields" },
        { status: 400 }
      );
    }

    const table = await prisma.table.create({
      data: {
        tableNumber: tableNumber.trim().toUpperCase(),
        name: name.trim(),
        capacityMin: Number(capacityMin),
        capacityMax: Number(capacityMax),
        section: section || "INDOOR",
        description: description?.trim() || null,
        photoUrl: photoUrl?.trim() || null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    return NextResponse.json({
      success: true,
      data: table,
      message: `Table ${table.tableNumber} created successfully.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create table" },
      { status: 500 }
    );
  }
}
