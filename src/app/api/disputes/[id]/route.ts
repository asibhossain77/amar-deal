import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requireAdmin } from "@/lib/auth-helper";

// GET /api/disputes/[id] - Get dispute with messages
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

    const dispute = await db.dispute.findUnique({
      where: { id },
      include: {
        transaction: {
          select: {
            id: true,
            title: true,
            description: true,
            amount: true,
            terms: true,
            status: true,
          },
        },
        buyer: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        seller: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        messages: {
          include: {
            user: { select: { id: true, name: true, avatar: true, role: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!dispute) {
      return NextResponse.json(
        { error: "বিরোধ পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    // Only buyer, seller, or admin can view
    if (
      dispute.buyerId !== userId &&
      dispute.sellerId !== userId &&
      userRole !== "admin"
    ) {
      return NextResponse.json(
        { error: "আপনার এই বিরোধ দেখার অনুমতি নেই" },
        { status: 403 }
      );
    }

    return NextResponse.json({ dispute });
  } catch (error) {
    console.error("Get dispute error:", error);
    return NextResponse.json(
      { error: "বিরোধ লোড করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}

// POST /api/disputes/[id] - Add message to dispute
export async function POST(
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

    const dispute = await db.dispute.findUnique({
      where: { id },
    });

    if (!dispute) {
      return NextResponse.json(
        { error: "বিরোধ পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    // Only buyer, seller, or admin can add messages
    if (
      dispute.buyerId !== userId &&
      dispute.sellerId !== userId &&
      userRole !== "admin"
    ) {
      return NextResponse.json(
        { error: "আপনার এই বিরোধে বার্তা যোগ করার অনুমতি নেই" },
        { status: 403 }
      );
    }

    // Only allow messages on open or under_review disputes
    if (!["open", "under_review"].includes(dispute.status)) {
      return NextResponse.json(
        { error: "এই বিরোধ ইতিমধ্যে সমাধান হয়েছে" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { message } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: "বার্তা আবশ্যক" },
        { status: 400 }
      );
    }

    const disputeMessage = await db.disputeMessage.create({
      data: {
        disputeId: id,
        userId,
        message: message.trim(),
      },
      include: {
        user: { select: { id: true, name: true, avatar: true, role: true } },
      },
    });

    // If admin adds message, change status to under_review
    if (userRole === "admin" && dispute.status === "open") {
      await db.dispute.update({
        where: { id },
        data: { status: "under_review" },
      });
    }

    return NextResponse.json({
      message: disputeMessage,
    });
  } catch (error) {
    console.error("Add dispute message error:", error);
    return NextResponse.json(
      { error: "বার্তা যোগ করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}

// PUT /api/disputes/[id] - Resolve dispute (admin only)
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
    const { outcome, resolution } = body;

    const validOutcomes = [
      "resolved_buyer",
      "resolved_seller",
      "resolved_cancelled",
    ];

    if (!outcome || !validOutcomes.includes(outcome)) {
      return NextResponse.json(
        {
          error:
            "ফলাফল অবশ্যই 'resolved_buyer', 'resolved_seller', বা 'resolved_cancelled' হতে হবে",
        },
        { status: 400 }
      );
    }

    if (!resolution || resolution.trim().length === 0) {
      return NextResponse.json(
        { error: "সমাধানের বিবরণ আবশ্যক" },
        { status: 400 }
      );
    }

    const dispute = await db.dispute.findUnique({
      where: { id },
      include: { transaction: true },
    });

    if (!dispute) {
      return NextResponse.json(
        { error: "বিরোধ পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    if (!["open", "under_review"].includes(dispute.status)) {
      return NextResponse.json(
        { error: "এই বিরোধ ইতিমধ্যে সমাধান হয়েছে" },
        { status: 400 }
      );
    }

    // Update dispute
    const updatedDispute = await db.dispute.update({
      where: { id },
      data: {
        status: outcome,
        resolution: resolution.trim(),
      },
    });

    // Update transaction status based on outcome
    let newTransactionStatus = "cancelled";
    if (outcome === "resolved_buyer") {
      // Buyer wins - refund, so cancel the transaction
      newTransactionStatus = "cancelled";
    } else if (outcome === "resolved_seller") {
      // Seller wins - complete the transaction
      newTransactionStatus = "completed";
    } else {
      // Cancelled - both parties
      newTransactionStatus = "cancelled";
    }

    await db.transaction.update({
      where: { id: dispute.transactionId },
      data: { status: newTransactionStatus },
    });

    // Create notifications for both parties
    const outcomeMessages: Record<string, string> = {
      resolved_buyer: "ক্রেতার পক্ষে সমাধান হয়েছে",
      resolved_seller: "বিক্রেতার পক্ষে সমাধান হয়েছে",
      resolved_cancelled: "লেনদেন বাতিল করে সমাধান হয়েছে",
    };

    await db.notification.createMany({
      data: [
        {
          userId: dispute.buyerId,
          transactionId: dispute.transactionId,
          title: "বিরোধ সমাধান হয়েছে",
          message: `লেনদেন "${dispute.transaction.title}" এর বিরোধ ${outcomeMessages[outcome]}`,
          type: "dispute",
        },
        {
          userId: dispute.sellerId,
          transactionId: dispute.transactionId,
          title: "বিরোধ সমাধান হয়েছে",
          message: `লেনদেন "${dispute.transaction.title}" এর বিরোধ ${outcomeMessages[outcome]}`,
          type: "dispute",
        },
      ],
    });

    // Log admin action
    await db.adminLog.create({
      data: {
        userId: adminId,
        action: "dispute_resolved",
        details: `Dispute ${id} for transaction "${dispute.transaction.title}" resolved as ${outcome}. Resolution: ${resolution}`,
      },
    });

    return NextResponse.json({
      dispute: updatedDispute,
      message: "বিরোধ সফলভাবে সমাধান হয়েছে",
    });
  } catch (error) {
    console.error("Resolve dispute error:", error);
    return NextResponse.json(
      { error: "বিরোধ সমাধান করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}
