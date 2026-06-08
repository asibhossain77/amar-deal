import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helper";

// GET /api/transactions - List transactions for current user
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

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status") || undefined;
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (status) {
      whereClause.status = status;
    }

    // Admin sees all transactions, regular users see only their own
    if (userRole !== "admin") {
      whereClause.OR = [{ buyerId: userId }, { sellerId: userId }];
    }

    const [transactions, total] = await Promise.all([
      db.transaction.findMany({
        where: whereClause,
        include: {
          buyer: {
            select: { id: true, name: true, email: true, avatar: true, isVerified: true, username: true },
          },
          seller: {
            select: { id: true, name: true, email: true, avatar: true, isVerified: true, username: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.transaction.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get transactions error:", error);
    return NextResponse.json(
      { error: "লেনদেন লোড করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}

// POST /api/transactions - Create a new transaction
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
    const {
      title,
      description,
      amount,
      terms,
      sellerId,
      buyerId,
      counterpartyEmail,
      userRole,
    } = body;

    let effectiveBuyerId = buyerId || userId;
    let effectiveSellerId = sellerId;

    // Support email-based counterparty resolution
    if (counterpartyEmail && userRole) {
      const counterparty = await db.user.findUnique({
        where: { email: counterpartyEmail },
      });

      if (!counterparty) {
        return NextResponse.json(
          { error: "এই ইমেইলে কোনো ব্যবহারকারী পাওয়া যায়নি" },
          { status: 404 }
        );
      }

      if (!counterparty.isActive) {
        return NextResponse.json(
          { error: "প্রতিপক্ষের অ্যাকাউন্ট নিষ্ক্রিয় আছে" },
          { status: 400 }
        );
      }

      if (counterparty.id === userId) {
        return NextResponse.json(
          { error: "আপনি নিজের সাথে লেনদেন করতে পারবেন না" },
          { status: 400 }
        );
      }

      if (userRole === "buyer") {
        // Current user is buyer, counterparty is seller
        effectiveBuyerId = userId;
        effectiveSellerId = counterparty.id;
      } else if (userRole === "seller") {
        // Current user is seller, counterparty is buyer
        effectiveSellerId = userId;
        effectiveBuyerId = counterparty.id;
      }
    }

    if (!title || !description || !amount || !terms || !effectiveSellerId) {
      return NextResponse.json(
        {
          error:
            "শিরোনাম, বিবরণ, পরিমাণ, শর্তাবলী এবং বিক্রেতা আইডি আবশ্যক",
        },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: "পরিমাণ অবশ্যই ধনাত্মক হতে হবে" },
        { status: 400 }
      );
    }

    // Validate buyer !== seller
    if (effectiveBuyerId === effectiveSellerId) {
      return NextResponse.json(
        { error: "ক্রেতা এবং বিক্রেতা একই হতে পারবে না" },
        { status: 400 }
      );
    }

    // Validate that both buyer and seller exist
    const [buyerExists, sellerExists] = await Promise.all([
      db.user.findUnique({ where: { id: effectiveBuyerId } }),
      db.user.findUnique({ where: { id: effectiveSellerId } }),
    ]);

    if (!buyerExists) {
      return NextResponse.json(
        { error: "ক্রেতা পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    if (!sellerExists) {
      return NextResponse.json(
        { error: "বিক্রেতা পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    if (!sellerExists.isActive) {
      return NextResponse.json(
        { error: "বিক্রেতা অ্যাকাউন্ট নিষ্ক্রিয় আছে" },
        { status: 400 }
      );
    }

    // Create transaction
    const transaction = await db.transaction.create({
      data: {
        title,
        description,
        amount,
        terms,
        buyerId: effectiveBuyerId,
        sellerId: effectiveSellerId,
        status: "pending_payment",
      },
      include: {
        buyer: {
          select: { id: true, name: true, email: true, avatar: true, isVerified: true, username: true },
        },
        seller: {
          select: { id: true, name: true, email: true, avatar: true, isVerified: true, username: true },
        },
      },
    });

    // Create notification for the other party
    const notificationTargetId =
      effectiveBuyerId === userId ? effectiveSellerId : effectiveBuyerId;
    const currentUser = buyerExists.id === userId ? buyerExists : sellerExists;
    await db.notification.create({
      data: {
        userId: notificationTargetId,
        transactionId: transaction.id,
        title: "নতুন লেনদেন তৈরি হয়েছে",
        message: `${currentUser.name} একটি নতুন লেনদেন তৈরি করেছেন: "${title}"`,
        type: "transaction",
      },
    });

    return NextResponse.json(
      { transaction, message: "লেনদেন সফলভাবে তৈরি হয়েছে" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create transaction error:", error);
    return NextResponse.json(
      { error: "লেনদেন তৈরি করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}
