var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// drizzle/schema.ts
var schema_exports = {};
__export(schema_exports, {
  serviceParts: () => serviceParts,
  serviceRecords: () => serviceRecords,
  users: () => users
});
import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  decimal
} from "drizzle-orm/mysql-core";
var users, serviceRecords, serviceParts;
var init_schema = __esm({
  "drizzle/schema.ts"() {
    "use strict";
    users = mysqlTable("users", {
      id: int("id").autoincrement().primaryKey(),
      openId: varchar("openId", { length: 64 }).notNull().unique(),
      name: text("name"),
      email: varchar("email", { length: 320 }),
      loginMethod: varchar("loginMethod", { length: 64 }),
      role: mysqlEnum("role", ["user", "admin", "team_member"]).default("user").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
      lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
    });
    serviceRecords = mysqlTable("service_records", {
      id: int("id").autoincrement().primaryKey(),
      qrCode: varchar("qrCode", { length: 255 }).unique().notNull(),
      // Product Information
      brand: mysqlEnum("brand", ["DeLonghi", "Kenwood", "Braun", "NutriBullet", "Other"]).notNull(),
      modelName: varchar("modelName", { length: 255 }).notNull(),
      serialNo: varchar("serialNo", { length: 255 }),
      useInPlace: varchar("useInPlace", { length: 255 }),
      purchasePlace: mysqlEnum("purchasePlace", ["Myanmar", "Overseas"]).default("Myanmar").notNull(),
      serviceDate: timestamp("serviceDate").notNull(),
      // Customer Information
      customerName: varchar("customerName", { length: 255 }).notNull(),
      customerPhone: varchar("customerPhone", { length: 50 }),
      customerAddress: text("customerAddress"),
      // Machine Issues & Checklist
      inDate: timestamp("inDate"),
      outDate: timestamp("outDate"),
      coffeeCleaning: boolean("coffeeCleaning").default(false).notNull(),
      waterCleaning: boolean("waterCleaning").default(false).notNull(),
      descaling: boolean("descaling").default(false).notNull(),
      milkCleaning: boolean("milkCleaning").default(false).notNull(),
      technicalIssues: text("technicalIssues"),
      // Repair Information
      repairedBy: varchar("repairedBy", { length: 255 }),
      serviceCharges: decimal("serviceCharges", { precision: 10, scale: 2 }),
      totalCost: decimal("totalCost", { precision: 10, scale: 2 }),
      // Metadata
      notes: text("notes"),
      technicianName: varchar("technicianName", { length: 255 }),
      createdBy: int("createdBy"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    serviceParts = mysqlTable("service_parts", {
      id: int("id").autoincrement().primaryKey(),
      recordId: int("recordId").notNull(),
      partName: varchar("partName", { length: 255 }).notNull(),
      partDescription: text("partDescription"),
      quantity: int("quantity").notNull(),
      unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).default("0"),
      totalCost: decimal("totalCost", { precision: 10, scale: 2 }).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
  }
});

// server/_core/index.ts
import express from "express";
import path from "node:path";
import cookieParser from "cookie-parser";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// server/_core/cookies.ts
function getSessionCookieOptions(req) {
  const isProd = process.env.NODE_ENV === "production";
  return {
    maxAge: 60 * 60 * 24 * 30,
    // 30 days
    httpOnly: true,
    secure: isProd,
    // Only secure in production (HTTPS)
    sameSite: "lax",
    path: "/"
  };
}
function parseCookie(cookieStr) {
  const cookies = {};
  if (!cookieStr) return cookies;
  cookieStr.split(";").forEach((part) => {
    const [key, ...rest] = part.split("=");
    if (key) {
      cookies[key.trim()] = decodeURIComponent(rest.join("=").trim());
    }
  });
  return cookies;
}

// server/_core/trpc.ts
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var middleware = t.middleware;
var isAuthed = middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});
var protectedProcedure = t.procedure.use(isAuthed);
var adminProcedure = t.procedure.use(isAuthed);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: protectedProcedure.query(() => {
    return { status: "ok", timestamp: Date.now() };
  })
});

