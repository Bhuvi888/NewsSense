import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useNews } from "../hooks/useNews";
import { useTopics } from "../hooks/useTopics";
import TopicChip from "../components/news/TopicChip";
import ArticleCard from "../components/news/ArticleCard";
import ArticleModal from "../components/news/ArticleModal";
import Loading from "../components/common/Loading";
import ErrorState from "../components/common/ErrorState";
import EmptyState from "../components/common/EmptyState";

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: dbArticles = [], isLoading: newsLoading, error: newsError } = useNews();
  const { topics = [] } = useTopics();
  
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [savedIds, setSavedIds] = useState(() => {
    try {
      const saved = localStorage.getItem("newsense_saved_articles");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // URL state management
  const activeCategory = searchParams.get("category") || "All";
  const searchQuery = searchParams.get("search") || "";
  const showSavedOnly = searchParams.get("saved") === "true";

  const handleToggleSave = (articleId) => {
    const nextSaved = savedIds.includes(articleId)
      ? savedIds.filter((id) => id !== articleId)
      : [...savedIds, articleId];
    setSavedIds(nextSaved);
    localStorage.setItem("newsense_saved_articles", JSON.stringify(nextSaved));
  };

  const handleCategoryChange = (category) => {
    const nextParams = new URLSearchParams(searchParams);
    if (category === "All") {
      nextParams.delete("category");
    } else {
      nextParams.set("category", category);
    }
    setSearchParams(nextParams);
  };

  const handleSavedTabChange = (savedOnly) => {
    const nextParams = new URLSearchParams(searchParams);
    if (savedOnly) {
      nextParams.set("saved", "true");
    } else {
      nextParams.delete("saved");
    }
    setSearchParams(nextParams);
  };

  // Filtering Logic
  const filteredArticles = dbArticles.filter((article) => {
    // 1. Bookmarks Filter
    if (showSavedOnly && !savedIds.includes(article.id)) {
      return false;
    }

    // 2. Category Filter
    if (activeCategory !== "All") {
      if (activeCategory.toLowerCase() === "top") {
        return true;
      }
      if (article.category.toLowerCase() !== activeCategory.toLowerCase()) {
        return false;
      }
    }

    // 3. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = article.title?.toLowerCase().includes(q);
      const summaryMatch = article.summary?.toLowerCase().includes(q);
      const contentMatch = article.content?.toLowerCase().includes(q);
      const sourceMatch = article.source?.toLowerCase().includes(q);
      
      return titleMatch || summaryMatch || contentMatch || sourceMatch;
    }

    return true;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

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

  const isLoading = newsLoading;
  const error = newsError ? "Failed to retrieve news from database." : null;

  return (
    <div className="max-w-[1280px] mx-auto animate-fade-in space-y-6">
      
      {/* Filtering Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)]/50 pb-2">
        
        {/* Sleek Underline tabs for All News & Bookmarks */}
        <div className="flex gap-6 select-none">
          <button
            onClick={() => handleSavedTabChange(false)}
            className={`text-xs font-extrabold uppercase tracking-widest pb-3 transition-all cursor-pointer relative ${
              !showSavedOnly
                ? "text-[var(--headline)] after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[var(--accent)]"
                : "text-neutral-400 hover:text-[var(--headline)]"
            }`}
          >
            All Articles
          </button>
          <button
            onClick={() => handleSavedTabChange(true)}
            className={`text-xs font-extrabold uppercase tracking-widest pb-3 transition-all cursor-pointer relative ${
              showSavedOnly
                ? "text-[var(--headline)] after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[var(--accent)]"
                : "text-neutral-400 hover:text-[var(--headline)]"
            }`}
          >
            Bookmarks ({dbArticles.filter((a) => savedIds.includes(a.id)).length})
          </button>
        </div>

        {/* Info label */}
        <div className="text-xs text-neutral-500 font-semibold select-none pb-2">
          {searchQuery && (
            <span>
              Search results for <strong className="text-[var(--headline)]">"{searchQuery}"</strong> &bull;{" "}
            </span>
          )}
          <span>Showing {filteredArticles.length} articles</span>
        </div>
      </div>

      {/* Topics Chips Carousel */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none select-none">
        <TopicChip
          topic="All Topics"
          isActive={activeCategory === "All"}
          onClick={() => handleCategoryChange("All")}
        />
        {topics.map((topic) => (
          <TopicChip
            key={topic}
            topic={topic}
            isActive={activeCategory.toLowerCase() === topic.toLowerCase()}
            onClick={() => handleCategoryChange(topic)}
          />
        ))}
      </div>

      {/* Main Grid View */}
      <div className="min-h-[400px]">
        {isLoading ? (
          <Loading message="Filtering news archive..." />
        ) : error ? (
          <ErrorState message={error} />
        ) : filteredArticles.length === 0 ? (
          <EmptyState
            title={showSavedOnly ? "No bookmarks saved" : "No articles found"}
            message={
              showSavedOnly
                ? "Bookmark articles on the dashboard or explore page to read them here later."
                : "We couldn't find any articles matching your filters. Try selecting a different topic or resetting your search."
            }
            actionLabel={showSavedOnly ? "Explore Articles" : "Reset Filters"}
            onAction={() => {
              if (showSavedOnly) {
                handleSavedTabChange(false);
              } else {
                handleCategoryChange("All");
                setSearchParams({});
              }
            }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredArticles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                onOpen={handleArticleClick}
                onToggleSave={handleToggleSave}
                isSaved={savedIds.includes(article.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ARTICLE READER MODAL */}
      {selectedArticle && (
        <ArticleModal
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
          onToggleSave={handleToggleSave}
        />
      )}
    </div>
  );
}
