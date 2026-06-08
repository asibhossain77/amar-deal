import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helper";

// GET /api/gateways - List payment gateways
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isAdminRequest = searchParams.get("admin") === "true";

    let showAll = false;

    if (isAdminRequest) {
      const session = await requireAdmin();
      if (!session) {
        return NextResponse.json(
          { error: "অ্যাডমিন অনুমতি আবশ্যক" },
          { status: 403 }
        );
      }
      showAll = true;
    }

    const whereClause: any = {};
    if (!showAll) {
      whereClause.isActive = true;
    }

    const gateways = await db.paymentGateway.findMany({
      where: whereClause,
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ gateways });
  } catch (error) {
    console.error("Get gateways error:", error);
    return NextResponse.json(
      { error: "গেটওয়ে লোড করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}

// POST /api/gateways - Create a new payment gateway (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json(
        { error: "অ্যাডমিন অনুমতি আবশ্যক" },
        { status: 403 }
      );
    }

    const adminId = (session.user as { id: string }).id;
    const body = await request.json();
    const {
      name,
      slug,
      logo,
      accountType,
      accountNumber,
      accountName,
      instructions,
      minDeposit,
      maxDeposit,
      isActive,
      sortOrder,
      themeEnabled,
      primaryColor,
      buttonColor,
      borderColor,
      backgroundColor,
    } = body;

    // Validate required fields
    if (!name || !slug || !accountType || !accountNumber || !accountName) {
      return NextResponse.json(
        {
          error: "নাম, স্লাগ, অ্যাকাউন্ট টাইপ, অ্যাকাউন্ট নম্বর এবং অ্যাকাউন্ট নাম আবশ্যক",
        },
        { status: 400 }
      );
    }

    // Check slug uniqueness
    const existingGateway = await db.paymentGateway.findUnique({
      where: { slug },
    });

    if (existingGateway) {
      return NextResponse.json(
        { error: "এই স্লাগ ইতিমধ্যে ব্যবহৃত হচ্ছে" },
        { status: 400 }
      );
    }

    const gateway = await db.paymentGateway.create({
      data: {
        name,
        slug,
        logo: logo || null,
        accountType,
        accountNumber,
        accountName,
        instructions: instructions || null,
        minDeposit: minDeposit !== undefined ? minDeposit : 0,
        maxDeposit: maxDeposit !== undefined ? maxDeposit : 999999,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder !== undefined ? sortOrder : 0,
        themeEnabled: themeEnabled !== undefined ? themeEnabled : true,
        primaryColor: primaryColor || "#6BBF59",
        buttonColor: buttonColor || "#6BBF59",
        borderColor: borderColor || "#6BBF59",
        backgroundColor: backgroundColor || "#f0f7ee",
      },
    });

    // Log admin action
    await db.adminLog.create({
      data: {
        userId: adminId,
        action: "gateway_created",
        details: `Payment gateway "${name}" (${slug}) created`,
      },
    });

    return NextResponse.json(
      {
        gateway,
        message: "পেমেন্ট গেটওয়ে সফলভাবে তৈরি হয়েছে",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create gateway error:", error);
    return NextResponse.json(
      { error: "পেমেন্ট গেটওয়ে তৈরি করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}
