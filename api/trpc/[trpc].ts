import { createExpressMiddleware } from "@trpc/server/adapters/express";
import express from "express";
import cookieParser from "cookie-parser";
import type { VercelRequest, VercelResponse } from "@vercel/node";

// Dynamic import to handle ESM/CJS compatibility
async function getRouter() {
  const { appRouter } = await import("../../server/routers");
  return appRouter;
}

async function getCreateContext() {
  const { createContext } = await import("../../server/_core/context");
  return createContext;
}

// Handle the request
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const [router, createContext] = await Promise.all([getRouter(), getCreateContext()]);

    const app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use(
      "/api/trpc",
      createExpressMiddleware({
        router,
        createContext,
      })
    );

    app(req, res);
  } catch (error) {
    console.error("tRPC handler error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
