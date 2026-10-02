# NOVA SYNC project guidance

## Architecture

This is a Next.js App Router frontend and an Express API deployed as a modern Netlify Function. The landing route is a three-persona, single-page NOVA SYNC dashboard. Default to the Operations control room; the top toggle mounts Merchant or Customer. Maintain the deep emerald, white, warm slate visual system and accessible responsive layouts.

## Key directories

- `app/`: Root page, shared metadata, and the Tailwind-enabled global visual system.
- `components/dashboard.tsx`: App shell, navigation, report export, tour, and information dialogs.
- `components/operations.tsx`, `merchant.tsx`, `customer.tsx`: The explicit persona workflows.
- `components/use-nova.ts`: Shared state, actual API mutations, SSE subscription, connection recovery, and notifications.
- `lib/types.ts`: Serializable browser interfaces and shared confidence/INR formatting logic.
- `lib/fixtures.ts`: Seed data and visibly labeled, non-mutating disconnected previews. Never use it as persistence.
- `db/schema.ts`: Authoritative Drizzle PostgreSQL schema; `db/index.ts` creates the Netlify-native client.
- `server/`: Express controllers, isolated workspace initialization, snapshot serialization, and mock payment adapter.
- `netlify/functions/`: Modern `.mts` functions for the Express request adapter, short-lived SSE, and scheduled seven-day cleanup.
- `netlify/database/migrations/`: Drizzle-generated deployment migrations and snapshots. Keep every schema change paired with a descriptive migration.
- `public/`: Small code-native brand assets. Product illustrations are SVG React components, not remote image dependencies.

## Conventions and safety

Use TypeScript, descriptive identifiers, modular components, and small comments around business-critical pipelines. APIs use camelCase; PostgreSQL column names use snake_case. Use `@netlify/database` with `drizzle-orm@beta` and `drizzle-kit@beta`, as required by the native database adapter. No in-memory, local-JSON, or external persistence substitutes are allowed.

Scope every database query and mutation to the HTTP-only-cookie workspace, except the scheduled cleanup of expired workspaces. HTTPS cookies are secure and partitioned to support embedded previews; local HTTP cookies use SameSite Strict. Preserve origin checks on browser mutations. Do not expose workspace IDs or platform credentials in snapshots, reports, errors, logs, or client code. New merchant-owned tables must keep composite workspace/entity keys and appropriate foreign keys. Do not add browser CORS allowances casually.

Inventory confirmation updates the selected product. Checkout independently checks freshness, availability, visibility, quantity, and accepting-orders status under row locks; never trust client prices or an earlier render. Acceptance and cancellation are serialized on the order. Cancellation releases reserved quantities while preserving explicit merchant stock flags. Seeded orders are not reserved until accepted. Refund completion and ticket resolution commit atomically.

WhatsApp and payouts are simulations. Keep the explicit labels. Never imply actual payment movement, independent validation of the supplied business case, or measured retention recovery. The 27% retention value is the supplied baseline; decorative chart history is marked illustrative. Operational counters reflect persisted demo activity, with initialization events clearly described as samples.

The advisory AI model is GPT-4.1 mini via Netlify AI Gateway in a modern function. Read the `netlify-ai-gateway` skill before changing models or inference integration. AI must never directly mutate stock or issue payouts. Provider failures should show a truthful error; do not present canned content as model output. Keep mutation limits and the persistent, atomic AI cooldown.

SSE streams use the persistent event ID as revision, poll PostgreSQL every two seconds, and close before function time limits. EventSource reconnects automatically; recovery fetches operate when the stream is unhealthy. New database mutations must record an event in the same transaction so other interfaces refresh. Analytics totals aggregate complete workspace history by city independently of the latest-100 event/order display window. Do not introduce a process-local event bus as cross-instance persistence.

## Editing and verification

Do not inspect `.git` or output secrets. No build, development-server, or test commands should run during platform-managed editing sessions; the platform validates builds after changes. Read affected source and dependency declarations to review compatibility. Generating migration files with `npx drizzle-kit generate --name descriptive_change` is permitted and required after schema edits. There is no test framework to expand at present.

For local human development, use `npm ci` and `netlify dev --port 8889` against a linked site; standalone Next.js dev does not emulate the API functions. Keep the README’s workflow walkthrough and prototype limitations current. Update `.netlify/results.md` with a concise, standalone description of completed changes.
