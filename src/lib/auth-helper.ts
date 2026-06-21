import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";

export async function getAuthSession() {
  return await getServerSession(await getAuthOptions());
}

export async function requireAuth() {
  const session = await getAuthSession();
  if (!session?.user) {
    return null;
  }
  return session;
}

export async function requireAdmin() {
  const session = await getAuthSession();
  if (!session?.user) {
    return null;
  }
  if ((session.user as { role: string }).role !== "admin") {
    return null;
  }
  return session;
}
