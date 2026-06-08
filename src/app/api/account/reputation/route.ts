import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helper";
import { db } from "@/lib/db";

// GET /api/account/reputation - Get detailed reputation data
export async function GET() {
  try {
    const session = await requireAuth();
    if (!session) {
      return NextResponse.json(
        { error: "লগইন আবশ্যক" },
        { status: 401 }
      );
    }

    const userId = (session.user as { id: string }).id;

    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "ব্যবহারকারী পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    // Get transaction counts by status
    const buyerTransactions = await db.transaction.findMany({
      where: { buyerId: userId },
      select: { status: true },
    });

    const sellerTransactions = await db.transaction.findMany({
      where: { sellerId: userId },
      select: { status: true },
    });

    const allTransactions = [...buyerTransactions, ...sellerTransactions];
    const totalTransactions = allTransactions.length;

    // Count by status
    const completedCount = allTransactions.filter(
      (t) => t.status === "completed"
    ).length;
    const disputedCount = allTransactions.filter(
      (t) => t.status === "disputed"
    ).length;
    const cancelledCount = allTransactions.filter(
      (t) => t.status === "cancelled"
    ).length;
    const pendingCount = allTransactions.filter(
      (t) => t.status === "pending_payment" || t.status === "pending_verification"
    ).length;
    const inProgressCount = allTransactions.filter(
      (t) =>
        t.status === "paid" ||
        t.status === "work_in_progress" ||
        t.status === "delivered"
    ).length;

    // Calculate dispute rate
    const disputeRate =
      totalTransactions > 0
        ? (disputedCount / totalTransactions) * 100
        : 0;

    // Calculate trust score: weighted average based on ratings, deals, disputes
    const ratingWeight = 0.4;
    const dealsWeight = 0.3;
    const disputesWeight = 0.3;

    const avgRating =
      user.totalReviews > 0
        ? (user.buyerRating + user.sellerRating) / 2
        : 0;
    const ratingScore = Math.min((avgRating / 5) * 100, 100);
    const dealsScore = Math.min((user.completedDeals / 50) * 100, 100);
    const disputesScore = Math.max(100 - disputeRate * 10, 0);

    const trustScore =
      ratingScore * ratingWeight +
      dealsScore * dealsWeight +
      disputesScore * disputesWeight;

    // Calculate member since badge
    const accountAgeMs = Date.now() - user.createdAt.getTime();
    const accountAgeDays = Math.floor(accountAgeMs / (1000 * 60 * 60 * 24));

    let memberSinceBadge: string;
    if (accountAgeDays < 30) {
      memberSinceBadge = "new";
    } else if (accountAgeDays < 90) {
      memberSinceBadge = "beginner";
    } else if (accountAgeDays < 180) {
      memberSinceBadge = "intermediate";
    } else if (accountAgeDays < 365) {
      memberSinceBadge = "experienced";
    } else {
      memberSinceBadge = "veteran";
    }

    const reputation = {
      buyerRating: user.buyerRating,
      sellerRating: user.sellerRating,
      totalReviews: user.totalReviews,
      completedDeals: user.completedDeals,
      successfulTransactions: user.successfulTransactions,
      trustScore: Math.round(trustScore * 100) / 100,
      disputeRate: Math.round(disputeRate * 100) / 100,
      isVerified: user.isVerified,
      memberSinceBadge,
      accountAgeDays,
      transactions: {
        total: totalTransactions,
        completed: completedCount,
        disputed: disputedCount,
        cancelled: cancelledCount,
        pending: pendingCount,
        inProgress: inProgressCount,
      },
    };

    return NextResponse.json({ reputation });
  } catch (error) {
    console.error("Get reputation error:", error);
    return NextResponse.json(
      { error: "রেপুটেশন তথ্য লোড করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}
