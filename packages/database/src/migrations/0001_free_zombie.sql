CREATE TABLE IF NOT EXISTS "word_morphology" (
	"id" serial PRIMARY KEY NOT NULL,
	"ayah_id" integer NOT NULL,
	"word_position" integer NOT NULL,
	"word_arabic" varchar(255) NOT NULL,
	"transliteration" varchar(255),
	"root" varchar(20),
	"root_transliterated" varchar(30),
	"lemma" varchar(255),
	"part_of_speech" varchar(50),
	"features" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "word_morph_ayah_idx" ON "word_morphology" ("ayah_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "word_morph_position_idx" ON "word_morphology" ("ayah_id","word_position");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "word_morph_root_idx" ON "word_morphology" ("root");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "word_morph_pos_idx" ON "word_morphology" ("part_of_speech");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "word_morphology" ADD CONSTRAINT "word_morphology_ayah_id_ayahs_id_fk" FOREIGN KEY ("ayah_id") REFERENCES "ayahs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
