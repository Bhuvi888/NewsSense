import React from "react";
import { useSources } from "../hooks/useSources";
import SourceCard from "../components/news/SourceCard";
import Loading from "../components/common/Loading";
import ErrorState from "../components/common/ErrorState";

export default function Sources() {
  const { sources = [], loading, error, toggleFollow } = useSources();

  const followed = sources.filter((s) => s.isFollowing);
  const unfollowed = sources.filter((s) => !s.isFollowing);

  if (loading) {
    return <Loading message="Loading publisher registry..." />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <div className="max-w-[1280px] mx-auto animate-fade-in space-y-8">
      {/* Intro info */}
      <section className="border-b border-[var(--border)]/50 pb-5">
        <h1 className="font-serif text-2xl font-bold text-[var(--headline)]">
          Publisher Catalog
        </h1>
        <p className="text-xs text-neutral-500 mt-1 font-medium">
          Customize your news intelligence feed by following or unfollowing journals and media houses.
        </p>
      </section>

      <div className="space-y-10">
        {/* Followed Section */}
        {followed.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-[11px] font-extrabold tracking-widest text-[var(--accent)] uppercase border-b border-[var(--border)] pb-1.5 max-w-fit">
              Followed Channels ({followed.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {followed.map((src) => (
                <SourceCard
                  key={src.id}
                  source={src}
                  onToggleFollow={toggleFollow}
                />
              ))}
            </div>
          </div>
        )}

        {/* Directory Section */}
        <div className="space-y-4">
          <h2 className="text-[11px] font-extrabold tracking-widest text-[var(--accent)] uppercase border-b border-[var(--border)] pb-1.5 max-w-fit">
            Discover Channels ({unfollowed.length})
          </h2>
          {unfollowed.length === 0 ? (
            <p className="text-xs text-neutral-500 font-normal italic">
              You are following all available channels!
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {unfollowed.map((src) => (
                <SourceCard
                  key={src.id}
                  source={src}
                  onToggleFollow={toggleFollow}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
