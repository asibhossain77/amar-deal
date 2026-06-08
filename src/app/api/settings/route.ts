import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/settings - Get public settings
// ?category=payment_accounts → payment account info
// ?category=site → site branding info (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "payment_accounts";

    const settings = await db.siteSetting.findMany();
    const settingsMap: Record<string, string> = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }

    if (category === "site") {
      // Public site branding settings
      return NextResponse.json({
        settings: {
          site_name: settingsMap.site_name || "বাংলা এসক্রো",
          site_tagline: settingsMap.site_tagline || "বাংলাদেশের সবচেয়ে বিশ্বস্ত এসক্রো পরিষেবা। ক্রেতা ও বিক্রেতা উভয়ের জন্য নিরাপদ লেনদেন নিশ্চিত করুন।",
          site_logo: settingsMap.site_logo || "",
          site_favicon: settingsMap.site_favicon || "",
          site_banner: settingsMap.site_banner || "",
          site_login_bg: settingsMap.site_login_bg || "",
          site_copyright: settingsMap.site_copyright || "© ২০২৪ বাংলা এসক্রো। সর্বস্বত্ব সংরক্ষিত।",
          seo_meta_title: settingsMap.seo_meta_title || "বাংলা এসক্রো - নিরাপদ লেনদেনের প্ল্যাটফর্ম",
          seo_meta_description: settingsMap.seo_meta_description || "বাংলাদেশের সবচেয়ে বিশ্বস্ত এসক্রো পরিষেবা। ক্রেতা ও বিক্রেতা উভয়ের জন্য নিরাপদ লেনদেন নিশ্চিত করুন।",
          maintenance_mode: settingsMap.maintenance_mode || "false",
        },
      });
    }

    // Default: payment accounts
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
  } catch (error) {
    console.error("Get settings error:", error);
    return NextResponse.json(
      { error: "সেটিংস লোড করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}
