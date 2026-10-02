export type Persona = "operations" | "merchant" | "customer";
export type City = "All cities" | "Bengaluru" | "Mumbai" | "Pune";
export type ProductKind = "butter" | "bread" | "milk" | "tomatoes" | "honey" | "coffee";

export interface Store {
  id: string;
  name: string;
  owner: string;
  city: string;
  category: string;
  address: string;
  lastInventorySync: string;
  syncConfidenceScore: number;
  isAcceptingOrders: boolean;
}

export interface Product {
  id: string;
  storeId: string;
  name: string;
  category: string;
  kind: ProductKind;
  unit: string;
  price: number;
  quantity: number;
  isAvailable: boolean;
  visible: boolean;
  lastInventorySync: string;
}

export interface OrderItem { productId: string; name: string; quantity: number; price: number }
export interface Order {
  id: string;
  storeId: string;
  customer: string;
  amount: number;
  items: OrderItem[];
  status: string;
  refundStatus: string;
  refundReference: string | null;
  refundDurationMs: number | null;
  createdAt: string;
}

export interface Ticket {
  id: string;
  orderId: string;
  reason: string;
  status: string;
  autoResolved: boolean;
  createdAt: string;
}

export interface SystemEvent {
  id: number;
  storeId: string;
  orderId: string | null;
  trigger: string;
  action: string;
  type: string;
  createdAt: string;
}

export interface Snapshot {
  stores: Store[];
  products: Product[];
  orders: Order[];
  tickets: Ticket[];
  events: SystemEvent[];
  totals?: { city: string; deflected: number; autoResolved: number }[];
}

export interface SearchResult {
  products: Product[];
  alternatives: Product[];
  isFallback: boolean;
  message: string;
  confidence: Record<string, number>;
}

export function confidence(lastSync: string | Date): number {
  const hours = Math.max(0, (Date.now() - new Date(lastSync).getTime()) / 3_600_000);
  if (hours >= 24) return Math.max(25, Math.round(59 - (hours - 24) / 3));
  if (hours <= 2) return 98;
  return Math.round(98 - (hours - 2) * 1.3);
}

export function rupees(amount: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

export function matchesProduct(product: Pick<Product, "name" | "unit" | "category">, query: string): boolean {
  const searchable = `${product.name} ${product.unit} ${product.category}`.toLowerCase().replace(/\s+/g, "");
  return query.trim().toLowerCase().split(/\s+/).every(term => searchable.includes(term));
}
