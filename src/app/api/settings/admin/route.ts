import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, requireAuth } from "@/lib/auth-helper";

// PUT /api/settings/admin - Update payment account settings (admin only)
export async function PUT(request: NextRequest) {
  try {
    const authSession = await requireAuth();
    if (!authSession) {
      return NextResponse.json(
        { error: "প্রমাণীকরণ আবশ্যক" },
        { status: 401 }
      );
    }

    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json(
        { error: "অ্যাডমিন অনুমতি আবশ্যক" },
        { status: 403 }
      );
    }

    const adminId = (session.user as { id: string }).id;
    const body = await request.json();

    const allowedKeys = [
      'bkash_account', 'bkash_account_name',
      'nagad_account', 'nagad_account_name',
      'rocket_account', 'rocket_account_name',
      'bank_name', 'bank_account', 'bank_account_name',
      'bank_branch', 'bank_routing',
    ];

    for (const [key, value] of Object.entries(body)) {
      if (allowedKeys.includes(key) && typeof value === 'string') {
        await db.siteSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        });
      }
    }

    // Log admin action
    await db.adminLog.create({
      data: {
        userId: adminId,
        action: "settings_updated",
        details: "Payment account settings updated",
      },
    });

    return NextResponse.json({ message: "সেটিংস সফলভাবে আপডেট হয়েছে" });
  } catch (error) {
    console.error("Update settings error:", error);
    return NextResponse.json(
      { error: "সেটিংস আপডেট করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}
