CREATE TABLE "orchestration_events" (
	"id" serial PRIMARY KEY,
	"workspace_id" uuid NOT NULL,
	"store_id" text NOT NULL,
	"order_id" text,
	"trigger" text NOT NULL,
	"action" text NOT NULL,
	"type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"workspace_id" uuid,
	"id" text,
	"store_id" text NOT NULL,
	"customer" text NOT NULL,
	"amount" integer NOT NULL,
	"items" jsonb NOT NULL,
	"inventory_reserved" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"refund_status" text DEFAULT 'none' NOT NULL,
	"refund_reference" text,
	"refund_duration_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_pkey" PRIMARY KEY("workspace_id","id")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"workspace_id" uuid,
	"id" text,
	"store_id" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"kind" text NOT NULL,
	"unit" text NOT NULL,
	"price" integer NOT NULL,
	"quantity" integer NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"last_inventory_sync" timestamp with time zone NOT NULL,
	CONSTRAINT "products_pkey" PRIMARY KEY("workspace_id","id")
);
--> statement-breakpoint
CREATE TABLE "search_logs" (
	"id" serial PRIMARY KEY,
	"workspace_id" uuid NOT NULL,
	"query" text NOT NULL,
	"category" text NOT NULL,
	"city" text NOT NULL,
	"matched_count" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stores" (
	"workspace_id" uuid,
	"id" text,
	"name" text NOT NULL,
	"owner" text NOT NULL,
	"city" text NOT NULL,
	"category" text NOT NULL,
	"address" text NOT NULL,
	"last_inventory_sync" timestamp with time zone NOT NULL,
	"sync_confidence_score" integer DEFAULT 98 NOT NULL,
	"is_accepting_orders" boolean DEFAULT true NOT NULL,
	CONSTRAINT "stores_pkey" PRIMARY KEY("workspace_id","id")
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"workspace_id" uuid,
	"id" text,
	"order_id" text NOT NULL,
	"reason" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"auto_resolved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "support_tickets_pkey" PRIMARY KEY("workspace_id","id")
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"request_window" timestamp with time zone DEFAULT now() NOT NULL,
	"request_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX "events_workspace_time_idx" ON "orchestration_events" ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "search_workspace_idx" ON "search_logs" ("workspace_id");--> statement-breakpoint
ALTER TABLE "orchestration_events" ADD CONSTRAINT "orchestration_events_workspace_id_workspaces_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_workspace_id_workspaces_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_workspace_id_store_id_stores_workspace_id_id_fkey" FOREIGN KEY ("workspace_id","store_id") REFERENCES "stores"("workspace_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_workspace_id_workspaces_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_workspace_id_store_id_stores_workspace_id_id_fkey" FOREIGN KEY ("workspace_id","store_id") REFERENCES "stores"("workspace_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "search_logs" ADD CONSTRAINT "search_logs_workspace_id_workspaces_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "stores" ADD CONSTRAINT "stores_workspace_id_workspaces_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_workspace_id_workspaces_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_Pra2csPSXqJ4_fkey" FOREIGN KEY ("workspace_id","order_id") REFERENCES "orders"("workspace_id","id") ON DELETE CASCADE;