import { NextResponse } from 'next/server';
import * as api from '../../../lib/api-server.js';
import { TTL } from '../../../lib/cache.js';

// ============================================================
// Route dispatcher — maps URL path patterns to API functions
// ============================================================

/**
 * Parse query params from the request URL into a plain object.
 */
function getQuery(request) {
  const { searchParams } = new URL(request.url);
  const params = {};
  for (const [key, value] of searchParams.entries()) {
    params[key] = value;
  }
  return params;
}

/**
 * Build a Cache-Control header value for CDN / browser caching.
 * - `public`      — any cache may store
 * - `s-maxage`    — shared (CDN) max age in seconds
 * - `stale-while-revalidate` — serve stale while re-fetching in background
 */
function cacheControl(ttlSeconds) {
  return `public, s-maxage=${ttlSeconds}, stale-while-revalidate=${Math.floor(ttlSeconds / 2)}`;
}

/**
 * Create a JSON response with CDN-friendly caching headers.
 */
function json(data, status = 200, ttlSeconds = null) {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (ttlSeconds !== null && ttlSeconds > 0) {
    headers['Cache-Control'] = cacheControl(ttlSeconds);
  } else {
    headers['Cache-Control'] = 'no-store, must-revalidate';
  }
  return NextResponse.json(data, { status, headers });
}

/**
 * Handle errors and return a proper JSON error response.
 */
function errorResponse(err) {
  console.error('API Error:', err.message);
  return NextResponse.json(
    { error: err.message || 'Internal server error' },
    { status: err.status || 500 }
  );
}

// ============================================================
// Handler functions
// ============================================================

async function handleShows(request, segments, method) {
  // POST /api/shows/batch
  if (method === 'POST' && segments.length === 2 && segments[1] === 'batch') {
    try {
      const body = await request.json();
      const { ids } = body;
      if (!ids || !Array.isArray(ids)) {
        return json({ error: 'ids must be an array' }, 400);
      }
      const data = await api.showsWithIds(ids);
      return json(data);
    } catch (err) {
      return errorResponse(err);
    }
  }

  // GET /api/shows/:showId/streams/:episodeString
  if (segments.length === 4 && segments[2] === 'streams') {
    const showId = segments[1];
    const episodeString = segments[3];
    const { translationType = 'sub' } = getQuery(request);
    try {
      const data = await api.episodeWithSources(showId, episodeString, translationType);
      return json(data, 200, TTL.STREAMS);
    } catch (err) {
      return errorResponse(err);
    }
  }

  // GET /api/shows/:showId/episode-infos
  if (segments.length === 3 && segments[2] === 'episode-infos') {
    const showId = segments[1];
    const { episodeNumStart, episodeNumEnd } = getQuery(request);
    if (!episodeNumStart || !episodeNumEnd) {
      return json({ error: 'episodeNumStart and episodeNumEnd are required' }, 400);
    }
    try {
      const data = await api.episodeInfos(showId, parseInt(episodeNumStart), parseInt(episodeNumEnd));
      return json(data, 200, TTL.EPISODES);
    } catch (err) {
      return errorResponse(err);
    }
  }

  // GET /api/shows/:showId/episode-info/:episodeString
  if (segments.length === 4 && segments[2] === 'episode-info') {
    const showId = segments[1];
    const episodeString = segments[3];
    const { translationType = 'sub' } = getQuery(request);
    try {
      const data = await api.episodeInfo(showId, episodeString, translationType);
      return json(data, 200, TTL.EPISODE);
    } catch (err) {
      return errorResponse(err);
    }
  }

  // GET /api/shows/:showId/episodes/:episodeString
  if (segments.length === 4 && segments[2] === 'episodes') {
    const showId = segments[1];
    const episodeString = segments[3];
    const { translationType = 'sub' } = getQuery(request);
    try {
      const data = await api.episode(showId, episodeString, translationType);
      return json(data, 200, TTL.EPISODE);
    } catch (err) {
      return errorResponse(err);
    }
  }

  // GET /api/shows/:showId/episodes
  if (segments.length === 3 && segments[2] === 'episodes') {
    const showId = segments[1];
    const { translationType = 'sub', episodeNumStart, episodeNumEnd } = getQuery(request);
    try {
      const data = await api.episodes(showId, {
        translationType,
        episodeNumStart: episodeNumStart ? parseInt(episodeNumStart) : undefined,
        episodeNumEnd: episodeNumEnd ? parseInt(episodeNumEnd) : undefined,
      });
      return json(data, 200, TTL.EPISODES);
    } catch (err) {
      return errorResponse(err);
    }
  }

  // GET /api/shows/:id
  if (segments.length === 2) {
    const showId = segments[1];
    try {
      const data = await api.show(showId);
      return json(data, 200, TTL.SHOW);
    } catch (err) {
      return errorResponse(err);
    }
  }

  // GET /api/shows
  if (segments.length === 1) {
    const query = getQuery(request);
    const search = {};
    if (query.sortBy) search.sortBy = query.sortBy;
    if (query.genres) search.genres = query.genres.split(',').map(g => g.trim());
    if (query.season) search.season = query.season.toUpperCase();
    if (query.year) search.year = parseInt(query.year, 10);
    if (query.allowAdult !== undefined) search.allowAdult = query.allowAdult === 'true';
    if (query.status) search.status = query.status;
    if (query.type) search.types = [query.type];
    if (query.query) search.query = query.query;

    try {
      const data = await api.shows({
        page: parseInt(query.page || '1', 10),
        limit: parseInt(query.limit || '20', 10),
        translationType: query.translationType,
        countryOrigin: query.countryOrigin,
        search: Object.keys(search).length > 0 ? search : undefined,
      });
      return json(data, 200, TTL.SHOWS);
    } catch (err) {
      return errorResponse(err);
    }
  }

  return json({ error: 'Not found' }, 404);
}

