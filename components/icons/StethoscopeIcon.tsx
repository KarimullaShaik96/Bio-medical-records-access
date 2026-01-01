import React from 'react';

const StethoscopeIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h10a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.88 15.12A3.001 3.001 0 114.88 12.12m11.24 3a3.001 3.001 0 11-3-3"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3v2m0 4V7m0 0a2 2 0 100 4 2 2 0 000-4z"
    />
  </svg>
);

export default StethoscopeIcon;
