import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  createServiceRecord,
  deleteServiceRecord,
  getAllBrands,
  getAllServiceRecords,
  getServiceRecordById,
  getServiceRecordByQrCode,
  updateServiceRecord,
} from "./db";
import { nanoid } from "nanoid";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),

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
          location: z.string().optional(),
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
          customerName: z.string().min(1),
          customerPhone: z.string().optional(),
          customerEmail: z.string().email().optional().or(z.literal("")),
          location: z.enum(["Myanmar", "Overseas"]),
          serviceDate: z.string(),
          nextServiceDate: z.string().optional(),
          coffeeCleaning: z.boolean().default(false),
          waterCleaning: z.boolean().default(false),
          descaling: z.boolean().default(false),
          milkCleaning: z.boolean().default(false),
          notes: z.string().optional(),
          technicianName: z.string().optional(),
          parts: z.array(
            z.object({
              partName: z.string().min(1),
              partDescription: z.string().optional(),
              quantity: z.number().min(1),
              unitPrice: z.string(),
              totalCost: z.string(),
            })
          ),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const qrCode = nanoid(12);
        const serviceDate = new Date(input.serviceDate);
        const nextServiceDate = input.nextServiceDate
          ? new Date(input.nextServiceDate)
          : undefined;

        const totalCost = input.parts.reduce(
          (sum, part) => sum + parseFloat(part.totalCost || "0"),
          0
        );

        const record = await createServiceRecord({
          qrCode,
          brand: input.brand,
          modelName: input.modelName,
          customerName: input.customerName,
          customerPhone: input.customerPhone || null,
          customerEmail: input.customerEmail || null,
          location: input.location,
          serviceDate,
          nextServiceDate,
          coffeeCleaning: input.coffeeCleaning,
          waterCleaning: input.waterCleaning,
          descaling: input.descaling,
          milkCleaning: input.milkCleaning,
          notes: input.notes || null,
          technicianName: input.technicianName || null,
          totalCost: totalCost.toString(),
          createdBy: ctx.user?.id || null,
        });

        const db = await import("./db").then((m) => m.getDb());
        const dbInstance = await db();
        if (dbInstance && input.parts.length > 0) {
          const { serviceParts: partsTable } = await import("../drizzle/schema");
          for (const part of input.parts) {
            await dbInstance.insert(partsTable).values({
              recordId: record.insertId,
              partName: part.partName,
              partDescription: part.partDescription || null,
              quantity: part.quantity,
              unitPrice: part.unitPrice,
              totalCost: part.totalCost,
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
          customerName: z.string().min(1),
          customerPhone: z.string().optional(),
          customerEmail: z.string().email().optional().or(z.literal("")),
          location: z.enum(["Myanmar", "Overseas"]),
          serviceDate: z.string(),
          nextServiceDate: z.string().optional(),
          coffeeCleaning: z.boolean(),
          waterCleaning: z.boolean(),
          descaling: z.boolean(),
          milkCleaning: z.boolean(),
          notes: z.string().optional(),
          technicianName: z.string().optional(),
          parts: z.array(
            z.object({
              id: z.number().optional(),
              partName: z.string().min(1),
              partDescription: z.string().optional(),
              quantity: z.number().min(1),
              unitPrice: z.string(),
              totalCost: z.string(),
            })
          ),
        })
      )
      .mutation(async ({ input }) => {
        const serviceDate = new Date(input.serviceDate);
        const nextServiceDate = input.nextServiceDate
          ? new Date(input.nextServiceDate)
          : undefined;

        const totalCost = input.parts.reduce(
          (sum, part) => sum + parseFloat(part.totalCost || "0"),
          0
        );

        return updateServiceRecord(input.id, {
          brand: input.brand,
          modelName: input.modelName,
          customerName: input.customerName,
          customerPhone: input.customerPhone || null,
          customerEmail: input.customerEmail || null,
          location: input.location,
          serviceDate,
          nextServiceDate,
          coffeeCleaning: input.coffeeCleaning,
          waterCleaning: input.waterCleaning,
          descaling: input.descaling,
          milkCleaning: input.milkCleaning,
          notes: input.notes || null,
          technicianName: input.technicianName || null,
          totalCost: totalCost.toString(),
        }, {
          upsert: input.parts.map((p) => ({
            ...p,
            recordId: input.id,
            partDescription: p.partDescription || null,
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
