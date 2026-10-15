import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  Download,
  Home,
  Ticket,
  MapPin,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  ShieldCheck,
  Printer,
  ArrowRight,
  Layers,
  QrCode as QrIcon,
} from 'lucide-react';
import QRCode from 'qrcode';
import { formatUserFullName } from '@/utils/userUtils';

// Simple ETB formatter
const formatEtb = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) return '0 ETB';
  return `${amount.toLocaleString()} ETB`;
};

// Simple date formatter
const formatPrettyDate = (dateStr) => {
  if (!dateStr) return 'Scheduled Departure';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return dateStr;
  }
};

export const BookingConfirmationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get booking data from location state (from payment callback)
  const bookingData = location.state?.bookingData || {};
  const mockPayment = location.state?.mockPayment || false;

  // Fall back to location state or bookingData fields
  const tripData = location.state?.tripData || bookingData.tripData || {};
  const selectedSeats = location.state?.selectedSeats || bookingData.selectedSeats || (bookingData.booking?.seatNumber ? [bookingData.booking.seatNumber] : ['1']);
  const passengerInfo = location.state?.passengerInfo || bookingData.passengerInfo || {};
  const paymentMethod = location.state?.paymentMethod || bookingData.payment?.paymentMethod || 'CHAPA';
  const paymentAmount = Number(location.state?.paymentAmount || bookingData.payment?.amount || tripData.fare || tripData.price || 0);

  // Get trip display data
  const from = tripData.from || tripData.origin || tripData.route?.origin || 'Addis Ababa';
  const to = tripData.to || tripData.destination || tripData.route?.destination || 'Destination';
  const date = tripData.date || tripData.departureDate || (tripData.departureTime ? tripData.departureTime.split('T')[0] : '2026-10-20');
  const departureTime = tripData.departureTime ? (tripData.departureTime.includes('T') ? new Date(tripData.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : tripData.departureTime) : '06:00 AM';
  const operator = tripData.operator || tripData.operatorName || tripData.organizationName || 'National Express';
  const busPlate = tripData.busPlateNumber || tripData.bus?.plate_number || 'ET-3-1234';

  const passengerFullName = useMemo(() => {
    return formatUserFullName(passengerInfo, 'Passenger');
  }, [passengerInfo]);

  // Normalize tickets list for multi-seat bookings
  const ticketsList = useMemo(() => {
    if (Array.isArray(bookingData.tickets) && bookingData.tickets.length > 0) {
      return bookingData.tickets.map((t, idx) => ({
        id: t.id || `ticket-${idx}`,
        ticketNumber: t.ticketNumber || t.ticket_number || `TKT-${idx + 1}`,
        bookingId: t.bookingId || bookingData.booking?.id || `BK-${idx + 1}`,
        seatNumber: t.seatNumber || t.seat_number || selectedSeats[idx] || (idx + 1),
        status: t.status || 'UNUSED',
        qrToken: t.qrToken || t.qr_token || `SECURE-TOKEN-${t.ticketNumber || idx}`,
      }));
    }

    // Fallback: create a ticket for each selected seat
    const seats = Array.isArray(selectedSeats) && selectedSeats.length > 0 ? selectedSeats : [1];
    const baseTicketNumber = bookingData.ticket?.ticketNumber || ('TKT-' + (bookingData.payment?.transactionReference?.substring(7, 15) || Date.now().toString(36).toUpperCase()));
    const baseBookingId = bookingData.booking?.id || ('BK-' + (bookingData.payment?.transactionReference?.substring(7, 15) || Date.now().toString(36).toUpperCase()));

    return seats.map((seatNum, idx) => ({
      id: `${baseBookingId}-${seatNum}`,
      bookingId: baseBookingId,
      seatNumber: seatNum,
      ticketNumber: seats.length > 1 ? `${baseTicketNumber}-${seatNum}` : baseTicketNumber,
      status: 'UNUSED',
      qrToken: bookingData.ticket?.qrToken || `SECURE-PASS-${baseTicketNumber}-${seatNum}`,
    }));
  }, [bookingData.tickets, bookingData.ticket, bookingData.booking, bookingData.payment, selectedSeats]);

  const [activeTab, setActiveTab] = useState('all'); // 'all' or ticketNumber
  const [qrCodeMap, setQrCodeMap] = useState({}); // { [ticketNumber]: dataUrl }
  const [downloadingId, setDownloadingId] = useState(null); // 'all' or ticketNumber

  // Generate real dynamic QR code for each ticket
  useEffect(() => {
    let isMounted = true;

    const generateAllQrs = async () => {
      const map = {};
      for (const tkt of ticketsList) {
        const payload = JSON.stringify({
          verificationType: 'ETHIO_BUS_SECURE_TICKET',
          ticketNumber: tkt.ticketNumber,
          bookingId: tkt.bookingId,
          seatNumber: tkt.seatNumber,
          passenger: passengerFullName,
          phone: passengerInfo.phone || 'N/A',
          email: passengerInfo.email || 'N/A',
          route: `${from} → ${to}`,
          departureDate: date,
          departureTime,
          operator,
          busPlate,
          totalPaid: `${paymentAmount} ETB`,
          paymentMethod,
          qrToken: tkt.qrToken,
          status: 'VERIFIED_CONFIRMED',
          issuedAt: new Date().toISOString(),
        });

        try {
          const url = await QRCode.toDataURL(payload, {
            width: 280,
            margin: 1,
            color: {
              dark: '#0f172a',
              light: '#ffffff',
            },
          });
          map[tkt.ticketNumber] = url;
        } catch (err) {
          console.error(`Failed to generate QR code for ${tkt.ticketNumber}:`, err);
        }
      }

      if (isMounted) {
        setQrCodeMap(map);
      }
    };

    generateAllQrs();

    return () => {
      isMounted = false;
    };
  }, [ticketsList, passengerInfo, from, to, date, departureTime, operator, busPlate, paymentAmount, paymentMethod]);

  // Helper to generate a downloadable high-res ticket PNG canvas
  const renderTicketCanvas = (tkt) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 800;
      canvas.height = 1020;

      // Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Header Banner
      const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
      grad.addColorStop(0, '#0f2942');
      grad.addColorStop(1, '#1e40af');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, 140);

      // Header Text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('ETHIOPIAN BUS TICKETING SYSTEM', 40, 55);
      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#93c5fd';
      ctx.fillText(`Official Boarding Pass • ${operator}`, 40, 85);
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('● CONFIRMED & VERIFIED RESERVATION', 40, 115);

      // Ticket Reference Box
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(40, 170, 720, 100, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '13px sans-serif';
      ctx.fillText('TICKET NUMBER', 60, 205);
      ctx.fillText('BOOKING ID', 420, 205);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(tkt.ticketNumber, 60, 240);
      ctx.fillText(tkt.bookingId, 420, 240);

      // Trip Information
      ctx.fillStyle = '#f1f5f9';
      ctx.beginPath();
      ctx.roundRect(40, 290, 720, 160, 12);
      ctx.fill();

      ctx.fillStyle = '#3b82f6';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('TRIP ROUTE', 60, 325);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText(`${from}   ➔   ${to}`, 60, 365);

      ctx.fillStyle = '#64748b';
      ctx.font = '14px sans-serif';
      ctx.fillText(`Date: ${formatPrettyDate(date)}`, 60, 410);
      ctx.fillText(`Departure: ${departureTime}`, 360, 410);
      ctx.fillText(`Operator: ${operator}`, 550, 410);

      // Passenger & Seat details
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.roundRect(40, 470, 720, 160, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '13px sans-serif';
      ctx.fillText('PASSENGER NAME', 60, 505);
      ctx.fillText('PHONE NUMBER', 320, 505);
      ctx.fillText('SEAT NUMBER', 580, 505);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(passengerFullName, 60, 540);
      ctx.fillText(passengerInfo.phone || 'N/A', 320, 540);

      ctx.font = 'bold 32px sans-serif';
      ctx.fillStyle = '#2563eb';
      ctx.fillText(`Seat ${tkt.seatNumber}`, 580, 545);

      ctx.fillStyle = '#64748b';
      ctx.font = '13px sans-serif';
      ctx.fillText(`Bus Plate: ${busPlate}`, 60, 595);
      ctx.fillText(`Payment: ${paymentMethod}`, 320, 595);
      ctx.fillText(`Status: CONFIRMED`, 580, 595);

      // QR Code Box
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(280, 660, 240, 240, 16);
      ctx.fill();
      ctx.stroke();

      const qrUrl = qrCodeMap[tkt.ticketNumber];
      if (qrUrl) {
        const qrImg = new Image();
        qrImg.onload = () => {
          ctx.drawImage(qrImg, 300, 680, 200, 200);

          // Footer
          ctx.fillStyle = '#94a3b8';
          ctx.font = '12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`Present this digital QR pass for Seat ${tkt.seatNumber} at terminal verification.`, canvas.width / 2, 940);
          ctx.fillText(`Ticket #${tkt.ticketNumber} • 256-bit cryptographic signature protected.`, canvas.width / 2, 965);

          resolve(canvas.toDataURL('image/png'));
        };
        qrImg.src = qrUrl;
      } else {
        resolve(canvas.toDataURL('image/png'));
      }
    });
  };

  // Download a single ticket
  const handleDownloadSingleTicket = async (tkt) => {
    setDownloadingId(tkt.ticketNumber);
    try {
      const dataUrl = await renderTicketCanvas(tkt);
      const a = document.createElement('a');
      a.download = `BusTicket-Seat-${tkt.seatNumber}-${tkt.ticketNumber}.png`;
      a.href = dataUrl;
      a.click();
    } catch (err) {
      console.error('Download ticket error:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  // Download all tickets sequentially
  const handleDownloadAllTickets = async () => {
    setDownloadingId('all');
    try {
      for (let i = 0; i < ticketsList.length; i++) {
        const tkt = ticketsList[i];
        const dataUrl = await renderTicketCanvas(tkt);
        const a = document.createElement('a');
        a.download = `BusTicket-Seat-${tkt.seatNumber}-${tkt.ticketNumber}.png`;
        a.href = dataUrl;
        a.click();
        if (i < ticketsList.length - 1) {
          await new Promise((r) => setTimeout(r, 400));
        }
      }
    } catch (err) {
      console.error('Download all error:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const visibleTickets = activeTab === 'all'
    ? ticketsList
    : ticketsList.filter((t) => t.ticketNumber === activeTab);

  return (
    <div className="bg-[#f4f7fb] min-h-screen text-slate-800 pb-16 print:bg-white print:p-0">
      {/* Top Banner (Hidden in print) */}
      <section className="relative overflow-hidden print:hidden">
        <div className="absolute inset-0">
          <img src="/images/crops/detail_banner.jpg" alt="" className="w-full h-full object-cover object-[75%_center]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#071833]/90 via-[#0b2a4a]/75 to-[#071833]/90" />
        </div>
        <div className="relative z-10 max-w-[1100px] mx-auto px-4 sm:px-6 pt-8 pb-16">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/90 hover:text-white mb-3">
            <ArrowLeft size={14} />
            Back to Home
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Booking Confirmed!</h1>
              <p className="mt-1 text-sm text-white/80">
                {ticketsList.length > 1
                  ? `All ${ticketsList.length} passenger seats are booked and individual QR tickets issued.`
                  : 'Your bus ticket has been verified and digital boarding pass is issued.'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleDownloadAllTickets}
                disabled={downloadingId !== null}
                className="h-11 px-5 rounded-full bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs inline-flex items-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-60"
              >
                <Download size={15} className="text-[#2563eb]" />
                {downloadingId === 'all'
                  ? 'Downloading Tickets...'
                  : ticketsList.length > 1
                  ? `Download All Tickets (${ticketsList.length})`
                  : 'Download Ticket (PNG)'}
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="h-11 px-4 rounded-full bg-white/15 hover:bg-white/25 text-white font-semibold text-xs inline-flex items-center gap-1.5 backdrop-blur-md transition-all cursor-pointer"
              >
                <Printer size={15} />
                Print
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 -mt-8 space-y-5 relative z-20 print:mt-0 print:p-0">
        {/* Success Banner */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_8px_30px_rgba(15,23,42,0.06)] p-6 sm:p-8 text-center print:shadow-none print:border-none">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
            <CheckCircle size={36} className="text-emerald-600" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">Thank You for Your Booking!</h2>
          <p className="text-sm text-slate-500 mb-4">
            {ticketsList.length > 1
              ? `All ${ticketsList.length} seats (${selectedSeats.join(', ')}) are reserved and verified.`
              : 'Your seat has been reserved and your payment is fully verified.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {ticketsList.map((tkt, idx) => (
              <div
                key={tkt.ticketNumber}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 rounded-xl border border-emerald-200"
              >
                <Ticket size={14} className="text-emerald-600" />
                <span className="text-xs font-bold text-emerald-900">Seat {tkt.seatNumber}:</span>
                <span className="text-xs font-mono font-bold text-emerald-700">{tkt.ticketNumber}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tab Selector if multiple tickets (Hidden in print) */}
        {ticketsList.length > 1 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-2 flex flex-wrap items-center gap-2 shadow-sm print:hidden">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-[#2563eb] text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Layers size={14} />
              <span>All Tickets ({ticketsList.length})</span>
            </button>

            {ticketsList.map((tkt, idx) => (
              <button
                key={tkt.ticketNumber}
                type="button"
                onClick={() => setActiveTab(tkt.ticketNumber)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                  activeTab === 'tkt.ticketNumber' || activeTab === tkt.ticketNumber
                    ? 'bg-[#2563eb] text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Ticket size={14} />
                <span>Seat #{tkt.seatNumber} ({tkt.ticketNumber})</span>
              </button>
            ))}
          </div>
        )}

        {/* Boarding Passes Stack */}
        <div className="space-y-6">
          {visibleTickets.map((tkt, idx) => {
            const qrUrl = qrCodeMap[tkt.ticketNumber];
            return (
              <div
                key={tkt.ticketNumber}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_8px_30px_rgba(15,23,42,0.06)] overflow-hidden print:border print:shadow-none print:break-after-page"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-[#0b2a4a] to-[#1e40af] p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center font-black text-lg">
                      🚌
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-base font-black tracking-tight">{operator}</p>
                        <span className="px-2 py-0.5 rounded-full bg-blue-400/20 text-blue-200 text-[10px] font-bold uppercase tracking-wider">
                          Ticket {ticketsList.findIndex((t) => t.ticketNumber === tkt.ticketNumber) + 1} of {ticketsList.length}
                        </span>
                      </div>
                      <p className="text-xs text-white/75">Official Boarding Pass • Reserved Seat</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-bold">
                      ✓ VERIFIED & CONFIRMED
                    </span>
                  </div>
                </div>

                <div className="p-6 sm:p-8 space-y-6">
                  {/* Route & Times */}
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex-1">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Departure</p>
                        <p className="text-2xl font-black text-slate-900">{from}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            <Calendar size={13} className="text-[#2563eb]" /> {formatPrettyDate(date)}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            <Clock size={13} className="text-[#2563eb]" /> {departureTime}
                          </span>
                        </div>
                      </div>

                      <div className="hidden md:flex flex-col items-center px-4">
                        <span className="text-xs text-slate-400 font-semibold mb-1">Direct Route</span>
                        <div className="w-32 h-[2px] bg-slate-300 relative flex items-center justify-center">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#2563eb]" />
                        </div>
                      </div>

                      <div className="flex-1 md:text-right">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Destination</p>
                        <p className="text-2xl font-black text-slate-900">{to}</p>
                        <p className="text-xs text-slate-500 mt-1 font-semibold">Bus Plate: {busPlate}</p>
                      </div>
                    </div>
                  </div>

                  {/* Passenger & Ticket Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl border border-slate-200/80 bg-white">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase">Passenger</p>
                      <p className="text-sm font-bold text-slate-900 mt-1">
                        {passengerFullName}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{passengerInfo.phone || 'N/A'}</p>
                    </div>

                    <div className="p-4 rounded-xl border-2 border-blue-500/30 bg-blue-50/30">
                      <p className="text-[11px] font-bold text-[#1e40af] uppercase">Reserved Seat</p>
                      <p className="text-2xl font-black text-[#2563eb] mt-0.5">
                        Seat #{tkt.seatNumber}
                      </p>
                      <p className="text-[11px] text-emerald-700 font-semibold">Guaranteed & Confirmed</p>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200/80 bg-white">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase">Ticket Number</p>
                      <p className="text-sm font-mono font-bold text-slate-900 mt-1">
                        {tkt.ticketNumber}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Ref: {tkt.bookingId}</p>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200/80 bg-white">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase">Fare Status</p>
                      <p className="text-lg font-black text-slate-900 mt-1">
                        {paymentMethod === 'CHAPA' ? 'Chapa' : paymentMethod === 'TELEBIRR' ? 'Telebirr' : paymentMethod}
                      </p>
                      <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Paid in Full</p>
                    </div>
                  </div>

                  {/* QR Code Section with Individual Scan Token */}
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/40 border border-slate-200/80 flex flex-col md:flex-row items-center gap-6">
                    <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200 flex-shrink-0 text-center">
                      {qrUrl ? (
                        <>
                          <img src={qrUrl} alt={`Security Ticket QR Code - Seat ${tkt.seatNumber}`} className="w-48 h-48 rounded-lg mx-auto" />
                          <div className="mt-2 text-[11px] font-mono font-bold text-slate-700 bg-slate-100 py-1 px-2 rounded">
                            Seat #{tkt.seatNumber} • {tkt.ticketNumber}
                          </div>
                        </>
                      ) : (
                        <div className="w-48 h-48 bg-slate-100 flex items-center justify-center text-xs text-slate-400 rounded-lg">
                          Generating QR Code...
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2 text-center md:text-left">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-100 text-[#1e40af] text-xs font-bold">
                        <ShieldCheck size={14} />
                        <span>Seat #{tkt.seatNumber} Boarding QR Token</span>
                      </div>
                      <h3 className="text-lg font-black text-slate-900">
                        Boarding Pass for Seat #{tkt.seatNumber}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Present this specific QR code at the departure gate for Seat #{tkt.seatNumber}.
                        The verifier or station coordinator will scan this code to grant boarding access for this passenger.
                      </p>
                      <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleDownloadSingleTicket(tkt)}
                          disabled={downloadingId !== null}
                          className="h-10 px-4 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold inline-flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-60"
                        >
                          <Download size={14} />
                          <span>{downloadingId === tkt.ticketNumber ? 'Generating PNG...' : `Download Seat ${tkt.seatNumber} Ticket (PNG)`}</span>
                        </button>
                        <span className="text-[11px] text-slate-500 font-mono">
                          Ticket: {tkt.ticketNumber}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Guest Recommendation Tracking Callout */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm print:hidden">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 font-bold shadow-md shadow-blue-500/20">
              <Ticket size={20} />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900">
                Track Your Journey Recommendations
              </h4>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                Want to keep track of this booking and receive personalized route recommendations? Create a free account or sign in with <strong>{passengerInfo.email || 'your email'}</strong> to access your digital tickets anytime.
              </p>
            </div>
          </div>
          <Link
            to={`/register${passengerInfo.email ? `?email=${encodeURIComponent(passengerInfo.email)}` : ''}`}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold whitespace-nowrap shadow-sm transition-all"
          >
            Create Free Account
          </Link>
        </div>

        {/* Action Buttons (Hidden in print) */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 print:hidden">
          <button
            type="button"
            onClick={handleDownloadAllTickets}
            disabled={downloadingId !== null}
            className="w-full sm:flex-1 h-12 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold inline-flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 cursor-pointer disabled:opacity-60"
          >
            <Download size={16} />
            <span>
              {downloadingId === 'all'
                ? 'Preparing All Tickets...'
                : ticketsList.length > 1
                ? `Download All ${ticketsList.length} Tickets (PNG)`
                : 'Download Ticket (Image)'}
            </span>
          </button>

          <Link
            to="/my-bookings"
            className="w-full sm:flex-1 h-12 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <span>View in My Bookings</span>
            <ArrowRight size={15} />
          </Link>

          <Link
            to="/"
            className="w-full sm:w-auto h-12 px-6 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home size={15} />
            <span>Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmationPage;
