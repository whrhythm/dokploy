ALTER TABLE "notification" ADD COLUMN IF NOT EXISTS "hostCpuThreshold" boolean DEFAULT false NOT NULL;
ALTER TABLE "notification" ADD COLUMN IF NOT EXISTS "hostMemoryThreshold" boolean DEFAULT false NOT NULL;
ALTER TABLE "notification" ADD COLUMN IF NOT EXISTS "hostDiskThreshold" boolean DEFAULT false NOT NULL;
