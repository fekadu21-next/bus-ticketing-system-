import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, MapPin, Shield } from 'lucide-react';

export const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="app-footer">
      <div className="footer-top">
        <div className="footer-col brand-col">
          <div className="footer-brand">
            <img
              src="/b907ff8e-96c1-4830-b55d-6461943fc151.png"
              alt="BusTicket Logo"
              className="brand-logo-img"
              style={{ width: 40, height: 40, borderRadius: 10 }}
              onError={(e) => { e.currentTarget.src = '/logo.png'; }}
            />
            <div>
              <h3 className="brand-title">{t('nav.brand')}</h3>
              <span className="brand-subtitle">{t('nav.subtitle')}</span>
            </div>
          </div>
          <p className="footer-desc">
            {t('footer.desc')}
          </p>
          <div className="footer-contact-info">
            <div className="contact-item">
              <Phone size={15} /> <span>+251 911 234 567 / +251 115 500 000</span>
            </div>
            <div className="contact-item">
              <Mail size={15} /> <span>support@busticket.et</span>
            </div>
            <div className="contact-item">
              <MapPin size={15} /> <span>Bole Medhanialem, Addis Ababa, Ethiopia</span>
            </div>
          </div>
        </div>

        <div className="footer-col">
          <h4 className="footer-heading">{t('footer.quickLinks')}</h4>
          <ul className="footer-links-list">
            <li><Link to="/">{t('nav.home')}</Link></li>
            <li><Link to="/search-trips">{t('nav.searchTrips')}</Link></li>
            <li><Link to="/about">{t('nav.about')}</Link></li>
            <li><Link to="/contact">{t('nav.contact')}</Link></li>
            <li><Link to="/partner-register">{t('nav.becomePartner')}</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4 className="footer-heading">{t('footer.forOperators')}</h4>
          <ul className="footer-links-list">
            <li><Link to="/partner-register">{t('footer.operatorReg')}</Link></li>
            <li><Link to="/login">{t('footer.partnerLogin')}</Link></li>
            <li><Link to="/contact">{t('nav.contact')}</Link></li>
            <li><Link to="/about">{t('nav.about')}</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4 className="footer-heading">{t('footer.passengerPortal')}</h4>
          <ul className="footer-links-list">
            <li><Link to="/login">{t('footer.passengerLogin')}</Link></li>
            <li><Link to="/register">{t('footer.createAccount')}</Link></li>
            <li><Link to="/search-trips">{t('footer.tripSchedules')}</Link></li>
            <li><Link to="/forgot-password">{t('footer.accountHelp')}</Link></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-container">
          <p className="copyright-text">
            &copy; {new Date().getFullYear()} {t('nav.brand')}. {t('footer.rights')}
          </p>
          <div className="footer-legal-badges">
            <span className="secure-badge">
              <Shield size={14} /> {t('footer.ssl')}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
