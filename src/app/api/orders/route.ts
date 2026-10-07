import { NextRequest, NextResponse } from "next/server";
import { placeOrder } from "@/lib/billingEngine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tableId, visitCode, items, notes, idempotencyKey } = body;

    if (!tableId || !visitCode || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: tableId, visitCode, items array",
        },
        { status: 400 }
      );
    }

    const result = await placeOrder({
      tableId,
      visitCode,
      items,
      notes,
      idempotencyKey,
    });

    return NextResponse.json({
      success: true,
      data: result.order,
      isExisting: result.isExisting,
      message: "Order placed successfully!",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to place order" },
      { status: 400 }
    );
  }
}
