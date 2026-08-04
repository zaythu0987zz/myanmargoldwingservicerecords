import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "../shared/const";
import { z } from "zod";
import { Buffer } from "buffer";
import {
  createServiceRecord,
  deleteServiceRecord,
  getAllBrands,
  getAllServiceRecords,
  getServiceRecordById,
  getServiceRecordByQrCode,
  updateServiceRecord,
  getDb,
} from "./db";
import { nanoid } from "nanoid";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),

    loginPin: publicProcedure
      .input(z.object({ pin: z.string() }))
      .mutation(({ input, ctx }) => {
        const VALID_PIN = "191995";
        if (input.pin !== VALID_PIN) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid PIN" });
        }

        // Set JWT cookie for subsequent protected requests
        const { JWT } = ctx.res.locals || {};
        const jwtSecret = process.env.JWT_SECRET || "goldwing-service-app-secret-key-2024";

        // Create a JWT-like token using Buffer (Node.js compatible)
        const token = (() => {
          const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
          const payload = Buffer.from(JSON.stringify({ sub: "1", name: "Admin", role: "admin", iat: Math.floor(Date.now() / 1000) })).toString("base64url");
          return `${header}.${payload}.pin-auth`;
        })();

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });

        return {
          success: true,
          user: { id: 1, name: "Admin", role: "admin" as const },
        };
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie("__session", { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  serviceRecords: router({
    // Public: Get all service records with pagination and filters
    list: publicProcedure
      .input(
        z.object({
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(100).default(20),
          search: z.string().optional(),
          brand: z.string().optional(),
          purchasePlace: z.string().optional(),
          dateFrom: z.string().optional(),
          dateTo: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        return getAllServiceRecords(input);
      }),

    // Public: Get a single service record by ID
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getServiceRecordById(input.id);
      }),

    // Public: Get a service record by QR code
    getByQrCode: publicProcedure
      .input(z.object({ qrCode: z.string() }))
      .query(async ({ input }) => {
        return getServiceRecordByQrCode(input.qrCode);
      }),

    // Protected: Create a new service record
    create: protectedProcedure
      .input(
        z.object({
          brand: z.enum(["DeLonghi", "Kenwood", "Braun", "NutriBullet", "Other"]),
          modelName: z.string().min(1),
          serialNo: z.string().optional(),
          useInPlace: z.string().optional(),
          purchasePlace: z.enum(["Myanmar", "Overseas"]).optional(),
          customerName: z.string().min(1),
          customerPhone: z.string().optional(),
          customerAddress: z.string().optional(),
          serviceDate: z.string(),
          inDate: z.string().optional(),
          outDate: z.string().optional(),
          coffeeCleaning: z.boolean().default(false),
          waterCleaning: z.boolean().default(false),
          descaling: z.boolean().default(false),
          milkCleaning: z.boolean().default(false),
          technicalIssues: z.string().optional(),
          repairedBy: z.string().optional(),
          serviceCharges: z.string().optional(),
          parts: z.array(
            z.object({
              partName: z.string().min(1),
              quantity: z.number().min(1).default(1),
              cost: z.string().default("0"),
            })
          ),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const qrCode = nanoid(12);
        const serviceDate = new Date(input.serviceDate);
        const inDate = input.inDate ? new Date(input.inDate) : undefined;
        const outDate = input.outDate ? new Date(input.outDate) : undefined;

        const totalCost = input.parts.reduce(
          (sum, part) => sum + parseFloat(part.cost || "0"),
          0
        );

        const record = await createServiceRecord({
          qrCode,
          brand: input.brand,
          modelName: input.modelName,
          serialNo: input.serialNo || null,
          useInPlace: input.useInPlace || null,
          purchasePlace: input.purchasePlace || null,
          customerName: input.customerName,
          customerPhone: input.customerPhone || null,
          customerAddress: input.customerAddress || null,
          serviceDate,
          inDate,
          outDate,
          coffeeCleaning: input.coffeeCleaning,
          waterCleaning: input.waterCleaning,
          descaling: input.descaling,
          milkCleaning: input.milkCleaning,
          technicalIssues: input.technicalIssues || null,
          repairedBy: input.repairedBy || null,
          serviceCharges: input.serviceCharges || "0",
          totalCost: totalCost.toString(),
          createdBy: ctx.user?.id || null,
        });

        const db = await getDb();
        if (db && input.parts.length > 0) {
          const { serviceParts: partsTable } = await import("../drizzle/schema");
          for (const part of input.parts) {
            await db.insert(partsTable).values({
              recordId: record.insertId,
              partName: part.partName,
              quantity: part.quantity,
              totalCost: part.cost,
            });
          }
        }

        return { id: record.insertId, qrCode };
      }),

    // Protected: Update an existing service record
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          brand: z.enum(["DeLonghi", "Kenwood", "Braun", "NutriBullet", "Other"]),
          modelName: z.string().min(1),
          serialNo: z.string().optional(),
          useInPlace: z.string().optional(),
          purchasePlace: z.enum(["Myanmar", "Overseas"]).optional(),
          customerName: z.string().min(1),
          customerPhone: z.string().optional(),
          customerAddress: z.string().optional(),
          serviceDate: z.string(),
          inDate: z.string().optional(),
          outDate: z.string().optional(),
          coffeeCleaning: z.boolean(),
          waterCleaning: z.boolean(),
          descaling: z.boolean(),
          milkCleaning: z.boolean(),
          technicalIssues: z.string().optional(),
          repairedBy: z.string().optional(),
          serviceCharges: z.string().optional(),
          parts: z.array(
            z.object({
              id: z.number().optional(),
              partName: z.string().min(1),
              quantity: z.number().min(1),
              cost: z.string(),
            })
          ),
        })
      )
      .mutation(async ({ input }) => {
        const serviceDate = new Date(input.serviceDate);
        const inDate = input.inDate ? new Date(input.inDate) : undefined;
        const outDate = input.outDate ? new Date(input.outDate) : undefined;

        const totalCost = input.parts.reduce(
          (sum, part) => sum + parseFloat(part.cost || "0"),
          0
        );

        return updateServiceRecord(input.id, {
          brand: input.brand,
          modelName: input.modelName,
          serialNo: input.serialNo || null,
          useInPlace: input.useInPlace || null,
          purchasePlace: input.purchasePlace || null,
          customerName: input.customerName,
          customerPhone: input.customerPhone || null,
          customerAddress: input.customerAddress || null,
          serviceDate,
          inDate,
          outDate,
          coffeeCleaning: input.coffeeCleaning,
          waterCleaning: input.waterCleaning,
          descaling: input.descaling,
          milkCleaning: input.milkCleaning,
          technicalIssues: input.technicalIssues || null,
          repairedBy: input.repairedBy || null,
          serviceCharges: input.serviceCharges || "0",
          totalCost: totalCost.toString(),
        }, {
          upsert: input.parts.map((p) => ({
            ...p,
            recordId: input.id,
          })),
        });
      }),

    // Admin only: Delete a service record
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteServiceRecord(input.id);
      }),

    // Public: Get all available brands
    brands: publicProcedure.query(async () => {
      return getAllBrands();
    }),
  }),
});

export type AppRouter = typeof appRouter;
