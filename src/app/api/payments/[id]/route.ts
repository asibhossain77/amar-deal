import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helper";

// PUT /api/payments/[id] - Verify/reject payment (admin only)
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

    const payment = await db.payment.findUnique({
      where: { id },
      include: { transaction: true },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "পেমেন্ট পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    if (payment.status !== "pending") {
      return NextResponse.json(
        { error: "এই পেমেন্ট ইতিমধ্যে প্রক্রিয়াকৃত হয়েছে" },
        { status: 400 }
      );
    }

    // Update payment status
    const updatedPayment = await db.payment.update({
      where: { id },
      data: {
        status: newStatus,
        adminNote: adminNote || null,
      },
    });

    // Update transaction status based on payment result
    if (newStatus === "approved") {
      await db.transaction.update({
        where: { id: payment.transactionId },
        data: { status: "paid" },
      });

      // Notify both buyer and seller
      await db.notification.createMany({
        data: [
          {
            userId: payment.transaction.buyerId,
            transactionId: payment.transactionId,
            title: "পেমেন্ট অনুমোদিত হয়েছে",
            message: `লেনদেন "${payment.transaction.title}" এর পেমেন্ট অনুমোদিত হয়েছে`,
            type: "payment",
          },
          {
            userId: payment.transaction.sellerId,
            transactionId: payment.transactionId,
            title: "পেমেন্ট অনুমোদিত হয়েছে",
            message: `লেনদেন "${payment.transaction.title}" এর পেমেন্ট অনুমোদিত হয়েছে, কাজ শুরু করুন`,
            type: "payment",
          },
        ],
      });
    } else {
      // Rejected - change back to pending_payment
      await db.transaction.update({
        where: { id: payment.transactionId },
        data: { status: "pending_payment" },
      });

      // Notify buyer about rejection
      await db.notification.create({
        data: {
          userId: payment.transaction.buyerId,
          transactionId: payment.transactionId,
          title: "পেমেন্ট প্রত্যাখ্যাত হয়েছে",
          message: `লেনদেন "${payment.transaction.title}" এর পেমেন্ট প্রত্যাখ্যাত হয়েছে${
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
        action: newStatus === "approved" ? "payment_approved" : "payment_rejected",
        details: `Payment ${id} for transaction "${payment.transaction.title}" ${newStatus}${adminNote ? `. Note: ${adminNote}` : ""}`,
      },
    });

    return NextResponse.json({
      payment: updatedPayment,
      message:
        newStatus === "approved"
          ? "পেমেন্ট অনুমোদিত হয়েছে"
          : "পেমেন্ট প্রত্যাখ্যাত হয়েছে",
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    return NextResponse.json(
      { error: "পেমেন্ট যাচাই করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}
