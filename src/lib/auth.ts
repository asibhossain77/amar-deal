import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

/**
 * NextAuth options.
 *
 * Note: This is kept as an async function (`getAuthOptions`) for backwards
 * compatibility with existing callers (auth-helper.ts and the [...nextauth]
 * route handler). Google Login was removed — authentication now uses the
 * Credentials provider only.
 */
export async function getAuthOptions(): Promise<NextAuthOptions> {
  return {
    providers: [
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
    ],
    session: {
      strategy: "jwt",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    jwt: {
      maxAge: 30 * 24 * 60 * 60,
    },
    callbacks: {
      async signIn() {
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
