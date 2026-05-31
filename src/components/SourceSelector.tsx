'use client';

import type { SourceItem } from '@/types';

interface SourceSelectorProps {
  sources: SourceItem[];
  activeSource: SourceItem | null;
  onSelect: (source: SourceItem) => void;
}

export default function SourceSelector({ sources, activeSource, onSelect }: SourceSelectorProps) {
  // Filter to valid HTTP sources only
  const validSources = sources.filter((s) => s.sourceUrl?.startsWith('http'));

  if (validSources.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap px-4 py-3 bg-black/80 border-t border-white/5">
      <span className="text-xs text-text-muted shrink-0">Source:</span>
      <div className="flex gap-1.5 flex-wrap">
        {validSources.map((source, i) => {
          const isActive = activeSource?.sourceUrl === source.sourceUrl;
          const name = source.sourceName || source.sourceOriginalName || `Source ${i + 1}`;
          return (
            <button
              key={`${source.sourceUrl}-${i}`}
              onClick={() => onSelect(source)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 ${
                isActive
                  ? 'bg-gradient-to-r from-accent-1 to-accent-2 text-white shadow-md'
                  : 'bg-white/10 text-text-secondary hover:bg-white/20 hover:text-text-primary'
              }`}
            >
              {name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
