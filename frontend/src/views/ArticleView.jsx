import React, { useState, useEffect } from 'react';
import { fetchArticleById } from '../services/api';
import { calculateReadingTime, isArticleSaved, toggleSaveArticle } from '../utils/helpers';

export default function ArticleView({ articleId, onBack, onAskAboutArticle }) {
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (!articleId) return;

    setLoading(true);
    setError(null);
    setIsSaved(isArticleSaved(articleId));

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

  // Pressing Esc returns to Home view
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-10 py-8 space-y-6" aria-busy="true" aria-label="Loading article">
        <div className="h-8 w-48 skeleton"></div>
        <div className="h-12 w-3/4 skeleton"></div>
        <div className="h-6 w-full skeleton"></div>
        <div className="w-full aspect-[16/9] skeleton"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div className="space-y-3">
            <div className="h-4 w-full skeleton"></div>
            <div className="h-4 w-full skeleton"></div>
            <div className="h-4 w-4/5 skeleton"></div>
          </div>
          <div className="space-y-3">
            <div className="h-4 w-full skeleton"></div>
            <div className="h-4 w-full skeleton"></div>
            <div className="h-4 w-3/4 skeleton"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center" role="alert">
        <div className="p-6 bg-[#ffdad6] border-2 border-[#ba1a1a] text-[#410001] max-w-lg mx-auto">
          <span className="material-symbols-outlined text-3xl" aria-hidden="true">error</span>
          <h3 className="font-['Playfair_Display'] text-xl font-bold mt-1">Story Unavailable</h3>
          <p className="text-sm font-['Source_Serif_4'] mt-1">{error || 'Article record could not be found.'}</p>
          <button 
            onClick={onBack}
            className="min-h-[44px] mt-4 px-5 py-2 bg-[#850005] text-white font-['Playfair_Display'] font-bold text-xs uppercase cursor-pointer"
          >
            ← Back to Today's Edition
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
    : 'Recent Report';

  const readingTime = calculateReadingTime(article.content || article.summary);

  const handleToggleBookmark = () => {
    const saved = toggleSaveArticle(article.id);
    setIsSaved(saved);
  };

  return (
    <article 
      className="max-w-4xl mx-auto px-4 sm:px-6 md:px-10 py-6 sm:py-8"
      aria-labelledby="article-headline"
    >
      {/* Top Navigation Bar */}
      <nav 
        aria-label="Story actions"
        className="flex flex-wrap items-center justify-between border-b-2 border-[#141310] pb-3 mb-6 gap-3"
      >
        <button
          onClick={onBack}
          className="min-h-[44px] font-['Playfair_Display'] text-xs sm:text-sm font-bold uppercase tracking-wider text-[#850005] hover:underline flex items-center gap-1.5 cursor-pointer px-2 py-1 -ml-2"
          title="Back to front page (Esc)"
          aria-label="Back to front page"
        >
          <span className="material-symbols-outlined text-base" aria-hidden="true">arrow_back</span>
          <span>Back to Today's Edition</span>
        </button>

        <div className="flex items-center gap-2 sm:gap-3 text-xs font-['Source_Serif_4'] flex-wrap">
          {/* Bookmark Button */}
          <button
            onClick={handleToggleBookmark}
            className="min-h-[44px] flex items-center gap-1 text-xs text-[#3e3832] hover:text-[#850005] transition-colors border border-[#141310]/30 px-3 py-2 bg-[#f8f3ea] cursor-pointer"
            title={isSaved ? "Remove from bookmarks" : "Save to reading list"}
            aria-label={isSaved ? "Remove from bookmarks" : "Save to reading list"}
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
              {isSaved ? 'bookmark' : 'bookmark_border'}
            </span>
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>

          {article.source_url && (
            <a
              href={article.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] px-2.5 flex items-center text-[#3e3832] hover:text-[#850005] underline font-medium"
              title="Read on original publication website"
            >
              Original Source ↗
            </a>
          )}

          <button
            onClick={() => onAskAboutArticle(article)}
            className="min-h-[44px] px-3.5 py-2 bg-[#850005] text-white font-['Playfair_Display'] text-xs font-bold uppercase tracking-wider hover:bg-[#a8201a] active:scale-95 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            aria-label="Ask WATCHER AI about this article"
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">psychology</span>
            <span>Ask WATCHER →</span>
          </button>
        </div>
      </nav>

      {/* Category & Date & Reading Time */}
      <div className="flex flex-wrap items-center justify-between text-xs font-['Playfair_Display'] uppercase font-bold text-[#850005] tracking-wider mb-2 gap-y-1">
        <span>{article.category || 'News'} • {article.source}</span>
        <div className="text-[#3e3832] font-['Source_Serif_4'] normal-case flex items-center gap-1.5">
          <time dateTime={article.published_at}>{pubDate}</time>
          <span className="text-[#7a6a62]" aria-hidden="true">·</span>
          <span>{readingTime}</span>
        </div>
      </div>

      {/* Main Headline (Clean Title Case, High-Contrast Serif) */}
      <h1 
        id="article-headline"
        className="font-['Playfair_Display'] text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#141310] leading-[1.15] mb-4"
      >
        {article.title}
      </h1>

      {/* Summary Lead with Optimal Line-Length */}
      {article.summary && (
        <p className="font-['Source_Serif_4'] text-base sm:text-xl text-[#141310] italic leading-relaxed border-b border-[#141310]/20 pb-4 mb-5 max-w-prose">
          {article.summary}
        </p>
      )}

      {/* Byline and Metadata */}
      <div className="flex flex-wrap items-center justify-between text-xs font-['Source_Serif_4'] text-[#3e3832] border-b-2 border-[#141310] pb-3 mb-6 gap-y-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span>By {article.author || 'Editorial Staff'}</span>
          <span className="text-[#7a6a62]" aria-hidden="true">·</span>
          <span>{article.source}</span>
          <span className="text-[#7a6a62]" aria-hidden="true">·</span>
          <time dateTime={article.published_at}>{pubDate}</time>
          <span className="text-[#7a6a62]" aria-hidden="true">·</span>
          <span>{readingTime}</span>
        </div>
      </div>

      {/* Hero Image if available */}
      {article.image_url && (
        <figure className="border-2 border-[#141310] bg-white p-2 mb-8 max-w-3xl mx-auto">
          <div className="relative aspect-[16/9] bg-[#ece8df] overflow-hidden border border-[#141310]/25">
            <img
              src={article.image_url}
              alt={article.title}
              className="w-full h-full object-cover newspaper-img"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
          <figcaption className="font-['Source_Serif_4'] text-[11px] text-[#3e3832] italic mt-2 text-center">
            Wire photo transmitted for {article.source}
          </figcaption>
        </figure>
      )}

      {/* Article Text with Controlled Line Length (65-75ch) & Generous Line-Height */}
      <div className="max-w-3xl mx-auto text-[16px] sm:text-[17px] font-['Source_Serif_4'] leading-[1.8] text-[#141310]">
        <div className="columns-1 md:columns-2 gap-8 text-left">
          <p className="drop-cap mb-4">
            {article.content || article.summary || "Full story text has been archived by NewsSense."}
          </p>
        </div>
      </div>

      {/* Bottom Footer Action */}
      <div className="mt-12 pt-4 border-t-2 border-[#141310] flex flex-wrap items-center justify-between text-xs font-['Source_Serif_4'] text-[#3e3832] gap-4">
        <div>
          <span>Filed under: <strong className="uppercase text-[#141310] font-['Playfair_Display']">{article.category}</strong></span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="min-h-[44px] px-3 py-2 text-[#850005] hover:underline font-bold uppercase flex items-center gap-1.5 cursor-pointer"
            aria-label="Print story"
          >
            <span className="material-symbols-outlined text-base" aria-hidden="true">print</span>
            <span>Print Story</span>
          </button>
        </div>
      </div>
    </article>
  );
}
