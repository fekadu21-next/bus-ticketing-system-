import React, { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import {
  QrCode,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Bus,
  MapPin,
  RefreshCw,
  Search,
  User,
  Shield,
  Clock,
  Ticket,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { formatUserFullName, isUserVerifier, isUserAdmin } from '@/utils/userUtils';
import {
  getVerifierTripsApi,
  getVerifierTripManifestApi,
  verifyTicketApi,
  getVerifierHistoryApi,
} from '@/api/verifier.api';
import Alert from '@/components/ui/Alert';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export const VerifierDashboardPage = () => {
  const { user } = useAuth();
  const isVerifierUser = isUserVerifier(user) || isUserAdmin(user);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: '' }

  // Quick verify form
  const [qrInput, setQrInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  // Trips & Manifest
  const [trips, setTrips] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState('');
  const [manifestData, setManifestData] = useState(null);
  const [manifestLoading, setManifestLoading] = useState(false);
  const [manifestSearch, setManifestSearch] = useState('');

  // History
  const [history, setHistory] = useState([]);

  const loadInitialData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [tripsRes, historyRes] = await Promise.allSettled([
        getVerifierTripsApi({ limit: 30 }),
        getVerifierHistoryApi(),
      ]);

      let loadedTrips = [];
      if (tripsRes.status === 'fulfilled' && tripsRes.value?.success) {
        loadedTrips = tripsRes.value.data?.trips || [];
        setTrips(loadedTrips);
        if (loadedTrips.length > 0 && !selectedTripId) {
          setSelectedTripId(loadedTrips[0].id);
        }
      }

      if (historyRes.status === 'fulfilled' && historyRes.value?.success) {
        setHistory(historyRes.value.data?.verifications || []);
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to load verifier data',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedTripId]);

  useEffect(() => {
    if (!isVerifierUser) return;
    loadInitialData();
  }, [isVerifierUser, loadInitialData]);

  if (!isVerifierUser) {
    return <Navigate to="/dashboard" replace />;
  }

  // Load manifest when selectedTripId changes
  const loadManifest = useCallback(async (tripId) => {
    if (!tripId) return;
    setManifestLoading(true);
    try {
      const res = await getVerifierTripManifestApi(tripId);
      if (res.success) {
        setManifestData(res.data);
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to load passenger manifest',
      });
    } finally {
      setManifestLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedTripId) {
      loadManifest(selectedTripId);
    }
  }, [selectedTripId, loadManifest]);

  const handleVerify = async (e, manualToken = null) => {
    if (e) e.preventDefault();
    const token = (manualToken || qrInput).trim();
    if (!token) return;

    setVerifying(true);
    setVerificationResult(null);
    setFeedback(null);

    try {
      const res = await verifyTicketApi({
        qrToken: token,
        tripId: selectedTripId || undefined,
      });

      setVerificationResult(res);
      setQrInput('');

      // Refresh manifest and history
      if (selectedTripId) {
        loadManifest(selectedTripId);
      }
      getVerifierHistoryApi().then((hRes) => {
        if (hRes.success) setHistory(hRes.data?.verifications || []);
      });
    } catch (err) {
      const errData = err.response?.data;
      setVerificationResult({
        valid: false,
        status: errData?.status || 'INVALID',
        message: errData?.message || err.message || 'Verification failed',
      });
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage label="Loading Verifier Portal..." />;
  }

  const selectedTrip = trips.find((t) => t.id === selectedTripId);
  const manifestPassengers = manifestData?.passengerManifest || [];
  const filteredManifest = manifestPassengers.filter((p) => {
    if (!manifestSearch.trim()) return true;
    const term = manifestSearch.toLowerCase();
    return (
      p.passengerName?.toLowerCase().includes(term) ||
      p.ticketNumber?.toLowerCase().includes(term) ||
      String(p.seatNumber).includes(term) ||
      p.phone?.toLowerCase().includes(term)
    );
  });

  const verifiedCount = manifestPassengers.filter((p) => p.status === 'USED' || p.verifiedAt).length;
  const totalPassengers = manifestPassengers.length;
  const checkinPercent = totalPassengers > 0 ? Math.round((verifiedCount / totalPassengers) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-16">
      {/* Top Banner / Verifier Identity */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="w-full max-w-[100%] w-full mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
                <QrCode size={26} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                    {formatUserFullName(user, 'Ticket Verifier')}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    <Shield size={12} />
                    Station Gate Verifier
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Ticket Verification & Boarding Control Console
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => loadInitialData(true)}
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

      <div className="w-full max-w-[100%] w-full mx-auto px-4 sm:px-6 pt-6">
        {/* Global Feedback */}
        {feedback && (
          <div className="mb-6">
            <Alert
              type={feedback.type}
              message={feedback.message}
              onClose={() => setFeedback(null)}
            />
          </div>
        )}

        {/* Verification Engine Hero Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md p-6 sm:p-8 mb-8">
          <div className="max-w-2xl mx-auto text-center mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 mb-2">
              <Sparkles size={14} /> Real-Time Passenger Check-in
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Scan QR or Enter Ticket Number
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Position scanner to read ticket QR code or manually enter the ticket number (e.g. TKT-...)
            </p>
          </div>

          {/* Quick Input Bar */}
          <form onSubmit={handleVerify} className="max-w-xl mx-auto mb-6">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <QrCode
                  size={20}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  autoFocus
                  placeholder="Scan QR token or type ticket number..."
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 text-sm sm:text-base rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-750 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-700 font-mono shadow-inner"
                />
              </div>
              <button
                type="submit"
                disabled={verifying || !qrInput.trim()}
                className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm sm:text-base shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer transition-all"
              >
                {verifying ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    Verify
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Verification Result Banner */}
          {verificationResult && (
            <div className="max-w-xl mx-auto animate-in zoom-in-95 duration-200">
              {verificationResult.valid ? (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500 rounded-2xl p-6 shadow-lg shadow-emerald-500/10 text-emerald-900 dark:text-emerald-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/30">
                      <CheckCircle2 size={28} />
                    </div>
                    <div>
                      <span className="px-2.5 py-0.5 rounded text-[11px] font-black uppercase tracking-wider bg-emerald-600 text-white">
                        Boarding Approved
                      </span>
                      <h3 className="text-lg font-bold text-emerald-950 dark:text-emerald-50 mt-0.5">
                        {verificationResult.message || 'Ticket Successfully Verified!'}
                      </h3>
                    </div>
                  </div>

                  {verificationResult.ticket && (
                    <div className="grid grid-cols-2 gap-3 bg-white/70 dark:bg-slate-800/80 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 text-xs">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 font-bold uppercase">Passenger</span>
                        <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                          {verificationResult.ticket.passengerName ||
                            `${verificationResult.ticket.passenger?.first_name || ''} ${verificationResult.ticket.passenger?.last_name || ''}`.trim() ||
                            'Valued Passenger'}
                        </p>
                      </div>

                      <div>
                        <span className="text-slate-500 dark:text-slate-400 font-bold uppercase">Seat Number</span>
                        <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                          Seat #{verificationResult.ticket.seatNumber || verificationResult.ticket.seats?.seat_number || 'N/A'}
                        </p>
                      </div>

                      <div>
                        <span className="text-slate-500 dark:text-slate-400 font-bold uppercase">Ticket Number</span>
                        <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                          {verificationResult.ticket.ticketNumber || verificationResult.ticket.ticket_number}
                        </p>
                      </div>

                      <div>
                        <span className="text-slate-500 dark:text-slate-400 font-bold uppercase">Verification Time</span>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                          {new Date().toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : verificationResult.status === 'ALREADY_VERIFIED' ? (
                <div className="bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-500 rounded-2xl p-6 shadow-lg shadow-amber-500/10 text-amber-900 dark:text-amber-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                      <AlertTriangle size={28} />
                    </div>
                    <div>
                      <span className="px-2.5 py-0.5 rounded text-[11px] font-black uppercase tracking-wider bg-amber-600 text-white">
                        Already Checked In
                      </span>
                      <h3 className="text-lg font-bold text-amber-950 dark:text-amber-50 mt-0.5">
                        {verificationResult.message || 'Ticket has already been verified.'}
                      </h3>
                    </div>
                  </div>
                  <p className="text-xs text-amber-800 dark:text-amber-300 mt-2">
                    This ticket has already been marked as used. If this passenger is boarding, confirm their ID match.
                  </p>
                </div>
              ) : (
                <div className="bg-red-50 dark:bg-red-950/40 border-2 border-red-500 rounded-2xl p-6 shadow-lg shadow-red-500/10 text-red-900 dark:text-red-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0">
                      <XCircle size={28} />
                    </div>
                    <div>
                      <span className="px-2.5 py-0.5 rounded text-[11px] font-black uppercase tracking-wider bg-red-600 text-white">
                        Verification Denied
                      </span>
                      <h3 className="text-lg font-bold text-red-950 dark:text-red-50 mt-0.5">
                        {verificationResult.message || 'Invalid or unrecognized ticket.'}
                      </h3>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Trip Manifest Inspector */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Passenger Boarding Manifest</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Inspect scheduled trips and verify passenger boarding lists
              </p>
            </div>

            {/* Trip Selector */}
            <div className="flex items-center gap-3">
              <label htmlFor="tripSelect" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Active Trip:
              </label>
              <select
                id="tripSelect"
                value={selectedTripId}
                onChange={(e) => setSelectedTripId(e.target.value)}
                className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white max-w-xs focus:ring-2 focus:ring-blue-500"
              >
                {trips.length === 0 ? (
                  <option value="">No trips available</option>
                ) : (
                  trips.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.route?.origin} &rarr; {t.route?.destination} ({t.bus?.plate_number || t.bus?.plateNumber || 'Bus'})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {selectedTrip && (
            <div className="mb-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Bus size={20} className="text-blue-600 dark:text-blue-400" />
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Route & Bus</span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {selectedTrip.route?.origin} &rarr; {selectedTrip.route?.destination} • {selectedTrip.bus?.plate_number || selectedTrip.bus?.plateNumber || 'Bus'}
                  </p>
                </div>
              </div>

              {/* Progress */}
              <div className="flex-1 max-w-xs">
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-600 dark:text-slate-300">Boarding Progress</span>
                  <span className="text-blue-600 dark:text-blue-400">{verifiedCount} / {totalPassengers} ({checkinPercent}%)</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${checkinPercent}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Search Manifest */}
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter passengers by name, seat number, or ticket number..."
              value={manifestSearch}
              onChange={(e) => setManifestSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          {/* Manifest Table */}
          {manifestLoading ? (
            <div className="p-8 text-center">
              <LoadingSpinner label="Loading trip manifest..." />
            </div>
          ) : filteredManifest.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
              No passengers found for this trip matching criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-750 text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Seat</th>
                    <th className="px-4 py-3">Passenger</th>
                    <th className="px-4 py-3">Ticket #</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filteredManifest.map((item) => {
                    const isCheckedIn = item.status === 'USED' || Boolean(item.verifiedAt);
                    return (
                      <tr key={item.ticketId} className="hover:bg-slate-50/50 dark:hover:bg-slate-750/30 transition-colors">
                        <td className="px-4 py-3 font-black text-slate-900 dark:text-white">
                          <span className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold">
                            #{item.seatNumber}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                          <div>
                            <p>{item.passengerName || 'Passenger'}</p>
                            {item.phone && <p className="text-xs text-slate-400 font-normal">{item.phone}</p>}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">
                          {item.ticketNumber}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                              isCheckedIn
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {isCheckedIn ? 'Checked In' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {!isCheckedIn ? (
                            <button
                              type="button"
                              onClick={() => handleVerify(null, item.ticketNumber)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            >
                              Check-In
                            </button>
                          ) : (
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-end gap-1">
                              <CheckCircle2 size={13} /> Verified
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Verifications Audit Log */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Verification Activity</h3>
            <span className="text-xs text-slate-400 font-semibold">{history.length} Logs</span>
          </div>

          {history.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">No recent ticket verifications recorded yet today.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {history.slice(0, 10).map((record) => (
                <div key={record.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        record.result === 'VALID'
                          ? 'bg-emerald-500'
                          : record.result === 'ALREADY_VERIFIED'
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                    />
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {record.ticket?.ticket_number || record.ticket?.ticketNumber || record.notes || 'Verification'}
                    </span>
                    <span className="text-slate-400">
                      • Seat #{record.ticket?.seats?.seat_number || record.ticket?.seat_number || 'N/A'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        record.result === 'VALID'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : record.result === 'ALREADY_VERIFIED'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                      }`}
                    >
                      {record.result}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {record.verifiedAt || record.verified_at
                        ? new Date(record.verifiedAt || record.verified_at).toLocaleTimeString()
                        : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifierDashboardPage;

