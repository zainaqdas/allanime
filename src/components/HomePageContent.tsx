'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { fetchShows, fetchMangas, fetchPopular, fetchSearch } from '@/lib/api';
import { useContinueWatching } from '@/lib/useContinueWatching';
import ShowCard from '@/components/ShowCard';
import type { Show, SearchCard, Manga } from '@/types';

const SHOWS_PER_PAGE = 20;

/** Normalize a search card to a Show-like shape for ShowCard */
function cardToShow(card: SearchCard): Show {
  const isManga = card.format === 'manga';
  return {
    _id: card._id,
    name: card.name,
    englishName: card.englishName,
    thumbnail: card.thumbnail,
    type: card.type,
    status: card.status,
    genres: card.genres,
    episodeCount: isManga
      ? (card.chapterCount || card.availableChaptersDetail?.sub?.length)
      : (card.episodeCount || card.availableEpisodesDetail?.sub?.length),
    availableEpisodesDetail: isManga
      ? (card.availableChaptersDetail as Record<string, string[]>)
      : card.availableEpisodesDetail,
    score: card.score != null && typeof card.score === 'number'
      ? { averageScore: card.score * 10 }
      : typeof card.score === 'object' && card.score !== null
        ? card.score as { averageScore?: number }
        : undefined,
  };
}

/** Normalize a Manga API object to a Show-like shape for ShowCard */
function mangaToShow(manga: Manga): Show {
  return {
    _id: manga._id,
    name: manga.name,
    englishName: manga.englishName,
    thumbnail: manga.thumbnail,
    type: manga.type,
    status: manga.status,
    genres: manga.genres,
    episodeCount: manga.chapterCount || manga.availableChaptersDetail?.sub?.length || 0,
    availableEpisodesDetail: manga.availableChaptersDetail as Record<string, string[]>,
    score: manga.score,
  };
}

