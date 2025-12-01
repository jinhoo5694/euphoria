'use client';

import NewsCard from './NewsCard';
import type { NewsItem } from '../api/news/route';

interface NewsSectionProps {
  title: string;
  icon: string;
  items: NewsItem[];
  accentColor?: string;
  onSelectArticle: (article: { url: string; title: string; source: string }) => void;
}

export default function NewsSection({
  title,
  icon,
  items,
  accentColor = 'var(--primary)',
  onSelectArticle,
}: NewsSectionProps) {
  return (
    <div className="relative">
      {/* Section header */}
      <div
        className="relative mb-4 p-3"
        style={{
          border: `1px solid ${accentColor}`,
          borderBottom: 'none',
          background: `linear-gradient(180deg, ${accentColor}10 0%, transparent 100%)`,
        }}
      >
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2" style={{ borderColor: accentColor }} />
        <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2" style={{ borderColor: accentColor }} />

        <div className="relative z-10 flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <h2
            className="text-lg font-bold tracking-wider"
            style={{ color: accentColor }}
          >
            {title}
          </h2>
          <div className="flex-1 h-px opacity-30" style={{ background: accentColor }} />
          <span className="text-xs opacity-50">{items.length} ITEMS</span>
        </div>
      </div>

      {/* News grid */}
      <div className="grid gap-3">
        {items.map((item) => (
          <NewsCard
            key={item.id}
            title={item.title}
            description={item.description}
            url={item.url}
            source={item.source}
            publishedAt={item.publishedAt}
            votes={item.votes}
            comments={item.comments}
            maker={item.maker}
            imageUrl={item.imageUrl}
            onSelect={onSelectArticle}
          />
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-8 opacity-50">
          <div className="text-2xl mb-2">📡</div>
          <p className="text-sm">SCANNING FOR DATA...</p>
        </div>
      )}
    </div>
  );
}
