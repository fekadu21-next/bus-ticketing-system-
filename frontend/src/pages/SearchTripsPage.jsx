import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Star,
  Search,
  ShieldCheck,
  Clock,
  Smartphone,
  Headphones,
  Lock,
  RotateCcw,
  Snowflake,
  Wifi,
  Armchair,
  Tv,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import TripSearchBar from '@/components/TripSearchBar';
import {
  DUMMY_TRIPS,
  formatEtb,
  formatPrettyDate,
  OPERATORS,
  getTripAmenities,
} from '@/data/dummyTrips';

const TIME_FILTERS = [
  { id: 'morning', label: 'Morning (6:00 AM - 11:59 AM)' },
  { id: 'afternoon', label: 'Afternoon (12:00 PM - 4:59 PM)' },
  { id: 'evening', label: 'Evening (5:00 PM - 11:59 PM)' },
];

const PAGE_SIZE = 5;
const NAMED_OPERATORS = OPERATORS.map((op) => op.name);

const minutesFromLabel = (label) => {
  const match = String(label).match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 0;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3].toUpperCase();
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

const AmenityIcon = ({ id }) => {
  if (id === 'ac') return <Snowflake size={13} className="text-[#2563eb]" />;
  if (id === 'wifi') return <Wifi size={13} className="text-[#2563eb]" />;
  if (id === 'seats') return <Armchair size={13} className="text-[#2563eb]" />;
  return <Tv size={13} className="text-[#2563eb]" />;
};

