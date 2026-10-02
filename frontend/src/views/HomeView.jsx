import React, { useEffect, useState } from 'react';
import { fetchNews, fetchTopics } from '../services/api';

export default function HomeView({ onSelectArticle, activeCategory = 'all', onAskAboutArticle }) {
  const [articles, setArticles] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    Promise.all([
      fetchNews({ 
        limit: 15, 
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-10 py-16 text-center">
        <div className="inline-block p-6 bg-[#f8f3ea] border-2 border-[#1d1c16] text-[#1d1c16]">
          <span className="material-symbols-outlined text-4xl animate-spin text-[#850005]">autorenew</span>
          <p className="mt-3 font-['Playfair_Display'] text-lg font-bold uppercase tracking-widest">
            Compiling Daily Dispatch Wire...
          </p>
          <p className="text-xs font-['Source_Serif_4'] text-[#5a413d] mt-1">Retrieving latest editions from news bureaus</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-10 py-12 text-center">
        <div className="p-6 bg-[#ffdad6] border-2 border-[#ba1a1a] text-[#410001] max-w-xl mx-auto">
          <span className="material-symbols-outlined text-3xl">error</span>
          <h3 className="font-['Playfair_Display'] text-xl font-bold uppercase mt-2">Wire Service Interrupted</h3>
          <p className="text-sm font-['Source_Serif_4'] mt-1">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-1.5 bg-[#850005] text-white font-bold text-xs uppercase"
          >
            Reconnect Wire
          </button>
        </div>
      </div>
    );
  }

  const leadArticle = articles[0] || null;
  const wireArticles = articles.slice(1, 6);
  const secondaryArticles = articles.slice(6);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-10 py-6">
      {/* Sub-Header & Edition Dispatch Bar */}
      <div className="w-full border-b-2 border-[#1d1c16] pb-2 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-y-2 text-[10px] font-['Playfair_Display'] tracking-[0.18em] uppercase text-[#1d1c16]">
          <div className="flex items-center gap-2">
            <span className="bg-[#850005] text-white px-2 py-0.5 font-bold">DISPATCH 01</span>
            <span className="font-bold text-[#1d1c16]">
              {activeCategory === 'all' ? "THE DAILY EDITION — FRONT PAGE & SYNTHESIS" : `SECTION FOCUS: ${activeCategory.toUpperCase()}`}
            </span>
          </div>
          <div className="flex items-center gap-4 text-[#5a413d] font-['Source_Serif_4'] text-[11px] tracking-widest">
            <span>EDITION: METROPOLITAN • FIRST FINAL</span>
            <span className="text-[#850005] font-bold">INDEXED: {articles.length} WIRE STORIES</span>
          </div>
        </div>
        <div className="w-full mt-2 pt-0.5 border-t border-b border-[#1d1c16]/30 h-1"></div>
      </div>

      {/* Primary Editorial Grid */}
      {leadArticle ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-8 lg:gap-x-8 border-b-2 border-[#1d1c16] pb-8">
          {/* Lead Story: 8 Columns */}
          <article className="lg:col-span-8 flex flex-col lg:border-r border-[#1d1c16]/30 lg:pr-8">
            {/* Category / Bureau tag */}
            <div className="flex items-center justify-between border-b border-[#1d1c16]/20 pb-1 mb-3">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 bg-[#850005]"></span>
                <span className="font-['Playfair_Display'] text-[10px] tracking-[0.2em] font-bold text-[#850005] uppercase">
                  {leadArticle.category || 'Special Dispatch'} • {leadArticle.source || 'Wire Service'}
                </span>
              </div>
              <span className="font-['Source_Serif_4'] text-[11px] text-[#5a413d] tracking-wider uppercase">
                Front Page Lead
              </span>
            </div>

            {/* Headline */}
            <h2 
              onClick={() => onSelectArticle(leadArticle.id)}
              className="font-['Playfair_Display'] text-3xl sm:text-4xl lg:text-5xl tracking-tight text-[#1d1c16] uppercase mb-4 leading-[1.08] hover:text-[#850005] cursor-pointer transition-colors"
            >
              {leadArticle.title}
            </h2>

            {/* Sub-headline / Summary */}
            {leadArticle.summary && (
              <p className="font-['Source_Serif_4'] text-base sm:text-lg text-[#1d1c16] italic leading-snug border-b border-[#1d1c16]/20 pb-3 mb-4">
                {leadArticle.summary}
              </p>
            )}

            {/* Byline & Dateline */}
            <div className="flex flex-wrap items-center justify-between text-[11px] font-['Source_Serif_4'] uppercase tracking-widest text-[#5a413d] pb-3 mb-5 border-b border-[#1d1c16]/15 gap-y-1">
              <div>
                <span>By </span>
                <span className="font-bold text-[#1d1c16]">{leadArticle.author || 'Editorial Staff'}</span>
                <span className="mx-1.5">•</span>
                <span>Wire Bureau: {leadArticle.source}</span>
              </div>
              <div className="flex items-center gap-3">
                <span>{leadArticle.published_at ? new Date(leadArticle.published_at).toLocaleDateString() : 'Today'}</span>
                <button 
                  onClick={() => onAskAboutArticle(leadArticle)}
                  className="text-[#850005] font-bold hover:underline flex items-center gap-0.5"
                >
                  <span className="material-symbols-outlined text-[14px]">psychology</span>
                  <span>Cross-Examine</span>
                </button>
              </div>
            </div>

            {/* Lead Story Body & Image */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="font-['Source_Serif_4'] text-[15px] leading-relaxed text-justify text-[#1d1c16]">
                <p className="drop-cap mb-4">
                  {leadArticle.content 
                    ? leadArticle.content.slice(0, 480) 
                    : leadArticle.summary || "Special dispatches continue to stream across national and international wires. Stay tuned for real-time synthesis."}
                  ...
                </p>
                <div className="mt-4 pt-2 border-t border-[#1d1c16]/20">
                  <button
                    onClick={() => onSelectArticle(leadArticle.id)}
                    className="font-['Playfair_Display'] text-xs font-bold text-[#850005] uppercase tracking-wider hover:underline flex items-center gap-1"
                  >
                    <span>Read Full Clipping on Page 2</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              </div>

              {/* Inset Illustration / Hero Photo */}
              <div className="flex flex-col">
                <div className="border-2 border-[#1d1c16] bg-white p-2 mb-2">
                  <div className="relative w-full aspect-[4/3] bg-[#ece8df] overflow-hidden border border-[#1d1c16]/30">
                    <img
                      src={leadArticle.image_url || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=800&auto=format&fit=crop"}
                      alt={leadArticle.title}
                      className="w-full h-full object-cover newspaper-img"
                      onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?q=80&w=800&auto=format&fit=crop";
                      }}
                    />
                  </div>
                  <p className="font-['Source_Serif_4'] text-[11px] text-[#5a413d] italic mt-2 px-1 text-center">
                    Fig. 1. — Photographic wire record transmitted to the desk. Verified by NewsSense.
                  </p>
                </div>
              </div>
            </div>
          </article>

          {/* Right Column: 4 Columns (The Wire Ticker & Topics Index) */}
          <aside className="lg:col-span-4 flex flex-col space-y-6">
            {/* The Wire Ticker Box */}
            <div className="border-2 border-[#1d1c16] bg-[#f8f3ea] p-4">
              <div className="flex items-center justify-between border-b-2 border-[#1d1c16] pb-2 mb-3">
                <h3 className="font-['Playfair_Display'] text-base font-bold uppercase tracking-wider text-[#1d1c16] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-lg text-[#850005]">rss_feed</span>
                  <span>The Wire Ticker</span>
                </h3>
                <span className="text-[10px] font-['Source_Serif_4'] text-[#850005] font-bold uppercase tracking-widest">
                  Live Stream
                </span>
              </div>

              <div className="divide-y divide-[#1d1c16]/20">
                {wireArticles.map((article) => (
                  <div 
                    key={article.id} 
                    className="py-3 first:pt-0 last:pb-0 cursor-pointer group"
                    onClick={() => onSelectArticle(article.id)}
                  >
                    <div className="flex items-center justify-between text-[10px] font-['Source_Serif_4'] uppercase text-[#5a413d] mb-1">
                      <span className="font-bold text-[#850005]">{article.source}</span>
                      <span>{article.category || 'Wire'}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-['Playfair_Display'] text-sm font-bold text-[#1d1c16] leading-snug group-hover:text-[#850005] transition-colors">
                          {article.title}
                        </h4>
                        {article.summary && (
                          <p className="text-[12px] font-['Source_Serif_4'] text-[#5a413d] line-clamp-2 mt-1">
                            {article.summary}
                          </p>
                        )}
                      </div>
                      {article.image_url && (
                        <div className="w-16 h-16 shrink-0 border-2 border-[#1d1c16] bg-white p-0.5">
                          <img
                            src={article.image_url}
                            alt={article.title}
                            loading="lazy"
                            className="w-full h-full object-cover newspaper-img"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Topics Index / Classifieds Box */}
            {topics.length > 0 && (
              <div className="border border-[#1d1c16]/40 bg-[#f2ede4] p-4">
                <h4 className="font-['Playfair_Display'] text-xs font-bold uppercase tracking-widest text-[#1d1c16] border-b border-[#1d1c16]/30 pb-1 mb-3">
                  Index to Ingested Topics
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {topics.slice(0, 10).map((t, idx) => (
                    <span 
                      key={idx}
                      className="text-[11px] font-['Source_Serif_4'] bg-[#fef9f0] border border-[#1d1c16]/30 px-2 py-0.5 text-[#1d1c16] flex items-center gap-1"
                    >
                      <span className="font-bold">{t.topic}</span>
                      <span className="text-[#8e706c] text-[9px]">({t.article_count})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      ) : (
        <div className="py-12 text-center text-[#5a413d] font-['Source_Serif_4']">
          No dispatches recorded under this section yet.
        </div>
      )}

      {/* Secondary Articles Section ("Below the Fold") */}
      {secondaryArticles.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center justify-between border-b-2 border-[#1d1c16] pb-2 mb-6">
            <h3 className="font-['Playfair_Display'] text-xl font-bold uppercase tracking-wide text-[#1d1c16]">
              Dispatches From Secondary Bureaus
            </h3>
            <span className="text-xs font-['Source_Serif_4'] uppercase text-[#5a413d] tracking-widest">
              Continued From Page 1
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {secondaryArticles.map((article) => (
              <article 
                key={article.id}
                className="bg-[#f8f3ea] border border-[#1d1c16]/30 p-4 flex flex-col justify-between torn-edge hover:border-[#850005] transition-all cursor-pointer group"
                onClick={() => onSelectArticle(article.id)}
              >
                {article.image_url && (
                  <div className="border-2 border-[#1d1c16] bg-white p-1.5 mb-3">
                    <div className="relative w-full aspect-[16/9] bg-[#ece8df] overflow-hidden border border-[#1d1c16]/30">
                      <img
                        src={article.image_url}
                        alt={article.title}
                        loading="lazy"
                        className="w-full h-full object-cover newspaper-img"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}
                <div>
                  <div className="flex items-center justify-between text-[10px] font-['Playfair_Display'] uppercase font-bold text-[#850005] border-b border-[#1d1c16]/20 pb-1 mb-2">
                    <span>{article.source}</span>
                    <span className="text-[#5a413d]">{article.category}</span>
                  </div>
                  <h4 className="font-['Playfair_Display'] text-base font-bold text-[#1d1c16] leading-snug group-hover:text-[#850005] transition-colors mb-2">
                    {article.title}
                  </h4>
                  {article.summary && (
                    <p className="font-['Source_Serif_4'] text-xs text-[#5a413d] leading-relaxed line-clamp-3">
                      {article.summary}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-2 border-t border-[#1d1c16]/15 flex items-center justify-between text-[10px] font-['Source_Serif_4'] text-[#5a413d] uppercase">
                  <span>{article.published_at ? new Date(article.published_at).toLocaleDateString() : 'Archived'}</span>
                  <span className="text-[#850005] font-bold group-hover:underline">Read Article →</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
