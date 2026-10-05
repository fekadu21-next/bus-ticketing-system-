/**
 * useCoordinator — hook for BOOKING_COORDINATOR operations.
 * Fetches real backend data when orgId is available; falls back gracefully.
 */
import { useState, useEffect, useCallback } from 'react';
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
  cancelTripApi,
  getBookingsApi,
  getPaymentsApi,
  getDashboardReportApi,
} from '@/api/coordinator.api';

export function useCoordinator(orgId) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── Buses ──────────────────────────────────────────────────────────────────
  const [buses, setBuses] = useState([]);

  const fetchBuses = useCallback(async (params = {}) => {
    if (!orgId) return;
    try {
      setLoading(true);
      const res = await getBusesApi(orgId, params);
      setBuses(res.data?.buses || res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  const createBus = async (payload) => {
    const res = await createBusApi(orgId, payload);
    await fetchBuses();
    return res;
  };

  const updateBus = async (busId, payload) => {
    const res = await updateBusApi(orgId, busId, payload);
    await fetchBuses();
    return res;
  };

  const deleteBus = async (busId) => {
    const res = await deleteBusApi(orgId, busId);
    await fetchBuses();
    return res;
  };

  // ── Routes ─────────────────────────────────────────────────────────────────
  const [routes, setRoutes] = useState([]);

  const fetchRoutes = useCallback(async (params = {}) => {
    if (!orgId) return;
    try {
      setLoading(true);
      const res = await getRoutesApi(orgId, params);
      setRoutes(res.data?.routes || res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  const createRoute = async (payload) => {
    const res = await createRouteApi(orgId, payload);
    await fetchRoutes();
    return res;
  };

  const updateRoute = async (routeId, payload) => {
    const res = await updateRouteApi(orgId, routeId, payload);
    await fetchRoutes();
    return res;
  };

  const deleteRoute = async (routeId) => {
    const res = await deleteRouteApi(orgId, routeId);
    await fetchRoutes();
    return res;
  };

  // ── Trips ──────────────────────────────────────────────────────────────────
  const [trips, setTrips] = useState([]);

  const fetchTrips = useCallback(async (params = {}) => {
    if (!orgId) return;
    try {
      setLoading(true);
      const res = await getTripsApi(orgId, params);
      setTrips(res.data?.trips || res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  const createTrip = async (payload) => {
    const res = await createTripApi(orgId, payload);
    await fetchTrips();
    return res;
  };

  const updateTrip = async (tripId, payload) => {
    const res = await updateTripApi(orgId, tripId, payload);
    await fetchTrips();
    return res;
  };

  const cancelTrip = async (tripId) => {
    const res = await cancelTripApi(orgId, tripId);
    await fetchTrips();
    return res;
  };

  // ── Bookings ───────────────────────────────────────────────────────────────
  const [bookings, setBookings] = useState([]);

  const fetchBookings = useCallback(async (params = {}) => {
    if (!orgId) return;
    try {
      setLoading(true);
      const res = await getBookingsApi(orgId, params);
      setBookings(res.data?.bookings || res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  // ── Payments ───────────────────────────────────────────────────────────────
  const [payments, setPayments] = useState([]);

  const fetchPayments = useCallback(async (params = {}) => {
    if (!orgId) return;
    try {
      setLoading(true);
      const res = await getPaymentsApi(orgId, params);
      setPayments(res.data?.payments || res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  // ── Dashboard ──────────────────────────────────────────────────────────────
  const [dashboardStats, setDashboardStats] = useState(null);

  const fetchDashboard = useCallback(async () => {
    if (!orgId) return;
    try {
      const res = await getDashboardReportApi(orgId);
      setDashboardStats(res.data || null);
    } catch {
      // dashboard is non-critical — silently skip
    }
  }, [orgId]);

  // Auto-load on mount if orgId is set
  useEffect(() => {
    if (orgId) {
      fetchBuses();
      fetchRoutes();
      fetchTrips();
      fetchBookings();
      fetchPayments();
      fetchDashboard();
    }
  }, [orgId, fetchBuses, fetchRoutes, fetchTrips, fetchBookings, fetchPayments, fetchDashboard]);

  return {
    loading,
    error,
    // Buses
    buses,
    fetchBuses,
    createBus,
    updateBus,
    deleteBus,
    // Routes
    routes,
    fetchRoutes,
    createRoute,
    updateRoute,
    deleteRoute,
    // Trips
    trips,
    fetchTrips,
    createTrip,
    updateTrip,
    cancelTrip,
    // Bookings
    bookings,
    fetchBookings,
    // Payments
    payments,
    fetchPayments,
    // Dashboard
    dashboardStats,
    fetchDashboard,
  };
}

export default useCoordinator;
