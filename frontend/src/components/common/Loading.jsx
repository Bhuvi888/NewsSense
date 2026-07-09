import React from "react";

export default function Loading({ message = "Loading intelligence feed..." }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center min-h-[250px] animate-fade-in">
      <div className="w-9 h-9 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest">
        {message}
      </p>
    </div>
  );
}
