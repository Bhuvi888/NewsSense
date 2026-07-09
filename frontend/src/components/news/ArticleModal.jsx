import React, { useState } from "react";
import { Bookmark, Share2, X, Check, ExternalLink } from "lucide-react";
import { getArticleImage } from "../../utils/imageHelper";

export default function ArticleModal({ article, onClose, onToggleSave }) {
  const [copied, setCopied] = useState(false);

  if (!article) return null;

  const handleShare = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(window.location.origin + `/explore?search=${encodeURIComponent(article.title)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-neutral-900/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[700px] max-h-[90vh] bg-[var(--surface)] border border-[var(--border)] flex flex-col shadow-lg overflow-hidden animate-fade-in"
      >
        {/* Cover Image & Close button */}
        <div className="relative h-[250px] w-full border-b border-[var(--border)]/40 overflow-hidden bg-[#EFEAE2] flex items-center justify-center">
          <img
            src={getArticleImage(article)}
            alt=""
            className="w-full h-full object-cover grayscale-[10%] absolute inset-0"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 bg-neutral-900/80 hover:bg-neutral-900 text-white rounded-full p-2 transition cursor-pointer z-10"
            aria-label="Close reader"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
          
          <span className="absolute bottom-3 left-4 bg-[var(--accent)] text-white text-[10px] font-extrabold tracking-widest uppercase px-2.5 py-0.5 rounded-sm select-none">
            {article.topic || article.category}
          </span>
          <span className="text-xl font-bold text-neutral-400 uppercase select-none tracking-wider font-serif">
            {article.sourceName || article.source}
          </span>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-5">
          {/* Metadata */}
          <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider flex items-center gap-2 select-none">
            <span className="text-[var(--accent)]">{article.sourceName || article.source}</span>
            <span>&bull;</span>
            <span>{article.readTime || "3 min read"}</span>
            <span>&bull;</span>
            <span>{article.publishedAt || new Date(article.published_at).toLocaleDateString()}</span>
          </div>

          {/* Title - Clickable Link to Original Article */}
          <h2 className="font-serif text-2xl md:text-3xl font-extrabold leading-tight text-[var(--headline)]">
            {article.source_url ? (
              <a
                href={article.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[var(--accent)] hover:underline transition duration-150"
                title="Open original article link"
              >
                {article.title}
              </a>
            ) : (
              article.title
            )}
          </h2>

          {/* Content Paragraphs with editorial print dropcap */}
          <div className="font-sans text-sm text-neutral-700 leading-relaxed space-y-4">
            <p className="font-medium text-neutral-800 newspaper-dropcap min-h-[60px]">
              {article.summary}
            </p>
            <p className="text-neutral-600">
              {article.content || "No detailed content is available for this article. Please check the source link for the full story."}
            </p>
            {!article.content && (
              <p className="text-neutral-500 italic">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
                Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>
            )}
          </div>

          {/* Action buttons footer separated by double-border */}
          <div className="flex flex-wrap items-center gap-3 pt-6 border-t-4 border-double border-[var(--border)]">
            {/* Save Button */}
            <button
              onClick={() => onToggleSave(article.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-sm text-xs font-bold transition-all duration-200 cursor-pointer border ${
                article.isSaved
                  ? "bg-[rgba(139,30,30,0.08)] border-[var(--accent)] text-[var(--accent)]"
                  : "bg-[var(--accent)] border-[var(--accent)] text-white hover:bg-[#721818] hover:-translate-y-[1px]"
              }`}
            >
              <Bookmark size={13} fill={article.isSaved ? "currentColor" : "none"} />
              <span>{article.isSaved ? "Saved to Bookmarks" : "Save for Later"}</span>
            </button>

            {/* Read Original Link Button */}
            {article.source_url && (
              <a
                href={article.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 rounded-sm text-xs font-bold border border-[var(--border)] text-neutral-600 hover:bg-[#F5EFE4] hover:text-[var(--headline)] transition duration-200 cursor-pointer hover:-translate-y-[1px]"
              >
                <ExternalLink size={13} />
                <span>Read Original</span>
              </a>
            )}

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-5 py-2.5 rounded-sm text-xs font-bold border border-[var(--border)] text-neutral-600 hover:bg-[#F5EFE4] hover:text-[var(--headline)] transition duration-200 cursor-pointer hover:-translate-y-[1px]"
            >
              {copied ? (
                <>
                  <Check size={13} className="text-emerald-600" />
                  <span className="text-emerald-600">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 size={13} />
                  <span>Share Link</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
