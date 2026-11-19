import React from 'react';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = '' }) => {
  return (
    <div className={`inline-flex items-center gap-2.5 shrink-0 ${className}`}>
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect width="32" height="32" rx="10" className="fill-teal-600 dark:fill-teal-500" />
        <path
          d="M8.5 14.5C10.5 12 13 12 15.5 13.5C18 15 20.5 15 23.5 12.5"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M8.5 19.5C11 17.5 13.5 17.5 16 19C18.5 20.5 21 20 23.5 18"
          stroke="#A7F3D0"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <circle cx="22.5" cy="9.5" r="2" fill="#ECFDF5" />
      </svg>
      <span className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
        AirAware
      </span>
    </div>
  );
};
