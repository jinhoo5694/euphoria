'use client';

import { ReactNode, CSSProperties } from 'react';

interface JarvisFrameProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

// Custom JARVIS-style frame without Arwes dependency
export default function JarvisFrame({
  children,
  className = '',
  style = {},
}: JarvisFrameProps) {
  return (
    <div
      className={`relative ${className}`}
      style={style}
    >
      {/* Frame border */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          border: '1px solid var(--primary)',
          background: 'rgba(0, 212, 255, 0.03)',
          clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)',
        }}
      />
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2" style={{ borderColor: 'var(--primary)' }} />
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2" style={{ borderColor: 'var(--primary)' }} />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2" style={{ borderColor: 'var(--primary)' }} />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2" style={{ borderColor: 'var(--primary)' }} />

      <div className="relative z-10 p-4">
        {children}
      </div>
    </div>
  );
}
