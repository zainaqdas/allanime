'use client';

import { useState } from 'react';
import Link from 'next/link';

interface EpisodeGridProps {
  episodes: string[];
  showId: string;
  translationType: string;
  currentEpisode?: string;
}

export default function EpisodeGrid({ episodes, showId, translationType, currentEpisode }: EpisodeGridProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const sorted = [...episodes].sort((a, b) => {
    const na = parseInt(a, 10);
    const nb = parseInt(b, 10);
    if (!isNaN(na) && !isNaN(nb)) return nb - na;
    return String(b).localeCompare(String(a));
  });

  if (sorted.length === 0) {
    return (
      <div className="text-center py-12 text-text-muted">
        <p>No episodes available</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-text-muted">{sorted.length} episodes</span>
        <div className="flex bg-bg-card border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 text-xs transition-colors ${viewMode === 'grid' ? 'bg-gradient-to-r from-accent-1 to-accent-2 text-white' : 'text-text-muted hover:text-text-secondary'}`}
          >
            ▦ Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 text-xs transition-colors ${viewMode === 'list' ? 'bg-gradient-to-r from-accent-1 to-accent-2 text-white' : 'text-text-muted hover:text-text-secondary'}`}
          >
            ☰ List
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2">
          {sorted.map((ep) => {
            const isCurrent = ep === currentEpisode;
            return (
              <Link
                key={ep}
                href={`/watch/${showId}/${ep}?type=${translationType}`}
                className={`block text-center p-3 rounded-lg border transition-all duration-150 ${
                  isCurrent
                    ? 'border-accent-1 bg-accent-1/10 text-accent-1'
                    : 'border-border bg-bg-card hover:border-accent-1 hover:bg-bg-card-hover hover:-translate-y-0.5 text-text-primary'
                }`}
              >
                <div className="text-lg font-bold">{ep}</div>
                <div className="text-[10px] uppercase tracking-wider text-text-muted mt-0.5">Episode</div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {sorted.map((ep) => {
            const isCurrent = ep === currentEpisode;
            return (
              <Link
                key={ep}
                href={`/watch/${showId}/${ep}?type=${translationType}`}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-150 ${
                  isCurrent
                    ? 'border-accent-1 bg-accent-1/10'
                    : 'border-border bg-bg-card hover:border-accent-1 hover:bg-bg-card-hover'
                }`}
              >
                <span className={`font-bold text-sm min-w-[40px] ${isCurrent ? 'text-accent-1' : 'text-text-muted'}`}>
                  {ep}
                </span>
                <div className="flex-1">
                  <div className="text-sm font-medium">Episode {ep}</div>
                </div>
                <svg className={`w-4 h-4 transition-opacity ${isCurrent ? 'opacity-100 text-accent-1' : 'opacity-0 group-hover:opacity-100'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
