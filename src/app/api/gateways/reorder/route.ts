import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helper";

// PUT /api/gateways/reorder - Reorder gateways (admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json(
        { error: "অ্যাডমিন অনুমতি আবশ্যক" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { orders } = body;

    if (!orders || !Array.isArray(orders)) {
      return NextResponse.json(
        { error: "ক্রম তথ্য অবশ্যই একটি অ্যারে হতে হবে" },
        { status: 400 }
      );
    }

    // Update sortOrder for each gateway
    const updatePromises = orders.map(
      (item: { id: string; sortOrder: number }) =>
        db.paymentGateway.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        })
    );

    await Promise.all(updatePromises);

    return NextResponse.json({
      message: "গেটওয়ে ক্রম আপডেট হয়েছে",
    });
  } catch (error) {
    console.error("Reorder gateways error:", error);
    return NextResponse.json(
      { error: "গেটওয়ে ক্রম আপডেট করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}
