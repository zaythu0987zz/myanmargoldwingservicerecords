import { eq, desc, and, gte, lte, like, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertServiceRecord,
  InsertServicePart,
  InsertUser,
  serviceRecords,
  serviceParts,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
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

// ─── User Operations ─────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Service Record Operations ───────────────────────────────────────────────

export async function createServiceRecord(record: InsertServiceRecord) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [newRecord] = await db.insert(serviceRecords).values(record);
  return newRecord;
}

export async function getServiceRecordById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const [record] = await db
    .select()
    .from(serviceRecords)
    .where(eq(serviceRecords.id, id))
    .limit(1);

  if (!record) return undefined;

  // Fetch associated parts
  const parts = await db
    .select()
    .from(serviceParts)
    .where(eq(serviceParts.recordId, record.id));

  return { ...record, parts };
}

export async function getServiceRecordByQrCode(qrCode: string) {
  const db = await getDb();
  if (!db) return undefined;

  const [record] = await db
    .select()
    .from(serviceRecords)
    .where(eq(serviceRecords.qrCode, qrCode))
    .limit(1);

  if (!record) return undefined;

  const parts = await db
    .select()
    .from(serviceParts)
    .where(eq(serviceParts.recordId, record.id));

  return { ...record, parts };
}

export async function getAllServiceRecords(params?: {
  page?: number;
  limit?: number;
  search?: string;
  brand?: string;
  location?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
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
    conditions.push(eq(serviceRecords.brand, params.brand as any));
  }

  if (params?.purchasePlace && params.purchasePlace !== "All") {
    conditions.push(eq(serviceRecords.purchasePlace, params.purchasePlace as any));
  }

  if (params?.dateFrom) {
    conditions.push(gte(serviceRecords.serviceDate, new Date(params.dateFrom)));
  }

  if (params?.dateTo) {
    conditions.push(lte(serviceRecords.serviceDate, new Date(params.dateTo)));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const records = await db
    .select()
    .from(serviceRecords)
    .where(whereClause)
    .orderBy(desc(serviceRecords.serviceDate))
    .limit(limit)
    .offset(offset);

  // Count total
  const [{ count }] = await db
    .select({ count: sql`count(*)` })
    .from(serviceRecords)
    .where(whereClause);

  return { records, total: Number(count) };
}

export async function updateServiceRecord(
  id: number,
  record: Partial<InsertServiceRecord>,
  partsData: { delete?: number[]; upsert: InsertServicePart[] }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Update the record
  await db
    .update(serviceRecords)
    .set({
      ...record,
      updatedAt: new Date(),
    })
    .where(eq(serviceRecords.id, id));

  // Delete ALL existing parts for this record
  await db.delete(serviceParts).where(eq(serviceParts.recordId, id));

    // Insert all parts fresh (no upsert needed since we deleted all)
  if (partsData.upsert.length > 0) {
    // Insert in batch for better performance
    await db.insert(serviceParts).values(
      partsData.upsert.map((p) => ({
        recordId: id,
        partName: p.partName,
        quantity: p.quantity,
        unitPrice: p.unitPrice,
        totalCost: p.totalCost,
      }))
    );
  }

  return getServiceRecordById(id);
}

export async function deleteServiceRecord(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete associated parts first
  await db.delete(serviceParts).where(eq(serviceParts.recordId, id));

  // Delete the record
  await db.delete(serviceRecords).where(eq(serviceRecords.id, id));

  return { success: true };
}

export async function getAllBrands() {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .selectDistinct({ brand: serviceRecords.brand })
    .from(serviceRecords);

  return result.map((r) => r.brand!);
}

// ─── Analytics Operations ──────────────────────────────────────────────────

export async function getAnalyticsData(params?: {
  year?: number;
  month?: number; // 0 = all months
}) {
  const db = await getDb();
  if (!db) return null;

  // Build date range conditions
  const conditions = [];
  if (params?.year) {
    if (params.month && params.month > 0) {
      // Specific month
      const startDate = new Date(params.year, params.month - 1, 1);
      const endDate = new Date(params.year, params.month, 0, 23, 59, 59);
      conditions.push(gte(serviceRecords.serviceDate, startDate));
      conditions.push(lte(serviceRecords.serviceDate, endDate));
    } else {
      // Full year
      const startDate = new Date(params.year, 0, 1);
      const endDate = new Date(params.year, 11, 31, 23, 59, 59);
      conditions.push(gte(serviceRecords.serviceDate, startDate));
      conditions.push(lte(serviceRecords.serviceDate, endDate));
    }
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // 1. Financial overview
  const [financial] = await db
    .select({
      totalRecords: sql<number>`count(*)`,
      totalServiceCharges: sql<number>`coalesce(sum(${serviceRecords.serviceCharges}), 0)`,
      totalPartsCost: sql<number>`coalesce(sum(${serviceRecords.totalCost}), 0)`,
      grandTotal: sql<number>`coalesce(sum(${serviceRecords.serviceCharges}), 0) + coalesce(sum(${serviceRecords.totalCost}), 0)`,
    })
    .from(serviceRecords)
    .where(whereClause);

  // 2. Technician performance
  const technicianData = await db
    .select({
      technicianName: serviceRecords.repairedBy,
      jobCount: sql<number>`count(*)`,
      totalServiceCharges: sql<number>`coalesce(sum(${serviceRecords.serviceCharges}), 0)`,
      totalPartsCost: sql<number>`coalesce(sum(${serviceRecords.totalCost}), 0)`,
      grandTotal: sql<number>`coalesce(sum(${serviceRecords.serviceCharges}), 0) + coalesce(sum(${serviceRecords.totalCost}), 0)`,
    })
    .from(serviceRecords)
    .where(whereClause)
    .groupBy(serviceRecords.repairedBy)
    .orderBy(sql<number>`grandTotal desc`);

  // 3. Brand breakdown
  const brandData = await db
    .select({
      brand: serviceRecords.brand,
      count: sql<number>`count(*)`,
    })
    .from(serviceRecords)
    .where(whereClause)
    .groupBy(serviceRecords.brand)
    .orderBy(sql<number>`count desc`);

  // 4. Monthly breakdown (for charts)
  const monthlyData = await db
    .select({
      year: sql<number>`year(${serviceRecords.serviceDate})`,
      month: sql<number>`month(${serviceRecords.serviceDate})`,
      recordCount: sql<number>`count(*)`,
      totalRevenue: sql<number>`coalesce(sum(${serviceRecords.serviceCharges}), 0) + coalesce(sum(${serviceRecords.totalCost}), 0)`,
    })
    .from(serviceRecords)
    .where(whereClause)
    .groupBy(sql`year(${serviceRecords.serviceDate})`, sql`month(${serviceRecords.serviceDate})`)
    .orderBy(sql<number>`year`, sql<number>`month`);

  // 5. Available years for filter
  const availableYears = await db
    .select({
      year: sql<number>`year(${serviceRecords.serviceDate})`,
    })
    .from(serviceRecords)
    .groupBy(sql`year(${serviceRecords.serviceDate})`)
    .orderBy(sql<number>`year desc`);

  return {
    financial: {
      totalRecords: Number(financial?.totalRecords || 0),
      totalServiceCharges: parseFloat(String(financial?.totalServiceCharges || 0)),
      totalPartsCost: parseFloat(String(financial?.totalPartsCost || 0)),
      grandTotal: parseFloat(String(financial?.grandTotal || 0)),
    },
    technicians: technicianData.map((t) => ({
      name: t.technicianName || "Unassigned",
      jobCount: Number(t.jobCount),
      totalServiceCharges: parseFloat(String(t.totalServiceCharges || 0)),
      totalPartsCost: parseFloat(String(t.totalPartsCost || 0)),
      grandTotal: parseFloat(String(t.grandTotal || 0)),
    })),
    brands: brandData.map((b) => ({
      brand: b.brand || "Unknown",
      count: Number(b.count),
    })),
    monthlyData: monthlyData.map((m) => ({
      year: Number(m.year),
      month: Number(m.month),
      recordCount: Number(m.recordCount),
      totalRevenue: parseFloat(String(m.totalRevenue || 0)),
    })),
    availableYears: availableYears.map((y) => Number(y.year)).sort((a, b) => b - a),
  };
}
