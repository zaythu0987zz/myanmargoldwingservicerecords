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
      brand: mysqlEnum("brand", ["DeLonghi", "Kenwood", "Braun", "NutriBullet", "Other"]).notNull(),
      modelName: varchar("modelName", { length: 255 }).notNull(),
      customerName: varchar("customerName", { length: 255 }).notNull(),
      customerPhone: varchar("customerPhone", { length: 50 }),
      customerEmail: varchar("customerEmail", { length: 320 }),
      location: mysqlEnum("location", ["Myanmar", "Overseas"]).notNull(),
      serviceDate: timestamp("serviceDate").notNull(),
      nextServiceDate: timestamp("nextServiceDate"),
      coffeeCleaning: boolean("coffeeCleaning").default(false).notNull(),
      waterCleaning: boolean("waterCleaning").default(false).notNull(),
      descaling: boolean("descaling").default(false).notNull(),
      milkCleaning: boolean("milkCleaning").default(false).notNull(),
      notes: text("notes"),
      technicianName: varchar("technicianName", { length: 255 }),
      totalCost: decimal("totalCost", { precision: 10, scale: 2 }),
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
      unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
      totalCost: decimal("totalCost", { precision: 10, scale: 2 }).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
  }
});

// server/_core/env.ts
var ENV;
var init_env = __esm({
  "server/_core/env.ts"() {
    "use strict";
    ENV = {
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
  }
});

// server/db.ts
var db_exports = {};
__export(db_exports, {
  createServiceRecord: () => createServiceRecord,
  deleteServiceRecord: () => deleteServiceRecord,
  getAllBrands: () => getAllBrands,
  getAllServiceRecords: () => getAllServiceRecords,
  getDb: () => getDb,
  getServiceRecordById: () => getServiceRecordById,
  getServiceRecordByQrCode: () => getServiceRecordByQrCode,
  getUserById: () => getUserById,
  getUserByOpenId: () => getUserByOpenId,
  updateServiceRecord: () => updateServiceRecord,
  upsertUser: () => upsertUser
});
import { eq, desc, and, gte, lte, like, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
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
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      openId: user.openId
    };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getUserById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
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
  if (params?.location && params.location !== "All") {
    conditions.push(eq(serviceRecords.location, params.location));
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
  if (partsData.delete && partsData.delete.length > 0) {
    await db.delete(serviceParts).where(sql`${serviceParts.id} IN (${sql.join(partsData.delete, sql`, `)})`);
  }
  if (partsData.upsert.length > 0) {
    for (const part of partsData.upsert) {
      if (part.id) {
        await db.update(serviceParts).set({
          partName: part.partName,
          partDescription: part.partDescription,
          quantity: part.quantity,
          unitPrice: part.unitPrice,
          totalCost: part.totalCost
        }).where(eq(serviceParts.id, part.id));
      } else {
        await db.insert(serviceParts).values(part);
      }
    }
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
var _db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    init_env();
    _db = null;
  }
});

// server/_core/index.ts
import express from "express";
import path from "node:path";
import cookieParser from "cookie-parser";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "__session";
var APP_ID = process.env.VITE_APP_ID || "";
var ANALYTICS_ENDPOINT = process.env.VITE_ANALYTICS_ENDPOINT || "";
var ANALYTICS_WEBSITE_ID = process.env.VITE_ANALYTICS_WEBSITE_ID || "";

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
init_db();
init_env();
import { z } from "zod";
import { nanoid } from "nanoid";
import { SignJWT } from "jose";
var VALID_PIN = "191995";
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    loginPin: publicProcedure.input(z.object({ pin: z.string() })).mutation(async ({ input, ctx }) => {
      if (input.pin !== VALID_PIN) {
        throw new Error("Invalid PIN. Please try again.");
      }
      const secret = new TextEncoder().encode(ENV.jwtSecret);
      const token = await new SignJWT({
        sub: "1",
        name: "Admin",
        role: "admin"
      }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("30d").sign(secret);
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, {
        ...cookieOptions,
        httpOnly: true,
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60
        // 30 days
      });
      return { success: true, user: { id: "1", name: "Admin", role: "admin" } };
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
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
        location: z.string().optional(),
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
    // Protected: Create a new service record
    create: protectedProcedure.input(
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
            totalCost: z.string()
          })
        )
      })
    ).mutation(async ({ input, ctx }) => {
      const qrCode = nanoid(12);
      const serviceDate = new Date(input.serviceDate);
      const nextServiceDate = input.nextServiceDate ? new Date(input.nextServiceDate) : void 0;
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
        createdBy: ctx.user?.id || null
      });
      const db = await Promise.resolve().then(() => (init_db(), db_exports)).then((m) => m.getDb());
      const dbInstance = await db();
      if (dbInstance && input.parts.length > 0) {
        const { serviceParts: partsTable } = await Promise.resolve().then(() => (init_schema(), schema_exports));
        for (const part of input.parts) {
          await dbInstance.insert(partsTable).values({
            recordId: record.insertId,
            partName: part.partName,
            partDescription: part.partDescription || null,
            quantity: part.quantity,
            unitPrice: part.unitPrice,
            totalCost: part.totalCost
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
            totalCost: z.string()
          })
        )
      })
    ).mutation(async ({ input }) => {
      const serviceDate = new Date(input.serviceDate);
      const nextServiceDate = input.nextServiceDate ? new Date(input.nextServiceDate) : void 0;
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
        totalCost: totalCost.toString()
      }, {
        upsert: input.parts.map((p) => ({
          ...p,
          recordId: input.id,
          partDescription: p.partDescription || null
        }))
      });
    }),
    // Admin only: Delete a service record
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      return deleteServiceRecord(input.id);
    }),
    // Public: Get all available brands
    brands: publicProcedure.query(async () => {
      return getAllBrands();
    })
  })
});

// server/_core/context.ts
init_env();
async function createContext(opts) {
  const { req, res } = opts;
  let user = null;
  try {
    const cookies = parseCookie(req.headers.cookie ?? "");
    const token = cookies[COOKIE_NAME];
    if (token) {
      const { jwtVerify } = await import("jose");
      const secret = new TextEncoder().encode(ENV.jwtSecret);
      try {
        const { payload } = await jwtVerify(token, secret);
        user = {
          id: Number(payload.sub) || 1,
          name: payload.name || "Admin",
          role: payload.role || "admin"
        };
      } catch {
      }
    }
  } catch {
  }
  return { user, req, res };
}

// server/_core/index.ts
init_env();
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
