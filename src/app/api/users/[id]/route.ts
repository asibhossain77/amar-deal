import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helper";

// PUT /api/users/[id] - Update user profile
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    if (!session) {
      return NextResponse.json(
        { error: "প্রমাণীকরণ আবশ্যক" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const userId = (session.user as { id: string }).id;

    // Users can only update their own profile
    if (id !== userId) {
      return NextResponse.json(
        { error: "আপনি শুধুমাত্র নিজের প্রোফাইল আপডেট করতে পারেন" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, phone, avatar } = body;

    const updateData: { name?: string; phone?: string; avatar?: string } = {};

    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (avatar !== undefined) updateData.avatar = avatar;

    const updatedUser = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      user: updatedUser,
      message: "প্রোফাইল সফলভাবে আপডেট হয়েছে",
    });
  } catch (error) {
    console.error("Update user profile error:", error);
    return NextResponse.json(
      { error: "প্রোফাইল আপডেট করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}
