import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helper";

// GET /api/users/[id]/public-profile - Get public profile data for any user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get the user (privacy-safe: exclude password, email, phone)
    const user = await db.user.findUnique({
      where: { id },
      include: {
        subscriptions: {
          where: { status: "active" },
          include: { plan: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "ব্যবহারকারী পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "এই অ্যাকাউন্টটি নিষ্ক্রিয় করা হয়েছে" },
        { status: 404 }
      );
    }

    // Get transaction statistics
    const buyerTransactions = await db.transaction.findMany({
      where: { buyerId: id },
      select: { status: true, createdAt: true },
    });

    const sellerTransactions = await db.transaction.findMany({
      where: { sellerId: id },
      select: { status: true, createdAt: true },
    });

    const allTransactions = [...buyerTransactions, ...sellerTransactions];
    const totalTransactions = allTransactions.length;
    const completedCount = allTransactions.filter((t) => t.status === "completed").length;
    const disputedCount = allTransactions.filter((t) => t.status === "disputed").length;
    const inProgressCount = allTransactions.filter((t) =>
      ["paid", "work_in_progress", "delivered"].includes(t.status)
    ).length;

    // Transaction success rate
    const successRate = totalTransactions > 0
      ? Math.round((completedCount / totalTransactions) * 100)
      : 0;

    // Calculate trust score
    const avgRating = user.totalReviews > 0
      ? (user.buyerRating + user.sellerRating) / 2
      : 0;
    const ratingScore = Math.min((avgRating / 5) * 100, 100);
    const dealsScore = Math.min((user.completedDeals / 50) * 100, 100);
    const disputeRate = totalTransactions > 0 ? (disputedCount / totalTransactions) * 100 : 0;
    const disputesScore = Math.max(100 - disputeRate * 10, 0);
    const trustScore =
      ratingScore * 0.4 + dealsScore * 0.3 + disputesScore * 0.3;

    // Get last transaction date as last active approximation
    const lastTransactionDate = allTransactions.length > 0
      ? allTransactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt
      : user.lastActive;

    // Member since badge
    const accountAgeMs = Date.now() - user.createdAt.getTime();
    const accountAgeDays = Math.floor(accountAgeMs / (1000 * 60 * 60 * 24));

    let memberSinceBadge: string;
    if (accountAgeDays < 30) memberSinceBadge = "new";
    else if (accountAgeDays < 90) memberSinceBadge = "beginner";
    else if (accountAgeDays < 180) memberSinceBadge = "intermediate";
    else if (accountAgeDays < 365) memberSinceBadge = "experienced";
    else memberSinceBadge = "veteran";

    // Determine account type
    const isBuyer = buyerTransactions.length > 0;
    const isSeller = sellerTransactions.length > 0;
    const effectiveAccountType = user.accountType || (isBuyer && isSeller ? "both" : isBuyer ? "buyer" : isSeller ? "seller" : "both");

    // Current subscription & plan
    const currentSubscription = user.subscriptions[0] || null;
    const currentPlan = currentSubscription?.plan || null;

    // Get public reviews
    const reviews = await db.review.findMany({
      where: { toUserId: id, isPublic: true },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            isVerified: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Calculate review stats
    const positiveReviews = reviews.filter((r) => r.rating >= 4).length;
    const positivePercentage = reviews.length > 0
      ? Math.round((positiveReviews / reviews.length) * 100)
      : 0;

    // Determine earned badges
    const earnedBadges: { key: string; label: string; description: string; icon: string; earned: boolean; color: string }[] = [
      {
        key: "trusted-seller",
        label: "বিশ্বস্ত বিক্রেতা",
        description: "কমপক্ষে ১০টি সফল বিক্রয় লেনদেন সম্পন্ন করেছেন এবং ৪+ রেটিং আছে",
        icon: "store",
        earned: sellerTransactions.filter((t) => t.status === "completed").length >= 10 && user.sellerRating >= 4,
        color: "#16a34a",
      },
      {
        key: "trusted-buyer",
        label: "বিশ্বস্ত ক্রেতা",
        description: "কমপক্ষে ১০টি সফল ক্রয় লেনদেন সম্পন্ন করেছেন এবং ৪+ রেটিং আছে",
        icon: "shopping-cart",
        earned: buyerTransactions.filter((t) => t.status === "completed").length >= 10 && user.buyerRating >= 4,
        color: "#2563eb",
      },
      {
        key: "verified",
        label: "ভেরিফাইড ব্যবহারকারী",
        description: "পরিচয় যাচাইকৃত ব্যবহারকারী",
        icon: "check",
        earned: user.isVerified,
        color: "#7c3aed",
      },
      {
        key: "premium",
        label: "প্রিমিয়াম সদস্য",
        description: "সক্রিয় প্রিমিয়াম সাবস্ক্রিপশন আছে",
        icon: "crown",
        earned: currentPlan !== null && currentPlan.slug !== "basic",
        color: currentPlan?.badgeColor || "#d97706",
      },
      {
        key: "top-rated",
        label: "শীর্ষ রেটেড",
        description: "সামগ্রিক ৪.৫+ রেটিং এবং কমপক্ষে ২০টি রিভিউ আছে",
        icon: "star",
        earned: user.totalReviews >= 20 && avgRating >= 4.5,
        color: "#ea580c",
      },
    ];

    // Check if requesting user has already reviewed this user
    let hasReviewed = false;
    let canReview = false;
    try {
      const session = await requireAuth();
      if (session) {
        const currentUserId = (session.user as { id: string }).id;
        if (currentUserId !== id) {
          canReview = true;
          const existingReview = await db.review.findFirst({
            where: { fromUserId: currentUserId, toUserId: id },
          });
          hasReviewed = !!existingReview;
        }
      }
    } catch {
      // Not authenticated - canReview stays false
    }

    // Build public profile (NEVER expose email, phone, password, payment info)
    const publicProfile = {
      id: user.id,
      name: user.name,
      username: user.username,
      avatar: user.avatar,
      accountType: effectiveAccountType,
      isVerified: user.isVerified,
      country: user.country,
      createdAt: user.createdAt,
      lastActive: lastTransactionDate,
      // Reputation
      buyerRating: user.buyerRating,
      sellerRating: user.sellerRating,
      overallRating: Math.round(avgRating * 100) / 100,
      totalReviews: user.totalReviews,
      positiveReviewPercentage: positivePercentage,
      completedDeals: user.completedDeals,
      successfulTransactions: user.successfulTransactions,
      trustScore: Math.round(trustScore * 100) / 100,
      disputeRate: Math.round(disputeRate * 100) / 100,
      successRate,
      // Badge & subscription
      currentPlan,
      currentSubscription: currentSubscription
        ? {
            id: currentSubscription.id,
            status: currentSubscription.status,
            startDate: currentSubscription.startDate,
            endDate: currentSubscription.endDate,
          }
        : null,
      earnedBadges,
      // Stats
      stats: {
        totalTransactions,
        completedTransactions: completedCount,
        inProgressTransactions: inProgressCount,
        disputedTransactions: disputedCount,
        buyerTransactionCount: buyerTransactions.length,
        sellerTransactionCount: sellerTransactions.length,
      },
      memberSinceBadge,
      accountAgeDays,
      // Reviews
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        reviewType: r.reviewType,
        createdAt: r.createdAt,
        fromUser: {
          id: r.fromUser.id,
          name: r.fromUser.name,
          username: r.fromUser.username,
          avatar: r.fromUser.avatar,
          isVerified: r.fromUser.isVerified,
        },
      })),
      // Review capability
      canReview,
      hasReviewed,
    };

    return NextResponse.json({ profile: publicProfile });
  } catch (error) {
    console.error("Get public profile error:", error);
    return NextResponse.json(
      { error: "প্রোফাইল তথ্য লোড করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}
