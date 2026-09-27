import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export const NotFoundPage = () => {
  const { t } = useTranslation();

  return (
    <div className="main-content" style={{ textAlign: 'center', padding: '80px 20px' }}>
      <div style={{ maxWidth: '420px', margin: '0 auto' }}>
        <div
          className="icon-circle icon-circle-danger"
          style={{ margin: '0 auto 20px' }}
        >
          <AlertCircle size={36} />
        </div>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '6px', lineHeight: 1 }}>
          {t('notFound.title')}
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', marginBottom: '28px' }}>
          {t('notFound.subtitle')}
        </p>
        <Link to="/dashboard" className="btn btn-primary btn-block">
          <ArrowLeft size={16} /> {t('notFound.backBtn')}
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
