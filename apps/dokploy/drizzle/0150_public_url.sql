ALTER TABLE "webServerSettings" ADD COLUMN IF NOT EXISTS "publicUrl" text;

UPDATE "webServerSettings"
SET "publicUrl" = "host"
WHERE "publicUrl" IS NULL
	AND "host" IS NOT NULL
	AND "host" <> '';
