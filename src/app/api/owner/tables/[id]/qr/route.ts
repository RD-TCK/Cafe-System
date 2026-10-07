import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const table = await prisma.table.findUnique({
      where: { id },
    });

    if (!table) {
      return NextResponse.json(
        { success: false, error: "Table not found" },
        { status: 404 }
      );
    }

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const targetUrl = `${protocol}://${host}/table/${table.id}?secret=${table.qrSecret}`;

    // Generate QR Code data URL with fallback
    let qrDataUrl = "";
    try {
      qrDataUrl = await QRCode.toDataURL(targetUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: "#1c1917",
          light: "#fafaf9",
        },
      });
    } catch (e) {
      qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(targetUrl)}`;
    }

    return NextResponse.json({
      success: true,
      data: {
        tableNumber: table.tableNumber,
        tableName: table.name,
        targetUrl,
        qrDataUrl,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate QR" },
      { status: 500 }
    );
  }
}
