import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isOwnerAuthenticated } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuth = await isOwnerAuthenticated();
    if (!isAuth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();

    const updated = await prisma.table.update({
      where: { id },
      data: {
        tableNumber: body.tableNumber?.trim().toUpperCase(),
        name: body.name?.trim(),
        capacityMin: body.capacityMin !== undefined ? Number(body.capacityMin) : undefined,
        capacityMax: body.capacityMax !== undefined ? Number(body.capacityMax) : undefined,
        section: body.section,
        description: body.description,
        photoUrl: body.photoUrl,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update table" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuth = await isOwnerAuthenticated();
    if (!isAuth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    // Check if table has active visit or pending reservations
    const activeVisit = await prisma.visit.findFirst({
      where: { tableId: id, status: "ACTIVE" },
    });

    if (activeVisit) {
      return NextResponse.json(
        { success: false, error: "Cannot delete table with active visit" },
        { status: 400 }
      );
    }

    // Soft delete / deactivate
    const deactivated = await prisma.table.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      data: deactivated,
      message: "Table deactivated successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete table" },
      { status: 500 }
    );
  }
}
