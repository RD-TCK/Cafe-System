import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isOwnerAuthenticated } from "@/lib/auth";
import { recalculateVisitBill } from "@/lib/billingEngine";

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
    const { status, cancellationReason, cancelItemId } = body;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Cancel a specific item inside the order
    if (cancelItemId) {
      await prisma.$transaction(async (tx) => {
        await tx.orderItem.update({
          where: { id: cancelItemId },
          data: { status: "CANCELLED" },
        });

        // Recalculate bill for visit
        await recalculateVisitBill(order.visitId, tx);
      });

      const updatedOrder = await prisma.order.findUnique({
        where: { id },
        include: { items: true, table: true },
      });

      return NextResponse.json({
        success: true,
        data: updatedOrder,
        message: "Item cancelled and visit bill recalculated.",
      });
    }

    // Update order level status
    const updateData: any = {};
    if (status) {
      updateData.status = status;
      if (status === "ACCEPTED" && !order.acceptedAt) {
        updateData.acceptedAt = new Date();
      } else if (status === "PREPARING" && !order.preparingAt) {
        updateData.preparingAt = new Date();
      } else if (status === "SERVED" && !order.servedAt) {
        updateData.servedAt = new Date();
      } else if (status === "CANCELLED") {
        updateData.cancelledAt = new Date();
        updateData.cancellationReason = cancellationReason || "Cancelled by kitchen staff";
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const ord = await tx.order.update({
        where: { id },
        data: updateData,
        include: { items: true, table: true },
      });

      // If whole order cancelled, recalculate bill
      if (status === "CANCELLED") {
        await recalculateVisitBill(order.visitId, tx);
      }

      return ord;
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Order ${updated.orderNumber} status updated to ${updated.status}.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update order" },
      { status: 500 }
    );
  }
}
