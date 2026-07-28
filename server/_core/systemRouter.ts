import { protectedProcedure, router } from "./trpc";

export const systemRouter = router({
  health: protectedProcedure.query(() => {
    return { status: "ok", timestamp: Date.now() };
  }),
});
