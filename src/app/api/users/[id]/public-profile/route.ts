import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helper";

// GET /api/users/[id]/public-profile - Get simplified public profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get the user
    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        username: true,
        avatar: true,
        accountType: true,
        isVerified: true,
        verificationStatus: true,
        createdAt: true,
        buyerRating: true,
        sellerRating: true,
        buyerReviewCount: true,
        sellerReviewCount: true,
        totalReviews: true,
        completedDeals: true,
        trustScore: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get latest 10 public, non-hidden reviews with fromUser info
    const reviews = await db.review.findMany({
      where: {
        toUserId: id,
        isPublic: true,
        isHidden: false,
      },
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
      take: 10,
    });

    // Check if current authenticated user can/has reviewed this user
    let canReview = false;
    let hasReviewed = false;

    try {
      const session = await requireAuth();
      const viewerId = session?.user ? (session.user as { id: string }).id : null;

      if (viewerId && viewerId !== id) {
        canReview = true;
        const existingReview = await db.review.findFirst({
          where: { fromUserId: viewerId, toUserId: id },
        });
        hasReviewed = !!existingReview;
      }
    } catch {
      // Not authenticated — canReview and hasReviewed stay false
    }

    // Build the simplified public profile
    const profile = {
      id: user.id,
      name: user.name,
      username: user.username,
      avatar: user.avatar,
      accountType: user.accountType,
      isVerified: user.isVerified,
      verificationStatus: user.verificationStatus,
      createdAt: user.createdAt,
      buyerRating: user.buyerRating,
      sellerRating: user.sellerRating,
      buyerReviewCount: user.buyerReviewCount,
      sellerReviewCount: user.sellerReviewCount,
      totalReviews: user.totalReviews,
      completedDeals: user.completedDeals,
      trustScore: user.trustScore,
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
      canReview,
      hasReviewed,
    };

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Get public profile error:", error);
    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 }
    );
  }
}
