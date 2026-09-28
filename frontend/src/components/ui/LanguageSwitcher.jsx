import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

/**
 * Language switcher toggle button — cycles between English and Amharic.
 * Persists selection via i18next's localStorage detector.
 */
const LanguageSwitcher = ({ variant = 'default' }) => {
  const { i18n, t } = useTranslation();
  const isAmharic = i18n.language === 'am';

  const toggle = () => {
    i18n.changeLanguage(isAmharic ? 'en' : 'am');
  };

  const isCompact = variant === 'compact';

  return (
    <button
      onClick={toggle}
      className="lang-switcher"
      title={isAmharic ? 'Switch to English' : 'ወደ አማርኛ ቀይር'}
      aria-label="Switch language"
      style={isCompact ? { padding: '4px 8px', fontSize: '0.8rem' } : {}}
    >
      <Globe size={isCompact ? 13 : 15} aria-hidden="true" />
      <span>{t('nav.switchLang')}</span>
    </button>
  );
};

export default LanguageSwitcher;
