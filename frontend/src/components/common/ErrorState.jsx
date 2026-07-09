import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function ErrorState({
  message = "An unexpected error occurred while fetching information.",
  onRetry,
}) {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-5 p-5 bg-rose-50 border border-rose-200 rounded-sm max-w-[650px] mx-auto my-8 animate-fade-in">
      <div className="bg-rose-100 p-2.5 rounded-full text-rose-600">
        <AlertCircle size={24} />
      </div>
      <div className="flex-1 text-center sm:text-left">
        <h4 className="font-serif text-sm font-bold text-rose-800">
          Connection Failure
        </h4>
        <p className="text-xs text-rose-700/80 leading-normal mt-0.5">
          {message}
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 border border-rose-300 rounded-sm px-4.5 py-1.5 text-xs font-bold text-rose-800 bg-transparent hover:bg-rose-100/50 transition cursor-pointer"
        >
          <RefreshCw size={12} />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
}
