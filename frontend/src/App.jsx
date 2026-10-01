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
    setPrefillAIQuery(`Summarize and verify the following dispatch from ${article.source}: "${article.title}"`);
    setIsAskAIDrawerOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fef9f0] text-[#1d1c16] font-['Source_Serif_4'] antialiased selection:bg-[#ffdad5] selection:text-[#410001]">
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
      <main className="flex-1 w-full">
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

      {/* RAG "Ask AI" Telegraph Slide-Out Drawer */}
      <AskAIDrawer
        isOpen={isAskAIDrawerOpen}
        onClose={() => setIsAskAIDrawerOpen(false)}
        prefillQuery={prefillAIQuery}
        onSelectArticle={handleSelectArticle}
      />

      {/* Floating "Ask AI" Telegraph Seal Button */}
      <button
        onClick={() => {
          setPrefillAIQuery('');
          setIsAskAIDrawerOpen(true);
        }}
        title="Open Telegraph AI Research Desk"
        className="fixed bottom-6 right-6 z-40 bg-[#850005] hover:bg-[#a8201a] text-white p-3.5 rounded-full shadow-2xl border-2 border-[#ffdad5] flex items-center gap-2 group transition-all hover:scale-105"
        style={{
          boxShadow: '0 10px 25px -5px rgba(133, 0, 5, 0.4), 0 8px 10px -6px rgba(133, 0, 5, 0.4)'
        }}
      >
        <span className="material-symbols-outlined text-[24px]">psychology</span>
        <span className="font-['Playfair_Display'] text-xs font-bold uppercase tracking-wider pr-1 hidden sm:inline">
          Ask Telegraph AI
        </span>
      </button>

      {/* Editorial Footer */}
      <footer className="w-full border-t-2 border-[#1d1c16] bg-[#f8f3ea] py-8 px-4 md:px-10 mt-12 text-[#5a413d] text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div>
            <h4 className="font-['Playfair_Display'] font-black uppercase text-base text-[#1d1c16] tracking-wider">
              The Newsense Chronicle & Syndicate
            </h4>
            <p className="font-['Source_Serif_4'] mt-0.5 text-[11px]">
              Published daily via Neural Vector Retrieval • Linotype Edition • All rights reserved.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 font-['Playfair_Display'] font-bold text-[11px] uppercase tracking-wider text-[#1d1c16]">
            <button onClick={() => { setCurrentView('home'); setActiveCategory('all'); }} className="hover:text-[#850005]">
              Front Page
            </button>
            <button onClick={() => setCurrentView('archive')} className="hover:text-[#850005]">
              Morgue Archives
            </button>
            <button onClick={() => setIsAskAIDrawerOpen(true)} className="hover:text-[#850005]">
              Telegraph AI Wire
            </button>
            <a href={`${import.meta.env.VITE_API_DOCS_URL || 'http://localhost:8000/docs'}`} target="_blank" rel="noopener noreferrer" className="hover:text-[#850005]">
              API Documentation ↗
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
