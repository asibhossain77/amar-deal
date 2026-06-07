import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helper";

// GET /api/notifications - List notifications for current user
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) {
      return NextResponse.json(
        { error: "প্রমাণীকরণ আবশ্যক" },
        { status: 401 }
      );
    }

    const userId = (session.user as { id: string }).id;
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const type = searchParams.get("type") || undefined;
    const unreadOnly = searchParams.get("unread") === "true";
    const skip = (page - 1) * limit;

    const whereClause: {
      userId: string;
      type?: string;
      isRead?: boolean;
    } = {
      userId,
    };

    if (type) {
      whereClause.type = type;
    }

    if (unreadOnly) {
      whereClause.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      db.notification.findMany({
        where: whereClause,
        include: {
          transaction: {
            select: { id: true, title: true, status: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.notification.count({ where: whereClause }),
      db.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return NextResponse.json({
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    return NextResponse.json(
      { error: "বিজ্ঞপ্তি লোড করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}

// PUT /api/notifications - Mark notifications as read
export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) {
      return NextResponse.json(
        { error: "প্রমাণীকরণ আবশ্যক" },
        { status: 401 }
      );
    }

    const userId = (session.user as { id: string }).id;
    const body = await request.json();
    const { notificationIds, markAll } = body;

    if (markAll) {
      // Mark all notifications as read
      await db.notification.updateMany({
        where: {
          userId,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });

      return NextResponse.json({
        message: "সকল বিজ্ঞপ্তি পড়া হিসেবে চিহ্নিত হয়েছে",
      });
    }

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json(
        { error: "বিজ্ঞপ্তি আইডি আবশ্যক" },
        { status: 400 }
      );
    }

    // Mark specific notifications as read
    await db.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId, // Ensure user can only mark their own notifications
      },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json({
      message: "বিজ্ঞপ্তি সফলভাবে পড়া হিসেবে চিহ্নিত হয়েছে",
    });
  } catch (error) {
    console.error("Mark notifications error:", error);
    return NextResponse.json(
      { error: "বিজ্ঞপ্তি আপডেট করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}
