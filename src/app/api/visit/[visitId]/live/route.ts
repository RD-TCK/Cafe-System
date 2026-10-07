import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ visitId: string }> }
) {
  try {
    const { visitId } = await params;
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    const visit = await prisma.visit.findUnique({
      where: { id: visitId },
      include: {
        table: true,
        orders: {
          include: {
            items: true,
          },
          orderBy: { createdAt: "desc" },
        },
        bill: {
          include: {
            payments: true,
          },
        },
      },
    });

    if (!visit) {
      return NextResponse.json(
        { success: false, error: "Visit not found" },
        { status: 404 }
      );
    }

    // If visit code passed, verify it matches
    if (code && visit.visitCode !== code) {
      return NextResponse.json(
        { success: false, error: "Invalid visit code" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: visit,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch live visit" },
      { status: 500 }
    );
  }
}
