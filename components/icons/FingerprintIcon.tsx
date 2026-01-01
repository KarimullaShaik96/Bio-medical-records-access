import React from 'react';

const FingerprintIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M5.07 10.82c.53-.43 1.12-.79 1.76-1.09.52-.24 1.06-.44 1.62-.58.5-.12 1-.2 1.51-.24.52-.04 1.04-.06 1.57-.06.52 0 1.03.02 1.54.06.5.04 1 .12 1.48.24.56.14 1.1.34 1.6.58.64.3 1.22.66 1.74 1.09M9.5 14.5c0 .55.15 1.08.43 1.55.28.47.66.88 1.1 1.2.47.34.99.6 1.55.77.56.17 1.14.25 1.74.25.59 0 1.17-.08 1.72-.25.55-.17 1.06-.43 1.52-.77.44-.32.82-.73 1.1-1.2.28-.47.43-1 .43-1.55M12 21c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7Zm-4-7c0 2.21 1.79 4 4 4s4-1.79 4-4-1.79-4-4-4-4 1.79-4 4Z"
    />
  </svg>
);

export default FingerprintIcon;
