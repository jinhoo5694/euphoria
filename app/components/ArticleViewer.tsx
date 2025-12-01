'use client';

import { useEffect, useState, useCallback } from 'react';

interface ArticleViewerProps {
  url: string;
  title: string;
  source: string;
  onClose: () => void;
}

interface ArticleContent {
  title: string;
  description: string;
  image: string;
  siteName: string;
  content: string;
  url: string;
  fetchFailed?: boolean;
}

export default function ArticleViewer({ url, title, source, onClose }: ArticleViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [article, setArticle] = useState<ArticleContent | null>(null);

  const fetchArticle = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/fetch-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, title, description: '' }),
      });

      if (!response.ok) {
        // If API fails, show basic info
        setArticle({
          title,
          description: '',
          image: '',
          siteName: source,
          content: '',
          url,
          fetchFailed: true,
        });
        return;
      }

      const data = await response.json();
      setArticle(data);
    } catch (err) {
      console.error('Error fetching article:', err);
      // Show basic info on error
      setArticle({
        title,
        description: '',
        image: '',
        siteName: source,
        content: '',
        url,
        fetchFailed: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [url, title, source]);

  useEffect(() => {
    fetchArticle();
  }, [fetchArticle]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const renderContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={i} className="h-4" />;

      // Headers
      if (trimmed.startsWith('## ')) {
        return (
          <h2 key={i} className="text-2xl font-bold mt-6 mb-3" style={{ color: 'var(--primary)' }}>
            {trimmed.slice(3)}
          </h2>
        );
      }
      if (trimmed.startsWith('### ')) {
        return (
          <h3 key={i} className="text-xl font-bold mt-5 mb-2" style={{ color: 'var(--primary)' }}>
            {trimmed.slice(4)}
          </h3>
        );
      }
      if (trimmed.startsWith('#### ')) {
        return (
          <h4 key={i} className="text-lg font-bold mt-4 mb-2" style={{ color: 'var(--primary)' }}>
            {trimmed.slice(5)}
          </h4>
        );
      }
      if (trimmed.startsWith('##### ')) {
        return (
          <h5 key={i} className="text-base font-bold mt-3 mb-2" style={{ color: 'var(--primary)' }}>
            {trimmed.slice(6)}
          </h5>
        );
      }

      // List items
      if (trimmed.startsWith('• ')) {
        return (
          <div key={i} className="flex gap-2 ml-4 my-1">
            <span style={{ color: 'var(--secondary)' }}>•</span>
            <span>{trimmed.slice(2)}</span>
          </div>
        );
      }

      // Regular paragraph - handle bold/italic
      let text = trimmed;
      const parts: React.ReactNode[] = [];
      let lastIndex = 0;
      let keyCounter = 0;

      // Match **bold** and *italic*
      const regex = /(\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
      let match;

      while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
          parts.push(text.slice(lastIndex, match.index));
        }
        if (match[2]) {
          // Bold
          parts.push(<strong key={`b-${keyCounter++}`} style={{ color: 'var(--primary)' }}>{match[2]}</strong>);
        } else if (match[3]) {
          // Italic
          parts.push(<em key={`i-${keyCounter++}`} style={{ color: 'var(--accent)' }}>{match[3]}</em>);
        }
        lastIndex = match.index + match[0].length;
      }
      if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
      }

      return (
        <p key={i} className="my-2 leading-relaxed">
          {parts.length > 0 ? parts : text}
        </p>
      );
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full h-full max-w-4xl max-h-[90vh] m-4 flex flex-col"
        style={{
          background: 'rgba(0, 0, 0, 0.95)',
          border: '1px solid var(--primary)',
          boxShadow: '0 0 50px rgba(0, 212, 255, 0.3)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 shrink-0"
          style={{
            borderBottom: '1px solid var(--border)',
            background: 'rgba(0, 212, 255, 0.05)',
          }}
        >
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <span
              className="text-xs tracking-wider px-2 py-1 shrink-0"
              style={{
                background: 'rgba(0, 212, 255, 0.1)',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                color: 'var(--primary)',
              }}
            >
              {source.toUpperCase()}
            </span>
            <span className="text-xs opacity-50 shrink-0">READER MODE</span>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-4">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-xs tracking-wider transition-all hover:scale-105"
              style={{
                border: '1px solid var(--secondary)',
                color: 'var(--secondary)',
              }}
            >
              OPEN ORIGINAL ↗
            </a>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs tracking-wider transition-all hover:scale-105"
              style={{
                border: '1px solid var(--error)',
                color: 'var(--error)',
              }}
            >
              CLOSE [ESC]
            </button>
          </div>
        </div>

        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2" style={{ borderColor: 'var(--primary)' }} />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2" style={{ borderColor: 'var(--primary)' }} />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2" style={{ borderColor: 'var(--primary)' }} />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2" style={{ borderColor: 'var(--primary)' }} />

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-4xl mb-4 spinner" style={{ color: 'var(--primary)' }}>◐</div>
              <div className="text-sm tracking-wider opacity-60">FETCHING CONTENT...</div>
            </div>
          )}

          {article && !isLoading && (
            <article className="max-w-3xl mx-auto">
              {/* Article header */}
              <header className="mb-8">
                <div className="text-xs tracking-wider mb-3 opacity-60">
                  {article.siteName}
                </div>
                <h1
                  className="text-3xl font-bold mb-4 leading-tight"
                  style={{ color: 'var(--primary)' }}
                >
                  {article.title || title}
                </h1>
                {article.description && (
                  <p className="text-lg opacity-70 leading-relaxed">
                    {article.description}
                  </p>
                )}
              </header>

              {/* Featured image */}
              {article.image && (
                <div className="mb-8 relative">
                  <div
                    className="absolute inset-0"
                    style={{
                      border: '1px solid var(--border)',
                    }}
                  />
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-auto"
                    style={{ maxHeight: '400px', objectFit: 'cover' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Article content */}
              <div
                className="prose prose-invert max-w-none"
                style={{ color: 'var(--foreground)' }}
              >
                {article.content && !article.fetchFailed ? (
                  renderContent(article.content)
                ) : (
                  <div
                    className="text-center py-12 px-6"
                    style={{
                      background: 'rgba(0, 212, 255, 0.03)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div className="text-4xl mb-4">🔒</div>
                    <p className="text-lg mb-2" style={{ color: 'var(--primary)' }}>
                      Content Protected
                    </p>
                    <p className="opacity-60 mb-6 max-w-md mx-auto">
                      This website restricts direct access to its content.
                      Click below to view the full article on the original site.
                    </p>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-8 py-4 text-sm tracking-wider font-bold transition-all hover:scale-105"
                      style={{
                        background: 'var(--primary)',
                        color: 'var(--background)',
                        boxShadow: '0 0 20px rgba(0, 212, 255, 0.3)',
                      }}
                    >
                      OPEN ORIGINAL ARTICLE ↗
                    </a>
                  </div>
                )}
              </div>
            </article>
          )}
        </div>

        {/* Status bar */}
        <div
          className="flex items-center justify-between px-4 py-2 text-xs tracking-wider shrink-0"
          style={{
            borderTop: '1px solid var(--border)',
            background: 'rgba(0, 0, 0, 0.8)',
          }}
        >
          <span className="opacity-60 truncate max-w-[60%]">{url}</span>
          <span>
            <span className="opacity-60">STATUS: </span>
            <span style={{ color: isLoading ? 'var(--warning)' : article?.fetchFailed ? 'var(--secondary)' : 'var(--accent)' }}>
              {isLoading ? 'LOADING' : article?.fetchFailed ? 'RESTRICTED' : 'READY'}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
