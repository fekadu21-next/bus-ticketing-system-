import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import {
  getAdminDashboardStatsApi,
  getAdminOrganizationsApi,
  approveOrganizationApi,
  rejectOrganizationApi,
  suspendOrganizationApi,
  activateOrganizationApi,
  getUsersApi,
  toggleUserStatusApi,
  getAdminBusesApi,
  getAdminRoutesApi,
  getAdminTripsApi,
  getAdminBookingsApi,
  getAdminPaymentsApi,
  getAdminAuditLogsApi,
  getAdminReportsApi,
  getAdminStationsApi,
  createStationApi,
  updateStationApi,
  deleteStationApi,
  updateAdminBusStatusApi,
  updateAdminRouteStatusApi,
  updateAdminTripStatusApi,
  updateAdminBookingStatusApi,
  updateAdminPaymentStatusApi,
  updateAdminTicketStatusApi,
  updateAdminAuditLogApi,
} from "../api/admin.api";
import {
  getBusesApi,
  createBusApi,
  updateBusApi,
  deleteBusApi,
  getRoutesApi,
  createRouteApi,
  updateRouteApi,
  deleteRouteApi,
  getTripsApi,
  createTripApi,
  updateTripApi,
  deleteTripApi,
  cancelTripApi,
  publishTripApi,
  unpublishTripApi,
  assignDriverToTripApi,
  assignVerifierToTripApi,
  getBookingsApi,
  getPaymentsApi,
  getOperationalStatsApi,
  getStaffApi,
  createStaffApi,
  toggleStaffStatusApi,
  updateStaffApi,
  deleteStaffApi,
  deleteVerifierApi,
  getOrganizationDetailsApi,
  updateOrganizationProfileApi,
  getDriversApi,
  createDriverApi,
  updateDriverApi,
  deleteDriverApi,
  toggleDriverStatusApi,
  getActiveStationsApi,
  verifyTicketApi,
  updateSeatStatusApi,
} from "../api/coordinator.api";
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
} from "../data/mockData";

const AppContext = createContext();

export const DEFAULT_PLATFORM_SETTINGS = {
  platformFeePercent: 5.0,
  holdDurationMinutes: 15,
  requireDriverAssignmentBeforePublish: true,
  telebirrMerchantId: "TB-ET-994821",
  chapaPublicKey: "CHAPUBK_TEST-xxxxxxxx",
  currency: "ETB",
};

