import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, requireAuth } from "@/lib/auth-helper";

const DEFAULT_THEME = {
  primaryColor: "#6BBF59",
  buttonColor: "#6BBF59",
  borderColor: "#6BBF59",
  backgroundColor: "#f0f7ee",
};

// GET /api/gateway-theme — Public: get current gateway theme settings
export async function GET() {
  try {
    let theme = await db.paymentGatewayTheme.findUnique({
      where: { id: "gateway-theme-singleton" },
    });

    // If no theme exists yet, create one with defaults
    if (!theme) {
      theme = await db.paymentGatewayTheme.create({
        data: {
          id: "gateway-theme-singleton",
          ...DEFAULT_THEME,
        },
      });
    }

    return NextResponse.json({
      theme: {
        primaryColor: theme.primaryColor,
        buttonColor: theme.buttonColor,
        borderColor: theme.borderColor,
        backgroundColor: theme.backgroundColor,
        updatedAt: theme.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get gateway theme error:", error);
    // Return defaults on error so the UI always works
    return NextResponse.json({ theme: DEFAULT_THEME });
  }
}

// PUT /api/gateway-theme — Admin: update gateway theme settings
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

    // Validate hex colors
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;

    const allowedFields = ["primaryColor", "buttonColor", "borderColor", "backgroundColor"];
    const updates: Record<string, string> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (typeof body[field] === "string" && hexRegex.test(body[field])) {
          updates[field] = body[field];
        } else {
          return NextResponse.json(
            { error: `${field} সঠিক HEX কালার ফরম্যাটে দিন (যেমন: #6BBF59)` },
            { status: 400 }
          );
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "আপডেট করার জন্য কোনো তথ্য দেওয়া হয়নি" },
        { status: 400 }
      );
    }

    const theme = await db.paymentGatewayTheme.upsert({
      where: { id: "gateway-theme-singleton" },
      update: updates,
      create: {
        id: "gateway-theme-singleton",
        ...DEFAULT_THEME,
        ...updates,
      },
    });

    // Log admin action
    await db.adminLog.create({
      data: {
        userId: adminId,
        action: "gateway_theme_updated",
        details: `Payment gateway theme updated: ${JSON.stringify(updates)}`,
      },
    });

    return NextResponse.json({
      message: "গেটওয়ে থিম সফলভাবে আপডেট হয়েছে",
      theme: {
        primaryColor: theme.primaryColor,
        buttonColor: theme.buttonColor,
        borderColor: theme.borderColor,
        backgroundColor: theme.backgroundColor,
        updatedAt: theme.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update gateway theme error:", error);
    return NextResponse.json(
      { error: "গেটওয়ে থিম আপডেট করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}
