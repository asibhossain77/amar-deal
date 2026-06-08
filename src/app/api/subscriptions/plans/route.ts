import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/subscriptions/plans - List all active subscription plans
export async function GET() {
  try {
    const plans = await db.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ plans });
  } catch (error) {
    console.error("Get subscription plans error:", error);
    return NextResponse.json(
      { error: "সাবস্ক্রিপশন প্ল্যান লোড করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}
