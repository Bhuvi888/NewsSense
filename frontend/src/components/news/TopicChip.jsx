import React from "react";

export default function TopicChip({ topic, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 border cursor-pointer ${
        isActive
          ? "bg-[var(--accent)] border-[var(--accent)] text-white shadow-sm"
          : "bg-[var(--surface)] border-[var(--border)] text-neutral-600 hover:bg-[#F5EFE4] hover:text-[var(--headline)]"
      }`}
    >
      {topic}
    </button>
  );
}
