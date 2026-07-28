import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  decimal,
  json,
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
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  totalCost: decimal("totalCost", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ServicePart = typeof serviceParts.$inferSelect;
export type InsertServicePart = typeof serviceParts.$inferInsert;
