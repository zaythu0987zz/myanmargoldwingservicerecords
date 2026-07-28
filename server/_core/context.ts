import { COOKIE_NAME } from "@shared/const";
import { parseCookie } from "./cookies";
import { ENV } from "./env";

export type User = {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
};

export type TrpcContext = {
  user: User | null;
  req: any;
  res: any;
};

export async function createContext(opts: { req: any; res: any }): Promise<TrpcContext> {
  const { req, res } = opts;

  let user: User | null = null;

  try {
    const cookies = parseCookie(req.headers.cookie ?? "");
    const token = cookies[COOKIE_NAME];

    if (token) {
      // Try to decode JWT token using jose
      const { jwtVerify } = await import("jose");
      const secret = new TextEncoder().encode(ENV.jwtSecret);
      try {
        const { payload } = await jwtVerify(token, secret);
        user = {
          id: Number(payload.sub) || 0,
          openId: String(payload.openId || ""),
          name: (payload.name as string) || null,
          email: (payload.email as string) || null,
          loginMethod: (payload.loginMethod as string) || null,
          role: (payload.role as "user" | "admin") || "user",
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        };
      } catch {
        // Token invalid, continue without user
      }
    }
  } catch {
    // Context creation errors should not crash the server
  }

  return { user, req, res };
}
