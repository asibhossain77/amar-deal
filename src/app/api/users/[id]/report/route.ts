import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helper";

// POST /api/users/[id]/report - Report a user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    if (!session) {
      return NextResponse.json(
        { error: "লগইন আবশ্যক" },
        { status: 401 }
      );
    }

    const currentUserId = (session.user as { id: string }).id;
    const { id: reportedUserId } = await params;

    // Can't report yourself
    if (currentUserId === reportedUserId) {
      return NextResponse.json(
        { error: "আপনি নিজেকে রিপোর্ট করতে পারবেন না" },
        { status: 400 }
      );
    }

    // Check if target user exists
    const targetUser = await db.user.findUnique({ where: { id: reportedUserId } });
    if (!targetUser) {
      return NextResponse.json(
        { error: "ব্যবহারকারী পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { reason, description } = body;

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { error: "রিপোর্টের কারণ দিতে হবে" },
        { status: 400 }
      );
    }

    // Check for duplicate pending reports
    const existingReport = await db.report.findFirst({
      where: {
        reporterId: currentUserId,
        reportedUserId: reportedUserId,
        status: "pending",
      },
    });

    if (existingReport) {
      return NextResponse.json(
        { error: "আপনি ইতিমধ্যে এই ব্যবহারকারীকে রিপোর্ট করেছেন। প্রশাসক শীঘ্রই পর্যালোচনা করবেন।" },
        { status: 400 }
      );
    }

    // Create the report
    const report = await db.report.create({
      data: {
        reporterId: currentUserId,
        reportedUserId: reportedUserId,
        reason: reason.trim(),
        description: description?.trim() || null,
        status: "pending",
      },
    });

    return NextResponse.json({
      report,
      message: "রিপোর্ট সফলভাবে জমা দেওয়া হয়েছে। প্রশাসক শীঘ্রই পর্যালোচনা করবেন।",
    });
  } catch (error) {
    console.error("Create report error:", error);
    return NextResponse.json(
      { error: "রিপোর্ট জমা দিতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}
