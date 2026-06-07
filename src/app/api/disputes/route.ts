import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helper";

// GET /api/disputes - List disputes for current user
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) {
      return NextResponse.json(
        { error: "প্রমাণীকরণ আবশ্যক" },
        { status: 401 }
      );
    }

    const userId = (session.user as { id: string }).id;
    const userRole = (session.user as { role: string }).role;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;

    const whereClause: any = {};

    if (status) {
      whereClause.status = status;
    }

    // Admin sees all disputes, regular users see only their own
    if (userRole !== "admin") {
      whereClause.OR = [{ buyerId: userId }, { sellerId: userId }];
    }

    const disputes = await db.dispute.findMany({
      where: whereClause,
      include: {
        transaction: {
          select: {
            id: true,
            title: true,
            amount: true,
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
            user: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ disputes });
  } catch (error) {
    console.error("Get disputes error:", error);
    return NextResponse.json(
      { error: "বিরোধ লোড করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}

// POST /api/disputes - Open a dispute (buyer only)
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) {
      return NextResponse.json(
        { error: "প্রমাণীকরণ আবশ্যক" },
        { status: 401 }
      );
    }

    const userId = (session.user as { id: string }).id;
    const body = await request.json();
    const { transactionId, reason } = body;

    if (!transactionId || !reason) {
      return NextResponse.json(
        { error: "লেনদেন আইডি এবং কারণ আবশ্যক" },
        { status: 400 }
      );
    }

    const transaction = await db.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "লেনদেন পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    if (transaction.buyerId !== userId) {
      return NextResponse.json(
        { error: "শুধুমাত্র ক্রেতা বিরোধ খুলতে পারেন" },
        { status: 403 }
      );
    }

    // Can only dispute if transaction is in progress
    const disputeableStatuses = [
      "paid",
      "work_in_progress",
      "delivered",
      "pending_verification",
    ];
    if (!disputeableStatuses.includes(transaction.status)) {
      return NextResponse.json(
        { error: "এই লেনদেনে বিরোধ খোলা সম্ভব নয়" },
        { status: 400 }
      );
    }

    // Check if there's already an open dispute for this transaction
    const existingDispute = await db.dispute.findFirst({
      where: {
        transactionId,
        status: { in: ["open", "under_review"] },
      },
    });

    if (existingDispute) {
      return NextResponse.json(
        { error: "এই লেনদেনে ইতিমধ্যে একটি সক্রিয় বিরোধ আছে" },
        { status: 400 }
      );
    }

    // Create dispute and update transaction status
    const dispute = await db.dispute.create({
      data: {
        transactionId,
        buyerId: transaction.buyerId,
        sellerId: transaction.sellerId,
        reason,
        status: "open",
      },
      include: {
        transaction: {
          select: {
            id: true,
            title: true,
            amount: true,
          },
        },
        buyer: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        seller: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    // Update transaction status to disputed
    await db.transaction.update({
      where: { id: transactionId },
      data: { status: "disputed" },
    });

    // Create notifications
    await db.notification.createMany({
      data: [
        {
          userId: transaction.sellerId,
          transactionId,
          title: "বিরোধ খোলা হয়েছে",
          message: `লেনদেন "${transaction.title}" এ একটি বিরোধ খোলা হয়েছে`,
          type: "dispute",
        },
        {
          userId: transaction.buyerId,
          transactionId,
          title: "বিরোধ খোলা হয়েছে",
          message: `আপনি লেনদেন "${transaction.title}" এ একটি বিরোধ খুলেছেন`,
          type: "dispute",
        },
      ],
    });

    return NextResponse.json(
      { dispute, message: "বিরোধ সফলভাবে খোলা হয়েছে" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create dispute error:", error);
    return NextResponse.json(
      { error: "বিরোধ খুলতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}
