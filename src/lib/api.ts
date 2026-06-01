// ============================================================
// KaiStream - API Client
// ============================================================

import type {
  Show,
  ShowsResponse,
  Episode,
  EpisodesResponse,
  SourceItem,
  StreamsResponse,
  SearchResult,
  PopularResponse,
  CharactersResponse,
} from '@/types';

const API_BASE = '/api';

async function fetchJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Accept': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${body.slice(0, 200) || res.statusText}`);
  }
  return res.json();
}

// ============================================================
// SHOWS
// ============================================================

export interface ShowsParams {
  page?: number;
  limit?: number;
  translationType?: string;
  countryOrigin?: string;
  sortBy?: string;
  genres?: string;
  season?: string;
  year?: number;
  status?: string;
  type?: string;
  query?: string;
}

export async function fetchShows(params: ShowsParams = {}): Promise<ShowsResponse> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') qs.set(k, String(v));
  });
  return fetchJSON<ShowsResponse>(`/shows?${qs}`);
}

export async function fetchShow(id: string): Promise<Show> {
  return fetchJSON<Show>(`/shows/${encodeURIComponent(id)}`);
}

// ============================================================
// EPISODES
// ============================================================

export async function fetchEpisodes(
  showId: string,
  translationType = 'sub',
  episodeNumStart?: number,
  episodeNumEnd?: number
): Promise<EpisodesResponse> {
  const qs = new URLSearchParams({ translationType });
  if (episodeNumStart !== undefined) qs.set('episodeNumStart', String(episodeNumStart));
  if (episodeNumEnd !== undefined) qs.set('episodeNumEnd', String(episodeNumEnd));
  return fetchJSON<EpisodesResponse>(`/shows/${encodeURIComponent(showId)}/episodes?${qs}`);
}

export async function fetchEpisode(
  showId: string,
  episodeString: string,
  translationType = 'sub'
): Promise<Episode> {
  return fetchJSON<Episode>(
    `/shows/${encodeURIComponent(showId)}/episodes/${encodeURIComponent(episodeString)}?translationType=${translationType}`
  );
}

// ============================================================
// STREAMS / SOURCES
// ============================================================

export async function fetchStreams(
  showId: string,
  episodeString: string,
  translationType = 'sub'
): Promise<StreamsResponse> {
  return fetchJSON<StreamsResponse>(
    `/shows/${encodeURIComponent(showId)}/streams/${encodeURIComponent(episodeString)}?translationType=${translationType}`
  );
}

// ============================================================
// SEARCH
// ============================================================

export interface SearchParams {
  tr?: string;
  cty?: string;
  sortBy?: string;
  sortDirection?: string;
  page?: number;
  limit?: number;
}

export async function fetchSearch(query: string, params?: SearchParams): Promise<SearchResult> {
  const qs = new URLSearchParams({ q: query });
  if (params?.tr) qs.set('tr', params.tr);
  if (params?.cty) qs.set('cty', params.cty);
  if (params?.sortBy) qs.set('sortBy', params.sortBy);
  if (params?.sortDirection) qs.set('sortDirection', params.sortDirection);
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));

  return fetchJSON<SearchResult>(`/search?${qs}`);
}

// ============================================================
// POPULAR & RECOMMENDATIONS
// ============================================================

export async function fetchPopular(
  type = 'ANIME',
  size = 20
): Promise<PopularResponse> {
  return fetchJSON<PopularResponse>(`/popular?type=${type}&size=${size}`);
}

// ============================================================
// CHARACTERS
// ============================================================

export async function fetchShowCharacters(
  showId: string,
  limit = 30
): Promise<CharactersResponse> {
  return fetchJSON<CharactersResponse>(`/characters?showId=${encodeURIComponent(showId)}&limit=${limit}`);
}

