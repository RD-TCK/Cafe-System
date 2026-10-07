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

    const settings = await prisma.cafeSetting.findFirst();
    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch settings" },
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
    const existing = await prisma.cafeSetting.findFirst();

    const data = {
      name: body.name?.trim() || existing?.name || "The Roasted Bean Café",
      tagline: body.tagline?.trim() || existing?.tagline,
      description: body.description?.trim() || existing?.description,
      address: body.address?.trim() || existing?.address,
      phone: body.phone?.trim() || existing?.phone,
      email: body.email?.trim() || existing?.email,
      openingTime: body.openingTime || existing?.openingTime || "08:00",
      closingTime: body.closingTime || existing?.closingTime || "23:00",
      businessDayCutoffHour:
        body.businessDayCutoffHour !== undefined
          ? Number(body.businessDayCutoffHour)
          : existing?.businessDayCutoffHour ?? 4,
      defaultReservationDurationMinutes:
        body.defaultReservationDurationMinutes !== undefined
          ? Number(body.defaultReservationDurationMinutes)
          : existing?.defaultReservationDurationMinutes ?? 90,
      bufferBeforeMinutes:
        body.bufferBeforeMinutes !== undefined
          ? Number(body.bufferBeforeMinutes)
          : existing?.bufferBeforeMinutes ?? 15,
      bufferAfterMinutes:
        body.bufferAfterMinutes !== undefined
          ? Number(body.bufferAfterMinutes)
          : existing?.bufferAfterMinutes ?? 15,
      gracePeriodMinutes:
        body.gracePeriodMinutes !== undefined
          ? Number(body.gracePeriodMinutes)
          : existing?.gracePeriodMinutes ?? 15,
      taxRatePercent:
        body.taxRatePercent !== undefined
          ? Number(body.taxRatePercent)
          : existing?.taxRatePercent ?? 5.0,
      serviceChargePercent:
        body.serviceChargePercent !== undefined
          ? Number(body.serviceChargePercent)
          : existing?.serviceChargePercent ?? 5.0,
      currencySymbol: body.currencySymbol || existing?.currencySymbol || "₹",
    };

    let settings;
    if (existing) {
      settings = await prisma.cafeSetting.update({
        where: { id: existing.id },
        data,
      });
    } else {
      settings = await prisma.cafeSetting.create({
        data,
      });
    }

    return NextResponse.json({
      success: true,
      data: settings,
      message: "Settings saved successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save settings" },
      { status: 500 }
    );
  }
}
