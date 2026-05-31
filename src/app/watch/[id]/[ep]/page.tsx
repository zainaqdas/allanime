'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchShow, fetchStreams } from '@/lib/api';
import { saveProgress } from '@/lib/useContinueWatching';
import VideoPlayer from '@/components/VideoPlayer';
import SourceSelector from '@/components/SourceSelector';
import EpisodeGrid from '@/components/EpisodeGrid';
import type { SourceItem, Show } from '@/types';

export default function WatchPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const showId = params?.id as string;
  const episode = params?.ep as string;
  const translationType = searchParams?.get('type') || 'sub';

  const [show, setShow] = useState<Show | null>(null);
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [activeSource, setActiveSource] = useState<SourceItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);

  // Determine source types for the selector
  const getValidSources = useCallback((srcs: SourceItem[]) => {
    return srcs.filter((s) => {
      const url = s.sourceUrl || '';
      // Exclude the external website fallbacks (allanime embed, mkissa.to)
      if (url.includes('allanime.day') || url.includes('mkissa.to')) return false;
      return url.startsWith('http');
    });
  }, []);

  // Auto-select best source
  const autoSelectSource = useCallback((validSources: SourceItem[]) => {
    // Prefer stable iframe embed sources (mp4upload, ok.ru, etc.) — these are most reliable
    const iframeSource = validSources.find(
      (s) => s.sourceUrl?.includes('mp4upload') || s.sourceUrl?.includes('ok.ru') || s.sourceUrl?.includes('allanime.uns.bio') || s.sourceUrl?.includes('bysekoze.com')
    );
    if (iframeSource) return iframeSource;

    // Fallback to direct video sources (Yt-mp4, .mp4, .m3u8) — these often have expiring auth tokens
    const videoSource = validSources.find(
      (s) => s.sourceName === 'Yt-mp4' || s.sourceUrl?.includes('tools.fast4speed') || s.sourceUrl?.includes('.mp4') || s.sourceUrl?.includes('.m3u8')
    );
    if (videoSource) return videoSource;

    // Last resort: first valid source
    return validSources[0] || null;
  }, []);

  // Load data
  useEffect(() => {
    if (!showId || !episode) return;

    setLoading(true);
    setError(null);

    Promise.all([
      fetchShow(showId).catch(() => null),
      fetchStreams(showId, episode, translationType).catch((err) => {
        throw err;
      }),
    ])
      .then(([showData, streamsData]) => {
        if (showData) setShow(showData);
        const allSources = streamsData.sources || [];

        // Filter out external website fallbacks
        const validSources = getValidSources(allSources);
        setSources(validSources);

        if (validSources.length > 0) {
          const selected = autoSelectSource(validSources);
          setActiveSource(selected);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [showId, episode, translationType, getValidSources, autoSelectSource]);

  const handleSourceChange = useCallback((source: SourceItem) => {
    setActiveSource(source);
  }, []);

  const episodes = show?.availableEpisodesDetail?.[translationType] || [];
  const currentEpIndex = episodes.indexOf(episode);
  const prevEp = currentEpIndex > 0 ? episodes[currentEpIndex - 1] : null;
  const nextEp = currentEpIndex >= 0 && currentEpIndex < episodes.length - 1 ? episodes[currentEpIndex + 1] : null;
  const showName = show?.name || show?.englishName || 'Loading...';

  // Save progress when episode/show data is loaded
  useEffect(() => {
    if (show && showName !== 'Loading...') {
      saveProgress(
        showId,
        showName,
        show.thumbnail || '',
        episode,
        translationType,
      );
    }
  }, [show, showId, episode, translationType, showName]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger when typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case 'ArrowLeft':
          if (prevEp) {
            e.preventDefault();
            router.push(`/watch/${showId}/${prevEp}?type=${translationType}`);
          }
          break;
        case 'ArrowRight':
          if (nextEp) {
            e.preventDefault();
            router.push(`/watch/${showId}/${nextEp}?type=${translationType}`);
          }
          break;
        case 'Escape':
          if (showSidebar) {
            e.preventDefault();
            setShowSidebar(false);
          }
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          try { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); } catch {}
          break;
        case 'm':
        case 'M':
          // Try to find and mute the video element
          const video = document.querySelector('video');
          if (video) {
            video.muted = !video.muted;
          }
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prevEp, nextEp, showId, translationType, showSidebar, router]);

  const handleVideoError = useCallback(() => {
    // Try next source if video fails
    const currentIndex = sources.findIndex((s) => s.sourceUrl === activeSource?.sourceUrl);
    if (currentIndex >= 0 && currentIndex < sources.length - 1) {
      setActiveSource(sources[currentIndex + 1]);
    }
  }, [sources, activeSource]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center gap-4 text-text-muted">
          <div className="spinner" />
          <span className="text-sm">Loading stream...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center text-text-muted max-w-md">
          <div className="text-5xl mb-4">⚠️</div>
          <h3 className="text-xl text-text-secondary font-semibold mb-2">Failed to load stream</h3>
          <p className="text-sm mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-gradient-to-r from-accent-1 to-accent-2 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-accent-glow/30 transition-all"
            >
              Retry
            </button>
            {showId && (
              <Link
                href={`/show/${showId}`}
                className="px-5 py-2.5 border border-border text-text-secondary text-sm font-semibold rounded-xl hover:text-text-primary hover:border-accent-1 transition-all"
              >
                Back to Show
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)] bg-black">
      {/* Top navigation bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <Link
            href={`/show/${showId}`}
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate max-w-[300px]">{showName}</div>
            <div className="text-xs text-text-muted">Episode {episode} • {translationType.toUpperCase()}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {prevEp && (
            <Link
              href={`/watch/${showId}/${prevEp}?type=${translationType}`}
              className="px-3 py-1.5 text-xs font-medium bg-white/10 text-text-secondary hover:text-text-primary hover:bg-white/20 rounded-lg transition-all"
            >
              ◀ Prev
            </Link>
          )}
          {nextEp && (
            <Link
              href={`/watch/${showId}/${nextEp}?type=${translationType}`}
              className="px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-accent-1 to-accent-2 text-white rounded-lg hover:shadow-lg hover:shadow-accent-glow/30 transition-all"
            >
              Next ▶
            </Link>
          )}
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="px-3 py-1.5 text-xs font-medium bg-white/10 text-text-secondary hover:text-text-primary hover:bg-white/20 rounded-lg transition-all"
          >
            ☰ Episodes
          </button>
        </div>
      </div>

      {/* Player area */}
      <div className="flex-1 relative">
        {activeSource ? (
          <div className="absolute inset-0 flex flex-col">
            <div className="flex-1 relative">
              <VideoPlayer
                key={activeSource.sourceUrl}
                source={activeSource}
                onError={handleVideoError}
              />
            </div>
            {/* Source selector bar */}
            {sources.length > 1 && (
              <SourceSelector
                sources={sources}
                activeSource={activeSource}
                onSelect={handleSourceChange}
              />
            )}
          </div>
        ) : sources.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-text-muted">
              <div className="text-5xl mb-4">🔗</div>
              <h3 className="text-lg text-text-secondary font-semibold mb-2">No stream sources available</h3>
              <p className="text-sm">No embeddable sources found for this episode.</p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Sidebar overlay */}
      {showSidebar && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowSidebar(false)} />
          <div className="fixed right-0 top-0 bottom-0 w-[360px] max-w-[90vw] bg-bg-secondary border-l border-border z-50 p-5 overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Episodes</h3>
              <button onClick={() => setShowSidebar(false)} className="text-text-muted hover:text-text-primary transition-colors">
                ✕
              </button>
            </div>
            <div className="flex flex-col gap-1">
              {episodes.map((ep: string) => {
                const isCurrent = ep === episode;
                return (
                  <Link
                    key={ep}
                    href={`/watch/${showId}/${ep}?type=${translationType}`}
                    onClick={() => setShowSidebar(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                      isCurrent
                        ? 'bg-accent-1/15 text-accent-1 font-semibold'
                        : 'text-text-secondary hover:bg-bg-card hover:text-text-primary'
                    }`}
                  >
                    <span className={`min-w-[24px] font-bold text-xs ${isCurrent ? 'text-accent-1' : 'text-text-muted'}`}>
                      {ep.padStart(2, '0')}
                    </span>
                    <span>Episode {ep}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
