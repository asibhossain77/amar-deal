import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/settings - Get public settings (payment accounts etc.)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "payment_accounts";

    const settings = await db.siteSetting.findMany();

    const settingsMap: Record<string, string> = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }

    if (category === "payment_accounts") {
      return NextResponse.json({
        bkash: {
          number: settingsMap.bkash_account || "",
          name: settingsMap.bkash_account_name || "",
        },
        nagad: {
          number: settingsMap.nagad_account || "",
          name: settingsMap.nagad_account_name || "",
        },
        rocket: {
          number: settingsMap.rocket_account || "",
          name: settingsMap.rocket_account_name || "",
        },
        bank: {
          bankName: settingsMap.bank_name || "",
          accountNumber: settingsMap.bank_account || "",
          accountName: settingsMap.bank_account_name || "",
          branch: settingsMap.bank_branch || "",
          routing: settingsMap.bank_routing || "",
        },
      });
    }

    return NextResponse.json({ settings: settingsMap });
  } catch (error) {
    console.error("Get settings error:", error);
    return NextResponse.json(
      { error: "সেটিংস লোড করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}
