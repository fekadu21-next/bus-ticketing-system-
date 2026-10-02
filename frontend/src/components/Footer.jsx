import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bus } from 'lucide-react';

const SocialIcon = ({ children, label, href = '#' }) => (
  <a
    href={href}
    aria-label={label}
    className="w-8 h-8 rounded-full bg-[#16315c] hover:bg-[#1e4a86] text-white flex items-center justify-center transition-colors"
  >
    {children}
  </a>
);

export const Footer = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail('');
  };

  const linkClass = 'text-[13px] text-[#b7c3d6] hover:text-white transition-colors';

  return (
    <footer className="bg-[#071833] text-white">
      <div className="max-w-[1180px] mx-auto px-5 sm:px-8 pt-12 pb-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-3">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-4">
            <span className="w-9 h-9 rounded-lg bg-[#2563eb] flex items-center justify-center">
              <Bus size={18} className="text-white" />
            </span>
            <span>
              <span className="block text-[16px] font-bold leading-none tracking-tight">BusTicket</span>
              <span className="block text-[11px] text-slate-400 mt-1">Travel Together</span>
            </span>
          </Link>
          <p className="text-[13px] text-[#9aa9c2] leading-relaxed mb-5 max-w-[230px]">
            {t('footer.desc')}
          </p>
          <div className="flex items-center gap-2.5">
            <SocialIcon label="Facebook">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H8v3h3v7h3v-7h3l1-3h-4V9c0-.6.4-1 1-1z" />
              </svg>
            </SocialIcon>
            <SocialIcon label="Twitter">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M22 5.8c-.7.3-1.5.6-2.3.7.8-.5 1.4-1.2 1.7-2.1-.8.5-1.6.8-2.5 1A3.7 3.7 0 0 0 12 8.7c0 .3 0 .6.1.8-3.1-.2-5.8-1.6-7.6-3.9-.3.6-.5 1.2-.5 1.9 0 1.3.7 2.4 1.7 3.1-.6 0-1.2-.2-1.7-.5v.1c0 1.8 1.3 3.3 3 3.6-.3.1-.7.1-1 .1-.2 0-.5 0-.7-.1.5 1.5 1.8 2.6 3.4 2.6A7.5 7.5 0 0 1 2 18.3 10.5 10.5 0 0 0 7.7 20c6.9 0 10.7-5.7 10.7-10.7v-.5c.7-.5 1.4-1.2 1.9-2z" />
              </svg>
            </SocialIcon>
            <SocialIcon label="Instagram">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
              </svg>
            </SocialIcon>
            <SocialIcon label="YouTube">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.8 15.6V8.4L16 12l-6.2 3.6z" />
              </svg>
            </SocialIcon>
          </div>
        </div>

        <div className="lg:col-span-2">
          <h4 className="text-[14px] font-semibold mb-4">{t('footer.quickLinks')}</h4>
          <ul className="space-y-2.5">
            <li><Link to="/" className={linkClass}>{t('nav.home')}</Link></li>
            <li><Link to="/search-trips" className={linkClass}>{t('nav.searchTrips')}</Link></li>
            <li><Link to="/about" className={linkClass}>{t('nav.about')}</Link></li>
            <li><Link to="/contact" className={linkClass}>{t('nav.contact')}</Link></li>
          </ul>
        </div>

        <div className="lg:col-span-2">
          <h4 className="text-[14px] font-semibold mb-4">{t('footer.forPartners')}</h4>
          <ul className="space-y-2.5">
            <li><Link to="/partner-register" className={linkClass}>{t('footer.becomePartner')}</Link></li>
            <li><Link to="/login" className={linkClass}>{t('footer.operatorLogin')}</Link></li>
            <li><Link to="/login" className={linkClass}>{t('footer.driverLogin')}</Link></li>
            <li><Link to="/login" className={linkClass}>{t('footer.verifierLogin')}</Link></li>
          </ul>
        </div>

        <div className="lg:col-span-2">
          <h4 className="text-[14px] font-semibold mb-4">{t('footer.support')}</h4>
          <ul className="space-y-2.5">
            <li><Link to="/contact" className={linkClass}>{t('footer.helpCenter')}</Link></li>
            <li><Link to="/about" className={linkClass}>{t('footer.terms')}</Link></li>
            <li><Link to="/about" className={linkClass}>{t('footer.privacy')}</Link></li>
            <li><Link to="/contact" className={linkClass}>{t('footer.contactUs')}</Link></li>
          </ul>
        </div>

        <div className="lg:col-span-3">
          <h4 className="text-[14px] font-semibold mb-2">{t('footer.newsletterTitle')}</h4>
          <p className="text-[13px] text-[#9aa9c2] mb-4">{t('footer.newsletterDesc')}</p>
          <form onSubmit={handleSubscribe} className="flex items-center">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('footer.emailPlaceholder')}
              className="flex-1 min-w-0 h-10 rounded-l-md bg-white text-[#0f172a] border-none px-3 text-[13px] placeholder:text-slate-400 outline-none"
            />
            <button
              type="submit"
              className="h-10 px-4 rounded-r-md bg-[#2563eb] hover:bg-[#1d4ed8] text-[13px] font-semibold whitespace-nowrap"
            >
              {t('footer.subscribe')}
            </button>
          </form>
          {subscribed && (
            <p className="mt-2 text-[12px] text-emerald-400">{t('footer.subscribed')}</p>
          )}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-[1180px] mx-auto px-5 sm:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[12px] text-[#8aa0bb]">
          <p>&copy; {new Date().getFullYear()} BusTicket. {t('footer.rights')}</p>
          <p>Travel Together &nbsp;|&nbsp; A Smarter Way to Travel</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
