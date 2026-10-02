import { eq, sql } from "drizzle-orm";
import { database } from "../db";
import { workspaces, stores, products, orders, supportTickets, events, searchLogs } from "../db/schema";
import { createFixtures } from "../lib/fixtures";

export function workspaceCookie(cookie: string | null): string | null {
  const match = cookie?.match(/(?:^|;\s*)nova_workspace=([a-f0-9-]{36})(?:;|$)/i);
  return match && /^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i.test(match[1]) ? match[1] : null;
}

// A database lock makes first-request seeding safe across concurrent serverless instances.
export async function ensureWorkspace(id: string, identityUserId: string) {
  const db = database();
  return db.transaction(async transaction => {
    await transaction.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${id}))`);
    const [existing] = await transaction.select().from(workspaces).where(eq(workspaces.id, id));
    if (existing) return existing.identityUserId === identityUserId;
    const fixtures = createFixtures();
    await transaction.insert(workspaces).values({ id, identityUserId });
    await transaction.insert(stores).values(fixtures.stores.map(store => ({ ...store, workspaceId: id, lastInventorySync: new Date(store.lastInventorySync) })));
    await transaction.insert(products).values(fixtures.products.map(product => ({ ...product, workspaceId: id, lastInventorySync: new Date(product.lastInventorySync) })));
    await transaction.insert(orders).values(fixtures.orders.map(order => ({ ...order, workspaceId: id, createdAt: new Date(order.createdAt) })));
    await transaction.insert(supportTickets).values(fixtures.tickets.map(ticket => ({ ...ticket, workspaceId: id, createdAt: new Date(ticket.createdAt) })));
    await transaction.insert(events).values([...fixtures.events].reverse().map(({ id: _id, ...event }) => ({ ...event, workspaceId: id, createdAt: new Date(event.createdAt) })));
    await transaction.insert(searchLogs).values([
      { workspaceId: id, query: "artisan coffee", category: "Local finds", city: "Bengaluru", matchedCount: 2 },
      { workspaceId: id, query: "organic honey", category: "Local finds", city: "Bengaluru", matchedCount: 2 },
      { workspaceId: id, query: "fresh bread", category: "Bakery", city: "Bengaluru", matchedCount: 2 },
    ]);
    return true;
  });
}
