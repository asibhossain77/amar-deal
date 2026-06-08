import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helper";
import bcrypt from "bcryptjs";

// PUT /api/account/security - Security operations
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

    if (!action) {
      return NextResponse.json(
        { error: "অ্যাকশন আবশ্যক" },
        { status: 400 }
      );
    }

    // Get current user
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "ব্যবহারকারী পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    if (action === "changePassword") {
      const { currentPassword, newPassword } = body;

      if (!currentPassword || !newPassword) {
        return NextResponse.json(
          { error: "বর্তমান পাসওয়ার্ড এবং নতুন পাসওয়ার্ড আবশ্যক" },
          { status: 400 }
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: "নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে" },
          { status: 400 }
        );
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: "বর্তমান পাসওয়ার্ড সঠিক নয়" },
          { status: 400 }
        );
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await db.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      return NextResponse.json({
        message: "পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে",
      });
    } else if (action === "changeEmail") {
      const { newEmail, password } = body;

      if (!newEmail || !password) {
        return NextResponse.json(
          { error: "নতুন ইমেইল এবং পাসওয়ার্ড আবশ্যক" },
          { status: 400 }
        );
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: "পাসওয়ার্ড সঠিক নয়" },
          { status: 400 }
        );
      }

      // Check email uniqueness
      const existingUser = await db.user.findFirst({
        where: {
          email: newEmail,
          NOT: { id: userId },
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "এই ইমেইল ইতিমধ্যে ব্যবহৃত হচ্ছে" },
          { status: 400 }
        );
      }

      await db.user.update({
        where: { id: userId },
        data: { email: newEmail },
      });

      return NextResponse.json({
        message: "ইমেইল সফলভাবে পরিবর্তন হয়েছে",
      });
    } else if (action === "changePhone") {
      const { newPhone } = body;

      if (!newPhone) {
        return NextResponse.json(
          { error: "নতুন ফোন নম্বর আবশ্যক" },
          { status: 400 }
        );
      }

      await db.user.update({
        where: { id: userId },
        data: { phone: newPhone },
      });

      return NextResponse.json({
        message: "ফোন নম্বর সফলভাবে পরিবর্তন হয়েছে",
      });
    } else {
      return NextResponse.json(
        { error: "অবৈধ অ্যাকশন" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Security action error:", error);
    return NextResponse.json(
      { error: "নিরাপত্তা সেটিং আপডেট করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}