// server/routers.ts
import { TRPCError as TRPCError2 } from "@trpc/server";

// shared/const.ts
var COOKIE_NAME = "__session";
var APP_ID = process.env.VITE_APP_ID || "";
var ANALYTICS_ENDPOINT = process.env.VITE_ANALYTICS_ENDPOINT || "";
var ANALYTICS_WEBSITE_ID = process.env.VITE_ANALYTICS_WEBSITE_ID || "";

// server/routers.ts
import { z } from "zod";
import { Buffer as Buffer2 } from "buffer";

// server/db.ts
init_schema();
import { eq, desc, and, gte, lte, like, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";

// server/_core/env.ts
var ENV = {
  databaseUrl: process.env.DATABASE_URL || "",
  jwtSecret: process.env.JWT_SECRET || "goldwing-service-app-secret-key-2024",
  ownerOpenId: process.env.OWNER_OPEN_ID || "",
  ownerName: process.env.OWNER_NAME || "",
  port: Number(process.env.PORT) || 3e3,
  nodeEnv: process.env.NODE_ENV || "development",
  appId: process.env.VITE_APP_ID || "",
  oauthPortalUrl: process.env.OAUTH_SERVER_URL || "",
  oauthCallbackUrl: process.env.OAUTH_CALLBACK_URL || "",
  builtInForgeApiUrl: process.env.BUILT_IN_FORGE_API_URL || "",
  builtInForgeApiKey: process.env.BUILT_IN_FORGE_API_KEY || "",
  frontendForgeApiUrl: process.env.VITE_FRONTEND_FORGE_API_URL || "",
  frontendForgeApiKey: process.env.VITE_FRONTEND_FORGE_API_KEY || ""
};

// server/db.ts
var _db = null;
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
async function createServiceRecord(record) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [newRecord] = await db.insert(serviceRecords).values(record);
  return newRecord;
}
async function getServiceRecordById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const [record] = await db.select().from(serviceRecords).where(eq(serviceRecords.id, id)).limit(1);
  if (!record) return void 0;
  const parts = await db.select().from(serviceParts).where(eq(serviceParts.recordId, record.id));
  return { ...record, parts };
}
async function getServiceRecordByQrCode(qrCode) {
  const db = await getDb();
  if (!db) return void 0;
  const [record] = await db.select().from(serviceRecords).where(eq(serviceRecords.qrCode, qrCode)).limit(1);
  if (!record) return void 0;
  const parts = await db.select().from(serviceParts).where(eq(serviceParts.recordId, record.id));
  return { ...record, parts };
}
async function getAllServiceRecords(params) {
  const db = await getDb();
  if (!db) return { records: [], total: 0 };
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  const offset = (page - 1) * limit;
  const conditions = [];
  if (params?.search) {
    const searchTerm = `%${params.search}%`;
    conditions.push(
      sql`(${like(serviceRecords.customerName, searchTerm)} OR ${like(serviceRecords.modelName, searchTerm)} OR ${like(serviceRecords.technicianName, searchTerm)})`
    );
  }
  if (params?.brand && params.brand !== "All") {
    conditions.push(eq(serviceRecords.brand, params.brand));
  }
  if (params?.purchasePlace && params.purchasePlace !== "All") {
    conditions.push(eq(serviceRecords.purchasePlace, params.purchasePlace));
  }
  if (params?.dateFrom) {
    conditions.push(gte(serviceRecords.serviceDate, new Date(params.dateFrom)));
  }
  if (params?.dateTo) {
    conditions.push(lte(serviceRecords.serviceDate, new Date(params.dateTo)));
  }
  const whereClause = conditions.length > 0 ? and(...conditions) : void 0;
  const records = await db.select().from(serviceRecords).where(whereClause).orderBy(desc(serviceRecords.serviceDate)).limit(limit).offset(offset);
  const [{ count }] = await db.select({ count: sql`count(*)` }).from(serviceRecords).where(whereClause);
  return { records, total: Number(count) };
}
async function updateServiceRecord(id, record, partsData) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(serviceRecords).set({
    ...record,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(serviceRecords.id, id));
  await db.delete(serviceParts).where(eq(serviceParts.recordId, id));
  if (partsData.upsert.length > 0) {
    await db.insert(serviceParts).values(
      partsData.upsert.map((p) => ({
        recordId: id,
        partName: p.partName,
        quantity: p.quantity,
        unitPrice: p.unitPrice,
        totalCost: p.totalCost
      }))
    );
  }
  return getServiceRecordById(id);
}
async function deleteServiceRecord(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(serviceParts).where(eq(serviceParts.recordId, id));
  await db.delete(serviceRecords).where(eq(serviceRecords.id, id));
  return { success: true };
}
async function getAllBrands() {
  const db = await getDb();
  if (!db) return [];
  const result = await db.selectDistinct({ brand: serviceRecords.brand }).from(serviceRecords);
  return result.map((r) => r.brand);
}
async function getAnalyticsData(params) {
  const db = await getDb();
  if (!db) return null;
  const conditions = [];
  if (params?.year) {
    if (params.month && params.month > 0) {
      const startDate = new Date(params.year, params.month - 1, 1);
      const endDate = new Date(params.year, params.month, 0, 23, 59, 59);
      conditions.push(gte(serviceRecords.serviceDate, startDate));
      conditions.push(lte(serviceRecords.serviceDate, endDate));
    } else {
      const startDate = new Date(params.year, 0, 1);
      const endDate = new Date(params.year, 11, 31, 23, 59, 59);
      conditions.push(gte(serviceRecords.serviceDate, startDate));
      conditions.push(lte(serviceRecords.serviceDate, endDate));
    }
  }
  const whereClause = conditions.length > 0 ? and(...conditions) : void 0;
  const [financial] = await db.select({
    totalRecords: sql`count(*)`,
    totalServiceCharges: sql`coalesce(sum(${serviceRecords.serviceCharges}), 0)`,
    totalPartsCost: sql`coalesce(sum(${serviceRecords.totalCost}), 0)`,
    grandTotal: sql`coalesce(sum(${serviceRecords.serviceCharges}), 0) + coalesce(sum(${serviceRecords.totalCost}), 0)`
  }).from(serviceRecords).where(whereClause);
  const technicianData = await db.select({
    technicianName: serviceRecords.repairedBy,
    jobCount: sql`count(*)`,
    totalServiceCharges: sql`coalesce(sum(${serviceRecords.serviceCharges}), 0)`,
    totalPartsCost: sql`coalesce(sum(${serviceRecords.totalCost}), 0)`,
    grandTotal: sql`coalesce(sum(${serviceRecords.serviceCharges}), 0) + coalesce(sum(${serviceRecords.totalCost}), 0)`
  }).from(serviceRecords).where(whereClause).groupBy(serviceRecords.repairedBy).orderBy(sql`grandTotal desc`);
  const brandData = await db.select({
    brand: serviceRecords.brand,
    count: sql`count(*)`
  }).from(serviceRecords).where(whereClause).groupBy(serviceRecords.brand).orderBy(sql`count desc`);
  const monthlyData = await db.select({
    year: sql`year(${serviceRecords.serviceDate})`,
    month: sql`month(${serviceRecords.serviceDate})`,
    recordCount: sql`count(*)`,
    totalRevenue: sql`coalesce(sum(${serviceRecords.serviceCharges}), 0) + coalesce(sum(${serviceRecords.totalCost}), 0)`
  }).from(serviceRecords).where(whereClause).groupBy(sql`year(${serviceRecords.serviceDate})`, sql`month(${serviceRecords.serviceDate})`).orderBy(sql`year`, sql`month`);
  const availableYears = await db.select({
    year: sql`year(${serviceRecords.serviceDate})`
  }).from(serviceRecords).groupBy(sql`year(${serviceRecords.serviceDate})`).orderBy(sql`year desc`);
  return {
    financial: {
      totalRecords: Number(financial?.totalRecords || 0),
      totalServiceCharges: parseFloat(String(financial?.totalServiceCharges || 0)),
      totalPartsCost: parseFloat(String(financial?.totalPartsCost || 0)),
      grandTotal: parseFloat(String(financial?.grandTotal || 0))
    },
    technicians: technicianData.map((t2) => ({
      name: t2.technicianName || "Unassigned",
      jobCount: Number(t2.jobCount),
      totalServiceCharges: parseFloat(String(t2.totalServiceCharges || 0)),
      totalPartsCost: parseFloat(String(t2.totalPartsCost || 0)),
      grandTotal: parseFloat(String(t2.grandTotal || 0))
    })),
    brands: brandData.map((b) => ({
      brand: b.brand || "Unknown",
      count: Number(b.count)
    })),
    monthlyData: monthlyData.map((m) => ({
      year: Number(m.year),
      month: Number(m.month),
      recordCount: Number(m.recordCount),
      totalRevenue: parseFloat(String(m.totalRevenue || 0))
    })),
    availableYears: availableYears.map((y) => Number(y.year)).sort((a, b) => b - a)
  };
}

