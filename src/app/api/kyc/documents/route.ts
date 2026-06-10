import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helper";

// GET /api/kyc/documents - Get all KYC documents for the current user (history of all submissions)
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

    const documents = await db.kYCVerification.findMany({
      where: { userId },
      orderBy: { submittedAt: "desc" },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error("Get KYC documents error:", error);
    return NextResponse.json(
      { error: "KYC ডকুমেন্ট লোড করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}
