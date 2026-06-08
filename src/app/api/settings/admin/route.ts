import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, requireAuth } from "@/lib/auth-helper";
import { SITE_DEFAULTS } from "@/lib/site-defaults";

// Allowed keys for site settings
const SITE_SETTING_KEYS = [
  'site_name',
  'site_tagline',
  'site_logo',
  'site_favicon',
  'site_banner',
  'site_login_bg',
  'site_copyright',
  'seo_meta_title',
  'seo_meta_description',
  'maintenance_mode',
];

// Allowed keys for payment settings
const PAYMENT_SETTING_KEYS = [
  'bkash_account', 'bkash_account_name',
  'nagad_account', 'nagad_account_name',
  'rocket_account', 'rocket_account_name',
  'bank_name', 'bank_account', 'bank_account_name',
  'bank_branch', 'bank_routing',
];

// Max image size: 2MB as base64 (~2.67MB with base64 overhead)
const MAX_IMAGE_SIZE = 3 * 1024 * 1024; // 3MB for base64 strings

// Allowed image MIME types
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];

function isValidImageBase64(value: string): { valid: boolean; error?: string } {
  if (!value) return { valid: true };
  
  // Check if it starts with data:image
  if (!value.startsWith('data:image/')) {
    return { valid: false, error: 'অবৈধ ইমেজ ফরম্যাট' };
  }

  // Extract MIME type
  const mimeMatch = value.match(/^data:(image\/[a-z+]+);base64,/);
  if (!mimeMatch) {
    return { valid: false, error: 'অবৈধ ইমেজ ফরম্যাট' };
  }

  const mimeType = mimeMatch[1];
  if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) {
    return { valid: false, error: `অবৈধ ইমেজ টাইপ: ${mimeType}। শুধুমাত্র PNG, JPG, SVG, WebP গ্রহণযোগ্য।` };
  }

  // Check size
  if (value.length > MAX_IMAGE_SIZE) {
    return { valid: false, error: 'ইমেজ সাইজ 2MB এর কম হতে হবে' };
  }

  return { valid: true };
}

// GET /api/settings/admin - Get admin settings
// ?category=site → site branding settings
// ?category=payment_accounts → payment account settings
export async function GET(request: NextRequest) {
  try {
    const authSession = await requireAuth();
    if (!authSession) {
      return NextResponse.json({ error: "প্রমাণীকরণ আবশ্যক" }, { status: 401 });
    }

    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: "অ্যাডমিন অনুমতি আবশ্যক" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "payment_accounts";

    const settings = await db.siteSetting.findMany();
    const settingsMap: Record<string, string> = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }

    if (category === "site") {
      return NextResponse.json({
        settings: {
          site_name: settingsMap.site_name || SITE_DEFAULTS.site_name,
          site_tagline: settingsMap.site_tagline || SITE_DEFAULTS.site_tagline,
          site_logo: settingsMap.site_logo || "",
          site_favicon: settingsMap.site_favicon || "",
          site_banner: settingsMap.site_banner || "",
          site_login_bg: settingsMap.site_login_bg || "",
          site_copyright: settingsMap.site_copyright || SITE_DEFAULTS.site_copyright,
          seo_meta_title: settingsMap.seo_meta_title || SITE_DEFAULTS.seo_meta_title,
          seo_meta_description: settingsMap.seo_meta_description || SITE_DEFAULTS.seo_meta_description,
          maintenance_mode: settingsMap.maintenance_mode || SITE_DEFAULTS.maintenance_mode,
        },
      });
    }

    // Default: payment accounts
    return NextResponse.json({
      settings: {
        bkash_account: settingsMap.bkash_account || "",
        bkash_account_name: settingsMap.bkash_account_name || "",
        nagad_account: settingsMap.nagad_account || "",
        nagad_account_name: settingsMap.nagad_account_name || "",
        rocket_account: settingsMap.rocket_account || "",
        rocket_account_name: settingsMap.rocket_account_name || "",
        bank_name: settingsMap.bank_name || "",
        bank_account: settingsMap.bank_account || "",
        bank_account_name: settingsMap.bank_account_name || "",
        bank_branch: settingsMap.bank_branch || "",
        bank_routing: settingsMap.bank_routing || "",
      },
    });
  } catch (error) {
    console.error("Get admin settings error:", error);
    return NextResponse.json(
      { error: "সেটিংস লোড করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}

// PUT /api/settings/admin - Update settings
// ?category=site → site branding settings
// ?category=payment_accounts → payment account settings
export async function PUT(request: NextRequest) {
  try {
    const authSession = await requireAuth();
    if (!authSession) {
      return NextResponse.json({ error: "প্রমাণীকরণ আবশ্যক" }, { status: 401 });
    }

    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: "অ্যাডমিন অনুমতি আবশ্যক" }, { status: 403 });
    }

    const adminId = (session.user as { id: string }).id;
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "payment_accounts";
    const body = await request.json();

    const allowedKeys = category === "site" ? SITE_SETTING_KEYS : PAYMENT_SETTING_KEYS;
    const imageKeys = ['site_logo', 'site_favicon', 'site_banner', 'site_login_bg'];

    for (const [key, value] of Object.entries(body)) {
      if (allowedKeys.includes(key) && typeof value === 'string') {
        // Validate image fields
        if (imageKeys.includes(key) && value) {
          const validation = isValidImageBase64(value);
          if (!validation.valid) {
            return NextResponse.json(
              { error: `${key}: ${validation.error}` },
              { status: 400 }
            );
          }
        }

        await db.siteSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        });
      }
    }

    // Log admin action
    await db.adminLog.create({
      data: {
        userId: adminId,
        action: category === "site" ? "site_settings_updated" : "settings_updated",
        details: category === "site" ? "Website branding settings updated" : "Payment account settings updated",
      },
    });

    return NextResponse.json({ message: "সেটিংস সফলভাবে আপডেট হয়েছে" });
  } catch (error) {
    console.error("Update settings error:", error);
    return NextResponse.json(
      { error: "সেটিংস আপডেট করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}

// DELETE /api/settings/admin - Delete a specific image setting
export async function DELETE(request: NextRequest) {
  try {
    const authSession = await requireAuth();
    if (!authSession) {
      return NextResponse.json({ error: "প্রমাণীকরণ আবশ্যক" }, { status: 401 });
    }

    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: "অ্যাডমিন অনুমতি আবশ্যক" }, { status: 403 });
    }

    const adminId = (session.user as { id: string }).id;
    const body = await request.json();
    const { key } = body;

    const imageKeys = ['site_logo', 'site_favicon', 'site_banner', 'site_login_bg'];
    if (!imageKeys.includes(key)) {
      return NextResponse.json(
        { error: "শুধুমাত্র ইমেজ ফিল্ড মুছে ফেলা যায়" },
        { status: 400 }
      );
    }

    // Set to empty string instead of deleting the record
    await db.siteSetting.upsert({
      where: { key },
      update: { value: "" },
      create: { key, value: "" },
    });

    // Log admin action
    await db.adminLog.create({
      data: {
        userId: adminId,
        action: "site_image_deleted",
        details: `Deleted site image: ${key}`,
      },
    });

    return NextResponse.json({ message: "ইমেজ সফলভাবে মুছে ফেলা হয়েছে" });
  } catch (error) {
    console.error("Delete settings error:", error);
    return NextResponse.json(
      { error: "সেটিংস মুছতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}
