import React from 'react';
import { ScanLine } from 'lucide-react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const dimensions = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-20 w-20'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`relative ${dimensions[size]} flex items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-500 to-violetAccent-500 text-white shadow-lg shadow-brand-500/20 animate-pulse-slow`}>
        {/* Outer Scanner Target Corners */}
        <div className="absolute inset-1.5 border-t-2 border-l-2 border-white/80 rounded-tl-md w-3 h-3"></div>
        <div className="absolute inset-1.5 border-t-2 border-r-2 border-white/80 rounded-tr-md w-3 h-3 right-1.5"></div>
        <div className="absolute inset-1.5 border-b-2 border-l-2 border-white/80 rounded-bl-md w-3 h-3 bottom-1.5"></div>
        <div className="absolute inset-1.5 border-b-2 border-r-2 border-white/80 rounded-br-md w-3 h-3 bottom-1.5 right-1.5"></div>
        
        <ScanLine className={`${iconSizes[size]} stroke-[2.5]`} />
        
        {/* Scanning Laser Line */}
        <div className="absolute left-0 right-0 h-[2px] bg-accent-500 shadow-md shadow-accent-500/80 animate-bounce top-1/2"></div>
      </div>
      <div className="flex flex-col justify-center">
        <h1 className={`font-black tracking-tight text-brand-950 leading-none ${size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-xl' : 'text-lg'}`}>
          QUAN<span className="text-brand-500">SCAN</span>
        </h1>
        {size !== 'sm' && (
          <p className="text-[9px] text-brand-600 font-bold tracking-widest uppercase mt-1">
            AI Quantity Counter
          </p>
        )}
      </div>
    </div>
  );
};
