import React from "react";
import { Bookmark } from "lucide-react";
import { getArticleImage } from "../../utils/imageHelper";

export default function ArticleCard({ article, onClick, onOpen, onToggleSave, isSaved }) {
  const handleClick = () => {
    if (onClick) onClick(article);
    else if (onOpen) onOpen(article);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  return (
    <div
      onClick={handleClick}
      className="group bg-[var(--surface)] border border-[var(--border)] rounded-sm overflow-hidden flex flex-col justify-between h-full cursor-pointer hover:shadow-md transition-all duration-200"
    >
      <div>
        {/* Cover Image with Fallback and Zoom */}
        <div className="w-full h-44 overflow-hidden relative border-b border-[var(--border)]/35 bg-[#EFEAE2] flex items-center justify-center">
          <img
            src={getArticleImage(article)}
            alt=""
            className="w-full h-full object-cover grayscale-[10%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500 absolute inset-0"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
          <span className="text-[10px] font-bold text-neutral-400 uppercase select-none tracking-wider font-serif">
            {article.source.split(" ").map(n => n[0]).join("")}
          </span>
          <span className="absolute top-2 left-2 bg-[var(--accent)] text-white text-[9px] font-extrabold tracking-widest uppercase px-2 py-0.5 rounded-sm">
            {article.category}
          </span>
        </div>

        {/* Text Details */}
        <div className="p-4">
          <div className="text-[10px] text-neutral-500 font-semibold tracking-wide uppercase mb-1.5">
            {article.source} &bull; {formatDate(article.published_at)}
          </div>
          <h3 className="font-serif text-[15px] font-bold leading-snug text-[var(--headline)] group-hover:text-[var(--accent)] transition duration-150">
            {article.title}
          </h3>
          <p className="text-xs text-neutral-600 font-normal leading-relaxed mt-2.5 line-clamp-3">
            {article.summary}
          </p>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-4 pb-4 pt-2 border-t border-[var(--border)]/20 flex items-center justify-between">
        <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">
          {article.author || "Staff Writer"}
        </span>
        {onToggleSave && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave(article.id);
            }}
            className="text-neutral-400 hover:text-[var(--accent)] transition cursor-pointer p-1"
            aria-label="Bookmark article"
          >
            <Bookmark
              size={14}
              fill={isSaved ? "var(--accent)" : "none"}
              stroke={isSaved ? "var(--accent)" : "currentColor"}
            />
          </button>
        )}
      </div>
    </div>
  );
}