ALTER TABLE "notification" ADD COLUMN IF NOT EXISTS "containerHealth" boolean DEFAULT false NOT NULL;
