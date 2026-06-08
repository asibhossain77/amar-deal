import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helper";

// GET /api/gateway-transactions - List gateway transactions
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

    // Admin sees all transactions, regular users see only their own
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

    const transactions = await db.gatewayTransaction.findMany({
      where: whereClause,
      include: {
        gateway: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            accountType: true,
            accountNumber: true,
            accountName: true,
          },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
        transaction: {
          select: {
            id: true,
            title: true,
            amount: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("Get gateway transactions error:", error);
    return NextResponse.json(
      { error: "গেটওয়ে লেনদেন লোড করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}

// POST /api/gateway-transactions - Submit a gateway transaction (buyer only)
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
    const { transactionId, gatewayId, transactionRef, amount, screenshot, note } =
      body;

    // Validate required fields
    if (!transactionId || !gatewayId || !transactionRef || amount === undefined) {
      return NextResponse.json(
        {
          error: "লেনদেন আইডি, গেটওয়ে আইডি, ট্রানজেকশন রেফারেন্স এবং পরিমাণ আবশ্যক",
        },
        { status: 400 }
      );
    }

    // Check the escrow transaction exists and user is the buyer
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

    // Check gateway exists and is active
    const gateway = await db.paymentGateway.findUnique({
      where: { id: gatewayId },
    });

    if (!gateway) {
      return NextResponse.json(
        { error: "পেমেন্ট গেটওয়ে পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    if (!gateway.isActive) {
      return NextResponse.json(
        { error: "এই পেমেন্ট গেটওয়ে বর্তমানে নিষ্ক্রিয় আছে" },
        { status: 400 }
      );
    }

    // Check amount is within gateway minDeposit/maxDeposit limits
    if (amount < gateway.minDeposit) {
      return NextResponse.json(
        {
          error: `সর্বনিম্ন জমার পরিমাণ ${gateway.minDeposit} টাকা`,
        },
        { status: 400 }
      );
    }

    if (amount > gateway.maxDeposit) {
      return NextResponse.json(
        {
          error: `সর্বোচ্চ জমার পরিমাণ ${gateway.maxDeposit} টাকা`,
        },
        { status: 400 }
      );
    }

    // Check no existing pending payment for this transaction
    const existingPending = await db.gatewayTransaction.findFirst({
      where: {
        transactionId,
        status: "pending",
      },
    });

    if (existingPending) {
      return NextResponse.json(
        { error: "এই লেনদেনে ইতিমধ্যে একটি অপেক্ষমান পেমেন্ট আছে" },
        { status: 400 }
      );
    }

    // Create the gateway transaction
    const gatewayTransaction = await db.gatewayTransaction.create({
      data: {
        transactionId,
        gatewayId,
        userId,
        transactionRef,
        amount,
        screenshot: screenshot || null,
        note: note || null,
        status: "pending",
      },
    });

    // Update the escrow transaction status to pending_verification
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
        message: `লেনদেন "${transaction.title}" এর জন্য ${gateway.name} এর মাধ্যমে পেমেন্ট জমা দেওয়া হয়েছে, যাচাইয়ের অপেক্ষায় আছে`,
        type: "payment",
      },
    });

    return NextResponse.json(
      {
        gatewayTransaction,
        message: "পেমেন্ট সফলভাবে জমা হয়েছে",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Submit gateway transaction error:", error);
    return NextResponse.json(
      { error: "পেমেন্ট জমা দিতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}
