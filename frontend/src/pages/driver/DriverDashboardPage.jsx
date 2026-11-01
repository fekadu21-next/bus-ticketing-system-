import React, { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Bus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  RefreshCw,
  AlertOctagon,
  Navigation,
  Calendar,
  Send,
  X,
  User,
  Shield,
  Activity,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { formatUserFullName, isUserDriver, isUserAdmin } from '@/utils/userUtils';
import {
  getDriverDashboardApi,
  getDriverTripsApi,
  startDriverTripApi,
  completeDriverTripApi,
  reportDriverProblemApi,
  getDriverProblemsApi,
} from '@/api/driver.api';
import Alert from '@/components/ui/Alert';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const PROBLEM_TYPES = [
  { value: 'VEHICLE_PROBLEM', label: 'Vehicle Breakdown / Mechanical' },
  { value: 'ACCIDENT', label: 'Accident / Emergency' },
  { value: 'DELAY', label: 'Severe Traffic / Road Delay' },
  { value: 'ROUTE_PROBLEM', label: 'Road Blockage / Detour Needed' },
  { value: 'PASSENGER_ISSUE', label: 'Passenger Medical / Behavior Issue' },
  { value: 'OTHER', label: 'Other Operational Issue' },
];

export const DriverDashboardPage = () => {
  const { user } = useAuth();
  const isDriverUser = isUserDriver(user) || isUserAdmin(user);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'trips' | 'problems'

  const [dashboardData, setDashboardData] = useState(null);
  const [allTrips, setAllTrips] = useState([]);
  const [problems, setProblems] = useState([]);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: '' }

  // Problem reporting modal state
  const [problemModalTrip, setProblemModalTrip] = useState(null);
  const [problemType, setProblemType] = useState('VEHICLE_PROBLEM');
  const [problemDescription, setProblemDescription] = useState('');
  const [problemSubmitting, setProblemSubmitting] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [dashRes, tripsRes, probsRes] = await Promise.allSettled([
        getDriverDashboardApi(),
        getDriverTripsApi({ limit: 50 }),
        getDriverProblemsApi(),
      ]);

      if (dashRes.status === 'fulfilled' && dashRes.value?.success) {
        setDashboardData(dashRes.value.data);
      }
      if (tripsRes.status === 'fulfilled' && tripsRes.value?.success) {
        setAllTrips(tripsRes.value.data?.trips || []);
      }
      if (probsRes.status === 'fulfilled' && probsRes.value?.success) {
        setProblems(probsRes.value.data?.reports || []);
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to load driver data',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!isDriverUser) return;
    loadData();
  }, [isDriverUser, loadData]);

  if (!isDriverUser) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleStartTrip = async (tripId) => {
    if (!window.confirm('Are you ready to depart? This will mark the trip as IN TRANSIT.')) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await startDriverTripApi(tripId);
      setFeedback({
        type: 'success',
        message: res.message || 'Trip started successfully. Have a safe journey!',
      });
      await loadData(true);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to start trip',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteTrip = async (tripId) => {
    if (!window.confirm('Confirm trip completion? Passengers will receive arrival notices.')) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await completeDriverTripApi(tripId);
      setFeedback({
        type: 'success',
        message: res.message || 'Trip completed successfully. Well done!',
      });
      await loadData(true);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to complete trip',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReportProblem = async (e) => {
    e.preventDefault();
    if (!problemModalTrip || !problemDescription.trim()) return;

    setProblemSubmitting(true);
    setFeedback(null);
    try {
      const res = await reportDriverProblemApi(problemModalTrip.id, {
        type: problemType,
        description: problemDescription.trim(),
      });
      setFeedback({
        type: 'success',
        message: res.message || 'Operational problem reported to fleet manager.',
      });
      setProblemModalTrip(null);
      setProblemDescription('');
      await loadData(true);
      setActiveTab('problems');
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to submit problem report',
      });
    } finally {
      setProblemSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage label="Loading Driver Portal..." />;
  }

  const activeTrip = dashboardData?.activeTrip;
  const stats = dashboardData?.stats || {
    totalTrips: allTrips.length,
    completedTrips: allTrips.filter((t) => t.status === 'COMPLETED').length,
    activeTrips: allTrips.filter((t) => t.status === 'IN_TRANSIT').length,
    problemReports: problems.length,
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-16">
      {/* Top Banner / Driver Info */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Navigation size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                    {formatUserFullName(dashboardData?.driver || user, 'Driver')}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    <Shield size={12} />
                    Official Driver
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {dashboardData?.driver?.organizationName || 'Fleet Operator Partner'} • Driver Portal
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => loadData(true)}
                disabled={refreshing}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {/* Feedback Alert */}
        {feedback && (
          <div className="mb-6">
            <Alert
              type={feedback.type}
              message={feedback.message}
              onClose={() => setFeedback(null)}
            />
          </div>
        )}

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Assigned Trips</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.totalTrips || 0}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Bus size={20} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">In Transit Trips</p>
              <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{stats.activeTrips || 0}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Activity size={20} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Completed Trips</p>
              <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats.completedTrips || 0}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Problem Reports</p>
              <h3 className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">{stats.problemReports || problems.length}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center">
              <AlertOctagon size={20} />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'active'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Current / Next Active Trip
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('trips')}
            className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'trips'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Assigned Trips ({allTrips.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('problems')}
            className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'problems'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Problem Reports ({problems.length})
          </button>
        </div>

        {/* TAB 1: Current Active Trip Hero */}
        {activeTab === 'active' && (
          <div>
            {activeTrip ? (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md p-6 sm:p-8 mb-6">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Live Assigned Trip
                    </span>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide ${
                      activeTrip.status === 'IN_TRANSIT'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                    }`}
                  >
                    Status: {activeTrip.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Route & Schedule */}
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="text-blue-600 dark:text-blue-400 shrink-0 mt-1" size={20} />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">
                          Route
                        </p>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                          {activeTrip.route?.origin || 'Origin'} &rarr; {activeTrip.route?.destination || 'Destination'}
                        </h2>
                        {activeTrip.route?.distance_km && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Distance: {activeTrip.route.distance_km} km
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Clock className="text-blue-600 dark:text-blue-400 shrink-0" size={20} />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">
                          Departure Time
                        </p>
                        <p className="text-base font-bold text-slate-800 dark:text-slate-200">
                          {activeTrip.departureTime
                            ? new Date(activeTrip.departureTime).toLocaleString('en-US', {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })
                            : 'Scheduled'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bus & Vehicle Info */}
                  <div className="space-y-4 bg-slate-50 dark:bg-slate-750 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <Bus className="text-indigo-600 dark:text-indigo-400 shrink-0" size={20} />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">
                          Assigned Vehicle
                        </p>
                        <p className="text-base font-bold text-slate-900 dark:text-white">
                          Plate: {activeTrip.bus?.plateNumber || activeTrip.bus?.plate_number || 'Pending'}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          {activeTrip.bus?.model || 'Coach'} • Capacity: {activeTrip.bus?.capacity || 45} seats
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <User className="text-indigo-600 dark:text-indigo-400 shrink-0" size={20} />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">
                          Passenger Manifest
                        </p>
                        <p className="text-base font-bold text-slate-900 dark:text-white">
                          {activeTrip.totalBookings || activeTrip._count?.bookings || 0} Booked Passengers
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Driver Action Controls */}
                <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                  {activeTrip.status !== 'IN_TRANSIT' && activeTrip.status !== 'COMPLETED' && (
                    <button
                      type="button"
                      onClick={() => handleStartTrip(activeTrip.id)}
                      disabled={actionLoading}
                      className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-sm shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Navigation size={16} />
                      Start Trip (Depart Now)
                    </button>
                  )}

                  {activeTrip.status === 'IN_TRANSIT' && (
                    <button
                      type="button"
                      onClick={() => handleCompleteTrip(activeTrip.id)}
                      disabled={actionLoading}
                      className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl text-sm shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <CheckCircle2 size={16} />
                      Complete Trip (Arrived)
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setProblemModalTrip(activeTrip);
                      setProblemDescription('');
                    }}
                    className="px-4 py-2.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-800 font-bold rounded-xl text-sm flex items-center gap-2 transition-all cursor-pointer ml-auto"
                  >
                    <AlertTriangle size={16} />
                    Report Problem
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center">
                <Bus size={48} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No Active Trip In Transit</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                  You do not have any trips running right now. Check the "All Assigned Trips" tab below for your upcoming schedules.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('trips')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  View Upcoming Schedules
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: All Assigned Trips */}
        {activeTab === 'trips' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Assigned Trips Schedule</h3>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {allTrips.length} Total Trips
              </span>
            </div>

            {allTrips.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                No trips have been assigned to your driver account yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-750 text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">
                    <tr>
                      <th className="px-6 py-3">Route</th>
                      <th className="px-6 py-3">Departure Date & Time</th>
                      <th className="px-6 py-3">Bus Plate</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {allTrips.map((trip) => (
                      <tr key={trip.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-750/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-1.5">
                            <MapPin size={14} className="text-blue-500 shrink-0" />
                            {trip.route?.origin || 'Origin'} &rarr; {trip.route?.destination || 'Destination'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={14} className="text-slate-400" />
                            {trip.departureTime
                              ? new Date(trip.departureTime).toLocaleString('en-US', {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                })
                              : 'Pending'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-mono text-xs font-semibold">
                          {trip.bus?.plateNumber || trip.bus?.plate_number || 'Unassigned'}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                              trip.status === 'IN_TRANSIT'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : trip.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : trip.status === 'CANCELLED'
                                ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            }`}
                          >
                            {trip.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {trip.status !== 'IN_TRANSIT' && trip.status !== 'COMPLETED' && trip.status !== 'CANCELLED' && (
                              <button
                                type="button"
                                onClick={() => handleStartTrip(trip.id)}
                                disabled={actionLoading}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                              >
                                Start
                              </button>
                            )}

                            {trip.status === 'IN_TRANSIT' && (
                              <button
                                type="button"
                                onClick={() => handleCompleteTrip(trip.id)}
                                disabled={actionLoading}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                              >
                                Complete
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setProblemModalTrip(trip);
                                setProblemDescription('');
                              }}
                              className="px-2.5 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            >
                              Report Issue
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Problem Reports History */}
        {activeTab === 'problems' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Submitted Operational Problem Reports</h3>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {problems.length} Incident Reports
              </span>
            </div>

            {problems.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                No problem reports logged. Your trips have operated without reported incidents!
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {problems.map((prob) => (
                  <div key={prob.id} className="p-6 hover:bg-slate-50/50 dark:hover:bg-slate-750/30 transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded text-xs font-black uppercase bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                        {prob.type?.replace(/_/g, ' ') || 'INCIDENT'}
                      </span>
                      <span className="text-xs text-slate-400">
                        {prob.createdAt || prob.created_at
                          ? new Date(prob.createdAt || prob.created_at).toLocaleString()
                          : ''}
                      </span>
                    </div>
                    <p className="text-sm text-slate-800 dark:text-slate-200 font-medium mb-2">
                      {prob.description}
                    </p>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3">
                      <span>Trip: {prob.trips?.routes?.origin || 'Origin'} &rarr; {prob.trips?.routes?.destination || 'Destination'}</span>
                      <span>•</span>
                      <span>Status: <strong className="uppercase text-slate-700 dark:text-slate-300">{prob.status || 'SUBMITTED'}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Problem Report Modal */}
      {problemModalTrip && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 mb-4">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertOctagon size={20} />
                <h3 className="text-lg font-bold">Report Trip Problem</h3>
              </div>
              <button
                type="button"
                onClick={() => setProblemModalTrip(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleReportProblem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Trip Route
                </label>
                <p className="text-sm font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-700 p-2.5 rounded-lg border border-slate-200 dark:border-slate-600">
                  {problemModalTrip.route?.origin || 'Origin'} &rarr; {problemModalTrip.route?.destination || 'Destination'} (Plate: {problemModalTrip.bus?.plateNumber || problemModalTrip.bus?.plate_number || 'N/A'})
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Problem Category *
                </label>
                <select
                  value={problemType}
                  onChange={(e) => setProblemType(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  {PROBLEM_TYPES.map((pt) => (
                    <option key={pt.value} value={pt.value}>
                      {pt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Incident Description & Location *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detail the issue (e.g. Engine overheat near Mojo checkpoint; awaiting technician)..."
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setProblemModalTrip(null)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={problemSubmitting || !problemDescription.trim()}
                  className="px-5 py-2 text-sm font-bold bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg shadow-md shadow-red-500/20 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Send size={15} />
                  {problemSubmitting ? 'Reporting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverDashboardPage;

