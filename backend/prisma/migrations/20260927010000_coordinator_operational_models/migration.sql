-- CreateTable
CREATE TABLE IF NOT EXISTS "buses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "plate_number" VARCHAR(50) NOT NULL,
    "model" VARCHAR(100),
    "capacity" INTEGER NOT NULL DEFAULT 50,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buses_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "fk_buses_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "uq_bus_org_plate" UNIQUE ("organization_id", "plate_number")
);

CREATE INDEX IF NOT EXISTS "buses_organization_id_idx" ON "buses"("organization_id");

-- CreateTable
CREATE TABLE IF NOT EXISTS "routes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "origin" VARCHAR(100) NOT NULL,
    "destination" VARCHAR(100) NOT NULL,
    "distance_km" DOUBLE PRECISION,
    "estimated_duration_hours" DOUBLE PRECISION,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "routes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "fk_routes_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "routes_organization_id_idx" ON "routes"("organization_id");

-- CreateTable
CREATE TABLE IF NOT EXISTS "trips" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "bus_id" UUID NOT NULL,
    "route_id" UUID NOT NULL,
    "departure_time" TIMESTAMPTZ(6) NOT NULL,
    "arrival_time" TIMESTAMPTZ(6),
    "fare" DECIMAL(10,2) NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "fk_trips_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "fk_trips_bus" FOREIGN KEY ("bus_id") REFERENCES "buses"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "fk_trips_route" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "trips_organization_id_idx" ON "trips"("organization_id");
CREATE INDEX IF NOT EXISTS "trips_bus_id_idx" ON "trips"("bus_id");
CREATE INDEX IF NOT EXISTS "trips_route_id_idx" ON "trips"("route_id");
CREATE INDEX IF NOT EXISTS "trips_departure_time_idx" ON "trips"("departure_time");
CREATE INDEX IF NOT EXISTS "trips_status_idx" ON "trips"("status");

-- CreateTable
CREATE TABLE IF NOT EXISTS "seats" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "trip_id" UUID NOT NULL,
    "seat_number" INTEGER NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seats_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "fk_seats_trip" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "uq_trip_seat_number" UNIQUE ("trip_id", "seat_number")
);

CREATE INDEX IF NOT EXISTS "seats_trip_id_idx" ON "seats"("trip_id");
CREATE INDEX IF NOT EXISTS "seats_status_idx" ON "seats"("status");

-- CreateTable
CREATE TABLE IF NOT EXISTS "bookings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "passenger_id" UUID NOT NULL,
    "seat_id" UUID,
    "seat_number" INTEGER NOT NULL,
    "total_fare" DECIMAL(10,2) NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'CONFIRMED',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "fk_bookings_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "fk_bookings_trip" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "fk_bookings_passenger" FOREIGN KEY ("passenger_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "fk_bookings_seat" FOREIGN KEY ("seat_id") REFERENCES "seats"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "bookings_organization_id_idx" ON "bookings"("organization_id");
CREATE INDEX IF NOT EXISTS "bookings_trip_id_idx" ON "bookings"("trip_id");
CREATE INDEX IF NOT EXISTS "bookings_passenger_id_idx" ON "bookings"("passenger_id");
CREATE INDEX IF NOT EXISTS "bookings_status_idx" ON "bookings"("status");

-- CreateTable
CREATE TABLE IF NOT EXISTS "payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "booking_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'ETB',
    "payment_method" VARCHAR(50) NOT NULL,
    "transaction_reference" VARCHAR(100),
    "status" VARCHAR(30) NOT NULL DEFAULT 'COMPLETED',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "fk_payments_booking" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "fk_payments_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "uq_payments_booking_id" UNIQUE ("booking_id"),
    CONSTRAINT "uq_payments_tx_ref" UNIQUE ("transaction_reference")
);

CREATE INDEX IF NOT EXISTS "payments_organization_id_idx" ON "payments"("organization_id");
CREATE INDEX IF NOT EXISTS "payments_status_idx" ON "payments"("status");
