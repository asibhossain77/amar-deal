import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helper";

// PUT /api/admin/kyc/[id] - Review a KYC submission. Admin only.
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
    const { status, adminNote } = body;

    // Validate required fields
    if (!status) {
      return NextResponse.json(
        { error: "স্ট্যাটাস আবশ্যক" },
        { status: 400 }
      );
    }

    // Validate status value
    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "অবৈধ স্ট্যাটাস। শুধুমাত্র 'approved' বা 'rejected' গ্রহণযোগ্য" },
        { status: 400 }
      );
    }

    // Find the KYC verification
    const verification = await db.kYCVerification.findUnique({
      where: { id },
    });

    if (!verification) {
      return NextResponse.json(
        { error: "KYC যাচাই রেকর্ড পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    // Check if already reviewed
    if (verification.status !== "pending") {
      return NextResponse.json(
        {
          error: `এই KYC যাচাই ইতিমধ্যে ${verification.status === "approved" ? "অনুমোদিত" : "প্রত্যাখ্যাত"} হয়েছে`,
        },
        { status: 400 }
      );
    }

    // Update the KYC verification record
    const updatedVerification = await db.kYCVerification.update({
      where: { id },
      data: {
        status,
        adminNote: adminNote || null,
        reviewedAt: new Date(),
        reviewerId: adminId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            avatar: true,
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
    });

    // Update user's verification status based on the review result
    if (status === "approved") {
      await db.user.update({
        where: { id: verification.userId },
        data: {
          isVerified: true,
          verificationStatus: "verified",
        },
      });
    } else if (status === "rejected") {
      await db.user.update({
        where: { id: verification.userId },
        data: {
          verificationStatus: "rejected",
        },
      });
    }

    // Create notification for the user
    const notificationTitle =
      status === "approved"
        ? "KYC যাচাই অনুমোদিত"
        : "KYC যাচাই প্রত্যাখ্যাত";
    const notificationMessage =
      status === "approved"
        ? "আপনার KYC যাচাই সফলভাবে অনুমোদিত হয়েছে। আপনি এখন একজন যাচাইকৃত ব্যবহারকারী"
        : `আপনার KYC যাচাই প্রত্যাখ্যাত হয়েছে।${adminNote ? ` কারণ: ${adminNote}` : " অনুগ্রহ করে আবার চেষ্টা করুন"}`;

    await db.notification.create({
      data: {
        userId: verification.userId,
        title: notificationTitle,
        message: notificationMessage,
        type: "system",
      },
    });

    // Log the admin action
    await db.adminLog.create({
      data: {
        userId: adminId,
        action: status === "approved" ? "kyc_approved" : "kyc_rejected",
        details: `KYC verification "${id}" for user "${verification.userId}" ${status === "approved" ? "approved" : "rejected"}.${adminNote ? ` Note: ${adminNote}` : ""}`,
      },
    });

    const successMessage =
      status === "approved"
        ? "KYC যাচাই সফলভাবে অনুমোদিত হয়েছে"
        : "KYC যাচাই প্রত্যাখ্যাত হয়েছে";

    return NextResponse.json({
      verification: updatedVerification,
      message: successMessage,
    });
  } catch (error) {
    console.error("Review KYC error:", error);
    return NextResponse.json(
      { error: "KYC যাচাই রিভিউ করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}
