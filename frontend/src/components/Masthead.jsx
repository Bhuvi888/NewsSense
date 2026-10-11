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
    { id: 'all', label: "Today's Edition" },
    { id: 'technology', label: 'Technology' },
    { id: 'india', label: 'India' },
    { id: 'world', label: 'World' },
    { id: 'business', label: 'Business' },
    { id: 'science', label: 'Science' },
    { id: 'politics', label: 'Politics' },
  ];

  return (
    <header className="w-full bg-[#fef9f0] border-b border-[#141310]/20" role="banner">
      {/* Top Dateline Bar */}
      <div className="w-full border-b border-[#141310]/20 bg-[#f8f3ea] px-3 sm:px-6 md:px-10 py-1.5 text-[11px] font-['Source_Serif_4'] text-[#141310]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Dateline */}
          <div className="flex items-center space-x-2 text-[10px] sm:text-[11px] uppercase tracking-wider truncate">
            <time className="font-bold" dateTime={new Date().toISOString().split('T')[0]}>
              {currentDate}
            </time>
            <span className="hidden md:inline text-[#7a6a62]" aria-hidden="true">|</span>
            <span className="hidden md:inline">VOL. IV — NO. 247</span>
          </div>

          {/* Edition indicator */}
          <div className="flex items-center space-x-2 text-[10px] sm:text-[11px] font-bold tracking-widest text-[#850005] shrink-0 uppercase">
            <span className="inline-block w-2 h-2 rounded-full bg-[#850005] animate-pulse" aria-hidden="true"></span>
            <span className="hidden sm:inline">LIVE EDITION · </span>
            <span>{stats.totalArticles || 'LATEST'} STORIES</span>
          </div>
        </div>
      </div>

      {/* Main Masthead Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 py-3 sm:py-5 text-center">
        <div className="flex items-center justify-between border-b-2 border-[#141310] pb-3 sm:pb-4 mb-2">
          {/* Left Masthead Ear */}
          <div className="hidden md:flex flex-col text-left font-['Playfair_Display'] text-[11px] uppercase tracking-widest text-[#3e3832] max-w-[210px]">
            <span className="font-bold text-[#141310]">News from Around the World</span>
            <span className="text-[11px] text-[#3e3832] font-['Source_Serif_4'] normal-case mt-0.5 font-normal">
              The day's stories, in one place.
            </span>
          </div>

          {/* Center Brand Title */}
          <div 
            className="flex-1 text-center cursor-pointer py-1" 
            onClick={() => { setCurrentView('home'); setActiveCategory('all'); }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCurrentView('home'); setActiveCategory('all'); }}}
            aria-label="Go to front page"
          >
            <h1 className="font-['Playfair_Display'] text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-[#141310] uppercase select-none leading-none">
              Newsense
            </h1>
            <div className="text-[12px] sm:text-[14px] font-['Playfair_Display'] italic tracking-wide text-[#3e3832] mt-1.5 font-medium">
              The Truth Leaves a Record.
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center justify-end space-x-2 sm:space-x-3 shrink-0">
            {/* Search Archives Button — 44×44px touch target */}
            <button 
              onClick={() => setCurrentView('archive')} 
              title="Archives"
              aria-label="Search archives"
              className="min-h-[44px] min-w-[44px] p-2 sm:px-2.5 sm:py-1 hover:border-[#850005] hover:text-[#850005] active:scale-95 transition-all text-[#141310] flex items-center justify-center gap-1 border border-[#141310]/40 bg-[#f8f3ea]"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">search</span>
              <span className="text-[11px] font-['Playfair_Display'] font-bold uppercase hidden sm:inline">Archives</span>
            </button>

            {/* Ask WATCHER Button — 44×44px touch target */}
            <button 
              onClick={onOpenAskAI}
              title="Ask WATCHER"
              aria-label="Open WATCHER AI assistant"
              className="min-h-[44px] px-2.5 py-2 sm:px-3 sm:py-1.5 hover:bg-[#a8201a] active:scale-95 transition-all bg-[#850005] text-white flex items-center gap-1.5 font-bold shadow-xs"
            >
              <span className="material-symbols-outlined text-[17px]" aria-hidden="true">psychology</span>
              <span className="text-[11px] font-['Playfair_Display'] uppercase tracking-wider">Ask WATCHER</span>
            </button>
          </div>
        </div>

        {/* Section Navigation Bar */}
        <div className="border-t border-b-2 border-[#141310] py-1.5 relative">
          <nav 
            aria-label="News sections"
            className="flex items-center overflow-x-auto no-scrollbar gap-x-2 sm:gap-x-4 md:gap-x-5 md:justify-center px-1 text-[11px] sm:text-[12px] font-['Playfair_Display'] font-bold tracking-[0.08em] uppercase whitespace-nowrap"
          >
            {categories.map((cat, idx) => {
              const isActive = currentView === 'home' && activeCategory === cat.id;
              return (
                <React.Fragment key={cat.id}>
                  {idx > 0 && <span className="text-[#7a6a62] font-normal select-none hidden sm:inline" aria-hidden="true">·</span>}
                  <button
                    onClick={() => {
                      setActiveCategory(cat.id);
                      setCurrentView('home');
                    }}
                    aria-current={isActive ? 'true' : undefined}
                    className={`py-2 px-1 sm:px-2 shrink-0 transition-colors min-h-[44px] flex items-center ${
                      isActive
                        ? 'text-[#850005] font-black underline underline-offset-4 decoration-2 decoration-[#850005]'
                        : 'text-[#3e3832] hover:text-[#850005]'
                    }`}
                  >
                    {cat.label}
                  </button>
                </React.Fragment>
              );
            })}
            
            <span className="text-[#7a6a62] font-normal select-none hidden sm:inline" aria-hidden="true">·</span>
            <button
              onClick={() => setCurrentView('archive')}
              aria-current={currentView === 'archive' ? 'true' : undefined}
              className={`py-2 px-1 sm:px-2 shrink-0 transition-colors min-h-[44px] flex items-center ${
                currentView === 'archive'
                  ? 'text-[#850005] font-black underline underline-offset-4 decoration-2 decoration-[#850005]'
                  : 'text-[#3e3832] hover:text-[#850005]'
              }`}
            >
              Archives
            </button>

            <span className="text-[#7a6a62] font-normal select-none hidden sm:inline" aria-hidden="true">·</span>
            <button
              onClick={onOpenAskAI}
              className="py-2 px-1 sm:px-2 shrink-0 text-[#850005] hover:underline font-black flex items-center gap-1 min-h-[44px]"
            >
              <span>Ask WATCHER</span>
              <span className="material-symbols-outlined text-[14px]" aria-hidden="true">arrow_forward</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
