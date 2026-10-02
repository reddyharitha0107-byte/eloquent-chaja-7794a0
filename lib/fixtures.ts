import type { Snapshot, Store, Product, Order, Ticket, SystemEvent } from "./types";

// These fixtures initialize a private demo workspace; they are not a persistence layer.
export function createFixtures(): Snapshot {
  const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();
  const stores: Store[] = [
    { id: "ramesh", name: "Ramesh General Store", owner: "Ramesh", city: "Bengaluru", category: "Groceries", address: "Indiranagar · 0.8 km away", lastInventorySync: ago(3), syncConfidenceScore: 98, isAcceptingOrders: true },
    { id: "green-basket", name: "The Green Basket", owner: "Ananya", city: "Bengaluru", category: "Fresh produce", address: "Koramangala · 1.2 km away", lastInventorySync: ago(18), syncConfidenceScore: 98, isAcceptingOrders: true },
    { id: "daily-bread", name: "Daily Bread Bakery", owner: "Joseph", city: "Bengaluru", category: "Bakery", address: "HSR Layout · 1.6 km away", lastInventorySync: ago(40), syncConfidenceScore: 98, isAcceptingOrders: true },
    { id: "local-pantry", name: "The Local Pantry", owner: "Meera", city: "Mumbai", category: "Groceries", address: "Bandra West · 0.6 km away", lastInventorySync: ago(68), syncConfidenceScore: 98, isAcceptingOrders: true },
    { id: "farm-fresh", name: "Farm Fresh Market", owner: "Arjun", city: "Pune", category: "Fresh produce", address: "Koregaon Park · 1.4 km away", lastInventorySync: ago(94), syncConfidenceScore: 98, isAcceptingOrders: true },
    { id: "corner-shop", name: "Corner Shop & Co.", owner: "Priya", city: "Pune", category: "Groceries", address: "Aundh · 2.1 km away", lastInventorySync: ago(26 * 60), syncConfidenceScore: 58, isAcceptingOrders: true },
  ];
  const catalog = [
    { id: "butter", name: "Amul Butter", unit: "500 g", category: "Dairy", kind: "butter" as const, price: 285, quantity: 12 },
    { id: "bread", name: "Harvest Whole Wheat", unit: "400 g", category: "Bakery", kind: "bread" as const, price: 55, quantity: 8 },
    { id: "milk", name: "Nandini Toned Milk", unit: "1 litre", category: "Dairy", kind: "milk" as const, price: 68, quantity: 20 },
    { id: "tomatoes", name: "Farm-fresh Tomatoes", unit: "500 g", category: "Produce", kind: "tomatoes" as const, price: 35, quantity: 15 },
    { id: "honey", name: "Coorg Wildflower Honey", unit: "250 g", category: "Local finds", kind: "honey" as const, price: 240, quantity: 6 },
    { id: "coffee", name: "Neighborhood Filter Coffee", unit: "200 g", category: "Local finds", kind: "coffee" as const, price: 180, quantity: 7 },
  ];
  const products: Product[] = stores.flatMap((store, storeIndex) =>
    catalog.filter((_, productIndex) => storeIndex === 0 || productIndex >= 3 || (store.category === "Bakery" && productIndex === 1)).map(product => ({
      ...product, id: `${store.id}-${product.id}`, storeId: store.id,
      isAvailable: true, visible: true, lastInventorySync: store.lastInventorySync,
    })),
  );
  const orders: Order[] = [
    { id: "NC-48302", storeId: "ramesh", customer: "Aditi S.", amount: 340, items: [{ productId: "ramesh-butter", name: "Amul Butter 500 g", quantity: 1, price: 285 }, { productId: "ramesh-bread", name: "Whole Wheat Bread", quantity: 1, price: 55 }], status: "pending", refundStatus: "none", refundReference: null, refundDurationMs: null, createdAt: ago(1) },
    { id: "NC-48301", storeId: "green-basket", customer: "Rahul M.", amount: 275, items: [], status: "delivered", refundStatus: "none", refundReference: null, refundDurationMs: null, createdAt: ago(12) },
    { id: "NC-48299", storeId: "daily-bread", customer: "Kavya R.", amount: 180, items: [], status: "cancelled", refundStatus: "completed", refundReference: "SIM-NC-48299", refundDurationMs: 400, createdAt: ago(25) },
    { id: "NC-48298", storeId: "local-pantry", customer: "Rohit P.", amount: 240, items: [], status: "cancelled", refundStatus: "completed", refundReference: "SIM-NC-48298", refundDurationMs: 400, createdAt: ago(37) },
    { id: "NC-48297", storeId: "farm-fresh", customer: "Sana A.", amount: 70, items: [], status: "cancelled", refundStatus: "completed", refundReference: "SIM-NC-48297", refundDurationMs: 400, createdAt: ago(52) },
    { id: "NC-48296", storeId: "corner-shop", customer: "Nikhil D.", amount: 180, items: [], status: "cancelled", refundStatus: "completed", refundReference: "SIM-NC-48296", refundDurationMs: 400, createdAt: ago(74) },
  ];
  const tickets: Ticket[] = orders.filter(order => order.refundStatus === "completed").map((order, index) => ({ id: `TKT-${101 + index}`, orderId: order.id, reason: "Order cancelled · refund requested", status: "closed", autoResolved: true, createdAt: order.createdAt }));
  tickets.push({ id: "TKT-105", orderId: "NC-48301", reason: "Delivery feedback", status: "open", autoResolved: false, createdAt: ago(7) });
  const events: SystemEvent[] = [
    { id: 8, storeId: "ramesh", orderId: null, trigger: "Inventory verified", action: "Catalog synced · 6 products confirmed available", type: "inventory", createdAt: ago(3) },
    { id: 7, storeId: "green-basket", orderId: "NC-48301", trigger: "Order delivered", action: "Customer updated · order completed successfully", type: "order", createdAt: ago(12) },
    { id: 6, storeId: "green-basket", orderId: null, trigger: "Inventory verified", action: "Stock freshness updated · confidence restored to 98%", type: "inventory", createdAt: ago(18) },
    { id: 5, storeId: "daily-bread", orderId: "NC-48299", trigger: "Merchant too busy", action: "Simulated refund dispatched · support ticket auto-resolved", type: "refund", createdAt: ago(25) },
    { id: 4, storeId: "local-pantry", orderId: "NC-48298", trigger: "Driver unavailable", action: "Simulated refund dispatched · customer notified instantly", type: "refund", createdAt: ago(37) },
    { id: 3, storeId: "farm-fresh", orderId: null, trigger: "Ghost order prevented", action: "Checkout blocked · nearby local alternatives recommended", type: "deflection", createdAt: ago(44) },
    { id: 2, storeId: "farm-fresh", orderId: "NC-48297", trigger: "Inventory mismatch", action: "Simulated refund dispatched · support ticket auto-resolved", type: "refund", createdAt: ago(52) },
    { id: 1, storeId: "corner-shop", orderId: "NC-48296", trigger: "Store unavailable", action: "Simulated refund dispatched · support ticket auto-resolved", type: "refund", createdAt: ago(74) },
  ];
  return { stores, products, orders, tickets, events };
}
