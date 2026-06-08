import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helper";

// PUT /api/subscriptions/plans/[id] - Update a subscription plan (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json(
        { error: "অ্যাডমিন অনুমতি আবশ্যক" },
        { status: 403 }
      );
    }

    const adminId = (session.user as { id: string }).id;
    const { id } = await params;
    const body = await request.json();

    // Check plan exists
    const existingPlan = await db.subscriptionPlan.findUnique({
      where: { id },
    });

    if (!existingPlan) {
      return NextResponse.json(
        { error: "সাবস্ক্রিপশন প্ল্যান পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    // If slug is being changed, check uniqueness
    if (body.slug && body.slug !== existingPlan.slug) {
      const slugConflict = await db.subscriptionPlan.findUnique({
        where: { slug: body.slug },
      });
      if (slugConflict) {
        return NextResponse.json(
          { error: "এই স্লাগ ইতিমধ্যে ব্যবহৃত হচ্ছে" },
          { status: 400 }
        );
      }
    }

    // Build update data object with only provided fields
    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      "name", "slug", "description", "badgeIcon", "badgeColor",
      "monthlyPrice", "yearlyPrice", "isActive", "sortOrder",
      "priorityListing", "premiumProfile", "featuredProfile",
      "higherDealLimits", "prioritySupport", "advancedAnalytics",
      "customProfileBanner", "featuredSellerStatus", "featuredBuyerStatus",
      "fasterDisputeResolution", "profileVerification", "vipSupport",
      "maximumVisibility", "exclusiveFeatures",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const plan = await db.subscriptionPlan.update({
      where: { id },
      data: updateData,
    });

    // Log admin action
    await db.adminLog.create({
      data: {
        userId: adminId,
        action: "subscription_plan_updated",
        details: `Subscription plan "${plan.name}" (${plan.slug}) updated`,
      },
    });

    return NextResponse.json({
      plan,
      message: "সাবস্ক্রিপশন প্ল্যান সফলভাবে আপডেট হয়েছে",
    });
  } catch (error) {
    console.error("Update subscription plan error:", error);
    return NextResponse.json(
      { error: "সাবস্ক্রিপশন প্ল্যান আপডেট করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}

// DELETE /api/subscriptions/plans/[id] - Delete a subscription plan (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json(
        { error: "অ্যাডমিন অনুমতি আবশ্যক" },
        { status: 403 }
      );
    }

    const adminId = (session.user as { id: string }).id;
    const { id } = await params;

    // Check plan exists
    const existingPlan = await db.subscriptionPlan.findUnique({
      where: { id },
    });

    if (!existingPlan) {
      return NextResponse.json(
        { error: "সাবস্ক্রিপশন প্ল্যান পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    // Check if plan has any active subscriptions
    const activeSubscriptions = await db.userSubscription.findFirst({
      where: {
        planId: id,
        status: { in: ["active", "pending"] },
      },
    });

    if (activeSubscriptions) {
      return NextResponse.json(
        { error: "এই প্ল্যানে সক্রিয় সাবস্ক্রিপশন আছে, মুছে ফেলা সম্ভব নয়" },
        { status: 400 }
      );
    }

    // Delete the plan
    await db.subscriptionPlan.delete({
      where: { id },
    });

    // Log admin action
    await db.adminLog.create({
      data: {
        userId: adminId,
        action: "subscription_plan_deleted",
        details: `Subscription plan "${existingPlan.name}" (${existingPlan.slug}) deleted`,
      },
    });

    return NextResponse.json({
      message: "সাবস্ক্রিপশন প্ল্যান সফলভাবে মুছে ফেলা হয়েছে",
    });
  } catch (error) {
    console.error("Delete subscription plan error:", error);
    return NextResponse.json(
      { error: "সাবস্ক্রিপশন প্ল্যান মুছে ফেলতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}
