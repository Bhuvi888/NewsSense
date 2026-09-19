import React, { useState, useEffect } from 'react';
import { fetchArticleById } from '../services/api';

export default function ArticleView({ articleId, onBack, onAskAboutArticle }) {
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!articleId) return;

    setLoading(true);
    setError(null);

    fetchArticleById(articleId)
      .then(data => {
        setArticle(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [articleId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-[#5a413d]">
        <span className="material-symbols-outlined text-4xl animate-spin text-[#850005]">newspaper</span>
        <p className="font-['Playfair_Display'] font-bold text-lg uppercase tracking-wider mt-3">
          Retrieving Full Broadsheet Clipping...
        </p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="p-6 bg-[#ffdad6] border border-[#ba1a1a] text-[#410001]">
          <h3 className="font-['Playfair_Display'] text-xl font-bold uppercase">Clipping Unavailable</h3>
          <p className="text-sm font-['Source_Serif_4'] mt-1">{error || 'Article record could not be found.'}</p>
          <button 
            onClick={onBack}
            className="mt-4 px-4 py-1.5 bg-[#850005] text-white font-bold text-xs uppercase"
          >
            ← Return to Front Page
          </button>
        </div>
      </div>
    );
  }

  const pubDate = article.published_at 
    ? new Date(article.published_at).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Recent Wire Dispatch';

  return (
    <article className="max-w-5xl mx-auto px-4 md:px-10 py-8">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between border-b-2 border-[#1d1c16] pb-3 mb-6">
        <button
          onClick={onBack}
          className="font-['Playfair_Display'] text-xs font-bold uppercase tracking-widest text-[#850005] hover:underline flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          <span>Return to Front Page</span>
        </button>

        <div className="flex items-center gap-4 text-xs font-['Source_Serif_4']">
          {article.source_url && (
            <a
              href={article.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#5a413d] hover:text-[#850005] underline uppercase tracking-wider"
            >
              Original Wire ↗
            </a>
          )}
          <button
            onClick={() => onAskAboutArticle(article)}
            className="px-3 py-1 bg-[#850005] text-white font-['Playfair_Display'] text-xs font-bold uppercase tracking-wider hover:bg-[#a8201a] transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[14px]">psychology</span>
            <span>Cross-Examine with AI</span>
          </button>
        </div>
      </div>

      {/* Overline & Category */}
      <div className="flex items-center justify-between text-[11px] font-['Playfair_Display'] uppercase font-bold text-[#850005] tracking-[0.2em] mb-2">
        <span>{article.category || 'Special Report'} • {article.source}</span>
        <span className="text-[#5a413d]">{pubDate}</span>
      </div>

      {/* Main Headline */}
      <h1 className="font-['Playfair_Display'] text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#1d1c16] uppercase leading-[1.05] mb-4">
        {article.title}
      </h1>

      {/* Sub-headline / Summary */}
      {article.summary && (
        <p className="font-['Source_Serif_4'] text-lg sm:text-xl text-[#1d1c16] italic leading-relaxed border-b border-[#1d1c16]/20 pb-4 mb-6">
          {article.summary}
        </p>
      )}

      {/* Byline and Dateline */}
      <div className="flex flex-wrap items-center justify-between text-xs font-['Source_Serif_4'] uppercase tracking-widest text-[#5a413d] border-b-2 border-[#1d1c16] pb-3 mb-6 gap-y-2">
        <div>
          <span>By </span>
          <span className="font-bold text-[#1d1c16]">{article.author || 'Editorial Wire Bureau'}</span>
          <span className="mx-2">•</span>
          <span>Verified Syndicate: {article.source}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Ingested to ChromaDB: {new Date(article.ingested_at).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Hero Image if available */}
      {article.image_url && (
        <div className="border-2 border-[#1d1c16] bg-white p-2 mb-8 max-w-3xl mx-auto">
          <div className="relative aspect-[16/9] bg-[#ece8df] overflow-hidden border border-[#1d1c16]/30">
            <img
              src={article.image_url}
              alt={article.title}
              className="w-full h-full object-cover newspaper-img"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
          <p className="font-['Source_Serif_4'] text-[11px] text-[#5a413d] italic mt-2 text-center">
            Fig. 1. — Photographic transmission filed with the dispatch wire.
          </p>
        </div>
      )}

      {/* Multi-Column Article Text */}
      <div className="columns-1 md:columns-2 gap-8 text-[15px] font-['Source_Serif_4'] leading-relaxed text-justify text-[#1d1c16]">
        <p className="drop-cap mb-4">
          {article.content || article.summary || "Full wire text is being indexed by the central neural retrieval repository."}
        </p>
      </div>

      {/* Bottom Dispatch Footer */}
      <div className="mt-12 pt-4 border-t-2 border-[#1d1c16] flex flex-wrap items-center justify-between text-xs font-['Source_Serif_4'] text-[#5a413d]">
        <div>
          <span>Filed under section: <strong className="uppercase text-[#1d1c16]">{article.category}</strong></span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="text-[#850005] hover:underline font-bold uppercase flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">print</span>
            <span>Print Broadsheet Clipping</span>
          </button>
        </div>
      </div>
    </article>
  );
}
