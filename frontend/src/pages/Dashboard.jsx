import React, { useState } from "react";
import { useNews } from "../hooks/useNews";
import { getArticleImage } from "../utils/imageHelper";
import ArticleModal from "../components/news/ArticleModal";
import { Bookmark, ChevronRight, MapPin, Globe, Briefcase, Cpu, Beaker } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: dbArticles = [], isLoading, error } = useNews();
  const [selectedArticle, setSelectedArticle] = useState(null);

  // Local storage bookmarks state
  const [savedIds, setSavedIds] = useState(() => {
    try {
      const saved = localStorage.getItem("newsense_saved_articles");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleToggleSave = (articleId, e) => {
    if (e) e.stopPropagation();
    const nextSaved = savedIds.includes(articleId)
      ? savedIds.filter((id) => id !== articleId)
      : [...savedIds, articleId];
    setSavedIds(nextSaved);
    localStorage.setItem("newsense_saved_articles", JSON.stringify(nextSaved));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <div className="w-10 h-10 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 font-serif text-sm font-semibold text-neutral-600">Loading News Feed...</p>
      </div>
    );
  }

  if (error || dbArticles.length === 0) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <h3 className="font-serif text-xl font-bold text-red-800">No News Available</h3>
        <p className="text-sm text-neutral-500 mt-2">Failed to load articles from the database.</p>
      </div>
    );
  }

  // Extract featured (Top Story) and list articles from database records
  const featuredArticle = dbArticles[0];
  const listArticles = dbArticles.slice(1, 9); // Display next 8 articles in feed

  // Format dates for display
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  // Helper to calculate relative times dynamically
  const getRelativeTime = (pubDateStr) => {
    if (!pubDateStr) return "1h ago";
    const now = new Date();
    const pubDate = new Date(pubDateStr);
    const diffMs = now - pubDate;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60 && diffMins > 0) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24 && diffHours > 0) {
      return `${diffHours}h ago`;
    } else if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else {
      return "1d ago";
    }
  };

  // Resolve News Briefs from database articles starting at index 9 (to avoid overlap)
  const briefs = dbArticles.slice(9, 14).map((art) => ({
    id: art.id,
    title: art.title.replace(/^Explained\s*\|\s*/i, ""),
    time: getRelativeTime(art.published_at),
    originalArticle: art
  }));

  // Popular Topics list matching mockup
  const popularTopics = [
    { name: "India", icon: MapPin, path: "/explore?category=India" },
    { name: "World", icon: Globe, path: "/explore?category=World" },
    { name: "Business", icon: Briefcase, path: "/explore?category=Business" },
    { name: "Technology", icon: Cpu, path: "/explore?category=Technology" },
    { name: "Science", icon: Beaker, path: "/explore?category=Science" }
  ];

  const handleArticleClick = (article) => {
    const enriched = {
      ...article,
      topic: article.category,
      sourceName: article.source,
      readTime: "4 min read",
      publishedAt: formatDate(article.published_at),
      isSaved: savedIds.includes(article.id)
    };
    setSelectedArticle(enriched);
  };

  return (
    <div className="max-w-[1280px] mx-auto animate-fade-in">
      <div className="grid grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Main news feed (75% on large screens) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col">
          
          {/* TOP STORIES */}
          <div className="mb-4">
            <h2 className="text-[11px] font-extrabold tracking-widest text-[var(--accent)] uppercase border-b-4 border-double border-[var(--border)] pb-1 mb-4 select-none">
              Top Stories
            </h2>

            {featuredArticle && (
              <div
                onClick={() => handleArticleClick(featuredArticle)}
                className="bg-[var(--surface)] border border-[var(--border)] p-5 flex flex-col md:flex-row gap-6 cursor-pointer hover:shadow-md transition-all duration-300 group"
              >
                {/* Featured Image with Fallback and Zoom */}
                <div className="w-full md:w-1/2 h-[220px] md:h-auto bg-[#EFEAE2] overflow-hidden relative flex items-center justify-center border border-[var(--border)]/35">
                  <img
                    src={getArticleImage(featuredArticle)}
                    alt=""
                    className="w-full h-full object-cover grayscale-[10%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 absolute inset-0"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                  <span className="text-xs font-bold text-neutral-400 uppercase select-none tracking-wider font-serif">
                    {featuredArticle.source}
                  </span>
                </div>

                {/* Featured Text */}
                <div className="w-full md:w-1/2 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold tracking-widest text-[var(--accent)] uppercase block mb-2">
                      {featuredArticle.category}
                    </span>
                    <h3 className="font-serif text-2xl font-bold leading-tight text-[var(--headline)] hover:text-[var(--accent)] transition duration-200">
                      {featuredArticle.title}
                    </h3>
                    <p className="text-xs text-neutral-600 font-normal leading-relaxed mt-3.5">
                      {featuredArticle.summary}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-neutral-500 font-medium border-t border-[var(--border)]/40 pt-4 mt-6">
                    <span>
                      {featuredArticle.source} &bull; {formatDate(featuredArticle.published_at)}
                    </span>
                    <button
                      onClick={(e) => handleToggleSave(featuredArticle.id, e)}
                      className="text-neutral-400 hover:text-[var(--accent)] transition cursor-pointer"
                      aria-label="Bookmark"
                    >
                      <Bookmark
                        size={15}
                        fill={savedIds.includes(featuredArticle.id) ? "var(--accent)" : "none"}
                        stroke={savedIds.includes(featuredArticle.id) ? "var(--accent)" : "currentColor"}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="my-6 border-t border-[var(--border)]"></div>

          {/* LATEST NEWS */}
          <div className="flex-grow">
            <h2 className="text-[11px] font-extrabold tracking-widest text-[var(--accent)] uppercase border-b-4 border-double border-[var(--border)] pb-1 mb-4 select-none">
              Latest News
            </h2>

            <div className="bg-[var(--surface)] border border-[var(--border)] divide-y divide-[var(--border)]/50">
              {listArticles.map((article, idx) => (
                <div
                  key={article.id || idx}
                  onClick={() => handleArticleClick(article)}
                  className="p-5 flex flex-row gap-5 cursor-pointer hover:bg-[#F5EFE4]/30 transition-all duration-200 group"
                >
                  {/* List item description */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-serif text-[15px] font-bold leading-snug text-[var(--headline)] hover:text-[var(--accent)] transition duration-200">
                        {article.title}
                      </h3>
                      <p className="text-[11px] text-neutral-500 leading-normal mt-2 line-clamp-2">
                        {article.summary}
                      </p>
                    </div>

                    <div className="text-[10px] text-neutral-400 font-medium mt-4">
                      {article.source} &bull; {formatDate(article.published_at)}
                    </div>
                  </div>

                  {/* List item thumbnail with Fallback and Zoom */}
                  <div className="w-[120px] h-[80px] min-w-[120px] bg-[#EFEAE2] border border-[var(--border)]/35 overflow-hidden self-center relative flex items-center justify-center">
                    <img
                      src={getArticleImage(article)}
                      alt=""
                      className="w-full h-full object-cover grayscale-[15%] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-500 absolute inset-0"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                    <span className="text-[10px] font-bold text-neutral-400 uppercase select-none tracking-wider font-serif">
                      {article.source.split(" ").map(n => n[0]).join("")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Sidebar Widgets (25% on large screens) */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          
          {/* Vertical divider on large screens */}
          <div className="lg:border-l lg:border-[var(--border)] lg:pl-6 h-full space-y-6">
            
            {/* NEWS BRIEF */}
            <div className="bg-[var(--surface)] border border-[var(--border)] p-5">
              <h2 className="text-[11px] font-extrabold tracking-widest text-[var(--accent)] uppercase border-b-4 border-double border-[var(--border)] pb-1 mb-4 select-none">
                News Brief
              </h2>

              <div className="divide-y divide-[var(--border)]/45">
                {briefs.length === 0 ? (
                  <p className="text-xs text-neutral-400 italic py-4">No briefs available.</p>
                ) : (
                  briefs.map((brief, idx) => (
                    <div
                      key={brief.id || idx}
                      onClick={() => brief.originalArticle && handleArticleClick(brief.originalArticle)}
                      className="py-3.5 first:pt-0 last:pb-0 cursor-pointer group flex items-start gap-2.5"
                    >
                      {/* Editorial Rotated Diamond Bullet */}
                      <div className="w-1.5 h-1.5 bg-[var(--accent)] rotate-45 mt-1.5 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-150 flex-shrink-0"></div>
                      
                      <div className="flex justify-between items-start gap-3 w-full">
                        <h4 className="font-serif text-xs font-bold leading-normal text-[var(--headline)] group-hover:text-[var(--accent)] transition duration-150">
                          {brief.title}
                        </h4>
                        <span className="text-[9px] text-neutral-400 font-semibold whitespace-nowrap pt-0.5">
                          {brief.time}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* POPULAR TOPICS */}
            <div className="bg-[var(--surface)] border border-[var(--border)] p-5">
              <h2 className="text-[11px] font-extrabold tracking-widest text-[var(--accent)] uppercase border-b-4 border-double border-[var(--border)] pb-1 mb-4 select-none">
                Popular Topics
              </h2>

              <div className="divide-y divide-[var(--border)]/45 mb-4">
                {popularTopics.map((topic, idx) => {
                  const Icon = topic.icon;
                  return (
                    <div
                      key={idx}
                      onClick={() => navigate(topic.path)}
                      className="py-3 first:pt-0 last:pb-0 flex items-center justify-between cursor-pointer text-neutral-600 hover:text-[var(--accent)] transition duration-150 group"
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={14} className="text-neutral-500" />
                        <span className="text-xs font-semibold">{topic.name}</span>
                      </div>
                      <ChevronRight size={13} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform duration-150 text-neutral-400 group-hover:text-[var(--accent)]" />
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => navigate("/explore")}
                className="w-full text-center border border-[var(--border)] rounded-sm py-2 text-xs font-bold text-neutral-600 bg-transparent hover:bg-[#F5EFE4] hover:text-[var(--headline)] transition duration-200 cursor-pointer"
              >
                View all topics
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* ARTICLE READER MODAL */}
      {selectedArticle && (
        <ArticleModal
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
          onToggleSave={(id) => handleToggleSave(id)}
        />
      )}
    </div>
  );
}