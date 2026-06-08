import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helper";

// GET /api/admin/badges - Get badge overview with subscriber counts
export async function GET() {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json(
        { error: "অ্যাডমিন অনুমতি আবশ্যক" },
        { status: 403 }
      );
    }

    const plans = await db.subscriptionPlan.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        subscriptions: {
          where: { status: "active" },
          select: { id: true },
        },
      },
    });

    const plansWithCounts = plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      description: plan.description,
      badgeIcon: plan.badgeIcon,
      badgeColor: plan.badgeColor,
      monthlyPrice: plan.monthlyPrice,
      yearlyPrice: plan.yearlyPrice,
      isActive: plan.isActive,
      sortOrder: plan.sortOrder,
      subscriberCount: plan.subscriptions.length,
      priorityListing: plan.priorityListing,
      premiumProfile: plan.premiumProfile,
      featuredProfile: plan.featuredProfile,
      higherDealLimits: plan.higherDealLimits,
      prioritySupport: plan.prioritySupport,
      advancedAnalytics: plan.advancedAnalytics,
      customProfileBanner: plan.customProfileBanner,
      featuredSellerStatus: plan.featuredSellerStatus,
      featuredBuyerStatus: plan.featuredBuyerStatus,
      fasterDisputeResolution: plan.fasterDisputeResolution,
      profileVerification: plan.profileVerification,
      vipSupport: plan.vipSupport,
      maximumVisibility: plan.maximumVisibility,
      exclusiveFeatures: plan.exclusiveFeatures,
      createdAt: plan.createdAt,
    }));

    return NextResponse.json({ plans: plansWithCounts });
  } catch (error) {
    console.error("Get admin badges error:", error);
    return NextResponse.json(
      { error: "ব্যাজ তথ্য লোড করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/badges - Manually assign/revoke badge/subscription
export async function PUT(request: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json(
        { error: "অ্যাডমিন অনুমতি আবশ্যক" },
        { status: 403 }
      );
    }

    const adminId = (session.user as { id: string }).id;
    const body = await request.json();
    const { userId, planId, action } = body;

    if (!userId || !planId || !action) {
      return NextResponse.json(
        { error: "ব্যবহারকারী আইডি, প্ল্যান আইডি এবং অ্যাকশন আবশ্যক" },
        { status: 400 }
      );
    }

    if (!["assign", "revoke"].includes(action)) {
      return NextResponse.json(
        { error: "অ্যাকশন অবশ্যই 'assign' বা 'revoke' হতে হবে" },
        { status: 400 }
      );
    }

    // Check user exists
    const targetUser = await db.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "ব্যবহারকারী পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    // Check plan exists
    const plan = await db.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return NextResponse.json(
        { error: "সাবস্ক্রিপশন প্ল্যান পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    if (action === "assign") {
      // Check if user already has an active subscription for this plan
      const existingSubscription = await db.userSubscription.findFirst({
        where: {
          userId,
          planId,
          status: "active",
        },
      });

      if (existingSubscription) {
        return NextResponse.json(
          { error: "ব্যবহারকারীর ইতিমধ্যে এই প্ল্যানে সক্রিয় সাবস্ক্রিপশন আছে" },
          { status: 400 }
        );
      }

      // Create subscription (admin assigned, so it's permanent/free)
      const isFreePlan = plan.monthlyPrice === 0 && plan.yearlyPrice === 0;
      const subscription = await db.userSubscription.create({
        data: {
          userId,
          planId,
          status: "active",
          billingCycle: "monthly",
          startDate: new Date(),
          endDate: isFreePlan ? null : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          autoRenew: false,
          paymentMethod: "admin_assigned",
        },
      });

      // Update user's current subscription
      await db.user.update({
        where: { id: userId },
        data: { currentSubscriptionId: subscription.id },
      });

      // Log admin action
      await db.adminLog.create({
        data: {
          userId: adminId,
          action: "badge_assigned",
          details: `Badge/subscription "${plan.name}" assigned to user "${targetUser.name}" (${targetUser.email})`,
        },
      });

      return NextResponse.json({
        message: `${plan.name} ব্যাজ সফলভাবে বরাদ্দ করা হয়েছে`,
      });
    } else {
      // revoke
      // Find active subscription for this plan
      const activeSubscription = await db.userSubscription.findFirst({
        where: {
          userId,
          planId,
          status: "active",
        },
      });

      if (!activeSubscription) {
        return NextResponse.json(
          { error: "এই প্ল্যানে কোনো সক্রিয় সাবস্ক্রিপশন নেই" },
          { status: 404 }
        );
      }

      // Cancel the subscription
      await db.userSubscription.update({
        where: { id: activeSubscription.id },
        data: {
          status: "cancelled",
          cancelledAt: new Date(),
          autoRenew: false,
        },
      });

      // Clear user's current subscription if it was this one
      if (targetUser.currentSubscriptionId === activeSubscription.id) {
        await db.user.update({
          where: { id: userId },
          data: { currentSubscriptionId: null },
        });
      }

      // Log admin action
      await db.adminLog.create({
        data: {
          userId: adminId,
          action: "badge_revoked",
          details: `Badge/subscription "${plan.name}" revoked from user "${targetUser.name}" (${targetUser.email})`,
        },
      });

      return NextResponse.json({
        message: `${plan.name} ব্যাজ সফলভাবে বাতিল করা হয়েছে`,
      });
    }
  } catch (error) {
    console.error("Admin badge action error:", error);
    return NextResponse.json(
      { error: "ব্যাজ আপডেট করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}
