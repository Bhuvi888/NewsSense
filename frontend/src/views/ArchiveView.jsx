import React, { useState, useEffect } from 'react';
import { fetchNews, fetchSources } from '../services/api';

export default function ArchiveView({ onSelectArticle, onAskAboutArticle }) {
  const [query, setQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sourcesList, setSourcesList] = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSources()
      .then(data => setSourcesList(data || []))
      .catch(() => setSourcesList([]));
  }, []);

  const searchArticles = () => {
    setLoading(true);
    setError(null);

    fetchNews({
      limit: 30,
      search: query.trim() || null,
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

  useEffect(() => {
    searchArticles();
  }, [selectedSource, selectedCategory]);

  const categories = ['all', 'technology', 'business', 'world', 'india', 'science', 'politics'];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-10 py-6">
      {/* Archive Header */}
      <div className="border-b-2 border-[#1d1c16] pb-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-[10px] font-['Playfair_Display'] uppercase font-bold tracking-[0.2em] text-[#850005]">
              § Retrospective Records & Morgue
            </div>
            <h2 className="font-['Playfair_Display'] text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#1d1c16]">
              The Newsense Archive
            </h2>
          </div>
          <div className="text-xs font-['Source_Serif_4'] text-[#5a413d]">
            Total Ingested Dossiers Found: <strong className="text-[#1d1c16]">{articles.length}</strong>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-[#f8f3ea] border-2 border-[#1d1c16] p-4 sm:p-6 mb-8">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            searchArticles();
          }}
          className="flex flex-col md:flex-row gap-3 mb-4"
        >
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#5a413d]">search</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search headline keywords or historical dispatches..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-[#1d1c16] font-['Source_Serif_4'] text-sm text-[#1d1c16] focus:outline-none focus:border-[#850005]"
            />
          </div>

          <button
            type="submit"
            className="px-6 py-2 bg-[#850005] hover:bg-[#a8201a] text-white font-['Playfair_Display'] font-bold text-xs uppercase tracking-wider transition-colors"
          >
            Query Morgue
          </button>
        </form>

        {/* Filter Ribbons */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-['Source_Serif_4']">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#1d1c16] uppercase text-[11px] font-['Playfair_Display']">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-white border border-[#1d1c16]/40 px-2 py-1 text-xs text-[#1d1c16] focus:outline-none"
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
              <span className="font-bold text-[#1d1c16] uppercase text-[11px] font-['Playfair_Display']">Wire Source:</span>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="bg-white border border-[#1d1c16]/40 px-2 py-1 text-xs text-[#1d1c16] focus:outline-none"
              >
                <option value="all">All Wire Bureaus</option>
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

      {/* Results Section */}
      {loading ? (
        <div className="py-12 text-center text-[#5a413d]">
          <span className="material-symbols-outlined text-4xl animate-spin text-[#850005]">hourglass_top</span>
          <p className="font-['Playfair_Display'] font-bold uppercase tracking-wider text-sm mt-2">
            Retrieving Historical Broadsheets...
          </p>
        </div>
      ) : error ? (
        <div className="p-4 bg-[#ffdad6] border border-[#ba1a1a] text-[#410001] text-center text-sm">
          {error}
        </div>
      ) : articles.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-[#1d1c16]/30 text-[#5a413d] font-['Source_Serif_4']">
          <p className="text-lg italic">No archives matching the specified query.</p>
          <p className="text-xs mt-1">Try relaxing your keyword search or wire source filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <article
              key={article.id}
              className="bg-white border-2 border-[#1d1c16] p-5 flex flex-col justify-between hover:shadow-md transition-shadow group cursor-pointer"
              onClick={() => onSelectArticle(article.id)}
            >
              <div>
                <div className="flex items-center justify-between text-[10px] font-['Playfair_Display'] font-bold uppercase tracking-widest text-[#850005] border-b border-[#1d1c16]/20 pb-1.5 mb-2.5">
                  <span>{article.source}</span>
                  <span className="text-[#5a413d]">{article.category}</span>
                </div>

                <h3 className="font-['Playfair_Display'] text-lg font-bold text-[#1d1c16] leading-snug group-hover:text-[#850005] transition-colors mb-2">
                  {article.title}
                </h3>

                {article.summary && (
                  <p className="font-['Source_Serif_4'] text-xs text-[#5a413d] line-clamp-3 leading-relaxed mb-3">
                    {article.summary}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-[#1d1c16]/15 flex items-center justify-between text-[10px] font-['Source_Serif_4'] text-[#5a413d] uppercase">
                <span>{article.published_at ? new Date(article.published_at).toLocaleDateString() : 'Archived'}</span>
                <span className="font-bold text-[#850005] group-hover:underline">Inspect Clipping →</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