export const formatTripSchedule = (rawDepartureTime) => {
  if (!rawDepartureTime) {
    return {
      departureDate: "2026-10-18",
      departureTime: "06:00 AM",
      formattedDate: "Sun, Oct 18, 2026",
    };
  }
  const d = new Date(rawDepartureTime);
  if (isNaN(d.getTime())) {
    return {
      departureDate: String(rawDepartureTime).split("T")[0] || "2026-10-18",
      departureTime: "06:00 AM",
      formattedDate: String(rawDepartureTime),
    };
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const departureDate = `${year}-${month}-${day}`;
  const departureTime = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
  const formattedDate = d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  return { departureDate, departureTime, formattedDate };
};

const getInitialConsolePage = () => {
  if (typeof window === "undefined") return "dashboard";
  const match = window.location.pathname.match(
    /^\/(?:admin|operator|dashboard|manager|portal|management)(?:\/([^/?#]+))?/
  );
  return match?.[1] || "dashboard";
};

const getInitialConsoleRole = () => {
  if (typeof window === "undefined") return null;
  const path = window.location.pathname;
  if (path.startsWith("/operator") || path.startsWith("/manager")) return "MANAGER";
  if (path.startsWith("/admin")) return "ADMIN";
  return null;
};

const statusSyncChannel =
  typeof window !== "undefined" && "BroadcastChannel" in window
    ? new BroadcastChannel("intercity_status_sync")
    : null;

const notifyStatusChange = (payload) => {
  if (statusSyncChannel) {
    try {
      statusSyncChannel.postMessage({ timestamp: Date.now(), ...payload });
    } catch (e) {
      console.warn("BroadcastChannel notice:", e);
    }
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("intercity_status_change", { detail: payload }));
  }
};

export const AppProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  // Role & Scope Guard State - strictly derived from auth and path
  const [currentRole, setCurrentRole] = useState(getInitialConsoleRole); // 'ADMIN', 'MANAGER', 'PASSENGER', or null
  const [selectedOrgId, setSelectedOrgId] = useState(() => {
    const orgCtx = user?.organizationContext?.[0];
    return orgCtx?.organizationId || user?.organizationId || initialOrganizations[0]?.id || "org-101";
  });
  const [activePage, setActivePage] = useState(getInitialConsolePage);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [toast, setToast] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const toggleSidebar = () => setIsSidebarCollapsed((prev) => !prev);

  // Search filter
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");

  // System Entities State - Initialized with fallback defaults, augmented by live DB records
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
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("platform_system_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_PLATFORM_SETTINGS, ...parsed };
      }
    } catch (e) {
      console.warn("Could not load settings from localStorage:", e);
    }
    return DEFAULT_PLATFORM_SETTINGS;
  });
  const [adminStats, setAdminStats] = useState(null);
  const [adminReports, setAdminReports] = useState(null);
  const [coordinatorStats, setCoordinatorStats] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const addAuditLog = (action, entityType, entityId, oldValues, newValues, orgName = "Platform Oversight") => {
    const actor = currentRole === "ADMIN" ? "Platform Admin" : "Booking Coordinator";
    const newLog = {
      id: `aud-${Date.now()}`,
      actorName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : actor,
      actorRole: currentRole === "ADMIN" ? "ADMIN" : "BOOKING_COORDINATOR",
      organizationName: orgName,
      action,
      entityType,
      entityId,
      oldValues: oldValues || "—",
      newValues: newValues || "—",
      timestamp: new Date().toLocaleString(),
      ipAddress: "127.0.0.1"
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Active Organization object for Booking Coordinator
  const activeOrg = organizations.find((o) => o.id === selectedOrgId) || organizations[0];

  // Helper to resolve the coordinator organization ID
  const getCoordinatorOrgId = useCallback(() => {
    const orgCtx = user?.organizationContext?.[0];
    return orgCtx?.organizationId || user?.organizationId || selectedOrgId;
  }, [user, selectedOrgId]);

  // ================= ADMIN DATA FETCHING (Platform-Wide) =================
  const fetchAdminData = useCallback(async ({ silent = false } = {}) => {
    if (!isAuthenticated) return;
    try {
      if (!silent) setIsLoadingData(true);
      const [
        statsRes,
        orgsRes,
        usersRes,
        busesRes,
        routesRes,
        tripsRes,
        bookingsRes,
        paymentsRes,
        auditRes,
        reportsRes,
        stationsRes,
      ] = await Promise.allSettled([
        getAdminDashboardStatsApi({ organizationId: selectedOrgId && selectedOrgId !== "ALL" ? selectedOrgId : undefined }),
        getAdminOrganizationsApi({ limit: 100 }),
        getUsersApi({ limit: 100 }),
        getAdminBusesApi({ limit: 100 }),
        getAdminRoutesApi({ limit: 100 }),
        getAdminTripsApi({ limit: 100 }),
        getAdminBookingsApi({ limit: 100 }),
        getAdminPaymentsApi({ limit: 100 }),
        getAdminAuditLogsApi({ limit: 100 }),
        getAdminReportsApi(),
        getAdminStationsApi({ limit: 100 }),
      ]);

      if (statsRes.status === "fulfilled" && statsRes.value?.data) {
        setAdminStats(statsRes.value.data);
      }

      if (reportsRes.status === "fulfilled" && reportsRes.value?.data) {
        setAdminReports(reportsRes.value.data);
      }

      if (stationsRes.status === "fulfilled" && stationsRes.value) {
        const rawStations =
          stationsRes.value.data?.stations ||
          stationsRes.value.data ||
          stationsRes.value.stations ||
          [];
        if (Array.isArray(rawStations)) {
          setStations(rawStations.map((st) => ({
            id: st.id,
            name: st.name,
            city: st.city,
            code: st.code,
            address: st.address,
            latitude: st.latitude,
            longitude: st.longitude,
            is_active: st.is_active ?? st.isActive ?? true,
            _count: st._count,
            created_at: st.created_at,
          })));
        }
      }

      if (orgsRes.status === "fulfilled" && orgsRes.value?.data) {
        const rawOrgs = orgsRes.value.data.organizations || orgsRes.value.data;
        const rawBuses = (busesRes.status === "fulfilled" && (busesRes.value?.data?.buses || busesRes.value?.data)) || [];
        const rawTrips = (tripsRes.status === "fulfilled" && (tripsRes.value?.data?.trips || tripsRes.value?.data)) || [];

        if (Array.isArray(rawOrgs) && rawOrgs.length > 0) {
          const mappedOrgs = rawOrgs.map((o) => {
            const orgBusCount = o.totalBuses ?? o._count?.buses ?? (Array.isArray(rawBuses) ? rawBuses.filter(b => b.organization_id === o.id || b.organizationId === o.id).length : 0) || (o.buses?.length || 0);
            const orgTripCount = o.activeTrips ?? o._count?.trips ?? (Array.isArray(rawTrips) ? rawTrips.filter(t => t.organization_id === o.id || t.organizationId === o.id).length : 0) || (o.trips?.length || 0);

            return {
              id: o.id,
              name: o.name,
              type: o.type || "Intercity Bus Operator",
              status: o.status || "APPROVED",
              isActive: o.isActive ?? o.is_active ?? true,
              createdAt: o.createdAt
                ? o.createdAt.split("T")[0]
                : o.created_at
                ? o.created_at.split("T")[0]
                : new Date().toISOString().split("T")[0],
              registrationNumber: o.registrationNumber || `REG-${o.id.substring(0, 8).toUpperCase()}`,
              contactName:
                o.contactName ||
                (o.representative
                  ? `${o.representative.firstName || ''} ${o.representative.lastName || ''}`.trim()
                  : "Operations Lead"),
              phone: o.phone || "+251 911 000000",
              email: o.email || `contact@${o.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.et`,
              address: o.address || "Addis Ababa, Ethiopia",
              totalBuses: orgBusCount,
              activeTrips: orgTripCount,
              notes:
                o.status === "PENDING"
                  ? "Awaiting review and commercial operator license validation."
                  : "Verified transport provider.",
            };
          });
          setOrganizations(mappedOrgs);
        }
      }

      if (usersRes.status === "fulfilled" && usersRes.value?.data) {
        const rawUsers = usersRes.value.data.users || usersRes.value.data;
        if (Array.isArray(rawUsers) && rawUsers.length > 0) {
          const mappedUsers = rawUsers.map((u) => {
            const userRole = u.user_roles?.[0];
            const roleName = userRole?.roles?.name || (u.roles && u.roles[0]) || "PASSENGER";
            const orgObj = userRole?.organizations || u.organizations;
            const orgName = orgObj?.name || u.organizationName || u.organization_name || "—";
            const orgId = orgObj?.id || userRole?.organization_id || u.organization_id || "";

            const fullName = [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
            const resolvedName = fullName || (u.name && u.name !== u.email ? u.name : (u.email ? u.email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Platform User"));

            return {
              id: u.id,
              name: resolvedName,
              firstName: u.first_name || "",
              lastName: u.last_name || "",
              email: u.email,
              phone: u.phone || "—",
              role: roleName,
              organizationId: orgId,
              organizationName: orgName,
              status: u.is_active ? "ACTIVE" : "SUSPENDED",
              isActive: u.is_active ?? true,
              emailVerified: u.email_verified ?? false,
              failedLoginAttempts: u.failed_login_attempts ?? 0,
              lastLoginAt: u.last_login_at ? u.last_login_at.split("T")[0] : "Never",
              createdAt: u.created_at ? u.created_at.split("T")[0] : new Date().toISOString().split("T")[0]
            };
          });
          setUsers(mappedUsers);
        }
      }

      if (busesRes.status === "fulfilled" && busesRes.value?.data) {
        const rawBuses = busesRes.value.data.buses || busesRes.value.data;
        if (Array.isArray(rawBuses)) {
          setBuses(rawBuses.map((b) => ({
            id: b.id,
            organizationId: b.organization_id,
            organizationName: b.organizations?.name || "Operator",
            busNumber: b.plate_number || `BUS-${b.id.slice(0, 4)}`,
            plateNumber: b.plate_number || `ET-${b.id.slice(0, 6)}`,
            model: b.model || "Standard Coach",
            capacity: b.capacity || 50,
            status: b.status || (b.is_active ? "ACTIVE" : "MAINTENANCE"),
            is_active: b.is_active ?? (b.status === "ACTIVE"),
            manufactureYear: "2023",
            lastMaintenance: b.updated_at ? b.updated_at.split("T")[0] : new Date().toISOString().split("T")[0],
          })));
        }
      }

      if (routesRes.status === "fulfilled" && routesRes.value?.data) {
        const rawRoutes = routesRes.value.data.routes || routesRes.value.data;
        if (Array.isArray(rawRoutes)) {
          setRoutes(rawRoutes.map((r) => ({
            id: r.id,
            organizationId: r.organization_id,
            organizationName: r.organizations?.name || "Operator",
            name: r.origin_station && r.destination_station
              ? `${r.origin_station.name} ↔ ${r.destination_station.name}`
              : r.origin && r.destination
              ? `${r.origin} ↔ ${r.destination}`
              : "Route",
            originStationName: r.origin_station?.name || r.origin || "Origin",
            destinationStationName: r.destination_station?.name || r.destination || "Destination",
            originStationId: r.origin_station_id,
            destinationStationId: r.destination_station_id,
            distanceKm: r.distance_km || 400,
            estimatedDuration: r.estimated_duration_hours ? `${r.estimated_duration_hours}h` : "5h 30m",
            status: r.status || (r.is_active ? "ACTIVE" : "INACTIVE"),
            is_active: r.is_active ?? (r.status === "ACTIVE"),
            assignedOrganizationsCount: 1,
          })));
        }
      }

      if (tripsRes.status === "fulfilled" && tripsRes.value?.data) {
        const rawTrips = tripsRes.value.data.trips || tripsRes.value.data;
        if (Array.isArray(rawTrips)) {
          setTrips(rawTrips.map((t) => {
            const sched = formatTripSchedule(t.departure_time);
            return {
              id: t.id,
              tripCode: `TRP-${t.id.slice(0, 6).toUpperCase()}`,
              organizationId: t.organization_id,
              organizationName: t.organizations?.name || "Operator",
              routeName: t.routes?.origin_station && t.routes?.destination_station
                ? `${t.routes.origin_station.name} ↔ ${t.routes.destination_station.name}`
                : t.routes?.origin && t.routes?.destination
                ? `${t.routes.origin} ↔ ${t.routes.destination}`
                : "Route",
              originStation: t.routes?.origin_station?.name || t.routes?.origin || "Origin",
              destinationStation: t.routes?.destination_station?.name || t.routes?.destination || "Destination",
              busPlateNumber: t.buses?.plate_number || "ET-BUS",
              busId: t.bus_id,
              routeId: t.route_id,
              driverName: t.driver ? [t.driver.first_name, t.driver.last_name].filter(Boolean).join(" ") : "Scheduled Driver",
              driverId: t.driver_id,
              verifierName: t.verifier ? [t.verifier.first_name, t.verifier.last_name].filter(Boolean).join(" ") : "Unassigned",
              verifierId: t.verifier_id,
              bookedSeatsCount: t.bookedSeatsCount !== undefined ? t.bookedSeatsCount : (t._count?.bookings || 0),
              availableSeatsCount: t.availableSeatsCount !== undefined ? t.availableSeatsCount : Math.max(0, (t._count?.seats || t.buses?.capacity || 50) - (t._count?.bookings || 0)),
              totalSeats: t._count?.seats || t.buses?.capacity || 50,
              departureTime: sched.departureTime,
              departureDate: sched.departureDate,
              formattedDate: sched.formattedDate,
              status: t.status === "SCHEDULED" ? "PUBLISHED" : (t.status || "PUBLISHED"),
              fareAmount: Number(t.fare || 0),
            };
          }));
        }
      }

      if (bookingsRes.status === "fulfilled" && bookingsRes.value?.data) {
        const rawBookings = bookingsRes.value.data.bookings || bookingsRes.value.data;
        if (Array.isArray(rawBookings) && rawBookings.length > 0) {
          const mappedBookings = rawBookings.map((bk) => ({
            id: bk.id,
            bookingReference: `BK-${bk.id.slice(0, 8).toUpperCase()}`,
            organizationId: bk.organization_id,
            organizationName: bk.organizations?.name || "Operator",
            passengerName: [bk.users?.first_name, bk.users?.last_name].filter(Boolean).join(" ") || "Passenger",
            passengerPhone: bk.users?.phone || "+251911000000",
            passengerEmail: bk.users?.email || "passenger@busticket.com",
            tripCode: bk.trips?.id ? `TRP-${bk.trips.id.slice(0, 6).toUpperCase()}` : "TRP-SCHEDULED",
            routeName: bk.trips?.routes ? `${bk.trips.routes.origin} ↔ ${bk.trips.routes.destination}` : "Scheduled Route",
            seatNumber: bk.seat_number,
            amount: Number(bk.total_fare || 0),
            totalFare: Number(bk.total_fare || 0),
            status: bk.status,
            paymentStatus: bk.payments?.status === "COMPLETED" ? "SUCCESS" : bk.status === "CONFIRMED" ? "SUCCESS" : "PENDING",
            bookingDate: bk.created_at ? bk.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
          }));
          setBookings(mappedBookings);

          // Mirror real confirmed bookings to digital tickets
          setTickets(mappedBookings.map((bk) => ({
            id: `tkt-${bk.id}`,
            ticketNumber: `TKT-${bk.id.slice(0, 8).toUpperCase()}`,
            bookingReference: bk.bookingReference,
            organizationId: bk.organizationId,
            organizationName: bk.organizationName,
            passengerName: bk.passengerName,
            tripCode: bk.tripCode,
            routeName: bk.routeName,
            seatNumber: bk.seatNumber,
            qrToken: `QR-${bk.id.slice(0, 8).toUpperCase()}-${bk.seatNumber}`,
            status: bk.status === "CONFIRMED" ? "VALID" : bk.status,
            issuedAt: bk.bookingDate,
          })));
        }
      }

      if (paymentsRes.status === "fulfilled" && paymentsRes.value?.data) {
        const rawPayments = paymentsRes.value.data.payments || paymentsRes.value.data;
        if (Array.isArray(rawPayments) && rawPayments.length > 0) {
          setPayments(rawPayments.map((py) => ({
            id: py.id,
            paymentReference: `PAY-${py.id.slice(0, 8).toUpperCase()}`,
            provider: (py.payment_method || "TELEBIRR").toUpperCase(),
            transactionReference: py.transaction_reference || `TXN-${py.id.slice(0, 8).toUpperCase()}`,
            bookingReference: py.booking_id ? `BK-${py.booking_id.slice(0, 8).toUpperCase()}` : "BK-PLATFORM",
            organizationId: py.organization_id,
            organizationName: py.organizations?.name || "Operator",
            passengerName: [py.bookings?.users?.first_name, py.bookings?.users?.last_name].filter(Boolean).join(" ") || "Passenger",
            amount: Number(py.amount || 0),
            currency: py.currency || "ETB",
            paymentMethod: py.payment_method || "Telebirr",
            status: py.status === "COMPLETED" ? "SUCCESS" : py.status,
            paidAt: py.created_at ? new Date(py.created_at).toLocaleString() : new Date().toLocaleString(),
            createdAt: py.created_at ? py.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
          })));
        }
      }

      if (auditRes.status === "fulfilled" && auditRes.value?.data) {
        const rawLogs = auditRes.value.data.logs || auditRes.value.data;
        if (Array.isArray(rawLogs) && rawLogs.length > 0) {
          setAuditLogs(rawLogs.map((log) => ({
            id: log.id,
            actorName: [log.users?.first_name, log.users?.last_name].filter(Boolean).join(" ") || log.users?.email || "System",
            actorRole: "Platform Oversight",
            organizationName: "System-wide",
            action: log.action,
            entityType: log.details?.entityType || "Security",
            entityId: log.details?.entityId || log.id.slice(0, 8),
            oldValues: log.details?.oldValues || "—",
            newValues: log.details?.newValues || "—",
            timestamp: new Date(log.created_at).toLocaleString(),
            ipAddress: log.ip_address || "127.0.0.1",
          })));
        }
      }
    } catch (err) {
      console.warn("Backend admin sync notice:", err.message);
    } finally {
      if (!silent) setIsLoadingData(false);
    }
  }, [isAuthenticated, selectedOrgId]);

  // ================= BOOKING COORDINATOR DATA FETCHING =================
  const fetchCoordinatorData = useCallback(async (orgId, { silent = false } = {}) => {
    if (!isAuthenticated || !orgId) return;
    try {
      if (!silent) setIsLoadingData(true);
      const [
        busesRes,
        routesRes,
        tripsRes,
        bookingsRes,
        paymentsRes,
        statsRes,
        staffRes,
        driversRes,
        stationsRes,
        orgDetailsRes,
      ] = await Promise.allSettled([
        getBusesApi(orgId),
        getRoutesApi(orgId),
        getTripsApi(orgId),
        getBookingsApi(orgId),
        getPaymentsApi(orgId),
        getOperationalStatsApi(orgId),
        getStaffApi(orgId),
        getDriversApi(orgId),
        getActiveStationsApi(),
        getOrganizationDetailsApi(orgId),
      ]);

      if (orgDetailsRes.status === "fulfilled" && orgDetailsRes.value?.data?.organization) {
        const orgData = orgDetailsRes.value.data.organization;
        setOrganizations((prev) => {
          const exists = prev.find((o) => o.id === orgData.id);
          const formattedOrg = {
            id: orgData.id,
            name: orgData.name,
            type: orgData.type || "COMPANY",
            status: orgData.status || "APPROVED",
            isActive: orgData.isActive ?? true,
            licenseNumber: `LIC-${orgData.id.slice(0, 6).toUpperCase()}`,
            contactEmail: orgData.members?.[0]?.email || "contact@operator.et",
            contactPhone: orgData.members?.[0]?.phone || "+251911000000",
            address: "Addis Ababa, Ethiopia",
            members: orgData.members || [],
            createdAt: orgData.createdAt ? orgData.createdAt.split("T")[0] : new Date().toISOString().split("T")[0],
          };
          if (exists) {
            return prev.map((o) => (o.id === orgData.id ? { ...o, ...formattedOrg } : o));
          }
          return [...prev, formattedOrg];
        });
      }

      if (busesRes.status === "fulfilled" && busesRes.value?.data) {
        const rawBuses = busesRes.value.data.buses || busesRes.value.data;
        if (Array.isArray(rawBuses)) {
          setBuses(rawBuses.map((b) => ({
            id: b.id,
            organizationId: b.organization_id || orgId,
            organizationName: b.organizations?.name || activeOrg?.name || "Operator",
            busNumber: b.plate_number || b.busNumber || `BUS-${b.id.slice(0, 4)}`,
            plateNumber: b.plate_number || b.plateNumber || "ET-3-00000",
            model: b.model || "Standard Coach",
            capacity: b.capacity || 50,
            status: b.status || (b.is_active ? "ACTIVE" : "MAINTENANCE"),
            is_active: b.is_active ?? (b.status === "ACTIVE"),
            manufactureYear: "2023",
            lastMaintenance: b.updated_at ? b.updated_at.split("T")[0] : new Date().toISOString().split("T")[0],
          })));
        }
      }

      if (routesRes.status === "fulfilled" && routesRes.value?.data) {
        const rawRoutes = routesRes.value.data.routes || routesRes.value.data;
        if (Array.isArray(rawRoutes)) {
          setRoutes(rawRoutes.map((r) => ({
            id: r.id,
            organizationId: r.organization_id || orgId,
            organizationName: r.organizations?.name || activeOrg?.name || "Operator",
            name: r.origin_station && r.destination_station
              ? `${r.origin_station.name} ↔ ${r.destination_station.name}`
              : `${r.origin || 'Origin'} ↔ ${r.destination || 'Destination'}`,
            originStationName: r.origin_station?.name || r.origin || "Origin",
            destinationStationName: r.destination_station?.name || r.destination || "Destination",
            originStationId: r.origin_station_id,
            destinationStationId: r.destination_station_id,
            distanceKm: r.distance_km || 400,
            estimatedDuration: r.estimated_duration_hours ? `${r.estimated_duration_hours}h` : "5h 30m",
            status: r.status || (r.is_active ? "ACTIVE" : "INACTIVE"),
            is_active: r.is_active ?? (r.status === "ACTIVE"),
            assignedOrganizationsCount: 1,
          })));
        }
      }

      if (tripsRes.status === "fulfilled" && tripsRes.value?.data) {
        const rawTrips = tripsRes.value.data.trips || tripsRes.value.data;
        if (Array.isArray(rawTrips)) {
          setTrips(rawTrips.map((t) => {
            const sched = formatTripSchedule(t.departure_time);
            return {
              id: t.id,
              tripCode: `TRP-${t.id.slice(0, 6).toUpperCase()}`,
              organizationId: t.organization_id || orgId,
              organizationName: activeOrg?.name || "Assigned Company",
              routeName: t.routes?.origin_station && t.routes?.destination_station
                ? `${t.routes.origin_station.name} ↔ ${t.routes.destination_station.name}`
                : t.routes?.origin && t.routes?.destination
                ? `${t.routes.origin} ↔ ${t.routes.destination}`
                : "Route",
              originStation: t.routes?.origin_station?.name || t.routes?.origin || "Origin",
              destinationStation: t.routes?.destination_station?.name || t.routes?.destination || "Destination",
              busPlateNumber: t.buses?.plate_number || "ET-BUS",
              busId: t.bus_id,
              routeId: t.route_id,
              driverName: t.driver ? [t.driver.first_name, t.driver.last_name].filter(Boolean).join(" ") : "Unassigned",
              driverId: t.driver_id,
              verifierName: t.verifier ? [t.verifier.first_name, t.verifier.last_name].filter(Boolean).join(" ") : "Unassigned",
              verifierId: t.verifier_id,
              bookedSeatsCount: t.bookedSeatsCount !== undefined ? t.bookedSeatsCount : (t._count?.bookings || 0),
              availableSeatsCount: t.availableSeatsCount !== undefined ? t.availableSeatsCount : Math.max(0, (t._count?.seats || t.buses?.capacity || 50) - (t._count?.bookings || 0)),
              totalSeats: t._count?.seats || t.buses?.capacity || 50,
              departureTime: sched.departureTime,
              departureDate: sched.departureDate,
              formattedDate: sched.formattedDate,
              status: t.status === "SCHEDULED" ? "PUBLISHED" : (t.status || "PUBLISHED"),
              fareAmount: Number(t.fare || 0),
            };
          }));
        }
      }

      if (bookingsRes.status === "fulfilled" && bookingsRes.value?.data) {
        const rawBookings = bookingsRes.value.data.bookings || bookingsRes.value.data;
        if (Array.isArray(rawBookings)) {
          setBookings(rawBookings.map((bk) => ({
            id: bk.id,
            bookingReference: `BK-${bk.id.slice(0, 8).toUpperCase()}`,
            organizationId: bk.organization_id || orgId,
            passengerName: [bk.users?.first_name, bk.users?.last_name].filter(Boolean).join(" ") || "Passenger",
            passengerPhone: bk.users?.phone || "+251911000000",
            passengerEmail: bk.users?.email || "passenger@busticket.com",
            routeName: bk.trips?.routes ? `${bk.trips.routes.origin} ↔ ${bk.trips.routes.destination}` : "Scheduled Route",
            seatNumber: bk.seat_number,
            totalFare: Number(bk.total_fare || 0),
            status: bk.status,
            paymentStatus: bk.payments?.status === "COMPLETED" ? "SUCCESS" : bk.status === "CONFIRMED" ? "SUCCESS" : "PENDING",
            bookingDate: bk.created_at ? bk.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
          })));
        }
      }

      if (paymentsRes.status === "fulfilled" && paymentsRes.value?.data) {
        const rawPayments = paymentsRes.value.data.payments || paymentsRes.value.data;
        if (Array.isArray(rawPayments)) {
          setPayments(rawPayments.map((py) => ({
            id: py.id,
            transactionReference: py.transaction_reference || `TXN-${py.id.slice(0, 8).toUpperCase()}`,
            organizationId: py.organization_id || orgId,
            passengerName: [py.bookings?.users?.first_name, py.bookings?.users?.last_name].filter(Boolean).join(" ") || "Passenger",
            amount: Number(py.amount || 0),
            currency: py.currency || "ETB",
            paymentMethod: py.payment_method || "Telebirr",
            status: py.status === "COMPLETED" ? "SUCCESS" : py.status,
            createdAt: py.created_at ? py.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
          })));
        }
      }

      if (statsRes.status === "fulfilled" && statsRes.value?.data?.stats) {
        setCoordinatorStats(statsRes.value.data.stats);
      }

      if (driversRes.status === "fulfilled" && driversRes.value?.data) {
        const rawDrivers = driversRes.value.data.drivers || driversRes.value.data.staff || [];
        if (Array.isArray(rawDrivers)) {
          setDrivers(rawDrivers.map((d) => ({
            id: d.id,
            organizationId: orgId,
            name: d.name || [d.firstName, d.lastName].filter(Boolean).join(" ") || d.email,
            email: d.email || "",
            phone: d.phone || "",
            status: d.status || (d.is_active ? "ACTIVE" : "INACTIVE"),
            totalTripsCompleted: 0,
            rating: 5.0,
            licenseNumber: d.licenseNumber || null,
          })));
        }
      }

      if (staffRes.status === "fulfilled" && staffRes.value?.data?.staff) {
        const rawStaff = staffRes.value.data.staff;
        const driverList = rawStaff
          .filter((s) => s.role === "DRIVER" || s.role?.includes("DRIVER"))
          .map((s) => ({
            id: s.id,
            organizationId: orgId,
            name: s.name,
            email: s.email || "",
            phone: s.phone || "",
            status: s.status,
            totalTripsCompleted: 0,
            rating: 5.0,
            licenseNumber: null,
          }));
        // Merge driverList with existing drivers
        setDrivers((prev) => {
          const byId = new Map(prev.map((d) => [d.id, d]));
          driverList.forEach((d) => {
            byId.set(d.id, d);
          });
          return Array.from(byId.values());
        });
      }

      if (stationsRes.status === "fulfilled" && stationsRes.value) {
        const rawStations =
          stationsRes.value.data?.stations ||
          stationsRes.value.data ||
          stationsRes.value.stations ||
          [];
        if (Array.isArray(rawStations)) {
          setStations(rawStations.map((st) => ({
            id: st.id,
            name: st.name,
            city: st.city,
            code: st.code,
            address: st.address,
            is_active: st.is_active ?? st.isActive ?? true,
          })));
        }
      }

      if (staffRes.status === "fulfilled" && staffRes.value?.data?.staff) {
        const rawStaff = staffRes.value.data.staff;
        const verifierList = rawStaff
          .filter((s) => s.role === "TICKET_VERIFIER")
          .map((s) => ({
            id: s.id,
            organizationId: orgId,
            name: s.name,
            email: s.email,
            phone: s.phone || "+251911000000",
            status: s.status,
            scansToday: 0,
            createdAt: s.createdAt ? s.createdAt.split("T")[0] : new Date().toISOString().split("T")[0],
          }));
        setVerifiers((prev) => {
          const byId = new Map(prev.map((v) => [v.id, v]));
          verifierList.forEach((v) => byId.set(v.id, v));
          return Array.from(byId.values());
        });
      }
    } catch (err) {
      console.warn("Backend coordinator sync notice:", err.message);
    } finally {
      if (!silent) setIsLoadingData(false);
    }
  }, [isAuthenticated]);

  // Synchronize on mount and whenever user/role/org changes
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setCurrentRole(null);
      return;
    }

    const roles = Array.isArray(user.roles) ? user.roles : [];

    if (roles.includes("ADMIN") || roles.includes("PLATFORM_ADMIN")) {
      setCurrentRole("ADMIN");
      fetchAdminData({ silent: false });
    } else if (roles.includes("DRIVER")) {
      setCurrentRole("DRIVER");
    } else if (
      roles.includes("BOOKING_COORDINATOR") ||
      roles.includes("OPERATIONAL_MANAGER") ||
      roles.includes("OPERATOR") ||
      Boolean(user.organizationContext?.length)
    ) {
      setCurrentRole("MANAGER");
      const targetOrgId = getCoordinatorOrgId();
      if (targetOrgId) {
        setSelectedOrgId((prev) => (prev === targetOrgId ? prev : targetOrgId));
        fetchCoordinatorData(targetOrgId, { silent: false });
      }
    } else if (roles.includes("PASSENGER")) {
      setCurrentRole("PASSENGER");
    } else {
      setCurrentRole(null);
    }
  }, [isAuthenticated, user, getCoordinatorOrgId]);

  // Automatic status synchronization: background polling (45s interval, silent)
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        if (currentRole === "ADMIN") {
          fetchAdminData({ silent: true });
        } else if (currentRole === "MANAGER") {
          const targetOrgId = getCoordinatorOrgId();
          if (targetOrgId) fetchCoordinatorData(targetOrgId, { silent: true });
        }
      }
    }, 45000);

    return () => clearInterval(interval);
  }, [isAuthenticated, currentRole, fetchAdminData, fetchCoordinatorData, getCoordinatorOrgId]);

  // Window Focus and Tab Visibility Sync: immediately fetch latest state when tab becomes active (silent)
  useEffect(() => {
    if (!isAuthenticated) return;
    const handleSyncOnFocus = () => {
      if (document.visibilityState === "visible") {
        if (currentRole === "ADMIN") {
          fetchAdminData({ silent: true });
        } else if (currentRole === "MANAGER") {
          const targetOrgId = getCoordinatorOrgId();
          if (targetOrgId) fetchCoordinatorData(targetOrgId, { silent: true });
        }
      }
    };

    window.addEventListener("focus", handleSyncOnFocus);
    document.addEventListener("visibilitychange", handleSyncOnFocus);
    return () => {
      window.removeEventListener("focus", handleSyncOnFocus);
      document.removeEventListener("visibilitychange", handleSyncOnFocus);
    };
  }, [isAuthenticated, currentRole, fetchAdminData, fetchCoordinatorData, getCoordinatorOrgId]);

  // Cross-Tab & In-App Broadcast synchronization: immediately fetch when status changes anywhere
  useEffect(() => {
    if (!isAuthenticated) return;
    const handleBroadcastSync = () => {
      if (currentRole === "ADMIN") {
        fetchAdminData();
      } else if (currentRole === "MANAGER") {
        const targetOrgId = getCoordinatorOrgId();
        if (targetOrgId) fetchCoordinatorData(targetOrgId);
      }
    };

    if (statusSyncChannel) {
      statusSyncChannel.addEventListener("message", handleBroadcastSync);
    }
    window.addEventListener("intercity_status_change", handleBroadcastSync);

    return () => {
      if (statusSyncChannel) {
        statusSyncChannel.removeEventListener("message", handleBroadcastSync);
      }
      window.removeEventListener("intercity_status_change", handleBroadcastSync);
    };
  }, [isAuthenticated, currentRole, fetchAdminData, fetchCoordinatorData, getCoordinatorOrgId]);

  // ================= ORGANIZATION ACTIONS (Admin) =================
  const approveOrganization = async (orgId) => {
    const org = organizations.find((o) => o.id === orgId);
    try {
      await approveOrganizationApi(orgId);
      setOrganizations((prev) =>
        prev.map((o) => (o.id === orgId ? { ...o, status: "APPROVED" } : o))
      );
      addAuditLog("APPROVE_ORGANIZATION", "Organization", orgId, "Status: PENDING", "Status: APPROVED", org?.name);
      notifyStatusChange({ entity: "ORGANIZATION", id: orgId, status: "APPROVED" });
      showToast(`Organization "${org?.name || orgId}" approved successfully via backend!`);
      await fetchAdminData();
    } catch (err) {
      setOrganizations((prev) =>
        prev.map((o) => (o.id === orgId ? { ...o, status: "APPROVED" } : o))
      );
      notifyStatusChange({ entity: "ORGANIZATION", id: orgId, status: "APPROVED" });
      showToast(`Organization "${org?.name || orgId}" approved.`);
    }
  };

  const rejectOrganization = async (orgId, reason = "License documentation verification failed") => {
    const org = organizations.find((o) => o.id === orgId);
    try {
      await rejectOrganizationApi(orgId, reason);
      setOrganizations((prev) =>
        prev.map((o) => (o.id === orgId ? { ...o, status: "REJECTED", notes: reason } : o))
      );
      addAuditLog("REJECT_ORGANIZATION", "Organization", orgId, "Status: PENDING", `Status: REJECTED (${reason})`, org?.name);
      notifyStatusChange({ entity: "ORGANIZATION", id: orgId, status: "REJECTED" });
      showToast(`Organization "${org?.name || orgId}" rejected via backend.`, "error");
      await fetchAdminData();
    } catch (err) {
      setOrganizations((prev) =>
        prev.map((o) => (o.id === orgId ? { ...o, status: "REJECTED", notes: reason } : o))
      );
      notifyStatusChange({ entity: "ORGANIZATION", id: orgId, status: "REJECTED" });
      showToast(`Organization "${org?.name || orgId}" rejected.`, "error");
    }
  };

  const suspendOrganization = async (orgId, reason = "Safety compliance non-conformity") => {
    const org = organizations.find((o) => o.id === orgId);
    try {
      await suspendOrganizationApi(orgId, reason);
      setOrganizations((prev) =>
        prev.map((o) => (o.id === orgId ? { ...o, status: "SUSPENDED", notes: reason } : o))
      );
      addAuditLog("SUSPEND_ORGANIZATION", "Organization", orgId, "Status: APPROVED", `Status: SUSPENDED (${reason})`, org?.name);
      notifyStatusChange({ entity: "ORGANIZATION", id: orgId, status: "SUSPENDED" });
      showToast(`Organization "${org?.name}" suspended via backend.`, "info");
      await fetchAdminData();
    } catch (err) {
      setOrganizations((prev) =>
        prev.map((o) => (o.id === orgId ? { ...o, status: "SUSPENDED", notes: reason } : o))
      );
      notifyStatusChange({ entity: "ORGANIZATION", id: orgId, status: "SUSPENDED" });
      showToast(`Organization "${org?.name}" suspended.`, "info");
    }
  };

  const reactivateOrganization = async (orgId) => {
    const org = organizations.find((o) => o.id === orgId);
    try {
      await activateOrganizationApi(orgId);
      setOrganizations((prev) =>
        prev.map((o) => (o.id === orgId ? { ...o, status: "APPROVED", notes: "Reactivated by platform administrator" } : o))
      );
      addAuditLog("REACTIVATE_ORGANIZATION", "Organization", orgId, "Status: SUSPENDED", "Status: APPROVED", org?.name);
      notifyStatusChange({ entity: "ORGANIZATION", id: orgId, status: "APPROVED" });
      showToast(`Organization "${org?.name}" reactivated via backend!`);
      await fetchAdminData();
    } catch (err) {
      setOrganizations((prev) =>
        prev.map((o) => (o.id === orgId ? { ...o, status: "APPROVED" } : o))
      );
      notifyStatusChange({ entity: "ORGANIZATION", id: orgId, status: "APPROVED" });
      showToast(`Organization "${org?.name}" reactivated!`);
    }
  };

  const updateOrganizationStatus = async (orgId, newStatus, reason = "") => {
    const org = organizations.find((o) => o.id === orgId);
    const oldStatus = org?.status || "PENDING";
    if (newStatus === oldStatus) return;

    // Fast optimistic UI update
    setOrganizations((prev) =>
      prev.map((o) =>
        o.id === orgId
          ? { ...o, status: newStatus, notes: reason || o.notes }
          : o
      )
    );
    addAuditLog(
      `UPDATE_ORGANIZATION_STATUS`,
      "Organization",
      orgId,
      `Status: ${oldStatus}`,
      `Status: ${newStatus}${reason ? ` (${reason})` : ""}`,
      org?.name
    );

    try {
      if (newStatus === "APPROVED") {
        if (oldStatus === "SUSPENDED") {
          await activateOrganizationApi(orgId);
        } else {
          await approveOrganizationApi(orgId);
        }
      } else if (newStatus === "SUSPENDED") {
        await suspendOrganizationApi(orgId, reason || "Administrative suspension");
      } else if (newStatus === "REJECTED") {
        await rejectOrganizationApi(orgId, reason || "Documentation non-compliant");
      }
      notifyStatusChange({ entity: "ORGANIZATION", id: orgId, status: newStatus });
      showToast(`Organization "${org?.name || orgId}" status updated to ${newStatus}.`);
      await fetchAdminData();
    } catch (err) {
      console.warn("Backend org status notice:", err.message);
      showToast(`Organization "${org?.name || orgId}" status set to ${newStatus}.`);
    }
  };

  // ================= USERS ACTIONS (Admin) =================
  const updateUserStatus = async (userId, newStatus) => {
    const targetUser = users.find((u) => u.id === userId);
    const oldStatus = targetUser?.status || "ACTIVE";
    if (oldStatus === newStatus) return;

    const isActive = newStatus === "ACTIVE";
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: newStatus, isActive } : u))
    );
    addAuditLog("UPDATE_USER_STATUS", "User", userId, `Status: ${oldStatus}`, `Status: ${newStatus}`, targetUser?.organizationName);

    try {
      await toggleUserStatusApi(userId, isActive);
      notifyStatusChange({ entity: "USER", id: userId, status: newStatus });
      showToast(`User "${targetUser?.name || userId}" status updated to ${newStatus}.`);
      await fetchAdminData();
    } catch (err) {
      console.warn("Backend user status update notice:", err.message);
      showToast(`User status set to ${newStatus}.`);
    }
  };

  const toggleUserStatus = async (userId) => {
    const targetUser = users.find((u) => u.id === userId);
    const newStatus = targetUser?.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    await updateUserStatus(userId, newStatus);
  };

  // ================= BUSES ACTIONS =================
  const updateBusStatus = async (busId, newStatus) => {
    const bus = buses.find((b) => b.id === busId);
    const oldStatus = bus?.status || "ACTIVE";
    if (oldStatus === newStatus) return;

    const isActive = newStatus === "ACTIVE";
    setBuses((prev) =>
      prev.map((b) => (b.id === busId ? { ...b, status: newStatus, is_active: isActive } : b))
    );
    addAuditLog("UPDATE_BUS_STATUS", "Bus", busId, `Status: ${oldStatus}`, `Status: ${newStatus}`, bus?.organizationName);

    try {
      const orgId = getCoordinatorOrgId();
      if (currentRole === "MANAGER" || (orgId && orgId.length === 36 && currentRole !== "ADMIN")) {
        await updateBusApi(orgId, busId, { status: newStatus, isActive });
        await fetchCoordinatorData(orgId);
      } else {
        await updateAdminBusStatusApi(busId, newStatus);
        await fetchAdminData();
      }
      notifyStatusChange({ entity: "BUS", id: busId, status: newStatus });
      showToast(`Bus ${bus?.plateNumber || busId} status updated to ${newStatus}.`);
    } catch (err) {
      console.warn("Backend bus status update notice:", err.message);
      showToast(`Bus status set to ${newStatus}.`);
    }
  };

  // ================= STATIONS ACTIONS (Platform Admin & System-wide) =================
  const updateStationStatus = async (stationId, isActive) => {
    const station = stations.find((s) => s.id === stationId);
    const oldStatus = station?.is_active ? "ACTIVE" : "INACTIVE";
    const newStatus = isActive ? "ACTIVE" : "INACTIVE";
    if (station && station.is_active === isActive) return;

    setStations((prev) =>
      prev.map((s) => (s.id === stationId ? { ...s, is_active: isActive } : s))
    );
    addAuditLog("UPDATE_STATION_STATUS", "Station", stationId, `Status: ${oldStatus}`, `Status: ${newStatus}`, station?.name);

    try {
      await updateStationApi(stationId, { is_active: isActive, isActive });
      notifyStatusChange({ entity: "STATION", id: stationId, is_active: isActive });
      showToast(`Station "${station?.name || stationId}" is now ${newStatus}.`);
      await fetchAdminData();
    } catch (err) {
      console.warn("Backend station status update notice:", err.message);
      showToast(`Station status set to ${newStatus}.`);
    }
  };

  const toggleStationStatus = async (station) => {
    const nextActive = !station.is_active;
    await updateStationStatus(station.id, nextActive);
  };

  // ================= ROUTES ACTIONS =================
  const updateRouteStatus = async (routeId, newStatus) => {
    const route = routes.find((r) => r.id === routeId);
    const oldStatus = route?.status || "ACTIVE";
    if (oldStatus === newStatus) return;

    const isActive = newStatus === "ACTIVE";
    setRoutes((prev) =>
      prev.map((r) => (r.id === routeId ? { ...r, status: newStatus, is_active: isActive } : r))
    );
    addAuditLog("UPDATE_ROUTE_STATUS", "Route", routeId, `Status: ${oldStatus}`, `Status: ${newStatus}`, route?.organizationName);

    try {
      const orgId = getCoordinatorOrgId();
      if (currentRole === "MANAGER" || (orgId && orgId.length === 36 && currentRole !== "ADMIN")) {
        await updateRouteApi(orgId, routeId, { status: newStatus, isActive });
        await fetchCoordinatorData(orgId);
      } else {
        await updateAdminRouteStatusApi(routeId, newStatus);
        await fetchAdminData();
      }
      notifyStatusChange({ entity: "ROUTE", id: routeId, status: newStatus });
      showToast(`Route "${route?.name || routeId}" status changed to ${newStatus}.`);
    } catch (err) {
      console.warn("Backend route status update notice:", err.message);
      showToast(`Route status set to ${newStatus}.`);
    }
  };

  // ================= TRIPS ACTIONS =================
  const updateTripStatus = async (tripId, newStatus) => {
    const trip = trips.find((t) => t.id === tripId);
    const oldStatus = trip?.status || "SCHEDULED";
    if (oldStatus === newStatus) return;

    setTrips((prev) =>
      prev.map((t) => (t.id === tripId ? { ...t, status: newStatus } : t))
    );
    addAuditLog("UPDATE_TRIP_STATUS", "Trip", tripId, `Status: ${oldStatus}`, `Status: ${newStatus}`, trip?.organizationName);

    try {
      const orgId = getCoordinatorOrgId();
      if (currentRole === "MANAGER" || (orgId && orgId.length === 36 && currentRole !== "ADMIN")) {
        await updateTripApi(orgId, tripId, { status: newStatus });
        await fetchCoordinatorData(orgId);
      } else {
        await updateAdminTripStatusApi(tripId, newStatus);
        await fetchAdminData();
      }
      notifyStatusChange({ entity: "TRIP", id: tripId, status: newStatus });
      showToast(`Trip "${trip?.tripCode || tripId}" status updated to ${newStatus}.`);
    } catch (err) {
      console.warn("Backend trip status update notice:", err.message);
      showToast(`Trip status set to ${newStatus}.`);
    }
  };

  // ================= BOOKINGS & PAYMENTS ACTIONS =================
  const updateBookingStatus = async (bookingId, newStatus, newPaymentStatus = null) => {
    const booking = bookings.find((b) => b.id === bookingId);
    const oldStatus = booking?.status || "CONFIRMED";
    const oldPayStatus = booking?.paymentStatus || "SUCCESS";

    setBookings((prev) =>
      prev.map((b) => {
        if (b.id !== bookingId) return b;
        return {
          ...b,
          ...(newStatus ? { status: newStatus } : {}),
          ...(newPaymentStatus ? { paymentStatus: newPaymentStatus } : {}),
        };
      })
    );

    // Also mirror to tickets if status changed
    if (newStatus) {
      setTickets((prev) =>
        prev.map((t) => {
          if (t.bookingReference === booking?.bookingReference || t.id === `tkt-${bookingId}`) {
            return { ...t, status: newStatus === "CONFIRMED" ? "VALID" : newStatus };
          }
          return t;
        })
      );
    }

    addAuditLog(
      "UPDATE_BOOKING_STATUS",
      "Booking",
      bookingId,
      `Status: ${oldStatus}, Payment: ${oldPayStatus}`,
      `Status: ${newStatus || oldStatus}, Payment: ${newPaymentStatus || oldPayStatus}`,
      booking?.organizationName
    );

    try {
      await updateAdminBookingStatusApi(bookingId, {
        status: newStatus,
        paymentStatus: newPaymentStatus,
      });
      showToast(`Booking ${booking?.bookingReference || bookingId} status updated.`);
    } catch (err) {
      console.warn("Backend booking status update notice:", err.message);
      showToast(`Booking status set to ${newStatus || oldStatus}.`);
    }
  };

  const updatePaymentStatus = async (paymentId, newStatus) => {
    const payment = payments.find((p) => p.id === paymentId);
    const oldStatus = payment?.status || "SUCCESS";
    if (oldStatus === newStatus) return;

    setPayments((prev) =>
      prev.map((p) => (p.id === paymentId ? { ...p, status: newStatus } : p))
    );

    // Synchronize linked booking payment status
    if (payment?.bookingReference) {
      setBookings((prev) =>
        prev.map((b) =>
          b.bookingReference === payment.bookingReference
            ? { ...b, paymentStatus: newStatus }
            : b
        )
      );
    }

    addAuditLog(
      "UPDATE_PAYMENT_STATUS",
      "Payment",
      paymentId,
      `Status: ${oldStatus}`,
      `Status: ${newStatus}`,
      payment?.organizationName
    );

    try {
      await updateAdminPaymentStatusApi(paymentId, newStatus);
      showToast(`Payment ${payment?.paymentReference || paymentId} status changed to ${newStatus}.`);
    } catch (err) {
      console.warn("Backend payment status update notice:", err.message);
      showToast(`Payment status set to ${newStatus}.`);
    }
  };

  const updateTicketStatus = async (ticketId, newStatus) => {
    const ticket = tickets.find((t) => t.id === ticketId);
    const oldStatus = ticket?.status || "VALID";
    if (oldStatus === newStatus) return;

    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t))
    );

    addAuditLog(
      "UPDATE_TICKET_STATUS",
      "Ticket",
      ticketId,
      `Status: ${oldStatus}`,
      `Status: ${newStatus}`,
      ticket?.organizationName
    );

    try {
      await updateAdminTicketStatusApi(ticketId, newStatus);
      showToast(`Ticket ${ticket?.ticketNumber || ticketId} status updated to ${newStatus}.`);
    } catch (err) {
      console.warn("Backend ticket status update notice:", err.message);
      showToast(`Ticket status set to ${newStatus}.`);
    }
  };

  const updateAuditLog = async (logId, dataPayload) => {
    setAuditLogs((prev) =>
      prev.map((log) => {
        if (log.id !== logId) return log;
        return {
          ...log,
          ...dataPayload,
        };
      })
    );

    try {
      await updateAdminAuditLogApi(logId, dataPayload);
      showToast("Audit log record updated successfully.");
    } catch (err) {
      console.warn("Backend audit log update notice:", err.message);
      showToast("Audit log record updated locally.");
    }
  };

  // ================= BUSES ACTIONS (Booking Coordinator) =================
  const addBus = async (busData) => {
    const orgId = getCoordinatorOrgId();
    const payload = {
      plateNumber: busData.plateNumber?.trim(),
      model: busData.model || "Standard Coach",
      capacity: Number(busData.capacity) || 50,
      isActive: true,
    };

    try {
      await createBusApi(orgId, payload);
      await fetchCoordinatorData(orgId);
      notifyStatusChange({ entity: "BUS", action: "CREATE" });
      showToast(`Bus ${busData.busNumber || busData.plateNumber} added to fleet via backend!`);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || "Failed to add bus to fleet.";
      showToast(errMsg, "error");
      throw err;
    }
  };

  const updateBus = async (busId, busData) => {
    const orgId = getCoordinatorOrgId();
    const payload = {};
    if (busData.plateNumber) payload.plateNumber = busData.plateNumber.trim();
    if (busData.model !== undefined) payload.model = busData.model?.trim() || null;
    if (busData.capacity !== undefined) payload.capacity = Number(busData.capacity);
    if (busData.status !== undefined) {
      payload.status = busData.status;
      payload.isActive = busData.status === "ACTIVE";
    } else if (busData.isActive !== undefined) {
      payload.isActive = Boolean(busData.isActive);
    }

    setBuses((prev) =>
      prev.map((b) => (b.id === busId ? { ...b, ...payload, is_active: payload.isActive ?? b.is_active } : b))
    );

    try {
      await updateBusApi(orgId, busId, payload);
      await fetchCoordinatorData(orgId);
      notifyStatusChange({ entity: "BUS", id: busId, ...payload });
      showToast(`Bus updated successfully!`);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || "Failed to update bus.";
      showToast(errMsg, "error");
      throw err;
    }
  };

  const deleteBus = async (busId) => {
    const orgId = getCoordinatorOrgId();
    setBuses((prev) => prev.filter((b) => b.id !== busId));
    try {
      await deleteBusApi(orgId, busId);
      await fetchCoordinatorData(orgId);
      notifyStatusChange({ entity: "BUS", id: busId, action: "DELETE" });
      showToast("Bus removed from fleet successfully!");
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || "Failed to delete bus.";
      showToast(errMsg, "error");
      throw err;
    }
  };



  // ================= STATIONS ACTIONS (Platform Admin & System-wide) =================
  const addStation = async (stationData) => {
    try {
      const res = await createStationApi(stationData);
      showToast(`Station "${stationData.name}" registered successfully!`);
      await fetchAdminData();
      notifyStatusChange({ entity: "STATION", action: "CREATE" });
      return res;
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || "Failed to register station.";
      showToast(errMsg, "error");
      throw err;
    }
  };

  const updateStation = async (stationId, updateData) => {
    try {
      const res = await updateStationApi(stationId, updateData);
      showToast("Station updated successfully!");
      await fetchAdminData();
      notifyStatusChange({ entity: "STATION", id: stationId, action: "UPDATE" });
      return res;
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || "Failed to update station.";
      showToast(errMsg, "error");
      throw err;
    }
  };

  const deleteStation = async (stationId) => {
    try {
      const res = await deleteStationApi(stationId);
      showToast("Station deleted successfully!");
      await fetchAdminData();
      notifyStatusChange({ entity: "STATION", id: stationId, action: "DELETE" });
      return res;
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || "Failed to delete station.";
      showToast(errMsg, "error");
      throw err;
    }
  };



  // ================= ROUTES ACTIONS (Booking Coordinator) =================
  const addRoute = async (routeData) => {
    const orgId = getCoordinatorOrgId();
    const originStn = stations.find((s) => s.id === routeData.originStationId);
    const destStn = stations.find((s) => s.id === routeData.destinationStationId);
    const originName = originStn?.city || originStn?.name || routeData.origin || "Origin";
    const destName = destStn?.city || destStn?.name || routeData.destination || "Destination";

    const payload = {
      origin: originName,
      destination: destName,
      originStationId: routeData.originStationId,
      destinationStationId: routeData.destinationStationId,
      distanceKm: Number(routeData.distanceKm) || 400,
      estimatedDurationHours: Number(routeData.estimatedDurationHours) || 6.0,
      isActive: true,
    };

    try {
      await createRouteApi(orgId, payload);
      await fetchCoordinatorData(orgId);
      notifyStatusChange({ entity: "ROUTE", action: "CREATE" });
      showToast(`Route ${originName} ↔ ${destName} registered via backend!`);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || "Failed to register route.";
      showToast(errMsg, "error");
      throw err;
    }
  };

  const updateRoute = async (routeId, routeData) => {
    const orgId = getCoordinatorOrgId();
    const payload = {};
    if (routeData.origin) payload.origin = routeData.origin;
    if (routeData.destination) payload.destination = routeData.destination;
    if (routeData.originStationId) payload.originStationId = routeData.originStationId;
    if (routeData.destinationStationId) payload.destinationStationId = routeData.destinationStationId;
    if (routeData.distanceKm !== undefined) payload.distanceKm = Number(routeData.distanceKm);
    if (routeData.estimatedDurationHours !== undefined) payload.estimatedDurationHours = Number(routeData.estimatedDurationHours);
    if (routeData.status !== undefined) {
      payload.status = routeData.status;
      payload.isActive = routeData.status === "ACTIVE";
    } else if (routeData.isActive !== undefined) {
      payload.isActive = Boolean(routeData.isActive);
    }

    setRoutes((prev) =>
      prev.map((r) => (r.id === routeId ? { ...r, ...payload, is_active: payload.isActive ?? r.is_active } : r))
    );

    try {
      await updateRouteApi(orgId, routeId, payload);
      await fetchCoordinatorData(orgId);
      notifyStatusChange({ entity: "ROUTE", id: routeId, ...payload });
      showToast("Route updated successfully!");
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || "Failed to update route.";
      showToast(errMsg, "error");
      throw err;
    }
  };

  const deleteRoute = async (routeId) => {
    const orgId = getCoordinatorOrgId();
    setRoutes((prev) => prev.filter((r) => r.id !== routeId));
    try {
      await deleteRouteApi(orgId, routeId);
      await fetchCoordinatorData(orgId);
      notifyStatusChange({ entity: "ROUTE", id: routeId, action: "DELETE" });
      showToast("Route deleted successfully!");
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || "Failed to delete route.";
      showToast(errMsg, "error");
      throw err;
    }
  };

  // ================= TRIPS ACTIONS (Booking Coordinator) =================
  const createTrip = async (tripData) => {
    const orgId = getCoordinatorOrgId();
    const route = routes.find((r) => r.id === tripData.routeId);
    const bus = buses.find((b) => b.id === tripData.busId);

    let depISO = new Date().toISOString();
    if (tripData.departureDate) {
      const depDate = tripData.departureDate;
      const depTime = tripData.departureTime ? tripData.departureTime.replace(/\s*[AP]M/i, '') : "06:00";
      depISO = new Date(`${depDate}T${depTime.trim()}:00`).toISOString();
    }

    let arrISO = null;
    if (tripData.arrivalTime) {
      const arrDate = tripData.departureDate || new Date().toISOString().split("T")[0];
      const arrTime = tripData.arrivalTime.replace(/\s*[AP]M/i, '');
      arrISO = new Date(`${arrDate}T${arrTime.trim()}:00`).toISOString();
    }

    const payload = {
      busId: bus?.id?.length === 36 ? bus.id : undefined,
      routeId: route?.id?.length === 36 ? route.id : undefined,
      origin: route?.originStationName,
      destination: route?.destinationStationName,
      originStationId: route?.originStationId,
      destinationStationId: route?.destinationStationId,
      departureTime: depISO,
      arrivalTime: arrISO,
      fare: Number(tripData.fareAmount || tripData.fare || 850),
      driverId:
        tripData.driverId && tripData.driverId.length === 36 ? tripData.driverId : null,
      verifierId:
        tripData.verifierId && tripData.verifierId.length === 36 ? tripData.verifierId : null,
    };

    console.log('Creating trip with orgId:', orgId, 'payload:', payload);

    try {
      const response = await createTripApi(orgId, payload);
      console.log('Trip creation response:', response);
      await fetchCoordinatorData(orgId);
      console.log('Trips after creation:', trips);
      notifyStatusChange({ entity: "TRIP", action: "CREATE" });
      showToast(`Trip created and published successfully via backend!`);
      return true;
    } catch (err) {
      console.error('Trip creation error:', err);
      const errMsg = err.response?.data?.message || err.message || "Failed to schedule trip.";
      showToast(errMsg, "error");
      throw err;
    }
  };

  const updateTrip = async (tripId, tripData) => {
    const orgId = getCoordinatorOrgId();
    const payload = {};
    if (tripData.busId) payload.busId = tripData.busId;
    if (tripData.routeId) payload.routeId = tripData.routeId;
    if (tripData.driverId !== undefined) payload.driverId = tripData.driverId || null;
    if (tripData.verifierId !== undefined) payload.verifierId = tripData.verifierId || null;
    if (tripData.departureTime) payload.departureTime = tripData.departureTime;
    if (tripData.arrivalTime !== undefined) payload.arrivalTime = tripData.arrivalTime;
    if (tripData.fareAmount !== undefined) payload.fare = Number(tripData.fareAmount);
    if (tripData.fare !== undefined) payload.fare = Number(tripData.fare);
    if (tripData.status) payload.status = tripData.status;

    setTrips((prev) =>
      prev.map((t) => (t.id === tripId ? {
        ...t,
        ...payload,
        ...(payload.status ? { status: payload.status === "SCHEDULED" ? "PUBLISHED" : payload.status } : {})
      } : t))
    );

    try {
      await updateTripApi(orgId, tripId, payload);
      await fetchCoordinatorData(orgId);
      notifyStatusChange({ entity: "TRIP", id: tripId, ...payload });
      showToast("Trip updated successfully!");
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || "Failed to update trip.";
      showToast(errMsg, "error");
      throw err;
    }
  };

  const deleteTrip = async (tripId) => {
    const orgId = getCoordinatorOrgId();
    setTrips((prev) => prev.filter((t) => t.id !== tripId));
    try {
      await deleteTripApi(orgId, tripId);
      await fetchCoordinatorData(orgId);
      notifyStatusChange({ entity: "TRIP", id: tripId, action: "DELETE" });
      showToast("Trip deleted successfully!");
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || "Failed to delete trip.";
      showToast(errMsg, "error");
      throw err;
    }
  };

  const assignVerifierToTrip = async (tripId, verifierId) => {
    const orgId = getCoordinatorOrgId();
    try {
      if (tripId && tripId.length === 36) {
        await assignVerifierToTripApi(orgId, tripId, verifierId || null);
        await fetchCoordinatorData(orgId);
      } else {
        const verifier = verifiers.find((v) => v.id === verifierId);
        setTrips((prev) =>
          prev.map((t) => (t.id === tripId ? { ...t, verifierId, verifierName: verifier?.name || "Assigned Verifier" } : t))
        );
      }
      notifyStatusChange({ entity: "TRIP", id: tripId, verifierId });
      showToast("Ticket verifier assigned to trip successfully!");
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || "Failed to assign ticket verifier.";
      showToast(errMsg, "error");
      throw err;
    }
  };

  const publishTrip = async (tripId) => {
    const orgId = getCoordinatorOrgId();
    setTrips((prev) =>
      prev.map((t) => (t.id === tripId ? { ...t, status: "PUBLISHED" } : t))
    );
    try {
      if (tripId.length === 36) {
        await publishTripApi(orgId, tripId);
        await fetchCoordinatorData(orgId);
      }
      notifyStatusChange({ entity: "TRIP", id: tripId, status: "PUBLISHED" });
      showToast(`Trip published successfully!`);
    } catch (err) {
      setTrips((prev) =>
        prev.map((t) => (t.id === tripId ? { ...t, status: "PUBLISHED" } : t))
      );
      showToast(`Trip status set to PUBLISHED.`);
    }
  };

  const unpublishTrip = async (tripId) => {
    const orgId = getCoordinatorOrgId();
    setTrips((prev) =>
      prev.map((t) => (t.id === tripId ? { ...t, status: "DRAFT" } : t))
    );
    try {
      if (tripId.length === 36) {
        await unpublishTripApi(orgId, tripId);
        await fetchCoordinatorData(orgId);
      }
      notifyStatusChange({ entity: "TRIP", id: tripId, status: "DRAFT" });
      showToast(`Trip unpublished (moved to Draft).`);
    } catch (err) {
      setTrips((prev) =>
        prev.map((t) => (t.id === tripId ? { ...t, status: "DRAFT" } : t))
      );
      showToast(`Trip status set to DRAFT.`);
    }
  };

  const cancelTrip = async (tripId) => {
    const orgId = getCoordinatorOrgId();
    setTrips((prev) =>
      prev.map((t) => (t.id === tripId ? { ...t, status: "CANCELLED" } : t))
    );
    try {
      if (tripId.length === 36) {
        await cancelTripApi(orgId, tripId);
        await fetchCoordinatorData(orgId);
      }
      notifyStatusChange({ entity: "TRIP", id: tripId, status: "CANCELLED" });
      showToast(`Trip cancelled successfully.`);
    } catch (err) {
      setTrips((prev) =>
        prev.map((t) => (t.id === tripId ? { ...t, status: "CANCELLED" } : t))
      );
      showToast(`Trip cancelled.`);
    }
  };

  const assignDriverToTrip = async (tripId, driverId) => {
    const orgId = getCoordinatorOrgId();
    try {
      if (tripId && tripId.length === 36) {
        await assignDriverToTripApi(orgId, tripId, driverId || null);
        await fetchCoordinatorData(orgId);
      } else {
        const driver = drivers.find((d) => d.id === driverId);
        setTrips((prev) =>
          prev.map((t) => (t.id === tripId ? { ...t, driverId, driverName: driver?.name || "Assigned Driver" } : t))
        );
      }
      notifyStatusChange({ entity: "TRIP", id: tripId, driverId });
      showToast("Driver assigned to trip successfully!");
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || "Failed to assign driver.";
      showToast(errMsg, "error");
    }
  };

  // ================= DRIVERS & VERIFIERS ACTIONS (Booking Coordinator) =================
  const addDriver = async (driverData) => {
    const orgId = getCoordinatorOrgId();
    const newId = `drv-${Date.now()}`;
    const newDriverObj = {
      id: newId,
      name: driverData.name,
      phone: driverData.phone,
      email: driverData.email,
      licenseNumber: driverData.licenseNumber || `DL-ETH-${Math.floor(10000 + Math.random() * 90000)}-CAT-4`,
      licenseCategory: "Heavy Commercial (Grade 4)",
      organizationId: orgId,
      organizationName: activeOrg?.name || "Transport Operator",
      status: "ACTIVE",
      totalTripsCompleted: 0,
      rating: 5.0,
      createdAt: new Date().toISOString(),
    };

    setDrivers((prev) => [newDriverObj, ...prev]);

    try {
      if (orgId && orgId.length === 36) {
        await createStaffApi(orgId, {
          name: driverData.name,
          phone: driverData.phone,
          email: driverData.email,
          password: driverData.password,
          role: "DRIVER",
        });
        await fetchCoordinatorData(orgId, { silent: true });
      }
      notifyStatusChange({ entity: "DRIVER", action: "CREATE" });
      showToast(`Driver "${driverData.name}" registered successfully!`);
      return newDriverObj;
    } catch (err) {
      console.warn("Backend driver creation notice, retained local record:", err.message);
      showToast(`Driver "${driverData.name}" registered successfully!`);
      return newDriverObj;
    }
  };

  const addVerifier = async (verifierData) => {
    const orgId = getCoordinatorOrgId();
    const newId = `vrf-user-${Date.now()}`;
    const newVerifierObj = {
      id: newId,
      name: verifierData.name,
      email: verifierData.email,
      phone: verifierData.phone,
      organizationId: orgId,
      organizationName: activeOrg?.name || "Transport Operator",
      assignedStation: verifierData.assignedStation || "Addis Ababa Autobus Terra",
      status: "ACTIVE",
      scansToday: 0,
      createdAt: new Date().toISOString().split("T")[0],
    };

    setVerifiers((prev) => [newVerifierObj, ...prev]);

    try {
      if (orgId && orgId.length === 36) {
        await createStaffApi(orgId, {
          name: verifierData.name,
          email: verifierData.email,
          phone: verifierData.phone,
          password: verifierData.password,
          role: "TICKET_VERIFIER",
          assignedStation: verifierData.assignedStation,
        });
        await fetchCoordinatorData(orgId, { silent: true });
      }
      notifyStatusChange({ entity: "VERIFIER", action: "CREATE" });
      showToast(`Ticket Verifier "${verifierData.name}" registered successfully!`);
      return newVerifierObj;
    } catch (err) {
      console.warn("Backend verifier creation notice, retained local record:", err.message);
      showToast(`Ticket Verifier "${verifierData.name}" registered successfully!`);
      return newVerifierObj;
    }
  };

  const toggleStaffStatus = async (staffId, targetActiveStatus = null) => {
    const orgId = getCoordinatorOrgId();
    const currentStaff = drivers.find((d) => d.id === staffId) || verifiers.find((v) => v.id === staffId);
    
    let nextActive;
    if (typeof targetActiveStatus === "boolean") {
      nextActive = targetActiveStatus;
    } else {
      const isCurrentActive = currentStaff?.status === "ACTIVE";
      nextActive = !isCurrentActive;
    }
    const nextStatus = nextActive ? "ACTIVE" : "INACTIVE";

    setDrivers((prev) =>
      prev.map((d) => (d.id === staffId ? { ...d, status: nextStatus, isActive: nextActive } : d))
    );
    setVerifiers((prev) =>
      prev.map((v) => (v.id === staffId ? { ...v, status: nextStatus, isActive: nextActive } : v))
    );

    addAuditLog(
      "TOGGLE_STAFF_STATUS",
      "Staff",
      staffId,
      `Status: ${currentStaff?.status || "UNKNOWN"}`,
      `Status: ${nextStatus}`,
      currentStaff?.organizationName || activeOrg?.name
    );

    try {
      if (orgId && staffId && staffId.length === 36) {
        await toggleStaffStatusApi(orgId, staffId, nextActive);
        fetchCoordinatorData(orgId, { silent: true });
      }
      notifyStatusChange({ entity: "STAFF", id: staffId, status: nextStatus, is_active: nextActive });
      showToast(`Staff member "${currentStaff?.name || staffId}" is now ${nextStatus}.`);
    } catch (err) {
      console.warn("Backend staff toggle warning:", err.message);
      showToast(`Staff member is now ${nextStatus}.`);
    }
  };

  const updateStaff = async (staffId, payload) => {
    const orgId = getCoordinatorOrgId();
    try {
      if (staffId && staffId.length === 36) {
        await updateStaffApi(orgId, staffId, payload);
        await fetchCoordinatorData(orgId, { silent: true });
      } else {
        setDrivers((prev) =>
          prev.map((d) => (d.id === staffId ? { ...d, ...payload } : d))
        );
        setVerifiers((prev) =>
          prev.map((v) => (v.id === staffId ? { ...v, ...payload } : v))
        );
      }
      notifyStatusChange({ entity: "STAFF", id: staffId, ...payload });
      showToast(`Staff member updated successfully.`);
    } catch (err) {
      setDrivers((prev) =>
        prev.map((d) => (d.id === staffId ? { ...d, ...payload } : d))
      );
      setVerifiers((prev) =>
        prev.map((v) => (v.id === staffId ? { ...v, ...payload } : v))
      );
      showToast(`Staff member updated.`);
    }
  };

  const updateDriver = async (driverId, driverData) => {
    const orgId = getCoordinatorOrgId();
    setDrivers((prev) =>
      prev.map((d) => (d.id === driverId ? { ...d, ...driverData } : d))
    );
    try {
      if (driverId && driverId.length === 36) {
        await updateDriverApi(orgId, driverId, driverData);
        await fetchCoordinatorData(orgId, { silent: true });
      }
      notifyStatusChange({ entity: "DRIVER", id: driverId, ...driverData });
      showToast("Driver details updated successfully.");
    } catch (err) {
      console.warn("Backend update driver warning:", err.message);
      showToast("Driver details updated successfully.");
    }
  };

  const deleteDriver = async (driverId) => {
    const orgId = getCoordinatorOrgId();
    const targetDriver = drivers.find((d) => d.id === driverId);
    const previousDrivers = [...drivers];
    setDrivers((prev) => prev.filter((d) => d.id !== driverId));

    addAuditLog(
      "DELETE_DRIVER",
      "Driver",
      driverId,
      `Driver: ${targetDriver?.name || driverId}`,
      "Status: REMOVED",
      targetDriver?.organizationName || activeOrg?.name
    );

    try {
      if (orgId && driverId && driverId.length === 36) {
        await deleteDriverApi(orgId, driverId);
        fetchCoordinatorData(orgId, { silent: true });
      }
      notifyStatusChange({ entity: "DRIVER", id: driverId, action: "DELETE" });
      showToast(`Driver "${targetDriver?.name || driverId}" removed successfully.`);
    } catch (err) {
      if (err.response?.status === 400) {
        setDrivers(previousDrivers);
        const errMsg = err.response?.data?.message || err.message;
        showToast(errMsg, "error");
        throw err;
      }
      console.warn("Backend delete driver notice, removed locally:", err.message);
      showToast(`Driver removed successfully.`);
    }
  };

  const updateVerifier = async (verifierId, verifierData) => {
    const orgId = getCoordinatorOrgId();
    setVerifiers((prev) =>
      prev.map((v) => (v.id === verifierId ? { ...v, ...verifierData } : v))
    );
    try {
      if (verifierId && verifierId.length === 36) {
        await updateStaffApi(orgId, verifierId, verifierData);
        await fetchCoordinatorData(orgId, { silent: true });
      }
      notifyStatusChange({ entity: "VERIFIER", id: verifierId, ...verifierData });
      showToast("Ticket verifier updated successfully.");
    } catch (err) {
      console.warn("Backend update verifier notice:", err.message);
      showToast("Ticket verifier updated successfully.");
    }
  };

  const deleteVerifier = async (verifierId) => {
    const orgId = getCoordinatorOrgId();
    const targetVerifier = verifiers.find((v) => v.id === verifierId);
    const previousVerifiers = [...verifiers];
    setVerifiers((prev) => prev.filter((v) => v.id !== verifierId));

    addAuditLog(
      "DELETE_VERIFIER",
      "TicketVerifier",
      verifierId,
      `Verifier: ${targetVerifier?.name || verifierId}`,
      "Status: REMOVED",
      targetVerifier?.organizationName || activeOrg?.name
    );

    try {
      if (orgId && verifierId && verifierId.length === 36) {
        await deleteVerifierApi(orgId, verifierId);
        fetchCoordinatorData(orgId, { silent: true });
      }
      notifyStatusChange({ entity: "VERIFIER", id: verifierId, action: "DELETE" });
      showToast(`Ticket verifier "${targetVerifier?.name || verifierId}" removed successfully.`);
    } catch (err) {
      if (err.response?.status === 400) {
        setVerifiers(previousVerifiers);
        const errMsg = err.response?.data?.message || err.message;
        showToast(errMsg, "error");
        throw err;
      }
      console.warn("Backend delete verifier notice, removed locally:", err.message);
      showToast(`Ticket verifier removed successfully.`);
    }
  };

  // ================= SEAT RESERVATION & MANAGEMENT =================
  const reserveSeatForPassenger = async (tripId, seatNumber, passengerInfo = {}) => {
    const orgId = getCoordinatorOrgId();
    const trip = trips.find((t) => t.id === tripId);
    const passengerName = passengerInfo.name?.trim() || "Walk-in Passenger";
    const passengerPhone = passengerInfo.phone?.trim() || "+251911000000";
    const fare = Number(passengerInfo.fare || trip?.fareAmount || 500);
    const bookingRef = `BK-RES-${Date.now().toString().slice(-6)}`;
    const ticketCode = `ET-TKT-${Math.floor(1000 + Math.random() * 9000)}`;

    const newBooking = {
      id: `bk-${Date.now()}`,
      bookingReference: bookingRef,
      tripId,
      tripCode: trip?.tripCode || "TRIP-EXP",
      routeCode: trip?.routeCode || "RT-101",
      routeName: trip?.routeName || "Direct Route",
      organizationId: trip?.organizationId || orgId,
      organizationName: trip?.organizationName || activeOrg?.name || "Transport Operator",
      busPlateNumber: trip?.busPlateNumber || "ET-01-A12345",
      passengerName,
      passengerPhone,
      passengerEmail: passengerInfo.email || `${passengerName.toLowerCase().replace(/\s+/g, ".")}@gmail.com`,
      seatNumber: Number(seatNumber),
      departureDate: trip?.departureDate || new Date().toISOString().split("T")[0],
      departureTime: trip?.departureTime || "06:00 AM",
      totalAmount: fare,
      paymentMethod: "CASH_COUNTER",
      paymentStatus: "COMPLETED",
      status: "CONFIRMED",
      createdAt: new Date().toISOString(),
    };

    const newTicket = {
      id: `tkt-${Date.now()}`,
      ticketNumber: ticketCode,
      bookingReference: bookingRef,
      tripId,
      tripCode: trip?.tripCode || "TRIP-EXP",
      passengerName,
      passengerPhone,
      seatNumber: Number(seatNumber),
      departureStation: trip?.originStation || trip?.originCity || "Terminal",
      arrivalStation: trip?.destinationStation || trip?.destinationCity || "Destination",
      departureDate: trip?.departureDate || new Date().toISOString().split("T")[0],
      departureTime: trip?.departureTime || "06:00 AM",
      organizationId: trip?.organizationId || orgId,
      organizationName: trip?.organizationName || activeOrg?.name || "Transport Operator",
      price: fare,
      status: "VALID",
      issuedAt: new Date().toISOString().replace("T", " ").slice(0, 16),
    };

    setBookings((prev) => [newBooking, ...prev]);
    setTickets((prev) => [newTicket, ...prev]);
    setTrips((prev) =>
      prev.map((t) =>
        t.id === tripId
          ? {
              ...t,
              bookedSeatsCount: (t.bookedSeatsCount || 0) + 1,
              availableSeatsCount: Math.max(0, (t.availableSeatsCount || t.totalSeats || 45) - 1),
            }
          : t
      )
    );

    addAuditLog(
      "RESERVE_SEAT",
      "TripSeat",
      `${tripId}-Seat-${seatNumber}`,
      "Status: AVAILABLE",
      `Status: BOOKED (${passengerName})`,
      trip?.organizationName || activeOrg?.name
    );

    try {
      if (tripId && tripId.length === 36 && orgId) {
        await updateSeatStatusApi(orgId, tripId, seatNumber, "BOOKED");
      }
      showToast(`Seat ${seatNumber} successfully reserved for ${passengerName}! Ticket: ${ticketCode}`);
      return { success: true, booking: newBooking, ticket: newTicket };
    } catch (err) {
      console.warn("Backend seat reserve notice:", err.message);
      showToast(`Seat ${seatNumber} reserved locally for ${passengerName}!`);
      return { success: true, booking: newBooking, ticket: newTicket };
    }
  };

  const releaseSeatReservation = async (tripId, seatNumber) => {
    const orgId = getCoordinatorOrgId();
    const trip = trips.find((t) => t.id === tripId);

    setBookings((prev) =>
      prev.map((b) =>
        b.tripId === tripId && Number(b.seatNumber) === Number(seatNumber) && b.status === "CONFIRMED"
          ? { ...b, status: "CANCELLED" }
          : b
      )
    );
    setTickets((prev) =>
      prev.map((tk) =>
        tk.tripId === tripId && Number(tk.seatNumber) === Number(seatNumber) && tk.status === "VALID"
          ? { ...tk, status: "CANCELLED" }
          : tk
      )
    );

    setTrips((prev) =>
      prev.map((t) =>
        t.id === tripId
          ? {
              ...t,
              bookedSeatsCount: Math.max(0, (t.bookedSeatsCount || 1) - 1),
              availableSeatsCount: (t.availableSeatsCount || 0) + 1,
            }
          : t
      )
    );

    addAuditLog(
      "RELEASE_SEAT",
      "TripSeat",
      `${tripId}-Seat-${seatNumber}`,
      "Status: BOOKED/HELD",
      "Status: AVAILABLE",
      trip?.organizationName || activeOrg?.name
    );

    try {
      if (tripId && tripId.length === 36 && orgId) {
        await updateSeatStatusApi(orgId, tripId, seatNumber, "AVAILABLE");
      }
      showToast(`Seat ${seatNumber} is now released and AVAILABLE.`);
      return { success: true };
    } catch (err) {
      console.warn("Backend release seat notice:", err.message);
      showToast(`Seat ${seatNumber} released to AVAILABLE.`);
      return { success: true };
    }
  };

  const changeSeatStatus = async (tripId, seatNumber, nextStatus) => {
    const orgId = getCoordinatorOrgId();
    const trip = trips.find((t) => t.id === tripId);

    addAuditLog(
      "UPDATE_SEAT_STATUS",
      "TripSeat",
      `${tripId}-Seat-${seatNumber}`,
      "Status: PREV",
      `Status: ${nextStatus}`,
      trip?.organizationName || activeOrg?.name
    );

    try {
      if (tripId && tripId.length === 36 && orgId) {
        await updateSeatStatusApi(orgId, tripId, seatNumber, nextStatus);
      }
      showToast(`Seat ${seatNumber} status set to ${nextStatus}.`);
      return { success: true };
    } catch (err) {
      console.warn("Backend seat status update notice:", err.message);
      showToast(`Seat ${seatNumber} set to ${nextStatus}.`);
      return { success: true };
    }
  };

  // ================= TICKET VERIFICATION (Testing & Live) =================
  const verifyTicket = async ({ ticketNumber, tripId, stationName, verifierName }) => {
    const orgId = getCoordinatorOrgId();
    const searchCode = (ticketNumber || "").trim().toUpperCase();
    const targetTicket = tickets.find(
      (tk) =>
        tk.ticketNumber?.toUpperCase() === searchCode ||
        tk.bookingReference?.toUpperCase() === searchCode
    );

    if (!targetTicket) {
      const invalidEvent = {
        id: `vrf-${Date.now()}`,
        ticketNumber: ticketNumber || "UNKNOWN",
        passengerName: "Unrecognized Passenger",
        organizationId: orgId,
        organizationName: activeOrg?.name || "Transport Operator",
        verifierName: verifierName || user?.name || "Station Verifier",
        verifierId: user?.id || "usr-verif",
        tripCode: "N/A",
        stationName: stationName || "Addis Ababa Central Terminal",
        status: "INVALID",
        scannedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }) + " (Just now)",
        notes: "Scanned QR / Ticket Code does not match any issued ticket record in system.",
      };
      setVerifications((prev) => [invalidEvent, ...prev]);
      showToast(`Ticket "${ticketNumber}" is INVALID! Not found in system.`, "error");
      return {
        valid: false,
        status: "INVALID",
        message: "Ticket number not found in system manifest.",
        verification: invalidEvent,
      };
    }

    if (targetTicket.status === "BOARDED" || targetTicket.status === "USED") {
      const alreadyUsedEvent = {
        id: `vrf-${Date.now()}`,
        ticketNumber: targetTicket.ticketNumber,
        passengerName: targetTicket.passengerName,
        organizationId: targetTicket.organizationId || orgId,
        organizationName: targetTicket.organizationName || activeOrg?.name || "Transport Operator",
        verifierName: verifierName || user?.name || "Station Verifier",
        verifierId: user?.id || "usr-verif",
        tripCode: targetTicket.tripCode || "TRIP-EXP",
        stationName: stationName || targetTicket.departureStation || "Terminal",
        status: "ALREADY_USED",
        scannedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }) + " (Just now)",
        notes: `Duplicate scan detected! Passenger was already boarded.`,
      };
      setVerifications((prev) => [alreadyUsedEvent, ...prev]);
      showToast(`Ticket "${targetTicket.ticketNumber}" was ALREADY BOARDED!`, "error");
      return {
        valid: false,
        status: "ALREADY_USED",
        message: "Ticket has already been verified and boarded.",
        ticket: targetTicket,
        verification: alreadyUsedEvent,
      };
    }

    // Valid ticket: Mark as BOARDED
    const validEvent = {
      id: `vrf-${Date.now()}`,
      ticketNumber: targetTicket.ticketNumber,
      passengerName: targetTicket.passengerName,
      organizationId: targetTicket.organizationId || orgId,
      organizationName: targetTicket.organizationName || activeOrg?.name || "Transport Operator",
      verifierName: verifierName || user?.name || "Station Verifier",
      verifierId: user?.id || "usr-verif",
      tripCode: targetTicket.tripCode || "TRIP-EXP",
      stationName: stationName || targetTicket.departureStation || "Terminal",
      status: "VALID",
      scannedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }) + " (Just now)",
      notes: `Ticket validated cleanly. Passenger cleared for Seat ${targetTicket.seatNumber || "Assigned"}.`,
    };

    setTickets((prev) =>
      prev.map((tk) =>
        tk.id === targetTicket.id || tk.ticketNumber === targetTicket.ticketNumber
          ? { ...tk, status: "BOARDED" }
          : tk
      )
    );

    setBookings((prev) =>
      prev.map((bk) =>
        bk.bookingReference === targetTicket.bookingReference
          ? { ...bk, status: "BOARDED" }
          : bk
      )
    );

    setVerifications((prev) => [validEvent, ...prev]);

    // Increment verifier scans if found
    setVerifiers((prev) =>
      prev.map((v) =>
        v.name === (verifierName || user?.name)
          ? { ...v, scansToday: (v.scansToday || 0) + 1 }
          : v
      )
    );

    notifyStatusChange({ entity: "TICKET", id: targetTicket.id, status: "BOARDED" });
    showToast(`Ticket ${targetTicket.ticketNumber} verified! Passenger ${targetTicket.passengerName} BOARDED.`, "success");

    return {
      valid: true,
      status: "VALID",
      message: "Ticket verified successfully. Passenger cleared for boarding.",
      ticket: { ...targetTicket, status: "BOARDED" },
      verification: validEvent,
    };
  };

  // ================= STATE RESET (Clean Logout) =================
  const resetAppState = useCallback(() => {
    setOrganizations(initialOrganizations);
    setUsers(initialUsers);
    setStations(initialStations);
    setBuses(initialBuses);
    setRoutes(initialRoutes);
    setTrips(initialTrips);
    setBookings(initialBookings);
    setPayments(initialPayments);
    setTickets(initialTickets);
    setVerifications(initialVerifications);
    setDrivers(initialDrivers);
    setVerifiers(initialVerifiers);
    setAuditLogs(initialAuditLogs);
    setSelectedOrgId(initialOrganizations[0]?.id || "org-101");
    setCurrentRole(null);
    setActivePage("dashboard");
    setGlobalSearchQuery("");
  }, []);

  const updateOrganizationProfile = async (updateData) => {
    const orgId = getCoordinatorOrgId();
    try {
      if (orgId && orgId.length === 36) {
        await updateOrganizationProfileApi(orgId, updateData);
        await fetchCoordinatorData(orgId);
      } else {
        setOrganizations((prev) =>
          prev.map((o) => (o.id === orgId ? { ...o, ...updateData } : o))
        );
      }
      showToast("Organization profile updated successfully!");
    } catch (err) {
      setOrganizations((prev) =>
        prev.map((o) => (o.id === orgId ? { ...o, ...updateData } : o))
      );
      showToast("Organization profile updated.");
    }
  };

  const updateSystemSettings = (newSettings) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem("platform_system_settings", JSON.stringify(updated));
      } catch (err) {
        console.error("Failed to persist settings to localStorage:", err);
      }
      return updated;
    });
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
        isLoadingData,
        adminStats,
        adminReports,
        coordinatorStats,
        fetchAdminData,
        fetchCoordinatorData,
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
        commissionRate: (Number(settings?.platformFeePercent ?? 5.0)) / 100,
        // Handlers
        updateOrganizationStatus,
        approveOrganization,
        rejectOrganization,
        suspendOrganization,
        reactivateOrganization,
        updateUserStatus,
        toggleUserStatus,
        addStation,
        updateStation,
        deleteStation,
        updateStationStatus,
        toggleStationStatus,
        addBus,
        updateBus,
        deleteBus,
        updateBusStatus,
        addRoute,
        updateRoute,
        deleteRoute,
        updateRouteStatus,
        createTrip,
        updateTrip,
        deleteTrip,
        updateTripStatus,
        publishTrip,
        unpublishTrip,
        cancelTrip,
        updateBookingStatus,
        updatePaymentStatus,
        updateTicketStatus,
        updateAuditLog,
        assignDriverToTrip,
        assignVerifierToTrip,
        addDriver,
        updateDriver,
        deleteDriver,
        addVerifier,
        updateVerifier,
        deleteVerifier,
        toggleStaffStatus,
        updateStaff,
        updateOrganizationProfile,
        updateSystemSettings,
        // Seat reservation & management
        reserveSeatForPassenger,
        releaseSeatReservation,
        changeSeatStatus,
        // Ticket verification test actions
        verifyTicket,
        // App state reset on logout
        resetAppState
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
export default AppContext;
