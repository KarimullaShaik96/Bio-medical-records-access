import React from 'react';

const BrainCircuitIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0112 4.5z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 17.25a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 12a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 12a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12a6 6 0 1112 0 6 6 0 01-12 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.071 4.929a.75.75 0 01.028 1.06l-1.5 1.5a.75.75 0 11-1.06-1.06l1.5-1.5a.75.75 0 011.032 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.929 19.071a.75.75 0 011.06-.028l1.5 1.5a.75.75 0 11-1.06 1.06l-1.5-1.5a.75.75 0 01.028-1.06z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.071 19.071a.75.75 0 01-1.061-.028l-1.5 1.5a.75.75 0 11-1.06 1.06l1.5-1.5a.75.75 0 011.089-.028z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.929 4.929a.75.75 0 011.032 0l1.5 1.5a.75.75 0 11-1.06 1.06l-1.5-1.5a.75.75 0 01.028-1.06z" />
  </svg>
);

export default BrainCircuitIcon;
