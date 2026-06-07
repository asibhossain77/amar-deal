import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requireAdmin } from "@/lib/auth-helper";

// GET /api/payments - List payments for current user's transactions (admin sees all)
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

    // Admin can see all payments, regular users see only their transactions' payments
    if (userRole !== "admin") {
      const userTransactions = await db.transaction.findMany({
        where: {
          OR: [{ buyerId: userId }, { sellerId: userId }],
        },
        select: { id: true },
      });

      const transactionIds = userTransactions.map((t) => t.id);
      whereClause.transactionId = { in: transactionIds };
    }

    const payments = await db.payment.findMany({
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
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ payments });
  } catch (error) {
    console.error("Get payments error:", error);
    return NextResponse.json(
      { error: "পেমেন্ট লোড করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}

// POST /api/payments - Submit payment for a transaction (buyer only)
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
    const { transactionId, transactionRef, paymentMethod, screenshot } = body;

    if (!transactionId || !transactionRef || !paymentMethod) {
      return NextResponse.json(
        {
          error: "লেনদেন আইডি, ট্রানজেকশন রেফারেন্স এবং পেমেন্ট মেথড আবশ্যক",
        },
        { status: 400 }
      );
    }

    // Normalize payment method values
    const paymentMethodMap: Record<string, string> = {
      'bkash': 'bKash',
      'nagad': 'Nagad',
      'rocket': 'Rocket',
      'bank_transfer': 'Bank Transfer',
      'bKash': 'bKash',
      'Nagad': 'Nagad',
      'Rocket': 'Rocket',
      'Bank Transfer': 'Bank Transfer',
    };
    const normalizedMethod = paymentMethodMap[paymentMethod];
    if (!normalizedMethod) {
      return NextResponse.json(
        {
          error: `পেমেন্ট মেথড অবশ্যই bKash, Nagad, Rocket, Bank Transfer এর মধ্যে হতে হবে`,
        },
        { status: 400 }
      );
    }

    // Check transaction exists and user is the buyer
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
        { error: "শুধুমাত্র ক্রেতা পেমেন্ট জমা দিতে পারেন" },
        { status: 403 }
      );
    }

    if (transaction.status !== "pending_payment") {
      return NextResponse.json(
        { error: "এই লেনদেনে পেমেন্ট জমা দেওয়া সম্ভব নয়" },
        { status: 400 }
      );
    }

    // Check if there's already a pending payment for this transaction
    const existingPendingPayment = await db.payment.findFirst({
      where: {
        transactionId,
        status: "pending",
      },
    });

    if (existingPendingPayment) {
      return NextResponse.json(
        { error: "এই লেনদেনে ইতিমধ্যে একটি অপেক্ষমান পেমেন্ট আছে" },
        { status: 400 }
      );
    }

    // Create payment and update transaction status
    const payment = await db.payment.create({
      data: {
        transactionId,
        userId,
        transactionRef,
        paymentMethod: normalizedMethod,
        screenshot: screenshot || null,
        status: "pending",
      },
    });

    // Update transaction status to pending_verification
    await db.transaction.update({
      where: { id: transactionId },
      data: { status: "pending_verification" },
    });

    // Create notification for seller
    await db.notification.create({
      data: {
        userId: transaction.sellerId,
        transactionId,
        title: "পেমেন্ট জমা দেওয়া হয়েছে",
        message: `লেনদেন "${transaction.title}" এর জন্য পেমেন্ট জমা দেওয়া হয়েছে, যাচাইয়ের অপেক্ষায় আছে`,
        type: "payment",
      },
    });

    return NextResponse.json(
      { payment, message: "পেমেন্ট সফলভাবে জমা দেওয়া হয়েছে" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Submit payment error:", error);
    return NextResponse.json(
      { error: "পেমেন্ট জমা দিতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}