export default function HomePageContent() {
  const searchParams = useSearchParams();

  const [shows, setShows] = useState<Show[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [query, setQuery] = useState(searchParams?.get('q') || '');
  const [tr, setTr] = useState('sub');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [sortBy, setSortBy] = useState('Trending');
  const [contentType, setContentType] = useState<'anime' | 'manga'>('anime');

  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);

  const animeGenres = [
    'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror',
    'Isekai', 'Magic', 'Mecha', 'Music', 'Mystery', 'Psychological',
    'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural',
    'Thriller', 'Shounen', 'Historical', 'Martial Arts', 'School', 'Military',
  ];

  const mangaGenres = [
    'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror',
    'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural',
    'Thriller', 'Mystery', 'Psychological',
    'Shounen', 'Shoujo', 'Seinen', 'Josei',
    'Historical', 'Martial Arts', 'School', 'Military',
    'Ecchi', 'Harem', 'Isekai',
  ];

  const genres = contentType === 'manga' ? mangaGenres : animeGenres;

  const sortOptions = [
    { value: 'Trending', label: 'Trending' },
    { value: 'Popular', label: 'Most Popular' },
    { value: 'Latest_Update', label: 'Latest Update' },
    { value: 'Name_ASC', label: 'Name A-Z' },
    { value: 'Name_DESC', label: 'Name Z-A' },
    { value: 'Score_ASC', label: 'Score (Low)' },
    { value: 'Score_DESC', label: 'Score (High)' },
  ];

  // Sync query from URL search params — handles client-side navigation
  useEffect(() => {
    const q = searchParams?.get('q') || '';
    if (q !== query) {
      setQuery(q);
      setPage(1);
    }
  }, [searchParams, query]);

  const continueWatching = useContinueWatching();
  const [trendingShows, setTrendingShows] = useState<Show[]>([]);

  const loadShows = useCallback(async (append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      if (query) {
        const data = await fetchSearch(query, {
          tr: contentType === 'anime' ? tr : undefined,
          cty: 'ALL',
          sortBy: 'Latest_Update',
          sortDirection: '-1',
          page,
          limit: SHOWS_PER_PAGE,
          format: contentType === 'manga' ? 'manga' : undefined,
        });
        const results = (data.anyCards || [])
          .filter(c => contentType === 'anime' ? c.format !== 'manga' : c.format === 'manga')
          .map(cardToShow);
        setShows(prev => append ? [...prev, ...results] : results);
        const hasNext = data.pageInfo?.hasNextPage;
        setHasMore(!!hasNext);
        if (!append) setTotal(results.length);
      } else if (contentType === 'manga') {
        const params: any = { page, limit: SHOWS_PER_PAGE, sortBy };
        if (selectedGenre) params.genres = selectedGenre;
        const data = await fetchMangas(params);
        const edges = (data.edges || []).map(mangaToShow);
        setShows(prev => append ? [...prev, ...edges] : edges);
        const apiTotal = data.pageInfo?.total;
        if (apiTotal != null && apiTotal > 0 && !append) {
          setTotal(apiTotal);
        }
        setHasMore(data.pageInfo?.hasNextPage ?? false);
      } else {
        const params: any = { page, limit: SHOWS_PER_PAGE, sortBy };
        if (selectedGenre) params.genres = selectedGenre;
        const data = await fetchShows(params);
        const edges = data.edges || [];
        setShows(prev => append ? [...prev, ...edges] : edges);
        const apiTotal = data.pageInfo?.total;
        if (apiTotal != null && apiTotal > 0 && !append) {
          setTotal(apiTotal);
        }
        setHasMore(data.pageInfo?.hasNextPage ?? false);
      }
    } catch (err: any) {
      if (!append) {
        setError(err.message);
        setShows([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      loadingMoreRef.current = false;
    }
  }, [page, query, tr, selectedGenre, sortBy, contentType]);

  // Load initial data and re-load when filters or content type change
  useEffect(() => {
    loadShows(false);
    const popularType = contentType === 'manga' ? 'MANGA' : 'ANIME';
    fetchPopular(popularType, 12).then((d) => {
      const cards = d.recommendations?.map((r: any) => r.anyCard).filter(Boolean) || [];
      setTrendingShows(cards.map(cardToShow));
    }).catch(() => {});
  }, [query, tr, selectedGenre, sortBy, contentType]);

  // Infinite scroll: observe sentinel and load next page
  // Uses loadingMoreRef to prevent duplicate page increments (IntersectionObserver
  // can fire multiple times before React re-renders with updated state).
  useEffect(() => {
    if (!hasMore || loading || loadingMore || shows.length === 0) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMoreRef.current && shows.length > 0) {
          loadingMoreRef.current = true;
          setPage(prev => prev + 1);
        }
      },
      { rootMargin: '400px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, shows.length]);

  // When page changes to a new page (not 1), append results
  useEffect(() => {
    if (page > 1) {
      loadShows(true);
    }
  }, [page]);

  return (
    <div className="py-8">
      {/* Content Type Toggle */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => { setContentType('anime'); setPage(1); setSelectedGenre(''); }}
          className={`px-5 py-2 text-sm font-bold rounded-xl transition-all duration-200 ${
            contentType === 'anime'
              ? 'bg-gradient-to-r from-accent-1 to-accent-2 text-white shadow-md shadow-accent-glow/30'
              : 'bg-bg-card border border-border text-text-muted hover:text-text-secondary hover:border-accent-1'
          }`}
        >
          🎬 Anime
        </button>
        <button
          onClick={() => { setContentType('manga'); setPage(1); setSelectedGenre(''); }}
          className={`px-5 py-2 text-sm font-bold rounded-xl transition-all duration-200 ${
            contentType === 'manga'
              ? 'bg-gradient-to-r from-accent-1 to-accent-2 text-white shadow-md shadow-accent-glow/30'
              : 'bg-bg-card border border-border text-text-muted hover:text-text-secondary hover:border-accent-1'
          }`}
        >
          📖 Manga
        </button>
      </div>

      {/* Continue Watching — only for anime */}
      {!query && contentType === 'anime' && continueWatching.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-extrabold tracking-tight">Continue Watching</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-6 px-6 snap-x snap-mandatory scrollbar-none">
            {continueWatching.slice(0, 8).map((item) => (
              <div key={item.showId} className="snap-start shrink-0 w-[160px] group">
                <Link
                  href={`/watch/${item.showId}/${item.episode}?type=${item.translationType}`}
                  className="block bg-bg-card rounded-xl overflow-hidden border border-border transition-all duration-200 hover:-translate-y-1 hover:border-accent-1 hover:shadow-lg hover:shadow-accent-glow/20"
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-bg-secondary">
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={item.showName}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-bg-card to-bg-card-hover">
                        <span className="text-4xl opacity-30">🎬</span>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-accent-1 text-white shadow-lg">
                      EP {item.episode}
                    </div>
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="text-xs text-white/80 font-medium truncate">{item.showName}</div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Hero / Trending section */}
      {!query && trendingShows.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-extrabold tracking-tight">
              {contentType === 'manga' ? 'Trending Manga' : 'Trending Now'}
            </h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-6 px-6 snap-x snap-mandatory scrollbar-none">
            {trendingShows.slice(0, 10).map((show: Show) => (
              <div key={show._id} className="snap-start shrink-0 w-[160px]">
                <ShowCard show={show} format={contentType} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Title bar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <h1 className="text-2xl font-extrabold tracking-tight">
          {query
            ? `Results for "${query}"`
            : contentType === 'manga' ? 'Browse Manga' : 'Browse Anime'}
        </h1>

        {query && contentType === 'anime' && (
          <div className="flex items-center gap-1.5 ml-auto bg-bg-card border border-border rounded-xl p-1">
            <button
              onClick={() => { setTr('sub'); setPage(1); }}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                tr === 'sub'
                  ? 'bg-accent-1 text-white shadow-sm'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              SUB
            </button>
            <button
              onClick={() => { setTr('dub'); setPage(1); }}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                tr === 'dub'
                  ? 'bg-accent-1 text-white shadow-sm'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              DUB
            </button>
          </div>
        )}
      </div>

      {/* Genre filter chips — only when browsing */}
      {!query && (
        <div className="mb-5 space-y-3">
          {/* Sort row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-text-muted font-medium uppercase tracking-wider">Sort:</span>
            <div className="flex gap-1.5 flex-wrap">
              {sortOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setSortBy(opt.value); setPage(1); }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    sortBy === opt.value
                      ? 'bg-gradient-to-r from-accent-1 to-accent-2 text-white shadow-sm'
                      : 'bg-bg-card border border-border text-text-muted hover:text-text-secondary hover:border-accent-1'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Genre row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-text-muted font-medium uppercase tracking-wider">Genre:</span>
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => { setSelectedGenre(''); setPage(1); }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  !selectedGenre
                    ? 'bg-gradient-to-r from-accent-1 to-accent-2 text-white shadow-sm'
                    : 'bg-bg-card border border-border text-text-muted hover:text-text-secondary hover:border-accent-1'
                }`}
              >
                All
              </button>
              {genres.map((g) => (
                <button
                  key={g}
                  onClick={() => { setSelectedGenre(selectedGenre === g ? '' : g); setPage(1); }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    selectedGenre === g
                      ? 'bg-gradient-to-r from-accent-1 to-accent-2 text-white shadow-sm'
                      : 'bg-bg-card border border-border text-text-muted hover:text-text-secondary hover:border-accent-1'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Shows grid */}
      {loading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-bg-card rounded-xl overflow-hidden border border-border">
              <div className="aspect-[3/4] skeleton" />
              <div className="p-3 space-y-2">
                <div className="h-4 skeleton w-4/5" />
                <div className="h-3 skeleton w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-20 text-text-muted">
          <div className="text-5xl mb-4">⚠️</div>
          <h3 className="text-xl text-text-secondary font-semibold mb-2">
            Failed to load {contentType === 'manga' ? 'manga' : 'shows'}
          </h3>
          <p className="text-sm mb-4">{error}</p>
          <button onClick={() => loadShows(false)} className="px-5 py-2.5 bg-gradient-to-r from-accent-1 to-accent-2 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-accent-glow/30 transition-all">
            Retry
          </button>
        </div>
      ) : shows.length === 0 ? (
        <div className="text-center py-20 text-text-muted">
          <div className={`text-5xl mb-4`}>{contentType === 'manga' ? '📖' : '🎬'}</div>
          <h3 className="text-xl text-text-secondary font-semibold mb-2">
            {contentType === 'manga' ? 'No manga found' : 'No shows found'}
          </h3>
          <p className="text-sm">Try a different search term.</p>
        </div>
      ) : (
        <>
          <div className="text-xs text-text-muted mb-4">
            {query
              ? `Page ${page} · ${total} results`
              : contentType === 'manga'
                ? `${total.toLocaleString()} manga found`
                : `${total.toLocaleString()} shows found`}
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-5">
            {shows.map((show) => (
              <ShowCard key={show._id} show={show} format={contentType} />
            ))}
          </div>
          {/* Infinite scroll sentinel + loading indicator */}
          <div ref={sentinelRef} className="h-4" />
          {loadingMore && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3 text-text-muted">
                <div className="spinner !w-5 !h-5 !border-2" />
                <span className="text-sm">Loading more…</span>
              </div>
            </div>
          )}
          {!hasMore && shows.length >= SHOWS_PER_PAGE && (
            <div className="text-center py-6 text-text-muted">
              <span className="text-sm">You've reached the end</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
