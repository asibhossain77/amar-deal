import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helper";
import { db } from "@/lib/db";

// ─── GET /api/account/privacy ─────────────────────────
// Get the current user's privacy settings, visibility grant counts, and summary
export async function GET() {
  try {
    const session = await requireAuth();
    if (!session) {
      return NextResponse.json(
        { error: "প্রমাণীকরণ আবশ্যক" },
        { status: 401 }
      );
    }

    const userId = (session.user as { id: string }).id;

    // Fetch the user's privacy settings
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        ratingVisibility: true,
        reviewVisibility: true,
        trustScoreVisibility: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "ব্যবহারকারী পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    // Count visibility grants given (where current user is grantor)
    const grantsGivenCount = await db.reviewVisibilityGrant.count({
      where: { grantorId: userId },
    });

    // Count visibility grants given by status
    const grantsGivenPending = await db.reviewVisibilityGrant.count({
      where: { grantorId: userId, status: "pending" },
    });
    const grantsGivenAccepted = await db.reviewVisibilityGrant.count({
      where: { grantorId: userId, status: "accepted" },
    });
    const grantsGivenRevoked = await db.reviewVisibilityGrant.count({
      where: { grantorId: userId, status: "revoked" },
    });

    // Count visibility grants received (where current user is grantee)
    const grantsReceivedCount = await db.reviewVisibilityGrant.count({
      where: { granteeId: userId },
    });

    // Count visibility grants received by status
    const grantsReceivedPending = await db.reviewVisibilityGrant.count({
      where: { granteeId: userId, status: "pending" },
    });
    const grantsReceivedAccepted = await db.reviewVisibilityGrant.count({
      where: { granteeId: userId, status: "accepted" },
    });
    const grantsReceivedRevoked = await db.reviewVisibilityGrant.count({
      where: { granteeId: userId, status: "revoked" },
    });

    // Build a human-readable summary
    const summary = buildPrivacySummary(
      user.ratingVisibility,
      user.reviewVisibility,
      user.trustScoreVisibility,
      grantsGivenCount,
      grantsReceivedCount
    );

    return NextResponse.json({
      settings: {
        ratingVisibility: user.ratingVisibility,
        reviewVisibility: user.reviewVisibility,
        trustScoreVisibility: user.trustScoreVisibility,
      },
      grantsGiven: {
        total: grantsGivenCount,
        pending: grantsGivenPending,
        accepted: grantsGivenAccepted,
        revoked: grantsGivenRevoked,
      },
      grantsReceived: {
        total: grantsReceivedCount,
        pending: grantsReceivedPending,
        accepted: grantsReceivedAccepted,
        revoked: grantsReceivedRevoked,
      },
      summary,
    });
  } catch (error) {
    console.error("Get privacy settings error:", error);
    return NextResponse.json(
      { error: "গোপনীয়তা সেটিংস লোড করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}

// ─── PUT /api/account/privacy ─────────────────────────
// Update the current user's privacy settings
// Body: { ratingVisibility?, reviewVisibility?, trustScoreVisibility? }
export async function PUT(request: NextRequest) {
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
    const { ratingVisibility, reviewVisibility, trustScoreVisibility } = body;

    // Validate ratingVisibility if provided
    const validRatingVisibility = ["private", "limited", "public"];
    if (
      ratingVisibility !== undefined &&
      !validRatingVisibility.includes(ratingVisibility)
    ) {
      return NextResponse.json(
        {
          error:
            "অবৈধ ratingVisibility মান। সমর্থিত: private, limited, public",
        },
        { status: 400 }
      );
    }

    // Validate reviewVisibility if provided
    const validReviewVisibility = ["private", "shared", "public"];
    if (
      reviewVisibility !== undefined &&
      !validReviewVisibility.includes(reviewVisibility)
    ) {
      return NextResponse.json(
        {
          error:
            "অবৈধ reviewVisibility মান। সমর্থিত: private, shared, public",
        },
        { status: 400 }
      );
    }

    // Validate trustScoreVisibility if provided
    const validTrustScoreVisibility = ["private", "limited", "public"];
    if (
      trustScoreVisibility !== undefined &&
      !validTrustScoreVisibility.includes(trustScoreVisibility)
    ) {
      return NextResponse.json(
        {
          error:
            "অবৈধ trustScoreVisibility মান। সমর্থিত: private, limited, public",
        },
        { status: 400 }
      );
    }

    // Ensure at least one field is provided
    if (
      ratingVisibility === undefined &&
      reviewVisibility === undefined &&
      trustScoreVisibility === undefined
    ) {
      return NextResponse.json(
        {
          error:
            "কমপক্ষে একটি গোপনীয়তা সেটিং আপডেট করতে হবে",
        },
        { status: 400 }
      );
    }

    // Build update data with only the provided fields
    const updateData: Record<string, string> = {};
    if (ratingVisibility !== undefined) {
      updateData.ratingVisibility = ratingVisibility;
    }
    if (reviewVisibility !== undefined) {
      updateData.reviewVisibility = reviewVisibility;
    }
    if (trustScoreVisibility !== undefined) {
      updateData.trustScoreVisibility = trustScoreVisibility;
    }

    // Update the user's privacy settings
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        ratingVisibility: true,
        reviewVisibility: true,
        trustScoreVisibility: true,
      },
    });

    return NextResponse.json({
      settings: {
        ratingVisibility: updatedUser.ratingVisibility,
        reviewVisibility: updatedUser.reviewVisibility,
        trustScoreVisibility: updatedUser.trustScoreVisibility,
      },
      message: "গোপনীয়তা সেটিংস সফলভাবে আপডেট হয়েছে",
    });
  } catch (error) {
    console.error("Update privacy settings error:", error);
    return NextResponse.json(
      { error: "গোপনীয়তা সেটিংস আপডেট করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}

// ─── Helper: Build a privacy summary ─────────────────────────
function buildPrivacySummary(
  ratingVisibility: string,
  reviewVisibility: string,
  trustScoreVisibility: string,
  grantsGiven: number,
  grantsReceived: number
): {
  ratingVisibilityLabel: string;
  reviewVisibilityLabel: string;
  trustScoreVisibilityLabel: string;
  overallPrivacyLevel: string;
  hasActiveSharing: boolean;
} {
  const ratingLabel = visibilityLabel(ratingVisibility, "rating");
  const reviewLabel = visibilityLabel(reviewVisibility, "review");
  const trustLabel = visibilityLabel(trustScoreVisibility, "trustScore");

  // Determine overall privacy level
  const visibilityLevels: Record<string, number> = {
    private: 0,
    limited: 1,
    shared: 1,
    public: 2,
  };

  const maxLevel = Math.max(
    visibilityLevels[ratingVisibility] ?? 0,
    visibilityLevels[reviewVisibility] ?? 0,
    visibilityLevels[trustScoreVisibility] ?? 0
  );

  let overallPrivacyLevel: string;
  if (maxLevel === 0) {
    overallPrivacyLevel = "fully_private";
  } else if (maxLevel === 1) {
    overallPrivacyLevel = "partially_visible";
  } else {
    overallPrivacyLevel = "mostly_public";
  }

  const hasActiveSharing = grantsGiven > 0 || grantsReceived > 0;

  return {
    ratingVisibilityLabel: ratingLabel,
    reviewVisibilityLabel: reviewLabel,
    trustScoreVisibilityLabel: trustLabel,
    overallPrivacyLevel,
    hasActiveSharing,
  };
}

function visibilityLabel(
  value: string,
  _context: string
): string {
  switch (value) {
    case "private":
      return "শুধুমাত্র আপনি দেখতে পারবেন";
    case "limited":
      return "সীমিত দর্শকদের জন্য দৃশ্যমান";
    case "shared":
      return "শেয়ার করা ব্যবহারকারীদের জন্য দৃশ্যমান";
    case "public":
      return "সবার জন্য দৃশ্যমান";
    default:
      return value;
  }
}
