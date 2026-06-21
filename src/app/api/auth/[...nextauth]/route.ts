import NextAuth from "next-auth";
import { getAuthOptions } from "@/lib/auth";

/**
 * Per-request NextAuth handler.
 * NextAuth v4 supports the (req, res, options) signature where options
 * can be built dynamically per request. This lets us load Google OAuth
 * credentials from the database on each request.
 *
 * Note: We define a single async function and reuse it for both GET and POST
 * named exports (required by Next.js App Router).
 */
async function handler(req: any, res: any) {
  const authOptions = await getAuthOptions();
  // @ts-expect-error - NextAuth's runtime signature accepts (req, res, options)
  return await NextAuth(req, res, authOptions);
}

export { handler as GET, handler as POST };
