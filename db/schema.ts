import { pgTable, text, uuid, integer, boolean, timestamp, jsonb, serial, primaryKey, index, foreignKey } from "drizzle-orm/pg-core";
import type { OrderItem } from "../lib/types";

export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  requestWindow: timestamp("request_window", { withTimezone: true }).defaultNow().notNull(),
  requestCount: integer("request_count").default(0).notNull(),
  aiRequestedAt: timestamp("ai_requested_at", { withTimezone: true }),
});

export const stores = pgTable("stores", {
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  id: text("id").notNull(), name: text("name").notNull(), owner: text("owner").notNull(),
  city: text("city").notNull(), category: text("category").notNull(), address: text("address").notNull(),
  lastInventorySync: timestamp("last_inventory_sync", { withTimezone: true }).notNull(),
  syncConfidenceScore: integer("sync_confidence_score").default(98).notNull(),
  isAcceptingOrders: boolean("is_accepting_orders").default(true).notNull(),
}, table => [primaryKey({ columns: [table.workspaceId, table.id] })]);

export const products = pgTable("products", {
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  id: text("id").notNull(), storeId: text("store_id").notNull(), name: text("name").notNull(),
  category: text("category").notNull(), kind: text("kind").notNull(), unit: text("unit").notNull(),
  price: integer("price").notNull(), quantity: integer("quantity").notNull(),
  isAvailable: boolean("is_available").default(true).notNull(), visible: boolean("visible").default(true).notNull(),
  lastInventorySync: timestamp("last_inventory_sync", { withTimezone: true }).notNull(),
}, table => [
  primaryKey({ columns: [table.workspaceId, table.id] }),
  foreignKey({ columns: [table.workspaceId, table.storeId], foreignColumns: [stores.workspaceId, stores.id] }).onDelete("cascade"),
]);

export const orders = pgTable("orders", {
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  id: text("id").notNull(), storeId: text("store_id").notNull(), customer: text("customer").notNull(),
  amount: integer("amount").notNull(), items: jsonb("items").$type<OrderItem[]>().notNull(),
  inventoryReserved: boolean("inventory_reserved").default(false).notNull(),
  status: text("status").notNull().default("pending"), refundStatus: text("refund_status").notNull().default("none"),
  refundReference: text("refund_reference"), refundDurationMs: integer("refund_duration_ms"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, table => [
  primaryKey({ columns: [table.workspaceId, table.id] }),
  foreignKey({ columns: [table.workspaceId, table.storeId], foreignColumns: [stores.workspaceId, stores.id] }).onDelete("cascade"),
]);

export const supportTickets = pgTable("support_tickets", {
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  id: text("id").notNull(), orderId: text("order_id").notNull(), reason: text("reason").notNull(),
  status: text("status").notNull().default("open"), autoResolved: boolean("auto_resolved").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, table => [
  primaryKey({ columns: [table.workspaceId, table.id] }),
  foreignKey({ columns: [table.workspaceId, table.orderId], foreignColumns: [orders.workspaceId, orders.id] }).onDelete("cascade"),
]);

export const events = pgTable("orchestration_events", {
  id: serial("id").primaryKey(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  storeId: text("store_id").notNull(), orderId: text("order_id"),
  trigger: text("trigger").notNull(), action: text("action").notNull(), type: text("type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, table => [index("events_workspace_time_idx").on(table.workspaceId, table.createdAt)]);

export const searchLogs = pgTable("search_logs", {
  id: serial("id").primaryKey(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  query: text("query").notNull(), category: text("category").notNull(), city: text("city").notNull(),
  matchedCount: integer("matched_count").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, table => [index("search_workspace_idx").on(table.workspaceId)]);
