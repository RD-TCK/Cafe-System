import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isOwnerAuthenticated } from "@/lib/auth";

export async function GET() {
  try {
    const isAuth = await isOwnerAuthenticated();
    if (!isAuth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const closures = await prisma.closure.findMany({
      orderBy: { startDate: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: closures,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch closures" },
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
    const { title, startDate, endDate, isFullDay, reason } = body;

    if (!title || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: "Title, start date, and end date are required" },
        { status: 400 }
      );
    }

    const closure = await prisma.closure.create({
      data: {
        title: title.trim(),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isFullDay: isFullDay !== undefined ? Boolean(isFullDay) : true,
        reason: reason?.trim() || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: closure,
      message: "Closure scheduled successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to add closure" },
      { status: 500 }
    );
  }
}
