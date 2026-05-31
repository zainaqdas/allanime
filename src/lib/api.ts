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
  CategoriesResponse,
  GenresResponse,
  CharactersResponse,
  TagsResponse,
  MusicResponse,
  CommentsResponse,
  ReviewsResponse,
  WatchState,
  Manga,
  MangasResponse,
  Chapter,
  ChapterPages,
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
  sortOrder?: string;
  genres?: string;
  season?: string;
  year?: number;
  status?: string;
  type?: string;
  query?: string;
  allowAdult?: boolean;
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

export async function fetchShowsBatch(ids: string[]): Promise<Show[]> {
  return fetchJSON<Show[]>('/shows/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });
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

export async function fetchRecommendations(
  type = 'anime',
  size = 20,
  page = 1
): Promise<PopularResponse> {
  return fetchJSON<PopularResponse>(
    `/recommendations?type=${type}&size=${size}&page=${page}`
  );
}

export async function fetchRandomRecommendations(format = 'anime'): Promise<any> {
  return fetchJSON<any>(`/random-recommendations?format=${format}`);
}

// ============================================================
// CATEGORIES & GENRES
// ============================================================

export async function fetchCategories(): Promise<CategoriesResponse> {
  return fetchJSON<CategoriesResponse>('/categories');
}

export async function fetchGenres(): Promise<GenresResponse> {
  return fetchJSON<GenresResponse>('/genres');
}

// ============================================================
// CHARACTERS
// ============================================================

export async function fetchCharacters(
  name?: string,
  page = 1,
  limit = 20
): Promise<CharactersResponse> {
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (name) qs.set('name', name);
  return fetchJSON<CharactersResponse>(`/characters?${qs}`);
}

export async function fetchShowCharacters(
  showId: string,
  limit = 30
): Promise<CharactersResponse> {
  return fetchJSON<CharactersResponse>(`/characters?showId=${encodeURIComponent(showId)}&limit=${limit}`);
}

// ============================================================
// TAGS
// ============================================================

export async function fetchTags(
  name?: string,
  type?: string,
  page = 1,
  limit = 20
): Promise<TagsResponse> {
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (name) qs.set('name', name);
  if (type) qs.set('type', type);
  return fetchJSON<TagsResponse>(`/tags?${qs}`);
}

// ============================================================
// MUSIC
// ============================================================

export async function fetchMusic(
  page = 1,
  limit = 20,
  filters?: { name?: string; artist?: string; type?: string }
): Promise<MusicResponse> {
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (filters?.name) qs.set('name', filters.name);
  if (filters?.artist) qs.set('artist', filters.artist);
  if (filters?.type) qs.set('type', filters.type);
  return fetchJSON<MusicResponse>(`/music?${qs}`);
}

// ============================================================
// COMMENTS & REVIEWS
// ============================================================

export async function fetchComments(
  referenceId: string,
  page = 1,
  limit = 20
): Promise<CommentsResponse> {
  return fetchJSON<CommentsResponse>(
    `/comments?referenceId=${encodeURIComponent(referenceId)}&page=${page}&limit=${limit}`
  );
}

export async function fetchReviews(
  showId: string,
  page = 1,
  limit = 20
): Promise<ReviewsResponse> {
  return fetchJSON<ReviewsResponse>(
    `/reviews?showId=${encodeURIComponent(showId)}&page=${page}&limit=${limit}`
  );
}

// ============================================================
// WATCH STATE
// ============================================================

export async function fetchWatchState(showId: string): Promise<WatchState> {
  return fetchJSON<WatchState>(`/watch-state/${encodeURIComponent(showId)}`);
}

// ============================================================
// PLAYLISTS
// ============================================================

export async function fetchPlaylistShows(playlistId: string, page = 1, limit = 20): Promise<ShowsResponse> {
  return fetchJSON<ShowsResponse>(
    `/playlists/${encodeURIComponent(playlistId)}/shows?page=${page}&limit=${limit}`
  );
}

// ============================================================
// MANGA
// ============================================================

export interface MangasParams {
  page?: number;
  limit?: number;
  translationType?: string;
  countryOrigin?: string;
  sortBy?: string;
  sortOrder?: string;
  genres?: string;
  query?: string;
}

export async function fetchMangas(params: MangasParams = {}): Promise<MangasResponse> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') qs.set(k, String(v));
  });
  return fetchJSON<MangasResponse>(`/mangas?${qs}`);
}

export async function fetchManga(id: string): Promise<Manga> {
  return fetchJSON<Manga>(`/mangas/${encodeURIComponent(id)}`);
}

export async function fetchChapterPages(
  mangaId: string,
  chapterString: string,
  translationType = 'sub'
): Promise<ChapterPages | null> {
  return fetchJSON<ChapterPages | null>(
    `/chapters/pages?mangaId=${encodeURIComponent(mangaId)}&chapterString=${encodeURIComponent(chapterString)}&translationType=${translationType}`
  );
}

// ============================================================
// EMBED
// ============================================================

export async function fetchEmbedUrl(
  showId: string,
  episodeString: string,
  translationType = 'sub'
): Promise<{ embedUrl: string; watchUrl: string }> {
  const qs = new URLSearchParams({ showId, episodeString, translationType });
  return fetchJSON<{ embedUrl: string; watchUrl: string }>(`/embed?${qs}`);
}
