import React from 'react';
import { MapPin, Calendar, Search, ChevronDown } from 'lucide-react';
import { CITIES } from '@/data/dummyTrips';

const formatDate = (value) => {
  if (!value) return 'Select date';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const TripSearchBar = ({
  origin,
  destination,
  departureDate,
  onOriginChange,
  onDestinationChange,
  onDateChange,
  onSubmit,
  variant = 'hero',
  searchLabel = 'Search Trips',
}) => {
  const isHero = variant === 'hero';

  return (
    <form
      onSubmit={onSubmit}
      className={
        isHero
          ? 'flex flex-col md:flex-row md:items-center gap-2 md:gap-0 bg-white rounded-[28px] shadow-[0_12px_30px_rgba(15,23,42,0.16)] border border-white px-2 py-2 md:py-1 md:pl-3 md:pr-1.5'
          : 'flex flex-col md:flex-row md:items-center gap-3 md:gap-0 bg-white rounded-xl shadow-lg p-2'
      }
    >
      <div className={`flex items-center gap-2.5 ${isHero ? 'flex-1 px-3 py-1.5' : 'flex-1 px-3 py-2'}`}>
        <MapPin size={18} className="text-[#2563eb] flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <label htmlFor="trip-from" className="block text-[11px] font-medium text-slate-400 leading-none mb-1">
            From
          </label>
          <div className="relative">
            <select
              id="trip-from"
              value={origin}
              onChange={(e) => onOriginChange(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-[13px] font-semibold text-slate-900 cursor-pointer appearance-none pr-5"
            >
              <option value="">Select origin</option>
              {CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className={`hidden md:block w-px bg-slate-200 ${isHero ? 'h-10' : 'my-2'}`} />

      <div className={`flex items-center gap-2.5 ${isHero ? 'flex-1 px-3 py-1.5' : 'flex-1 px-3 py-2'}`}>
        <MapPin size={18} className="text-[#2563eb] flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <label htmlFor="trip-to" className="block text-[11px] font-medium text-slate-400 leading-none mb-1">
            To
          </label>
          <div className="relative">
            <select
              id="trip-to"
              value={destination}
              onChange={(e) => onDestinationChange(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-[13px] font-semibold text-slate-900 cursor-pointer appearance-none pr-5"
            >
              <option value="">Select destination</option>
              {CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className={`hidden md:block w-px bg-slate-200 ${isHero ? 'h-10' : 'my-2'}`} />

      <div className={`flex items-center gap-2.5 ${isHero ? 'flex-1 px-3 py-1.5' : 'flex-1 px-3 py-2'}`}>
        <Calendar size={18} className="text-[#2563eb] flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <label htmlFor="trip-date" className="block text-[11px] font-medium text-slate-400 leading-none mb-1">
            Departure Date
          </label>
          <div className="relative">
            <span className="block text-[13px] font-semibold text-slate-900 pr-5 pointer-events-none">
              {formatDate(departureDate)}
            </span>
            <input
              id="trip-date"
              type="date"
              value={departureDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <button
        type="submit"
        className={`${
          isHero
            ? 'h-10 px-5 rounded-full mx-1'
            : 'px-6 py-3 rounded-xl'
        } bg-[#2563eb] text-white font-semibold hover:bg-[#1d4ed8] transition-colors duration-200 flex items-center justify-center gap-2 flex-shrink-0 text-[13px]`}
      >
        <Search size={16} />
        {searchLabel}
      </button>
    </form>
  );
};

export default TripSearchBar;
