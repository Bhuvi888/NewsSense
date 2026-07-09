import React from "react";
import { Search } from "lucide-react";

export default function EmptyState({
  title = "No results found",
  message = "Try refining your search queries or selecting a different category.",
  actionLabel,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 md:p-12 bg-[var(--surface)] border border-[var(--border)] rounded-sm text-center max-w-[500px] mx-auto my-8 animate-fade-in">
      <div className="text-neutral-300 mb-4 bg-[#F7F3EB] p-4 rounded-full">
        <Search size={32} strokeWidth={1.5} className="text-neutral-400" />
      </div>
      <h3 className="font-serif text-base font-bold text-[var(--headline)] mb-1">
        {title}
      </h3>
      <p className="text-xs text-neutral-500 max-w-[320px] leading-relaxed">
        {message}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-6 border border-[var(--border)] rounded-sm px-5 py-2 text-xs font-bold text-neutral-600 bg-transparent hover:bg-[#F5EFE4] hover:text-[var(--headline)] transition duration-200 cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
