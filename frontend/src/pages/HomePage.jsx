import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  Clock,
  Smartphone,
  Headphones,
  Star,
  ArrowRight,
  CheckCircle,
  Zap,
  Lock,
  ChevronDown,
  ChevronUp,
  Ticket,
  Bus,
  Mountain,
} from 'lucide-react';
import TripSearchBar from '@/components/TripSearchBar';
import ImageCarousel from '@/components/ImageCarousel';
import { getPublicOperatorsApi } from '@/api/trip.api';

const getTodayString = () => new Date().toISOString().split('T')[0];

export default function HomePage() {
  const navigate = useNavigate();
  const [origin, setOrigin] = useState('Addis Ababa');
  const [destination, setDestination] = useState('Bahir Dar');
  const [departureDate, setDepartureDate] = useState(getTodayString());
  const [openFaq, setOpenFaq] = useState(null);
  const [operators, setOperators] = useState([]);
  const [loadingOperators, setLoadingOperators] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchOperators = async () => {
      try {
        setLoadingOperators(true);
        const data = await getPublicOperatorsApi();
        if (isMounted && data) {
          setOperators(data);
        }
      } catch (err) {
        console.error('Failed to load operators from backend:', err);
      } finally {
        if (isMounted) setLoadingOperators(false);
      }
    };
    fetchOperators();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams({
      from: origin,
      to: destination,
      date: departureDate,
    });
    navigate(`/search-trips?${params.toString()}`);
  };



  const testimonials = [
    {
      id: 1,
      name: 'Abebe Kebede',
      role: 'Passenger',
      avatar: '/images/avatars/abebe.jpg',
      text: '"The booking process is so easy and fast. I love the digital ticket and QR verification!"',
    },
    {
      id: 2,
      name: 'Selam Bus',
      role: 'Operator',
      avatar: '/images/avatars/dawit.jpg',
      text: '"This platform helps us manage our trips and reach more passengers efficiently."',
    },
    {
      id: 3,
      name: 'Mulu Alemu',
      role: 'Passenger',
      avatar: '/images/avatars/sara.jpg',
      text: '"Excellent service, reliable and safe. I always book my trips here."',
    },
  ];

  const faqs = [
    'How do I book a bus ticket?',
    'What payment methods are available?',
    'Can I change or cancel my booking?',
    'How do I get my e-ticket?',
    'Is the platform safe and secure?',
  ];

  const faqAnswers = [
    'Select your origin, destination, and date, then choose a trip, pick a seat, and complete payment.',
    'We support Telebirr, CBE Birr, cards, and other local digital wallets.',
    'Yes. You can change or cancel from My Trips up to 6 hours before departure.',
    'Your e-ticket with a QR code is sent to your email and SMS as soon as payment is confirmed.',
    'Yes. We use SSL encryption and secure payment gateways to protect your information.',
  ];

  const features = [
    { icon: Shield, title: 'Safe & Reliable', desc: 'Trusted operators and secure payments.' },
    { icon: Clock, title: 'Real-Time Availability', desc: 'See live seat availability and choose your best option.' },
    { icon: Smartphone, title: 'Book Anywhere', desc: 'Use our website or mobile app for a seamless experience.' },
    { icon: Headphones, title: '24/7 Support', desc: "We're here to help, anytime, anywhere." },
  ];

  const appPerks = [
    { icon: CheckCircle, title: 'Easy Booking', desc: 'Book in just a few taps.' },
    { icon: Ticket, title: 'Instant Tickets', desc: 'Get your e-ticket instantly.' },
    { icon: Zap, title: 'Real-time Updates', desc: 'Track your trip live.' },
    { icon: Lock, title: 'Secure Payments', desc: 'Multiple payment options.' },
  ];
  return (
    <div className="home-page bg-white dark:bg-slate-900 text-[#1e293b] dark:text-slate-100 w-full overflow-x-hidden">
      {/* Hero Section with 5s Horizontal Auto-carousel and Top Full-Width Banner Text */}
      <section className="home-hero relative w-full overflow-hidden bg-slate-950">
        <ImageCarousel
          images={['/bus0.jpg', '/bus1.jpg', '/bus2.jpg']}
          interval={5000}
          className="w-full h-[286px] sm:h-[386px] lg:h-[486px] flex items-start"
        >
          <div className="w-full flex flex-col items-center justify-start pt-5 sm:pt-7 lg:pt-8 px-4 sm:px-6 lg:px-8 text-center">
            <div className="w-full max-w-5xl mx-auto flex flex-col items-center">
              {/* Top Verified Pill Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs sm:text-sm font-semibold mb-3 sm:mb-4 shadow-xl transition-transform hover:scale-105">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e] shadow-[0_0_10px_#f43f5e] animate-ping" />
                <span className="tracking-wide">Fast &amp; Verified Intercity Bus Booking in Ethiopia</span>
              </div>

              {/* Main Headline Full Width across the top near navbar */}
              <h1 className="w-full text-2xl sm:text-4xl md:text-5xl lg:text-[56px] font-black text-white leading-[1.14] tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)]">
                Book Bus Tickets{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-300 to-amber-200">
                  Easily &amp; Securely
                </span>
              </h1>

              {/* Full Width Corridor and Features Horizontal Tagline */}
              <p className="mt-2.5 sm:mt-3 text-xs sm:text-sm md:text-base text-slate-100 max-w-3xl font-medium drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                Travel across Ethiopia with premier licensed operators. Instant e-tickets with live QR verification.
              </p>

              {/* Horizontal Badges Bar Spanning Across Top Banner */}
              <div className="mt-3 sm:mt-4 flex items-center justify-center gap-2 sm:gap-3 flex-wrap text-[11px] sm:text-xs font-semibold text-white/95">
                <span className="inline-flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/15 shadow-sm">
                  <Shield size={13} className="text-[#f43f5e]" /> Licensed Operators
                </span>
                <span className="inline-flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/15 shadow-sm">
                  <Zap size={13} className="text-amber-400" /> Instant QR E-Tickets
                </span>
                <span className="inline-flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/15 shadow-sm">
                  <Ticket size={13} className="text-emerald-400" /> Real-time Seat Choice
                </span>
              </div>
            </div>
          </div>
        </ImageCarousel>
      </section>

      {/* Popular Operators Section */}
      <section className="bg-white dark:bg-slate-900 pt-8 pb-14 border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#f43f5e] mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f43f5e]" />
                Accredited Fleets
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Popular Operators
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Top rated bus companies with verified licenses and scheduled routes.
              </p>
            </div>

            <Link
              to="/search-trips"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#f43f5e] hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 transition-colors group self-start sm:self-auto"
            >
              <span>View All Operators</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {loadingOperators && operators.length === 0 ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-4 shadow-sm animate-pulse">
                  <div className="h-[128px] bg-slate-100 dark:bg-slate-700 rounded-xl mb-4" />
                  <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-1/2 mb-4" />
                  <div className="h-9 bg-slate-100 dark:bg-slate-700 rounded-xl" />
                </div>
              ))
            ) : (
              operators.map((op) => (
                <article
                  key={op.id}
                  className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 shadow-[0_4px_20px_rgba(15,23,42,0.05)] hover:shadow-[0_16px_36px_rgba(244,63,94,0.12)] hover:border-rose-300 dark:hover:border-rose-500/50 transition-all duration-300 group flex flex-col justify-between overflow-hidden"
                >
                  <div>
                    {/* Operator Photo Header */}
                    <div className="h-[136px] overflow-hidden relative bg-slate-100 dark:bg-slate-700">
                      <img
                        src={op.image}
                        alt={op.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                      <div className="absolute top-2.5 right-2.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-100 shadow-md backdrop-blur-sm">
                          <CheckCircle size={12} className="text-emerald-500" />
                          Verified
                        </span>
                      </div>
                    </div>

                    {/* Operator Details */}
                    <div className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 ${op.logoBg} text-white rounded-xl flex items-center justify-center text-xs font-black shadow-md flex-shrink-0`}>
                          {op.logo === 'mountain' && <Mountain size={18} />}
                          {op.logo === 'bus' && <Bus size={18} />}
                          {op.logoText}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-[#f43f5e] dark:group-hover:text-rose-400 transition-colors">
                            {op.name}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {op.type}
                          </p>
                        </div>
                      </div>

                      {/* Rating */}
                      <div className="flex items-center gap-1.5 text-xs mb-3">
                        <Star size={14} className="fill-amber-400 text-amber-400 flex-shrink-0" />
                        <span className="font-bold text-slate-900 dark:text-white">{op.rating}</span>
                        <span className="text-slate-400">({op.reviews})</span>
                      </div>

                      {/* Routes */}
                      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-2.5 border border-slate-100 dark:border-slate-800 mb-4">
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-slate-800 dark:text-slate-100">{op.routeFrom}</span>
                          <span className="text-slate-400">→</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-100">{op.routeTo}</span>
                          {op.extraRoutes && (
                            <span className="text-[11px] text-[#f43f5e] font-bold bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded-md">
                              {op.extraRoutes}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Link */}
                  <div className="px-4 pb-4">
                    <Link
                      to={`/search-trips?operator=${encodeURIComponent(op.name)}`}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 hover:bg-[#f43f5e] hover:text-white dark:hover:bg-[#f43f5e] dark:hover:text-white transition-all duration-200 shadow-sm group/btn"
                    >
                      <span>View Trips</span>
                      <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="bg-white dark:bg-slate-900 py-12 border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="bg-slate-50/70 dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-sm flex items-start gap-4 hover:border-rose-200 dark:hover:border-rose-800 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-[#f43f5e] flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Icon size={22} strokeWidth={2.2} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                      {feat.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {feat.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Mobile App Download Showcase - White-like Background */}
      <section className="relative overflow-hidden bg-white dark:bg-slate-900 py-16 lg:py-20 border-b border-slate-100 dark:border-slate-800">
        <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-4">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#f43f5e] mb-3">
              <Smartphone size={14} />
              On The Go
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white leading-[1.18] tracking-tight">
              Book Your Ticket
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500">
                with Our Mobile App
              </span>
            </h2>
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
              Get the best experience with our mobile app. Available on both Android and iOS devices.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#google-play"
                className="inline-flex items-center gap-3 bg-slate-950 hover:bg-black text-white rounded-xl px-4 py-2.5 transition-all duration-200 hover:scale-105 shadow-md border border-slate-800"
              >
                <svg width="20" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M3.6 2.2c-.4.3-.6.8-.6 1.4v16.8c0 .6.2 1.1.6 1.4l10.3-9.8L3.6 2.2z" />
                  <path d="M16.7 15.6 13.4 12.4 16.7 9.2l4.1 2.3c1.2.7 1.2 2.1 0 2.8l-4.1 2.3z" />
                  <path d="M13.4 12.4 3.6 21.8c.5.1 1.1 0 1.6-.3l9.6-5.5-1.4-3.6z" />
                  <path d="M13.4 12.4 14.8 8.8 5.2 3.3C4.7 3 4.1 2.9 3.6 3l9.8 9.4z" />
                </svg>
                <span className="text-left leading-tight">
                  <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Get it on</span>
                  <span className="block text-sm font-bold text-white">Google Play</span>
                </span>
              </a>

              <a
                href="#app-store"
                className="inline-flex items-center gap-3 bg-slate-950 hover:bg-black text-white rounded-xl px-4 py-2.5 transition-all duration-200 hover:scale-105 shadow-md border border-slate-800"
              >
                <svg width="20" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M16.4 12.7c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.6.9s-1.9-1-3.2-.9c-1.6.1-3.1 1-3.9 2.5-1.7 2.9-.4 7.2 1.2 9.6.8 1.2 1.7 2.5 3 2.4 1.2-.1 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.2 2.9-2.3.9-1.3 1.3-2.6 1.3-2.6s-2.5-1-2.3-3.9zM14.3 5.8c.6-.8 1.1-1.9.9-3-1 .1-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.2-.5 2.9-1.4z" />
                </svg>
                <span className="text-left leading-tight">
                  <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Download on the</span>
                  <span className="block text-sm font-bold text-white">App Store</span>
                </span>
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center py-4">
            <img
              src="/images/mobile-app-mockup.png"
              alt="BusTicket mobile app preview"
              className="w-full max-w-[400px] drop-shadow-xl hover:scale-105 transition-transform duration-500 rounded-2xl"
            />
          </div>

          <div className="lg:col-span-3 space-y-4">
            {appPerks.map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-3.5 bg-slate-50 dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-500/40 transition-all shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f43f5e] to-rose-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-rose-500/25">
                  <item.icon size={18} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials & FAQs Section */}
      <section className="bg-gradient-to-b from-white via-slate-50 to-white dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 py-16 lg:py-20">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Customer Testimonials */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#f43f5e] mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f43f5e]" />
              What Our Customers Say
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Trusted by Thousands
            </h2>
            <p className="mt-1 mb-8 text-sm text-slate-500 dark:text-slate-400">
              See what our passengers and operators have to say about BusTicket.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {testimonials.map((t) => (
                <article
                  key={t.id}
                  className="rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-[0_4px_20px_rgba(15,23,42,0.04)] hover:shadow-[0_12px_32px_rgba(15,23,42,0.09)] hover:border-rose-200 dark:hover:border-rose-800 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <img
                        src={t.avatar}
                        alt={t.name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-rose-200 dark:border-rose-800 group-hover:scale-105 transition-transform"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-[#f43f5e] transition-colors">
                          {t.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 font-medium">{t.role}</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                      {t.text}
                    </p>
                  </div>

                  <div className="flex gap-1 mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={13} className="fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* FAQ Accordion */}
          <div className="lg:col-span-5">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#f43f5e] mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f43f5e]" />
              Frequently Asked Questions
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Need Help? We&apos;re Here.
            </h2>
            <p className="mt-1 mb-6 text-sm text-slate-500 dark:text-slate-400">
              Find answers to common questions about our platform.
            </p>

            <div className="space-y-3">
              {faqs.map((question, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={question}
                    className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                      isOpen
                        ? 'border-rose-300 dark:border-rose-800 bg-rose-50/20 dark:bg-rose-950/20 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="w-full px-4 py-3.5 flex items-center justify-between text-left text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 hover:text-[#f43f5e] dark:hover:text-rose-400 transition-colors"
                      aria-expanded={isOpen}
                    >
                      <span className="pr-2">{question}</span>
                      {isOpen ? (
                        <ChevronUp size={16} className="text-[#f43f5e] flex-shrink-0" />
                      ) : (
                        <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-3.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-rose-100 dark:border-rose-950/40 pt-2.5">
                        {faqAnswers[index]}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <Link
              to="/contact"
              className="inline-flex items-center gap-2 mt-6 text-xs sm:text-sm font-bold text-[#f43f5e] hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 transition-colors group"
            >
              <span>View All FAQs</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
