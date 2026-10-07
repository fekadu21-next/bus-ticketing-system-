import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
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
} from "../api/admin.api";
import {
  getBusesApi,
  createBusApi,
  updateBusApi,
  getRoutesApi,
  createRouteApi,
  getTripsApi,
  createTripApi,
  cancelTripApi,
  publishTripApi,
  unpublishTripApi,
  getBookingsApi,
  getPaymentsApi,
  getOperationalStatsApi,
  getStaffApi,
  createStaffApi,
  toggleStaffStatusApi,
  updateStaffApi,
  getOrganizationDetailsApi,
  updateOrganizationProfileApi,
} from "../api/coordinator.api";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  // Role & Scope Guard State
  const [currentRole, setCurrentRole] = useState("ADMIN"); // 'ADMIN' or 'MANAGER' (Booking Coordinator)
  const [selectedOrgId, setSelectedOrgId] = useState("00000000-0000-0000-0000-000000000001");
  const [activePage, setActivePage] = useState("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [toast, setToast] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

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
  const fetchAdminData = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setIsLoadingData(true);
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
        getAdminDashboardStatsApi(),
        getAdminOrganizationsApi({ limit: 100 }),
        getUsersApi({ limit: 100 }),
        getAdminBusesApi({ limit: 100 }),
        getAdminRoutesApi({ limit: 100 }),
        getAdminTripsApi({ limit: 100 }),
        getAdminBookingsApi({ limit: 100 }),
        getAdminPaymentsApi({ limit: 100 }),
        getAdminAuditLogsApi({ limit: 100 }),
        getAdminReportsApi(),
        getAdminStationsApi(),
      ]);

      if (statsRes.status === "fulfilled" && statsRes.value?.data) {
        setAdminStats(statsRes.value.data);
      }

      if (reportsRes.status === "fulfilled" && reportsRes.value?.data) {
        setAdminReports(reportsRes.value.data);
      }

      if (stationsRes.status === "fulfilled" && stationsRes.value?.data) {
        const rawStations = stationsRes.value.data.stations || stationsRes.value.data;
        if (Array.isArray(rawStations) && rawStations.length > 0) {
          setStations(rawStations.map((st) => ({
            id: st.id,
            name: st.name,
            city: st.city || st.name.replace(/ Central.*| Intercity.*/, ""),
            code: st.code || `${(st.city || st.name).substring(0, 3).toUpperCase()}-01`,
            address: st.address || `Terminal, ${st.city || st.name}, Ethiopia`,
            activeRoutesCount: st.activeRoutesCount || 1,
            status: st.status || "ACTIVE",
            createdAt: st.createdAt || "2024-01-01",
          })));
        }
      }

      if (orgsRes.status === "fulfilled" && orgsRes.value?.data) {
        const rawOrgs = orgsRes.value.data.organizations || orgsRes.value.data;
        if (Array.isArray(rawOrgs) && rawOrgs.length > 0) {
          const mappedOrgs = rawOrgs.map((o) => ({
            id: o.id,
            name: o.name,
            type: o.type || "Intercity Bus Operator",
            status: o.status || "APPROVED",
            isActive: o.is_active ?? true,
            createdAt: o.created_at ? o.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
            registrationNumber: `REG-${o.id.substring(0, 8).toUpperCase()}`,
            contactName: "Operations Lead",
            phone: "+251 911 000000",
            email: `contact@${o.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.et`,
            address: "Addis Ababa, Ethiopia",
            totalBuses: o.buses?.length || 0,
            activeTrips: o.trips?.length || 0,
            notes: o.status === "PENDING" ? "Awaiting review and commercial operator license validation." : "Verified transport provider."
          }));
          setOrganizations(mappedOrgs);
        }
      }

      if (usersRes.status === "fulfilled" && usersRes.value?.data) {
        const rawUsers = usersRes.value.data.users || usersRes.value.data;
        if (Array.isArray(rawUsers) && rawUsers.length > 0) {
          const mappedUsers = rawUsers.map((u) => {
            const roleName = u.user_roles?.[0]?.roles?.name || (u.roles && u.roles[0]) || "PASSENGER";
            const orgName = u.user_roles?.[0]?.organizations?.name || "—";
            return {
              id: u.id,
              name: [u.first_name, u.last_name].filter(Boolean).join(" ") || u.name || u.email,
              email: u.email,
              phone: u.phone || "—",
              role: roleName,
              organizationName: orgName,
              status: u.is_active ? "ACTIVE" : "SUSPENDED",
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
            status: b.is_active ? "ACTIVE" : "MAINTENANCE",
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
            name: `${r.origin} ↔ ${r.destination}`,
            originStationName: r.origin,
            destinationStationName: r.destination,
            distanceKm: r.distance_km || 400,
            estimatedDuration: r.estimated_duration_hours ? `${r.estimated_duration_hours}h` : "5h 30m",
            status: r.is_active ? "ACTIVE" : "INACTIVE",
            assignedOrganizationsCount: 1,
          })));
        }
      }

      if (tripsRes.status === "fulfilled" && tripsRes.value?.data) {
        const rawTrips = tripsRes.value.data.trips || tripsRes.value.data;
        if (Array.isArray(rawTrips)) {
          setTrips(rawTrips.map((t) => ({
            id: t.id,
            tripCode: `TRP-${t.id.slice(0, 6).toUpperCase()}`,
            organizationId: t.organization_id,
            organizationName: t.organizations?.name || "Operator",
            routeName: t.routes ? `${t.routes.origin} ↔ ${t.routes.destination}` : "Route",
            originStation: t.routes?.origin || "Origin",
            destinationStation: t.routes?.destination || "Destination",
            busPlateNumber: t.buses?.plate_number || "ET-BUS",
            driverName: "Scheduled Driver",
            bookedSeatsCount: t._count?.bookings || 0,
            availableSeatsCount: Math.max(0, (t._count?.seats || t.buses?.capacity || 50) - (t._count?.bookings || 0)),
            totalSeats: t._count?.seats || t.buses?.capacity || 50,
            departureTime: new Date(t.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            departureDate: new Date(t.departure_time).toISOString().split("T")[0],
            status: t.status === "SCHEDULED" ? "PUBLISHED" : t.status,
            fareAmount: Number(t.fare || 0),
          })));
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
      setIsLoadingData(false);
    }
  }, [isAuthenticated]);

  // ================= BOOKING COORDINATOR DATA FETCHING =================
  const fetchCoordinatorData = useCallback(async (orgId) => {
    if (!isAuthenticated || !orgId) return;
    try {
      setIsLoadingData(true);
      const [
        busesRes,
        routesRes,
        tripsRes,
        bookingsRes,
        paymentsRes,
        statsRes,
        staffRes,
        orgDetailsRes,
      ] = await Promise.allSettled([
        getBusesApi(orgId),
        getRoutesApi(orgId),
        getTripsApi(orgId),
        getBookingsApi(orgId),
        getPaymentsApi(orgId),
        getOperationalStatsApi(orgId),
        getStaffApi(orgId),
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
        if (Array.isArray(rawBuses) && rawBuses.length > 0) {
          const mappedBuses = rawBuses.map((b) => ({
            id: b.id,
            organizationId: b.organization_id || orgId,
            busNumber: b.plate_number || b.busNumber || `BUS-${b.id.slice(0, 4)}`,
            plateNumber: b.plate_number || b.plateNumber || "ET-3-00000",
            model: b.model || "Standard Coach",
            capacity: b.capacity || 50,
            status: b.is_active ? "ACTIVE" : "MAINTENANCE",
            manufactureYear: "2023",
            lastMaintenance: b.updated_at ? b.updated_at.split("T")[0] : new Date().toISOString().split("T")[0],
          }));
          setBuses((prev) => {
            const others = prev.filter((item) => item.organizationId !== orgId);
            return [...mappedBuses, ...others];
          });
        }
      }

      if (routesRes.status === "fulfilled" && routesRes.value?.data) {
        const rawRoutes = routesRes.value.data.routes || routesRes.value.data;
        if (Array.isArray(rawRoutes) && rawRoutes.length > 0) {
          const mappedRoutes = rawRoutes.map((r) => ({
            id: r.id,
            organizationId: r.organization_id || orgId,
            name: `${r.origin} ↔ ${r.destination}`,
            originStationName: r.origin,
            destinationStationName: r.destination,
            distanceKm: r.distance_km || 400,
            estimatedDuration: r.estimated_duration_hours ? `${r.estimated_duration_hours}h` : "5h 30m",
            status: r.is_active ? "ACTIVE" : "INACTIVE",
            assignedOrganizationsCount: 1,
          }));
          setRoutes((prev) => {
            const others = prev.filter((item) => item.organizationId !== orgId);
            return [...mappedRoutes, ...others];
          });
        }
      }

      if (tripsRes.status === "fulfilled" && tripsRes.value?.data) {
        const rawTrips = tripsRes.value.data.trips || tripsRes.value.data;
        if (Array.isArray(rawTrips) && rawTrips.length > 0) {
          const mappedTrips = rawTrips.map((t) => ({
            id: t.id,
            tripCode: `TRP-${t.id.slice(0, 6).toUpperCase()}`,
            organizationId: t.organization_id || orgId,
            organizationName: activeOrg?.name || "Assigned Company",
            routeName: t.routes ? `${t.routes.origin} ↔ ${t.routes.destination}` : "Route",
            originStation: t.routes?.origin || "Origin",
            destinationStation: t.routes?.destination || "Destination",
            busPlateNumber: t.buses?.plate_number || "ET-BUS",
            driverName: "Scheduled Driver",
            bookedSeatsCount: t._count?.bookings || 0,
            availableSeatsCount: Math.max(0, (t._count?.seats || t.buses?.capacity || 50) - (t._count?.bookings || 0)),
            totalSeats: t._count?.seats || t.buses?.capacity || 50,
            departureTime: new Date(t.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            departureDate: new Date(t.departure_time).toISOString().split("T")[0],
            status: t.status === "SCHEDULED" ? "PUBLISHED" : t.status,
            fareAmount: Number(t.fare || 0),
          }));
          setTrips((prev) => {
            const others = prev.filter((item) => item.organizationId !== orgId);
            return [...mappedTrips, ...others];
          });
        }
      }

      if (bookingsRes.status === "fulfilled" && bookingsRes.value?.data) {
        const rawBookings = bookingsRes.value.data.bookings || bookingsRes.value.data;
        if (Array.isArray(rawBookings) && rawBookings.length > 0) {
          const mappedBookings = rawBookings.map((bk) => ({
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
          }));
          setBookings((prev) => {
            const others = prev.filter((item) => item.organizationId !== orgId);
            return [...mappedBookings, ...others];
          });
        }
      }

      if (paymentsRes.status === "fulfilled" && paymentsRes.value?.data) {
        const rawPayments = paymentsRes.value.data.payments || paymentsRes.value.data;
        if (Array.isArray(rawPayments) && rawPayments.length > 0) {
          const mappedPayments = rawPayments.map((py) => ({
            id: py.id,
            transactionReference: py.transaction_reference || `TXN-${py.id.slice(0, 8).toUpperCase()}`,
            organizationId: py.organization_id || orgId,
            passengerName: [py.bookings?.users?.first_name, py.bookings?.users?.last_name].filter(Boolean).join(" ") || "Passenger",
            amount: Number(py.amount || 0),
            currency: py.currency || "ETB",
            paymentMethod: py.payment_method || "Telebirr",
            status: py.status === "COMPLETED" ? "SUCCESS" : py.status,
            createdAt: py.created_at ? py.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
          }));
          setPayments((prev) => {
            const others = prev.filter((item) => item.organizationId !== orgId);
            return [...mappedPayments, ...others];
          });
        }
      }

      if (statsRes.status === "fulfilled" && statsRes.value?.data?.stats) {
        setCoordinatorStats(statsRes.value.data.stats);
      }

      if (staffRes.status === "fulfilled" && staffRes.value?.data?.staff) {
        const rawStaff = staffRes.value.data.staff;
        const driverList = rawStaff
          .filter((s) => s.role === "DRIVER" || s.role?.includes("DRIVER"))
          .map((s) => ({
            id: s.id,
            organizationId: orgId,
            name: s.name,
            phone: s.phone || "+251911000000",
            status: s.status,
            totalTripsCompleted: 12,
            rating: 4.9,
          }));
        setDrivers((prev) => {
          const others = prev.filter((d) => d.organizationId !== orgId);
          return [...driverList, ...others];
        });

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
          const others = prev.filter((v) => v.organizationId !== orgId);
          return [...verifierList, ...others];
        });
      }
    } catch (err) {
      console.warn("Backend coordinator sync notice:", err.message);
    } finally {
      setIsLoadingData(false);
    }
  }, [isAuthenticated, activeOrg]);

  // Synchronize on mount and whenever user/role/org changes
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    if (user.roles?.includes("ADMIN") || user.roles?.includes("PLATFORM_ADMIN")) {
      setCurrentRole("ADMIN");
      fetchAdminData();
    } else if (
      user.roles?.includes("BOOKING_COORDINATOR") ||
      user.roles?.includes("OPERATIONAL_MANAGER")
    ) {
      setCurrentRole("MANAGER");
      const targetOrgId = getCoordinatorOrgId();
      if (targetOrgId) {
        fetchCoordinatorData(targetOrgId);
      }
    }
  }, [isAuthenticated, user, selectedOrgId, fetchAdminData, fetchCoordinatorData, getCoordinatorOrgId]);

  // ================= ORGANIZATION ACTIONS (Admin) =================
  const approveOrganization = async (orgId) => {
    const org = organizations.find((o) => o.id === orgId);
    try {
      await approveOrganizationApi(orgId);
      setOrganizations((prev) =>
        prev.map((o) => (o.id === orgId ? { ...o, status: "APPROVED" } : o))
      );
      addAuditLog("APPROVE_ORGANIZATION", "Organization", orgId, "Status: PENDING", "Status: APPROVED", org?.name);
      showToast(`Organization "${org?.name || orgId}" approved successfully via backend!`);
      await fetchAdminData();
    } catch (err) {
      setOrganizations((prev) =>
        prev.map((o) => (o.id === orgId ? { ...o, status: "APPROVED" } : o))
      );
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
      showToast(`Organization "${org?.name || orgId}" rejected via backend.`, "error");
      await fetchAdminData();
    } catch (err) {
      setOrganizations((prev) =>
        prev.map((o) => (o.id === orgId ? { ...o, status: "REJECTED", notes: reason } : o))
      );
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
      showToast(`Organization "${org?.name}" suspended via backend.`, "info");
      await fetchAdminData();
    } catch (err) {
      setOrganizations((prev) =>
        prev.map((o) => (o.id === orgId ? { ...o, status: "SUSPENDED", notes: reason } : o))
      );
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
      showToast(`Organization "${org?.name}" reactivated via backend!`);
      await fetchAdminData();
    } catch (err) {
      setOrganizations((prev) =>
        prev.map((o) => (o.id === orgId ? { ...o, status: "APPROVED" } : o))
      );
      showToast(`Organization "${org?.name}" reactivated!`);
    }
  };

  // ================= USERS ACTIONS (Admin) =================
  const toggleUserStatus = async (userId) => {
    const targetUser = users.find((u) => u.id === userId);
    const newStatus = targetUser?.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    const isActive = newStatus === "ACTIVE";

    try {
      await toggleUserStatusApi(userId, isActive);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
      );
      addAuditLog("TOGGLE_USER_STATUS", "User", userId, `Status: ${targetUser?.status}`, `Status: ${newStatus}`);
      showToast(`User ${targetUser?.name} is now ${newStatus} (synced to backend).`);
      await fetchAdminData();
    } catch (err) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
      );
      showToast(`User ${targetUser?.name} status updated.`);
    }
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
      showToast(`Bus ${busData.busNumber || busData.plateNumber} added to fleet via backend!`);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || "Failed to add bus to fleet.";
      showToast(errMsg, "error");
      throw err;
    }
  };

  const updateBusStatus = async (busId, newStatus) => {
    const orgId = getCoordinatorOrgId();
    try {
      await updateBusApi(orgId, busId, { isActive: newStatus === "ACTIVE" });
      await fetchCoordinatorData(orgId);
      showToast(`Bus status updated to ${newStatus}.`);
    } catch (err) {
      if (err.response?.data?.message) {
        showToast(err.response.data.message, "error");
        throw err;
      }
      setBuses((prev) =>
        prev.map((b) => (b.id === busId ? { ...b, status: newStatus } : b))
      );
      showToast(`Bus status updated to ${newStatus}.`);
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
      distanceKm: Number(routeData.distanceKm) || 400,
      estimatedDurationHours: 6.0,
      isActive: true,
    };

    try {
      await createRouteApi(orgId, payload);
      await fetchCoordinatorData(orgId);
      showToast(`Route ${originName} ↔ ${destName} registered via backend!`);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || "Failed to register route.";
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

    const payload = {
      busId: bus?.id?.length === 36 ? bus.id : undefined,
      routeId: route?.id?.length === 36 ? route.id : undefined,
      origin: route?.originStationName || route?.origin,
      destination: route?.destinationStationName || route?.destination,
      departureTime: depISO,
      fare: Number(tripData.fareAmount || tripData.fare || 850),
    };

    try {
      await createTripApi(orgId, payload);
      await fetchCoordinatorData(orgId);
      showToast(`Trip created and published successfully via backend!`);
      return true;
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || "Failed to schedule trip.";
      showToast(errMsg, "error");
      throw err;
    }
  };

  const publishTrip = async (tripId) => {
    const orgId = getCoordinatorOrgId();
    try {
      if (tripId.length === 36) {
        await publishTripApi(orgId, tripId);
        await fetchCoordinatorData(orgId);
      } else {
        setTrips((prev) =>
          prev.map((t) => (t.id === tripId ? { ...t, status: "PUBLISHED" } : t))
        );
      }
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
    try {
      if (tripId.length === 36) {
        await unpublishTripApi(orgId, tripId);
        await fetchCoordinatorData(orgId);
      } else {
        setTrips((prev) =>
          prev.map((t) => (t.id === tripId ? { ...t, status: "DRAFT" } : t))
        );
      }
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
    try {
      if (tripId.length === 36) {
        await cancelTripApi(orgId, tripId);
        await fetchCoordinatorData(orgId);
      } else {
        setTrips((prev) =>
          prev.map((t) => (t.id === tripId ? { ...t, status: "CANCELLED" } : t))
        );
      }
      showToast(`Trip cancelled successfully.`);
    } catch (err) {
      setTrips((prev) =>
        prev.map((t) => (t.id === tripId ? { ...t, status: "CANCELLED" } : t))
      );
      showToast(`Trip cancelled.`);
    }
  };

  const assignDriverToTrip = (tripId, driverId) => {
    const driver = drivers.find((d) => d.id === driverId);
    if (!driver) return;
    setTrips((prev) =>
      prev.map((t) => (t.id === tripId ? { ...t, driverId: driver.id, driverName: driver.name } : t))
    );
    showToast(`Driver ${driver.name} assigned to trip.`);
  };

  // ================= DRIVERS & VERIFIERS ACTIONS (Booking Coordinator) =================
  const addDriver = async (driverData) => {
    const orgId = getCoordinatorOrgId();
    try {
      await createStaffApi(orgId, {
        name: driverData.name,
        phone: driverData.phone,
        role: "DRIVER",
      });
      await fetchCoordinatorData(orgId);
      showToast(`Driver ${driverData.name} registered via backend!`);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || "Failed to register driver.";
      showToast(errMsg, "error");
      throw err;
    }
  };

  const addVerifier = async (verifierData) => {
    const orgId = getCoordinatorOrgId();
    try {
      await createStaffApi(orgId, {
        name: verifierData.name,
        email: verifierData.email,
        phone: verifierData.phone,
        role: "TICKET_VERIFIER",
      });
      await fetchCoordinatorData(orgId);
      showToast(`Ticket Verifier ${verifierData.name} registered via backend!`);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || "Failed to register ticket verifier.";
      showToast(errMsg, "error");
      throw err;
    }
  };

  const toggleStaffStatus = async (staffId, isCurrentlyActive) => {
    const orgId = getCoordinatorOrgId();
    const nextActive = !isCurrentlyActive;
    try {
      if (staffId && staffId.length === 36) {
        await toggleStaffStatusApi(orgId, staffId, nextActive);
        await fetchCoordinatorData(orgId);
      } else {
        const nextStatus = nextActive ? "ACTIVE" : "INACTIVE";
        setDrivers((prev) =>
          prev.map((d) => (d.id === staffId ? { ...d, status: nextStatus } : d))
        );
        setVerifiers((prev) =>
          prev.map((v) => (v.id === staffId ? { ...v, status: nextStatus } : v))
        );
      }
      showToast(`Staff member is now ${nextActive ? "ACTIVE" : "INACTIVE"}.`);
    } catch (err) {
      const nextStatus = nextActive ? "ACTIVE" : "INACTIVE";
      setDrivers((prev) =>
        prev.map((d) => (d.id === staffId ? { ...d, status: nextStatus } : d))
      );
      setVerifiers((prev) =>
        prev.map((v) => (v.id === staffId ? { ...v, status: nextStatus } : v))
      );
      showToast(`Staff member status updated.`);
    }
  };

  const updateStaff = async (staffId, payload) => {
    const orgId = getCoordinatorOrgId();
    try {
      if (staffId && staffId.length === 36) {
        await updateStaffApi(orgId, staffId, payload);
        await fetchCoordinatorData(orgId);
      } else {
        setDrivers((prev) =>
          prev.map((d) => (d.id === staffId ? { ...d, ...payload } : d))
        );
        setVerifiers((prev) =>
          prev.map((v) => (v.id === staffId ? { ...v, ...payload } : v))
        );
      }
      showToast(`Staff member updated successfully.`);
    } catch (err) {
      showToast(`Failed to update staff member.`, "error");
    }
  };

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
    setSettings((prev) => ({ ...prev, ...newSettings }));
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
        // Handlers
        approveOrganization,
        rejectOrganization,
        suspendOrganization,
        reactivateOrganization,
        toggleUserStatus,
        addStation,
        updateStation,
        addBus,
        updateBusStatus,
        addRoute,
        createTrip,
        publishTrip,
        unpublishTrip,
        cancelTrip,
        assignDriverToTrip,
        addDriver,
        addVerifier,
        toggleStaffStatus,
        updateStaff,
        updateOrganizationProfile,
        updateSystemSettings
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
export default AppContext;
