CREATE TYPE "public"."category" AS ENUM('running', 'volleyball', 'yoga', 'hiking', 'horse_riding');--> statement-breakpoint
CREATE TYPE "public"."difficulty" AS ENUM('all_levels', 'beginner', 'easy', 'moderate', 'challenging', 'advanced');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('female', 'male', 'other', 'prefer_not_to_say');--> statement-breakpoint
CREATE TYPE "public"."registration_status" AS ENUM('going', 'waitlist', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('member', 'admin');--> statement-breakpoint
CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"category" "category" NOT NULL,
	"title" text NOT NULL,
	"tagline" text,
	"description" text,
	"location" text NOT NULL,
	"meeting_point" text,
	"map_link" text,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone,
	"price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"currency" text DEFAULT 'AED' NOT NULL,
	"difficulty" "difficulty" DEFAULT 'all_levels' NOT NULL,
	"capacity" integer,
	"cover_image" text,
	"participation_label" text,
	"participation_options" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"what_to_bring" text,
	"published" boolean DEFAULT false NOT NULL,
	"attendees_public" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gallery_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"image_url" text NOT NULL,
	"caption" text,
	"category" "category",
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_id" uuid NOT NULL,
	"user_id" uuid,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"gender" "gender",
	"phone" text NOT NULL,
	"email" text NOT NULL,
	"instagram" text,
	"participation_choice" text,
	"emergency_contact_name" text,
	"emergency_contact_phone" text,
	"health_notes" text,
	"is_tibid_member" boolean DEFAULT false NOT NULL,
	"photo_consent" boolean DEFAULT false NOT NULL,
	"agreed_to_terms" boolean DEFAULT false NOT NULL,
	"status" "registration_status" DEFAULT 'going' NOT NULL,
	"checked_in" boolean DEFAULT false NOT NULL,
	"sheet_synced" boolean DEFAULT false NOT NULL,
	"sheet_sync_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "role" DEFAULT 'member' NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"gender" "gender",
	"phone" text,
	"instagram" text,
	"emergency_contact_name" text,
	"emergency_contact_phone" text,
	"health_notes" text,
	"is_tibid_member" boolean DEFAULT false NOT NULL,
	"photo_consent" boolean DEFAULT true NOT NULL,
	"avatar_url" text,
	"bio" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "activities_slug_unique" ON "activities" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "activities_starts_at_idx" ON "activities" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "activities_category_idx" ON "activities" USING btree ("category");--> statement-breakpoint
CREATE UNIQUE INDEX "registrations_activity_email_unique" ON "registrations" USING btree ("activity_id",lower("email"));--> statement-breakpoint
CREATE INDEX "registrations_activity_idx" ON "registrations" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "registrations_user_idx" ON "registrations" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree (lower("email"));