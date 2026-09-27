import React, { createContext, useContext, useState } from "react";
import {
  initialOrganizations,
  initialUsers,
  initialStations,
  initialBuses,
  initialRoutes,
  initialTrips,
  initialBookings,
  initialPayments,
  initialTickets,
  initialVerifications,
  initialDrivers,
  initialVerifiers,
  initialAuditLogs,
  initialSettings
} from "../data/mockData";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Role & Scope Guard State
  const [currentRole, setCurrentRole] = useState("ADMIN"); // 'ADMIN' or 'MANAGER'
  const [selectedOrgId, setSelectedOrgId] = useState("org-101"); // Selected org for Manager scope
  const [activePage, setActivePage] = useState("dashboard"); // Page slug
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // Collapsible sidebar state
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' | 'info' }

  const toggleSidebar = () => setIsSidebarCollapsed((prev) => !prev);

  // Search filter
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");

  // System Entities State
  const [organizations, setOrganizations] = useState(initialOrganizations);
  const [users, setUsers] = useState(initialUsers);
  const [stations, setStations] = useState(initialStations);
  const [buses, setBuses] = useState(initialBuses);
  const [routes, setRoutes] = useState(initialRoutes);
  const [trips, setTrips] = useState(initialTrips);
  const [bookings, setBookings] = useState(initialBookings);
  const [payments, setPayments] = useState(initialPayments);
  const [tickets, setTickets] = useState(initialTickets);
  const [verifications, setVerifications] = useState(initialVerifications);
  const [drivers, setDrivers] = useState(initialDrivers);
  const [verifiers, setVerifiers] = useState(initialVerifiers);
  const [auditLogs, setAuditLogs] = useState(initialAuditLogs);
  const [settings, setSettings] = useState(initialSettings);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const addAuditLog = (action, entityType, entityId, oldValues, newValues, orgName = "Platform Oversight") => {
    const newLog = {
      id: `aud-${Date.now()}`,
      actorName: currentRole === "ADMIN" ? "Solomon Tekle (Admin)" : "Dawit Haile (Manager)",
      actorRole: currentRole,
      organizationName: orgName,
      action,
      entityType,
      entityId,
      oldValues: oldValues || "—",
      newValues: newValues || "—",
      timestamp: new Date().toLocaleString(),
      ipAddress: "197.156.70.12"
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Active Organization object for Operational Manager
  const activeOrg = organizations.find((o) => o.id === selectedOrgId) || organizations[0];

  // ================= ORGANIZATION ACTIONS (Admin) =================
  const approveOrganization = (orgId) => {
    const org = organizations.find((o) => o.id === orgId);
    setOrganizations((prev) =>
      prev.map((o) => (o.id === orgId ? { ...o, status: "APPROVED" } : o))
    );
    addAuditLog("APPROVE_ORGANIZATION", "Organization", orgId, "Status: PENDING", "Status: APPROVED", org?.name);
    showToast(`Organization "${org?.name || orgId}" approved successfully!`);
  };

  const rejectOrganization = (orgId, reason = "License documentation verification failed") => {
    const org = organizations.find((o) => o.id === orgId);
    setOrganizations((prev) =>
      prev.map((o) => (o.id === orgId ? { ...o, status: "REJECTED", notes: reason } : o))
    );
    addAuditLog("REJECT_ORGANIZATION", "Organization", orgId, "Status: PENDING", `Status: REJECTED (${reason})`, org?.name);
    showToast(`Organization "${org?.name || orgId}" was rejected.`, "error");
  };

  const suspendOrganization = (orgId, reason = "Safety compliance non-conformity") => {
    const org = organizations.find((o) => o.id === orgId);
    setOrganizations((prev) =>
      prev.map((o) => (o.id === orgId ? { ...o, status: "SUSPENDED", notes: reason } : o))
    );
    addAuditLog("SUSPEND_ORGANIZATION", "Organization", orgId, "Status: APPROVED", `Status: SUSPENDED (${reason})`, org?.name);
    showToast(`Organization "${org?.name}" suspended.`, "info");
  };

  const reactivateOrganization = (orgId) => {
    const org = organizations.find((o) => o.id === orgId);
    setOrganizations((prev) =>
      prev.map((o) => (o.id === orgId ? { ...o, status: "APPROVED", notes: "Reactivated by platform administrator" } : o))
    );
    addAuditLog("REACTIVATE_ORGANIZATION", "Organization", orgId, "Status: SUSPENDED", "Status: APPROVED", org?.name);
    showToast(`Organization "${org?.name}" reactivated!`);
  };

  // ================= STATIONS ACTIONS (Admin) =================
  const addStation = (stationData) => {
    const newStation = {
      id: `stn-${Date.now()}`,
      activeRoutesCount: 0,
      status: "ACTIVE",
      createdAt: new Date().toISOString().split("T")[0],
      ...stationData
    };
    setStations((prev) => [newStation, ...prev]);
    addAuditLog("ADD_STATION", "Station", newStation.id, "—", `Created ${newStation.name} (${newStation.city})`);
    showToast(`Station "${newStation.name}" added successfully.`);
  };

  const updateStation = (id, updatedData) => {
    setStations((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updatedData } : s))
    );
    addAuditLog("UPDATE_STATION", "Station", id, "—", `Updated details for station ${id}`);
    showToast("Station updated successfully.");
  };

  // ================= BUSES ACTIONS (Manager/Admin) =================
  const addBus = (busData) => {
    const org = organizations.find((o) => o.id === (busData.organizationId || selectedOrgId));
    const newBus = {
      id: `bus-${Date.now()}`,
      organizationId: org?.id || selectedOrgId,
      organizationName: org?.name || "Selam Bus Line",
      status: "ACTIVE",
      lastMaintenance: new Date().toISOString().split("T")[0],
      ...busData
    };
    setBuses((prev) => [newBus, ...prev]);
    // update org total buses count
    setOrganizations((prev) =>
      prev.map((o) => (o.id === newBus.organizationId ? { ...o, totalBuses: (o.totalBuses || 0) + 1 } : o))
    );
    addAuditLog("ADD_BUS", "Bus", newBus.id, "—", `Added Bus ${newBus.busNumber} (${newBus.plateNumber})`, newBus.organizationName);
    showToast(`Bus ${newBus.busNumber} added to fleet!`);
  };

  const updateBusStatus = (busId, newStatus) => {
    const bus = buses.find((b) => b.id === busId);
    setBuses((prev) =>
      prev.map((b) => (b.id === busId ? { ...b, status: newStatus } : b))
    );
    addAuditLog("UPDATE_BUS_STATUS", "Bus", busId, `Status: ${bus?.status}`, `Status: ${newStatus}`, bus?.organizationName);
    showToast(`Bus ${bus?.busNumber} status changed to ${newStatus}.`);
  };

  // ================= ROUTES ACTIONS (Manager/Admin) =================
  const addRoute = (routeData) => {
    const originStn = stations.find((s) => s.id === routeData.originStationId);
    const destStn = stations.find((s) => s.id === routeData.destinationStationId);
    const newRoute = {
      id: `rt-${Date.now()}`,
      name: `${originStn?.city || 'Origin'} ↔ ${destStn?.city || 'Destination'}`,
      originStationName: originStn?.name || "Origin Station",
      destinationStationName: destStn?.name || "Destination Station",
      assignedOrganizationsCount: 1,
      status: "ACTIVE",
      ...routeData
    };
    setRoutes((prev) => [newRoute, ...prev]);
    addAuditLog("ADD_ROUTE", "Route", newRoute.id, "—", `Created Route ${newRoute.name}`);
    showToast(`Route ${newRoute.name} created!`);
  };

  // ================= TRIPS ACTIONS (Manager) =================
  const createTrip = (tripData) => {
    const route = routes.find((r) => r.id === tripData.routeId);
    const bus = buses.find((b) => b.id === tripData.busId);
    const driver = drivers.find((d) => d.id === tripData.driverId);
    const org = organizations.find((o) => o.id === selectedOrgId);

    if (bus && bus.status !== "ACTIVE") {
      showToast(`Cannot assign Bus ${bus.busNumber} because it is in ${bus.status} state.`, "error");
      return false;
    }

    const newTrip = {
      id: `trp-${Date.now()}`,
      tripCode: `TRIP-${org?.name.substring(0, 3).toUpperCase() || 'BUS'}-${Date.now().toString().slice(-6)}`,
      organizationId: selectedOrgId,
      organizationName: org?.name || "Selam Bus Line",
      routeName: route?.name || "Addis Ababa ↔ Hawassa",
      originStation: route?.originStationName || "Origin",
      destinationStation: route?.destinationStationName || "Destination",
      busPlateNumber: bus?.plateNumber || "ET-3-00000",
      driverName: driver ? driver.name : "Unassigned",
      bookedSeatsCount: 0,
      heldSeatsCount: 0,
      availableSeatsCount: bus?.capacity || 45,
      totalSeats: bus?.capacity || 45,
      status: "DRAFT",
      ...tripData
    };

    setTrips((prev) => [newTrip, ...prev]);
    addAuditLog("CREATE_TRIP", "Trip", newTrip.id, "—", `Created Trip ${newTrip.tripCode} (${newTrip.routeName})`, org?.name);
    showToast(`Trip ${newTrip.tripCode} created in DRAFT state.`);
    return true;
  };

  const publishTrip = (tripId) => {
    const trip = trips.find((t) => t.id === tripId);
    if (!trip) return;
    if (settings.requireDriverAssignmentBeforePublish && (trip.driverName === "Unassigned" || !trip.driverId)) {
      showToast("System policy requires an assigned driver before publishing trip.", "error");
      return;
    }

    setTrips((prev) =>
      prev.map((t) => (t.id === tripId ? { ...t, status: "PUBLISHED" } : t))
    );
    addAuditLog("PUBLISH_TRIP", "Trip", tripId, "Status: DRAFT", "Status: PUBLISHED", trip.organizationName);
    showToast(`Trip ${trip.tripCode} is now PUBLISHED and available for passenger booking!`);
  };

  const cancelTrip = (tripId) => {
    const trip = trips.find((t) => t.id === tripId);
    setTrips((prev) =>
      prev.map((t) => (t.id === tripId ? { ...t, status: "CANCELLED" } : t))
    );
    addAuditLog("CANCEL_TRIP", "Trip", tripId, `Status: ${trip?.status}`, "Status: CANCELLED", trip?.organizationName);
    showToast(`Trip ${trip?.tripCode} has been cancelled.`, "error");
  };

  const assignDriverToTrip = (tripId, driverId) => {
    const driver = drivers.find((d) => d.id === driverId);
    if (!driver) return;
    if (driver.organizationId !== selectedOrgId && currentRole !== "ADMIN") {
      showToast("Security Violation: Driver does not belong to your organization!", "error");
      return;
    }

    setTrips((prev) =>
      prev.map((t) => (t.id === tripId ? { ...t, driverId: driver.id, driverName: driver.name } : t))
    );
    const trip = trips.find((t) => t.id === tripId);
    addAuditLog("ASSIGN_DRIVER", "Trip", tripId, `Driver: ${trip?.driverName}`, `Driver: ${driver.name}`, trip?.organizationName);
    showToast(`Driver ${driver.name} assigned to trip ${trip?.tripCode}.`);
  };

  // ================= DRIVERS & VERIFIERS ACTIONS =================
  const addDriver = (driverData) => {
    const org = organizations.find((o) => o.id === selectedOrgId);
    const newDriver = {
      id: `drv-${Date.now()}`,
      organizationId: selectedOrgId,
      organizationName: org?.name || "Selam Bus Line",
      status: "ACTIVE",
      totalTripsCompleted: 0,
      rating: 5.0,
      ...driverData
    };
    setDrivers((prev) => [newDriver, ...prev]);

    // Create user account for driver automatically
    const newUser = {
      id: `usr-drv-${Date.now()}`,
      name: newDriver.name,
      email: `${newDriver.name.toLowerCase().replace(/\s+/g, ".")}@${org?.name.toLowerCase().replace(/\s+/g, "")}.et`,
      phone: newDriver.phone,
      role: "Driver",
      organizationId: selectedOrgId,
      organizationName: org?.name,
      status: "ACTIVE",
      createdAt: new Date().toISOString().split("T")[0]
    };
    setUsers((prev) => [newUser, ...prev]);

    addAuditLog("CREATE_DRIVER", "Driver", newDriver.id, "—", `Created Driver Profile for ${newDriver.name}`, org?.name);
    showToast(`Driver account created for ${newDriver.name}.`);
  };

  const addVerifier = (verifierData) => {
    const org = organizations.find((o) => o.id === selectedOrgId);
    const newVerifier = {
      id: `vrf-usr-${Date.now()}`,
      organizationId: selectedOrgId,
      organizationName: org?.name || "Selam Bus Line",
      status: "ACTIVE",
      scansToday: 0,
      createdAt: new Date().toISOString().split("T")[0],
      ...verifierData
    };
    setVerifiers((prev) => [newVerifier, ...prev]);

    // Create user account for verifier
    const newUser = {
      id: `usr-vrf-${Date.now()}`,
      name: newVerifier.name,
      email: newVerifier.email || `${newVerifier.name.toLowerCase().replace(/\s+/g, ".")}@${org?.name.toLowerCase().replace(/\s+/g, "")}.et`,
      phone: newVerifier.phone,
      role: "Verifier",
      organizationId: selectedOrgId,
      organizationName: org?.name,
      status: "ACTIVE",
      createdAt: new Date().toISOString().split("T")[0]
    };
    setUsers((prev) => [newUser, ...prev]);

    addAuditLog("CREATE_VERIFIER", "Verifier", newVerifier.id, "—", `Created Verifier Account for ${newVerifier.name}`, org?.name);
    showToast(`Ticket Verifier account created for ${newVerifier.name}.`);
  };

  const toggleUserStatus = (userId) => {
    const user = users.find((u) => u.id === userId);
    const newStatus = user?.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
    );
    addAuditLog("TOGGLE_USER_STATUS", "User", userId, `Status: ${user?.status}`, `Status: ${newStatus}`);
    showToast(`User ${user?.name} is now ${newStatus}.`);
  };

  const updateSystemSettings = (newSettings) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    addAuditLog("UPDATE_SETTINGS", "SystemSettings", "sys-1", "—", "Updated platform settings configuration");
    showToast("Platform configuration updated!");
  };

  return (
    <AppContext.Provider
      value={{
        currentRole,
        setCurrentRole,
        selectedOrgId,
        setSelectedOrgId,
        activeOrg,
        activePage,
        setActivePage,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        toggleSidebar,
        toast,
        showToast,
        globalSearchQuery,
        setGlobalSearchQuery,
        // Entities
        organizations,
        users,
        stations,
        buses,
        routes,
        trips,
        bookings,
        payments,
        tickets,
        verifications,
        drivers,
        verifiers,
        auditLogs,
        settings,
        // Handlers
        approveOrganization,
        rejectOrganization,
        suspendOrganization,
        reactivateOrganization,
        addStation,
        updateStation,
        addBus,
        updateBusStatus,
        addRoute,
        createTrip,
        publishTrip,
        cancelTrip,
        assignDriverToTrip,
        addDriver,
        addVerifier,
        toggleUserStatus,
        updateSystemSettings
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
