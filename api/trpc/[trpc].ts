import { createExpressMiddleware } from "@trpc/server/adapters/express";
import express from "express";
import cookieParser from "cookie-parser";
import superjson from "superjson";

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
export default async function handler(req: any, res: any) {
  try {
    const [router, createContext] = await Promise.all([getRouter(), getCreateContext()]);

    // Create a minimal Express app for tRPC
    const app = express();
    app.use(express.json());
    app.use(cookieParser());

    // Mount tRPC middleware at root with superjson transformer
    // This MUST match the client-side httpBatchLink transformer
    app.use(
      "/",
      createExpressMiddleware({
        router,
        createContext,
        transformer: superjson,
      })
    );

    app(req, res);
  } catch (error: any) {
    console.error("tRPC handler error:", error?.message || error);
    res.status(500).json({ error: "Internal server error" });
  }
}