export const SearchTripsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [origin, setOrigin] = useState(searchParams.get('from') || 'Addis Ababa');
  const [destination, setDestination] = useState(searchParams.get('to') || 'Bahir Dar');
  const [departureDate, setDepartureDate] = useState(searchParams.get('date') || '2024-10-10');
  const [periods, setPeriods] = useState([]);
  const [priceRange, setPriceRange] = useState(2000);
  const [operatorSearch, setOperatorSearch] = useState('');
  const [selectedOperators, setSelectedOperators] = useState([]);
  const [orgTypes, setOrgTypes] = useState([]);
  const [minSeats, setMinSeats] = useState('all');
  const [sortBy, setSortBy] = useState('departure');
  const [currentPage, setCurrentPage] = useState(1);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    setSearchParams({
      from: origin,
      to: destination,
      date: departureDate,
    });
  };

  const toggleArrayValue = (list, value, setter) => {
    setCurrentPage(1);
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  };

  const clearAllFilters = () => {
    setPeriods([]);
    setPriceRange(2000);
    setOperatorSearch('');
    setSelectedOperators([]);
    setOrgTypes([]);
    setMinSeats('all');
    setSortBy('departure');
    setCurrentPage(1);
  };

  const operatorOptions = useMemo(() => {
    const counts = DUMMY_TRIPS.reduce((acc, trip) => {
      const key = NAMED_OPERATORS.includes(trip.operator) ? trip.operator : 'Others';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const named = OPERATORS.map((op) => ({
      ...op,
      count: counts[op.name] || 0,
    })).filter((op) => {
      if (!operatorSearch.trim()) return true;
      return op.name.toLowerCase().includes(operatorSearch.toLowerCase());
    });

    return {
      named,
      others: counts.Others || 0,
    };
  }, [operatorSearch]);

  const filteredTrips = useMemo(() => {
    const from = searchParams.get('from') || origin;
    const to = searchParams.get('to') || destination;

    let trips = DUMMY_TRIPS.filter((trip) => {
      const matchesRoute = (!from || trip.from === from) && (!to || trip.to === to);
      const matchesPeriod = periods.length === 0 || periods.includes(trip.period);
      const matchesPrice = trip.price <= priceRange;
      const matchesOperator =
        selectedOperators.length === 0 ||
        selectedOperators.some((name) =>
          name === 'Others' ? !NAMED_OPERATORS.includes(trip.operator) : trip.operator === name,
        );
      const matchesOrg = orgTypes.length === 0 || orgTypes.includes(trip.orgType);
      let matchesSeats = true;
      if (minSeats === '1') matchesSeats = trip.seatsAvailable >= 1;
      else if (minSeats === '5') matchesSeats = trip.seatsAvailable >= 5;
      else if (minSeats === '10') matchesSeats = trip.seatsAvailable >= 10;
      else if (minSeats === '20') matchesSeats = trip.seatsAvailable >= 20;
      return matchesRoute && matchesPeriod && matchesPrice && matchesOperator && matchesOrg && matchesSeats;
    });

    if (sortBy === 'price-low') trips = [...trips].sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-high') trips = [...trips].sort((a, b) => b.price - a.price);
    else if (sortBy === 'seats') trips = [...trips].sort((a, b) => b.seatsAvailable - a.seatsAvailable);
    else trips = [...trips].sort((a, b) => minutesFromLabel(a.departureTime) - minutesFromLabel(b.departureTime));

    return trips;
  }, [searchParams, origin, destination, periods, priceRange, selectedOperators, orgTypes, minSeats, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredTrips.length / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);
  const pagedTrips = filteredTrips.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const routeFrom = searchParams.get('from') || origin || 'Addis Ababa';
  const routeTo = searchParams.get('to') || destination || 'Bahir Dar';
  const dateLabel = formatPrettyDate(searchParams.get('date') || departureDate);

  const orgCounts = useMemo(
    () => ({
      private: DUMMY_TRIPS.filter((trip) => trip.orgType === 'Private Bus Company').length,
      association: DUMMY_TRIPS.filter((trip) => trip.orgType === 'Transport Association').length,
    }),
    [],
  );

  return (
    <div className="bg-[#f4f7fb] min-h-screen text-slate-800">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/images/crops/search_banner.jpg"
            alt=""
            className="w-full h-full object-cover object-[70%_center]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#071833]/85 via-[#0b2a4a]/55 to-transparent" />
        </div>

        <div className="relative z-10 max-w-[1180px] mx-auto px-4 sm:px-6 pt-10 pb-16 sm:pt-14 sm:pb-20">
          <p className="text-[11px] font-bold tracking-[0.22em] text-white/80 uppercase mb-3">
            Search Bus Trips
          </p>
          <h1 className="text-[34px] sm:text-[44px] leading-[1.1] font-black text-white tracking-tight max-w-xl">
            Find Your Perfect Trip
          </h1>
          <p className="mt-3 text-[14px] sm:text-[15px] text-white/85 max-w-md">
            Compare operators, check prices, choose your seat and travel with confidence.
          </p>

          <div className="mt-8 max-w-[760px]">
            <TripSearchBar
              origin={origin}
              destination={destination}
              departureDate={departureDate}
              onOriginChange={setOrigin}
              onDestinationChange={setDestination}
              onDateChange={setDepartureDate}
              onSubmit={handleSearchSubmit}
            />
          </div>
        </div>
      </section>

      <section className="bg-white border-b border-slate-100">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: ShieldCheck, title: 'Safe & Reliable', text: 'Trusted operators and secure payments.' },
            { icon: Clock, title: 'Real-Time Availability', text: 'See live seat availability and choose your best option.' },
            { icon: Smartphone, title: 'Book Anywhere', text: 'Use our website or mobile app for a seamless experience.' },
            { icon: Headphones, title: '24/7 Support', text: "We're here to help, anytime, anywhere." },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#eef4ff] text-[#2563eb] flex items-center justify-center flex-shrink-0">
                <item.icon size={18} />
              </div>
              <div>
                <h4 className="text-[13px] font-bold text-slate-900">{item.title}</h4>
                <p className="text-[12px] text-slate-500 leading-snug mt-0.5">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-[250px_minmax(0,1fr)] gap-6">
        <aside className="bg-white rounded-[18px] border border-slate-200/80 shadow-[0_8px_24px_rgba(15,23,42,0.04)] p-5 h-fit">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[16px] font-bold text-slate-900">Filters</h2>
            <button type="button" onClick={clearAllFilters} className="text-[12px] font-semibold text-[#2563eb]">
              Clear All
            </button>
          </div>

          <div className="space-y-5">
            <div>
              <h3 className="text-[12px] font-bold text-slate-900 mb-3">Departure Time</h3>
              <div className="space-y-2.5">
                {TIME_FILTERS.map((item) => (
                  <label key={item.id} className="flex items-center gap-2.5 cursor-pointer text-[12px] text-slate-600">
                    <input
                      type="checkbox"
                      checked={periods.includes(item.id)}
                      onChange={() => toggleArrayValue(periods, item.id, setPeriods)}
                      className="w-3.5 h-3.5 rounded border-slate-300 text-[#2563eb] focus:ring-[#2563eb]"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-[12px] font-bold text-slate-900 mb-3">Price Range</h3>
              <input
                type="range"
                min="600"
                max="2000"
                step="50"
                value={priceRange}
                onChange={(e) => {
                  setCurrentPage(1);
                  setPriceRange(Number(e.target.value));
                }}
                className="w-full accent-[#2563eb] cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                <span>ETB 600</span>
                <span>ETB 2,000</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-[12px] font-bold text-slate-900 mb-3">Operator</h3>
              <div className="relative mb-3">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search operators..."
                  value={operatorSearch}
                  onChange={(e) => setOperatorSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-[#f8fafc] border border-slate-200 rounded-lg text-[12px] outline-none focus:border-[#2563eb]"
                />
              </div>
              <div className="space-y-2.5">
                {operatorOptions.named.map((op) => (
                  <label key={op.id} className="flex items-center justify-between cursor-pointer text-[12px] text-slate-600">
                    <span className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={selectedOperators.includes(op.name)}
                        onChange={() => toggleArrayValue(selectedOperators, op.name, setSelectedOperators)}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-[#2563eb] focus:ring-[#2563eb]"
                      />
                      {op.name}
                    </span>
                    <span className="text-slate-400">({op.count})</span>
                  </label>
                ))}
                <label className="flex items-center justify-between cursor-pointer text-[12px] text-slate-600">
                  <span className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={selectedOperators.includes('Others')}
                      onChange={() => toggleArrayValue(selectedOperators, 'Others', setSelectedOperators)}
                      className="w-3.5 h-3.5 rounded border-slate-300 text-[#2563eb] focus:ring-[#2563eb]"
                    />
                    Others
                  </span>
                  <span className="text-slate-400">({operatorOptions.others})</span>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-[12px] font-bold text-slate-900 mb-3">Organization Type</h3>
              <div className="space-y-2.5">
                <label className="flex items-center justify-between cursor-pointer text-[12px] text-slate-600">
                  <span className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={orgTypes.includes('Private Bus Company')}
                      onChange={() => toggleArrayValue(orgTypes, 'Private Bus Company', setOrgTypes)}
                      className="w-3.5 h-3.5 rounded border-slate-300 text-[#2563eb] focus:ring-[#2563eb]"
                    />
                    Private Bus Company
                  </span>
                  <span className="text-slate-400">({orgCounts.private})</span>
                </label>
                <label className="flex items-center justify-between cursor-pointer text-[12px] text-slate-600">
                  <span className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={orgTypes.includes('Transport Association')}
                      onChange={() => toggleArrayValue(orgTypes, 'Transport Association', setOrgTypes)}
                      className="w-3.5 h-3.5 rounded border-slate-300 text-[#2563eb] focus:ring-[#2563eb]"
                    />
                    Transport Association
                  </span>
                  <span className="text-slate-400">({orgCounts.association})</span>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-[12px] font-bold text-slate-900 mb-3">Available Seats</h3>
              <select
                value={minSeats}
                onChange={(e) => {
                  setCurrentPage(1);
                  setMinSeats(e.target.value);
                }}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[12px] text-slate-700 outline-none focus:border-[#2563eb]"
              >
                <option value="all">All Seats</option>
                <option value="1">1+ Seat Available</option>
                <option value="5">5+ Seats Available</option>
                <option value="10">10+ Seats Available</option>
                <option value="20">20+ Seats Available</option>
              </select>
            </div>
          </div>
        </aside>

        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-[20px] font-extrabold text-slate-900">{filteredTrips.length} Trips Found</h2>
              <p className="text-[12px] text-slate-500 mt-0.5">
                From {routeFrom} to {routeTo} on {dateLabel}
              </p>
            </div>
            <label className="flex items-center gap-2 text-[12px] text-slate-500">
              Sort by:
              <select
                value={sortBy}
                onChange={(e) => {
                  setCurrentPage(1);
                  setSortBy(e.target.value);
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[12px] font-semibold text-slate-800 outline-none"
              >
                <option value="departure">Departure Time</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="seats">Most Seats Available</option>
              </select>
            </label>
          </div>

          <div className="space-y-3.5">
            {pagedTrips.length === 0 ? (
              <div className="bg-white rounded-[18px] p-10 text-center border border-slate-200">
                <p className="text-base font-bold text-slate-800 mb-1">No bus trips found</p>
                <p className="text-xs text-slate-500 mb-4">Try clearing your filters or selecting a different route.</p>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="px-5 py-2.5 bg-[#2563eb] text-white rounded-xl text-xs font-bold"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              pagedTrips.map((trip) => (
                <article
                  key={trip.id}
                  className="bg-white rounded-[18px] border border-slate-200/80 shadow-[0_6px_20px_rgba(15,23,42,0.04)] p-3.5 sm:p-4"
                >
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative w-full md:w-[168px] h-[124px] rounded-[14px] overflow-hidden bg-slate-100 flex-shrink-0">
                      <img src={trip.image} alt={trip.operator} className="w-full h-full object-cover" />
                      {trip.badge && (
                        <span className="absolute top-2.5 left-2.5 bg-[#22c55e] text-white text-[10px] font-bold px-2 py-1 rounded-md">
                          {trip.badge}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-9 h-9 rounded-full ${trip.logoBg} text-white font-black text-[11px] flex items-center justify-center`}
                          >
                            {trip.logoText}
                          </div>
                          <div>
                            <h3 className="text-[15px] font-bold text-slate-900 leading-tight">{trip.operator}</h3>
                            <p className="text-[11px] text-slate-500">{trip.orgType}</p>
                          </div>
                        </div>
                        <div className="hidden sm:flex items-center gap-1 text-[12px] text-slate-600">
                          <Star size={13} fill="#f59e0b" color="#f59e0b" />
                          <span className="font-semibold text-slate-800">{trip.rating}</span>
                          <span className="text-slate-400">({trip.reviews} reviews)</span>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
                        <div>
                          <p className="text-[14px] font-bold text-slate-900">{trip.departureTime}</p>
                          <p className="text-[11px] text-slate-500">{trip.from}</p>
                        </div>
                        <div className="text-slate-300">→</div>
                        <div>
                          <p className="text-[14px] font-bold text-slate-900">{trip.arrivalTime}</p>
                          <p className="text-[11px] text-slate-500">{trip.to}</p>
                        </div>
                        <span className="text-[11px] text-slate-400">{trip.duration}</span>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                        {getTripAmenities(trip).map((amenity) => (
                          <span key={amenity.id} className="inline-flex items-center gap-1.5">
                            <AmenityIcon id={amenity.id} />
                            {amenity.label}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="md:min-w-[150px] flex md:flex-col items-end justify-between md:justify-start gap-3 md:pl-2">
                      <div className="text-right">
                        <p className="text-[20px] font-extrabold text-slate-900 leading-none">{formatEtb(trip.price)}</p>
                        <p className="text-[11px] text-slate-400 mt-1">per person</p>
                      </div>
                      <p className="text-[12px] font-semibold text-[#16a34a]">{trip.seatsAvailable} seats available</p>
                      <Link
                        to={`/trips/${trip.id}`}
                        className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[12px] font-semibold"
                      >
                        View Details
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>

          {filteredTrips.length > 0 && (
            <div className="flex items-center justify-center gap-2 pt-7">
              <button
                type="button"
                className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-500 flex items-center justify-center disabled:opacity-40"
                disabled={page === 1}
                onClick={() => setCurrentPage((value) => Math.max(1, value - 1))}
              >
                <ChevronLeft size={15} />
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setCurrentPage(num)}
                  className={`w-8 h-8 rounded-lg text-[12px] font-bold ${
                    num === page
                      ? 'bg-[#2563eb] text-white'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-500 flex items-center justify-center disabled:opacity-40"
                disabled={page === totalPages}
                onClick={() => setCurrentPage((value) => Math.min(totalPages, value + 1))}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          )}
        </section>
      </div>

      <section className="max-w-[1180px] mx-auto px-4 sm:px-6 pb-12">
        <div className="bg-[#eef5ff] rounded-[22px] px-6 py-7 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-[#2563eb] text-white flex items-center justify-center flex-shrink-0">
              <Headphones size={18} />
            </div>
            <div>
              <h4 className="text-[14px] font-bold text-slate-900">Need Help?</h4>
              <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">
                Our support team is available 24/7 to assist you with your booking.
              </p>
              <Link to="/contact" className="inline-flex items-center gap-1 mt-2 text-[12px] font-semibold text-[#2563eb]">
                Contact Support
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-[#2563eb] text-white flex items-center justify-center flex-shrink-0">
              <Lock size={18} />
            </div>
            <div>
              <h4 className="text-[14px] font-bold text-slate-900">Secure Payment</h4>
              <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">
                Your information is always protected.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-[#2563eb] text-white flex items-center justify-center flex-shrink-0">
              <RotateCcw size={18} />
            </div>
            <div>
              <h4 className="text-[14px] font-bold text-slate-900">Easy Cancellation</h4>
              <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">
                Cancel or modify your booking with ease.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SearchTripsPage;
