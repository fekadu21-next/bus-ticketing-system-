-- AlterTable
ALTER TABLE "routes" ADD COLUMN     "destination_station_id" UUID,
ADD COLUMN     "origin_station_id" UUID;

-- CreateTable
CREATE TABLE "stations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(150) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stations_code_key" ON "stations"("code");

-- CreateIndex
CREATE INDEX "stations_city_idx" ON "stations"("city");

-- CreateIndex
CREATE INDEX "stations_is_active_idx" ON "stations"("is_active");

-- CreateIndex
CREATE INDEX "routes_origin_station_id_idx" ON "routes"("origin_station_id");

-- CreateIndex
CREATE INDEX "routes_destination_station_id_idx" ON "routes"("destination_station_id");

-- RenameForeignKey
ALTER TABLE "bookings" RENAME CONSTRAINT "fk_bookings_organization" TO "bookings_organization_id_fkey";

-- RenameForeignKey
ALTER TABLE "bookings" RENAME CONSTRAINT "fk_bookings_passenger" TO "bookings_passenger_id_fkey";

-- RenameForeignKey
ALTER TABLE "bookings" RENAME CONSTRAINT "fk_bookings_seat" TO "bookings_seat_id_fkey";

-- RenameForeignKey
ALTER TABLE "bookings" RENAME CONSTRAINT "fk_bookings_trip" TO "bookings_trip_id_fkey";

-- RenameForeignKey
ALTER TABLE "buses" RENAME CONSTRAINT "fk_buses_organization" TO "buses_organization_id_fkey";

-- RenameForeignKey
ALTER TABLE "feedbacks" RENAME CONSTRAINT "fk_feedbacks_booking" TO "feedbacks_booking_id_fkey";

-- RenameForeignKey
ALTER TABLE "feedbacks" RENAME CONSTRAINT "fk_feedbacks_organization" TO "feedbacks_organization_id_fkey";

-- RenameForeignKey
ALTER TABLE "feedbacks" RENAME CONSTRAINT "fk_feedbacks_passenger" TO "feedbacks_passenger_id_fkey";

-- RenameForeignKey
ALTER TABLE "feedbacks" RENAME CONSTRAINT "fk_feedbacks_trip" TO "feedbacks_trip_id_fkey";

-- RenameForeignKey
ALTER TABLE "payments" RENAME CONSTRAINT "fk_payments_booking" TO "payments_booking_id_fkey";

-- RenameForeignKey
ALTER TABLE "payments" RENAME CONSTRAINT "fk_payments_organization" TO "payments_organization_id_fkey";

-- RenameForeignKey
ALTER TABLE "routes" RENAME CONSTRAINT "fk_routes_organization" TO "routes_organization_id_fkey";

-- RenameForeignKey
ALTER TABLE "seats" RENAME CONSTRAINT "fk_seats_trip" TO "seats_trip_id_fkey";

-- RenameForeignKey
ALTER TABLE "ticket_verifications" RENAME CONSTRAINT "fk_ticket_verifications_organization" TO "ticket_verifications_organization_id_fkey";

-- RenameForeignKey
ALTER TABLE "ticket_verifications" RENAME CONSTRAINT "fk_ticket_verifications_ticket" TO "ticket_verifications_ticket_id_fkey";

-- RenameForeignKey
ALTER TABLE "ticket_verifications" RENAME CONSTRAINT "fk_ticket_verifications_trip" TO "ticket_verifications_trip_id_fkey";

-- RenameForeignKey
ALTER TABLE "ticket_verifications" RENAME CONSTRAINT "fk_ticket_verifications_verifier" TO "ticket_verifications_verifier_id_fkey";

-- RenameForeignKey
ALTER TABLE "tickets" RENAME CONSTRAINT "fk_tickets_booking" TO "tickets_booking_id_fkey";

-- RenameForeignKey
ALTER TABLE "tickets" RENAME CONSTRAINT "fk_tickets_organization" TO "tickets_organization_id_fkey";

-- RenameForeignKey
ALTER TABLE "tickets" RENAME CONSTRAINT "fk_tickets_passenger" TO "tickets_passenger_id_fkey";

-- RenameForeignKey
ALTER TABLE "tickets" RENAME CONSTRAINT "fk_tickets_seat" TO "tickets_seat_id_fkey";

-- RenameForeignKey
ALTER TABLE "tickets" RENAME CONSTRAINT "fk_tickets_trip" TO "tickets_trip_id_fkey";

-- RenameForeignKey
ALTER TABLE "tickets" RENAME CONSTRAINT "fk_tickets_verifier" TO "tickets_verified_by_fkey";

-- RenameForeignKey
ALTER TABLE "trip_problem_reports" RENAME CONSTRAINT "fk_trip_problem_reports_driver" TO "trip_problem_reports_driver_id_fkey";

-- RenameForeignKey
ALTER TABLE "trip_problem_reports" RENAME CONSTRAINT "fk_trip_problem_reports_organization" TO "trip_problem_reports_organization_id_fkey";

-- RenameForeignKey
ALTER TABLE "trip_problem_reports" RENAME CONSTRAINT "fk_trip_problem_reports_resolver" TO "trip_problem_reports_resolved_by_fkey";

-- RenameForeignKey
ALTER TABLE "trip_problem_reports" RENAME CONSTRAINT "fk_trip_problem_reports_trip" TO "trip_problem_reports_trip_id_fkey";

-- RenameForeignKey
ALTER TABLE "trips" RENAME CONSTRAINT "fk_trips_bus" TO "trips_bus_id_fkey";

-- RenameForeignKey
ALTER TABLE "trips" RENAME CONSTRAINT "fk_trips_driver" TO "trips_driver_id_fkey";

-- RenameForeignKey
ALTER TABLE "trips" RENAME CONSTRAINT "fk_trips_organization" TO "trips_organization_id_fkey";

-- RenameForeignKey
ALTER TABLE "trips" RENAME CONSTRAINT "fk_trips_route" TO "trips_route_id_fkey";

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_origin_station_id_fkey" FOREIGN KEY ("origin_station_id") REFERENCES "stations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_destination_station_id_fkey" FOREIGN KEY ("destination_station_id") REFERENCES "stations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "uq_bus_org_plate" RENAME TO "buses_organization_id_plate_number_key";

-- RenameIndex
ALTER INDEX "uq_trip_passenger_feedback" RENAME TO "feedbacks_trip_id_passenger_id_key";

-- RenameIndex
ALTER INDEX "uq_payments_booking_id" RENAME TO "payments_booking_id_key";

-- RenameIndex
ALTER INDEX "uq_payments_tx_ref" RENAME TO "payments_transaction_reference_key";

-- RenameIndex
ALTER INDEX "uq_trip_seat_number" RENAME TO "seats_trip_id_seat_number_key";

-- RenameIndex
ALTER INDEX "uq_tickets_booking_id" RENAME TO "tickets_booking_id_key";

-- RenameIndex
ALTER INDEX "uq_tickets_qr_token" RENAME TO "tickets_qr_token_key";

-- RenameIndex
ALTER INDEX "uq_tickets_ticket_number" RENAME TO "tickets_ticket_number_key";
