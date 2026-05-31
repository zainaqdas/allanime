'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Show } from '@/types';

interface ShowCardProps {
  show: Show;
  format?: 'anime' | 'manga';
}

export default function ShowCard({ show, format = 'anime' }: ShowCardProps) {
  const [imgError, setImgError] = useState(false);
  const isManga = format === 'manga';
  const thumb = show.thumbnail;
  const name = show.name || show.englishName || 'Unknown';
  const score = show.score?.averageScore != null ? (show.score.averageScore / 10).toFixed(1) : null;
  const epCount = show.availableEpisodesDetail?.sub?.length || show.episodeCount || 0;
  const statusMap: Record<string, string> = { '0': 'Finished', '1': 'Releasing', '2': 'Not yet aired', '3': 'Cancelled' };
  const status = show.status ? statusMap[show.status] || show.status : null;

  const detailLink = isManga ? `/manga/${show._id}` : `/show/${show._id}`;

  return (
    <Link
      href={detailLink}
      className="group block bg-bg-card rounded-xl overflow-hidden border border-border transition-all duration-200 hover:-translate-y-1 hover:border-accent-1 hover:shadow-lg hover:shadow-accent-glow/20"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-bg-secondary">
        {thumb && !imgError ? (
          <img
            src={thumb}
            alt={name}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-bg-card to-bg-card-hover">
            <span className="text-4xl opacity-30">{isManga ? '📖' : '🎬'}</span>
          </div>
        )}
        {status && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-gradient-to-r from-accent-1 to-accent-2 text-white shadow-lg">
            {status === 'Releasing' ? (isManga ? 'Ongoing' : 'Airing') : status}
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-semibold leading-tight line-clamp-2 mb-1">{name}</h3>
        <div className="flex items-center gap-2 text-xs text-text-muted">
          {score && <span className="text-warning font-semibold">★ {score}</span>}
          {show.type && <span>{show.type}</span>}
          {epCount > 0 && <span className="ml-auto">{epCount} {isManga ? 'ch' : 'ep'}</span>}
        </div>
      </div>
    </Link>
  );
}
