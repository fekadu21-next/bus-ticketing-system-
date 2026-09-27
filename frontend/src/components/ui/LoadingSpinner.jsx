import React from 'react';

/**
 * Reusable loading spinner with optional label.
 * @param {Object} props
 * @param {string} [props.label] - Optional text below spinner
 * @param {'sm'|'md'|'lg'} [props.size='md'] - Spinner size
 * @param {boolean} [props.fullPage=false] - Center on full screen
 */
const LoadingSpinner = ({ label, size = 'md', fullPage = false }) => {
  const sizeMap = { sm: '20px', md: '32px', lg: '48px' };
  const dim = sizeMap[size] || sizeMap.md;

  const spinner = (
    <div style={{ textAlign: 'center' }}>
      <div
        className="spinner"
        style={{ width: dim, height: dim, margin: '0 auto' }}
        aria-label="Loading"
        role="status"
      />
      {label && (
        <p style={{ marginTop: '12px', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
          {label}
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
