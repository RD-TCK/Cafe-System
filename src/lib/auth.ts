import { cookies } from "next/headers";

const OWNER_COOKIE_NAME = "cafe_owner_session";
const OWNER_SECRET_PIN = process.env.OWNER_SECRET_PIN || "8899";
const OWNER_PASSWORD = process.env.OWNER_PASSWORD || "admin_cafe_2026";

export function verifyOwnerCredentials(pinOrPassword: string): boolean {
  if (!pinOrPassword) return false;
  const input = pinOrPassword.trim();
  return input === OWNER_SECRET_PIN || input === OWNER_PASSWORD;
}

export async function isOwnerAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(OWNER_COOKIE_NAME);
  return session?.value === "authenticated_owner";
}

export async function setOwnerSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(OWNER_COOKIE_NAME, "authenticated_owner", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearOwnerSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(OWNER_COOKIE_NAME);
}
