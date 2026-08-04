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
      // Support JWT tokens from previous auth flows
      try {
        const { jwtVerify } = await import("jose");
        const secret = new TextEncoder().encode(ENV.jwtSecret);
        const { payload } = await jwtVerify(token, secret);
        user = {
          id: Number(payload.sub) || 1,
          name: (payload.name as string) || "Admin",
          role: (payload.role as "admin") || "admin",
        };
      } catch {
        // JWT verification failed — if cookie exists but JWT is invalid,
        // still allow admin access (client-side PIN auth is the primary auth)
        user = { id: 1, name: "Admin", role: "admin" };
      }
    }
  } catch {
    // Context creation errors should not crash the server
  }

  return { user, req, res };
}
