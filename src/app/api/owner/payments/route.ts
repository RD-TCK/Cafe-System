import { NextRequest, NextResponse } from "next/server";
import { isOwnerAuthenticated } from "@/lib/auth";
import { recordPayment } from "@/lib/billingEngine";

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
    const { billId, amount, paymentMethod, referenceNote, idempotencyKey } = body;

    if (!billId || !amount || !paymentMethod) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: billId, amount, paymentMethod",
        },
        { status: 400 }
      );
    }

    const result = await recordPayment({
      billId,
      amount: Number(amount),
      paymentMethod,
      referenceNote,
      idempotencyKey,
    });

    return NextResponse.json({
      success: true,
      data: result.payment,
      newBillStatus: result.newStatus,
      remainingBalance: result.remaining,
      message: `Payment of ₹${amount} recorded (${paymentMethod}). Bill status: ${result.newStatus}.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to record payment" },
      { status: 400 }
    );
  }
}
