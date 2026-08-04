import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  decimal,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "team_member"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Service records table - stores all service record entries
 */
export const serviceRecords = mysqlTable("service_records", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ServiceRecord = typeof serviceRecords.$inferSelect;
export type InsertServiceRecord = typeof serviceRecords.$inferInsert;

/**
 * Service parts table - stores parts used and costs for each service record
 */
export const serviceParts = mysqlTable("service_parts", {
  id: int("id").autoincrement().primaryKey(),
  recordId: int("recordId").notNull(),
  partName: varchar("partName", { length: 255 }).notNull(),
  partDescription: text("partDescription"),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).default("0"),
  totalCost: decimal("totalCost", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ServicePart = typeof serviceParts.$inferSelect;
export type InsertServicePart = typeof serviceParts.$inferInsert;
