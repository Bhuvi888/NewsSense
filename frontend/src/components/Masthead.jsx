import React from 'react';

export default function Masthead({ 
  currentView, 
  setCurrentView, 
  activeCategory, 
  setActiveCategory, 
  stats = { totalArticles: 0, sourcesCount: 0 },
  onOpenAskAI
}) {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).toUpperCase();

  const categories = [
    { id: 'all', label: 'Front Page' },
    { id: 'technology', label: 'Technology' },
    { id: 'business', label: 'Business' },
    { id: 'world', label: 'World' },
    { id: 'india', label: 'India' },
    { id: 'science', label: 'Science' },
    { id: 'politics', label: 'Politics' },
  ];

  return (
    <header className="w-full bg-[#fef9f0] border-b border-[#1d1c16]/20">
      {/* Top Dateline Bar */}
      <div className="w-full border-b border-[#1d1c16]/20 bg-[#f8f3ea] px-4 md:px-10 py-1.5 text-[11px] font-['Source_Serif_4'] text-[#1d1c16] uppercase tracking-wider">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-y-1">
          <div className="flex items-center space-x-3">
            <span>NYC 64°F Partly Cloudy</span>
            <span className="text-[#8e706c]">|</span>
            <span>NEW DELHI 31°C Dry</span>
            <span className="text-[#8e706c]">|</span>
            <span className="font-bold">{currentDate} • VOL. IV — NO. 247</span>
          </div>
          <div className="flex items-center space-x-2 font-bold tracking-widest text-[#850005]">
            <span className="inline-block w-2 h-2 rounded-full bg-[#850005] animate-pulse"></span>
            <span>
              LIVE WIRE • {stats.totalArticles || 'ACTIVE'} STORIES • {stats.sourcesCount || '12'} SOURCES • RAG INDEX: SYNCED
            </span>
          </div>
        </div>
      </div>

      {/* Main Masthead Banner */}
      <div className="max-w-7xl mx-auto px-4 md:px-10 py-5 text-center">
        <div className="flex items-center justify-between border-b-2 border-[#1d1c16] pb-4 mb-2">
          {/* Left Masthead Ear */}
          <div className="hidden md:flex flex-col text-left font-['Playfair_Display'] text-[10px] uppercase tracking-widest text-[#5a413d] max-w-[220px]">
            <span className="font-bold text-[#1d1c16]">The Intelligence Record</span>
            <span>Founded on Neural Retrieval</span>
            <span className="mt-1 text-[#850005] font-bold">§ Real-time Synapse Wire</span>
          </div>

          {/* Center Brand Title */}
          <div className="flex-1 text-center cursor-pointer" onClick={() => { setCurrentView('home'); setActiveCategory('all'); }}>
            <h1 className="font-['Playfair_Display'] text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-[#1d1c16] uppercase select-none">
              Newsense
            </h1>
            <div className="text-[11px] font-['Source_Serif_4'] tracking-[0.25em] text-[#5a413d] uppercase mt-1">
              The Daily Intelligence Edition • Semantic Broadside
            </div>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center justify-end space-x-2 sm:space-x-3 max-w-[220px]">
            <button 
              onClick={() => setCurrentView('archive')} 
              title="Search Archives (The Morgue)"
              className="p-1.5 hover:text-[#850005] transition-colors text-[#1d1c16] flex items-center gap-1 border border-[#1d1c16]/30 px-2 py-1 bg-[#f8f3ea]"
            >
              <span className="material-symbols-outlined text-[18px]">search</span>
              <span className="text-[10px] font-['Playfair_Display'] font-bold uppercase hidden sm:inline">Morgue</span>
            </button>

            <button 
              onClick={onOpenAskAI}
              title="Open AI Research Desk"
              className="p-1.5 hover:bg-[#a8201a] transition-colors bg-[#850005] text-[#ffffff] flex items-center gap-1 px-2.5 py-1 font-bold shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">smart_toy</span>
              <span className="text-[10px] font-['Playfair_Display'] uppercase">Ask AI</span>
            </button>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="border-t border-b-2 border-[#1d1c16] py-2">
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 uppercase text-[11px] font-['Playfair_Display'] font-bold tracking-[0.14em]">
            {categories.map((cat) => {
              const isActive = currentView === 'home' && activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setCurrentView('home');
                  }}
                  className={`transition-colors py-0.5 ${
                    isActive
                      ? 'text-[#850005] font-black underline underline-offset-4 decoration-2 decoration-[#850005]'
                      : 'text-[#5a413d] hover:text-[#850005]'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentView('archive')}
              className={`transition-colors py-0.5 ${
                currentView === 'archive'
                  ? 'text-[#850005] font-black underline underline-offset-4 decoration-2 decoration-[#850005]'
                  : 'text-[#5a413d] hover:text-[#850005]'
              }`}
            >
              The Archive
            </button>
            <button
              onClick={onOpenAskAI}
              className={`transition-colors py-0.5 ${
                currentView === 'ask'
                  ? 'text-[#850005] font-black underline underline-offset-4 decoration-2 decoration-[#850005]'
                  : 'text-[#5a413d] hover:text-[#850005]'
              }`}
            >
              AI Research Desk
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
