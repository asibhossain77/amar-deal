import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requireAdmin } from "@/lib/auth-helper";

// GET /api/users/[id]/public-profile - Get public profile data with privacy enforcement
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

    // ─── Determine viewer identity & access level ─────────────────────────
    let viewerId: string | null = null;
    let isOwner = false;
    let isAdmin = false;
    let hasAcceptedGrant = false;

    try {
      const session = await requireAuth();
      if (session?.user) {
        viewerId = (session.user as { id: string }).id;
        isOwner = viewerId === id;

        const adminSession = await requireAdmin();
        isAdmin = !!adminSession;

        // Check if there is an accepted ReviewVisibilityGrant from the profile owner to the viewer
        if (!isOwner && !isAdmin && viewerId) {
          const acceptedGrant = await db.reviewVisibilityGrant.findFirst({
            where: {
              grantorId: id, // profile owner is the grantor
              granteeId: viewerId, // viewer is the grantee
              status: "accepted",
            },
          });
          hasAcceptedGrant = !!acceptedGrant;
        }
      }
    } catch {
      // Not authenticated — viewerId stays null, all flags stay false
    }

    // Determine privacy level
    let privacyLevel: "full" | "shared" | "limited";

    if (isOwner || isAdmin) {
      privacyLevel = "full";
    } else if (hasAcceptedGrant) {
      privacyLevel = "shared";
    } else {
      privacyLevel = "limited";
    }

    // ─── Common computations ─────────────────────────────────

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

    // ─── Helper: should we show data based on visibility setting and viewer level? ───
    // Returns: "full" (show numeric), "summary" (show indicator only), "hidden" (show nothing)
    type Visibility = "public" | "limited" | "private" | "shared";

    function resolveVisibility(visibility: Visibility, viewerLevel: "full" | "shared" | "limited"): "full" | "summary" | "hidden" {
      // Owner/admin always sees full data (already handled by privacyLevel === "full")
      if (viewerLevel === "full") return "full";

      // Shared-level viewer: if the visibility setting is "shared" or more open, they can see
      if (viewerLevel === "shared") {
        if (visibility === "public") return "full";
        if (visibility === "shared" || visibility === "limited") return "full";
        if (visibility === "private") return "hidden";
        return "hidden";
      }

      // Limited viewer (general public)
      if (visibility === "public") return "full";
      if (visibility === "limited") return "summary";
      if (visibility === "shared") return "hidden"; // shared only for granted viewers
      if (visibility === "private") return "hidden";
      return "hidden";
    }

    const ratingVisibility = resolveVisibility(
      user.ratingVisibility as Visibility,
      privacyLevel
    );
    const reviewVisibility = resolveVisibility(
      user.reviewVisibility as Visibility,
      privacyLevel
    );
    const trustScoreVisibility = resolveVisibility(
      user.trustScoreVisibility as Visibility,
      privacyLevel
    );

    // ─── Get reviews (filtered by privacy and isHidden) ─────────────────────────
    let reviews: Array<{
      id: string;
      rating: number;
      comment: string | null;
      reviewType: string;
      createdAt: Date;
      fromUser: { id: string; name: string; username: string | null; avatar: string | null; isVerified: boolean };
    }> = [];

    if (reviewVisibility !== "hidden") {
      // For shared viewers, only show reviews they have been granted access to
      const reviewWhere: Record<string, unknown> = {
        toUserId: id,
        isHidden: false, // Never show admin-hidden reviews to non-admins
      };

      // If the viewer is owner or admin, show all reviews including hidden ones
      if (privacyLevel === "full") {
        delete reviewWhere.isHidden;
      }

      // For shared viewers, only show reviews they have grants for
      if (privacyLevel === "shared" && viewerId) {
        const grantedReviewIds = await db.reviewVisibilityGrant.findMany({
          where: {
            grantorId: id,
            granteeId: viewerId,
            status: "accepted",
          },
          select: { reviewId: true },
        });
        const grantedIds = grantedReviewIds.map((g) => g.reviewId);
        reviewWhere.id = { in: grantedIds.length > 0 ? grantedIds : ["__none__"] };
      }

      // For limited viewers with "public" reviewVisibility, show public reviews
      if (privacyLevel === "limited") {
        reviewWhere.isPublic = true;
      }

      reviews = await db.review.findMany({
        where: reviewWhere,
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
    }

    // Calculate review stats (from ALL non-hidden public reviews for accurate counts)
    const allPublicReviews = await db.review.findMany({
      where: { toUserId: id, isPublic: true, isHidden: false },
      select: { rating: true },
    });
    const positiveReviews = allPublicReviews.filter((r) => r.rating >= 4).length;
    const positivePercentage = allPublicReviews.length > 0
      ? Math.round((positiveReviews / allPublicReviews.length) * 100)
      : 0;

    // ─── Determine earned badges ─────────────────────────
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

    // ─── Check if requesting user has already reviewed this user ─────────────────────────
    let hasReviewed = false;
    let canReview = false;
    if (viewerId && viewerId !== id) {
      canReview = true;
      const existingReview = await db.review.findFirst({
        where: { fromUserId: viewerId, toUserId: id },
      });
      hasReviewed = !!existingReview;
    }

    // ─── Check if viewer can request access ─────────────────────────
    // canRequestAccess: true if the viewer is authenticated, not the owner, not an admin,
    // and does not already have a pending or accepted grant
    let canRequestAccess = false;
    if (viewerId && !isOwner && !isAdmin && !hasAcceptedGrant) {
      const existingGrant = await db.reviewVisibilityGrant.findFirst({
        where: {
          grantorId: id,
          granteeId: viewerId,
          status: { in: ["pending", "accepted"] },
        },
      });
      canRequestAccess = !existingGrant;
    }

    // ─── Build response based on privacy level ─────────────────────────

    // Basic info: always returned regardless of privacy level
    const basicInfo = {
      id: user.id,
      name: user.name,
      username: user.username,
      avatar: user.avatar,
      accountType: effectiveAccountType,
      isVerified: user.isVerified,
      country: user.country,
      createdAt: user.createdAt,
      lastActive: lastTransactionDate,
      memberSinceBadge,
      earnedBadges: privacyLevel === "limited"
        ? earnedBadges.map((b) => ({
            key: b.key,
            label: b.label,
            icon: b.icon,
            earned: b.earned,
            color: b.color,
            // Omit detailed description for limited viewers
          }))
        : earnedBadges,
      currentPlan: currentPlan
        ? { name: currentPlan.name, slug: currentPlan.slug, badgeIcon: currentPlan.badgeIcon, badgeColor: currentPlan.badgeColor }
        : null,
    };

    // ─── Rating data ─────────────────────────
    let ratingData: Record<string, unknown> = {};

    if (ratingVisibility === "full") {
      // Show all numeric rating data
      ratingData = {
        buyerRating: user.buyerRating,
        sellerRating: user.sellerRating,
        overallRating: Math.round(avgRating * 100) / 100,
        totalReviews: user.totalReviews,
        positiveReviewPercentage: positivePercentage,
      };
    } else if (ratingVisibility === "summary") {
      // Show only summary indicators
      const indicators: string[] = [];
      if (avgRating >= 4) indicators.push("positive_rating");
      if (user.totalReviews > 0) indicators.push("has_reviews");

      ratingData = {
        ratingIndicators: indicators,
        // NO numeric values
      };
    }
    // else ratingVisibility === "hidden" → ratingData stays empty

    // ─── Trust score data ─────────────────────────
    let trustScoreData: Record<string, unknown> = {};

    if (trustScoreVisibility === "full") {
      trustScoreData = {
        trustScore: Math.round(trustScore * 100) / 100,
        disputeRate: Math.round(disputeRate * 100) / 100,
        successRate,
      };
    } else if (trustScoreVisibility === "summary") {
      // Show only summary indicator badges
      const indicators: string[] = [];
      if (trustScore >= 70) indicators.push("trusted_user");
      if (accountAgeDays < 30) indicators.push("new_user");

      trustScoreData = {
        trustIndicators: indicators,
        // NO numeric trust score
      };
    }
    // else trustScoreVisibility === "hidden" → trustScoreData stays empty

    // ─── Stats data ─────────────────────────
    let statsData: Record<string, unknown> | null = null;

    if (privacyLevel === "full") {
      // Full stats for owner/admin
      statsData = {
        totalTransactions,
        completedTransactions: completedCount,
        inProgressTransactions: inProgressCount,
        disputedTransactions: disputedCount,
        buyerTransactionCount: buyerTransactions.length,
        sellerTransactionCount: sellerTransactions.length,
      };
    }
    // For shared/limited viewers, no detailed stats

    // ─── Subscription data ─────────────────────────
    let subscriptionData: Record<string, unknown> | null = null;

    if (privacyLevel === "full" && currentSubscription) {
      subscriptionData = {
        id: currentSubscription.id,
        status: currentSubscription.status,
        startDate: currentSubscription.startDate,
        endDate: currentSubscription.endDate,
      };
    }

    // ─── Completed deals / successful transactions ─────────────────────────
    let dealsData: Record<string, unknown> = {};

    if (privacyLevel === "full") {
      dealsData = {
        completedDeals: user.completedDeals,
        successfulTransactions: user.successfulTransactions,
      };
    }

    // ─── Reviews list ─────────────────────────
    let reviewsData: Array<Record<string, unknown>> = [];

    if (reviewVisibility === "full") {
      reviewsData = reviews.map((r) => ({
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
      }));
    } else if (reviewVisibility === "summary") {
      // Show only that reviews exist but not their content
      reviewsData = [];
    }
    // else reviewVisibility === "hidden" → reviewsData stays empty

    // ─── Account age days ─────────────────────────
    let accountAgeDaysData: number | undefined;
    if (privacyLevel === "full") {
      accountAgeDaysData = accountAgeDays;
    }

    // ─── Assemble final profile ─────────────────────────
    const publicProfile = {
      ...basicInfo,
      ...ratingData,
      ...trustScoreData,
      ...dealsData,
      stats: statsData,
      currentSubscription: subscriptionData,
      accountAgeDays: accountAgeDaysData,
      reviews: reviewsData,
      canReview,
      hasReviewed,
    };

    return NextResponse.json({
      profile: publicProfile,
      privacyLevel,
      canRequestAccess,
    });
  } catch (error) {
    console.error("Get public profile error:", error);
    return NextResponse.json(
      { error: "প্রোফাইল তথ্য লোড করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}
