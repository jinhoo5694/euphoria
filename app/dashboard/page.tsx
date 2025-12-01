'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ArwesProvider from '../components/ArwesProvider';
import CircuitBackground from '../components/CircuitBackground';
import NewsSection from '../components/NewsSection';
import StatusWidget from '../components/StatusWidget';
import ArticleViewer from '../components/ArticleViewer';
import { useSound } from '../context/SoundContext';
import { GlitchText } from '../components/Animated';
import type { NewsItem } from '../api/news/route';

interface NewsData {
  productHunt: NewsItem[];
  techNews: NewsItem[];
  aiNews: NewsItem[];
  startupNews: NewsItem[];
  lastUpdated: string;
}

interface SelectedArticle {
  url: string;
  title: string;
  source: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { playSound, enabled: soundEnabled, toggleSound } = useSound();
  const [newsData, setNewsData] = useState<NewsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'producthunt' | 'tech' | 'ai' | 'startup'>('all');
  const [initSequence, setInitSequence] = useState<string[]>([]);
  const [initComplete, setInitComplete] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<SelectedArticle | null>(null);

  const initMessages = [
    'AUTHENTICATING SESSION...',
    'CONNECTING TO NEWS FEEDS...',
    'INITIALIZING DATA STREAMS...',
    'LOADING INTERFACE MODULES...',
    'DASHBOARD READY',
  ];

  useEffect(() => {
    // Check authentication
    const isAuth = sessionStorage.getItem('euphoria_auth');
    if (isAuth !== 'true') {
      router.push('/');
      return;
    }

    // Play power up sound
    playSound('powerUp');

    // Run init sequence with sounds
    let index = 0;
    const interval = setInterval(() => {
      if (index < initMessages.length) {
        setInitSequence((prev) => [...prev, initMessages[index]]);
        if (initMessages[index].includes('READY')) {
          playSound('success');
        } else {
          playSound('typing');
        }
        index++;
      } else {
        clearInterval(interval);
        setInitComplete(true);
        playSound('notification');
        fetchNews();
      }
    }, 400);

    return () => clearInterval(interval);
  }, [router, playSound]);

