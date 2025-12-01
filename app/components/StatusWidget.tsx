'use client';

import { useState, useEffect } from 'react';

interface StatusWidgetProps {
  lastUpdated: string;
  totalItems: number;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export default function StatusWidget({
  lastUpdated,
  totalItems,
  onRefresh,
  isRefreshing
}: StatusWidgetProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div
      className="relative p-4 glow-box"
      style={{
        background: 'rgba(0, 0, 0, 0.8)',
        border: '1px solid var(--border)',
      }}
    >
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2" style={{ borderColor: 'var(--primary)' }} />
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2" style={{ borderColor: 'var(--primary)' }} />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2" style={{ borderColor: 'var(--primary)' }} />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2" style={{ borderColor: 'var(--primary)' }} />

      <div className="relative z-10">
        {/* Time display */}
        <div className="text-center mb-4">
          <div
            className="text-4xl font-bold tracking-wider glow mb-1"
            style={{ color: 'var(--primary)' }}
          >
            {formatTime(currentTime)}
          </div>
          <div className="text-xs tracking-widest opacity-60">
            {formatDate(currentTime)}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-2" style={{ background: 'rgba(0, 212, 255, 0.05)' }}>
            <div className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>
              {totalItems}
            </div>
            <div className="text-xs tracking-wider opacity-60">ARTICLES</div>
          </div>
          <div className="text-center p-2" style={{ background: 'rgba(0, 212, 255, 0.05)' }}>
            <div className="text-2xl font-bold" style={{ color: 'var(--secondary)' }}>
              4
            </div>
            <div className="text-xs tracking-wider opacity-60">SOURCES</div>
          </div>
        </div>

        {/* Last updated */}
        <div className="text-xs text-center mb-4 opacity-60">
          LAST SYNC: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : '--:--:--'}
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="w-full py-2 px-4 text-sm tracking-wider font-bold transition-all hover:scale-105 disabled:opacity-50"
          style={{
            background: 'transparent',
            border: '1px solid var(--primary)',
            color: 'var(--primary)',
          }}
        >
          {isRefreshing ? (
            <span className="inline-block spinner">⟳</span>
          ) : (
            '↻ REFRESH DATA'
          )}
        </button>

        {/* Status indicators */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="opacity-60">CONNECTION</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full pulse-glow" style={{ background: 'var(--accent)' }} />
              SECURE
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="opacity-60">DATA STREAM</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full pulse-glow" style={{ background: 'var(--accent)' }} />
              ACTIVE
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
