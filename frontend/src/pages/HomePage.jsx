import React, { useState } from 'react';
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

export default function HomePage() {
  const navigate = useNavigate();
  const [origin, setOrigin] = useState('Addis Ababa');
  const [destination, setDestination] = useState('Bahir Dar');
  const [departureDate, setDepartureDate] = useState('2024-10-10');
  const [openFaq, setOpenFaq] = useState(null);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams({
      from: origin,
      to: destination,
      date: departureDate,
    });
    navigate(`/search-trips?${params.toString()}`);
  };

  const operators = [
    {
      id: 'selam',
      name: 'Selam Bus',
      type: 'Private Bus Company',
      logoText: 'SB',
      logoBg: 'bg-[#1e3a8a]',
      rating: '4.6',
      reviews: '1.2k reviews',
      routeFrom: 'Addis Ababa',
      routeTo: 'Bahir Dar',
      extraRoutes: '+3 more',
      image: '/images/operators/selam-bus.png',
    },
    {
      id: 'abay',
      name: 'Abay Association',
      type: 'Transport Association',
      logo: 'mountain',
      logoBg: 'bg-[#2563eb]',
      rating: '4.4',
      reviews: '856 reviews',
      routeFrom: 'Addis Ababa',
      routeTo: 'Hawassa',
      extraRoutes: '+2 more',
      image: '/images/operators/abay-association.png',
    },
    {
      id: 'gebeya',
      name: 'Gebeya Bus',
      type: 'Private Bus Company',
      logoText: 'GB',
      logoBg: 'bg-[#16a34a]',
      rating: '4.5',
      reviews: '642 reviews',
      routeFrom: 'Addis Ababa',
      routeTo: 'Dire Dawa',
      extraRoutes: '+3 more',
      image: '/images/operators/gebeya-bus.png',
    },
    {
      id: 'mekelle',
      name: 'Mekelle Transport',
      type: 'Transport Association',
      logo: 'bus',
      logoBg: 'bg-[#1d4ed8]',
      rating: '4.3',
      reviews: '521 reviews',
      routeFrom: 'Addis Ababa',
      routeTo: 'Mekelle',
      extraRoutes: '+2 more',
      image: '/images/operators/mekelle-transport.png',
    },
  ];

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
    <div className="home-page bg-white text-[#1e293b]">
      <section className="home-hero">
        <div className="home-hero-visual">
          <img
            src="/images/hero-banner.png"
            alt="Blue BusTicket coach on a mountain lakeside road"
            className="home-hero-art"
          />
          <h1 className="sr-only">Book Bus Tickets Easily &amp; Securely</h1>
        </div>
      </section>

      <section className="bg-[#f7fafc] border-t border-slate-100">
        <div className="max-w-[1180px] mx-auto px-5 sm:px-8 py-11 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((item) => (
            <div key={item.title} className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-full bg-[#2563eb] text-white flex items-center justify-center flex-shrink-0 shadow-[0_8px_18px_rgba(37,99,235,0.28)]">
                <item.icon size={20} strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-[#0f172a]">{item.title}</h3>
                <p className="text-[13px] text-slate-500 leading-snug mt-1">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="bg-white py-14">
        <div className="max-w-[1180px] mx-auto px-5 sm:px-8">
          <div className="flex items-end justify-between gap-6 mb-8">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.22em] text-[#2563eb] uppercase mb-2">
                Meet Our Trusted
              </p>
              <h2 className="text-[30px] sm:text-[34px] font-extrabold text-[#0b1b3a] leading-tight">
                Popular Operators
              </h2>
              <p className="mt-2 text-[14px] text-slate-500 max-w-xl">
                Choose from top bus companies and transport associations
                <br className="hidden sm:block" />
                across the country.
              </p>
            </div>
            <Link
              to="/search-trips"
              className="hidden sm:inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#2563eb] hover:underline whitespace-nowrap"
            >
              View All Operators <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {operators.map((op) => (
              <article
                key={op.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-[0_10px_30px_rgba(15,23,42,0.06)] overflow-hidden"
              >
                <div className="h-[118px] overflow-hidden">
                  <img src={op.image} alt={op.name} className="w-full h-full object-cover" />
                </div>
                <div className="px-4 pt-4 pb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 ${op.logoBg} text-white rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0`}>
                      {op.logo === 'mountain' && <Mountain size={16} />}
                      {op.logo === 'bus' && <Bus size={16} />}
                      {op.logoText}
                    </div>
                    <div>
                      <h3 className="text-[14px] font-bold text-[#0f172a] leading-tight">{op.name}</h3>
                      <p className="text-[12px] text-slate-500">{op.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[13px] mb-3">
                    <Star size={14} className="fill-amber-400 text-amber-400" />
                    <span className="font-semibold text-slate-800">{op.rating}</span>
                    <span className="text-slate-400">({op.reviews})</span>
                  </div>
                  <p className="text-[12px] text-slate-500 mb-4">
                    {op.routeFrom} <span className="text-slate-300">→</span> {op.routeTo}{' '}
                    <span className="text-slate-400">{op.extraRoutes}</span>
                  </p>
                  <Link
                    to={`/search-trips?from=${encodeURIComponent(op.routeFrom)}&to=${encodeURIComponent(op.routeTo)}&date=${departureDate}`}
                    className="flex items-center justify-center gap-1.5 text-[13px] font-semibold text-[#2563eb] border border-[#2563eb] rounded-lg py-2 hover:bg-blue-50 transition-colors"
                  >
                    View Trips <ArrowRight size={14} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#eef6fc]">
        <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(to_top,#d7e8f5,transparent)]" />
        <div className="relative z-10 max-w-[1180px] mx-auto px-5 sm:px-8 py-14 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-4">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-[#2563eb] uppercase mb-3">On The Go</p>
            <h2 className="text-[30px] sm:text-[36px] font-extrabold text-[#0b1b3a] leading-[1.15]">
              Book Your Ticket
              <br />
              with Our Mobile App
            </h2>
            <p className="mt-4 text-[14px] text-slate-500 leading-relaxed max-w-sm">
              Get the best experience with our mobile app.
              <br />
              Available on both Android and iOS.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#google-play" className="store-badge">
                <svg width="18" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M3.6 2.2c-.4.3-.6.8-.6 1.4v16.8c0 .6.2 1.1.6 1.4l10.3-9.8L3.6 2.2z" />
                  <path d="M16.7 15.6 13.4 12.4 16.7 9.2l4.1 2.3c1.2.7 1.2 2.1 0 2.8l-4.1 2.3z" />
                  <path d="M13.4 12.4 3.6 21.8c.5.1 1.1 0 1.6-.3l9.6-5.5-1.4-3.6z" />
                  <path d="M13.4 12.4 14.8 8.8 5.2 3.3C4.7 3 4.1 2.9 3.6 3l9.8 9.4z" />
                </svg>
                <span className="text-left leading-tight">
                  <span className="block text-[8px] uppercase tracking-wider text-slate-300">Get it on</span>
                  <span className="block text-[13px] font-semibold">Google Play</span>
                </span>
              </a>
              <a href="#app-store" className="store-badge">
                <svg width="18" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M16.4 12.7c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.6.9s-1.9-1-3.2-.9c-1.6.1-3.1 1-3.9 2.5-1.7 2.9-.4 7.2 1.2 9.6.8 1.2 1.7 2.5 3 2.4 1.2-.1 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.2 2.9-2.3.9-1.3 1.3-2.6 1.3-2.6s-2.5-1-2.3-3.9zM14.3 5.8c.6-.8 1.1-1.9.9-3-1 .1-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.2-.5 2.9-1.4z" />
                </svg>
                <span className="text-left leading-tight">
                  <span className="block text-[8px] uppercase tracking-wider text-slate-300">Download on the</span>
                  <span className="block text-[13px] font-semibold">App Store</span>
                </span>
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center">
            <img
              src="/images/mobile-app-mockup.png"
              alt="BusTicket mobile app"
              className="w-full max-w-[420px] drop-shadow-2xl"
            />
          </div>

          <div className="lg:col-span-3 space-y-5">
            {appPerks.map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-full bg-[#2563eb] text-white flex items-center justify-center flex-shrink-0 shadow-[0_8px_18px_rgba(37,99,235,0.25)]">
                  <item.icon size={18} strokeWidth={2} />
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-[#0f172a]">{item.title}</h4>
                  <p className="text-[12px] text-slate-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="max-w-[1180px] mx-auto px-5 sm:px-8 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-[#2563eb] uppercase mb-2">
              What Our Customers Say
            </p>
            <h2 className="text-[30px] sm:text-[32px] font-extrabold text-[#0b1b3a]">Trusted by Thousands</h2>
            <p className="mt-2 mb-7 text-[14px] text-slate-500">
              See what our passengers and operators have to say about BusTicket.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {testimonials.map((t) => (
                <article key={t.id} className="rounded-xl border border-slate-100 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)] p-4">
                  <div className="flex items-center gap-2.5 mb-3">
                    <img src={t.avatar} alt={t.name} className="w-9 h-9 rounded-full object-cover" />
                    <div>
                      <h4 className="text-[13px] font-bold text-[#0f172a] leading-tight">{t.name}</h4>
                      <p className="text-[11px] text-slate-400">{t.role}</p>
                    </div>
                  </div>
                  <p className="text-[12px] text-slate-600 leading-relaxed min-h-[72px] italic">{t.text}</p>
                  <div className="flex gap-0.5 mt-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={13} className="fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-[#2563eb] uppercase mb-2">
              Frequently Asked Questions
            </p>
            <h2 className="text-[30px] sm:text-[32px] font-extrabold text-[#0b1b3a]">Need Help? We&apos;re Here.</h2>
            <p className="mt-2 mb-6 text-[14px] text-slate-500">
              Find answers to common questions about our platform.
            </p>
            <div className="space-y-2.5">
              {faqs.map((question, index) => (
                <div key={question} className="rounded-lg border border-slate-200 bg-white">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left text-[14px] text-slate-700 hover:text-[#2563eb]"
                  >
                    <span>{question}</span>
                    {openFaq === index ? (
                      <ChevronUp size={16} className="text-[#2563eb] flex-shrink-0" />
                    ) : (
                      <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />
                    )}
                  </button>
                  {openFaq === index && (
                    <p className="px-4 pb-3 text-[13px] text-slate-500 leading-relaxed">{faqAnswers[index]}</p>
                  )}
                </div>
              ))}
            </div>
            <Link to="/contact" className="inline-flex items-center gap-1.5 mt-5 text-[14px] font-semibold text-[#2563eb] hover:underline">
              View All FAQs <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
