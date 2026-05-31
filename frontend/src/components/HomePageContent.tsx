'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { fetchShows, fetchPopular, fetchSearch } from '@/lib/api';
import ShowCard from '@/components/ShowCard';
import Pagination from '@/components/Pagination';
import type { Show, SearchCard } from '@/types';

const SHOWS_PER_PAGE = 20;

/** Normalize a search card (from fast search) to a Show-like shape for ShowCard */
function cardToShow(card: SearchCard): Show {
  return {
    _id: card._id,
    name: card.name,
    englishName: card.englishName,
    thumbnail: card.thumbnail,
    type: card.type,
    status: card.status,
    genres: card.genres,
    episodeCount: card.episodeCount || card.availableEpisodesDetail?.sub?.length,
    availableEpisodesDetail: card.availableEpisodesDetail,
    score: card.score != null && typeof card.score === 'number'
      ? { averageScore: card.score * 10 }
      : typeof card.score === 'object' && card.score !== null
        ? card.score as { averageScore?: number }
        : undefined,
  };
}

export default function HomePageContent() {
  const searchParams = useSearchParams();

  const [shows, setShows] = useState<Show[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [query, setQuery] = useState(searchParams?.get('q') || '');

  // Sync query from URL search params — handles client-side navigation
  useEffect(() => {
    const q = searchParams?.get('q') || '';
    if (q !== query) {
      setQuery(q);
      setPage(1);
    }
  }, [searchParams, query]);

  const [trendingShows, setTrendingShows] = useState<Show[]>([]);

  const loadShows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (query) {
        // Full search with filters — matches mkissa.to parameters
        const data = await fetchSearch(query, {
          tr: 'sub',
          cty: 'ALL',
          sortBy: 'Latest_Update',
          sortDirection: '-1',
          page,
          limit: SHOWS_PER_PAGE,
        });
        const results = (data.anyCards || [])
          .filter(c => c.format !== 'manga')
          .map(cardToShow);
        setShows(results);
        // Upstream API's pageInfo.total reflects total collection count, not filtered count.
        // Use hasNextPage to determine if more pages exist for pagination.
        const hasNext = data.pageInfo?.hasNextPage;
        setHasMore(!!hasNext);
        setTotal(results.length);
      } else {
        // Regular browse — simple trending sort, no genre filtering UI
        const data = await fetchShows({ page, limit: SHOWS_PER_PAGE, sortBy: 'Trending' });
        setShows(data.edges || []);
        const apiTotal = data.pageInfo?.total;
        if (apiTotal != null && apiTotal > 0) {
          setTotal(apiTotal);
        }
      }
    } catch (err: any) {
      setError(err.message);
      setShows([]);
    } finally {
      setLoading(false);
    }
  }, [page, query]);

  // Load initial data
  useEffect(() => {
    loadShows();
    fetchPopular('ANIME', 12).then((d) => {
      const cards = d.recommendations?.map((r: any) => r.anyCard).filter(Boolean) || [];
      setTrendingShows(cards.map(cardToShow));
    }).catch(() => {});
  }, []);

  // Re-load when page or query changes
  useEffect(() => {
    loadShows();
  }, [page, query]);

  return (
    <div className="py-8">
      {/* Hero / Trending section */}
      {!query && trendingShows.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-extrabold tracking-tight">Trending Now</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-6 px-6 snap-x snap-mandatory scrollbar-none">
            {trendingShows.slice(0, 10).map((show: Show) => (
              <div key={show._id} className="snap-start shrink-0 w-[160px]">
                <ShowCard show={show} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Title bar */}
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight">
          {query ? `Results for "${query}"` : 'Browse Anime'}
        </h1>
      </div>

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
          <h3 className="text-xl text-text-secondary font-semibold mb-2">Failed to load shows</h3>
          <p className="text-sm mb-4">{error}</p>
          <button onClick={loadShows} className="px-5 py-2.5 bg-gradient-to-r from-accent-1 to-accent-2 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-accent-glow/30 transition-all">
            Retry
          </button>
        </div>
      ) : shows.length === 0 ? (
        <div className="text-center py-20 text-text-muted">
          <div className="text-5xl mb-4">🎬</div>
          <h3 className="text-xl text-text-secondary font-semibold mb-2">No shows found</h3>
          <p className="text-sm">Try a different search term.</p>
        </div>
      ) : (
        <>
          <div className="text-xs text-text-muted mb-4">
            {query ? `Page ${page} · ${total} results` : `${total.toLocaleString()} shows found`}
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-5">
            {shows.map((show) => (
              <ShowCard key={show._id} show={show} />
            ))}
          </div>
          {query ? (
            hasMore || page > 1 ? (
              <Pagination
                current={page}
                total={hasMore ? page + 1 : page}
                onPage={setPage}
              />
            ) : null
          ) : (
            <Pagination
              current={page}
              total={Math.ceil(total / SHOWS_PER_PAGE)}
              onPage={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