// server/routers.ts
import { nanoid } from "nanoid";
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    loginPin: publicProcedure.input(z.object({ pin: z.string() })).mutation(({ input, ctx }) => {
      const VALID_PIN = "191995";
      if (input.pin !== VALID_PIN) {
        throw new TRPCError2({ code: "UNAUTHORIZED", message: "Invalid PIN" });
      }
      const { JWT } = ctx.res.locals || {};
      const jwtSecret = process.env.JWT_SECRET || "goldwing-service-app-secret-key-2024";
      const token = (() => {
        const header = Buffer2.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
        const payload = Buffer2.from(JSON.stringify({ sub: "1", name: "Admin", role: "admin", iat: Math.floor(Date.now() / 1e3) })).toString("base64url");
        return `${header}.${payload}.pin-auth`;
      })();
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1e3 });
      return {
        success: true,
        user: { id: 1, name: "Admin", role: "admin" }
      };
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie("__session", { ...cookieOptions, maxAge: -1 });
      return {
        success: true
      };
    })
  }),
  serviceRecords: router({
    // Public: Get all service records with pagination and filters
    list: publicProcedure.input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        search: z.string().optional(),
        brand: z.string().optional(),
        purchasePlace: z.string().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional()
      })
    ).query(async ({ input }) => {
      return getAllServiceRecords(input);
    }),
    // Public: Get a single service record by ID
    getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return getServiceRecordById(input.id);
    }),
    // Public: Get a service record by QR code
    getByQrCode: publicProcedure.input(z.object({ qrCode: z.string() })).query(async ({ input }) => {
      return getServiceRecordByQrCode(input.qrCode);
    }),
    // Public: Create a new service record (no login required)
    create: publicProcedure.input(
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
            cost: z.string().default("0")
          })
        )
      })
    ).mutation(async ({ input, ctx }) => {
      const qrCode = nanoid(12);
      const serviceDate = new Date(input.serviceDate);
      const inDate = input.inDate ? new Date(input.inDate) : void 0;
      const outDate = input.outDate ? new Date(input.outDate) : void 0;
      const totalCost = input.parts.reduce(
        (sum, part) => sum + parseFloat(part.cost || "0"),
        0
      );
      const record = await createServiceRecord({
        qrCode,
        brand: input.brand,
        modelName: input.modelName,
        serialNo: input.serialNo || void 0,
        useInPlace: input.useInPlace || void 0,
        purchasePlace: input.purchasePlace || "Myanmar",
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
        createdBy: ctx.user?.id || null
      });
      const db = await getDb();
      if (db && input.parts.length > 0) {
        const { serviceParts: partsTable } = await Promise.resolve().then(() => (init_schema(), schema_exports));
        for (const part of input.parts) {
          const partTotal = parseFloat(part.cost) || 0;
          const partQty = part.quantity || 1;
          const unitPrice = partQty > 0 ? (partTotal / partQty).toFixed(2) : "0";
          await db.insert(partsTable).values({
            recordId: record.insertId,
            partName: part.partName,
            quantity: partQty,
            unitPrice,
            totalCost: part.cost
          });
        }
      }
      return { id: record.insertId, qrCode };
    }),
    // Protected: Update an existing service record
    update: protectedProcedure.input(
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
            cost: z.string()
          })
        )
      })
    ).mutation(async ({ input }) => {
      const serviceDate = new Date(input.serviceDate);
      const inDate = input.inDate ? new Date(input.inDate) : void 0;
      const outDate = input.outDate ? new Date(input.outDate) : void 0;
      const totalCost = input.parts.reduce(
        (sum, part) => sum + parseFloat(part.cost || "0"),
        0
      );
      const purchasePlace = input.purchasePlace && input.purchasePlace.length > 0 ? input.purchasePlace : "Myanmar";
      return updateServiceRecord(input.id, {
        brand: input.brand,
        modelName: input.modelName,
        serialNo: input.serialNo || void 0,
        useInPlace: input.useInPlace || void 0,
        purchasePlace,
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
        totalCost: totalCost.toString()
      }, {
        upsert: input.parts.map((p) => {
          const partTotal = parseFloat(p.cost) || 0;
          const partQty = p.quantity || 1;
          const unitPrice = partQty > 0 ? (partTotal / partQty).toFixed(2) : "0";
          return {
            recordId: input.id,
            partName: p.partName,
            quantity: partQty,
            unitPrice,
            totalCost: p.cost
          };
        })
      });
    }),
    // Admin only: Delete a service record
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      return deleteServiceRecord(input.id);
    }),
    // Public: Get all available brands
    brands: publicProcedure.query(async () => {
      return getAllBrands();
    }),
    // Public: Get analytics data with year/month filtering
    analytics: publicProcedure.input(
      z.object({
        year: z.number().optional(),
        month: z.number().optional()
      }).optional()
    ).query(async ({ input }) => {
      return getAnalyticsData(input);
    })
  })
});

