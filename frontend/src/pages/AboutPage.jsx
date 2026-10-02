import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Shield,
  ShieldCheck,
  Zap,
  Armchair,
  CreditCard,
  Headphones,
  Bus,
  MapPin,
  Users,
  Star,
  Heart,
  Handshake,
  ArrowRight,
} from 'lucide-react';

const FeatureIcon = ({ className, children }) => (
  <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${className}`}>
    {children}
  </div>
);

export const AboutPage = () => {
  const { t } = useTranslation();

  const whyItems = [
    {
      icon: ShieldCheck,
      iconWrap: 'bg-[#e8f1ff] text-[#2563eb]',
      title: t('aboutPage.why1Title'),
      desc: t('aboutPage.why1Desc'),
    },
    {
      icon: Zap,
      iconWrap: 'bg-[#f3e8ff] text-[#7c3aed]',
      title: t('aboutPage.why2Title'),
      desc: t('aboutPage.why2Desc'),
    },
    {
      icon: Armchair,
      iconWrap: 'bg-[#e7f8ee] text-[#16a34a]',
      title: t('aboutPage.why3Title'),
      desc: t('aboutPage.why3Desc'),
    },
    {
      icon: CreditCard,
      iconWrap: 'bg-[#fff1e6] text-[#ea580c]',
      title: t('aboutPage.why4Title'),
      desc: t('aboutPage.why4Desc'),
    },
    {
      icon: Headphones,
      iconWrap: 'bg-[#e6f7fb] text-[#0891b2]',
      title: t('aboutPage.why5Title'),
      desc: t('aboutPage.why5Desc'),
    },
    {
      icon: Shield,
      iconWrap: 'bg-[#fde8e8] text-[#e11d48]',
      title: t('aboutPage.why6Title'),
      desc: t('aboutPage.why6Desc'),
    },
  ];

  const stats = [
    {
      icon: Bus,
      wrap: 'bg-[#e8f1ff] text-[#2563eb]',
      value: t('aboutPage.stat1Value'),
      label: t('aboutPage.stat1Label'),
    },
    {
      icon: MapPin,
      wrap: 'bg-[#e7f8ee] text-[#16a34a]',
      value: t('aboutPage.stat2Value'),
      label: t('aboutPage.stat2Label'),
    },
    {
      icon: Users,
      wrap: 'bg-[#f3e8ff] text-[#7c3aed]',
      value: t('aboutPage.stat3Value'),
      label: t('aboutPage.stat3Label'),
    },
    {
      icon: Star,
      wrap: 'bg-[#fde8ef] text-[#db2777]',
      value: t('aboutPage.stat4Value'),
      label: t('aboutPage.stat4Label'),
    },
  ];

  const values = [
    {
      icon: Handshake,
      wrap: 'bg-[#e8f1ff] text-[#2563eb]',
      title: t('aboutPage.value1Title'),
      desc: t('aboutPage.value1Desc'),
    },
    {
      icon: Heart,
      wrap: 'bg-[#e7f8ee] text-[#16a34a]',
      title: t('aboutPage.value2Title'),
      desc: t('aboutPage.value2Desc'),
    },
    {
      icon: MapPin,
      wrap: 'bg-[#f3e8ff] text-[#7c3aed]',
      title: t('aboutPage.value3Title'),
      desc: t('aboutPage.value3Desc'),
    },
    {
      icon: Users,
      wrap: 'bg-[#fff1e6] text-[#ea580c]',
      title: t('aboutPage.value4Title'),
      desc: t('aboutPage.value4Desc'),
    },
  ];

  return (
    <div className="about-page bg-white text-[#0f172a]">
      <div className="max-w-[1180px] mx-auto px-5 sm:px-8 pt-5">
        <section className="about-hero">
          <img
            src="/images/about-hero-full.jpg"
            alt=""
            className="about-hero-art"
          />
          <h1 className="sr-only">
            {t('aboutPage.titleLine1')} {t('aboutPage.titleLine2')}
          </h1>
          <p className="sr-only">{t('aboutPage.desc')}</p>
        </section>
      </div>

      <section className="max-w-[1180px] mx-auto px-5 sm:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.22em] text-[#2563eb] uppercase mb-2">
              {t('aboutPage.storyBadge')}
            </p>
            <h2 className="text-[28px] sm:text-[34px] font-extrabold text-[#0b1b3a] leading-[1.15]">
              {t('aboutPage.storyTitle')}
            </h2>
            <p className="mt-4 text-[14px] text-slate-500 leading-relaxed">
              {t('aboutPage.storyP1')}
            </p>
            <p className="mt-3 text-[14px] text-slate-500 leading-relaxed">
              {t('aboutPage.storyP2')}
            </p>
            <p className="home-script text-[26px] text-[#2563eb] mt-5">
              {t('aboutPage.storyScript1')}
              <br />
              {t('aboutPage.storyScript2')}
            </p>
            <a
              href="#our-impact"
              className="inline-flex items-center gap-1.5 mt-6 px-5 py-2 rounded-full border border-slate-300 text-[13px] font-semibold text-slate-700 hover:border-[#2563eb] hover:text-[#2563eb] transition-colors"
            >
              {t('aboutPage.storyCta')} <ArrowRight size={14} />
            </a>
          </div>

          <div className="about-story-card">
            <img src="/images/about-story.jpg" alt={t('aboutPage.storyImgAlt')} className="about-story-img" />
          </div>
        </div>
      </section>

      <section className="bg-[#f7fafc] border-y border-slate-100">
        <div className="max-w-[1180px] mx-auto px-5 sm:px-8 py-14 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8">
          <div className="lg:col-span-4">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-[#2563eb] uppercase mb-2">
              {t('aboutPage.whyBadge')}
            </p>
            <h2 className="text-[28px] sm:text-[32px] font-extrabold text-[#0b1b3a] leading-[1.15] max-w-xs">
              {t('aboutPage.whyTitle')}
            </h2>
            <p className="mt-4 text-[14px] text-slate-500 leading-relaxed max-w-sm">
              {t('aboutPage.whyDesc')}
            </p>
            <Link
              to="/search-trips"
              className="inline-flex items-center gap-1.5 mt-7 px-5 py-2.5 rounded-full bg-[#2563eb] text-white text-[13px] font-semibold shadow-[0_8px_18px_rgba(37,99,235,0.28)] hover:bg-[#1d4ed8] transition-colors"
            >
              {t('aboutPage.exploreTrips')} <ArrowRight size={14} />
            </Link>
          </div>
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-9">
            {whyItems.map((item) => (
              <div key={item.title}>
                <FeatureIcon className={`${item.iconWrap} mb-3`}>
                  <item.icon size={18} strokeWidth={2} />
                </FeatureIcon>
                <h3 className="text-[15px] font-bold text-[#0f172a]">{item.title}</h3>
                <p className="text-[13px] text-slate-500 leading-snug mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="our-impact" className="max-w-[1180px] mx-auto px-5 sm:px-8 py-14 lg:py-16 scroll-mt-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-4">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-[#2563eb] uppercase mb-2">
              {t('aboutPage.impactBadge')}
            </p>
            <h2 className="text-[28px] sm:text-[32px] font-extrabold text-[#0b1b3a] leading-[1.15] max-w-xs">
              {t('aboutPage.impactTitle')}
            </h2>
            <p className="mt-4 text-[14px] text-slate-500 leading-relaxed max-w-sm">
              {t('aboutPage.impactDesc')}
            </p>
            <a
              href="#our-values"
              className="inline-flex items-center gap-1.5 mt-6 px-5 py-2 rounded-full border border-slate-300 text-[13px] font-semibold text-slate-700 hover:border-[#2563eb] hover:text-[#2563eb] transition-colors"
            >
              {t('aboutPage.moreAbout')} <ArrowRight size={14} />
            </a>
          </div>
          <div className="lg:col-span-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((item) => (
              <article
                key={item.label}
                className="rounded-2xl border border-slate-100 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)] px-3 py-6 text-center"
              >
                <div className={`w-11 h-11 rounded-xl mx-auto mb-3 flex items-center justify-center ${item.wrap}`}>
                  <item.icon size={20} />
                </div>
                <p className="text-[26px] font-extrabold text-[#0b1b3a] leading-none">{item.value}</p>
                <p className="mt-2 text-[12px] text-slate-500 leading-snug">{item.label}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="our-values" className="bg-[#f7fafc] border-y border-slate-100 scroll-mt-24">
        <div className="max-w-[1180px] mx-auto px-5 sm:px-8 py-14 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          <div className="lg:col-span-4">
            <div className="about-values-photo">
              <img src="/images/about-values.jpg" alt="" className="about-values-img" />
            </div>
          </div>
          <div className="lg:col-span-8">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-[#2563eb] uppercase mb-2">
              {t('aboutPage.valuesBadge')}
            </p>
            <h2 className="text-[28px] sm:text-[32px] font-extrabold text-[#0b1b3a] leading-[1.15]">
              {t('aboutPage.valuesTitle')}
            </h2>
            <p className="mt-3 mb-8 text-[14px] text-slate-500 leading-relaxed">
              {t('aboutPage.valuesDesc')}
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-7">
              {values.map((item) => (
                <div key={item.title}>
                  <FeatureIcon className={`${item.wrap} mb-3`}>
                    <item.icon size={18} />
                  </FeatureIcon>
                  <h3 className="text-[15px] font-bold text-[#0f172a]">{item.title}</h3>
                  <p className="text-[13px] text-slate-500 leading-snug mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-[1180px] mx-auto px-5 sm:px-8 py-10">
        <div className="about-cta">
          <div className="flex items-center gap-4">
            <span className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
              <Bus size={20} className="text-white" />
            </span>
            <div>
              <h3 className="text-[18px] sm:text-[20px] font-bold text-white leading-tight">
                {t('aboutPage.ctaTitle')}
              </h3>
              <p className="text-[13px] text-blue-100/80 mt-0.5">{t('aboutPage.ctaDesc')}</p>
            </div>
          </div>
          <Link
            to="/search-trips"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#2563eb] text-white text-[13px] font-semibold hover:bg-[#1d4ed8] transition-colors whitespace-nowrap"
          >
            {t('aboutPage.ctaBtn')} <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
