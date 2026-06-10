import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helper";
import { db } from "@/lib/db";

// GET /api/account/reputation - Get detailed reputation data
export async function GET() {
  try {
    const session = await requireAuth();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = (session.user as { id: string }).id;

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        buyerRating: true,
        sellerRating: true,
        buyerReviewCount: true,
        sellerReviewCount: true,
        totalReviews: true,
        completedDeals: true,
        successfulTransactions: true,
        trustScore: true,
        disputeRate: true,
        isVerified: true,
        verificationStatus: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get total transactions and disputed count from Transaction table
    const [buyerTxCount, sellerTxCount, disputedTxCount] = await Promise.all([
      db.transaction.count({ where: { buyerId: userId } }),
      db.transaction.count({ where: { sellerId: userId } }),
      db.transaction.count({
        where: {
          OR: [{ buyerId: userId }, { sellerId: userId }],
          status: "disputed",
        },
      }),
    ]);

    const totalTransactions = buyerTxCount + sellerTxCount;

    const reputation = {
      buyerRating: user.buyerRating,
      sellerRating: user.sellerRating,
      buyerReviewCount: user.buyerReviewCount,
      sellerReviewCount: user.sellerReviewCount,
      totalReviews: user.totalReviews,
      completedDeals: user.completedDeals,
      successfulTransactions: user.successfulTransactions,
      trustScore: user.trustScore,
      disputeRate: user.disputeRate,
      isVerified: user.isVerified,
      verificationStatus: user.verificationStatus,
      totalTransactions,
      disputedCount: disputedTxCount,
    };

    return NextResponse.json({ reputation });
  } catch (error) {
    console.error("Get reputation error:", error);
    return NextResponse.json(
      { error: "Failed to load reputation data" },
      { status: 500 }
    );
  }
}
