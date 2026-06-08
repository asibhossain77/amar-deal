import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helper";

// GET /api/subscriptions/manage - Get current user's subscription status
export async function GET() {
  try {
    const session = await requireAuth();
    if (!session) {
      return NextResponse.json(
        { error: "লগইন আবশ্যক" },
        { status: 401 }
      );
    }

    const userId = (session.user as { id: string }).id;

    // Get user with current subscription
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          include: { plan: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "ব্যবহারকারী পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    // Get current active subscription
    let subscription: Awaited<ReturnType<typeof db.userSubscription.findUnique>> = null;
    let plan: Awaited<ReturnType<typeof db.subscriptionPlan.findUnique>> = null;

    if (user.currentSubscriptionId) {
      subscription = await db.userSubscription.findUnique({
        where: { id: user.currentSubscriptionId },
      });
      if (subscription) {
        plan = await db.subscriptionPlan.findUnique({
          where: { id: subscription.planId },
        });
      }
    }

    // Get subscription history (all subscriptions)
    const history = user.subscriptions.map((sub) => ({
      id: sub.id,
      status: sub.status,
      billingCycle: sub.billingCycle,
      startDate: sub.startDate,
      endDate: sub.endDate,
      autoRenew: sub.autoRenew,
      cancelledAt: sub.cancelledAt,
      createdAt: sub.createdAt,
      plan: sub.plan
        ? {
            id: sub.plan.id,
            name: sub.plan.name,
            slug: sub.plan.slug,
            badgeIcon: sub.plan.badgeIcon,
            badgeColor: sub.plan.badgeColor,
          }
        : null,
    }));

    return NextResponse.json({
      subscription,
      plan,
      history,
    });
  } catch (error) {
    console.error("Get subscription status error:", error);
    return NextResponse.json(
      { error: "সাবস্ক্রিপশন তথ্য লোড করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}

// POST /api/subscriptions/manage - Subscribe to a plan
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) {
      return NextResponse.json(
        { error: "লগইন আবশ্যক" },
        { status: 401 }
      );
    }

    const userId = (session.user as { id: string }).id;
    const body = await request.json();
    const { planId, billingCycle, paymentMethod, transactionRef } = body;

    if (!planId) {
      return NextResponse.json(
        { error: "প্ল্যান আইডি আবশ্যক" },
        { status: 400 }
      );
    }

    if (!billingCycle || !["monthly", "yearly"].includes(billingCycle)) {
      return NextResponse.json(
        { error: "বিলিং সাইকেল অবশ্যই 'monthly' বা 'yearly' হতে হবে" },
        { status: 400 }
      );
    }

    // Check plan exists and is active
    const plan = await db.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan || !plan.isActive) {
      return NextResponse.json(
        { error: "সাবস্ক্রিপশন প্ল্যান পাওয়া যায়নি বা নিষ্ক্রিয়" },
        { status: 404 }
      );
    }

    // Calculate end date
    const now = new Date();
    let endDate: Date | null = null;
    const isFreePlan = plan.monthlyPrice === 0 && plan.yearlyPrice === 0;

    if (!isFreePlan) {
      if (billingCycle === "monthly") {
        endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      } else {
        endDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      }
    }

    // Create subscription
    const subscription = await db.userSubscription.create({
      data: {
        userId,
        planId,
        status: "active",
        billingCycle,
        startDate: now,
        endDate,
        autoRenew: !isFreePlan,
        paymentMethod: paymentMethod || null,
        transactionRef: transactionRef || null,
      },
    });

    // Update user's current subscription
    await db.user.update({
      where: { id: userId },
      data: { currentSubscriptionId: subscription.id },
    });

    return NextResponse.json({
      subscription,
      message: isFreePlan
        ? "ফ্রি প্ল্যানে সফলভাবে সাবস্ক্রাইব করা হয়েছে"
        : "সাবস্ক্রিপশন সফলভাবে সম্পন্ন হয়েছে",
    });
  } catch (error) {
    console.error("Subscribe error:", error);
    return NextResponse.json(
      { error: "সাবস্ক্রিপশন করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}

// PUT /api/subscriptions/manage - Cancel/renew subscription
export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) {
      return NextResponse.json(
        { error: "লগইন আবশ্যক" },
        { status: 401 }
      );
    }

    const userId = (session.user as { id: string }).id;
    const body = await request.json();
    const { action } = body;

    if (!action || !["cancel", "renew"].includes(action)) {
      return NextResponse.json(
        { error: "অ্যাকশন অবশ্যই 'cancel' বা 'renew' হতে হবে" },
        { status: 400 }
      );
    }

    // Get user with current subscription
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.currentSubscriptionId) {
      return NextResponse.json(
        { error: "কোনো সক্রিয় সাবস্ক্রিপশন নেই" },
        { status: 404 }
      );
    }

    const subscription = await db.userSubscription.findUnique({
      where: { id: user.currentSubscriptionId },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "সাবস্ক্রিপশন পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    if (action === "cancel") {
      const updatedSubscription = await db.userSubscription.update({
        where: { id: subscription.id },
        data: {
          status: "cancelled",
          cancelledAt: new Date(),
          autoRenew: false,
        },
      });

      return NextResponse.json({
        subscription: updatedSubscription,
        message: "সাবস্ক্রিপশন সফলভাবে বাতিল করা হয়েছে",
      });
    } else {
      // renew
      const updatedSubscription = await db.userSubscription.update({
        where: { id: subscription.id },
        data: {
          autoRenew: true,
        },
      });

      return NextResponse.json({
        subscription: updatedSubscription,
        message: "সাবস্ক্রিপশন সফলভাবে পুনর্নবীকরণ করা হয়েছে",
      });
    }
  } catch (error) {
    console.error("Subscription action error:", error);
    return NextResponse.json(
      { error: "সাবস্ক্রিপশন আপডেট করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}
