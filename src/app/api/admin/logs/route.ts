import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helper";

// GET /api/admin/logs - List admin activity logs (admin only)
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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const action = searchParams.get("action") || undefined;
    const skip = (page - 1) * limit;

    const whereClause: {
      action?: string;
    } = {};

    if (action) {
      whereClause.action = action;
    }

    const [logs, total] = await Promise.all([
      db.adminLog.findMany({
        where: whereClause,
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.adminLog.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get admin logs error:", error);
    return NextResponse.json(
      { error: "অ্যাডমিন লগ লোড করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}
