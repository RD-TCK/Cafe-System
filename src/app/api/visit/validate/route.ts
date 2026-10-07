import { NextRequest, NextResponse } from "next/server";
import { validateActiveVisit } from "@/lib/billingEngine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tableId, visitCode } = body;

    if (!tableId || !visitCode) {
      return NextResponse.json(
        {
          success: false,
          error: "Table ID and Visit Code are required",
        },
        { status: 400 }
      );
    }

    const visit = await validateActiveVisit(tableId, visitCode);

    return NextResponse.json({
      success: true,
      data: visit,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to validate visit" },
      { status: 400 }
    );
  }
}
