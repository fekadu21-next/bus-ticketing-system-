-- AlterTable trips
ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "driver_id" UUID;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "trips_driver_id_idx" ON "trips"("driver_id");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_trips_driver') THEN
        ALTER TABLE "trips" ADD CONSTRAINT "fk_trips_driver" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- CreateTable trip_problem_reports
CREATE TABLE IF NOT EXISTS "trip_problem_reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "trip_id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "description" TEXT NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMPTZ(6),
    "resolved_by" UUID,

    CONSTRAINT "trip_problem_reports_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "fk_trip_problem_reports_trip" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "fk_trip_problem_reports_driver" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "fk_trip_problem_reports_resolver" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "fk_trip_problem_reports_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "trip_problem_reports_trip_id_idx" ON "trip_problem_reports"("trip_id");
CREATE INDEX IF NOT EXISTS "trip_problem_reports_driver_id_idx" ON "trip_problem_reports"("driver_id");
CREATE INDEX IF NOT EXISTS "trip_problem_reports_organization_id_idx" ON "trip_problem_reports"("organization_id");
CREATE INDEX IF NOT EXISTS "trip_problem_reports_status_idx" ON "trip_problem_reports"("status");
CREATE INDEX IF NOT EXISTS "trip_problem_reports_created_at_idx" ON "trip_problem_reports"("created_at");
