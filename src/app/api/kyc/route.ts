import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helper";

// GET /api/kyc - Get current user's KYC status (latest verification submission)
export async function GET() {
  try {
    const session = await requireAuth();
    if (!session) {
      return NextResponse.json(
        { error: "প্রমাণীকরণ আবশ্যক" },
        { status: 401 }
      );
    }

    const userId = (session.user as { id: string }).id;

    // Get the latest KYC verification for this user
    const latestVerification = await db.kYCVerification.findFirst({
      where: { userId },
      orderBy: { submittedAt: "desc" },
    });

    // Get the user's verification status
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        isVerified: true,
        verificationStatus: true,
      },
    });

    return NextResponse.json({
      verification: latestVerification,
      userStatus: {
        isVerified: user?.isVerified ?? false,
        verificationStatus: user?.verificationStatus ?? "unverified",
      },
    });
  } catch (error) {
    console.error("Get KYC status error:", error);
    return NextResponse.json(
      { error: "KYC স্ট্যাটাস লোড করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}

// POST /api/kyc - Submit a new KYC verification document
export async function POST(request: NextRequest) {
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
    const { documentType, documentNumber, documentFront, documentBack, selfie } =
      body;

    // Validate required fields
    if (!documentType || !documentNumber || !documentFront) {
      return NextResponse.json(
        {
          error:
            "ডকুমেন্ট টাইপ, ডকুমেন্ট নম্বর এবং ডকুমেন্টের সামনের ছবি আবশ্যক",
        },
        { status: 400 }
      );
    }

    // Validate documentType
    const validDocumentTypes = ["national_id", "passport", "driving_license"];
    if (!validDocumentTypes.includes(documentType)) {
      return NextResponse.json(
        {
          error:
            "অবৈধ ডকুমেন্ট টাইপ। সমর্থিত টাইপ: জাতীয় পরিচয়পত্র, পাসপোর্ট, ড্রাইভিং লাইসেন্স",
        },
        { status: 400 }
      );
    }

    // Check if user already has an approved verification
    const existingApproved = await db.kYCVerification.findFirst({
      where: {
        userId,
        status: "approved",
      },
    });

    if (existingApproved) {
      return NextResponse.json(
        { error: "আপনার KYC ইতিমধ্যে অনুমোদিত হয়েছে। নতুন করে জমা দেওয়ার প্রয়োজন নেই" },
        { status: 400 }
      );
    }

    // Check if user has a pending verification - if so, update it
    const existingPending = await db.kYCVerification.findFirst({
      where: {
        userId,
        status: "pending",
      },
      orderBy: { submittedAt: "desc" },
    });

    let verification;

    if (existingPending) {
      // Update the existing pending verification with new data
      verification = await db.kYCVerification.update({
        where: { id: existingPending.id },
        data: {
          documentType,
          documentNumber,
          documentFront,
          documentBack: documentBack || null,
          selfie: selfie || null,
          submittedAt: new Date(),
        },
      });
    } else {
      // Create a new KYC verification record
      verification = await db.kYCVerification.create({
        data: {
          userId,
          documentType,
          documentNumber,
          documentFront,
          documentBack: documentBack || null,
          selfie: selfie || null,
          status: "pending",
        },
      });
    }

    // Update user's verificationStatus to "pending"
    await db.user.update({
      where: { id: userId },
      data: { verificationStatus: "pending" },
    });

    return NextResponse.json(
      {
        verification,
        message: "KYC যাচাই সফলভাবে জমা দেওয়া হয়েছে",
      },
      { status: existingPending ? 200 : 201 }
    );
  } catch (error) {
    console.error("Submit KYC error:", error);
    return NextResponse.json(
      { error: "KYC যাচাই জমা দিতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}
