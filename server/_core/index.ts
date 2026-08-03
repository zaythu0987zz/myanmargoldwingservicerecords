import express from "express";
import path from "node:path";
import cookieParser from "cookie-parser";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { ENV } from "./env";

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files from the Vite build output
const publicPath = path.resolve(import.meta.dirname, "..", "dist", "public");
app.use(express.static(publicPath));

// SPA fallback - serve index.html for all non-API routes
app.get(/^(?!\/api\/).*/, (_req, res) => {
  res.sendFile(path.join(publicPath, "index.html"), (err) => {
    if (err) {
      res.status(404).send("Not Found");
    }
  });
});

// tRPC middleware
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Start server
const port = ENV.port;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log(`   Environment: ${ENV.nodeEnv}`);
  if (ENV.databaseUrl) {
    console.log("   Database: Connected");
  } else {
    console.warn("   Database: No DATABASE_URL configured");
  }
});
