import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, Calendar, Bus } from 'lucide-react';

export const SearchTripsPage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const initialFrom = searchParams.get('from') || 'Addis Ababa';
  const initialTo = searchParams.get('to') || 'Hawassa';
  const initialDate = searchParams.get('date') || '';

  const [fromCity] = useState(initialFrom);
  const [toCity] = useState(initialTo);
  const [travelDate] = useState(initialDate);

  const mockTrips = [
    {
      id: 'trip-1',
      operator: 'Selam Bus',
      busType: 'Luxury VIP Coach (AC, Wi-Fi)',
      departureTime: '06:00 AM',
      arrivalTime: '11:00 AM',
      duration: '5h 00m',
      origin: 'Addis Ababa (Meskel Sq.)',
      destination: 'Hawassa Bus Terminal',
      price: '550 ETB',
      seatsAvailable: 14,
      rating: 4.8,
    },
    {
      id: 'trip-2',
      operator: 'Abay Bus',
      busType: 'Standard Express Coach',
      departureTime: '07:30 AM',
      arrivalTime: '12:45 PM',
      duration: '5h 15m',
      origin: 'Addis Ababa (Autobus Tera)',
      destination: 'Hawassa Bus Terminal',
      price: '480 ETB',
      seatsAvailable: 8,
      rating: 4.6,
    },
    {
      id: 'trip-3',
      operator: 'Golden Bus',
      busType: 'Executive Business Coach',
      departureTime: '09:00 AM',
      arrivalTime: '02:00 PM',
      duration: '5h 00m',
      origin: 'Addis Ababa (Bole)',
      destination: 'Hawassa Bus Terminal',
      price: '600 ETB',
      seatsAvailable: 22,
      rating: 4.9,
    },
  ];

  return (
    <div className="search-trips-page">
      {/* Header Search Filter Bar */}
      <div className="search-header-bar">
        <div className="search-header-container">
          <h2>{t('searchPage.title')}</h2>
          <p>{t('searchPage.subtitle')}</p>

          <div className="quick-filter-strip">
            <div className="filter-pill">
              <MapPin size={16} /> {t('searchPage.fromLabel')}: <strong>{fromCity || 'Any'}</strong>
            </div>
            <div className="filter-pill">
              <MapPin size={16} /> {t('searchPage.toLabel')}: <strong>{toCity || 'Any'}</strong>
            </div>
            <div className="filter-pill">
              <Calendar size={16} /> {t('searchPage.dateLabel')}: <strong>{travelDate || 'Today / Next Available'}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="search-trips-content">
        <div className="trips-results-container">
          <div className="results-count-bar">
            <span>
              {t('searchPage.showing')} <strong>{mockTrips.length}</strong> {t('searchPage.availableTrips')}{' '}
              <strong>{fromCity} &rarr; {toCity}</strong>
            </span>
          </div>

          <div className="trip-cards-list">
            {mockTrips.map((trip) => (
              <div key={trip.id} className="trip-result-card">
                <div className="trip-operator-info">
                  <div className="operator-logo-badge">
                    <Bus size={22} color="var(--color-primary)" />
                  </div>
                  <div>
                    <h3 className="operator-name">{trip.operator}</h3>
                    <span className="bus-type-label">{trip.busType}</span>
                  </div>
                </div>

                <div className="trip-time-route">
                  <div className="time-block">
                    <span className="departure-time">{trip.departureTime}</span>
                    <span className="location-name">{trip.origin}</span>
                  </div>
                  <div className="duration-indicator">
                    <span className="duration-text">{trip.duration}</span>
                    <div className="duration-line" />
                    <span className="direct-badge">{t('searchPage.direct')}</span>
                  </div>
                  <div className="time-block">
                    <span className="arrival-time">{trip.arrivalTime}</span>
                    <span className="location-name">{trip.destination}</span>
                  </div>
                </div>

                <div className="trip-pricing-action">
                  <div className="pricing-box">
                    <span className="price-tag">{trip.price}</span>
                    <span className="seats-tag">{trip.seatsAvailable} {t('searchPage.seatsLeft')}</span>
                  </div>
                  <Link to="/login" className="btn btn-primary btn-sm">
                    {t('searchPage.selectSeats')}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchTripsPage;