async function handleMangas(request, segments) {
  // GET /api/mangas/:mangaId/chapters
  if (segments.length === 3 && segments[2] === 'chapters') {
    const mangaId = segments[1];
    const { page = '1', limit = '50' } = getQuery(request);
    try {
      const data = await api.chaptersForRead(mangaId, {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
      });
      return json(data, 200, TTL.EPISODES);
    } catch (err) {
      return errorResponse(err);
    }
  }

  // GET /api/mangas/:id
  if (segments.length === 2) {
    const mangaId = segments[1];
    try {
      const data = await api.manga(mangaId);
      return json(data, 200, TTL.SHOW);
    } catch (err) {
      return errorResponse(err);
    }
  }

  // GET /api/mangas
  if (segments.length === 1) {
    const query = getQuery(request);
    const search = {};
    if (query.sortBy) search.sortBy = { property: query.sortBy.toUpperCase(), order: (query.sortOrder || 'DESC').toUpperCase() };
    if (query.genres) search.genres = query.genres.split(',').map(g => g.trim());
    if (query.query) search.query = query.query;

    try {
      const data = await api.mangas({
        page: parseInt(query.page || '1', 10),
        limit: parseInt(query.limit || '20', 10),
        translationType: query.translationType,
        countryOrigin: query.countryOrigin,
        search: Object.keys(search).length > 0 ? search : undefined,
      });
      return json(data, 200, TTL.SHOWS);
    } catch (err) {
      return errorResponse(err);
    }
  }

  return json({ error: 'Not found' }, 404);
}

async function handleChapters(request, segments) {
  // GET /api/chapters/:chapterId/pages
  if (segments.length === 3 && segments[2] === 'pages') {
    const chapterId = segments[1];
    try {
      const data = await api.chapterPages(chapterId);
      return json(data, 200, TTL.EPISODES);
    } catch (err) {
      return errorResponse(err);
    }
  }

  return json({ error: 'Not found' }, 404);
}

