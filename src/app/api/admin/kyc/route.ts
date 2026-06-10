import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helper";

// GET /api/admin/kyc - Get all KYC submissions (with optional status filter). Admin only.
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
    const status = searchParams.get("status") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: {
      status?: string;
    } = {};

    if (status && status !== "all") {
      const validStatuses = ["pending", "approved", "rejected"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          {
            error:
              "অবৈধ স্ট্যাটাস ফিল্টার। সমর্থিত মান: pending, approved, rejected",
          },
          { status: 400 }
        );
      }
      whereClause.status = status;
    }

    const [submissions, total] = await Promise.all([
      db.kYCVerification.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              username: true,
              avatar: true,
              phone: true,
              isVerified: true,
              verificationStatus: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: { submittedAt: "desc" },
        skip,
        take: limit,
      }),
      db.kYCVerification.count({ where: whereClause }),
    ]);

    // Calculate summary counts
    const [pendingCount, approvedCount, rejectedCount, totalCount] =
      await Promise.all([
        db.kYCVerification.count({ where: { status: "pending" } }),
        db.kYCVerification.count({ where: { status: "approved" } }),
        db.kYCVerification.count({ where: { status: "rejected" } }),
        db.kYCVerification.count(),
      ]);

    return NextResponse.json({
      submissions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        total: totalCount,
      },
    });
  } catch (error) {
    console.error("Get admin KYC submissions error:", error);
    return NextResponse.json(
      { error: "KYC জমা তালিকা লোড করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}
