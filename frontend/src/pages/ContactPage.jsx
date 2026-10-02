import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, Clock, ArrowRight, HeadphonesIcon, MessageSquare, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ContactIcon = ({ className, children }) => (
  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${className}`}>
    {children}
  </div>
);

export const ContactPage = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const contactChannels = [
    {
      icon: Phone,
      iconWrap: 'bg-gradient-to-br from-teal-500 to-teal-600 text-white',
      title: 'Call Us',
      value: '+251 911 123 456',
      desc: 'Mon-Fri 8am-6pm, Sat 9am-2pm',
    },
    {
      icon: Mail,
      iconWrap: 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white',
      title: 'Email Us',
      value: 'support@busticket.et',
      desc: 'We reply within 24 hours',
    },
    {
      icon: MapPin,
      iconWrap: 'bg-gradient-to-br from-rose-500 to-rose-600 text-white',
      title: 'Visit Us',
      value: 'Bole Road, Addis Ababa',
      desc: 'Open Mon-Sat 9am-5pm',
    },
  ];

  const faqItems = [
    { q: 'How do I book a ticket?', a: 'You can book tickets through our website by searching for your route, selecting seats, and completing payment.' },
    { q: 'Can I cancel my booking?', a: 'Yes, you can cancel your booking up to 24 hours before departure. Refunds are processed within 5-7 business days.' },
    { q: 'What payment methods do you accept?', a: 'We accept mobile money (Telebirr, M-Pesa), bank cards, and cash at our partner offices.' },
  ];

  return (
    <div className="contact-page bg-white text-[#0f172a]">
      {/* Hero Section - Gradient Background with Animation */}
      <section className="relative bg-gradient-to-br from-teal-600 via-teal-700 to-indigo-800 py-20 px-6 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/5 rounded-full animate-float-slow"></div>
          <div className="absolute top-20 right-20 w-24 h-24 bg-white/5 rounded-full animate-float-medium"></div>
          <div className="absolute bottom-10 left-1/4 w-40 h-40 bg-white/5 rounded-full animate-float-fast"></div>
          <div className="absolute bottom-20 right-1/3 w-20 h-20 bg-white/5 rounded-full animate-float-slow"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-6 backdrop-blur-sm animate-pulse-slow">
            <HeadphonesIcon size={18} className="text-white" />
            <span className="text-white text-sm font-medium">24/7 Support Available</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 animate-slide-up">Contact Us</h1>
          <p className="text-lg text-teal-100 max-w-2xl mx-auto animate-slide-up-delay">
            We're here to help you with bookings, payments, or any questions about your journey with BusTicket.
          </p>
        </div>
      </section>

      {/* Contact Information Section */}
      <section className="max-w-[1180px] mx-auto px-5 sm:px-8 py-14 lg:py-16">
        <div className="text-center mb-12">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-teal-600 uppercase mb-2 animate-fade-in">
            Get in Touch
          </p>
          <h2 className="text-[28px] sm:text-[34px] font-extrabold text-[#0b1b3a] leading-[1.15] animate-slide-up">
            Multiple Ways to Reach Us
          </h2>
          <p className="mt-4 text-[14px] text-slate-500 max-w-2xl mx-auto animate-slide-up-delay">
            Choose the most convenient way to contact our support team. We're available through multiple channels.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {contactChannels.map((channel, idx) => (
            <div
              key={channel.title}
              className="rounded-2xl border border-slate-100 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.08)] p-6 text-center hover:shadow-[0_12px_32px_rgba(15,23,42,0.15)] hover:-translate-y-1 transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <ContactIcon className={`${channel.iconWrap} mx-auto mb-4 shadow-lg hover:scale-110 transition-transform duration-300`}>
                <channel.icon size={24} />
              </ContactIcon>
              <h3 className="text-[16px] font-bold text-[#0f172a] mb-2">{channel.title}</h3>
              <p className="text-[15px] font-semibold text-teal-600 mb-2">{channel.value}</p>
              <p className="text-[13px] text-slate-500">{channel.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="bg-gradient-to-b from-slate-50 to-white border-y border-slate-100">
        <div className="max-w-[1180px] mx-auto px-5 sm:px-8 py-14 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5">
              <p className="text-[11px] font-semibold tracking-[0.22em] text-teal-600 uppercase mb-2">
                Send a Message
              </p>
              <h2 className="text-[28px] sm:text-[32px] font-extrabold text-[#0b1b3a] leading-[1.15]">
                Drop Us a Line
              </h2>
              <p className="mt-4 text-[14px] text-slate-500 leading-relaxed">
                Fill out the form below and our team will get back to you as soon as possible. We typically respond within 24 hours on business days.
              </p>

              <div className="mt-8 space-y-5">
                <div className="flex items-center gap-3 p-4 bg-teal-50 rounded-xl hover:bg-teal-100 transition-colors duration-300 cursor-default">
                  <Clock size={20} className="text-teal-600" />
                  <div>
                    <p className="text-[14px] font-semibold text-[#0f172a]">Response Time</p>
                    <p className="text-[13px] text-slate-600">Within 24 hours</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors duration-300 cursor-default">
                  <Mail size={20} className="text-indigo-600" />
                  <div>
                    <p className="text-[14px] font-semibold text-[#0f172a]">Email Support</p>
                    <p className="text-[13px] text-slate-600">support@busticket.et</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-rose-50 rounded-xl hover:bg-rose-100 transition-colors duration-300 cursor-default">
                  <MessageSquare size={20} className="text-rose-600" />
                  <div>
                    <p className="text-[14px] font-semibold text-[#0f172a]">Live Chat</p>
                    <p className="text-[13px] text-slate-600">Available 9am-6pm</p>
                  </div>
                </div>
              </div>

              {/* FAQ Section */}
              <div className="mt-10">
                <h3 className="text-[18px] font-bold text-[#0f172a] mb-4">Frequently Asked Questions</h3>
                <div className="space-y-3">
                  {faqItems.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="p-4 bg-white rounded-xl border border-slate-200 hover:border-teal-300 hover:shadow-md transition-all duration-300 cursor-default"
                    >
                      <p className="text-[14px] font-semibold text-[#0f172a] mb-1">{item.q}</p>
                      <p className="text-[13px] text-slate-600">{item.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.08)] p-6 md:p-8 hover:shadow-[0_12px_32px_rgba(15,23,42,0.12)] transition-shadow duration-300">
                {submitted ? (
                  <div className="text-center py-12 animate-fade-in">
                    <div className="w-20 h-20 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-6 animate-bounce-slow">
                      <CheckCircle2 size={40} className="text-teal-600" />
                    </div>
                    <h3 className="text-[24px] font-bold text-[#0f172a] mb-2">Message Sent Successfully!</h3>
                    <p className="text-[15px] text-slate-600 mb-2">
                      Thank you for reaching out to us.
                    </p>
                    <p className="text-[14px] text-slate-500 mb-8">
                      We'll get back to you at <strong className="text-[#0f172a]">{formData.email}</strong> within 24 hours.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSubmitted(false);
                        setFormData({ name: '', email: '', subject: '', message: '' });
                      }}
                      className="px-6 py-3 rounded-full border-2 border-slate-300 text-[14px] font-semibold text-slate-700 hover:border-teal-600 hover:text-teal-600 transition-all duration-300 hover:shadow-md"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[14px] font-semibold text-[#0f172a] mb-2">Full Name *</label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Enter your full name"
                          className="w-full px-4 py-3 text-[14px] rounded-xl border border-slate-300 bg-white text-[#0f172a] placeholder:text-slate-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent hover:border-teal-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[14px] font-semibold text-[#0f172a] mb-2">Email Address *</label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="name@example.com"
                          className="w-full px-4 py-3 text-[14px] rounded-xl border border-slate-300 bg-white text-[#0f172a] placeholder:text-slate-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent hover:border-teal-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[14px] font-semibold text-[#0f172a] mb-2">Subject *</label>
                      <input
                        type="text"
                        required
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="e.g. Booking assistance / Partner inquiry"
                        className="w-full px-4 py-3 text-[14px] rounded-xl border border-slate-300 bg-white text-[#0f172a] placeholder:text-slate-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent hover:border-teal-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[14px] font-semibold text-[#0f172a] mb-2">Message *</label>
                      <textarea
                        rows={6}
                        required
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="Please describe how we can help you..."
                        className="w-full px-4 py-3 text-[14px] rounded-xl border border-slate-300 bg-white text-[#0f172a] placeholder:text-slate-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none hover:border-teal-400"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full px-6 py-3.5 rounded-xl bg-gradient-to-r from-teal-600 to-indigo-600 text-white text-[14px] font-semibold hover:from-teal-700 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 hover:-translate-y-0.5"
                    >
                      <Send size={18} />
                      Send Message
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <div className="max-w-[1180px] mx-auto px-5 sm:px-8 py-10">
        <div className="contact-cta hover:shadow-2xl transition-shadow duration-300">
          <div className="flex items-center gap-4">
            <span className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 animate-pulse-slow">
              <Phone size={22} className="text-white" />
            </span>
            <div>
              <h3 className="text-[18px] sm:text-[20px] font-bold text-white leading-tight">
                Need Immediate Assistance?
              </h3>
              <p className="text-[13px] text-teal-100/80 mt-0.5">Call our support team directly for urgent matters</p>
            </div>
          </div>
          <a
            href="tel:+251911123456"
            className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full bg-white text-teal-600 text-[14px] font-semibold hover:bg-teal-50 transition-all duration-300 whitespace-nowrap shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            Call Now <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
