import type { Metadata } from "next";
import { Hind_Siliguri } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { db } from "@/lib/db";
import { SITE_DEFAULTS } from "@/lib/site-defaults";

const hindSiliguri = Hind_Siliguri({
  variable: "--font-hind-siliguri",
  subsets: ["bengali", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

// Fetch site settings from DB for server-side metadata
async function getSiteSettings() {
  try {
    const settings = await db.siteSetting.findMany();
    const map: Record<string, string> = {};
    for (const s of settings) {
      map[s.key] = s.value;
    }
    return {
      site_name: map.site_name || SITE_DEFAULTS.site_name,
      seo_meta_title: map.seo_meta_title || SITE_DEFAULTS.seo_meta_title,
      seo_meta_description: map.seo_meta_description || SITE_DEFAULTS.seo_meta_description,
    };
  } catch {
    return {
      site_name: SITE_DEFAULTS.site_name,
      seo_meta_title: SITE_DEFAULTS.seo_meta_title,
      seo_meta_description: SITE_DEFAULTS.seo_meta_description,
    };
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return {
    title: settings.seo_meta_title,
    description: settings.seo_meta_description,
    keywords: ["এসক্রো", settings.site_name, "নিরাপদ লেনদেন", "বাংলাদেশ", "escrow", "Bangladesh"],
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <head>
        {/* Dynamic favicon will be set by client-side script */}
        <link rel="icon" href="/logo.svg" />
      </head>
      <body
        className={`${hindSiliguri.variable} antialiased bg-background text-foreground`}
        style={{ fontFamily: "var(--font-hind-siliguri), sans-serif" }}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          storageKey="amar-deal-theme"
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
