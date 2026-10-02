# NOVA SYNC

NOVA SYNC is an intelligent, digital-first orchestration prototype for Nova Cart’s hyper-local delivery network. It connects merchant stock checks, reliable customer checkout, and automated operational resolution in one responsive dashboard. The supplied business case describes a repeat purchase decline from 41% to 27%, an 11% cancellation rate, ghost inventory contributing to 35% of cancellations, and a 9.2-hour support delay. The application targets the information disconnect behind these problems without physical warehouses or large new teams.

## The three perspectives

- **Merchant:** A WhatsApp-style simulator asks for stock confirmation. Replies `1` and `2` update PostgreSQL inventory, change storefront visibility, and create an orchestration event. Merchants can accept or reject incoming orders and pause new orders during busy periods.
- **Customer:** A neighborhood storefront shows stock-confidence badges, category and city filters, live availability, and preferences-based alternatives when a product is unavailable. Quick orders reserve stock atomically. Failed orders display a simulated instant refund and automatically resolved support ticket.
- **Operations:** A live control room displays verified store coverage, prevented checkouts, resolved tickets, store health, and a persistent action trail. The 27% repeat purchase metric is a supplied baseline, not a claimed measured improvement. The activity chart is explicitly an illustrative trend. Live report export, order management, and operational AI analysis are included.

## Technology and deployment

- Next.js App Router, React, TypeScript, Tailwind CSS, and Lucide React.
- Express runs inside a modern Netlify Function using a small `serverless-http` request adapter.
- Netlify Database provides managed PostgreSQL; Drizzle ORM defines schemas and transactions. Drizzle beta packages are deliberately used because they include the native Netlify adapter.
- Server-sent events publish complete state snapshots when the persisted event revision changes. Database-backed event detection runs every two seconds. Connections end after 22 seconds and reconnect automatically within the synchronous function execution budget; a 12-second recovery fetch handles interrupted streams.
- Netlify AI Gateway provides optional GPT-4.1 mini operational analysis. The model is advisory only; deterministic, transactional code owns inventory and refunds.

Netlify automatically detects Next.js, installs dependencies, builds the application, and applies migrations in `netlify/database/migrations`. The deployment needs the platform-provided database integration. AI analysis requires an AI-Gateway-enabled plan and at least one production deployment; failures produce an honest error rather than fabricated analysis.

## Run locally

Prerequisites: Node.js 22 or later, the Netlify CLI, and access to a linked Netlify site with Netlify Database.

```bash
npm ci
netlify link
netlify dev --port 8889
```

Open `http://localhost:8889`. Netlify Dev runs Next.js and the functions together, providing the integration environment. The standalone `npm run dev` script serves the frontend but does not emulate Netlify Functions. Do not manually copy database or AI credentials into client code.

After changing `db/schema.ts`, generate a descriptive migration:

```bash
npm run db:generate -- --name add_descriptive_change
```

## API

| Method | Path | Payload / query | Purpose |
| --- | --- | --- | --- |
| GET | `/api/v1/state` | None | Initializes a private demo workspace and returns its snapshot. |
| POST | `/api/v1/webhook/whatsapp` | `{ "text": "2", "productId": "ramesh-butter" }` | Confirms or hides a product. |
| GET | `/api/v1/catalog/search` | `q`, `city`, optional `storeId` | Returns fresh, available products or local fallback alternatives. |
| POST | `/api/v1/orders/create` | `{ "productId": "ramesh-butter", "quantity": 1 }` | Verifies and reserves current stock before a simulated order. |
| POST | `/api/v1/orders/accept` | `{ "orderId": "NC-48302" }` | Confirms an active order after a stock check. |
| POST | `/api/v1/orders/cancel` | `{ "orderId": "NC-48302", "reason": "merchant_busy" }` | Simulates an idempotent refund and closes the related support ticket. |
| POST | `/api/v1/stores/status` | `{ "storeId": "ramesh", "accepting": true }` | Resumes or pauses new checkout. |
| POST | `/api/v1/intelligence` | `{}` | Produces an AI assessment of the business scenario and live demo data. |
| GET | `/api/stream` | Workspace cookie | Streams workspace-scoped snapshots via SSE. |

Supported cancellation reasons are `merchant_busy`, `driver_unavailable`, `inventory_mismatch`, and `customer_request`. Request bodies are bounded to 8 KB; mutation actions are limited to 30 per minute per workspace. AI analysis has an atomic one-minute cooldown. Cross-origin browser mutations are rejected. Network and validation failures return bounded, non-sensitive JSON errors.

## Data and sample initialization

