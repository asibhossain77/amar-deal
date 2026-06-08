import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, requireAuth } from "@/lib/auth-helper";

// GET /api/admin/reviews - List all reviews with filters (admin only)
export async function GET(request: NextRequest) {
  try {
    const authSession = await requireAuth();
    if (!authSession) {
      return NextResponse.json(
        { error: "প্রমাণীকরণ আবশ্যক" },
        { status: 401 }
      );
    }

    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json(
        { error: "অ্যাডমিন অনুমতি আবশ্যক" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all"; // all, hidden, visible
    const userId = searchParams.get("userId") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: {
      isHidden?: boolean;
      toUserId?: string;
    } = {};

    if (status === "hidden") {
      whereClause.isHidden = true;
    } else if (status === "visible") {
      whereClause.isHidden = false;
    }
    // "all" → no isHidden filter

    if (userId) {
      whereClause.toUserId = userId;
    }

    const [reviews, total] = await Promise.all([
      db.review.findMany({
        where: whereClause,
        include: {
          fromUser: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
              isVerified: true,
              email: true,
            },
          },
          toUser: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
              isVerified: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.review.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get admin reviews error:", error);
    return NextResponse.json(
      { error: "রিভিউ তালিকা লোড করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/reviews - Moderate a review (admin only)
export async function PUT(request: NextRequest) {
  try {
    const authSession = await requireAuth();
    if (!authSession) {
      return NextResponse.json(
        { error: "প্রমাণীকরণ আবশ্যক" },
        { status: 401 }
      );
    }

    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json(
        { error: "অ্যাডমিন অনুমতি আবশ্যক" },
        { status: 403 }
      );
    }

    const adminId = (session.user as { id: string }).id;
    const body = await request.json();
    const { reviewId, action, adminNote } = body;

    if (!reviewId || !action) {
      return NextResponse.json(
        { error: "রিভিউ আইডি এবং অ্যাকশন আবশ্যক" },
        { status: 400 }
      );
    }

    const validActions = ["hide", "show", "delete", "note"];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: "অবৈধ অ্যাকশন। সমর্থিত অ্যাকশন: hide, show, delete, note" },
        { status: 400 }
      );
    }

    // Find the review
    const review = await db.review.findUnique({
      where: { id: reviewId },
      include: {
        fromUser: { select: { name: true } },
        toUser: { select: { name: true } },
      },
    });

    if (!review) {
      return NextResponse.json(
        { error: "রিভিউ পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    let updatedReview;
    let logAction: string;
    let logDetails: string;

    switch (action) {
      case "hide": {
        updatedReview = await db.review.update({
          where: { id: reviewId },
          data: {
            isHidden: true,
            adminNote: adminNote || review.adminNote,
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
            toUser: {
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
        logAction = "review_hidden";
        logDetails = `Review "${review.id}" by "${review.fromUser.name}" for "${review.toUser.name}" hidden.${adminNote ? ` Note: ${adminNote}` : ""}`;
        break;
      }

      case "show": {
        updatedReview = await db.review.update({
          where: { id: reviewId },
          data: {
            isHidden: false,
            adminNote: adminNote || review.adminNote,
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
            toUser: {
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
        logAction = "review_shown";
        logDetails = `Review "${review.id}" by "${review.fromUser.name}" for "${review.toUser.name}" made visible.${adminNote ? ` Note: ${adminNote}` : ""}`;
        break;
      }

      case "delete": {
        await db.review.delete({
          where: { id: reviewId },
        });
        updatedReview = null;
        logAction = "review_deleted";
        logDetails = `Review "${review.id}" by "${review.fromUser.name}" for "${review.toUser.name}" deleted.${adminNote ? ` Note: ${adminNote}` : ""}`;

        // Recalculate the target user's rating averages after deletion
        const remainingReviews = await db.review.findMany({
          where: { toUserId: review.toUserId },
          select: { rating: true, reviewType: true },
        });

        const buyerReviews = remainingReviews.filter((r) => r.reviewType === "buyer" || r.reviewType === "general");
        const sellerReviews = remainingReviews.filter((r) => r.reviewType === "seller" || r.reviewType === "general");

        const avgBuyerRating = buyerReviews.length > 0
          ? buyerReviews.reduce((sum, r) => sum + r.rating, 0) / buyerReviews.length
          : 0;
        const avgSellerRating = sellerReviews.length > 0
          ? sellerReviews.reduce((sum, r) => sum + r.rating, 0) / sellerReviews.length
          : 0;

        await db.user.update({
          where: { id: review.toUserId },
          data: {
            buyerRating: Math.round(avgBuyerRating * 100) / 100,
            sellerRating: Math.round(avgSellerRating * 100) / 100,
            totalReviews: remainingReviews.length,
          },
        });
        break;
      }

      case "note": {
        if (!adminNote) {
          return NextResponse.json(
            { error: "অ্যাডমিন নোট আবশ্যক" },
            { status: 400 }
          );
        }
        updatedReview = await db.review.update({
          where: { id: reviewId },
          data: { adminNote },
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
            toUser: {
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
        logAction = "review_note_added";
        logDetails = `Admin note added to review "${review.id}" by "${review.fromUser.name}" for "${review.toUser.name}": ${adminNote}`;
        break;
      }
    }

    // Log the admin action
    await db.adminLog.create({
      data: {
        userId: adminId,
        action: logAction,
        details: logDetails,
      },
    });

    const actionMessages: Record<string, string> = {
      hide: "রিভিউ লুকানো হয়েছে",
      show: "রিভিউ দৃশ্যমান করা হয়েছে",
      delete: "রিভিউ মুছে ফেলা হয়েছে",
      note: "অ্যাডমিন নোট যোগ করা হয়েছে",
    };

    return NextResponse.json({
      review: updatedReview,
      message: actionMessages[action],
    });
  } catch (error) {
    console.error("Moderate review error:", error);
    return NextResponse.json(
      { error: "রিভিউ মডারেট করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}
