import { and, eq, desc, sql } from "drizzle-orm";
import { database } from "../db";
import { stores, products, orders, supportTickets, events } from "../db/schema";
import { confidence } from "../lib/types";

export async function readSnapshot(workspaceId: string) {
  const db = database();
  const [storeRows, productRows, orderRows, ticketRows, eventRows, deflections, resolutions, retailerSales] = await Promise.all([
    db.select().from(stores).where(eq(stores.workspaceId, workspaceId)),
    db.select().from(products).where(eq(products.workspaceId, workspaceId)),
    db.select().from(orders).where(eq(orders.workspaceId, workspaceId)).orderBy(desc(orders.createdAt)).limit(100),
    db.select().from(supportTickets).where(eq(supportTickets.workspaceId, workspaceId)),
    db.select().from(events).where(eq(events.workspaceId, workspaceId)).orderBy(desc(events.id)).limit(100),
    db.select({ city: stores.city, count: sql<number>`COUNT(*)::int` }).from(events)
      .innerJoin(stores, and(eq(stores.workspaceId, events.workspaceId), eq(stores.id, events.storeId)))
      .where(and(eq(events.workspaceId, workspaceId), eq(events.type, "deflection"))).groupBy(stores.city),
    db.select({ city: stores.city, count: sql<number>`COUNT(*)::int` }).from(supportTickets)
      .innerJoin(orders, and(eq(orders.workspaceId, supportTickets.workspaceId), eq(orders.id, supportTickets.orderId)))
      .innerJoin(stores, and(eq(stores.workspaceId, orders.workspaceId), eq(stores.id, orders.storeId)))
      .where(and(eq(supportTickets.workspaceId, workspaceId), eq(supportTickets.autoResolved, true))).groupBy(stores.city),
    db.select({ storeId: orders.storeId, completedOrders: sql<number>`COUNT(*)::int`, revenue: sql<number>`COALESCE(SUM(${orders.amount}), 0)::float8` })
      .from(orders).where(and(eq(orders.workspaceId, workspaceId), eq(orders.status, "delivered"), eq(orders.refundStatus, "none"))).groupBy(orders.storeId),
  ]);
  const stripWorkspace = <RecordType extends { workspaceId: string }>(record: RecordType) => {
    const { workspaceId: _workspace, ...safe } = record;
    return safe;
  };
  return {
    stores: storeRows.map(store => ({ ...stripWorkspace(store), syncConfidenceScore: confidence(store.lastInventorySync) })),
    products: productRows.map(stripWorkspace), orders: orderRows.map(stripWorkspace),
    tickets: ticketRows.map(stripWorkspace), events: eventRows.map(stripWorkspace),
    retailerSales,
    totals: [...new Set(storeRows.map(store => store.city))].map(city => ({
      city, deflected: deflections.find(total => total.city === city)?.count ?? 0,
      autoResolved: resolutions.find(total => total.city === city)?.count ?? 0,
    })),
  };
}
