'use client';

import { useSound } from '../context/SoundContext';

interface NewsCardProps {
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  votes?: number;
  comments?: number;
  maker?: string;
  imageUrl?: string;
  onSelect: (article: { url: string; title: string; source: string }) => void;
}

export default function NewsCard({
  title,
  description,
  url,
  source,
  publishedAt,
  votes,
  comments,
  maker,
  imageUrl,
  onSelect,
}: NewsCardProps) {
  const { playSound } = useSound();
  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));

      if (diffHrs < 1) return 'Just now';
      if (diffHrs < 24) return `${diffHrs}h ago`;
      const diffDays = Math.floor(diffHrs / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return 'Recently';
    }
  };

  const handleClick = () => {
    playSound('click');
    onSelect({ url, title, source });
  };

  const handleHover = () => {
    playSound('hover');
  };

  const isProductHunt = source === 'Product Hunt';

  return (
    <button
      onClick={handleClick}
      onMouseEnter={handleHover}
      className="block relative group news-card p-4 min-h-[140px] w-full text-left cursor-pointer"
    >
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l transition-all group-hover:w-4 group-hover:h-4" style={{ borderColor: 'var(--primary)' }} />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r transition-all group-hover:w-4 group-hover:h-4" style={{ borderColor: 'var(--primary)' }} />

      <div className="relative z-10 flex gap-4">
        {/* Product thumbnail for ProductHunt items */}
        {isProductHunt && imageUrl && (
          <div
            className="shrink-0 w-16 h-16 rounded overflow-hidden"
            style={{
              border: '1px solid var(--border)',
              background: 'rgba(0, 0, 0, 0.5)',
            }}
          >
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Source badge */}
          <div className="flex items-center justify-between mb-2">
            <span
              className="text-xs tracking-wider px-2 py-1"
              style={{
                background: isProductHunt ? 'rgba(255, 107, 53, 0.1)' : 'rgba(0, 212, 255, 0.1)',
                border: `1px solid ${isProductHunt ? 'rgba(255, 107, 53, 0.3)' : 'rgba(0, 212, 255, 0.3)'}`,
                color: isProductHunt ? 'var(--secondary)' : 'var(--primary)',
              }}
            >
              {source.toUpperCase()}
            </span>
            <span className="text-xs opacity-50">
              {formatTime(publishedAt)}
            </span>
          </div>

          {/* Title */}
          <h3
            className="font-semibold mb-1 leading-tight line-clamp-2 group-hover:text-[var(--accent)] transition-colors"
            style={{ color: 'var(--primary)' }}
          >
            {title}
          </h3>

          {/* Maker info for ProductHunt */}
          {isProductHunt && maker && (
            <p className="text-xs mb-1" style={{ color: 'var(--secondary)' }}>
              by {maker}
            </p>
          )}

          {/* Description / Tagline */}
          <p className="text-sm opacity-60 line-clamp-2 mb-3">
            {description}
          </p>

          {/* Footer with votes and comments */}
          <div className="flex items-center gap-4 text-xs">
            {votes !== undefined && (
              <span style={{ color: 'var(--secondary)' }}>
                ▲ {votes}
              </span>
            )}
            {comments !== undefined && (
              <span style={{ color: 'var(--primary)' }}>
                💬 {comments}
              </span>
            )}
            <span className="opacity-40 group-hover:opacity-100 transition-opacity ml-auto">
              VIEW →
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
