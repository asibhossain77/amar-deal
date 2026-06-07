import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helper";

// GET /api/transactions/[id] - Get transaction details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    if (!session) {
      return NextResponse.json(
        { error: "প্রমাণীকরণ আবশ্যক" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const userId = (session.user as { id: string }).id;
    const userRole = (session.user as { role: string }).role;

    const transaction = await db.transaction.findUnique({
      where: { id },
      include: {
        buyer: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        seller: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        payments: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        disputes: {
          include: {
            buyer: { select: { id: true, name: true } },
            seller: { select: { id: true, name: true } },
            messages: {
              include: {
                user: { select: { id: true, name: true } },
              },
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "লেনদেন পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    // Only buyer, seller, or admin can view
    if (
      transaction.buyerId !== userId &&
      transaction.sellerId !== userId &&
      userRole !== "admin"
    ) {
      return NextResponse.json(
        { error: "আপনার এই লেনদেন দেখার অনুমতি নেই" },
        { status: 403 }
      );
    }

    return NextResponse.json({ transaction });
  } catch (error) {
    console.error("Get transaction error:", error);
    return NextResponse.json(
      { error: "লেনদেন লোড করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}

// PUT /api/transactions/[id] - Update transaction status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    if (!session) {
      return NextResponse.json(
        { error: "প্রমাণীকরণ আবশ্যক" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const userId = (session.user as { id: string }).id;
    const body = await request.json();
    const { status: newStatus } = body;

    if (!newStatus) {
      return NextResponse.json(
        { error: "স্ট্যাটাস আবশ্যক" },
        { status: 400 }
      );
    }

    const transaction = await db.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "লেনদেন পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    const isBuyer = transaction.buyerId === userId;
    const isSeller = transaction.sellerId === userId;

    if (!isBuyer && !isSeller) {
      return NextResponse.json(
        { error: "আপনার এই লেনদেন আপডেট করার অনুমতি নেই" },
        { status: 403 }
      );
    }

    const currentStatus = transaction.status;
    let isValidTransition = false;
    let notificationTargetIds: string[] = [];
    let notificationTitle = "";
    let notificationMessage = "";

    // Status workflow validation
    switch (newStatus) {
      case "work_in_progress":
        // Buyer can mark as work_in_progress when status is "paid"
        if (isBuyer && currentStatus === "paid") {
          isValidTransition = true;
          notificationTargetIds = [transaction.sellerId];
          notificationTitle = "কাজ শুরু হয়েছে";
          notificationMessage = `লেনদেন "${transaction.title}" এর কাজ শুরু হয়েছে`;
        }
        break;

      case "delivered":
        // Seller can mark as delivered when status is "work_in_progress"
        if (isSeller && currentStatus === "work_in_progress") {
          isValidTransition = true;
          notificationTargetIds = [transaction.buyerId];
          notificationTitle = "কাজ সরবরাহ করা হয়েছে";
          notificationMessage = `লেনদেন "${transaction.title}" এর কাজ সরবরাহ করা হয়েছে, অনুগ্রহ করে যাচাই করুন`;
        }
        break;

      case "completed":
        // Buyer can mark as completed when status is "delivered"
        if (isBuyer && currentStatus === "delivered") {
          isValidTransition = true;
          notificationTargetIds = [transaction.sellerId];
          notificationTitle = "লেনদেন সম্পন্ন হয়েছে";
          notificationMessage = `লেনদেন "${transaction.title}" সফলভাবে সম্পন্ন হয়েছে`;
        }
        break;

      case "cancelled":
        // Both can cancel when status is "pending_payment"
        if ((isBuyer || isSeller) && currentStatus === "pending_payment") {
          isValidTransition = true;
          notificationTargetIds = isBuyer
            ? [transaction.sellerId]
            : [transaction.buyerId];
          notificationTitle = "লেনদেন বাতিল হয়েছে";
          notificationMessage = `লেনদেন "${transaction.title}" বাতিল করা হয়েছে`;
        }
        break;

      default:
        isValidTransition = false;
    }

    if (!isValidTransition) {
      return NextResponse.json(
        {
          error: `স্ট্যাটাস "${currentStatus}" থেকে "${newStatus}" পরিবর্তন করা সম্ভব নয়`,
        },
        { status: 400 }
      );
    }

    // Update transaction status
    const updatedTransaction = await db.transaction.update({
      where: { id },
      data: { status: newStatus },
      include: {
        buyer: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        seller: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    // Create notifications for relevant parties
    for (const targetId of notificationTargetIds) {
      await db.notification.create({
        data: {
          userId: targetId,
          transactionId: id,
          title: notificationTitle,
          message: notificationMessage,
          type: "transaction",
        },
      });
    }

    return NextResponse.json({
      transaction: updatedTransaction,
      message: "লেনদেন স্ট্যাটাস সফলভাবে আপডেট হয়েছে",
    });
  } catch (error) {
    console.error("Update transaction error:", error);
    return NextResponse.json(
      { error: "লেনদেন আপডেট করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}
