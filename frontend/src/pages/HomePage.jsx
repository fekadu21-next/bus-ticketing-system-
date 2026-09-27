import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  MapPin,
  Calendar,
  Search,
  Shield,
  Clock,
  Smartphone,
  Headphones,
  CheckCircle,
  Building,
  ArrowRight,
  Bus,
} from 'lucide-react';
import heroBusImg from '@/assets/hero.png';

export const HomePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    navigate(`/search-trips?from=${encodeURIComponent(origin)}&to=${encodeURIComponent(destination)}&date=${encodeURIComponent(departureDate)}`);
  };

  const partnerFeatures = [
    t('home.partnerSection.f1'),
    t('home.partnerSection.f2'),
    t('home.partnerSection.f3'),
    t('home.partnerSection.f4'),
    t('home.partnerSection.f5'),
    t('home.partnerSection.f6'),
    t('home.partnerSection.f7'),
  ];

  const popularCities = [
    'Addis Ababa',
    'Hawassa',
    'Bahir Dar',
    'Gondar',
    'Mekelle',
    'Dire Dawa',
    'Jimma',
    'Adama (Nazret)',
    'Arba Minch',
  ];

  return (
    <div className="home-page-container">
      {/* 1. HERO SECTION */}
      <section className="hero-section">
        <div className="hero-content-wrapper">
          <div className="hero-text-col">
            <span className="hero-badge">{t('home.heroBadge')}</span>
            <h1 className="hero-heading">
              {t('home.heroTitle1')} <br />
              <span className="highlight-text">{t('home.heroTitle2')}</span>
            </h1>
            <p className="hero-subheading">
              {t('home.heroSubtitle')}
            </p>

            {/* TRIP SEARCH FORM CARD */}
            <div className="trip-search-card">
              <form onSubmit={handleSearchSubmit} className="search-form-grid">
                {/* FROM */}
                <div className="search-field-group">
                  <div className="search-field-icon">
                    <MapPin size={20} className="field-icon" />
                  </div>
                  <div className="search-field-inputs">
                    <label className="search-field-label">{t('home.searchForm.from')}</label>
                    <select
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      className="search-field-select"
                    >
                      <option value="">{t('home.searchForm.selectOrigin')}</option>
                      {popularCities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="search-divider" />

                {/* TO */}
                <div className="search-field-group">
                  <div className="search-field-icon">
                    <MapPin size={20} className="field-icon" />
                  </div>
                  <div className="search-field-inputs">
                    <label className="search-field-label">{t('home.searchForm.to')}</label>
                    <select
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="search-field-select"
                    >
                      <option value="">{t('home.searchForm.selectDestination')}</option>
                      {popularCities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="search-divider" />

                {/* DEPARTURE DATE */}
                <div className="search-field-group">
                  <div className="search-field-icon">
                    <Calendar size={20} className="field-icon" />
                  </div>
                  <div className="search-field-inputs">
                    <label className="search-field-label">{t('home.searchForm.date')}</label>
                    <input
                      type="date"
                      value={departureDate}
                      onChange={(e) => setDepartureDate(e.target.value)}
                      className="search-field-date"
                    />
                  </div>
                </div>

                {/* SEARCH BUTTON */}
                <div className="search-btn-wrapper">
                  <button type="submit" className="btn btn-primary search-action-btn">
                    <Search size={18} style={{ marginRight: 8 }} />
                    {t('home.searchForm.searchBtn')}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* HERO IMAGE / COACH BUS */}
          <div className="hero-image-col">
            <div className="hero-bus-graphic">
              <img
                src={heroBusImg}
                alt="BusTicket Modern Coach Bus"
                className="hero-bus-img"
              />
              <div className="bus-floating-badge">
                <Bus size={18} color="var(--color-primary)" />
                <span>Verified Operators Only</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FEATURES TRUST BAR */}
      <section className="features-trust-bar">
        <div className="features-container">
          <div className="feature-item-card">
            <div className="feature-icon-wrapper">
              <Shield size={24} color="#2563eb" />
            </div>
            <div className="feature-texts">
              <h4 className="feature-title">{t('home.features.safeTitle')}</h4>
              <p className="feature-desc">{t('home.features.safeDesc')}</p>
            </div>
          </div>

          <div className="feature-item-card">
            <div className="feature-icon-wrapper">
              <Clock size={24} color="#2563eb" />
            </div>
            <div className="feature-texts">
              <h4 className="feature-title">{t('home.features.liveTitle')}</h4>
              <p className="feature-desc">{t('home.features.liveDesc')}</p>
            </div>
          </div>

          <div className="feature-item-card">
            <div className="feature-icon-wrapper">
              <Smartphone size={24} color="#2563eb" />
            </div>
            <div className="feature-texts">
              <h4 className="feature-title">{t('home.features.mobileTitle')}</h4>
              <p className="feature-desc">{t('home.features.mobileDesc')}</p>
            </div>
          </div>

          <div className="feature-item-card">
            <div className="feature-icon-wrapper">
              <Headphones size={24} color="#2563eb" />
            </div>
            <div className="feature-texts">
              <h4 className="feature-title">{t('home.features.supportTitle')}</h4>
              <p className="feature-desc">{t('home.features.supportDesc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. BECOME A PARTNER & HOW IT WORKS (SPLIT SECTION) */}
      <section className="partner-how-section">
        <div className="partner-how-container">
          {/* LEFT: BECOME A PARTNER */}
          <div className="partner-info-box">
            <span className="section-label-blue">{t('home.partnerSection.badge')}</span>
            <h2 className="section-title">{t('home.partnerSection.title')}</h2>
            <p className="section-desc">
              {t('home.partnerSection.desc')}
            </p>

            <ul className="partner-checklist">
              {partnerFeatures.map((feat, index) => (
                <li key={index} className="checklist-row">
                  <CheckCircle size={18} color="#059669" className="check-icon" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>

            <div className="partner-cta-row">
              <Link to="/partner-register" className="btn btn-partner btn-lg">
                {t('home.partnerSection.btn')} <ArrowRight size={18} style={{ marginLeft: 8 }} />
              </Link>
            </div>
          </div>

          {/* RIGHT: HOW IT WORKS */}
          <div className="how-it-works-box">
            <h2 className="section-title">{t('home.howItWorks.title')}</h2>
            <div className="how-steps-timeline">
              <div className="how-step-item">
                <div className="step-circle-badge">1</div>
                <div className="step-content">
                  <h4 className="step-title">{t('home.howItWorks.s1Title')}</h4>
                  <p className="step-desc">{t('home.howItWorks.s1Desc')}</p>
                </div>
              </div>

              <div className="how-step-connector" />

              <div className="how-step-item">
                <div className="step-circle-badge">2</div>
                <div className="step-content">
                  <h4 className="step-title">{t('home.howItWorks.s2Title')}</h4>
                  <p className="step-desc">{t('home.howItWorks.s2Desc')}</p>
                </div>
              </div>

              <div className="how-step-connector" />

              <div className="how-step-item">
                <div className="step-circle-badge">3</div>
                <div className="step-content">
                  <h4 className="step-title">{t('home.howItWorks.s3Title')}</h4>
                  <p className="step-desc">{t('home.howItWorks.s3Desc')}</p>
                </div>
              </div>

              <div className="how-step-connector" />

              <div className="how-step-item">
                <div className="step-circle-badge">4</div>
                <div className="step-content">
                  <h4 className="step-title">{t('home.howItWorks.s4Title')}</h4>
                  <p className="step-desc">{t('home.howItWorks.s4Desc')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. OPERATOR REGISTRATION PREVIEW BANNER */}
      <section className="operator-banner-section">
        <div className="operator-banner-card">
          <div className="banner-text">
            <h3>{t('home.operatorBanner.title')}</h3>
            <p>{t('home.operatorBanner.desc')}</p>
          </div>
          <div className="banner-action">
            <Link to="/partner-register" className="btn btn-partner btn-lg">
              <Building size={18} style={{ marginRight: 8 }} />
              {t('home.operatorBanner.btn')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
