import React from 'react';

interface TechHelpLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  inverted?: boolean;
}

export function TechHelpLogo({
  className = '',
  size = 'md',
  showTagline = false,
  inverted = false,
}: TechHelpLogoProps) {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* SVG Icon matching TechHelp Gear + Pin + Wrench */}
      <div className={`relative shrink-0 flex items-center justify-center ${iconSizes[size]}`}>
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-xs"
        >
          {/* Blue Gear Outer Cog (Primary #0D47A1) */}
          <path
            d="M24 4C21.8 4 20 5.8 20 8V8.3C18.6 8.7 17.3 9.3 16.1 10.1L15.9 9.9C14.3 8.3 11.8 8.3 10.2 9.9C8.7 11.4 8.7 14 10.2 15.6L10.4 15.8C9.6 17 9 18.3 8.6 19.7H8.3C6.1 19.7 4.3 21.5 4.3 23.7C4.3 25.9 6.1 27.7 8.3 27.7H8.6C9 29.1 9.6 30.4 10.4 31.6L10.2 31.8C8.7 33.4 8.7 35.9 10.2 37.5C11.8 39.1 14.3 39.1 15.9 37.5L16.1 37.3C17.3 38.1 18.6 38.7 20 39.1V39.4C20 41.6 21.8 43.4 24 43.4C26.2 43.4 28 41.6 28 39.4V39.1C29.4 38.7 30.7 38.1 31.9 37.3L32.1 37.5C33.7 39.1 36.2 39.1 37.8 37.5C39.3 35.9 39.3 33.4 37.8 31.8L37.6 31.6C38.4 30.4 39 29.1 39.4 27.7H39.7C41.9 27.7 43.7 25.9 43.7 23.7C43.7 21.5 41.9 19.7 39.7 19.7H39.4C39 18.3 38.4 17 37.6 15.8L37.8 15.6C39.3 14 39.3 11.5 37.8 9.9C36.2 8.4 33.7 8.4 32.1 9.9L31.9 10.1C30.7 9.3 29.4 8.7 28 8.3V8C28 5.8 26.2 4 24 4Z"
            fill={inverted ? '#FFFFFF' : '#0D47A1'}
          />
          {/* Inner Circle cut */}
          <circle cx="24" cy="23.7" r="13" fill={inverted ? '#0D47A1' : '#FFFFFF'} />
          
          {/* Orange Location Pin + Service Heart (Accent #FF8A00) */}
          <path
            d="M24 13C20.13 13 17 16.13 17 20C17 25.25 24 33 24 33C24 33 31 25.25 31 20C31 16.13 27.87 13 24 13Z"
            fill="#FF8A00"
          />
          {/* White Center Tool Dot / Hole */}
          <circle cx="24" cy="19.5" r="3.2" fill="#FFFFFF" />
        </svg>
      </div>

      {/* Wordmark */}
      <div className="flex flex-col text-start">
        <div className={`font-black tracking-tight leading-none ${textSizes[size]}`}>
          <span className={inverted ? 'text-white' : 'text-[#0D47A1]'}>Tech</span>
          <span className="text-[#FF8A00]">Help</span>
        </div>
        {showTagline && (
          <span
            className={`text-[10px] font-medium tracking-normal mt-0.5 leading-tight ${
              inverted ? 'text-slate-300' : 'text-slate-500'
            }`}
          >
            Find the Right Technician, Anytime, Anywhere
          </span>
        )}
      </div>
    </div>
  );
}