`lib/fixtures.ts` supplies typed, mockable fixtures for six neighborhood stores across Bengaluru, Mumbai, and Pune; groceries and local specialties; one pending merchant order; delivered and refunded orders; support tickets; and orchestration events. The fixtures are inserted transactionally on a workspace’s first request. They are only used for initialization and an explicitly labeled disconnected UI preview; they do not replace persistence.

Database representations use snake_case, including `last_inventory_sync`, `sync_confidence_score`, `is_available`, `inventory_reserved`, and `auto_resolved`. API responses use camelCase. Every business record is scoped by a workspace ID; composite keys and foreign keys enforce relationships. The workspace identifier is never included in exported snapshots.

Example API representations, abridged:

```json
{
  "stores": [{ "id": "ramesh", "name": "Ramesh General Store", "city": "Bengaluru", "lastInventorySync": "2026-10-02T09:00:00.000Z", "syncConfidenceScore": 98, "isAcceptingOrders": true }],
  "products": [{ "id": "ramesh-butter", "storeId": "ramesh", "name": "Amul Butter", "price": 285, "quantity": 12, "isAvailable": true, "visible": true, "lastInventorySync": "2026-10-02T09:00:00.000Z" }],
  "orders": [{ "id": "NC-48302", "storeId": "ramesh", "amount": 340, "status": "pending", "refundStatus": "none" }],
  "tickets": [{ "id": "TKT-101", "orderId": "NC-48299", "status": "closed", "autoResolved": true }]
}
```

Fresh inventory scores 98% for two hours, then decays; data older than 24 hours drops below 60%. Per-product freshness, availability, visibility, quantity, and merchant availability are checked at checkout, regardless of an earlier client render. A merchant’s individual reply confirms the selected product, not an unverified promise about the entire catalog. Search normalizes product names and unit spacing, and uses category preferences from sample search logs to surface local alternatives. This addresses the supplied opportunity of 19% of users searching for unlisted local stock.

## Judge walkthrough

1. Use **Run live demo** and open **Merchant**. Select Ramesh General Store and reply **2 · No, sold out** for Amul Butter. The card dims, its database availability and visibility become false, and the stream records the action.
2. Open **Customer**, search **Amul Butter**, and observe local alternatives instead of a blank result. Search **coffee** to explore the neighborhood catalog. Use **Test checkout protection** on the Operations metric card to attempt checkout with unavailable stock; the API rejects it before any charge and increments the prevented-checkout count.
3. Return to **Merchant**, review the initial pending order, and choose **Reject · too busy**. Open **Customer** to see the completed simulated refund. **Operations** records its remediation and increments resolved support tickets. Rejection also pauses the merchant’s new orders; use **Resume accepting orders** to reopen checkout.
4. Reply **1** to confirm stock again. Place a **Quick order** in Customer, accept it in Merchant, and verify the live customer status. Alternatively, simulate a delivery issue and inspect the refund and support queue.
5. Select **Pune** and inspect Corner Shop & Co.’s stale-stock warning. Confirm a specific product to see freshness recover for that product.
6. Open **Nova intelligence** to review the ₹25 lakh plan and proposed four-week validation experiment, or generate an assessment from the current workspace.
7. Open the application in a second tab in the same browser to observe changes across active interfaces without a manual refresh. A separate browser receives an isolated workspace.

## Prototype boundaries

WhatsApp delivery and payment payouts are simulations, prominently labeled throughout the application. The mock gateway waits approximately 400 ms and returns a deterministic `SIM-` reference; it moves no money. The displayed refund duration measures the simulated gateway step, not all database/network latency. Refund retries are serialized by a row lock and do not issue another refund. Stock reservations are released on cancellation without silently reversing a merchant’s explicit out-of-stock decision.

Private demo data is scoped by a random, HTTP-only cookie and expires after seven days; a scheduled function deletes expired workspaces. HTTPS uses a secure, partitioned `SameSite=None` cookie so embedded previews can keep an isolated workspace; local HTTP uses `SameSite=Strict`. Browser mutations also enforce the request origin. This is a public demonstration, not authenticated retailer access. Commercial deployment requires merchant/customer authentication, signed provider webhooks, a real payment provider with its own idempotency and payout reconciliation, delivery-provider integration, and scale/load verification. A production event transport should replace database polling at high concurrency. The sample customer names are fictional. No real retention improvement is claimed.

The financial allocation and baseline metrics are scenario assumptions. The proposed experiment compares 50 pilot stores with a control group for four weeks, measuring ghost-stock cancellation reduction, refund time, and repeat-purchase cohorts independently. No warehouses, dark stores, or new large teams are part of the proposal.

Local build, development-server, and test commands were not executed during the implementation run; deployment validation is handled by the platform.
