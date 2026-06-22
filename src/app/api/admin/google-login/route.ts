import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helper";
import { invalidateGoogleConfigCache } from "@/lib/auth";

/**
 * GET /api/admin/google-login
 * Returns current Google Login configuration.
 * Client secret is masked for security.
 */
export async function GET() {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json(
        { error: "অনুমতি নেই। শুধুমাত্র অ্যাডমিন অ্যাক্সেস করতে পারবেন।" },
        { status: 403 }
      );
    }

    const settings = await db.siteSetting.findMany({
      where: {
        key: {
          in: [
            "google_login_enabled",
            "google_client_id",
            "google_client_secret",
          ],
        },
      },
    });

    const map: Record<string, string> = {};
    for (const s of settings) {
      map[s.key] = s.value;
    }

    // Compute connection status
    const enabled = map.google_login_enabled === "true";
    const hasClientId = !!map.google_client_id?.trim();
    const hasClientSecret = !!map.google_client_secret?.trim();
    const isConfigured = hasClientId && hasClientSecret;

    let status = "not_configured";
    if (isConfigured && enabled) status = "active";
    else if (isConfigured && !enabled) status = "disabled";
    else if (hasClientId || hasClientSecret) status = "incomplete";

    return NextResponse.json({
      enabled,
      clientId: map.google_client_id || "",
      // Don't send the actual secret to the client; just whether it's set
      clientSecret: "",
      clientSecretSet: hasClientSecret,
      redirectUrl: `${process.env.NEXTAUTH_URL || ""}/api/auth/callback/google`,
      status,
      isConfigured,
    });
  } catch (error) {
    console.error("Get Google login settings error:", error);
    return NextResponse.json(
      { error: "সেটিংস লোড করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/google-login
 * Update Google Login configuration.
 * Body: { enabled, clientId, clientSecret? }
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json(
        { error: "অনুমতি নেই। শুধুমাত্র অ্যাডমিন আপডেট করতে পারবেন।" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { enabled, clientId, clientSecret } = body;

    // Validate
    if (typeof enabled !== "boolean") {
      return NextResponse.json(
        { error: "enabled ফিল্ড অবশ্যই boolean হতে হবে" },
        { status: 400 }
      );
    }

    // Fetch existing credentials to check if they're already stored
    const existingSecretRow = await db.siteSetting.findUnique({
      where: { key: "google_client_secret" },
    });
    const existingSecret = existingSecretRow?.value || "";

    const existingClientIdRow = await db.siteSetting.findUnique({
      where: { key: "google_client_id" },
    });
    const existingClientId = existingClientIdRow?.value || "";

    // If enabling, require clientId & clientSecret (new or existing in DB)
    if (enabled) {
      const effectiveClientId = clientId?.trim() || existingClientId.trim();
      if (!effectiveClientId) {
        return NextResponse.json(
          { error: "Google Client ID আবশ্যক" },
          { status: 400 }
        );
      }
      const effectiveSecret = clientSecret?.trim() || existingSecret.trim();
      if (!effectiveSecret) {
        return NextResponse.json(
          { error: "Google Client Secret আবশ্যক" },
          { status: 400 }
        );
      }
    }

    // Build the list of settings to upsert
    const updates: Array<{ key: string; value: string }> = [
      { key: "google_login_enabled", value: enabled ? "true" : "false" },
    ];

    if (clientId !== undefined) {
      updates.push({ key: "google_client_id", value: clientId.trim() });
    }

    // Only update secret if a new non-empty value is provided
    if (clientSecret !== undefined && clientSecret.trim()) {
      updates.push({ key: "google_client_secret", value: clientSecret.trim() });
    }

    for (const update of updates) {
      await db.siteSetting.upsert({
        where: { key: update.key },
        update: { value: update.value },
        create: { key: update.key, value: update.value },
      });
    }

    // Invalidate the Google config cache so the new credentials take effect immediately
    invalidateGoogleConfigCache();

    // Log admin action (non-critical)
    try {
      await db.adminLog.create({
        data: {
          userId: (session.user as { id: string }).id,
          action: "google_login_settings_update",
          details: `Google Login ${enabled ? "চালু" : "বন্ধ"} করা হয়েছে`,
        },
      });
    } catch (logErr) {
      console.error("Admin log error (non-critical):", logErr);
    }

    // Compute new status using effective values (new or existing)
    const finalClientId = clientId?.trim() || existingClientId.trim();
    const finalHasSecret =
      (clientSecret !== undefined && clientSecret.trim()) || !!existingSecret;
    const isConfigured = !!finalClientId && finalHasSecret;

    let status = "not_configured";
    if (isConfigured && enabled) status = "active";
    else if (isConfigured && !enabled) status = "disabled";
    else if (finalClientId || finalHasSecret) status = "incomplete";

    return NextResponse.json({
      success: true,
      message: "Google Login সেটিংস সফলভাবে আপডেট হয়েছে",
      status,
      redirectUrl: `${process.env.NEXTAUTH_URL || ""}/api/auth/callback/google`,
    });
  } catch (error) {
    console.error("Update Google login settings error:", error);
    return NextResponse.json(
      { error: "সেটিংস আপডেট করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/google-login
 * Test connection (validates that credentials are set)
 */
export async function POST() {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json(
        { error: "অনুমতি নেই" },
        { status: 403 }
      );
    }

    const settings = await db.siteSetting.findMany({
      where: {
        key: {
          in: [
            "google_login_enabled",
            "google_client_id",
            "google_client_secret",
          ],
        },
      },
    });

    const map: Record<string, string> = {};
    for (const s of settings) {
      map[s.key] = s.value;
    }

    const enabled = map.google_login_enabled === "true";
    const hasClientId = !!map.google_client_id?.trim();
    const hasClientSecret = !!map.google_client_secret?.trim();

    if (!hasClientId || !hasClientSecret) {
      return NextResponse.json({
        success: false,
        message: "Google Client ID এবং Secret উভয়ই প্রয়োজন",
        status: "incomplete",
      });
    }

    // Basic format validation for Client ID
    if (!map.google_client_id.includes(".apps.googleusercontent.com")) {
      return NextResponse.json({
        success: false,
        message: "Google Client ID ফরম্যাট সঠিক নয়। এটি সাধারণত .apps.googleusercontent.com দিয়ে শেষ হয়।",
        status: "invalid_format",
      });
    }

    return NextResponse.json({
      success: true,
      message: enabled
        ? "Google Login সক্রিয় এবং সঠিকভাবে কনফিগার করা হয়েছে"
        : "ক্রেডেনশিয়াল সঠিক, কিন্তু Google Login বন্ধ আছে",
      status: enabled ? "active" : "disabled",
    });
  } catch (error) {
    console.error("Test Google login error:", error);
    return NextResponse.json(
      { error: "টেস্টে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}
