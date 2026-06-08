import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helper";

// PUT /api/gateway-transactions/[id] - Verify/reject gateway transaction (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json(
        { error: "অ্যাডমিন অনুমতি আবশ্যক" },
        { status: 403 }
      );
    }

    const adminId = (session.user as { id: string }).id;
    const { id } = await params;
    const body = await request.json();
    const { status: newStatus, adminNote } = body;

    if (!newStatus || !["approved", "rejected"].includes(newStatus)) {
      return NextResponse.json(
        { error: "স্ট্যাটাস অবশ্যই 'approved' বা 'rejected' হতে হবে" },
        { status: 400 }
      );
    }

    const gatewayTransaction = await db.gatewayTransaction.findUnique({
      where: { id },
      include: { transaction: true, gateway: true },
    });

    if (!gatewayTransaction) {
      return NextResponse.json(
        { error: "গেটওয়ে লেনদেন পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    if (gatewayTransaction.status !== "pending") {
      return NextResponse.json(
        { error: "এই লেনদেন ইতিমধ্যে প্রক্রিয়াকৃত হয়েছে" },
        { status: 400 }
      );
    }

    // Update gateway transaction status
    const updatedGatewayTransaction = await db.gatewayTransaction.update({
      where: { id },
      data: {
        status: newStatus,
        adminNote: adminNote || null,
      },
    });

    if (newStatus === "approved") {
      // Update escrow transaction status to "paid"
      await db.transaction.update({
        where: { id: gatewayTransaction.transactionId },
        data: { status: "paid" },
      });

      // Notify both buyer and seller
      await db.notification.createMany({
        data: [
          {
            userId: gatewayTransaction.transaction.buyerId,
            transactionId: gatewayTransaction.transactionId,
            title: "পেমেন্ট অনুমোদিত হয়েছে",
            message: `লেনদেন "${gatewayTransaction.transaction.title}" এর পেমেন্ট অনুমোদিত হয়েছে`,
            type: "payment",
          },
          {
            userId: gatewayTransaction.transaction.sellerId,
            transactionId: gatewayTransaction.transactionId,
            title: "পেমেন্ট অনুমোদিত হয়েছে",
            message: `লেনদেন "${gatewayTransaction.transaction.title}" এর পেমেন্ট অনুমোদিত হয়েছে, কাজ শুরু করুন`,
            type: "payment",
          },
        ],
      });
    } else {
      // Rejected - change back to pending_payment
      await db.transaction.update({
        where: { id: gatewayTransaction.transactionId },
        data: { status: "pending_payment" },
      });

      // Notify buyer about rejection
      await db.notification.create({
        data: {
          userId: gatewayTransaction.transaction.buyerId,
          transactionId: gatewayTransaction.transactionId,
          title: "পেমেন্ট প্রত্যাখ্যাত হয়েছে",
          message: `লেনদেন "${gatewayTransaction.transaction.title}" এর পেমেন্ট প্রত্যাখ্যাত হয়েছে${
            adminNote ? `: ${adminNote}` : ""
          }`,
          type: "payment",
        },
      });
    }

    // Log admin action
    await db.adminLog.create({
      data: {
        userId: adminId,
        action:
          newStatus === "approved"
            ? "gateway_transaction_approved"
            : "gateway_transaction_rejected",
        details: `Gateway transaction ${id} for transaction "${gatewayTransaction.transaction.title}" via ${gatewayTransaction.gateway.name} ${newStatus}${adminNote ? `. Note: ${adminNote}` : ""}`,
      },
    });

    return NextResponse.json({
      gatewayTransaction: updatedGatewayTransaction,
      message:
        newStatus === "approved"
          ? "পেমেন্ট অনুমোদিত হয়েছে"
          : "পেমেন্ট প্রত্যাখ্যাত হয়েছে",
    });
  } catch (error) {
    console.error("Verify gateway transaction error:", error);
    return NextResponse.json(
      { error: "গেটওয়ে লেনদেন যাচাই করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}
