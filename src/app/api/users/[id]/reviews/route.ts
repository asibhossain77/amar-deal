import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helper";

// GET /api/users/[id]/reviews - Get reviews for a user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
    });

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error("Get reviews error:", error);
    return NextResponse.json(
      { error: "রিভিউ লোড করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}

// POST /api/users/[id]/reviews - Submit a review for a user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    if (!session) {
      return NextResponse.json(
        { error: "লগইন আবশ্যক" },
        { status: 401 }
      );
    }

    const currentUserId = (session.user as { id: string }).id;
    const { id: toUserId } = await params;

    // Can't review yourself
    if (currentUserId === toUserId) {
      return NextResponse.json(
        { error: "আপনি নিজেকে রিভিউ দিতে পারবেন না" },
        { status: 400 }
      );
    }

    // Check if target user exists
    const targetUser = await db.user.findUnique({ where: { id: toUserId } });
    if (!targetUser) {
      return NextResponse.json(
        { error: "ব্যবহারকারী পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    // Check if already reviewed
    const existingReview = await db.review.findFirst({
      where: { fromUserId: currentUserId, toUserId: toUserId },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "আপনি ইতিমধ্যে এই ব্যবহারকারীকে রিভিউ দিয়েছেন" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { rating, comment, reviewType, transactionId } = body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "রেটিং ১ থেকে ৫ এর মধ্যে হতে হবে" },
        { status: 400 }
      );
    }

    // Create the review
    const review = await db.review.create({
      data: {
        fromUserId: currentUserId,
        toUserId: toUserId,
        transactionId: transactionId || null,
        rating: parseInt(rating),
        comment: comment || null,
        reviewType: reviewType || "general",
        isPublic: true,
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
    });

    // Update the target user's rating averages
    const allReviews = await db.review.findMany({
      where: { toUserId: toUserId },
      select: { rating: true, reviewType: true },
    });

    const buyerReviews = allReviews.filter((r) => r.reviewType === "buyer" || r.reviewType === "general");
    const sellerReviews = allReviews.filter((r) => r.reviewType === "seller" || r.reviewType === "general");

    const avgBuyerRating = buyerReviews.length > 0
      ? buyerReviews.reduce((sum, r) => sum + r.rating, 0) / buyerReviews.length
      : 0;
    const avgSellerRating = sellerReviews.length > 0
      ? sellerReviews.reduce((sum, r) => sum + r.rating, 0) / sellerReviews.length
      : 0;

    await db.user.update({
      where: { id: toUserId },
      data: {
        buyerRating: Math.round(avgBuyerRating * 100) / 100,
        sellerRating: Math.round(avgSellerRating * 100) / 100,
        totalReviews: allReviews.length,
      },
    });

    return NextResponse.json({
      review,
      message: "রিভিউ সফলভাবে জমা দেওয়া হয়েছে",
    });
  } catch (error) {
    console.error("Create review error:", error);
    return NextResponse.json(
      { error: "রিভিউ জমা দিতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}
