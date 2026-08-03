import { COOKIE_NAME } from "@shared/const";

export function getSessionCookieOptions(req: any) {
  const isProd = process.env.NODE_ENV === "production";
  return {
    maxAge: 60 * 60 * 24 * 30, // 30 days
    httpOnly: true,
    secure: isProd, // Only secure in production (HTTPS)
    sameSite: "lax" as const,
    path: "/",
  };
}

export function parseCookie(cookieStr: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieStr) return cookies;
  cookieStr.split(";").forEach((part) => {
    const [key, ...rest] = part.split("=");
    if (key) {
      cookies[key.trim()] = decodeURIComponent(rest.join("=").trim());
    }
  });
  return cookies;
}
