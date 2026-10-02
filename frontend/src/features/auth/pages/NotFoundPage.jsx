import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export const NotFoundPage = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-6">
          <AlertCircle size={36} className="text-red-600 dark:text-red-400" />
        </div>
        <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-2 leading-none">
          {t('notFound.title')}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg mb-8">
          {t('notFound.subtitle')}
        </p>
        <Link to="/dashboard" className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors duration-200 inline-block flex items-center justify-center gap-2">
          <ArrowLeft size={16} /> {t('notFound.backBtn')}
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
