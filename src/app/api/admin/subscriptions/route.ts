import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helper";

// GET /api/admin/subscriptions - Get all subscriptions with user and plan details
export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json(
        { error: "অ্যাডমিন অনুমতি আবশ্যক" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");

    const whereClause: Record<string, unknown> = {};
    if (statusFilter) {
      whereClause.status = statusFilter;
    }

    const subscriptions = await db.userSubscription.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          },
        },
        plan: {
          select: {
            id: true,
            name: true,
            slug: true,
            badgeIcon: true,
            badgeColor: true,
            monthlyPrice: true,
            yearlyPrice: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error("Get admin subscriptions error:", error);
    return NextResponse.json(
      { error: "সাবস্ক্রিপশন তালিকা লোড করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}
