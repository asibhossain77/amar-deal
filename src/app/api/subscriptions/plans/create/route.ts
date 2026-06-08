import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helper";

// POST /api/subscriptions/plans/create - Create a new subscription plan (admin only)
export async function POST(request: NextRequest) {
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
    const {
      name,
      slug,
      description,
      badgeIcon,
      badgeColor,
      monthlyPrice,
      yearlyPrice,
      isActive,
      sortOrder,
      priorityListing,
      premiumProfile,
      featuredProfile,
      higherDealLimits,
      prioritySupport,
      advancedAnalytics,
      customProfileBanner,
      featuredSellerStatus,
      featuredBuyerStatus,
      fasterDisputeResolution,
      profileVerification,
      vipSupport,
      maximumVisibility,
      exclusiveFeatures,
    } = body;

    // Validate required fields
    if (!name || !slug || !description || !badgeIcon || !badgeColor) {
      return NextResponse.json(
        { error: "নাম, স্লাগ, বিবরণ, ব্যাজ আইকন এবং ব্যাজ রঙ আবশ্যক" },
        { status: 400 }
      );
    }

    // Check slug uniqueness
    const existingPlan = await db.subscriptionPlan.findUnique({
      where: { slug },
    });

    if (existingPlan) {
      return NextResponse.json(
        { error: "এই স্লাগ ইতিমধ্যে ব্যবহৃত হচ্ছে" },
        { status: 400 }
      );
    }

    const plan = await db.subscriptionPlan.create({
      data: {
        name,
        slug,
        description,
        badgeIcon,
        badgeColor,
        monthlyPrice: monthlyPrice !== undefined ? monthlyPrice : 0,
        yearlyPrice: yearlyPrice !== undefined ? yearlyPrice : 0,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder !== undefined ? sortOrder : 0,
        priorityListing: priorityListing || false,
        premiumProfile: premiumProfile || false,
        featuredProfile: featuredProfile || false,
        higherDealLimits: higherDealLimits || false,
        prioritySupport: prioritySupport || false,
        advancedAnalytics: advancedAnalytics || false,
        customProfileBanner: customProfileBanner || false,
        featuredSellerStatus: featuredSellerStatus || false,
        featuredBuyerStatus: featuredBuyerStatus || false,
        fasterDisputeResolution: fasterDisputeResolution || false,
        profileVerification: profileVerification || false,
        vipSupport: vipSupport || false,
        maximumVisibility: maximumVisibility || false,
        exclusiveFeatures: exclusiveFeatures || false,
      },
    });

    // Log admin action
    await db.adminLog.create({
      data: {
        userId: adminId,
        action: "subscription_plan_created",
        details: `Subscription plan "${name}" (${slug}) created`,
      },
    });

    return NextResponse.json(
      {
        plan,
        message: "সাবস্ক্রিপশন প্ল্যান সফলভাবে তৈরি হয়েছে",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create subscription plan error:", error);
    return NextResponse.json(
      { error: "সাবস্ক্রিপশন প্ল্যান তৈরি করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}