async function handleWatchState(request, segments) {
  // GET /api/watch-state/:showId
  if (segments.length === 2) {
    const showId = segments[1];
    try {
      const data = await api.watchState(showId);
      return json(data, 200, TTL.WATCH_STATE);
    } catch (err) {
      return errorResponse(err);
    }
  }

  return json({ error: 'Not found' }, 404);
}

async function handlePlaylists(request, segments) {
  // GET /api/playlists/:playlistId/shows
  if (segments.length === 3 && segments[2] === 'shows') {
    const playlistId = segments[1];
    const { page = '1', limit = '20' } = getQuery(request);
    try {
      const data = await api.showsWithPlaylistId(playlistId, {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
      });
      return json(data, 200, TTL.PLAYLISTS);
    } catch (err) {
      return errorResponse(err);
    }
  }

  return json({ error: 'Not found' }, 404);
}

// ============================================================
// Main request handler
// ============================================================

async function handleRequest(request, { params }) {
  const segments = (params.path || []).map(s => decodeURIComponent(s));
  const method = request.method;

  if (segments.length === 0) {
    return json({ error: 'Not found' }, 404);
  }

  const resource = segments[0];

  try {
    switch (resource) {
      // ── Shows ──
      case 'shows':
        return await handleShows(request, segments, method);

      // ── Search ──
      case 'search': {
        const query = getQuery(request);
        if (!query.q) {
          return json({ error: 'query parameter "q" is required' }, 400);
        }
        const data = await api.searchAnime({
          query: query.q,
          tr: query.tr,
          cty: query.cty,
          sortBy: query.sortBy,
          sortDirection: query.sortDirection,
          page: query.page ? parseInt(query.page, 10) : 1,
          limit: query.limit ? parseInt(query.limit, 10) : 40,
        });
        return json(data, 200, TTL.SEARCH);
      }

      // ── Embed ──
      case 'embed': {
        const { showId, episodeString, translationType = 'sub' } = getQuery(request);
        if (!showId || !episodeString) {
          return json({ error: 'showId and episodeString are required' }, 400);
        }
        const embedUrl = api.generateEmbedUrl(showId, episodeString, translationType);
        const watchUrl = api.generateWatchUrl(showId, episodeString, translationType);
        return json({ embedUrl, watchUrl }, 200, TTL.CATEGORIES);
      }

      // ── Popular ──
      case 'popular': {
        const { type = 'ANIME', size = '20' } = getQuery(request);
        const data = await api.queryPopular(type, { size: parseInt(size, 10) });
        return json(data, 200, TTL.POPULAR);
      }

      // ── Recommendations ──
      case 'recommendations': {
        const qRec = getQuery(request);
        const data = await api.queryRecommendation({
          type: qRec.type || 'anime',
          size: parseInt(qRec.size || '20', 10),
          page: parseInt(qRec.page || '1', 10),
          pageType: qRec.pageType || 'ep_cp',
        });
        return json(data, 200, TTL.RECOMMEND);
      }

      // ── Random Recommendations ──
      case 'random-recommendations': {
        const { format = 'anime' } = getQuery(request);
        const data = await api.queryRandomRecommendation(format);
        return json(data, 200, TTL.RECOMMEND);
      }

      // ── Mangas ──
      case 'mangas':
        return await handleMangas(request, segments);

      // ── Chapters ──
      case 'chapters':
        return await handleChapters(request, segments);

      // ── Characters ──
      case 'characters': {
        const charQuery = getQuery(request);
        const search = {};
        if (charQuery.name) search.name = charQuery.name;
        if (charQuery.limit) search.limit = parseInt(charQuery.limit, 10);
        if (charQuery.page) search.page = parseInt(charQuery.page, 10);
        const data = await api.characters(search);
        return json(data, 200, TTL.CHARACTERS);
      }

      // ── Tags ──
      case 'tags': {
        const tagQuery = getQuery(request);
        const tagSearch = {};
        if (tagQuery.name) tagSearch.name = tagQuery.name;
        if (tagQuery.type) tagSearch.tagType = tagQuery.type;
        if (tagQuery.page) tagSearch.page = parseInt(tagQuery.page, 10);
        if (tagQuery.limit) tagSearch.limit = parseInt(tagQuery.limit, 10);
        const data = await api.queryTags(tagSearch);
        return json(data, 200, TTL.TAGS);
      }

      // ── Music ──
      case 'music': {
        const musicQuery = getQuery(request);
        const musicSearch = {};
        if (musicQuery.name) musicSearch.name = musicQuery.name;
        if (musicQuery.artist) musicSearch.artist = musicQuery.artist;
        if (musicQuery.type) musicSearch.type = musicQuery.type;
        const data = await api.musics(musicSearch, {
          page: parseInt(musicQuery.page || '1', 10),
          limit: parseInt(musicQuery.limit || '20', 10),
        });
        return json(data, 200, TTL.MUSIC);
      }

      // ── Comments ──
      case 'comments': {
        const commQuery = getQuery(request);
        if (!commQuery.referenceId && !commQuery.showId) {
          return json({ error: 'referenceId or showId is required' }, 400);
        }
        const data = await api.queryComments({
          referenceId: commQuery.referenceId || commQuery.showId,
          page: parseInt(commQuery.page || '1', 10),
          limit: parseInt(commQuery.limit || '20', 10),
        });
        return json(data, 200, TTL.COMMENTS);
      }

      // ── Reviews ──
      case 'reviews': {
        const revQuery = getQuery(request);
        if (!revQuery.showId) {
          return json({ error: 'showId is required' }, 400);
        }
        const data = await api.queryReviews({
          showId: revQuery.showId,
          page: parseInt(revQuery.page || '1', 10),
          limit: parseInt(revQuery.limit || '20', 10),
        });
        return json(data, 200, TTL.REVIEWS);
      }

      // ── Watch State ──
      case 'watch-state':
        return await handleWatchState(request, segments);

      // ── Playlists ──
      case 'playlists':
        return await handlePlaylists(request, segments);

      // ── Genres ──
      case 'genres': {
        const genres = [
          'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror',
          'Isekai', 'Magic', 'Mecha', 'Music', 'Mystery', 'Psychological',
          'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural',
          'Thriller', 'Ecchi', 'Harem', 'Shounen', 'Shoujo', 'Seinen', 'Josei',
          'Historical', 'Martial Arts', 'Parody', 'School', 'Military',
          'Police', 'Space', 'Super Power', 'Vampire', 'Demons', 'Game',
          'Kids', 'Cars', 'Samurai', 'Cooking', 'Dementia', 'Gods',
        ];
        return json({ genres }, 200, TTL.GENRES);
      }

      // ── Categories ──
      case 'categories': {
        return json({
          types: ['TV', 'Movie', 'OVA', 'ONA', 'Special', 'Music'],
          statuses: ['Releasing', 'Finished', 'Not yet aired', 'Cancelled'],
          seasons: ['WINTER', 'SPRING', 'SUMMER', 'FALL'],
          countries: ['ALL', 'JP', 'CN', 'KR', 'OTHER'],
          translationTypes: ['sub', 'dub', 'raw'],
        }, 200, TTL.CATEGORIES);
      }

      // ── Health ──
      case 'health': {
        return json({ status: 'ok', timestamp: new Date().toISOString() });
      }

      default:
        return json({ error: 'Not found' }, 404);
    }
  } catch (err) {
    return errorResponse(err);
  }
}

// ============================================================
// Exported route handlers
// ============================================================

export async function GET(request, { params }) {
  return handleRequest(request, { params });
}

export async function POST(request, { params }) {
  return handleRequest(request, { params });
}
