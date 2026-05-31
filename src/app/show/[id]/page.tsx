'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { fetchShow } from '@/lib/api';
import EpisodeGrid from '@/components/EpisodeGrid';
import type { Show } from '@/types';

export default function ShowDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [show, setShow] = useState<Show | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [translationType, setTranslationType] = useState('sub');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchShow(id)
      .then(setShow)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  // Season display logic
  const getSeasonDisplay = () => {
    if (!show?.season) return '';
    if (typeof show.season === 'object' && 'quarter' in show.season) {
      const q = (show.season as any).quarter;
      return q.charAt(0).toUpperCase() + q.slice(1).toLowerCase();
    }
    if (typeof show.season === 'number') {
      return ['', 'Winter', 'Spring', 'Summer', 'Fall'][show.season] || '';
    }
    if (typeof show.season === 'string') {
      return show.season.charAt(0).toUpperCase() + show.season.slice(1).toLowerCase();
    }
    return '';
  };

  const score = show?.score?.averageScore != null ? (show.score.averageScore / 10).toFixed(1) : null;
  const statusMap: Record<string, { label: string; color: string }> = {
    '0': { label: 'Finished', color: 'text-success' },
    '1': { label: 'Releasing', color: 'text-accent-1' },
    '2': { label: 'Not yet aired', color: 'text-warning' },
    '3': { label: 'Cancelled', color: 'text-danger' },
  };
  const status = show?.status ? statusMap[show.status] : null;
  const epCount = show?.availableEpisodesDetail?.[translationType]?.length || show?.episodeCount || 0;

  if (loading) {
    return (
      <div className="py-12 space-y-8">
        <div className="h-[300px] skeleton rounded-2xl" />
        <div className="space-y-4">
          <div className="h-8 skeleton w-1/3" />
          <div className="h-4 skeleton w-2/3" />
          <div className="flex gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-6 skeleton w-16 rounded-full" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="h-16 skeleton rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !show) {
    return (
      <div className="text-center py-20 text-text-muted">
        <div className="text-5xl mb-4">⚠️</div>
        <h3 className="text-xl text-text-secondary font-semibold mb-2">Failed to load show</h3>
        <p className="text-sm mb-4">{error || 'Show not found'}</p>
        <Link href="/" className="px-5 py-2.5 bg-gradient-to-r from-accent-1 to-accent-2 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-accent-glow/30 transition-all">
          Back to Browse
        </Link>
      </div>
    );
  }

  const name = show.name || show.englishName || 'Unknown';
  const altName = show.englishName && show.englishName !== name ? show.englishName : null;
  const eps = show.availableEpisodesDetail?.[translationType] || [];
  const latestEp = eps[eps.length - 1] || '1';

  return (
    <div className="py-6">
      {/* Hero header with blur background */}
      <div className="relative -mx-6 px-6 pt-28 pb-8 mb-8 min-h-[320px] flex items-end">
        {show.thumbnail && (
          <div className="absolute inset-0 overflow-hidden">
            <img
              src={show.thumbnail}
              alt=""
              className="w-full h-full object-cover blur-[40px] brightness-[0.3] scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/60 to-transparent" />
          </div>
        )}
        {!show.thumbnail && <div className="absolute inset-0 bg-gradient-to-b from-bg-card to-bg-primary" />}

        <div className="relative flex gap-7 items-end z-10">
          {/* Poster */}
          <div className="w-[200px] min-w-[200px] aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl shrink-0">
            {show.thumbnail ? (
              <img src={show.thumbnail} alt={name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-bg-card to-bg-card-hover flex items-center justify-center text-5xl text-text-muted">
                🎬
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 pb-2">
            <h1 className="text-3xl font-extrabold tracking-tight leading-tight mb-1">{name}</h1>
            {altName && <p className="text-text-muted text-sm mb-3">{altName}</p>}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {score && (
                <span className="px-3 py-1 bg-warning/15 text-warning text-xs font-semibold rounded-full">★ {score}</span>
              )}
              {show.type && (
                <span className="px-3 py-1 bg-white/10 text-text-secondary text-xs rounded-full">{show.type}</span>
              )}
              {getSeasonDisplay() && (
                <span className="px-3 py-1 bg-white/10 text-text-secondary text-xs rounded-full">{getSeasonDisplay()}</span>
              )}
              {show.year && (
                <span className="px-3 py-1 bg-white/10 text-text-secondary text-xs rounded-full">{show.year}</span>
              )}
              {status && (
                <span className={`px-3 py-1 ${status.color}/15 ${status.color} text-xs font-semibold rounded-full`}>{status.label}</span>
              )}
              {epCount > 0 && (
                <span className="px-3 py-1 bg-white/10 text-text-secondary text-xs rounded-full">{epCount} episodes</span>
              )}
            </div>
            {show.description && (
              <p className="text-text-secondary text-sm leading-relaxed max-w-[700px] line-clamp-3">{show.description}</p>
            )}
            {show.genres && show.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {show.genres.map((g) => (
                  <span key={g} className="px-3 py-1 text-[11px] font-medium text-text-secondary border border-border rounded-full hover:border-accent-1 hover:text-text-primary transition-colors cursor-pointer">
                    {g}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Episodes section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold tracking-tight">Episodes</h2>
        <Link
          href={`/watch/${show._id}/${latestEp}?type=${translationType}`}
          className="px-5 py-2 bg-gradient-to-r from-accent-1 to-accent-2 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-accent-glow/30 transition-all"
        >
          ▶ Watch Latest
        </Link>
      </div>

      {/* Translation type filters */}
      <div className="flex gap-3 mb-5">
        {['sub', 'dub', 'raw'].map((t) => (
          <button
            key={t}
            onClick={() => setTranslationType(t)}
            className={`px-4 py-2 text-xs font-medium rounded-xl border transition-all ${
              translationType === t
                ? 'bg-gradient-to-r from-accent-1 to-accent-2 border-transparent text-white'
                : 'border-border text-text-secondary hover:border-accent-1 hover:text-text-primary bg-transparent'
            }`}
          >
            {t === 'sub' ? 'Sub' : t === 'dub' ? 'Dub' : 'Raw'}
          </button>
        ))}
      </div>

      {/* Episode grid */}
      <EpisodeGrid
        episodes={eps}
        showId={show._id}
        translationType={translationType}
      />
    </div>
  );
}
