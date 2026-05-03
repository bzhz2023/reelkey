CREATE TABLE "byok_entitlements" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"tier" text DEFAULT 'lifetime' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"source" text DEFAULT 'creem' NOT NULL,
	"product_id" text,
	"product_name" text,
	"order_id" text,
	"checkout_id" text,
	"customer_id" text,
	"metadata" jsonb,
	"purchased_at" timestamp DEFAULT now() NOT NULL,
	"revoked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "byok_entitlements_order_id_unique" UNIQUE("order_id")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "byok_entitlements_user_id_idx" ON "byok_entitlements" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "byok_entitlements_status_idx" ON "byok_entitlements" USING btree ("status");--> statement-breakpoint
CREATE INDEX "byok_entitlements_order_id_idx" ON "byok_entitlements" USING btree ("order_id");