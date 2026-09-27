import React from 'react';
import { Bus, Shield, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const AboutPage = () => {
  const { t } = useTranslation();

  return (
    <div className="about-page">
      <div className="page-hero-banner">
        <div className="page-hero-container">
          <span className="badge-light">{t('aboutPage.badge')}</span>
          <h1>{t('aboutPage.title')}</h1>
          <p>{t('aboutPage.desc')}</p>
        </div>
      </div>

      <div className="about-content-section">
        <div className="about-grid">
          <div className="about-card">
            <div className="about-card-icon">
              <Bus size={28} color="#2563eb" />
            </div>
            <h3>{t('aboutPage.missionTitle')}</h3>
            <p>{t('aboutPage.missionDesc')}</p>
          </div>

          <div className="about-card">
            <div className="about-card-icon">
              <Shield size={28} color="#059669" />
            </div>
            <h3>{t('aboutPage.securityTitle')}</h3>
            <p>{t('aboutPage.securityDesc')}</p>
          </div>

          <div className="about-card">
            <div className="about-card-icon">
              <Award size={28} color="#d97706" />
            </div>
            <h3>{t('aboutPage.supportTitle')}</h3>
            <p>{t('aboutPage.supportDesc')}</p>
          </div>
        </div>

        <div className="about-cta-banner">
          <div>
            <h3>{t('aboutPage.ctaTitle')}</h3>
            <p>{t('aboutPage.ctaDesc')}</p>
          </div>
          <Link to="/partner-register" className="btn btn-partner btn-lg">
            {t('aboutPage.ctaBtn')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
