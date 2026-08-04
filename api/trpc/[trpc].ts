import { createExpressMiddleware } from "@trpc/server/adapters/express";
import express from "express";
import cookieParser from "cookie-parser";
import superjson from "superjson";
import { appRouter } from "../../server/routers";
import { createContext } from "../../server/_core/context";

// Handle the request - Vercel serverless function
export default async function handler(req: any, res: any) {
  try {
    // Create a minimal Express app for tRPC
    const app = express();
    app.use(express.json());
    app.use(cookieParser());

    // Mount tRPC middleware at root with superjson transformer
    app.use(
      "/",
      createExpressMiddleware({
        router: appRouter,
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
