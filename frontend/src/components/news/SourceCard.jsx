import React from "react";
import { Check, Plus } from "lucide-react";

export default function SourceCard({ source, onToggleFollow }) {
  // Generate first letters for logo
  const logoText = source.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 3);

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] p-5 rounded-sm flex flex-col justify-between h-full hover:shadow-sm transition-all duration-200">
      
      {/* Header Info */}
      <div className="flex items-center gap-4 mb-4">
        <div
          className="w-12 h-12 rounded-sm text-white font-extrabold text-xs flex items-center justify-center tracking-wider shadow-sm select-none"
          style={{ backgroundColor: source.logo || "var(--accent)" }}
        >
          {logoText}
        </div>
        <div>
          <h3 className="font-serif text-sm font-bold text-[var(--headline)]">
            {source.name}
          </h3>
          <span className="text-[10px] font-semibold text-neutral-500 block mt-0.5">
            {source.articlesCount} articles published
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-neutral-600 font-normal leading-relaxed mb-6 flex-grow">
        {source.description}
      </p>

      {/* Footer Metrics & Actions */}
      <div className="flex items-center justify-between border-t border-[var(--border)]/35 pt-4">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-[var(--headline)]">
            {(source.followers / 1000).toFixed(0)}k
          </span>
          <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">
            followers
          </span>
        </div>

        <button
          onClick={() => onToggleFollow(source.id)}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm text-[11px] font-bold transition-all duration-200 cursor-pointer border ${
            source.isFollowing
              ? "bg-[rgba(16,185,129,0.05)] border-emerald-500/40 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
              : "bg-transparent border-[var(--border)] text-neutral-600 hover:bg-[#F5EFE4] hover:text-[var(--headline)]"
          }`}
        >
          {source.isFollowing ? (
            <>
              <Check size={11} strokeWidth={3} />
              <span>Following</span>
            </>
          ) : (
            <>
              <Plus size={11} strokeWidth={3} />
              <span>Follow</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}
