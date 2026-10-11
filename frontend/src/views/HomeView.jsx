import React, { useEffect, useState } from 'react';
import { fetchNews, fetchTopics } from '../services/api';
import { 
  calculateReadingTime, 
  isArticleSaved, 
  toggleSaveArticle,
  formatEditorialDate 
} from '../utils/helpers';

export default function HomeView({ onSelectArticle, activeCategory = 'all', onAskAboutArticle }) {
  const [articles, setArticles] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savedIds, setSavedIds] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Sync bookmarks state
  useEffect(() => {
    const updateBookmarks = () => {
      setSavedIds(articles.filter(a => isArticleSaved(a.id)).map(a => a.id));
    };
    updateBookmarks();
    window.addEventListener('newsense_bookmarks_updated', updateBookmarks);
    return () => window.removeEventListener('newsense_bookmarks_updated', updateBookmarks);
  }, [articles]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    Promise.all([
      fetchNews({ 
        limit: 20, 
        category: activeCategory !== 'all' ? activeCategory : null 
      }),
      fetchTopics().catch(() => [])
    ])
      .then(([newsData, topicsData]) => {
        if (!isMounted) return;
        setArticles(newsData || []);
        setTopics(topicsData || []);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeCategory]);

  // J / K Keyboard Navigation across stories
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.key === 'j' || e.key === 'J') {
        setSelectedIndex(prev => Math.min(articles.length - 1, prev + 1));
      } else if (e.key === 'k' || e.key === 'K') {
        setSelectedIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'Enter') {
        if (articles[selectedIndex]) {
          onSelectArticle(articles[selectedIndex].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [articles, selectedIndex, onSelectArticle]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 py-6 sm:py-8 space-y-8" aria-busy="true" aria-label="Loading today's edition">
        <div className="text-center py-2 text-[#3e3832]">
          <span className="material-symbols-outlined text-3xl animate-spin text-[#850005]" aria-hidden="true">autorenew</span>
          <p className="font-['Playfair_Display'] font-bold text-sm uppercase tracking-wide mt-1">
            Setting the Front Page...
          </p>
        </div>
        {/* Skeleton Front Page Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 border-b-2 border-[#141310]/20 pb-8">
          <div className="lg:col-span-8 space-y-4">
            <div className="h-4 w-32 skeleton"></div>
            <div className="h-10 w-4/5 skeleton"></div>
            <div className="h-5 w-full skeleton"></div>
            <div className="w-full aspect-[16/9] skeleton"></div>
          </div>
          <div className="lg:col-span-4 space-y-4">
            <div className="h-6 w-36 skeleton"></div>
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="flex gap-3 py-2 border-b border-[#141310]/15">
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-20 skeleton"></div>
                  <div className="h-4 w-full skeleton"></div>
                </div>
                <div className="w-14 h-14 skeleton shrink-0"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 py-12 text-center" role="alert">
        <div className="p-6 bg-[#ffdad6] border-2 border-[#ba1a1a] text-[#410001] max-w-xl mx-auto">
          <span className="material-symbols-outlined text-3xl" aria-hidden="true">error</span>
          <h3 className="font-['Playfair_Display'] text-xl font-bold mt-2">Could Not Load News</h3>
          <p className="text-sm font-['Source_Serif_4'] mt-1">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="min-h-[44px] mt-4 px-6 py-2 bg-[#850005] text-white font-['Playfair_Display'] font-bold text-xs uppercase cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const leadArticle = articles[0] || null;
  const wireArticles = articles.slice(1, 6);
  const secondaryArticles = articles.slice(6);

  const handleToggleSave = (e, articleId) => {
    e.stopPropagation();
    toggleSaveArticle(articleId);
    setSavedIds(prev => 
      prev.includes(articleId) 
        ? prev.filter(id => id !== articleId) 
        : [...prev, articleId]
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 py-4 sm:py-6">
      {/* Sub-Header & Edition Dispatch Bar */}
      <div className="w-full border-b-2 border-[#141310] pb-2 mb-4 sm:mb-6">
        <div className="flex flex-wrap items-center justify-between gap-y-2 text-[11px] font-['Playfair_Display'] uppercase text-[#141310]">
          <div className="flex items-center gap-2">
            <span className="bg-[#850005] text-white px-2 py-0.5 font-bold tracking-wider text-[10px]">EDITION</span>
            <span className="font-bold tracking-wide">
              {activeCategory === 'all' ? "TODAY'S EDITION" : `SECTION: ${activeCategory.toUpperCase()}`}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-[#7a6a62] font-['Source_Serif_4'] normal-case hidden sm:inline">
              Tip: Press <kbd className="font-mono bg-[#f2ede4] px-1 py-0.5 border border-[#141310]/20">J</kbd>/<kbd className="font-mono bg-[#f2ede4] px-1 py-0.5 border border-[#141310]/20">K</kbd> to navigate
            </span>
            <span className="font-bold text-[#141310] font-['Playfair_Display'] tracking-wider text-xs">
              {articles.length} STORIES
            </span>
          </div>
        </div>
        <div className="w-full mt-2 pt-0.5 border-t border-b border-[#141310]/30 h-1"></div>
      </div>

      {/* Primary Editorial Grid */}
      {leadArticle ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-8 lg:gap-x-8 border-b-2 border-[#141310] pb-8">
          {/* Lead Story: 8 Columns on Desktop */}
          <article 
            className={`lg:col-span-8 flex flex-col lg:border-r border-[#141310]/30 lg:pr-8 transition-colors ${
              selectedIndex === 0 ? 'bg-[#ffdad5]/15' : ''
            }`}
          >
            {/* Category / Source Tag */}
            <div className="flex items-center justify-between border-b border-[#141310]/20 pb-1.5 mb-2.5">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-[#850005]"></span>
                <span className="font-['Playfair_Display'] text-[11px] tracking-wider font-bold text-[#850005] uppercase">
                  {leadArticle.category || 'News'} • {leadArticle.source}
                </span>
              </div>
              <span className="font-['Source_Serif_4'] text-[11px] text-[#3e3832]">
                Lead Story
              </span>
            </div>

            {/* Headline (Legible Title Case, High Contrast) */}
            <h2 
              onClick={() => onSelectArticle(leadArticle.id)}
              className="font-['Playfair_Display'] text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-bold tracking-tight text-[#141310] mb-3 leading-[1.15] hover:text-[#850005] cursor-pointer transition-colors"
            >
              {leadArticle.title}
            </h2>

            {/* Summary Lead with 65ch Line-Length */}
            {leadArticle.summary && (
              <p className="font-['Source_Serif_4'] text-base sm:text-lg text-[#141310] italic leading-relaxed border-b border-[#141310]/20 pb-3 mb-4 max-w-prose">
                {leadArticle.summary}
              </p>
            )}

            {/* Byline and Actions */}
            <div className="flex flex-wrap items-center justify-between text-xs font-['Source_Serif_4'] text-[#3e3832] pb-3 mb-4 border-b border-[#141310]/15 gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span>By {leadArticle.author || 'Editorial Staff'}</span>
                <span className="text-[#7a6a62]" aria-hidden="true">·</span>
                <span>{leadArticle.source}</span>
                <span className="text-[#7a6a62]" aria-hidden="true">·</span>
                <time dateTime={leadArticle.published_at}>{formatEditorialDate(leadArticle.published_at)}</time>
                <span className="text-[#7a6a62]" aria-hidden="true">·</span>
                <span className="font-medium text-[#141310]">
                  {calculateReadingTime(leadArticle.content || leadArticle.summary)}
                </span>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                {/* Save for Later Bookmark Button — 44×44px hit area */}
                <button
                  onClick={(e) => handleToggleSave(e, leadArticle.id)}
                  className="min-h-[44px] px-2 py-1 flex items-center gap-1 text-xs text-[#3e3832] hover:text-[#850005] transition-colors cursor-pointer"
                  title={savedIds.includes(leadArticle.id) ? "Saved in Reading List" : "Save for later"}
                  aria-label={savedIds.includes(leadArticle.id) ? "Saved in Reading List" : "Save for later"}
                >
                  <span className="material-symbols-outlined text-[17px]" aria-hidden="true">
                    {savedIds.includes(leadArticle.id) ? 'bookmark' : 'bookmark_border'}
                  </span>
                  <span>{savedIds.includes(leadArticle.id) ? 'Saved' : 'Save'}</span>
                </button>

                {/* Ask WATCHER Button — 44×44px hit area */}
                <button 
                  onClick={() => onAskAboutArticle(leadArticle)}
                  className="min-h-[44px] px-2 py-1 text-[#850005] font-bold hover:underline flex items-center gap-1 text-xs cursor-pointer"
                  aria-label="Ask WATCHER about lead story"
                >
                  <span className="material-symbols-outlined text-[16px]" aria-hidden="true">psychology</span>
                  <span>Ask WATCHER</span>
                </button>
              </div>
            </div>

            {/* Lead Story Body & Image */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="font-['Source_Serif_4'] text-[15px] sm:text-base leading-relaxed text-left text-[#141310]">
                <p className="drop-cap mb-4">
                  {leadArticle.content 
                    ? leadArticle.content.slice(0, 420) 
                    : leadArticle.summary || "Latest reports continue to arrive from worldwide news services."}
                  ...
                </p>
                <div className="mt-3 pt-2 border-t border-[#141310]/20">
                  <button
                    onClick={() => onSelectArticle(leadArticle.id)}
                    className="font-['Playfair_Display'] text-xs font-bold text-[#850005] uppercase tracking-wider hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Read Full Story</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              </div>

              {/* Lead Image Container with Fixed Aspect Ratio */}
              <div className="flex flex-col">
                <div className="border-2 border-[#141310] bg-white p-2 mb-2">
                  <div className="relative w-full aspect-[4/3] bg-[#ece8df] overflow-hidden border border-[#141310]/25">
                    <img
                      src={leadArticle.image_url || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=800&auto=format&fit=crop"}
                      alt={leadArticle.title}
                      className="w-full h-full object-cover newspaper-img"
                      onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?q=80&w=800&auto=format&fit=crop";
                      }}
                    />
                  </div>
                  <p className="font-['Source_Serif_4'] text-[11px] text-[#3e3832] italic mt-2 px-1 text-center">
                    {leadArticle.source} Wire Photo
                  </p>
                </div>
              </div>
            </div>
          </article>

          {/* Right Column: 4 Columns on Desktop (The Wire Ticker & Today's Topics) */}
          <aside className="lg:col-span-4 flex flex-col space-y-6">
            {/* The Wire Ticker Box */}
            <div className="border-2 border-[#141310] bg-[#f8f3ea] p-4">
              <div className="flex items-center justify-between border-b-2 border-[#141310] pb-2 mb-3">
                <h3 className="font-['Playfair_Display'] text-base font-bold uppercase tracking-wide text-[#141310] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-lg text-[#850005]">newspaper</span>
                  <span>Latest Stories</span>
                </h3>
                <span className="text-[10px] font-['Playfair_Display'] text-[#850005] font-bold uppercase tracking-wider">
                  Live Wire
                </span>
              </div>

              <div className="divide-y divide-[#141310]/20">
                {wireArticles.map((article, idx) => (
                  <div 
                    key={article.id} 
                    className={`py-3 first:pt-0 last:pb-0 cursor-pointer group flex items-start justify-between gap-3 transition-colors ${
                      selectedIndex === idx + 1 ? 'bg-[#ffdad5]/25 -mx-2 px-2' : ''
                    }`}
                    onClick={() => onSelectArticle(article.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-[10px] font-['Playfair_Display'] uppercase text-[#3e3832] mb-1">
                        <span className="font-bold text-[#850005]">{article.source}</span>
                        <div className="flex items-center gap-1">
                          <span>{article.category || 'News'}</span>
                          {/* 44×44px touch target on wire bookmark */}
                          <button
                            type="button"
                            onClick={(e) => handleToggleSave(e, article.id)}
                            className="min-h-[44px] min-w-[44px] -my-3 -mr-2.5 flex items-center justify-center text-[#7a6a62] hover:text-[#850005] transition-colors"
                            title={savedIds.includes(article.id) ? "Remove bookmark" : "Save article"}
                            aria-label={savedIds.includes(article.id) ? "Remove bookmark" : "Save article"}
                          >
                            <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
                              {savedIds.includes(article.id) ? 'bookmark' : 'bookmark_border'}
                            </span>
                          </button>
                        </div>
                      </div>
                      <h4 className="font-['Playfair_Display'] text-sm sm:text-[15px] font-bold text-[#141310] leading-snug group-hover:text-[#850005] transition-colors line-clamp-3">
                        {article.title}
                      </h4>
                      {article.summary && (
                        <p className="text-[12px] font-['Source_Serif_4'] text-[#3e3832] line-clamp-2 mt-1 leading-normal max-w-prose">
                          {article.summary}
                        </p>
                      )}
                      <div className="text-[10px] text-[#7a6a62] mt-1">
                        {calculateReadingTime(article.summary || article.content)}
                      </div>
                    </div>

                    {/* Wire Thumbnail Image */}
                    {article.image_url && (
                      <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 bg-[#ece8df] border border-[#141310]/30 overflow-hidden mt-1 aspect-square">
                        <img
                          src={article.image_url}
                          alt={article.title}
                          className="w-full h-full object-cover newspaper-img"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Today's Topics Box */}
            {topics.length > 0 && (
              <div className="border-2 border-[#141310] bg-[#f2ede4] p-4">
                <h4 className="font-['Playfair_Display'] text-sm font-bold uppercase tracking-wider text-[#141310] border-b-2 border-[#141310] pb-1.5 mb-3">
                  Today's Topics
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {topics.slice(0, 10).map((t, idx) => (
                    <span 
                      key={idx}
                      className="text-[11px] font-['Source_Serif_4'] bg-[#fef9f0] border border-[#141310]/30 px-2 py-0.5 text-[#141310] flex items-center gap-1 font-medium"
                    >
                      <span>{t.topic}</span>
                      <span className="text-[#7a6a62] text-[10px]">({t.article_count})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      ) : (
        <div className="py-12 text-center text-[#3e3832] font-['Source_Serif_4']">
          No stories available in this section today.
        </div>
      )}

      {/* More News Section */}
      {secondaryArticles.length > 0 && (
        <section className="mt-8" aria-label="More News">
          <div className="flex items-center justify-between border-b-2 border-[#141310] pb-2 mb-6">
            <h3 className="font-['Playfair_Display'] text-xl sm:text-2xl font-bold uppercase tracking-wide text-[#141310]">
              More News
            </h3>
            <span className="text-xs font-['Source_Serif_4'] text-[#3e3832]">
              Around the World
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6" role="feed" aria-label="More stories">
            {secondaryArticles.map((article, idx) => (
              <article 
                key={article.id}
                className={`bg-[#f8f3ea] border border-[#141310]/40 p-4 sm:p-5 flex flex-col justify-between hover:border-[#850005] hover:shadow-xs transition-all cursor-pointer group ${
                  selectedIndex === idx + 6 ? 'ring-2 ring-[#850005]' : ''
                }`}
                onClick={() => onSelectArticle(article.id)}
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] font-['Playfair_Display'] uppercase font-bold text-[#850005] border-b border-[#141310]/20 pb-1 mb-2.5">
                    <span>{article.source}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#3e3832]">{article.category}</span>
                      {/* 44×44px touch target on More News bookmark */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleSave(e, article.id)}
                        className="min-h-[44px] min-w-[44px] -my-2 -mr-2.5 flex items-center justify-center text-[#7a6a62] hover:text-[#850005] transition-colors"
                        title={savedIds.includes(article.id) ? "Remove bookmark" : "Save article"}
                        aria-label={savedIds.includes(article.id) ? "Remove bookmark" : "Save article"}
                      >
                        <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
                          {savedIds.includes(article.id) ? 'bookmark' : 'bookmark_border'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Thumbnail Image for More News card */}
                  {article.image_url && (
                    <div className="w-full aspect-[16/9] mb-3 bg-[#ece8df] border border-[#141310]/25 overflow-hidden">
                      <img
                        src={article.image_url}
                        alt={article.title}
                        className="w-full h-full object-cover newspaper-img"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  )}

                  <h4 className="font-['Playfair_Display'] text-base sm:text-lg font-bold text-[#141310] leading-snug group-hover:text-[#850005] transition-colors mb-2">
                    {article.title}
                  </h4>
                  {article.summary && (
                    <p className="font-['Source_Serif_4'] text-xs sm:text-[13px] text-[#3e3832] leading-relaxed line-clamp-3 max-w-prose">
                      {article.summary}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-2 border-t border-[#141310]/15 flex items-center justify-between text-[11px] font-['Source_Serif_4'] text-[#3e3832]">
                  <time dateTime={article.published_at}>
                    {formatEditorialDate(article.published_at)} · {calculateReadingTime(article.summary || article.content)}
                  </time>
                  <span className="text-[#850005] font-bold group-hover:underline">Read Story →</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
