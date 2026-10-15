import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Clock, Ticket, CheckCircle, XCircle, ArrowRight, Download, X, User, Phone, Mail, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getMyBookingsApi } from '@/api/trip.api';
import QRCode from 'qrcode';

// Simple ETB formatter
const formatEtb = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) return '0 ETB';
  return `${amount.toLocaleString()} ETB`;
};

// Simple date formatter
const formatPrettyDate = (dateStr) => {
  if (!dateStr) return 'Scheduled Trip';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

export const MyBookingsPage = () => {
  const { isAuthenticated, user } = useAuth();
  const [filter, setFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [modalQrUrl, setModalQrUrl] = useState('');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  // Fetch bookings from backend
  useEffect(() => {
    const fetchBookings = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        const response = await getMyBookingsApi();
        let bookingsData = [];
        if (response.success && response.data) {
          bookingsData = Array.isArray(response.data) ? response.data : response.data.bookings || [];
        } else if (Array.isArray(response)) {
          bookingsData = response;
        }
        setBookings(bookingsData);
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [isAuthenticated]);

  // Generate QR code whenever a booking modal is opened
  useEffect(() => {
    if (!selectedBooking) {
      setModalQrUrl('');
      return;
    }

    const ticketNumber = selectedBooking.ticketNumber || selectedBooking.ticket?.ticketNumber || ('TKT-' + selectedBooking.id.substring(0, 8).toUpperCase());
    const origin = selectedBooking.from || selectedBooking.origin || selectedBooking.trips?.routes?.origin || 'Addis Ababa';
    const destination = selectedBooking.to || selectedBooking.destination || selectedBooking.trips?.routes?.destination || 'Destination';
    const depTime = selectedBooking.departureTime || '06:00 AM';
    const date = selectedBooking.date || selectedBooking.departureDate || selectedBooking.trips?.departure_time;

    const payload = JSON.stringify({
      verificationType: 'ETHIO_BUS_SECURE_TICKET',
      bookingId: selectedBooking.id,
      ticketNumber,
      passenger: selectedBooking.passengerName || (user ? `${user.firstName || user.first_name} ${user.lastName || user.last_name}` : 'Passenger'),
      phone: selectedBooking.phone || selectedBooking.passengerPhone || user?.phone || 'N/A',
      route: `${origin} → ${destination}`,
      departureDate: date,
      departureTime: depTime,
      seats: selectedBooking.seats || [selectedBooking.seatNumber || '1'],
      operator: selectedBooking.operator || selectedBooking.operatorName || 'Bus Line',
      amount: selectedBooking.price || selectedBooking.totalFare || 0,
      status: 'CONFIRMED',
      issuedAt: selectedBooking.createdAt || new Date().toISOString(),
    });

    QRCode.toDataURL(payload, {
      width: 240,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' },
    })
      .then((url) => setModalQrUrl(url))
      .catch((err) => console.error('Error generating modal QR:', err));
  }, [selectedBooking, user]);

  const isUpcoming = (b) => {
    const s = (b.status || b.rawStatus || '').toLowerCase();
    return s === 'upcoming' || s === 'confirmed' || s === 'pending';
  };

  const isCompleted = (b) => {
    const s = (b.status || b.rawStatus || '').toLowerCase();
    return s === 'completed';
  };

  const isCancelled = (b) => {
    const s = (b.status || b.rawStatus || '').toLowerCase();
    return s === 'cancelled';
  };

  const filteredBookings = bookings.filter((booking) => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return isUpcoming(booking);
    if (filter === 'completed') return isCompleted(booking);
    if (filter === 'cancelled') return isCancelled(booking);
    return true;
  });

  const getStatusBadge = (status, rawStatus) => {
    const s = (status || rawStatus || '').toLowerCase();
    if (s === 'upcoming' || s === 'confirmed' || s === 'pending') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
          <CheckCircle size={12} />
          Upcoming
        </span>
      );
    }
    if (s === 'completed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
          <CheckCircle size={12} />
          Completed
        </span>
      );
    }
    if (s === 'cancelled') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
          <XCircle size={12} />
          Cancelled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
        {status || 'Booked'}
      </span>
    );
  };

  // Download digital ticket image for any booking
  const handleDownloadTicket = async (booking) => {
    if (!booking) return;
    setDownloadingId(booking.id);

    try {
      const ticketNumber = booking.ticketNumber || booking.ticket?.ticketNumber || ('TKT-' + booking.id.substring(0, 8).toUpperCase());
      const origin = booking.from || booking.origin || booking.trips?.routes?.origin || 'Addis Ababa';
      const destination = booking.to || booking.destination || booking.trips?.routes?.destination || 'Destination';
      const depDate = booking.date || booking.departureDate || booking.trips?.departure_time;
      const depTime = booking.departureTime || '06:00 AM';
      const op = booking.operator || booking.operatorName || 'Bus Line';
      const passenger = booking.passengerName || (user ? `${user.firstName || user.first_name} ${user.lastName || user.last_name}` : 'Passenger');
      const seats = (Array.isArray(booking.seats) ? booking.seats.join(', ') : booking.seatNumber || '1');
      const fare = booking.price || booking.totalFare || 0;

      // Generate QR URL for canvas
      const qrData = await QRCode.toDataURL(JSON.stringify({
        ticketNumber,
        bookingId: booking.id,
        passenger,
        route: `${origin} → ${destination}`,
        date: depDate,
        time: depTime,
        seats,
        operator: op,
        status: 'VERIFIED',
      }), { width: 200, margin: 1 });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 800;
      canvas.height = 950;

      // Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Top banner
      const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
      grad.addColorStop(0, '#0f2942');
      grad.addColorStop(1, '#1e40af');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, 130);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText('ETHIOPIAN BUS TICKETING SYSTEM', 40, 50);
      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#93c5fd';
      ctx.fillText(`Digital Boarding Pass • ${op}`, 40, 80);
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText('● CONFIRMED RESERVATION', 40, 110);

      // Reference
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(40, 160, 720, 90, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '13px sans-serif';
      ctx.fillText('TICKET NUMBER', 60, 195);
      ctx.fillText('BOOKING ID', 420, 195);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(ticketNumber, 60, 225);
      ctx.fillText(booking.id, 420, 225);

      // Route
      ctx.fillStyle = '#f1f5f9';
      ctx.beginPath();
      ctx.roundRect(40, 275, 720, 150, 12);
      ctx.fill();

      ctx.fillStyle = '#2563eb';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('ROUTE', 60, 310);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(`${origin}   ➔   ${destination}`, 60, 345);

      ctx.fillStyle = '#64748b';
      ctx.font = '14px sans-serif';
      ctx.fillText(`Date: ${formatPrettyDate(depDate)}`, 60, 390);
      ctx.fillText(`Time: ${depTime}`, 380, 390);

      // Details
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.roundRect(40, 450, 720, 150, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '13px sans-serif';
      ctx.fillText('PASSENGER', 60, 485);
      ctx.fillText('SEATS', 380, 485);
      ctx.fillText('FARE PAID', 580, 485);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(passenger, 60, 520);
      ctx.font = 'bold 24px sans-serif';
      ctx.fillStyle = '#2563eb';
      ctx.fillText(seats, 380, 525);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(`${formatEtb(fare)}`, 580, 520);

      // QR Code
      const qrImg = new Image();
      qrImg.onload = () => {
        ctx.drawImage(qrImg, 300, 630, 200, 200);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Show this digital QR code at terminal for instant boarding verification.', canvas.width / 2, 870);

        const a = document.createElement('a');
        a.download = `Ticket-${ticketNumber}.png`;
        a.href = canvas.toDataURL('image/png');
        a.click();
        setDownloadingId(null);
      };
      qrImg.src = qrData;
    } catch (err) {
      console.error('Download ticket error:', err);
      setDownloadingId(null);
    }
  };

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
  };

  const handleCloseDetails = () => {
    setSelectedBooking(null);
  };

  return (
    <div className="bg-[#f4f7fb] min-h-screen text-slate-800 pb-16">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/crops/detail_banner.jpg" alt="" className="w-full h-full object-cover object-[75%_center]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#071833]/90 via-[#0b2a4a]/75 to-[#071833]/90" />
        </div>
        <div className="relative z-10 max-w-[1180px] mx-auto px-4 sm:px-6 pt-8 pb-16">
          <Link to="/" className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-white/90 hover:text-white mb-2">
            <ArrowRight size={14} className="rotate-180" />
            Back to Home
          </Link>
          <h1 className="mt-2 text-[32px] sm:text-[40px] font-black text-white tracking-tight">My Bookings</h1>
          <p className="mt-1 text-[13px] text-white/80">View all your confirmed reservations and download digital tickets.</p>
        </div>
      </section>

      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 -mt-8 space-y-4 relative z-20">
        <div className="bg-white rounded-[24px] border border-slate-200/80 shadow-[0_8px_30px_rgba(15,23,42,0.06)] p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-[18px] font-extrabold text-slate-900">Your Ticket History</h2>
              <p className="text-xs text-slate-500">Manage and download boarding passes for upcoming trips</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-xl text-[12px] font-bold transition-all cursor-pointer ${
                  filter === 'all'
                    ? 'bg-[#2563eb] text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({bookings.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('upcoming')}
                className={`px-4 py-2 rounded-xl text-[12px] font-bold transition-all cursor-pointer ${
                  filter === 'upcoming'
                    ? 'bg-[#2563eb] text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Upcoming
              </button>
              <button
                type="button"
                onClick={() => setFilter('completed')}
                className={`px-4 py-2 rounded-xl text-[12px] font-bold transition-all cursor-pointer ${
                  filter === 'completed'
                    ? 'bg-[#2563eb] text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Completed
              </button>
              <button
                type="button"
                onClick={() => setFilter('cancelled')}
                className={`px-4 py-2 rounded-xl text-[12px] font-bold transition-all cursor-pointer ${
                  filter === 'cancelled'
                    ? 'bg-[#2563eb] text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Cancelled
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <Loader2 size={44} className="text-[#2563eb] mx-auto mb-3 animate-spin" />
              <p className="text-[13px] font-semibold text-slate-600">Retrieving your confirmed bookings...</p>
            </div>
          ) : !isAuthenticated ? (
            <div className="text-center py-16">
              <Ticket size={48} className="text-slate-300 mx-auto mb-3" />
              <p className="text-[14px] font-bold text-slate-700 mb-1">Please sign in to view your bookings</p>
              <p className="text-xs text-slate-500 mb-4">You need an active session to access your personal tickets.</p>
              <Link to="/login" className="px-5 py-2.5 rounded-full bg-[#2563eb] text-white font-bold text-xs inline-block">
                Login to continue
              </Link>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-16">
              <Ticket size={48} className="text-slate-300 mx-auto mb-3" />
              <p className="text-[14px] font-bold text-slate-700 mb-1">No bookings found for this filter</p>
              <p className="text-xs text-slate-400 mb-4">Book a trip to see your tickets and boarding passes here.</p>
              <Link to="/search-trips" className="px-5 py-2.5 rounded-full bg-[#2563eb] text-white font-bold text-xs inline-block">
                Find a Trip Now
              </Link>
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredBookings.map((b) => {
                const origin = b.from || b.origin || b.trips?.routes?.origin || 'Addis Ababa';
                const destination = b.to || b.destination || b.trips?.routes?.destination || 'Destination';
                const depDate = b.date || b.departureDate || b.trips?.departure_time;
                const depTime = b.departureTime || '06:00 AM';
                const seats = Array.isArray(b.seats) ? b.seats.join(', ') : b.seatNumber || b.seat_number || '1';
                const op = b.operator || b.operatorName || b.organizationName || b.organizations?.name || 'Bus Line';
                const totalFare = b.price || b.totalFare || b.amount || 0;
                const isUpcomingBooking = isUpcoming(b);

                return (
                  <div
                    key={b.id}
                    className="bg-[#f8fafc] rounded-2xl border border-slate-200/90 p-4 sm:p-5 hover:border-slate-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2.5">
                          <span className="text-[11px] font-mono font-bold text-slate-500">
                            Ticket #: {b.ticketNumber || b.ticket?.ticketNumber || ('TKT-' + b.id.substring(0, 8).toUpperCase())}
                          </span>
                          {getStatusBadge(b.status, b.rawStatus)}
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                          <MapPin size={17} className="text-[#2563eb] flex-shrink-0" />
                          <span className="text-[16px] font-black text-slate-900">
                            {origin} → {destination}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[12px]">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-slate-400" />
                            <span className="text-slate-700 font-semibold">{formatPrettyDate(depDate)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-slate-400" />
                            <span className="text-slate-700 font-semibold">{depTime}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Ticket size={14} className="text-slate-400" />
                            <span className="text-slate-700 font-semibold">Seat: {seats}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">Operator:</span>
                            <span className="text-slate-700 font-semibold">{op}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:text-right pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-200">
                        <div>
                          <p className="text-[11px] font-semibold text-slate-400 uppercase">Total Fare</p>
                          <p className="text-[20px] font-black text-[#2563eb]">{formatEtb(totalFare)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleViewDetails(b)}
                            className="h-10 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            Details & QR
                          </button>
                          {isUpcomingBooking && (
                            <button
                              type="button"
                              onClick={() => handleDownloadTicket(b)}
                              disabled={downloadingId === b.id}
                              className="h-10 px-4 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                            >
                              <Download size={14} />
                              <span>{downloadingId === b.id ? 'Generating...' : 'Ticket'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Booking Details & QR Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-4 sm:p-5 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <Ticket size={20} className="text-[#2563eb]" />
                <h2 className="text-lg font-black text-slate-900">
                  Boarding Pass — Seat #{Array.isArray(selectedBooking.seats) ? selectedBooking.seats.join(', ') : selectedBooking.seatNumber || selectedBooking.seat_number || '1'}
                </h2>
              </div>
              <button
                type="button"
                onClick={handleCloseDetails}
                className="p-1.5 hover:bg-slate-100 rounded-full transition-colors cursor-pointer text-slate-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Header Box */}
              <div className="bg-[#f8fafc] border border-slate-200/90 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase">Ticket Number</p>
                  <p className="text-lg font-mono font-black text-slate-900">
                    {selectedBooking.ticketNumber || selectedBooking.ticket?.ticketNumber || ('TKT-' + selectedBooking.id.substring(0, 8).toUpperCase())}
                  </p>
                  <p className="text-xs text-slate-500">Booking ID: {selectedBooking.id}</p>
                </div>
                {getStatusBadge(selectedBooking.status, selectedBooking.rawStatus)}
              </div>

              {/* Route */}
              <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin size={18} className="text-[#2563eb]" />
                  <span className="text-lg font-black text-slate-900">
                    {selectedBooking.from || selectedBooking.origin || selectedBooking.trips?.routes?.origin || 'Addis Ababa'} →{' '}
                    {selectedBooking.to || selectedBooking.destination || selectedBooking.trips?.routes?.destination || 'Destination'}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <p className="text-slate-400 font-semibold">Date</p>
                    <p className="font-bold text-slate-800">
                      {formatPrettyDate(selectedBooking.date || selectedBooking.departureDate || selectedBooking.trips?.departure_time)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-semibold">Departure</p>
                    <p className="font-bold text-slate-800">{selectedBooking.departureTime || '06:00 AM'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-semibold">Operator</p>
                    <p className="font-bold text-slate-800">{selectedBooking.operator || selectedBooking.operatorName || 'Bus Line'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-semibold">Bus Plate</p>
                    <p className="font-bold text-slate-800">{selectedBooking.busPlateNumber || selectedBooking.trips?.buses?.plate_number || 'ET-3-1234'}</p>
                  </div>
                </div>
              </div>

              {/* Passenger & Seat */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <p className="text-[11px] font-bold text-slate-400 uppercase">Passenger Details</p>
                  <p className="font-bold text-slate-900 text-sm">
                    {selectedBooking.passengerName || (user ? `${user.firstName || user.first_name} ${user.lastName || user.last_name}` : 'Passenger')}
                  </p>
                  <p className="text-slate-600">
                    Phone: {selectedBooking.phone || selectedBooking.passengerPhone || user?.phone || 'N/A'}
                  </p>
                  <p className="text-slate-600">
                    Email: {selectedBooking.email || selectedBooking.passengerEmail || user?.email || 'N/A'}
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <p className="text-[11px] font-bold text-slate-400 uppercase">Seat & Payment</p>
                  <p className="font-black text-2xl text-[#2563eb]">
                    Seat #{Array.isArray(selectedBooking.seats) ? selectedBooking.seats.join(', ') : selectedBooking.seatNumber || selectedBooking.seat_number || '1'}
                  </p>
                  <p className="font-bold text-slate-800">
                    Fare: {formatEtb(selectedBooking.price || selectedBooking.totalFare || 0)}
                  </p>
                  <p className="text-emerald-700 font-semibold">Status: Confirmed & Paid</p>
                </div>
              </div>

              {/* QR Code Section */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row items-center gap-5">
                <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-200 flex-shrink-0 text-center">
                  {modalQrUrl ? (
                    <>
                      <img src={modalQrUrl} alt="Ticket QR" className="w-36 h-36 mx-auto" />
                      <div className="mt-1.5 text-[10px] font-mono font-bold text-slate-700 bg-slate-100 py-0.5 px-2 rounded">
                        Seat #{Array.isArray(selectedBooking.seats) ? selectedBooking.seats.join(', ') : selectedBooking.seatNumber || selectedBooking.seat_number || '1'}
                      </div>
                    </>
                  ) : (
                    <div className="w-36 h-36 bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                      Generating...
                    </div>
                  )}
                </div>
                <div className="text-center sm:text-left space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[11px] font-bold">
                    <ShieldCheck size={12} />
                    <span>Seat #{Array.isArray(selectedBooking.seats) ? selectedBooking.seats.join(', ') : selectedBooking.seatNumber || selectedBooking.seat_number || '1'} Boarding Token</span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900">Digital Gate Verification</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Show this QR code at the bus terminal to verify your reservation for Seat #{Array.isArray(selectedBooking.seats) ? selectedBooking.seats.join(', ') : selectedBooking.seatNumber || selectedBooking.seat_number || '1'} and board the bus.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleDownloadTicket(selectedBooking)}
                  disabled={downloadingId === selectedBooking.id}
                  className="flex-1 h-11 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold inline-flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  <Download size={15} />
                  <span>{downloadingId === selectedBooking.id ? 'Preparing...' : 'Download Ticket (Image)'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCloseDetails}
                  className="h-11 px-6 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookingsPage;
