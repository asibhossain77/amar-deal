import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helper";
import { db } from "@/lib/db";

// ─── GET /api/account/visibility-grants ─────────────────────────
// List all visibility grants for the current user
// Query params: direction = "given" | "received" | "all" (default "all")
//               status = "pending" | "accepted" | "revoked" | "all" (default "all")
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
    const { searchParams } = new URL(request.url);

    const direction = searchParams.get("direction") || "all"; // "given" | "received" | "all"
    const statusFilter = searchParams.get("status") || "all"; // "pending" | "accepted" | "revoked" | "all"

    // Validate direction
    if (!["given", "received", "all"].includes(direction)) {
      return NextResponse.json(
        { error: "অবৈধ direction প্যারামিটার। সমর্থিত: given, received, all" },
        { status: 400 }
      );
    }

    // Validate status
    if (!["pending", "accepted", "revoked", "all"].includes(statusFilter)) {
      return NextResponse.json(
        { error: "অবৈধ status প্যারামিটার। সমর্থিত: pending, accepted, revoked, all" },
        { status: 400 }
      );
    }

    // Build status filter
    const statusWhere = statusFilter === "all" ? {} : { status: statusFilter };

    // Build where clauses based on direction
    const givenWhere = {
      grantorId: userId,
      ...statusWhere,
    };

    const receivedWhere = {
      granteeId: userId,
      ...statusWhere,
    };

    // Shared select for user info
    const userSelect = {
      id: true,
      name: true,
      username: true,
      avatar: true,
      isVerified: true,
    };

    // Shared select for review info
    const reviewSelect = {
      id: true,
      rating: true,
      comment: true,
      reviewType: true,
      createdAt: true,
    };

    type GrantWithRelations = {
      id: string;
      grantorId: string;
      granteeId: string;
      reviewId: string;
      status: string;
      createdAt: Date;
      updatedAt: Date;
      grantor: { id: string; name: string; username: string | null; avatar: string | null; isVerified: boolean };
      grantee: { id: string; name: string; username: string | null; avatar: string | null; isVerified: boolean };
      review: { id: string; rating: number; comment: string | null; reviewType: string; createdAt: Date };
    };

    let grantsGiven: GrantWithRelations[] = [];
    let grantsReceived: GrantWithRelations[] = [];

    if (direction === "given" || direction === "all") {
      grantsGiven = await db.reviewVisibilityGrant.findMany({
        where: givenWhere,
        include: {
          grantor: { select: userSelect },
          grantee: { select: userSelect },
          review: { select: reviewSelect },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    if (direction === "received" || direction === "all") {
      grantsReceived = await db.reviewVisibilityGrant.findMany({
        where: receivedWhere,
        include: {
          grantor: { select: userSelect },
          grantee: { select: userSelect },
          review: { select: reviewSelect },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json({
      grantsGiven,
      grantsReceived,
      filters: {
        direction,
        status: statusFilter,
      },
    });
  } catch (error) {
    console.error("Get visibility grants error:", error);
    return NextResponse.json(
      { error: "দৃশ্যমানতা অনুদান লোড করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}

// ─── POST /api/account/visibility-grants ─────────────────────────
// Create a visibility grant (share review access with another user)
// Body: { granteeId: string, reviewId: string }
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) {
      return NextResponse.json(
        { error: "প্রমাণীকরণ আবশ্যক" },
        { status: 401 }
      );
    }

    const currentUserId = (session.user as { id: string }).id;
    const body = await request.json();
    const { granteeId, reviewId } = body;

    // Validate required fields
    if (!granteeId || !reviewId) {
      return NextResponse.json(
        { error: "granteeId এবং reviewId আবশ্যক" },
        { status: 400 }
      );
    }

    // Can't grant to yourself
    if (currentUserId === granteeId) {
      return NextResponse.json(
        { error: "আপনি নিজেকে দৃশ্যমানতা অনুদান দিতে পারবেন না" },
        { status: 400 }
      );
    }

    // Check that the grantee user exists
    const grantee = await db.user.findUnique({
      where: { id: granteeId },
      select: {
        id: true,
        name: true,
        username: true,
        avatar: true,
        isVerified: true,
      },
    });

    if (!grantee) {
      return NextResponse.json(
        { error: "অনুদান প্রাপক ব্যবহারকারী পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    // Check that the review exists and belongs to the current user (toUserId = current user)
    // The grantor owns the reviews they received, so toUserId must equal currentUserId
    const review = await db.review.findUnique({
      where: { id: reviewId },
      select: {
        id: true,
        toUserId: true,
        fromUserId: true,
        rating: true,
        comment: true,
        reviewType: true,
        isHidden: true,
      },
    });

    if (!review) {
      return NextResponse.json(
        { error: "রিভিউ পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    // The review must belong to the current user (they received it)
    if (review.toUserId !== currentUserId) {
      return NextResponse.json(
        { error: "আপনি শুধুমাত্র আপনার নিজের প্রাপ্ত রিভিউ শেয়ার করতে পারেন" },
        { status: 403 }
      );
    }

    // Check for duplicate grants (same grantor + grantee + review with pending or accepted status)
    const existingGrant = await db.reviewVisibilityGrant.findFirst({
      where: {
        grantorId: currentUserId,
        granteeId: granteeId,
        reviewId: reviewId,
        status: { in: ["pending", "accepted"] },
      },
    });

    if (existingGrant) {
      return NextResponse.json(
        {
          error: "এই ব্যবহারকারীর জন্য এই রিভিউতে ইতিমধ্যে একটি সক্রিয় বা অপেক্ষমাণ অনুদান রয়েছে",
          existingGrantId: existingGrant.id,
        },
        { status: 409 }
      );
    }

    // Create the visibility grant
    const grant = await db.reviewVisibilityGrant.create({
      data: {
        grantorId: currentUserId,
        granteeId: granteeId,
        reviewId: reviewId,
        status: "pending",
      },
      include: {
        grantor: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            isVerified: true,
          },
        },
        grantee: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            isVerified: true,
          },
        },
        review: {
          select: {
            id: true,
            rating: true,
            comment: true,
            reviewType: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json({
      grant,
      message: "দৃশ্যমানতা অনুদান সফলভাবে তৈরি হয়েছে",
    }, { status: 201 });
  } catch (error) {
    console.error("Create visibility grant error:", error);
    return NextResponse.json(
      { error: "দৃশ্যমানতা অনুদান তৈরি করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}

// ─── PUT /api/account/visibility-grants ─────────────────────────
// Respond to a visibility grant request
// Body: { grantId: string, action: "accept" | "revoke" | "reject" }
export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) {
      return NextResponse.json(
        { error: "প্রমাণীকরণ আবশ্যক" },
        { status: 401 }
      );
    }

    const currentUserId = (session.user as { id: string }).id;
    const body = await request.json();
    const { grantId, action } = body;

    // Validate required fields
    if (!grantId || !action) {
      return NextResponse.json(
        { error: "grantId এবং action আবশ্যক" },
        { status: 400 }
      );
    }

    // Validate action
    const validActions = ["accept", "revoke", "reject"];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: "অবৈধ অ্যাকশন। সমর্থিত: accept, revoke, reject" },
        { status: 400 }
      );
    }

    // Find the grant
    const grant = await db.reviewVisibilityGrant.findUnique({
      where: { id: grantId },
      include: {
        grantor: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            isVerified: true,
          },
        },
        grantee: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            isVerified: true,
          },
        },
        review: {
          select: {
            id: true,
            rating: true,
            comment: true,
            reviewType: true,
            createdAt: true,
          },
        },
      },
    });

    if (!grant) {
      return NextResponse.json(
        { error: "অনুদান পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    let newStatus: string;
    let message: string;

    switch (action) {
      case "accept": {
        // Only the grantee can accept a pending grant
        if (grant.granteeId !== currentUserId) {
          return NextResponse.json(
            { error: "শুধুমাত্র অনুদান প্রাপক একটি অনুদান গ্রহণ করতে পারেন" },
            { status: 403 }
          );
        }

        if (grant.status !== "pending") {
          return NextResponse.json(
            { error: "শুধুমাত্র অপেক্ষমাণ অনুদান গ্রহণ করা যায়" },
            { status: 400 }
          );
        }

        newStatus = "accepted";
        message = "দৃশ্যমানতা অনুদান গ্রহণ করা হয়েছে";
        break;
      }

      case "reject": {
        // Only the grantee can reject a pending grant
        if (grant.granteeId !== currentUserId) {
          return NextResponse.json(
            { error: "শুধুমাত্র অনুদান প্রাপক একটি অনুদান প্রত্যাখ্যান করতে পারেন" },
            { status: 403 }
          );
        }

        if (grant.status !== "pending") {
          return NextResponse.json(
            { error: "শুধুমাত্র অপেক্ষমাণ অনুদান প্রত্যাখ্যান করা যায়" },
            { status: 400 }
          );
        }

        newStatus = "revoked";
        message = "দৃশ্যমানতা অনুদান প্রত্যাখ্যান করা হয়েছে";
        break;
      }

      case "revoke": {
        // Only the grantor can revoke an accepted grant
        if (grant.grantorId !== currentUserId) {
          return NextResponse.json(
            { error: "শুধুমাত্র অনুদানদাতা একটি অনুদান বাতিল করতে পারেন" },
            { status: 403 }
          );
        }

        if (grant.status !== "accepted") {
          return NextResponse.json(
            { error: "শুধুমাত্র গৃহীত অনুদান বাতিল করা যায়" },
            { status: 400 }
          );
        }

        newStatus = "revoked";
        message = "দৃশ্যমানতা অনুদান বাতিল করা হয়েছে";
        break;
      }

      default:
        return NextResponse.json(
          { error: "অবৈধ অ্যাকশন" },
          { status: 400 }
        );
    }

    // Update the grant status
    const updatedGrant = await db.reviewVisibilityGrant.update({
      where: { id: grantId },
      data: { status: newStatus },
      include: {
        grantor: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            isVerified: true,
          },
        },
        grantee: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            isVerified: true,
          },
        },
        review: {
          select: {
            id: true,
            rating: true,
            comment: true,
            reviewType: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json({
      grant: updatedGrant,
      message,
    });
  } catch (error) {
    console.error("Update visibility grant error:", error);
    return NextResponse.json(
      { error: "দৃশ্যমানতা অনুদান আপডেট করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}
