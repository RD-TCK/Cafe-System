import { NextRequest, NextResponse } from "next/server";
import { isOwnerAuthenticated } from "@/lib/auth";
import { closeVisit } from "@/lib/billingEngine";

export async function POST(
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
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const closed = await closeVisit(id, {
      autoSettle: body.autoSettle !== undefined ? Boolean(body.autoSettle) : true,
      paymentMethod: body.paymentMethod || "CASH",
      referenceNote: body.referenceNote || "Settled upon table close checkout",
    });

    return NextResponse.json({
      success: true,
      data: closed,
      message: "Visit successfully closed and table freed.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to close visit" },
      { status: 400 }
    );
  }
}
