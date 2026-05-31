'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'kaistream_continue_watching';
const MAX_ITEMS = 20;

export interface ContinueWatchingItem {
  showId: string;
  showName: string;
  thumbnail: string;
  episode: string;
  translationType: string;
  timestamp: number;
}

function loadAll(): ContinueWatchingItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ContinueWatchingItem[];
  } catch {
    return [];
  }
}

function saveAll(items: ContinueWatchingItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // localStorage full or unavailable
  }
}

/**
 * Save (or update) a show's progress.  The item is moved to the front
 * of the list so the most recently watched shows appear first.
 */
export function saveProgress(
  showId: string,
  showName: string,
  thumbnail: string,
  episode: string,
  translationType: string,
) {
  const items = loadAll().filter((i) => i.showId !== showId);
  items.unshift({
    showId,
    showName,
    thumbnail,
    episode,
    translationType,
    timestamp: Date.now(),
  });
  // Keep only the most recent MAX_ITEMS
  saveAll(items.slice(0, MAX_ITEMS));
  notifyWatchingChanged();
}

/**
 * Remove a show from continue-watching (e.g., when it's completed).
 */
export function removeProgress(showId: string) {
  const items = loadAll().filter((i) => i.showId !== showId);
  saveAll(items);
}

/**
 * React hook that returns the current continue-watching list,
 * re-read from localStorage whenever the window fires a custom event.
 */
export function useContinueWatching() {
  const [items, setItems] = useState<ContinueWatchingItem[]>([]);

  const refresh = useCallback(() => {
    setItems(loadAll());
  }, []);

  useEffect(() => {
    refresh();
    // Listen for storage events (same-tab custom event & cross-tab)
    const handler = () => refresh();
    window.addEventListener('storage', handler);
    window.addEventListener('kaistream-continue-watching', handler);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('kaistream-continue-watching', handler);
    };
  }, [refresh]);

  return items;
}

/**
 * Notify other tabs/components that the list changed.
 */
export function notifyWatchingChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('kaistream-continue-watching'));
  }
}
