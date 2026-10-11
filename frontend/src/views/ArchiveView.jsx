import React, { useState, useEffect, useRef } from 'react';
import { fetchNews, fetchSources } from '../services/api';
import { 
  calculateReadingTime, 
  isArticleSaved, 
  toggleSaveArticle, 
  getSearchHistory, 
  addToSearchHistory, 
  clearSearchHistory,
  formatEditorialDate 
} from '../utils/helpers';

export default function ArchiveView({ onSelectArticle, onAskAboutArticle }) {
  const [query, setQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sourcesList, setSourcesList] = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savedIds, setSavedIds] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const searchInputRef = useRef(null);

  // Load recent searches from localStorage
  useEffect(() => {
    setRecentSearches(getSearchHistory());
  }, []);

  // Sync bookmarks state
  useEffect(() => {
    const updateBookmarks = () => {
      setSavedIds(articles.filter(a => isArticleSaved(a.id)).map(a => a.id));
    };
    updateBookmarks();
    window.addEventListener('newsense_bookmarks_updated', updateBookmarks);
    return () => window.removeEventListener('newsense_bookmarks_updated', updateBookmarks);
  }, [articles]);

  // Shortcut: '/' focuses search input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    fetchSources()
      .then(data => setSourcesList(data || []))
      .catch(() => setSourcesList([]));
  }, []);

  const searchArticles = (searchTerm = null) => {
    const q = searchTerm !== null ? searchTerm : query;
    setLoading(true);
    setError(null);

    if (q && q.trim()) {
      addToSearchHistory(q.trim());
      setRecentSearches(getSearchHistory());
    }

    fetchNews({
      limit: 30,
      search: q.trim() || null,
      source: selectedSource !== 'all' ? selectedSource : null,
      category: selectedCategory !== 'all' ? selectedCategory : null,
    })
      .then(data => {
        setArticles(data || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  const handleSelectRecentSearch = (term) => {
    setQuery(term);
    searchArticles(term);
  };

  const handleClearHistory = () => {
    clearSearchHistory();
    setRecentSearches([]);
  };

  useEffect(() => {
    searchArticles();
  }, [selectedSource, selectedCategory]);

  const categories = ['all', 'technology', 'business', 'world', 'india', 'science', 'politics'];

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 py-6">
      {/* Archive Header */}
      <div className="border-b-2 border-[#141310] pb-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <div className="text-[11px] font-['Playfair_Display'] uppercase font-bold tracking-wider text-[#850005]">
              NewsSense Archives
            </div>
            <h2 className="font-['Playfair_Display'] text-3xl sm:text-4xl font-bold uppercase tracking-tight text-[#141310]">
              The Archive
            </h2>
            <p className="text-sm font-['Source_Serif_4'] text-[#3e3832] mt-0.5">
              Search past stories. Press <kbd className="font-mono bg-[#f2ede4] px-1 py-0.5 border border-[#141310]/20 text-xs">/</kbd> to search.
            </p>
          </div>
          <div className="text-xs font-['Source_Serif_4'] text-[#3e3832]">
            Total Stories Found: <strong className="text-[#141310]">{articles.length}</strong>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-[#f8f3ea] border-2 border-[#141310] p-4 sm:p-6 mb-8">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            searchArticles();
          }}
          className="flex flex-col sm:flex-row gap-2.5 mb-3"
          role="search"
          aria-label="Archives search"
        >
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-3 text-[#3e3832]" aria-hidden="true">search</span>
            <input
              ref={searchInputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search archives (Press / to focus)..."
              aria-label="Search query"
              className="w-full min-h-[44px] pl-10 pr-4 py-2.5 bg-white border border-[#141310] font-['Source_Serif_4'] text-sm text-[#141310] focus:outline-none focus:border-[#850005] focus:ring-1 focus:ring-[#850005]"
            />
          </div>

          <button
            type="submit"
            className="min-h-[44px] px-6 py-2 bg-[#850005] hover:bg-[#a8201a] active:scale-95 text-white font-['Playfair_Display'] font-bold text-xs uppercase tracking-wider transition-all shrink-0 cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
          >
            <span>Search Archives</span>
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">arrow_forward</span>
          </button>
        </form>

        {/* Search Lookup Patterns: Recent Searches / Suggestions */}
        {recentSearches.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5 mb-4 text-xs font-['Source_Serif_4']" aria-label="Recent searches">
            <span className="text-[11px] font-bold text-[#3e3832] uppercase tracking-wider font-['Playfair_Display'] mr-1">
              Recent:
            </span>
            {recentSearches.map((term, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectRecentSearch(term)}
                className="min-h-[32px] sm:min-h-[28px] px-2.5 py-1 bg-white hover:bg-[#ffdad5] hover:text-[#850005] border border-[#141310]/30 text-[#141310] transition-colors rounded-xs flex items-center gap-1 cursor-pointer"
                title={`Search for "${term}"`}
              >
                <span className="material-symbols-outlined text-[12px] text-[#7a6a62]" aria-hidden="true">history</span>
                <span>{term}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={handleClearHistory}
              className="min-h-[32px] sm:min-h-[28px] px-2 py-1 text-[11px] text-[#7a6a62] hover:text-[#850005] underline cursor-pointer ml-1"
              title="Clear search history"
            >
              Clear
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5 mb-4 text-xs font-['Source_Serif_4']">
            <span className="text-[11px] font-bold text-[#7a6a62] uppercase tracking-wider font-['Playfair_Display'] mr-1">
              Suggestions:
            </span>
            {['Technology', 'Markets', 'Elections', 'Science', 'Global'].map((sug, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectRecentSearch(sug)}
                className="px-2.5 py-1 bg-white/80 hover:bg-[#ffdad5] hover:text-[#850005] border border-[#141310]/20 text-[#3e3832] transition-colors rounded-xs text-[11px] cursor-pointer"
              >
                {sug}
              </button>
            ))}
          </div>
        )}

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-['Source_Serif_4'] pt-2 border-t border-[#141310]/15">
          <div className="flex items-center gap-2">
            <label htmlFor="archive-category-select" className="font-bold text-[#141310] uppercase text-[11px] font-['Playfair_Display']">
              Category:
            </label>
            <select
              id="archive-category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="min-h-[44px] bg-white border border-[#141310]/40 px-3 py-2 text-xs text-[#141310] focus:outline-none focus:border-[#850005] cursor-pointer"
            >
              {categories.map(c => (
                <option key={c} value={c}>
                  {c === 'all' ? 'All Sections' : c.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {sourcesList.length > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor="archive-source-select" className="font-bold text-[#141310] uppercase text-[11px] font-['Playfair_Display']">
                Source:
              </label>
              <select
                id="archive-source-select"
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="min-h-[44px] bg-white border border-[#141310]/40 px-3 py-2 text-xs text-[#141310] focus:outline-none focus:border-[#850005] cursor-pointer"
              >
                <option value="all">All Sources</option>
                {sourcesList.map(s => (
                  <option key={s.source} value={s.source}>
                    {s.source} ({s.article_count})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Results Section with Rich Feedback States */}
      {loading ? (
        <div className="space-y-4" aria-busy="true" aria-label="Loading archive stories">
          <div className="text-center py-4 text-[#3e3832]">
            <span className="material-symbols-outlined text-3xl animate-spin text-[#850005]" aria-hidden="true">hourglass_top</span>
            <p className="font-['Playfair_Display'] font-bold uppercase tracking-wider text-xs mt-1">
              Searching Archives...
            </p>
          </div>
          {/* Skeleton Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white border-2 border-[#141310]/20 p-5 space-y-3">
                <div className="h-3 w-1/3 skeleton"></div>
                <div className="w-full aspect-[16/9] skeleton"></div>
                <div className="h-5 w-4/5 skeleton"></div>
                <div className="h-4 w-full skeleton"></div>
                <div className="h-4 w-2/3 skeleton"></div>
                <div className="h-3 w-1/2 skeleton pt-2"></div>
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="p-6 bg-[#ffdad6] border-2 border-[#ba1a1a] text-[#410001] text-center max-w-lg mx-auto" role="alert">
          <span className="material-symbols-outlined text-3xl" aria-hidden="true">warning</span>
          <p className="font-['Playfair_Display'] font-bold text-base mt-1">Archive Search Failed</p>
          <p className="text-xs font-['Source_Serif_4'] mt-1">{error}</p>
          <button
            onClick={() => searchArticles()}
            className="min-h-[44px] mt-4 px-5 py-2 bg-[#850005] text-white font-['Playfair_Display'] font-bold text-xs uppercase cursor-pointer"
          >
            Retry Search
          </button>
        </div>
      ) : articles.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-[#141310]/30 text-[#3e3832] font-['Source_Serif_4'] bg-[#f8f3ea]/50">
          <span className="material-symbols-outlined text-4xl text-[#7a6a62] mb-2" aria-hidden="true">manage_search</span>
          <p className="text-lg font-bold font-['Playfair_Display'] text-[#141310]">No stories match your inquiry.</p>
          <p className="text-xs mt-1 max-w-md mx-auto text-[#3e3832]">
            Try another keyword, clear recent filters, or select "All Sections" to broaden your search.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" role="feed" aria-label="Archive results">
          {articles.map((article) => (
            <article
              key={article.id}
              className="bg-white border-2 border-[#141310] p-4 sm:p-5 flex flex-col justify-between hover:shadow-sm hover:border-[#850005] transition-all group cursor-pointer"
              onClick={() => onSelectArticle(article.id)}
            >
              <div>
                <div className="flex items-center justify-between text-[10px] font-['Playfair_Display'] font-bold uppercase tracking-wider text-[#850005] border-b border-[#141310]/20 pb-1.5 mb-2.5">
                  <span>{article.source}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#3e3832]">{article.category}</span>
                    {/* Accessible 44×44px touch target on bookmark button */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleSave(e, article.id)}
                      className="min-h-[44px] min-w-[44px] -my-2 -mr-2 flex items-center justify-center text-[#7a6a62] hover:text-[#850005] transition-colors"
                      title={savedIds.includes(article.id) ? "Remove bookmark" : "Save story"}
                      aria-label={savedIds.includes(article.id) ? "Remove bookmark" : "Save story"}
                    >
                      <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                        {savedIds.includes(article.id) ? 'bookmark' : 'bookmark_border'}
                      </span>
                    </button>
                  </div>
                </div>

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

                <h3 className="font-['Playfair_Display'] text-base sm:text-lg font-bold text-[#141310] leading-snug group-hover:text-[#850005] transition-colors mb-2">
                  {article.title}
                </h3>

                {article.summary && (
                  <p className="font-['Source_Serif_4'] text-xs text-[#3e3832] line-clamp-3 leading-relaxed mb-3 max-w-prose">
                    {article.summary}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-[#141310]/15 flex items-center justify-between text-[11px] font-['Source_Serif_4'] text-[#3e3832]">
                <time dateTime={article.published_at}>
                  {formatEditorialDate(article.published_at)} · {calculateReadingTime(article.summary || article.content)}
                </time>
                <span className="font-bold text-[#850005] group-hover:underline">Read Story →</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
