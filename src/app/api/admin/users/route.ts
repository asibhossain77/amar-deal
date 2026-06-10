import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, requireAuth } from "@/lib/auth-helper";

// GET /api/admin/users - List all users (admin only)
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || undefined;
    const role = searchParams.get("role") || undefined;
    const skip = (page - 1) * limit;

    const whereClause: {
      OR?: Array<{ name: { contains: string } } | { email: { contains: string } }>;
      role?: string;
    } = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (role) {
      whereClause.role = role;
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where: whereClause,
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
          _count: {
            select: {
              buyerTransactions: true,
              sellerTransactions: true,
              payments: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.user.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get admin users error:", error);
    return NextResponse.json(
      { error: "ব্যবহারকারী তালিকা লোড করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users - Toggle user active status (admin only)
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
    const { userId, isActive } = body;

    if (!userId || isActive === undefined) {
      return NextResponse.json(
        { error: "ব্যবহারকারী আইডি এবং সক্রিয় স্ট্যাটাস আবশ্যক" },
        { status: 400 }
      );
    }

    const targetUser = await db.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "ব্যবহারকারী পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    // Prevent admin from deactivating themselves
    if (userId === adminId) {
      return NextResponse.json(
        { error: "আপনি নিজের অ্যাকাউন্ট নিষ্ক্রিয় করতে পারবেন না" },
        { status: 400 }
      );
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { isActive },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    // Log admin action
    await db.adminLog.create({
      data: {
        userId: adminId,
        action: isActive ? "user_activated" : "user_deactivated",
        details: `User "${targetUser.name}" (${targetUser.email}) ${isActive ? "activated" : "deactivated"}`,
      },
    });

    return NextResponse.json({
      user: updatedUser,
      message: isActive
        ? "ব্যবহারকারী সক্রিয় করা হয়েছে"
        : "ব্যবহারকারী নিষ্ক্রিয় করা হয়েছে",
    });
  } catch (error) {
    console.error("Toggle user status error:", error);
    return NextResponse.json(
      { error: "ব্যবহারকারী স্ট্যাটাস আপডেট করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}
