
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
  Sparkles,
} from 'lucide-react';

const FeatureIcon = ({ className = '', children }) => (
  <div
    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ring-black/[0.03] transition duration-300 group-hover:scale-110 group-hover:rotate-[-3deg] ${className}`}
  >
    {children}
  </div>
);

const SectionEyebrow = ({ children }) => (
  <p className="mb-3 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-blue-600">
    <span className="h-px w-6 bg-blue-600" />
    {children}
  </p>
);

const ArrowLink = ({ children, href }) => (
  <a
    href={href}
    className="group inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20"
  >
    {children}
    <ArrowRight
      size={15}
      className="transition-transform duration-300 group-hover:translate-x-1"
    />
  </a>
);

export const AboutPage = () => {
  const { t } = useTranslation();

  const whyItems = [
    {
      icon: ShieldCheck,
      iconWrap: 'bg-blue-50 text-blue-600 ring-blue-100',
      title: t('aboutPage.why1Title'),
      desc: t('aboutPage.why1Desc'),
    },
    {
      icon: Zap,
      iconWrap: 'bg-violet-50 text-violet-600 ring-violet-100',
      title: t('aboutPage.why2Title'),
      desc: t('aboutPage.why2Desc'),
    },
    {
      icon: Armchair,
      iconWrap: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
      title: t('aboutPage.why3Title'),
      desc: t('aboutPage.why3Desc'),
    },
    {
      icon: CreditCard,
      iconWrap: 'bg-orange-50 text-orange-600 ring-orange-100',
      title: t('aboutPage.why4Title'),
      desc: t('aboutPage.why4Desc'),
    },
    {
      icon: Headphones,
      iconWrap: 'bg-cyan-50 text-cyan-600 ring-cyan-100',
      title: t('aboutPage.why5Title'),
      desc: t('aboutPage.why5Desc'),
    },
    {
      icon: Shield,
      iconWrap: 'bg-rose-50 text-rose-600 ring-rose-100',
      title: t('aboutPage.why6Title'),
      desc: t('aboutPage.why6Desc'),
    },
  ];

  const stats = [
    {
      icon: Bus,
      wrap: 'bg-blue-50 text-blue-600 ring-blue-100',
      value: t('aboutPage.stat1Value'),
      label: t('aboutPage.stat1Label'),
    },
    {
      icon: MapPin,
      wrap: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
      value: t('aboutPage.stat2Value'),
      label: t('aboutPage.stat2Label'),
    },
    {
      icon: Users,
      wrap: 'bg-violet-50 text-violet-600 ring-violet-100',
      value: t('aboutPage.stat3Value'),
      label: t('aboutPage.stat3Label'),
    },
    {
      icon: Star,
      wrap: 'bg-pink-50 text-pink-600 ring-pink-100',
      value: t('aboutPage.stat4Value'),
      label: t('aboutPage.stat4Label'),
    },
  ];

  const values = [
    {
      icon: Handshake,
      wrap: 'bg-blue-50 text-blue-600 ring-blue-100',
      title: t('aboutPage.value1Title'),
      desc: t('aboutPage.value1Desc'),
    },
    {
      icon: Heart,
      wrap: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
      title: t('aboutPage.value2Title'),
      desc: t('aboutPage.value2Desc'),
    },
    {
      icon: MapPin,
      wrap: 'bg-violet-50 text-violet-600 ring-violet-100',
      title: t('aboutPage.value3Title'),
      desc: t('aboutPage.value3Desc'),
    },
    {
      icon: Users,
      wrap: 'bg-orange-50 text-orange-600 ring-orange-100',
      title: t('aboutPage.value4Title'),
      desc: t('aboutPage.value4Desc'),
    },
  ];

  return (
    <div className="about-page overflow-hidden bg-white text-slate-900">
      <style>{`
        @keyframes aboutFadeUp {
          from {
            opacity: 0;
            transform: translate3d(0, 18px, 0);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }

        @keyframes aboutFloat {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        @keyframes aboutHeroReveal {
          from {
            opacity: .6;
            transform: scale(1.08);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes aboutHeroGlow {
          0%, 100% {
            opacity: .2;
            transform: translate3d(-2%, 0, 0);
          }
          50% {
            opacity: .55;
            transform: translate3d(2%, 1%, 0);
          }
        }

        .about-fade-up {
          animation: aboutFadeUp .7s cubic-bezier(.2,.7,.2,1) both;
        }

        .about-delay-1 {
          animation-delay: .08s;
        }

        .about-delay-2 {
          animation-delay: .16s;
        }

        .about-delay-3 {
          animation-delay: .24s;
        }

        .about-float {
          animation: aboutFloat 6s ease-in-out infinite;
        }

        /* Full-width hero with reduced height */
        .about-hero-section {
          position: relative;
          isolation: isolate;
          width: 100vw;
          margin-left: calc(50% - 50vw);
          height: clamp(28rem, 45vw, 40rem);
          min-height: 28rem;
          overflow: hidden;
          background: #0b1b3a;
        }

        .about-hero-art {
          position: absolute;
          inset: 0;
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          animation: aboutHeroReveal 1.4s cubic-bezier(.2,.7,.2,1) both;
          will-change: transform;
        }

        .about-hero-overlay {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          background:
            linear-gradient(
              90deg,
              rgba(5, 15, 35, .38) 0%,
              rgba(5, 15, 35, .12) 48%,
              rgba(5, 15, 35, .04) 100%
            ),
            linear-gradient(
              0deg,
              rgba(5, 15, 35, .18) 0%,
              transparent 38%
            );
        }

        .about-hero-glow {
          position: absolute;
          z-index: 1;
          top: -15%;
          right: -10%;
          width: min(55vw, 46rem);
          aspect-ratio: 1;
          border-radius: 9999px;
          background: radial-gradient(
            circle,
            rgba(59, 130, 246, .23),
            transparent 68%
          );
          filter: blur(20px);
          animation: aboutHeroGlow 9s ease-in-out infinite;
          pointer-events: none;
        }

        .about-story-img,
        .about-values-img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .about-script {
          font-family: Georgia, 'Times New Roman', serif;
          font-style: italic;
        }

        @media (max-width: 640px) {
          .about-hero-section {
            height: clamp(25rem, 65svh, 32rem);
            min-height: 25rem;
          }

          .about-hero-art {
            object-position: center;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .about-fade-up,
          .about-float,
          .about-hero-art,
          .about-hero-glow {
            animation: none !important;
          }

          .about-page *,
          .about-page *::before,
          .about-page *::after {
            scroll-behavior: auto !important;
            transition-duration: .01ms !important;
          }
        }
      `}</style>

      {/* FULL-WIDTH HERO */}
      <section className="about-hero-section">
        <img
          src="/images/about-hero-full.jpg"
          alt=""
          className="about-hero-art"
          fetchPriority="high"
        />

        <div className="about-hero-overlay" />
        <div className="about-hero-glow" />

        <h1 className="sr-only">
          {t('aboutPage.titleLine1')} {t('aboutPage.titleLine2')}
        </h1>

        <p className="sr-only">{t('aboutPage.desc')}</p>
      </section>

      {/* OUR STORY */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="about-fade-up">
            <SectionEyebrow>{t('aboutPage.storyBadge')}</SectionEyebrow>

            <h2 className="max-w-xl text-3xl font-extrabold leading-[1.12] tracking-tight text-slate-950 sm:text-4xl lg:text-[2.7rem]">
              {t('aboutPage.storyTitle')}
            </h2>

            <p className="mt-5 max-w-xl text-[15px] leading-7 text-slate-600">
              {t('aboutPage.storyP1')}
            </p>

            <p className="mt-4 max-w-xl text-[15px] leading-7 text-slate-600">
              {t('aboutPage.storyP2')}
            </p>

            <p className="about-script mt-6 text-2xl leading-relaxed text-blue-600 sm:text-[1.7rem]">
              {t('aboutPage.storyScript1')}
              <br />
              {t('aboutPage.storyScript2')}
            </p>

            <div className="mt-7">
              <ArrowLink href="#our-impact">
                {t('aboutPage.storyCta')}
              </ArrowLink>
            </div>
          </div>

          <div className="about-fade-up about-delay-2 group relative mx-auto w-full max-w-xl lg:ml-auto">
            <div className="absolute -inset-3 -z-10 rounded-[2rem] bg-gradient-to-br from-blue-100 via-indigo-50 to-cyan-100 blur-xl transition duration-500 group-hover:blur-2xl" />

            <div className="relative aspect-[5/4] overflow-hidden rounded-[1.75rem] border border-white bg-slate-100 shadow-[0_24px_70px_-28px_rgba(15,23,42,.38)]">
              <img
                src="/images/about-story.jpg"
                alt={t('aboutPage.storyImgAlt')}
                className="about-story-img transition duration-700 ease-out group-hover:scale-[1.04]"
                loading="lazy"
              />

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-white/10" />
            </div>

            <div className="about-float absolute -bottom-5 -left-3 flex items-center gap-3 rounded-2xl border border-white/80 bg-white/95 p-3.5 shadow-xl shadow-slate-900/10 backdrop-blur sm:-left-6 sm:p-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Sparkles size={21} />
              </span>

              <span className="pr-2 text-sm font-bold text-slate-800">
                {t('aboutPage.storyBadge')}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="relative isolate border-y border-slate-200/70 bg-slate-50/80">
        <div className="pointer-events-none absolute -top-24 right-0 -z-10 h-72 w-72 rounded-full bg-blue-100/60 blur-3xl" />

        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-12 lg:gap-12 lg:py-24">
          <div className="about-fade-up lg:col-span-4">
            <SectionEyebrow>{t('aboutPage.whyBadge')}</SectionEyebrow>

            <h2 className="max-w-sm text-3xl font-extrabold leading-[1.12] tracking-tight text-slate-950 sm:text-4xl">
              {t('aboutPage.whyTitle')}
            </h2>

            <p className="mt-5 max-w-md text-[15px] leading-7 text-slate-600">
              {t('aboutPage.whyDesc')}
            </p>

            <Link
              to="/search-trips"
              className="group mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition duration-300 hover:-translate-y-1 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30"
            >
              {t('aboutPage.exploreTrips')}

              <ArrowRight
                size={16}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-8 lg:grid-cols-3">
            {whyItems.map((item, index) => (
              <article
                key={item.title}
                className={`group about-fade-up rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.02] transition duration-300 hover:-translate-y-1.5 hover:border-blue-200 hover:shadow-[0_18px_40px_-22px_rgba(37,99,235,.32)] sm:p-6 ${index % 3 === 1
                    ? 'about-delay-1'
                    : index % 3 === 2
                      ? 'about-delay-2'
                      : ''
                  }`}
              >
                <FeatureIcon className={`${item.iconWrap} mb-5`}>
                  <item.icon size={20} strokeWidth={2} />
                </FeatureIcon>

                <h3 className="text-base font-bold tracking-tight text-slate-900">
                  {item.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {item.desc}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* IMPACT STATISTICS */}
      <section id="our-impact" className="scroll-mt-24">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="about-fade-up lg:col-span-4">
              <SectionEyebrow>{t('aboutPage.impactBadge')}</SectionEyebrow>

              <h2 className="max-w-sm text-3xl font-extrabold leading-[1.12] tracking-tight text-slate-950 sm:text-4xl">
                {t('aboutPage.impactTitle')}
              </h2>

              <p className="mt-5 max-w-md text-[15px] leading-7 text-slate-600">
                {t('aboutPage.impactDesc')}
              </p>

              <div className="mt-7">
                <ArrowLink href="#our-values">
                  {t('aboutPage.moreAbout')}
                </ArrowLink>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:col-span-8 lg:grid-cols-4">
              {stats.map((item, index) => (
                <article
                  key={item.label}
                  className={`group about-fade-up rounded-2xl border border-slate-200/80 bg-white px-3 py-6 text-center shadow-[0_8px_30px_-20px_rgba(15,23,42,.22)] transition duration-300 hover:-translate-y-1.5 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/[0.07] sm:rounded-3xl sm:px-4 sm:py-8 ${index % 2 ? 'about-delay-2' : 'about-delay-1'
                    }`}
                >
                  <div
                    className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ring-1 transition duration-300 group-hover:scale-110 ${item.wrap}`}
                  >
                    <item.icon size={21} strokeWidth={1.9} />
                  </div>

                  <p className="text-2xl font-extrabold leading-none tracking-tight text-slate-950 sm:text-3xl">
                    {item.value}
                  </p>

                  <p className="mx-auto mt-3 max-w-[10rem] text-xs font-medium leading-5 text-slate-500 sm:text-sm">
                    {item.label}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* OUR VALUES */}
      <section
        id="our-values"
        className="scroll-mt-24 border-y border-slate-200/70 bg-slate-50/80"
      >
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-12 lg:gap-14 lg:py-24">
          <div className="about-fade-up lg:col-span-4">
            <div className="group relative">
              <div className="absolute -inset-3 -z-10 rounded-[2rem] bg-gradient-to-br from-blue-100 to-violet-100 blur-xl" />

              <div className="aspect-[4/5] max-h-[30rem] overflow-hidden rounded-[1.75rem] border border-white bg-slate-200 shadow-[0_24px_70px_-28px_rgba(15,23,42,.3)]">
                <img
                  src="/images/about-values.jpg"
                  alt=""
                  className="about-values-img transition duration-700 ease-out group-hover:scale-[1.04]"
                  loading="lazy"
                />
              </div>
            </div>
          </div>

          <div className="about-fade-up about-delay-1 lg:col-span-8">
            <SectionEyebrow>{t('aboutPage.valuesBadge')}</SectionEyebrow>

            <h2 className="text-3xl font-extrabold leading-[1.12] tracking-tight text-slate-950 sm:text-4xl">
              {t('aboutPage.valuesTitle')}
            </h2>

            <p className="mt-5 max-w-2xl text-[15px] leading-7 text-slate-600">
              {t('aboutPage.valuesDesc')}
            </p>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {values.map((item) => (
                <article
                  key={item.title}
                  className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.02] transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-950/[0.05]"
                >
                  <FeatureIcon className={`${item.wrap} mb-4`}>
                    <item.icon size={19} strokeWidth={1.9} />
                  </FeatureIcon>

                  <h3 className="text-sm font-bold text-slate-900">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {item.desc}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="relative isolate overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#0b1b3a] via-[#123b7a] to-[#1d4ed8] p-6 shadow-[0_24px_70px_-28px_rgba(29,78,216,.55)] sm:rounded-[2rem] sm:p-9 lg:p-11">
          <div className="pointer-events-none absolute -right-16 -top-24 -z-10 h-72 w-72 rounded-full border-[42px] border-white/[0.06]" />

          <div className="pointer-events-none absolute -bottom-28 right-1/3 -z-10 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4 sm:items-center">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white shadow-inner shadow-white/10">
                <Bus size={22} />
              </span>

              <div>
                <h3 className="text-lg font-bold leading-snug text-white sm:text-xl">
                  {t('aboutPage.ctaTitle')}
                </h3>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100/85">
                  {t('aboutPage.ctaDesc')}
                </p>
              </div>
            </div>

            <Link
              to="/search-trips"
              className="group inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-blue-800 shadow-lg shadow-slate-950/10 transition duration-300 hover:-translate-y-1 hover:bg-blue-50 hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30"
            >
              {t('aboutPage.ctaBtn')}

              <ArrowRight
                size={16}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
