/**
 * seedTrips.cjs
 * 1. Removes fake orgs seeded previously (Abessa Bus Line, Mekele Transport Share Company)
 * 2. Seeds 12 trips (Nov 23-26, 2026) into existing real organizations:
 *    - anbesa (id: 6f8a1e8e-ce0c-411f-8c74-a4e77391152a)
 *    - Selam Bus Line (id: 00000000-0000-0000-0000-000000000001)
 *    - Mekelle Transport (id: 00000000-0000-0000-0000-000000000005)
 */
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

const ANBESA_ID   = "6f8a1e8e-ce0c-411f-8c74-a4e77391152a";
const SELAM_ID    = "00000000-0000-0000-0000-000000000001";
const MEKELLE_ID  = "00000000-0000-0000-0000-000000000005";

// Fake org IDs to clean up
const FAKE_ORG_IDS = [
  "04f1ef83-e5da-4dcb-9443-145c9db3b4fa", // Abessa Bus Line
  "d0a3a84d-684d-427f-b9af-3a7283e4a442", // Mekele Transport Share Company
];

async function main() {
  console.log("=== Starting Trip Seed ===\n");

  // Step 1: Clean up fake orgs and all their cascade data
  console.log("Step 1: Removing fake organizations and their data...");
  for (const fakeId of FAKE_ORG_IDS) {
    const org = await p.organizations.findUnique({ where: { id: fakeId } });
    if (org) {
      // Delete trips cascade -> seats, bookings etc handled by DB cascade
      const trips = await p.trips.findMany({ where: { organization_id: fakeId }, select: { id: true } });
      for (const trip of trips) {
        await p.seats.deleteMany({ where: { trip_id: trip.id } });
      }
      await p.trips.deleteMany({ where: { organization_id: fakeId } });
      await p.routes.deleteMany({ where: { organization_id: fakeId } });
      await p.buses.deleteMany({ where: { organization_id: fakeId } });
      await p.organizations.delete({ where: { id: fakeId } });
      console.log("  Removed: " + org.name);
    }
  }

  // Step 2: Get real orgs
  console.log("\nStep 2: Loading real organizations...");
  const anbesa  = await p.organizations.findUnique({ where: { id: ANBESA_ID } });
  const selam   = await p.organizations.findUnique({ where: { id: SELAM_ID } });
  const mekelle = await p.organizations.findUnique({ where: { id: MEKELLE_ID } });

  if (!anbesa || !selam || !mekelle) {
    throw new Error("One or more real organizations not found! Check IDs.");
  }
  console.log("  Found: " + anbesa.name + ", " + selam.name + ", " + mekelle.name);

  // Step 3: Ensure buses exist for each org
  console.log("\nStep 3: Ensuring buses...");
  const busSpecs = [
    { orgId: ANBESA_ID,  plate: "ANB-001-AA", model: "Scania Touring HD",   capacity: 49 },
    { orgId: ANBESA_ID,  plate: "ANB-002-AA", model: "Volvo B11R",          capacity: 45 },
    { orgId: SELAM_ID,   plate: "SEL-001-AA", model: "Mercedes Tourismo",   capacity: 50 },
    { orgId: SELAM_ID,   plate: "SEL-002-AA", model: "MAN Lions Coach",     capacity: 48 },
    { orgId: MEKELLE_ID, plate: "MEK-001-AA", model: "Yutong ZK6122H9",     capacity: 55 },
    { orgId: MEKELLE_ID, plate: "MEK-002-AA", model: "Golden Dragon XML6",  capacity: 49 },
  ];

  const buses = {};
  for (const b of busSpecs) {
    let bus = await p.buses.findFirst({ where: { organization_id: b.orgId, plate_number: b.plate } });
    if (!bus) {
      bus = await p.buses.create({ data: { organization_id: b.orgId, plate_number: b.plate, model: b.model, capacity: b.capacity, is_active: true } });
      console.log("  Created bus: " + b.plate + " (" + b.model + ")");
    } else {
      console.log("  Bus exists: " + b.plate);
    }
    buses[b.plate] = bus;
  }

  // Step 4: Ensure routes exist
  console.log("\nStep 4: Ensuring routes...");
  const routeSpecs = [
    { orgId: ANBESA_ID,  origin: "Addis Ababa", destination: "Bahir Dar",   distKm: 565, hrs: 9.5  },
    { orgId: ANBESA_ID,  origin: "Addis Ababa", destination: "Gondar",      distKm: 738, hrs: 12.0 },
    { orgId: SELAM_ID,   origin: "Addis Ababa", destination: "Bahir Dar",   distKm: 565, hrs: 9.0  },
    { orgId: SELAM_ID,   origin: "Addis Ababa", destination: "Dire Dawa",   distKm: 515, hrs: 8.0  },
    { orgId: MEKELLE_ID, origin: "Addis Ababa", destination: "Mekelle",     distKm: 783, hrs: 12.5 },
    { orgId: MEKELLE_ID, origin: "Mekelle",     destination: "Addis Ababa", distKm: 783, hrs: 12.5 },
  ];

  const routes = {};
  for (const r of routeSpecs) {
    let route = await p.routes.findFirst({ where: { organization_id: r.orgId, origin: r.origin, destination: r.destination } });
    if (!route) {
      route = await p.routes.create({ data: { organization_id: r.orgId, origin: r.origin, destination: r.destination, distance_km: r.distKm, estimated_duration_hours: r.hrs, is_active: true } });
      console.log("  Created route: " + r.origin + " -> " + r.destination);
    } else {
      console.log("  Route exists: " + r.origin + " -> " + r.destination);
    }
    routes[r.orgId + "|" + r.origin + "|" + r.destination] = route;
  }

  // Step 5: Delete any old trips we might have seeded for these real orgs
  console.log("\nStep 5: Cleaning old seeded trips for real orgs (Nov 23-26 2026)...");
  const seedDates = ["2026-11-23", "2026-11-24", "2026-11-25", "2026-11-26"];
  for (const orgId of [ANBESA_ID, SELAM_ID, MEKELLE_ID]) {
    const oldTrips = await p.trips.findMany({
      where: {
        organization_id: orgId,
        departure_time: {
          gte: new Date("2026-11-23T00:00:00.000Z"),
          lte: new Date("2026-11-26T23:59:59.000Z"),
        },
      },
      select: { id: true },
    });
    for (const t of oldTrips) {
      await p.seats.deleteMany({ where: { trip_id: t.id } });
      await p.trips.delete({ where: { id: t.id } });
    }
    if (oldTrips.length > 0) console.log("  Removed " + oldTrips.length + " old trips for org " + orgId);
  }

  // Step 6: Seed 12 trips
  console.log("\nStep 6: Creating 12 trips (Nov 23-26, 2026)...");
  const tripDefs = [
    // Anbesa - 4 trips
    { orgId:ANBESA_ID,  plate:"ANB-001-AA", origin:"Addis Ababa", destination:"Bahir Dar",   dep:"2026-11-23T03:00:00.000Z", arr:"2026-11-23T12:30:00.000Z", fare:750  },
    { orgId:ANBESA_ID,  plate:"ANB-002-AA", origin:"Addis Ababa", destination:"Bahir Dar",   dep:"2026-11-24T04:30:00.000Z", arr:"2026-11-24T14:00:00.000Z", fare:750  },
    { orgId:ANBESA_ID,  plate:"ANB-001-AA", origin:"Addis Ababa", destination:"Gondar",      dep:"2026-11-25T03:00:00.000Z", arr:"2026-11-25T15:00:00.000Z", fare:950  },
    { orgId:ANBESA_ID,  plate:"ANB-002-AA", origin:"Addis Ababa", destination:"Gondar",      dep:"2026-11-26T04:00:00.000Z", arr:"2026-11-26T16:00:00.000Z", fare:950  },
    // Selam - 4 trips
    { orgId:SELAM_ID,   plate:"SEL-001-AA", origin:"Addis Ababa", destination:"Bahir Dar",   dep:"2026-11-23T05:00:00.000Z", arr:"2026-11-23T14:00:00.000Z", fare:800  },
    { orgId:SELAM_ID,   plate:"SEL-002-AA", origin:"Addis Ababa", destination:"Bahir Dar",   dep:"2026-11-24T05:30:00.000Z", arr:"2026-11-24T14:30:00.000Z", fare:800  },
    { orgId:SELAM_ID,   plate:"SEL-001-AA", origin:"Addis Ababa", destination:"Dire Dawa",   dep:"2026-11-25T05:00:00.000Z", arr:"2026-11-25T13:00:00.000Z", fare:680  },
    { orgId:SELAM_ID,   plate:"SEL-002-AA", origin:"Addis Ababa", destination:"Dire Dawa",   dep:"2026-11-26T05:30:00.000Z", arr:"2026-11-26T13:30:00.000Z", fare:680  },
    // Mekelle Transport - 4 trips
    { orgId:MEKELLE_ID, plate:"MEK-001-AA", origin:"Addis Ababa", destination:"Mekelle",     dep:"2026-11-23T04:00:00.000Z", arr:"2026-11-23T16:30:00.000Z", fare:1100 },
    { orgId:MEKELLE_ID, plate:"MEK-002-AA", origin:"Addis Ababa", destination:"Mekelle",     dep:"2026-11-24T03:30:00.000Z", arr:"2026-11-24T16:00:00.000Z", fare:1100 },
    { orgId:MEKELLE_ID, plate:"MEK-001-AA", origin:"Mekelle",     destination:"Addis Ababa", dep:"2026-11-25T04:00:00.000Z", arr:"2026-11-25T16:30:00.000Z", fare:1050 },
    { orgId:MEKELLE_ID, plate:"MEK-002-AA", origin:"Mekelle",     destination:"Addis Ababa", dep:"2026-11-26T03:30:00.000Z", arr:"2026-11-26T16:00:00.000Z", fare:1050 },
  ];

  let created = 0;
  for (const td of tripDefs) {
    const bus   = buses[td.plate];
    const route = routes[td.orgId + "|" + td.origin + "|" + td.destination];
    if (!bus || !route) { console.error("  Missing bus/route for: " + td.plate + " " + td.origin + "->" + td.destination); continue; }

    const trip = await p.trips.create({
      data: {
        organization_id: td.orgId,
        bus_id: bus.id,
        route_id: route.id,
        departure_time: new Date(td.dep),
        arrival_time: new Date(td.arr),
        fare: td.fare,
        status: "SCHEDULED",
      },
    });

    const seats = [];
    for (let s = 1; s <= bus.capacity; s++) {
      seats.push({ trip_id: trip.id, seat_number: s, status: "AVAILABLE" });
    }
    await p.seats.createMany({ data: seats, skipDuplicates: true });

    const orgLabel = td.orgId === ANBESA_ID ? "Anbesa" : td.orgId === SELAM_ID ? "Selam" : "Mekelle";
    console.log("  Trip " + (++created) + ": [" + orgLabel + "] " + td.origin + " -> " + td.destination + " | " + td.dep.split("T")[0] + " " + td.dep.split("T")[1].substring(0,5) + " UTC | " + td.fare + " ETB | " + bus.capacity + " seats");
  }

  console.log("\n=== Done! Created " + created + "/12 trips ===");
}

main()
  .catch(e => { console.error("ERROR:", e.message); process.exit(1); })
  .finally(() => { p["$disconnect"](); });
