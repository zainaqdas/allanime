'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import type { SourceItem } from '@/types';

interface VideoPlayerProps {
  source: SourceItem;
  onError?: () => void;
}

export default function VideoPlayer({ source, onError }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const url = source.sourceUrl;
  const isHls = url.includes('.m3u8');
  const isYtMp4 = source.sourceName === 'Yt-mp4' || url.includes('tools.fast4speed');
  const isIframe = url.includes('mp4upload.com') || url.includes('ok.ru') || 
                   url.includes('allanime.uns.bio') || url.includes('bysekoze.com');

  const cleanup = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.removeAttribute('src');
      videoRef.current.load();
    }
  }, []);

  useEffect(() => {
    cleanup();
    setIsLoading(true);
    setHasError(false);

    if (!url) return;

    if (isIframe) {
      setIsLoading(false);
      return;
    }

    if (isHls) {
      // HLS.js playback via dynamic import
      import('hls.js').then((HlsModule) => {
        const HlsClass = HlsModule.default || HlsModule;
        if (videoRef.current && HlsClass.isSupported()) {
          const hls = new HlsClass();
          hlsRef.current = hls;
          hls.loadSource(url);
          hls.attachMedia(videoRef.current);
          hls.on(HlsClass.Events.MANIFEST_PARSED, () => {
            setIsLoading(false);
            videoRef.current?.play().catch(() => {});
          });
          hls.on(HlsClass.Events.ERROR, (_event: any, data: any) => {
            if (data.fatal) {
              setHasError(true);
              onError?.();
            }
          });
        } else {
          // Fallback: try native HLS support (Safari)
          videoRef.current!.src = url;
          setIsLoading(false);
        }
      }).catch(() => {
        // HLS.js failed to load, try direct
        if (videoRef.current) {
          videoRef.current.src = url;
        }
        setIsLoading(false);
      });
    } else if (videoRef.current) {
      // Direct video source
      videoRef.current.src = url;
      videoRef.current.addEventListener('loadeddata', () => setIsLoading(false), { once: true });
      videoRef.current.addEventListener('error', () => {
        setHasError(true);
        onError?.();
      }, { once: true });
    }

    return cleanup;
  }, [url, cleanup, onError, isHls, isIframe]);

  if (isIframe) {
    return (
      <iframe
        src={url}
        allow="fullscreen; autoplay; encrypted-media"
        className="w-full h-full border-none bg-black"
      />
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full bg-black flex items-center justify-center">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-3 text-text-muted">
            <div className="spinner" />
            <span className="text-sm">Loading stream...</span>
          </div>
        </div>
      )}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center text-text-muted">
            <div className="text-4xl mb-3">⚠️</div>
            <p className="text-sm">Failed to load video</p>
          </div>
        </div>
      )}
      <video
        ref={videoRef}
        controls
        autoPlay
        playsInline
        className="w-full h-full object-contain"
        style={{ visibility: isLoading ? 'hidden' : 'visible' }}
      />
    </div>
  );
}
