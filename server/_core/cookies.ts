import { COOKIE_NAME } from "@shared/const";

export function getSessionCookieOptions(req: any) {
  return {
    maxAge: 60 * 60 * 24 * 30, // 30 days
    httpOnly: true,
    secure: true,
    sameSite: "none" as const,
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
