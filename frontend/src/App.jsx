import React, { useState, useEffect } from 'react';
import Masthead from './components/Masthead';
import HomeView from './views/HomeView';
import ArchiveView from './views/ArchiveView';
import ArticleView from './views/ArticleView';
import AskAIDrawer from './components/AskAIDrawer';
import { fetchNews, fetchSources } from './services/api';

export default function App() {
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'archive' | 'article'
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedArticleId, setSelectedArticleId] = useState(null);
  const [isAskAIDrawerOpen, setIsAskAIDrawerOpen] = useState(false);
  const [prefillAIQuery, setPrefillAIQuery] = useState('');
  const [stats, setStats] = useState({ totalArticles: 0, sourcesCount: 0 });

  useEffect(() => {
    Promise.all([
      fetchNews({ limit: 1 }).catch(() => []),
      fetchSources().catch(() => [])
    ]).then(([news, sources]) => {
      setStats({
        totalArticles: news ? news.length : 0,
        sourcesCount: sources ? sources.length : 0
      });
    });
  }, []);

  const handleSelectArticle = (id) => {
    setSelectedArticleId(id);
    setCurrentView('article');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAskAboutArticle = (article) => {
    setPrefillAIQuery(`What are the key takeaways from this story: "${article.title}"?`);
    setIsAskAIDrawerOpen(true);
  };

  // Announce view changes to screen readers
  const viewLabel = currentView === 'home' 
    ? "Today's Edition" 
    : currentView === 'archive' 
      ? 'Archives' 
      : 'Article';

  return (
    <div className="min-h-screen flex flex-col bg-[#fef9f0] text-[#141310] font-['Source_Serif_4'] antialiased selection:bg-[#ffdad5] selection:text-[#410001]">
      {/* Skip to Content — Accessibility */}
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>

      {/* Screen reader: announce current view */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {viewLabel} — NewsSense
      </div>

      {/* Top Broadsheet Masthead */}
      <Masthead
        currentView={currentView}
        setCurrentView={setCurrentView}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        stats={stats}
        onOpenAskAI={() => {
          setPrefillAIQuery('');
          setIsAskAIDrawerOpen(true);
        }}
      />

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 w-full" role="main">
        {currentView === 'home' && (
          <HomeView
            activeCategory={activeCategory}
            onSelectArticle={handleSelectArticle}
            onAskAboutArticle={handleAskAboutArticle}
          />
        )}

        {currentView === 'archive' && (
          <ArchiveView
            onSelectArticle={handleSelectArticle}
            onAskAboutArticle={handleAskAboutArticle}
          />
        )}

        {currentView === 'article' && (
          <ArticleView
            articleId={selectedArticleId}
            onBack={() => setCurrentView('home')}
            onAskAboutArticle={handleAskAboutArticle}
          />
        )}
      </main>

      {/* WATCHER Slide-Out / Overlay Drawer */}
      <AskAIDrawer
        isOpen={isAskAIDrawerOpen}
        onClose={() => setIsAskAIDrawerOpen(false)}
        prefillQuery={prefillAIQuery}
        onSelectArticle={handleSelectArticle}
      />

      {/* Floating "Ask WATCHER" Button — 44×44px min touch target */}
      <button
        onClick={() => {
          setPrefillAIQuery('');
          setIsAskAIDrawerOpen(true);
        }}
        title="Ask WATCHER"
        aria-label="Open WATCHER AI assistant"
        className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 bg-[#850005] hover:bg-[#a8201a] active:scale-95 text-white min-h-[48px] min-w-[48px] p-3 sm:px-4 sm:py-3 rounded-full shadow-xl border-2 border-[#ffdad5] flex items-center gap-2 group transition-all hover:scale-105"
      >
        <span className="material-symbols-outlined text-[22px] sm:text-[24px]" aria-hidden="true">psychology</span>
        <span className="font-['Playfair_Display'] text-xs font-bold uppercase tracking-wider pr-1 hidden sm:inline">
          Ask WATCHER
        </span>
      </button>

      {/* Editorial Footer */}
      <footer className="w-full border-t-2 border-[#141310] bg-[#f8f3ea] py-6 sm:py-8 px-4 sm:px-6 md:px-10 mt-12 text-[#3e3832] text-xs" role="contentinfo">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div>
            <h4 className="font-['Playfair_Display'] font-bold uppercase text-base text-[#141310] tracking-wider">
              Newsense
            </h4>
            <p className="font-['Playfair_Display'] italic mt-0.5 text-xs text-[#3e3832]">
              The Truth Leaves a Record.
            </p>
          </div>
          <nav aria-label="Footer navigation" className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 font-['Playfair_Display'] font-bold text-[11px] uppercase tracking-wider text-[#141310]">
            <button onClick={() => { setCurrentView('home'); setActiveCategory('all'); }} className="hover:text-[#850005] min-h-[44px] flex items-center transition-colors">
              Today's Edition
            </button>
            <button onClick={() => setCurrentView('archive')} className="hover:text-[#850005] min-h-[44px] flex items-center transition-colors">
              Archives
            </button>
            <button onClick={() => setIsAskAIDrawerOpen(true)} className="hover:text-[#850005] min-h-[44px] flex items-center transition-colors">
              Ask WATCHER
            </button>
          </nav>
        </div>
      </footer>
    </div>
  );
}
