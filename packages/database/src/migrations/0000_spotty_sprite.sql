CREATE TABLE IF NOT EXISTS "ayahs" (
	"id" serial PRIMARY KEY NOT NULL,
	"surah_id" integer NOT NULL,
	"ayah_number" integer NOT NULL,
	"text_arabic" text NOT NULL,
	"text_uthmani" text,
	"text_indopak" text,
	"text_simplified" text NOT NULL,
	"juz_number" integer,
	"hizb_number" integer,
	"page_number" integer,
	"sajdah" boolean DEFAULT false,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "roots" (
	"id" serial PRIMARY KEY NOT NULL,
	"root_arabic" varchar(10) NOT NULL,
	"root_transliterated" varchar(20),
	"root_type" varchar(20) NOT NULL,
	"semantic_field" jsonb,
	"core_meaning" text,
	"derivative_count" integer DEFAULT 0,
	"occurrence_count" integer DEFAULT 0,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "roots_root_arabic_unique" UNIQUE("root_arabic")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "surahs" (
	"id" integer PRIMARY KEY NOT NULL,
	"name_arabic" varchar(255) NOT NULL,
	"name_transliterated" varchar(255) NOT NULL,
	"name_english" varchar(255) NOT NULL,
	"ayah_count" integer NOT NULL,
	"revelation_period" varchar(20) NOT NULL,
	"revelation_phase" varchar(100),
	"revelation_order" integer,
	"mushaf_order" integer,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "translations" (
	"id" serial PRIMARY KEY NOT NULL,
	"ayah_id" integer NOT NULL,
	"translator_id" integer NOT NULL,
	"language" varchar(10) NOT NULL,
	"text" text NOT NULL,
	"footnotes" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "translators" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"name_arabic" varchar(255),
	"language" varchar(10) NOT NULL,
	"biography" text,
	"methodology" text,
	"year" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "words" (
	"id" serial PRIMARY KEY NOT NULL,
	"ayah_id" integer NOT NULL,
	"position" integer NOT NULL,
	"word_arabic" varchar(255) NOT NULL,
	"word_simplified" varchar(255) NOT NULL,
	"transliteration" varchar(255),
	"root_id" integer,
	"morphology" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rcqi_analysis_cache" (
	"id" serial PRIMARY KEY NOT NULL,
	"ayah_id" integer NOT NULL,
	"analysis_type" varchar(50) NOT NULL,
	"analysis_version" varchar(20) NOT NULL,
	"result" jsonb NOT NULL,
	"tokens_used" integer DEFAULT 0,
	"processing_time" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "semantic_connections" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_ayah_id" integer NOT NULL,
	"target_ayah_id" integer NOT NULL,
	"connection_type" varchar(50) NOT NULL,
	"strength" numeric(3, 2) NOT NULL,
	"description" text,
	"auto_generated" boolean DEFAULT true,
	"created_by" integer,
	"votes" integer DEFAULT 0,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "annotations" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"ayah_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"note_text" text NOT NULL,
	"note_html" text,
	"highlighted_text" text,
	"highlight_color" varchar(20),
	"tags" jsonb DEFAULT '[]'::jsonb,
	"citations" jsonb DEFAULT '[]'::jsonb,
	"is_private" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bookmarks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"ayah_id" integer NOT NULL,
	"category" varchar(100),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reading_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"ayah_id" integer NOT NULL,
	"read_at" timestamp DEFAULT now() NOT NULL,
	"time_spent" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "research_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"is_public" boolean DEFAULT false,
	"collaborators" jsonb DEFAULT '[]'::jsonb,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"metadata" jsonb DEFAULT '{"status":"draft"}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sync_queue" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"device_id" varchar(255) NOT NULL,
	"operation" varchar(20) NOT NULL,
	"table_name" varchar(100) NOT NULL,
	"record_id" varchar(255) NOT NULL,
	"data" jsonb NOT NULL,
	"sync_status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"synced_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token" varchar(255) NOT NULL,
	"device_id" varchar(255),
	"device_info" jsonb,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"role" varchar(20) DEFAULT 'user' NOT NULL,
	"subscription_tier" varchar(20) DEFAULT 'free' NOT NULL,
	"preferences" jsonb DEFAULT '{"defaultTranslator":1,"arabicFont":"uthmani","theme":"light","notifications":true}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_login_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ayah_surah_ayah_idx" ON "ayahs" ("surah_id","ayah_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ayah_surah_idx" ON "ayahs" ("surah_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ayah_juz_idx" ON "ayahs" ("juz_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "surah_revelation_period_idx" ON "surahs" ("revelation_period");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "surah_mushaf_order_idx" ON "surahs" ("mushaf_order");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "translation_ayah_translator_idx" ON "translations" ("ayah_id","translator_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "translation_ayah_idx" ON "translations" ("ayah_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "word_ayah_idx" ON "words" ("ayah_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "word_root_idx" ON "words" ("root_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "word_simplified_idx" ON "words" ("word_simplified");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rcqi_ayah_type_idx" ON "rcqi_analysis_cache" ("ayah_id","analysis_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rcqi_expires_idx" ON "rcqi_analysis_cache" ("expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "semantic_source_idx" ON "semantic_connections" ("source_ayah_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "semantic_target_idx" ON "semantic_connections" ("target_ayah_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "semantic_type_idx" ON "semantic_connections" ("connection_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "annotation_project_idx" ON "annotations" ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "annotation_ayah_idx" ON "annotations" ("ayah_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "annotation_user_idx" ON "annotations" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "bookmark_user_ayah_idx" ON "bookmarks" ("user_id","ayah_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bookmark_user_category_idx" ON "bookmarks" ("user_id","category");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "progress_user_ayah_idx" ON "reading_progress" ("user_id","ayah_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "progress_user_idx" ON "reading_progress" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "progress_read_at_idx" ON "reading_progress" ("read_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "project_user_idx" ON "research_projects" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "project_public_idx" ON "research_projects" ("is_public");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sync_user_device_status_idx" ON "sync_queue" ("user_id","device_id","sync_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sync_created_at_idx" ON "sync_queue" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "session_user_idx" ON "sessions" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "session_token_idx" ON "sessions" ("token");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_email_idx" ON "users" ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_subscription_idx" ON "users" ("subscription_tier");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ayahs" ADD CONSTRAINT "ayahs_surah_id_surahs_id_fk" FOREIGN KEY ("surah_id") REFERENCES "surahs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "translations" ADD CONSTRAINT "translations_ayah_id_ayahs_id_fk" FOREIGN KEY ("ayah_id") REFERENCES "ayahs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "translations" ADD CONSTRAINT "translations_translator_id_translators_id_fk" FOREIGN KEY ("translator_id") REFERENCES "translators"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "words" ADD CONSTRAINT "words_ayah_id_ayahs_id_fk" FOREIGN KEY ("ayah_id") REFERENCES "ayahs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "words" ADD CONSTRAINT "words_root_id_roots_id_fk" FOREIGN KEY ("root_id") REFERENCES "roots"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rcqi_analysis_cache" ADD CONSTRAINT "rcqi_analysis_cache_ayah_id_ayahs_id_fk" FOREIGN KEY ("ayah_id") REFERENCES "ayahs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "semantic_connections" ADD CONSTRAINT "semantic_connections_source_ayah_id_ayahs_id_fk" FOREIGN KEY ("source_ayah_id") REFERENCES "ayahs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "semantic_connections" ADD CONSTRAINT "semantic_connections_target_ayah_id_ayahs_id_fk" FOREIGN KEY ("target_ayah_id") REFERENCES "ayahs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "annotations" ADD CONSTRAINT "annotations_project_id_research_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "research_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "annotations" ADD CONSTRAINT "annotations_ayah_id_ayahs_id_fk" FOREIGN KEY ("ayah_id") REFERENCES "ayahs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "annotations" ADD CONSTRAINT "annotations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_ayah_id_ayahs_id_fk" FOREIGN KEY ("ayah_id") REFERENCES "ayahs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reading_progress" ADD CONSTRAINT "reading_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reading_progress" ADD CONSTRAINT "reading_progress_ayah_id_ayahs_id_fk" FOREIGN KEY ("ayah_id") REFERENCES "ayahs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "research_projects" ADD CONSTRAINT "research_projects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sync_queue" ADD CONSTRAINT "sync_queue_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
