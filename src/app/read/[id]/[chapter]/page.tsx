'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { fetchManga, fetchChapterPages } from '@/lib/api';
import type { Manga, ChapterPages as ChapterPagesType } from '@/types';

export default function ReaderPage() {
  const params = useParams();
  const id = params?.id as string;
  const chapterStr = params?.chapter as string;

  const [manga, setManga] = useState<Manga | null>(null);
  const [pages, setPages] = useState<ChapterPagesType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!id || !chapterStr) return;
    setLoading(true);
    setError(null);
    setPages(null);

    fetchManga(id)
      .then((m) => {
        setManga(m);
        // Fetch pages using mangaId + chapterString
        return fetchChapterPages(id, chapterStr).catch((err) => {
          console.warn('Failed to fetch chapter pages:', err);
          return null;
        });
      })
      .then((p) => {
        if (p) setPages(p);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, chapterStr]);

  // Derive chapter list from availableChaptersDetail on the manga object
  const detail = manga?.availableChaptersDetail || {};
  const chapterStrs = detail.sub || detail.dub || detail.raw || [];
  const chapters = chapterStrs.map((ch: string) => ({
    _id: `${manga?._id || ''}_ch_${ch}`,
    mangaId: manga?._id || '',
    chapterString: ch,
    notes: undefined as string | undefined,
  }));

  // Build picture URLs
  const pictureUrls = pages?.pictureUrls || [];
  const pictureHead = pages?.pictureUrlHead || '';
  const fullPageUrls = pictureUrls.map(url => {
    if (url.startsWith('http')) return url;
    return pictureHead ? `${pictureHead}${url}` : url;
  });

  // Navigation: find prev/next chapter
  const sortedChapters = [...chapters].sort((a, b) => {
    const numA = parseFloat(a.chapterString);
    const numB = parseFloat(b.chapterString);
    return numA - numB;
  });
  const currentIdx = sortedChapters.findIndex(c => c.chapterString === chapterStr);
  const prevChapter = currentIdx > 0 ? sortedChapters[currentIdx - 1] : null;
  const nextChapter = currentIdx < sortedChapters.length - 1 ? sortedChapters[currentIdx + 1] : null;

  if (loading) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-[800px] mx-auto space-y-4">
          <div className="h-6 skeleton w-1/3 mx-auto rounded" />
          <div className="h-[600px] skeleton rounded-xl" />
          <div className="h-[600px] skeleton rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !pages) {
    return (
      <div className="text-center py-20 text-text-muted">
        <div className="text-5xl mb-4">📖</div>
        <h3 className="text-xl text-text-secondary font-semibold mb-2">Failed to load chapter</h3>
        <p className="text-sm mb-4">{error || 'Chapter pages not found'}</p>
        <Link href={id ? `/manga/${id}` : '/'} className="px-5 py-2.5 bg-gradient-to-r from-accent-1 to-accent-2 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-accent-glow/30 transition-all">
          Back to Manga
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <div className="sticky top-0 z-40 glass px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={id ? `/manga/${id}` : '/'}
            className="text-text-muted hover:text-text-primary transition-colors shrink-0"
            title="Back to manga"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5L7 10l5 5" />
            </svg>
          </Link>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">
              {manga?.name || 'Manga'}
            </p>
            <p className="text-xs text-text-muted">Ch. {chapterStr}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {prevChapter && (
            <Link
              href={`/read/${id}/${prevChapter.chapterString}`}
              className="px-3 py-1.5 text-xs font-medium bg-bg-card border border-border rounded-lg hover:border-accent-1 hover:text-text-primary transition-all"
            >
              ← Prev
            </Link>
          )}
          {nextChapter && (
            <Link
              href={`/read/${id}/${nextChapter.chapterString}`}
              className="px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-accent-1 to-accent-2 text-white rounded-lg hover:shadow-lg hover:shadow-accent-glow/30 transition-all"
            >
              Next →
            </Link>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-text-muted hover:text-text-primary transition-colors"
            title="Chapter list"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Chapter pages */}
      <div className="max-w-[900px] mx-auto px-4 py-6">
        {fullPageUrls.length === 0 ? (
          <div className="text-center py-20 text-text-muted">
            <p className="text-sm">No pages available for this chapter.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {fullPageUrls.map((url, i) => (
              <div
                key={i}
                className="bg-bg-card rounded-xl overflow-hidden border border-border"
              >
                <img
                  src={url}
                  alt={`Page ${i + 1}`}
                  className="w-full h-auto"
                  loading={i < 3 ? 'eager' : 'lazy'}
                />
              </div>
            ))}
          </div>
        )}

        {/* Bottom navigation */}
        {fullPageUrls.length > 0 && (
          <div className="flex items-center justify-center gap-3 py-8">
            {prevChapter ? (
              <Link
                href={`/read/${id}/${prevChapter.chapterString}`}
                className="px-5 py-2.5 bg-bg-card border border-border rounded-xl text-sm font-medium hover:border-accent-1 hover:text-text-primary transition-all"
              >
                ← Previous Chapter
              </Link>
            ) : (
              <span className="px-5 py-2.5 text-sm text-text-muted opacity-50">← Previous Chapter</span>
            )}
            {nextChapter ? (
              <Link
                href={`/read/${id}/${nextChapter.chapterString}`}
                className="px-5 py-2.5 bg-gradient-to-r from-accent-1 to-accent-2 text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-accent-glow/30 transition-all"
              >
                Next Chapter →
              </Link>
            ) : (
              <span className="px-5 py-2.5 text-sm text-text-muted opacity-50">Next Chapter →</span>
            )}
          </div>
        )}
      </div>

      {/* Chapter sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="relative ml-auto w-[320px] max-w-[85vw] h-full bg-bg-secondary border-l border-border overflow-y-auto">
            <div className="sticky top-0 bg-bg-secondary border-b border-border px-4 py-3 flex items-center justify-between z-10">
              <h3 className="text-sm font-bold">Chapters</h3>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-text-muted hover:text-text-primary transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="p-2">
              {sortedChapters.map((ch) => (
                <Link
                  key={ch._id}
                  href={`/read/${id}/${ch.chapterString}`}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                    ch.chapterString === chapterStr
                      ? 'bg-accent-1/15 text-accent-1 font-semibold'
                      : 'text-text-secondary hover:bg-bg-card hover:text-text-primary'
                  }`}
                >
                  <span className="min-w-[24px] text-center text-xs font-medium opacity-60">
                    #{sortedChapters.indexOf(ch) + 1}
                  </span>
                  <span>Ch. {ch.chapterString}</span>
                  {ch.notes && <span className="text-xs text-text-muted ml-auto">{ch.notes}</span>}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
