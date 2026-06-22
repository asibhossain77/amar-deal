import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

/**
 * Cache Google config to avoid hitting the DB on every request.
 * Cache TTL: 30 seconds. The config is small and rarely changes.
 */
let googleConfigCache: {
  data: { clientId: string; clientSecret: string } | null;
  expiresAt: number;
} | null = null;

const GOOGLE_CONFIG_CACHE_TTL = 5_000; // 5 seconds (shorter for faster admin updates)

/**
 * Invalidate the Google config cache.
 * Call this after admin updates Google Login settings.
 */
export function invalidateGoogleConfigCache() {
  googleConfigCache = null;
}

async function getGoogleConfig(): Promise<{
  clientId: string;
  clientSecret: string;
} | null> {
  const now = Date.now();
  if (googleConfigCache && googleConfigCache.expiresAt > now) {
    return googleConfigCache.data;
  }

  try {
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
    const clientId = map.google_client_id?.trim();
    const clientSecret = map.google_client_secret?.trim();

    const data =
      enabled && clientId && clientSecret ? { clientId, clientSecret } : null;

    googleConfigCache = {
      data,
      expiresAt: now + GOOGLE_CONFIG_CACHE_TTL,
    };
    return data;
  } catch (error) {
    console.error("Failed to load Google config:", error);
    googleConfigCache = { data: null, expiresAt: now + GOOGLE_CONFIG_CACHE_TTL };
    return null;
  }
}

/**
 * Build NextAuth options dynamically.
 * Google provider is only included if enabled & configured in DB.
 */
export async function getAuthOptions(): Promise<NextAuthOptions> {
  const providers: NextAuthOptions["providers"] = [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          return null;
        }

        // Google-only users cannot login with credentials
        if (user.isGoogleUser && !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        if (!user.isActive) {
          return null;
        }

        // Update lastLogin timestamp
        try {
          await db.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
          });
        } catch {
          // Non-critical
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ];

  // Dynamically add Google provider if configured
  try {
    const googleConfig = await getGoogleConfig();
    if (googleConfig) {
      const GoogleProvider = (await import("next-auth/providers/google")).default;
      providers.push(
        GoogleProvider({
          clientId: googleConfig.clientId,
          clientSecret: googleConfig.clientSecret,
          authorization: {
            params: {
              prompt: "consent",
              access_type: "offline",
              response_type: "code",
            },
          },
        })
      );
    }
  } catch (error) {
    console.error("Failed to load Google provider:", error);
  }

  return {
    providers,
    session: {
      strategy: "jwt",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    jwt: {
      maxAge: 30 * 24 * 60 * 60,
    },
    callbacks: {
      async signIn({ user, account }) {
        // For Google sign-in: create or link user
        if (account?.provider === "google") {
          if (!user.email) {
            return false;
          }

          try {
            // Find existing user by email or googleId
            const existingUser = await db.user.findFirst({
              where: {
                OR: [
                  { email: user.email },
                  { googleId: account.providerAccountId },
                ],
              },
            });

            if (existingUser) {
              // User exists - update googleId if not set, update lastLogin
              if (!existingUser.googleId) {
                await db.user.update({
                  where: { id: existingUser.id },
                  data: {
                    googleId: account.providerAccountId,
                    googleEmail: user.email,
                    isGoogleUser: true,
                    lastLogin: new Date(),
                    avatar: user.image || existingUser.avatar,
                  },
                });
              } else {
                await db.user.update({
                  where: { id: existingUser.id },
                  data: { lastLogin: new Date() },
                });
              }

              if (!existingUser.isActive) {
                return false;
              }

              // Attach user id for JWT callback
              (user as { id?: string }).id = existingUser.id;
              (user as { role?: string }).role = existingUser.role;
              return true;
            } else {
              // Create new user from Google profile
              const randomPassword = bcrypt.hashSync(
                Math.random().toString(36).slice(-16) +
                  Date.now().toString(36),
                12
              );
              const newUser = await db.user.create({
                data: {
                  email: user.email,
                  name: user.name || "Google User",
                  password: randomPassword,
                  googleId: account.providerAccountId,
                  googleEmail: user.email,
                  isGoogleUser: true,
                  avatar: user.image || null,
                  lastLogin: new Date(),
                  isActive: true,
                },
              });

              (user as { id?: string }).id = newUser.id;
              (user as { role?: string }).role = newUser.role;
              return true;
            }
          } catch (error) {
            console.error("Google sign-in error:", error);
            return false;
          }
        }

        return true;
      },
      async jwt({ token, user, trigger }) {
        if (user) {
          token.id = (user as { id: string }).id;
          token.role = (user as { role: string }).role;
        }
        // Re-fetch user role on session update
        if (trigger === "update") {
          try {
            const dbUser = await db.user.findUnique({
              where: { id: token.id as string },
              select: { role: true, isActive: true },
            });
            if (dbUser) {
              token.role = dbUser.role;
              if (!dbUser.isActive) {
                return {} as typeof token;
              }
            }
          } catch {
            // keep existing token
          }
        }
        return token;
      },
      async session({ session, token }) {
        if (session.user) {
          (session.user as { id: string }).id = token.id as string;
          (session.user as { role: string }).role = token.role as string;
        }
        return session;
      },
    },
    pages: {
      signIn: "/",
    },
    secret: process.env.NEXTAUTH_SECRET || "amar-deal-secret-key-2024",
  };
}
