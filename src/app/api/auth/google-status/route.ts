import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/auth/google-status
 * Public endpoint to check if Google Login is enabled.
 * Used by the login/register pages to show/hide the Google button.
 * Does NOT expose any credentials.
 */
export async function GET() {
  try {
    const settings = await db.siteSetting.findMany({
      where: {
        key: {
          in: ["google_login_enabled", "google_client_id"],
        },
      },
    });

    const map: Record<string, string> = {};
    for (const s of settings) {
      map[s.key] = s.value;
    }

    const enabled =
      map.google_login_enabled === "true" && !!map.google_client_id?.trim();

    return NextResponse.json({
      enabled,
    });
  } catch {
    // Fail safe - return disabled if DB error
    return NextResponse.json({ enabled: false });
  }
}
