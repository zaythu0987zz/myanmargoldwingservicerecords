import { createExpressMiddleware } from "@trpc/server/adapters/express";
import express from "express";
import cookieParser from "cookie-parser";
import superjson from "superjson";
import { appRouter } from "../../server/routers";
import { createContext } from "../../server/_core/context";

export default async function handler(req: any, res: any) {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  app.use(
    "/",
    createExpressMiddleware({
      router: appRouter,
      createContext,
      transformer: superjson,
    })
  );

  return app(req, res);
}
