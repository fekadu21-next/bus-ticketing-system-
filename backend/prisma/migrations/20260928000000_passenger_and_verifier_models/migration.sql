-- CreateTable
CREATE TABLE IF NOT EXISTS "tickets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ticket_number" VARCHAR(50) NOT NULL,
    "booking_id" UUID NOT NULL,
    "passenger_id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "seat_id" UUID,
    "seat_number" INTEGER NOT NULL,
    "organization_id" UUID NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'UNUSED',
    "qr_token" TEXT NOT NULL,
    "verified_at" TIMESTAMPTZ(6),
    "verified_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "uq_tickets_ticket_number" UNIQUE ("ticket_number"),
    CONSTRAINT "uq_tickets_booking_id" UNIQUE ("booking_id"),
    CONSTRAINT "uq_tickets_qr_token" UNIQUE ("qr_token"),
    CONSTRAINT "fk_tickets_booking" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "fk_tickets_passenger" FOREIGN KEY ("passenger_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "fk_tickets_verifier" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "fk_tickets_trip" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "fk_tickets_seat" FOREIGN KEY ("seat_id") REFERENCES "seats"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "fk_tickets_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "tickets_organization_id_idx" ON "tickets"("organization_id");
CREATE INDEX IF NOT EXISTS "tickets_trip_id_idx" ON "tickets"("trip_id");
CREATE INDEX IF NOT EXISTS "tickets_passenger_id_idx" ON "tickets"("passenger_id");
CREATE INDEX IF NOT EXISTS "tickets_status_idx" ON "tickets"("status");
CREATE INDEX IF NOT EXISTS "tickets_ticket_number_idx" ON "tickets"("ticket_number");
CREATE INDEX IF NOT EXISTS "tickets_qr_token_idx" ON "tickets"("qr_token");

-- CreateTable
CREATE TABLE IF NOT EXISTS "ticket_verifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ticket_id" UUID,
    "booking_id" UUID,
    "trip_id" UUID,
    "verifier_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "result" VARCHAR(30) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_verifications_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "fk_ticket_verifications_ticket" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "fk_ticket_verifications_trip" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "fk_ticket_verifications_verifier" FOREIGN KEY ("verifier_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "fk_ticket_verifications_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ticket_verifications_ticket_id_idx" ON "ticket_verifications"("ticket_id");
CREATE INDEX IF NOT EXISTS "ticket_verifications_verifier_id_idx" ON "ticket_verifications"("verifier_id");
CREATE INDEX IF NOT EXISTS "ticket_verifications_trip_id_idx" ON "ticket_verifications"("trip_id");
CREATE INDEX IF NOT EXISTS "ticket_verifications_organization_id_idx" ON "ticket_verifications"("organization_id");
CREATE INDEX IF NOT EXISTS "ticket_verifications_result_idx" ON "ticket_verifications"("result");
CREATE INDEX IF NOT EXISTS "ticket_verifications_created_at_idx" ON "ticket_verifications"("created_at");

-- CreateTable
CREATE TABLE IF NOT EXISTS "feedbacks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "trip_id" UUID NOT NULL,
    "passenger_id" UUID NOT NULL,
    "booking_id" UUID,
    "organization_id" UUID,
    "rating" SMALLINT NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "uq_trip_passenger_feedback" UNIQUE ("trip_id", "passenger_id"),
    CONSTRAINT "fk_feedbacks_trip" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "fk_feedbacks_passenger" FOREIGN KEY ("passenger_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "fk_feedbacks_booking" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "fk_feedbacks_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "feedbacks_trip_id_idx" ON "feedbacks"("trip_id");
CREATE INDEX IF NOT EXISTS "feedbacks_passenger_id_idx" ON "feedbacks"("passenger_id");
CREATE INDEX IF NOT EXISTS "feedbacks_organization_id_idx" ON "feedbacks"("organization_id");
