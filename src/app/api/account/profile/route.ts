import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helper";

// GET /api/account/profile - Get full profile info
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

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        phone: true,
        role: true,
        avatar: true,
        country: true,
        languagePreference: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        buyerRating: true,
        sellerRating: true,
        totalReviews: true,
        completedDeals: true,
        successfulTransactions: true,
        trustScore: true,
        disputeRate: true,
        isVerified: true,
        currentSubscriptionId: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "ব্যবহারকারী পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    // Get current subscription and plan
    let subscription = null;
    let plan = null;

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

    // Build reputation object
    const reputation = {
      buyerRating: user.buyerRating,
      sellerRating: user.sellerRating,
      totalReviews: user.totalReviews,
      completedDeals: user.completedDeals,
      successfulTransactions: user.successfulTransactions,
      trustScore: user.trustScore,
      disputeRate: user.disputeRate,
      isVerified: user.isVerified,
    };

    return NextResponse.json({
      user,
      reputation,
      subscription,
      plan,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { error: "প্রোফাইল লোড করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}

// PUT /api/account/profile - Update profile info
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
    const { name, phone, username, country, languagePreference, avatar } = body;

    // Validate username uniqueness if changing
    if (username) {
      const existingUser = await db.user.findFirst({
        where: {
          username,
          NOT: { id: userId },
        },
      });
      if (existingUser) {
        return NextResponse.json(
          { error: "এই ইউজারনেম ইতিমধ্যে ব্যবহৃত হচ্ছে" },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (username !== undefined) updateData.username = username;
    if (country !== undefined) updateData.country = country;
    if (languagePreference !== undefined) updateData.languagePreference = languagePreference;
    if (avatar !== undefined) updateData.avatar = avatar;

    const user = await db.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        phone: true,
        role: true,
        avatar: true,
        country: true,
        languagePreference: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      user,
      message: "প্রোফাইল সফলভাবে আপডেট হয়েছে",
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "প্রোফাইল আপডেট করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}
