import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helper";

// POST /api/users - Register a new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, password, phone } = body;

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: "ইমেইল, নাম এবং পাসওয়ার্ড আবশ্যক" },
        { status: 400 }
      );
    }

    // Check email uniqueness
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "এই ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট আছে" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await db.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        phone: phone || null,
      },
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json(
      { user: userWithoutPassword, message: "সফলভাবে নিবন্ধিত হয়েছে" },
      { status: 201 }
    );
  } catch (error) {
    console.error("User registration error:", error);
    return NextResponse.json(
      { error: "নিবন্ধনে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}

// GET /api/users - Get current user profile
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

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        phone: true,
        avatar: true,
        role: true,
        country: true,
        languagePreference: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        buyerRating: true,
        sellerRating: true,
        totalReviews: true,
        completedDeals: true,
        successfulTransactions: true,
        trustScore: true,
        disputeRate: true,
        buyerReviewCount: true,
        sellerReviewCount: true,
        verificationStatus: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "ব্যবহারকারী পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Get user profile error:", error);
    return NextResponse.json(
      { error: "প্রোফাইল লোড করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}
