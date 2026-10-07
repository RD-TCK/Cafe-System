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

    const updated = await prisma.menuItem.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name.trim() : undefined,
        description: body.description !== undefined ? body.description.trim() : undefined,
        price: body.price !== undefined ? Number(body.price) : undefined,
        categoryId: body.categoryId,
        isVegetarian: body.isVegetarian !== undefined ? Boolean(body.isVegetarian) : undefined,
        isVegan: body.isVegan !== undefined ? Boolean(body.isVegan) : undefined,
        isGlutenFree: body.isGlutenFree !== undefined ? Boolean(body.isGlutenFree) : undefined,
        isSpicy: body.isSpicy !== undefined ? Boolean(body.isSpicy) : undefined,
        isAvailable: body.isAvailable !== undefined ? Boolean(body.isAvailable) : undefined,
        prepTimeMinutes: body.prepTimeMinutes !== undefined ? Number(body.prepTimeMinutes) : undefined,
        photoUrl: body.photoUrl !== undefined ? body.photoUrl?.trim() || null : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Menu item ${updated.name} updated.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update menu item" },
      { status: 500 }
    );
  }
}
