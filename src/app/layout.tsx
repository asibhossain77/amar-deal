import type { Metadata } from "next";
import { Hind_Siliguri } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const hindSiliguri = Hind_Siliguri({
  variable: "--font-hind-siliguri",
  subsets: ["bengali", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "বাংলা এসক্রো - নিরাপদ লেনদেনের প্ল্যাটফর্ম",
  description: "বাংলাদেশের সবচেয়ে বিশ্বস্ত এসক্রো পরিষেবা। ক্রেতা ও বিক্রেতা উভয়ের জন্য নিরাপদ লেনদেন নিশ্চিত করুন।",
  keywords: ["এসক্রো", "বাংলা এসক্রো", "নিরাপদ লেনদেন", "বাংলাদেশ", "escrow", "Bangladesh"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <body
        className={`${hindSiliguri.variable} antialiased bg-background text-foreground`}
        style={{ fontFamily: "var(--font-hind-siliguri), sans-serif" }}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