  const fetchNews = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch('/api/news');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setNewsData(data);
    } catch (error) {
      console.error('Failed to fetch news:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const handleLogout = () => {
    playSound('powerDown');
    sessionStorage.removeItem('euphoria_auth');
    setTimeout(() => router.push('/'), 500);
  };

  const handleTabChange = (tabId: 'all' | 'producthunt' | 'tech' | 'ai' | 'startup') => {
    playSound('click');
    setActiveTab(tabId);
  };

  const handleSoundToggle = () => {
    toggleSound();
  };

  const handleSelectArticle = (article: SelectedArticle) => {
    setSelectedArticle(article);
  };

  const handleCloseArticle = () => {
    setSelectedArticle(null);
  };

  const getTotalItems = () => {
    if (!newsData) return 0;
    return (
      newsData.productHunt.length +
      newsData.techNews.length +
      newsData.aiNews.length +
      newsData.startupNews.length
    );
  };

  const tabs = [
    { id: 'all', label: 'ALL FEEDS', icon: '◈' },
    { id: 'producthunt', label: 'PRODUCT HUNT', icon: '🚀' },
    { id: 'tech', label: 'TECH NEWS', icon: '💻' },
    { id: 'ai', label: 'AI & ML', icon: '🤖' },
    { id: 'startup', label: 'STARTUPS', icon: '💡' },
  ] as const;

  // Show loading screen during init
  if (!initComplete) {
    return (
      <ArwesProvider>
        <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
          <CircuitBackground />
          <div className="fixed inset-0 scanlines pointer-events-none z-50" />

          <div className="relative z-10 w-full max-w-lg px-8">
            <h1 className="text-4xl font-bold tracking-wider glow mb-8 text-center" style={{ color: 'var(--primary)' }}>
              EUPHORIA
            </h1>

            <div
              className="glow-box p-6"
              style={{
                background: 'rgba(0, 0, 0, 0.8)',
                border: '1px solid var(--border)',
              }}
            >
              {initSequence.map((msg, i) => {
                const message = msg || '';
                return (
                  <div
                    key={i}
                    className="text-sm font-mono mb-1"
                    style={{
                      color: message.includes('READY') ? 'var(--accent)' : 'var(--primary)',
                    }}
                  >
                    <span style={{ color: 'var(--secondary)' }}>&gt;</span> {message}
                  </div>
                );
              })}
              {initSequence.length < initMessages.length && (
                <div className="text-sm font-mono cursor-blink" style={{ color: 'var(--primary)' }}>
                  <span style={{ color: 'var(--secondary)' }}>&gt;</span> _
                </div>
              )}
            </div>
          </div>
        </main>
      </ArwesProvider>
    );
  }

  return (
    <ArwesProvider>
      <main className="min-h-screen relative overflow-hidden">
        <CircuitBackground />
        <div className="fixed inset-0 scanlines pointer-events-none z-50" />

        {/* Article Viewer Modal */}
        {selectedArticle && (
          <ArticleViewer
            url={selectedArticle.url}
            title={selectedArticle.title}
            source={selectedArticle.source}
            onClose={handleCloseArticle}
          />
        )}

        {/* Header */}
        <header
          className="fixed top-0 left-0 right-0 z-40 px-6 py-3 flex items-center justify-between"
          style={{
            background: 'rgba(0, 0, 0, 0.9)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold tracking-wider glow" style={{ color: 'var(--primary)' }}>
              <GlitchText text="EUPHORIA" />
            </h1>
            <span className="text-xs tracking-widest opacity-40 flicker">
              TECH INTELLIGENCE SYSTEM
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-xs tracking-wider opacity-60">
              STATUS: <span style={{ color: 'var(--accent)' }}>ONLINE</span>
            </div>

            {/* Sound toggle button */}
            <button
              onClick={handleSoundToggle}
              onMouseEnter={() => playSound('hover')}
              className="px-3 py-1 text-xs tracking-wider transition-all hover:scale-105"
              style={{
                border: `1px solid ${soundEnabled ? 'var(--accent)' : 'var(--border)'}`,
                color: soundEnabled ? 'var(--accent)' : 'var(--foreground)',
                opacity: soundEnabled ? 1 : 0.5,
              }}
              title={soundEnabled ? 'Sound ON' : 'Sound OFF'}
            >
              {soundEnabled ? '🔊 ON' : '🔇 OFF'}
            </button>

            <button
              onClick={handleLogout}
              onMouseEnter={() => playSound('hover')}
              className="px-4 py-1 text-xs tracking-wider transition-all hover:scale-105"
              style={{
                border: '1px solid var(--error)',
                color: 'var(--error)',
              }}
            >
              LOGOUT
            </button>
          </div>
        </header>

        {/* Tab navigation */}
        <nav
          className="fixed top-14 left-0 right-0 z-30 px-6 py-2 flex gap-2 overflow-x-auto"
          style={{
            background: 'rgba(0, 0, 0, 0.8)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              onMouseEnter={() => playSound('hover')}
              className="px-4 py-2 text-xs tracking-wider whitespace-nowrap transition-all hover:scale-105"
              style={{
                background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
                color: activeTab === tab.id ? 'var(--background)' : 'var(--primary)',
                border: `1px solid ${activeTab === tab.id ? 'var(--primary)' : 'var(--border)'}`,
                boxShadow: activeTab === tab.id ? '0 0 15px rgba(0, 212, 255, 0.3)' : 'none',
              }}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Main content */}
        <div className="pt-28 pb-8 px-6 relative z-10">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Status widget - sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-28">
                <StatusWidget
                  lastUpdated={newsData?.lastUpdated || ''}
                  totalItems={getTotalItems()}
                  onRefresh={fetchNews}
                  isRefreshing={isRefreshing}
                />

                {/* Quick info */}
                <div
                  className="mt-4 p-4 text-xs"
                  style={{
                    background: 'rgba(0, 0, 0, 0.6)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div className="mb-2 tracking-wider opacity-60">ACTIVE SOURCES</div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Product Hunt</span>
                      <span style={{ color: 'var(--accent)' }}>●</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hacker News</span>
                      <span style={{ color: 'var(--accent)' }}>●</span>
                    </div>
                    <div className="flex justify-between">
                      <span>AI/ML Feed</span>
                      <span style={{ color: 'var(--accent)' }}>●</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Startup News</span>
                      <span style={{ color: 'var(--accent)' }}>●</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* News sections - main content */}
            <div className="lg:col-span-3 space-y-8">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="text-4xl mb-4 spinner">◐</div>
                  <div className="text-sm tracking-wider opacity-60">LOADING DATA STREAMS...</div>
                </div>
              ) : (
                <>
                  {(activeTab === 'all' || activeTab === 'producthunt') && newsData && (
                    <NewsSection
                      title="PRODUCT HUNT"
                      icon="🚀"
                      items={newsData.productHunt}
                      accentColor="hsl(25deg 100% 60%)"
                      onSelectArticle={handleSelectArticle}
                    />
                  )}

                  {(activeTab === 'all' || activeTab === 'tech') && newsData && (
                    <NewsSection
                      title="TECH NEWS"
                      icon="💻"
                      items={newsData.techNews}
                      accentColor="hsl(190deg 100% 50%)"
                      onSelectArticle={handleSelectArticle}
                    />
                  )}

                  {(activeTab === 'all' || activeTab === 'ai') && newsData && (
                    <NewsSection
                      title="AI & MACHINE LEARNING"
                      icon="🤖"
                      items={newsData.aiNews}
                      accentColor="hsl(280deg 100% 60%)"
                      onSelectArticle={handleSelectArticle}
                    />
                  )}

                  {(activeTab === 'all' || activeTab === 'startup') && newsData && (
                    <NewsSection
                      title="STARTUPS & FUNDING"
                      icon="💡"
                      items={newsData.startupNews}
                      accentColor="hsl(45deg 100% 50%)"
                      onSelectArticle={handleSelectArticle}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Corner decorations */}
        <div className="fixed top-4 left-4 w-16 h-16 border-l-2 border-t-2 z-0" style={{ borderColor: 'var(--border)' }} />
        <div className="fixed top-4 right-4 w-16 h-16 border-r-2 border-t-2 z-0" style={{ borderColor: 'var(--border)' }} />
        <div className="fixed bottom-4 left-4 w-16 h-16 border-l-2 border-b-2 z-0" style={{ borderColor: 'var(--border)' }} />
        <div className="fixed bottom-4 right-4 w-16 h-16 border-r-2 border-b-2 z-0" style={{ borderColor: 'var(--border)' }} />
      </main>
    </ArwesProvider>
  );
}
