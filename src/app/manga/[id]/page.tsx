'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { fetchManga } from '@/lib/api';
import type { Manga } from '@/types';

export default function MangaDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [manga, setManga] = useState<Manga | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchManga(id)
      .then(setManga)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  // Derive chapter list from availableChaptersDetail on the manga object
  const detail = manga?.availableChaptersDetail || {};
  const chapterStrs = detail.sub || detail.dub || detail.raw || [];
  const chapters = chapterStrs.map((ch: string) => ({
    _id: `${manga?._id || ''}_ch_${ch}`,
    mangaId: manga?._id || '',
    chapterString: ch,
    notes: undefined as string | undefined,
    chapterAiredDateString: undefined as string | undefined,
  }));
  const chaptersReversed = [...chapters].reverse();

  if (loading) {
    return (
      <div className="py-12 space-y-8">
        <div className="h-[300px] skeleton rounded-2xl" />
        <div className="space-y-4">
          <div className="h-8 skeleton w-1/3" />
          <div className="h-4 skeleton w-2/3" />
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-16 skeleton rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !manga) {
    return (
      <div className="text-center py-20 text-text-muted">
        <div className="text-5xl mb-4">📕</div>
        <h3 className="text-xl text-text-secondary font-semibold mb-2">Failed to load manga</h3>
        <p className="text-sm mb-4">{error || 'Manga not found'}</p>
        <Link href="/" className="px-5 py-2.5 bg-gradient-to-r from-accent-1 to-accent-2 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-accent-glow/30 transition-all">
          Back to Browse
        </Link>
      </div>
    );
  }

  const name = manga.name || manga.englishName || 'Unknown';
  const altName = manga.englishName && manga.englishName !== name ? manga.englishName : null;

  return (
    <div className="py-6">
      {/* Hero header */}
      <div className="relative -mx-6 px-6 pt-28 pb-8 mb-8 min-h-[280px] flex items-end">
        {manga.thumbnail && (
          <div className="absolute inset-0 overflow-hidden">
            <img
              src={manga.thumbnail}
              alt=""
              className="w-full h-full object-cover blur-[40px] brightness-[0.3] scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/60 to-transparent" />
          </div>
        )}
        {!manga.thumbnail && <div className="absolute inset-0 bg-gradient-to-b from-bg-card to-bg-primary" />}

        <div className="relative flex gap-7 items-end z-10">
          {/* Thumbnail */}
          <div className="w-[180px] min-w-[180px] aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl shrink-0">
            {manga.thumbnail ? (
              <img src={manga.thumbnail} alt={name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-bg-card to-bg-card-hover flex items-center justify-center text-5xl text-text-muted">
                📕
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 pb-2">
            <h1 className="text-3xl font-extrabold tracking-tight leading-tight mb-1">{name}</h1>
            {altName && <p className="text-text-muted text-sm mb-3">{altName}</p>}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {(manga.chapterCount ?? 0) > 0 && (
                <span className="px-3 py-1 bg-accent-1/15 text-accent-1 text-xs font-semibold rounded-full">
                  {manga.chapterCount} chapters
                </span>
              )}
              {manga.status && (
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  manga.status === '1' ? 'bg-success/15 text-success' : 'bg-white/10 text-text-secondary'
                }`}>
                  {manga.status === '0' ? 'Completed' : manga.status === '1' ? 'Releasing' : 'Unknown'}
                </span>
              )}
              {manga.type && (
                <span className="px-3 py-1 bg-white/10 text-text-secondary text-xs rounded-full">{manga.type}</span>
              )}
              {manga.authors && manga.authors.length > 0 && (
                <span className="px-3 py-1 bg-white/10 text-text-secondary text-xs rounded-full">
                  {manga.authors.join(', ')}
                </span>
              )}
            </div>
            {manga.description && (
              <p className="text-text-secondary text-sm leading-relaxed max-w-[700px] line-clamp-3">{manga.description}</p>
            )}
            {manga.genres && manga.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {manga.genres.map((g) => (
                  <span key={g} className="px-3 py-1 text-[11px] font-medium text-text-secondary border border-border rounded-full hover:border-accent-1 hover:text-text-primary transition-colors cursor-pointer">
                    {g}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chapters list */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold tracking-tight">
          Chapters
          <span className="text-text-muted text-sm font-normal ml-2">({chapters.length})</span>
        </h2>
        {chaptersReversed.length > 0 && (
          <Link
            href={`/read/${manga._id}/${chaptersReversed[0].chapterString}`}
            className="px-5 py-2 bg-gradient-to-r from-accent-1 to-accent-2 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-accent-glow/30 transition-all"
          >
            ▶ Read Latest
          </Link>
        )}
      </div>

      {chaptersReversed.length === 0 ? (
        <div className="text-center py-12 text-text-muted">
          <p className="text-sm">No chapters available yet.</p>
        </div>
      ) : (
        <div className="grid gap-1.5">
          {chaptersReversed.map((ch, i) => (
            <Link
              key={ch._id}
              href={`/read/${manga._id}/${ch.chapterString}`}
              className="flex items-center justify-between px-4 py-3 bg-bg-card border border-border rounded-xl hover:border-accent-1 hover:bg-bg-card-hover transition-all group"
            >
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-accent-1 min-w-[28px]">
                  #{chaptersReversed.length - i}
                </span>
                <div>
                  <span className="text-sm font-medium text-text-primary">
                    Ch. {ch.chapterString}
                  </span>
                  {ch.notes && (
                    <span className="text-xs text-text-muted ml-3">{ch.notes}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-text-muted">
                {ch.chapterAiredDateString && (
                  <span>{ch.chapterAiredDateString}</span>
                )}
                <span className="text-accent-1 group-hover:translate-x-0.5 transition-transform">→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
