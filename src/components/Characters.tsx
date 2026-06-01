'use client';

import { useState, useEffect } from 'react';
import { fetchShowCharacters } from '@/lib/api';
import type { Character } from '@/types';

interface Props {
  showId: string;
}

export default function Characters({ showId }: Props) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!showId) return;
    setLoading(true);
    fetchShowCharacters(showId)
      .then((res) => setCharacters(res.edges || []))
      .catch((err) => {
        // Characters endpoint may not be available for all shows
        if (err.message?.includes('404') || err.message?.includes('not found')) {
          setCharacters([]);
        } else {
          console.error('Characters fetch error:', err);
        }
      })
      .finally(() => setLoading(false));
  }, [showId]);

  if (loading) {
    return (
      <div className="mb-10">
        <h2 className="text-xl font-bold tracking-tight mb-4">Characters</h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-[140px] shrink-0 space-y-2">
              <div className="w-[140px] h-[180px] skeleton rounded-xl" />
              <div className="h-3 skeleton w-3/4 mx-auto rounded" />
              <div className="h-2 skeleton w-1/2 mx-auto rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (characters.length === 0) {
    return null;
  }

  return (
    <div className="mb-10">
      <h2 className="text-xl font-bold tracking-tight mb-4">
        Characters
        <span className="text-text-muted text-sm font-normal ml-2">({characters.length})</span>
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {characters.map((char) => {
          const va = char.relatedRoles?.[0]?.voiceActors?.[0];
          return (
            <div
              key={char._id}
              className="w-[140px] shrink-0 group cursor-pointer"
            >
              {/* Character image */}
              <div className="w-[140px] h-[180px] rounded-xl overflow-hidden bg-bg-card border border-border group-hover:border-accent-1/50 transition-all duration-200">
                {char.image ? (
                  <img
                    src={char.image}
                    alt={char.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl text-text-muted bg-gradient-to-br from-bg-card to-bg-card-hover">
                    🎭
                  </div>
                )}
              </div>
              {/* Character name */}
              <p className="text-xs font-semibold text-text-primary text-center mt-2 leading-tight line-clamp-2">
                {char.name}
              </p>
              {/* Voice actor */}
              {va && (
                <div className="flex items-center justify-center gap-1 mt-1">
                  {va.staff.image && (
                    <img
                      src={va.staff.image}
                      alt={va.staff.name}
                      className="w-4 h-4 rounded-full object-cover shrink-0"
                      loading="lazy"
                    />
                  )}
                  <span className="text-[10px] text-text-muted truncate max-w-[110px]">
                    {va.staff.name}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
