import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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

  return (
    <div className="contact-page">
      <div className="page-hero-banner">
        <div className="page-hero-container">
          <span className="badge-light">{t('contactPage.badge')}</span>
          <h1>{t('contactPage.title')}</h1>
          <p>{t('contactPage.desc')}</p>
        </div>
      </div>

      <div className="contact-content-container">
        <div className="contact-grid">
          {/* Contact Details Card */}
          <div className="contact-info-card">
            <h3>{t('contactPage.channelsTitle')}</h3>
            <p>{t('contactPage.channelsDesc')}</p>

            <div className="contact-list">
              <div className="contact-item">
                <div className="contact-icon-box">
                  <Phone size={20} color="#2563eb" />
                </div>
                <div>
                  <h4>{t('contactPage.phoneTitle')}</h4>
                  <p>{t('contactPage.phoneDesc')}</p>
                  <small>{t('contactPage.phoneSub')}</small>
                </div>
              </div>

              <div className="contact-item">
                <div className="contact-icon-box">
                  <Mail size={20} color="#059669" />
                </div>
                <div>
                  <h4>{t('contactPage.emailTitle')}</h4>
                  <p>{t('contactPage.emailDesc')}</p>
                  <small>{t('contactPage.emailSub')}</small>
                </div>
              </div>

              <div className="contact-item">
                <div className="contact-icon-box">
                  <MapPin size={20} color="#d97706" />
                </div>
                <div>
                  <h4>{t('contactPage.hqTitle')}</h4>
                  <p>{t('contactPage.hqDesc')}</p>
                  <small>{t('contactPage.hqSub')}</small>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="contact-form-card">
            {submitted ? (
              <div className="contact-success-state">
                <CheckCircle2 size={48} color="#059669" />
                <h3>{t('contactPage.successTitle')}</h3>
                <p>
                  {t('contactPage.successDesc')} <strong>{formData.email}</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ name: '', email: '', subject: '', message: '' });
                  }}
                  className="btn btn-outline btn-sm"
                >
                  {t('contactPage.sendAnother')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="contact-form">
                <h3>{t('contactPage.formTitle')}</h3>

                <div className="form-group">
                  <label className="form-label">{t('contactPage.nameLabel')}</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter full name"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('contactPage.emailLabel')}</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@example.com"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('contactPage.subjectLabel')}</label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g. Booking assistance / Partner inquiry"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('contactPage.messageLabel')}</label>
                  <textarea
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="How can we help you?"
                    className="form-input"
                  />
                </div>

                <button type="submit" className="btn btn-primary btn-md">
                  <Send size={16} style={{ marginRight: 6 }} /> {t('contactPage.sendBtn')}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
