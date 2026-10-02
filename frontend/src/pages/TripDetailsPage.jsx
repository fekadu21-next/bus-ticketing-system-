import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Star,
  CheckCircle,
  MapPin,
  Calendar,
  Clock,
  Bus,
  Snowflake,
  Wifi,
  Armchair,
  Tv,
  ArrowRight,
  Headphones,
  Building2,
  Phone,
  Navigation,
} from 'lucide-react';
import { getTripById, formatEtb, formatPrettyDate, getTripAmenities } from '@/data/dummyTrips';

const AmenityIcon = ({ id, size = 14 }) => {
  if (id === 'ac') return <Snowflake size={size} className="text-[#2563eb]" />;
  if (id === 'wifi') return <Wifi size={size} className="text-[#2563eb]" />;
  if (id === 'seats') return <Armchair size={size} className="text-[#2563eb]" />;
  return <Tv size={size} className="text-[#2563eb]" />;
};

export const TripDetailsPage = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const trip = getTripById(tripId);
  const [selectedSeats, setSelectedSeats] = useState(['07']);
  const [showMore, setShowMore] = useState(false);

  const seatsByRow = useMemo(() => {
    if (!trip?.seats) return [];
    const rows = [];
    for (let row = 1; row <= 10; row += 1) {
      rows.push(trip.seats.filter((seat) => seat.row === row));
    }
    return rows;
  }, [trip]);

  if (!trip) {
    return (
      <div className="bg-[#f4f7fb] min-h-screen flex items-center justify-center px-6 py-12">
        <div className="text-center bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-md w-full">
          <h1 className="text-2xl font-black text-slate-900 mb-2">Trip Not Found</h1>
          <p className="text-sm text-slate-500 mb-6">The requested bus trip is not available. Please return to search.</p>
          <Link
            to="/search-trips"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#2563eb] text-white rounded-xl font-bold text-sm"
          >
            <ArrowLeft size={16} />
            Back to Search
          </Link>
        </div>
      </div>
    );
  }

  const toggleSeat = (seat) => {
    if (seat.status === 'booked') return;
    setSelectedSeats((current) =>
      current.includes(seat.label) ? current.filter((label) => label !== seat.label) : [...current, seat.label],
    );
  };

  const amenities = getTripAmenities(trip);
  const selectedCount = selectedSeats.length;
  const totalPrice = trip.price * (selectedCount || 1);
  const reviews = trip.reviewsList?.length ? trip.reviewsList : [];

  return (
    <div className="bg-[#f4f7fb] min-h-screen text-slate-800 pb-12">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/crops/detail_banner.jpg" alt="" className="w-full h-full object-cover object-[75%_center]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#071833]/88 via-[#0b2a4a]/60 to-transparent" />
        </div>
        <div className="relative z-10 max-w-[1180px] mx-auto px-4 sm:px-6 pt-8 pb-16">
          <Link to="/search-trips" className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-white/90">
            <ArrowLeft size={14} />
            Back to Search Results
          </Link>
          <h1 className="mt-3 text-[32px] sm:text-[40px] font-black text-white tracking-tight">Trip Details</h1>
          <p className="mt-1 text-[13px] text-white/80">Everything you need to know about your trip.</p>
        </div>
      </section>

      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 -mt-8 space-y-4 relative z-20">
        <div className="bg-white rounded-[20px] border border-slate-200/80 shadow-[0_8px_24px_rgba(15,23,42,0.06)] p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row lg:items-center gap-5">
            <div className="relative w-full lg:w-[210px] h-[128px] rounded-[14px] overflow-hidden bg-slate-100 flex-shrink-0">
              <img src={trip.detailTopImage || trip.image} alt={trip.operator} className="w-full h-full object-cover" />
              {trip.badge && (
                <span className="absolute top-2.5 left-2.5 bg-[#22c55e] text-white text-[10px] font-bold px-2 py-1 rounded-md">
                  {trip.badge}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-full ${trip.logoBg} text-white font-black text-[11px] flex items-center justify-center`}>
                  {trip.logoText}
                </div>
                <div>
                  <h2 className="text-[18px] font-extrabold text-slate-900 leading-tight">{trip.operator}</h2>
                  <p className="text-[12px] text-slate-500">{trip.orgType}</p>
                </div>
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1 text-[12px] text-slate-600">
                  <Star size={13} fill="#f59e0b" color="#f59e0b" />
                  <span className="font-semibold text-slate-800">{trip.rating}</span>
                  <span className="text-slate-400">({trip.reviews} reviews)</span>
                </span>
                {trip.verified && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#16a34a]">
                    <CheckCircle size={13} />
                    Verified Operator
                  </span>
                )}
              </div>
            </div>

            <div className="lg:text-right flex lg:flex-col items-center lg:items-end justify-between gap-3">
              <div>
                <p className="text-[24px] font-black text-slate-900 leading-none">{formatEtb(trip.price)}</p>
                <p className="text-[12px] text-slate-400 mt-1">per person</p>
              </div>
              <p className="text-[12px] font-semibold text-[#16a34a]">{trip.seatsAvailable} seats available</p>
              <a
                href="#seat-selection"
                className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[12px] font-semibold"
              >
                Select Seats
                <ArrowRight size={14} />
              </a>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[18px] border border-slate-200/80 px-4 sm:px-6 py-4 grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="flex items-start gap-2.5">
            <MapPin size={16} className="text-[#2563eb] mt-0.5" />
            <div>
              <p className="text-[13px] font-bold text-slate-900">{trip.from}</p>
              <p className="text-[11px] text-slate-400">Departure</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <MapPin size={16} className="text-[#2563eb] mt-0.5" />
            <div>
              <p className="text-[13px] font-bold text-slate-900">{trip.to}</p>
              <p className="text-[11px] text-slate-400">Destination</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Calendar size={16} className="text-[#2563eb] mt-0.5" />
            <div>
              <p className="text-[13px] font-bold text-slate-900">{formatPrettyDate(trip.date)}</p>
              <p className="text-[11px] text-slate-400">Date</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Clock size={16} className="text-[#2563eb] mt-0.5" />
            <div>
              <p className="text-[13px] font-bold text-slate-900">{trip.arrivalTime}</p>
              <p className="text-[11px] text-slate-400">Arrival Time</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Clock size={16} className="text-[#2563eb] mt-0.5" />
            <div>
              <p className="text-[13px] font-bold text-slate-900">{trip.duration}</p>
              <p className="text-[11px] text-slate-400">Duration</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[18px] border border-slate-200/80 px-4 sm:px-6 py-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-start gap-2.5">
            <span className="text-[#2563eb] font-bold">$</span>
            <div>
              <p className="text-[11px] text-slate-400">Price</p>
              <p className="text-[13px] font-bold text-slate-900">{formatEtb(trip.price)}</p>
              <p className="text-[11px] text-slate-400">per person</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Armchair size={16} className="text-[#2563eb] mt-0.5" />
            <div>
              <p className="text-[11px] text-slate-400">Available Seats</p>
              <p className="text-[13px] font-bold text-slate-900">{trip.seatsAvailable} seats</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Bus size={16} className="text-[#2563eb] mt-0.5" />
            <div>
              <p className="text-[11px] text-slate-400">Bus Type</p>
              <p className="text-[13px] font-bold text-slate-900">{trip.busType}</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Snowflake size={16} className="text-[#2563eb] mt-0.5" />
            <div>
              <p className="text-[11px] text-slate-400">Amenities</p>
              <p className="text-[13px] font-bold text-slate-900">{amenities.map((item) => item.label).join(', ')}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <article className="bg-white rounded-[18px] border border-slate-200/80 p-5">
            <h3 className="text-[15px] font-extrabold text-slate-900 mb-4">About the Operator</h3>
            <div className="flex items-center gap-2.5">
              <div className={`w-10 h-10 rounded-full ${trip.logoBg} text-white font-black text-[12px] flex items-center justify-center`}>
                {trip.logoText}
              </div>
              <div>
                <h4 className="text-[14px] font-bold text-slate-900">{trip.operator}</h4>
                <p className="text-[12px] text-slate-500">{trip.orgType}</p>
                <p className="text-[12px] text-slate-600 mt-0.5">
                  {trip.rating} ({trip.reviews} reviews)
                </p>
              </div>
            </div>

            {showMore && <p className="mt-3 text-[12px] text-slate-600 leading-relaxed">{trip.about}</p>}

            <div className="grid grid-cols-2 gap-4 mt-5">
              <div className="flex items-start gap-2">
                <Building2 size={14} className="text-[#2563eb] mt-0.5" />
                <div>
                  <p className="text-[11px] text-slate-400">Established</p>
                  <p className="text-[12px] font-semibold text-slate-900">{trip.established}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-[#2563eb] mt-0.5" />
                <div>
                  <p className="text-[11px] text-slate-400">Head Office</p>
                  <p className="text-[12px] font-semibold text-slate-900">{trip.headOffice}</p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 mt-4">
              <Phone size={14} className="text-[#2563eb] mt-0.5" />
              <div>
                <p className="text-[11px] text-slate-400">Contact</p>
                <p className="text-[12px] font-semibold text-slate-900">{trip.phone}</p>
                <p className="text-[12px] text-slate-500">{trip.email}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowMore((value) => !value)}
              className="mt-5 h-9 px-4 rounded-full border border-slate-200 text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
            >
              {showMore ? 'View Less' : 'View More'}
            </button>
          </article>

          <article className="bg-white rounded-[18px] border border-slate-200/80 p-5">
            <h3 className="text-[15px] font-extrabold text-slate-900 mb-4">Bus Information</h3>
            <div className="w-full h-[170px] rounded-[14px] overflow-hidden bg-slate-100">
              <img src={trip.interiorImage} alt="Bus interior" className="w-full h-full object-cover" />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-[11px] text-slate-400">Bus Number</p>
                <p className="text-[13px] font-bold text-slate-900">{trip.busNumber}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400">Total Seats</p>
                <p className="text-[13px] font-bold text-slate-900">{trip.totalSeats}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400">Bus Type</p>
                <p className="text-[13px] font-bold text-slate-900">{trip.busType}</p>
              </div>
            </div>
            <p className="text-[12px] font-bold text-slate-900 mt-4 mb-2">Features</p>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-[12px] text-slate-600">
              {amenities.map((amenity) => (
                <span key={amenity.id} className="inline-flex items-center gap-1.5">
                  <AmenityIcon id={amenity.id} />
                  {amenity.label}
                </span>
              ))}
            </div>
          </article>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          <article className="bg-white rounded-[18px] border border-slate-200/80 p-5">
            <h3 className="text-[15px] font-extrabold text-slate-900 mb-5">Route &amp; Schedule</h3>
            <div className="relative pl-2">
              <div className="absolute left-[11px] top-3 bottom-3 w-px bg-[#c7dbff]" />
              <div className="flex items-start justify-between gap-4 relative">
                <div className="flex items-start gap-3">
                  <span className="w-3 h-3 rounded-full bg-[#2563eb] ring-4 ring-[#dbeafe] mt-1.5 relative z-10" />
                  <div>
                    <p className="text-[12px] font-bold text-[#2563eb]">{trip.departureTime}</p>
                    <p className="text-[14px] font-extrabold text-slate-900">{trip.from}</p>
                    <p className="text-[12px] text-slate-500">Main Station</p>
                  </div>
                </div>
                <img
                  src={trip.addisLandmark}
                  alt={trip.from}
                  className="w-[92px] h-[64px] rounded-xl object-cover border border-slate-100"
                />
              </div>

              <div className="pl-7 py-4">
                <span className="inline-flex px-3 py-1 rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600">
                  {trip.duration} ({trip.distance})
                </span>
              </div>

              <div className="flex items-start justify-between gap-4 relative">
                <div className="flex items-start gap-3">
                  <span className="w-3 h-3 rounded-full bg-[#2563eb] ring-4 ring-[#dbeafe] mt-1.5 relative z-10" />
                  <div>
                    <p className="text-[12px] font-bold text-[#2563eb]">{trip.arrivalTime}</p>
                    <p className="text-[14px] font-extrabold text-slate-900">{trip.to}</p>
                    <p className="text-[12px] text-slate-500">Bus Station</p>
                  </div>
                </div>
                <img
                  src={trip.bahirdarLandmark}
                  alt={trip.to}
                  className="w-[92px] h-[64px] rounded-xl object-cover border border-slate-100"
                />
              </div>
            </div>
            <button
              type="button"
              className="mt-5 h-9 px-4 rounded-full border border-slate-200 text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
            >
              View Map
            </button>
          </article>

          <aside id="seat-selection" className="bg-white rounded-[18px] border border-slate-200/80 p-5">
            <h3 className="text-[15px] font-extrabold text-slate-900 mb-4">Seat Selection</h3>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-4">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-[3px] bg-emerald-100 border border-emerald-400" /> Available
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-[3px] bg-[#2563eb]" /> Selected
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-[3px] bg-slate-200 border border-slate-300" /> Booked
              </span>
            </div>

            <div className="bg-[#f8fafc] border border-slate-200 rounded-[22px] p-4">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                <span>Front</span>
                <span className="inline-flex items-center gap-1 normal-case tracking-normal text-slate-500">
                  <Navigation size={12} /> Driver
                </span>
              </div>
              <div className="space-y-1.5">
                {seatsByRow.map((rowSeats) => (
                  <div key={rowSeats[0]?.row} className="flex items-center justify-between gap-2">
                    <div className="flex gap-1.5">
                      {rowSeats.slice(0, 2).map((seat) => {
                        const isSelected = selectedSeats.includes(seat.label);
                        const isBooked = seat.status === 'booked';
                        return (
                          <button
                            key={seat.id}
                            type="button"
                            disabled={isBooked}
                            onClick={() => toggleSeat(seat)}
                            className={`w-7 h-7 rounded-[6px] text-[9px] font-bold ${
                              isBooked
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : isSelected
                                  ? 'bg-[#2563eb] text-white'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            }`}
                          >
                            {seat.label}
                          </button>
                        );
                      })}
                    </div>
                    <div className="w-4" />
                    <div className="flex gap-1.5">
                      {rowSeats.slice(2, 4).map((seat) => {
                        const isSelected = selectedSeats.includes(seat.label);
                        const isBooked = seat.status === 'booked';
                        return (
                          <button
                            key={seat.id}
                            type="button"
                            disabled={isBooked}
                            onClick={() => toggleSeat(seat)}
                            className={`w-7 h-7 rounded-[6px] text-[9px] font-bold ${
                              isBooked
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : isSelected
                                  ? 'bg-[#2563eb] text-white'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            }`}
                          >
                            {seat.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 bg-[#f8fafc] rounded-[14px] p-3.5 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-400">Selected Seat</p>
                <p className="text-[18px] font-black text-slate-900">{selectedSeats.length ? selectedSeats.join(', ') : '—'}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-slate-400">Price</p>
                <p className="text-[18px] font-black text-slate-900">{formatEtb(totalPrice)}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/passenger-info', { state: { tripData: trip, selectedSeats } })}
              className="mt-4 w-full h-11 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[13px] font-semibold inline-flex items-center justify-center gap-2"
            >
              Continue to Passenger Info
              <ArrowRight size={15} />
            </button>
          </aside>
        </div>

        <section>
          <h3 className="text-[15px] font-extrabold text-slate-900 mb-3">Trip Features</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { icon: Armchair, title: 'Comfortable Seats', text: 'Reclining seats for a relaxing journey.' },
              { icon: Navigation, title: 'Experienced Drivers', text: 'Safe and professional drivers.' },
              { icon: Clock, title: 'On-time Departure', text: 'We value your time.' },
              { icon: Headphones, title: '24/7 Support', text: 'Help whenever you need it.' },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-[16px] border border-slate-200/80 p-4">
                <div className="w-8 h-8 rounded-full bg-[#eef4ff] text-[#2563eb] flex items-center justify-center mb-2">
                  <item.icon size={16} />
                </div>
                <h4 className="text-[13px] font-bold text-slate-900">{item.title}</h4>
                <p className="text-[12px] text-slate-500 mt-1">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <article className="bg-white rounded-[18px] border border-slate-200/80 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-extrabold text-slate-900">Customer Reviews</h3>
            <button type="button" className="text-[12px] font-semibold text-[#2563eb]">
              View All Reviews →
            </button>
          </div>
          <div className="flex items-center gap-3 mb-5">
            <span className="text-[32px] font-black text-slate-900 leading-none">{trip.rating}</span>
            <div>
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, index) => (
                  <Star key={index} size={14} fill="currentColor" />
                ))}
              </div>
              <p className="text-[12px] text-slate-400">({trip.reviews} reviews)</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((review) => (
              <div key={review.id} className="rounded-[14px] border border-slate-100 bg-[#f8fafc] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <img src={review.avatar} alt={review.name} className="w-8 h-8 rounded-full object-cover" />
                    <div>
                      <p className="text-[12px] font-bold text-slate-900">{review.name}</p>
                      <p className="text-[11px] text-slate-400">{review.date}</p>
                    </div>
                  </div>
                  <div className="flex text-amber-400">
                    {[...Array(review.rating)].map((_, index) => (
                      <Star key={index} size={11} fill="currentColor" />
                    ))}
                  </div>
                </div>
                <p className="mt-3 text-[12px] text-slate-600 leading-relaxed">{review.comment}</p>
              </div>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
};

export default TripDetailsPage;