// server/_core/context.ts
var DEFAULT_ADMIN = {
  id: 1,
  name: "Admin",
  role: "admin"
};
async function createContext(opts) {
  const { req, res } = opts;
  let user = null;
  try {
    const cookies = parseCookie(req.headers.cookie ?? "");
    const token = cookies[COOKIE_NAME];
    if (token) {
      try {
        const { jwtVerify } = await import("jose");
        const secret = new TextEncoder().encode(ENV.jwtSecret);
        const { payload } = await jwtVerify(token, secret);
        user = {
          id: Number(payload.sub) || 1,
          name: payload.name || "Admin",
          role: payload.role || "admin"
        };
      } catch {
        user = DEFAULT_ADMIN;
      }
    } else {
      const authHeader = req.headers?.authorization || req.headers?.Authorization;
      if (authHeader && typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
        user = DEFAULT_ADMIN;
      }
    }
  } catch {
  }
  return { user, req, res };
}

// server/_core/index.ts
var app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
var publicPath = path.resolve(import.meta.dirname, "..", "dist", "public");
app.use(express.static(publicPath));
app.get(/^(?!\/api\/).*/, (_req, res) => {
  res.sendFile(path.join(publicPath, "index.html"), (err) => {
    if (err) {
      res.status(404).send("Not Found");
    }
  });
});
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext
  })
);
var port = ENV.port;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log(`   Environment: ${ENV.nodeEnv}`);
  if (ENV.databaseUrl) {
    console.log("   Database: Connected");
  } else {
    console.warn("   Database: No DATABASE_URL configured");
  }
});
