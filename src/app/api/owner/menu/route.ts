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

    const categories = await prisma.category.findMany({
      include: {
        items: {
          orderBy: { name: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch menu" },
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
    const {
      categoryId,
      name,
      description,
      price,
      isVegetarian,
      isVegan,
      isGlutenFree,
      isSpicy,
      isAvailable,
      prepTimeMinutes,
      photoUrl,
    } = body;

    if (!categoryId || !name || price === undefined) {
      return NextResponse.json(
        { success: false, error: "Missing required menu item fields" },
        { status: 400 }
      );
    }

    const item = await prisma.menuItem.create({
      data: {
        categoryId,
        name: name.trim(),
        description: description?.trim() || "",
        price: Number(price),
        isVegetarian: isVegetarian !== undefined ? Boolean(isVegetarian) : true,
        isVegan: isVegan !== undefined ? Boolean(isVegan) : false,
        isGlutenFree: isGlutenFree !== undefined ? Boolean(isGlutenFree) : false,
        isSpicy: isSpicy !== undefined ? Boolean(isSpicy) : false,
        isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
        prepTimeMinutes: prepTimeMinutes ? Number(prepTimeMinutes) : 15,
        photoUrl: photoUrl?.trim() || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: item,
      message: `Menu item ${item.name} created.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create menu item" },
      { status: 500 }
    );
  }
}
