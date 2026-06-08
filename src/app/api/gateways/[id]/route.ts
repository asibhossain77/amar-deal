import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helper";

// PUT /api/gateways/[id] - Update a payment gateway (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json(
        { error: "অ্যাডমিন অনুমতি আবশ্যক" },
        { status: 403 }
      );
    }

    const adminId = (session.user as { id: string }).id;
    const { id } = await params;
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

    // Check gateway exists
    const existingGateway = await db.paymentGateway.findUnique({
      where: { id },
    });

    if (!existingGateway) {
      return NextResponse.json(
        { error: "পেমেন্ট গেটওয়ে পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    // If slug is being changed, check uniqueness
    if (slug && slug !== existingGateway.slug) {
      const slugConflict = await db.paymentGateway.findUnique({
        where: { slug },
      });
      if (slugConflict) {
        return NextResponse.json(
          { error: "এই স্লাগ ইতিমধ্যে ব্যবহৃত হচ্ছে" },
          { status: 400 }
        );
      }
    }

    // Build update data object with only provided fields
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (logo !== undefined) updateData.logo = logo;
    if (accountType !== undefined) updateData.accountType = accountType;
    if (accountNumber !== undefined) updateData.accountNumber = accountNumber;
    if (accountName !== undefined) updateData.accountName = accountName;
    if (instructions !== undefined) updateData.instructions = instructions;
    if (minDeposit !== undefined) updateData.minDeposit = minDeposit;
    if (maxDeposit !== undefined) updateData.maxDeposit = maxDeposit;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (themeEnabled !== undefined) updateData.themeEnabled = themeEnabled;
    if (primaryColor !== undefined) updateData.primaryColor = primaryColor;
    if (buttonColor !== undefined) updateData.buttonColor = buttonColor;
    if (borderColor !== undefined) updateData.borderColor = borderColor;
    if (backgroundColor !== undefined) updateData.backgroundColor = backgroundColor;

    const gateway = await db.paymentGateway.update({
      where: { id },
      data: updateData,
    });

    // Log admin action
    await db.adminLog.create({
      data: {
        userId: adminId,
        action: "gateway_updated",
        details: `Payment gateway "${gateway.name}" (${gateway.slug}) updated`,
      },
    });

    return NextResponse.json({
      gateway,
      message: "পেমেন্ট গেটওয়ে সফলভাবে আপডেট হয়েছে",
    });
  } catch (error) {
    console.error("Update gateway error:", error);
    return NextResponse.json(
      { error: "পেমেন্ট গেটওয়ে আপডেট করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}

// DELETE /api/gateways/[id] - Delete a payment gateway (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json(
        { error: "অ্যাডমিন অনুমতি আবশ্যক" },
        { status: 403 }
      );
    }

    const adminId = (session.user as { id: string }).id;
    const { id } = await params;

    // Check gateway exists
    const existingGateway = await db.paymentGateway.findUnique({
      where: { id },
    });

    if (!existingGateway) {
      return NextResponse.json(
        { error: "পেমেন্ট গেটওয়ে পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    // Check if gateway has any pending transactions
    const pendingTransactions = await db.gatewayTransaction.findFirst({
      where: {
        gatewayId: id,
        status: "pending",
      },
    });

    if (pendingTransactions) {
      return NextResponse.json(
        { error: "এই গেটওয়েতে অপেক্ষমান লেনদেন আছে, মুছে ফেলা সম্ভব নয়" },
        { status: 400 }
      );
    }

    // Delete the gateway
    await db.paymentGateway.delete({
      where: { id },
    });

    // Log admin action
    await db.adminLog.create({
      data: {
        userId: adminId,
        action: "gateway_deleted",
        details: `Payment gateway "${existingGateway.name}" (${existingGateway.slug}) deleted`,
      },
    });

    return NextResponse.json({
      message: "পেমেন্ট গেটওয়ে সফলভাবে মুছে ফেলা হয়েছে",
    });
  } catch (error) {
    console.error("Delete gateway error:", error);
    return NextResponse.json(
      { error: "পেমেন্ট গেটওয়ে মুছে ফেলতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}
