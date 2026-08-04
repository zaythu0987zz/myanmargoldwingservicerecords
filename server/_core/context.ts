import { COOKIE_NAME } from "../../shared/const";
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

// Default admin user for PIN-based auth
const DEFAULT_ADMIN: User = {
  id: 1,
  name: "Admin",
  role: "admin",
};

export async function createContext(opts: { req: any; res: any }): Promise<TrpcContext> {
  const { req, res } = opts;

  let user: User | null = null;

  try {
    const cookies = parseCookie(req.headers.cookie ?? "");
    const token = cookies[COOKIE_NAME];

    if (token) {
      // First try JWT verification
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
        // JWT verification failed, but cookie exists
        // For PIN-based auth, treat any cookie as valid admin auth
        user = DEFAULT_ADMIN;
      }
    } else {
      // No cookie — check for Bearer token in Authorization header
      const authHeader = req.headers?.authorization || req.headers?.Authorization;
      if (authHeader && typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
        // PIN-based auth sends the token as Bearer
        user = DEFAULT_ADMIN;
      }
    }
  } catch {
    // Context creation errors should not crash the server
  }

  return { user, req, res };
}
