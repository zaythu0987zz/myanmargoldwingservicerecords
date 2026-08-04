import { COOKIE_NAME } from "@shared/const";
import { parseCookie } from "./cookies";
import { ENV } from "./env";

export type User = {
  id: number;
  name: string;
  role: "admin";
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
      const { jwtVerify } = await import("jose");
      const secret = new TextEncoder().encode(ENV.jwtSecret);
      try {
        const { payload } = await jwtVerify(token, secret);
        user = {
          id: Number(payload.sub) || 1,
          name: (payload.name as string) || "Admin",
          role: (payload.role as "admin") || "admin",
        };
      } catch {
        // Token invalid or expired — no user
      }
    }
  } catch {
    // Context creation errors should not crash the server
  }

  return { user, req, res };
}
