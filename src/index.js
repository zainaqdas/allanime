const express = require('express');
const cors = require('cors');
const api = require('./api');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static frontend
app.use(express.static('public'));

// SPA fallback: serve index.html for all non-API routes
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile('index.html', { root: 'public' });
});

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ============================================================
// SHOWS
// ============================================================

/**
 * GET /api/shows
 * List shows with pagination, filtering, and sorting.
 */
app.get('/api/shows', asyncHandler(async (req, res) => {
  const {
    page = 1, limit = 20, translationType, countryOrigin,
    sortBy, sortOrder, genres, season, year,
    allowAdult, status, type, query,
  } = req.query;

  const search = {};
  if (sortBy) search.sortBy = sortBy;
  if (genres) search.genres = genres.split(',').map((g) => g.trim());
  if (season) search.season = season.toUpperCase();
  if (year) search.year = parseInt(year, 10);
  if (allowAdult !== undefined) search.allowAdult = allowAdult === 'true';
  if (status) search.status = status;
  if (type) search.types = [type];
  if (query) search.query = query;

  const data = await api.shows({
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    translationType,
    countryOrigin,
    search: Object.keys(search).length > 0 ? search : undefined,
  });
  res.json(data);
}));

/**
 * GET /api/shows/:id
 * Get detailed information about a specific show.
 */
app.get('/api/shows/:id', asyncHandler(async (req, res) => {
  const data = await api.show(req.params.id);
  res.json(data);
}));

/**
 * POST /api/shows/batch
 * Get multiple shows by their IDs.
 */
app.post('/api/shows/batch', asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ error: 'ids must be an array' });
  }
  const data = await api.showsWithIds(ids);
  res.json(data);
}));

// ============================================================
// EPISODES
// ============================================================

/**
 * GET /api/shows/:showId/episodes
 * List episodes for a show.
 */
app.get('/api/shows/:showId/episodes', asyncHandler(async (req, res) => {
  const { translationType = 'sub', episodeNumStart, episodeNumEnd } = req.query;
  const data = await api.episodes(req.params.showId, {
    translationType,
    episodeNumStart: episodeNumStart ? parseInt(episodeNumStart, 10) : undefined,
    episodeNumEnd: episodeNumEnd ? parseInt(episodeNumEnd, 10) : undefined,
  });
  res.json(data);
}));

/**
 * GET /api/shows/:showId/episodes/:episodeString
 * Get detailed information about a specific episode.
 */
app.get('/api/shows/:showId/episodes/:episodeString', asyncHandler(async (req, res) => {
  const { translationType = 'sub' } = req.query;
  const data = await api.episode(req.params.showId, req.params.episodeString, translationType);
  res.json(data);
}));

/**
 * GET /api/shows/:showId/episode-info/:episodeString
 * Get episode info with video source data (vidInfors).
 */
app.get('/api/shows/:showId/episode-info/:episodeString', asyncHandler(async (req, res) => {
  const { translationType = 'sub' } = req.query;
  const data = await api.episodeInfo(req.params.showId, req.params.episodeString, translationType);
  res.json(data);
}));

/**
 * GET /api/shows/:showId/episode-infos
 * Get episode infos for a range.
 */
app.get('/api/shows/:showId/episode-infos', asyncHandler(async (req, res) => {
  const { episodeNumStart, episodeNumEnd } = req.query;
  if (!episodeNumStart || !episodeNumEnd) {
    return res.status(400).json({ error: 'episodeNumStart and episodeNumEnd are required' });
  }
  const data = await api.episodeInfos(
    req.params.showId,
    parseInt(episodeNumStart, 10),
    parseInt(episodeNumEnd, 10)
  );
  res.json(data);
}));

// ============================================================
// STREAMS / SOURCES
// ============================================================

/**
 * GET /api/shows/:showId/streams/:episodeString
 * Get stream URLs/sources for a specific episode.
 */
app.get('/api/shows/:showId/streams/:episodeString', asyncHandler(async (req, res) => {
  const { translationType = 'sub' } = req.query;
  const data = await api.episodeWithSources(req.params.showId, req.params.episodeString, translationType);
  res.json(data);
}));

/**
 * GET /api/embed
 * Generate an embed URL for streaming an episode.
 */
app.get('/api/embed', asyncHandler(async (req, res) => {
  const { showId, episodeString, translationType = 'sub' } = req.query;
  if (!showId || !episodeString) {
    return res.status(400).json({ error: 'showId and episodeString are required' });
  }
  const embedUrl = api.generateEmbedUrl(showId, episodeString, translationType);
  const watchUrl = api.generateWatchUrl(showId, episodeString, translationType);
  res.json({ embedUrl, watchUrl });
}));

// ============================================================
// SEARCH
// ============================================================

/**
 * GET /api/search
 * Search anime with comprehensive filtering and pagination.
 * Accepts: q (query), tr (translationType: sub|dub|raw), cty (countryOrigin),
 *          sortBy, sortDirection, page, limit
 * Falls back to fastSearch when no additional filters are provided.
 */
app.get('/api/search', asyncHandler(async (req, res) => {
  const { q, tr, cty, sortBy, sortDirection, page, limit } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'query parameter "q" is required' });
  }

  // Use full searchAnime for comprehensive results
  const data = await api.searchAnime({
    query: q,
    tr,
    cty,
    sortBy,
    sortDirection,
    page: page ? parseInt(page, 10) : 1,
    limit: limit ? parseInt(limit, 10) : 40,
  });
  res.json(data);
}));

// ============================================================
// POPULAR & RECOMMENDATIONS
// ============================================================

/**
 * GET /api/popular
 * Get popular shows.
 */
app.get('/api/popular', asyncHandler(async (req, res) => {
  const { type = 'ANIME', size = 20 } = req.query;
  const data = await api.queryPopular(type, { size: parseInt(size, 10) });
  res.json(data);
}));

/**
 * GET /api/recommendations
 * Get recommendations.
 */
app.get('/api/recommendations', asyncHandler(async (req, res) => {
  const { type = 'anime', size = 20, page = 1, pageType = 'ep_cp' } = req.query;
  const data = await api.queryRecommendation({
    type,
    size: parseInt(size, 10),
    page: parseInt(page, 10),
    pageType,
  });
  res.json(data);
}));

/**
 * GET /api/random-recommendations
 * Get random recommendations.
 */
app.get('/api/random-recommendations', asyncHandler(async (req, res) => {
  const { format = 'anime' } = req.query;
  const data = await api.queryRandomRecommendation(format);
  res.json(data);
}));

// ============================================================
// MANGAS
// ============================================================

/**
 * GET /api/mangas
 * List mangas with pagination.
 */
app.get('/api/mangas', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, translationType, countryOrigin, query, sortBy, sortOrder, genres } = req.query;
  const search = {};
  if (sortBy) search.sortBy = { property: sortBy.toUpperCase(), order: (sortOrder || 'DESC').toUpperCase() };
  if (genres) search.genres = genres.split(',').map((g) => g.trim());
  if (query) search.query = query;

  const data = await api.mangas({
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    translationType,
    countryOrigin,
    search: Object.keys(search).length > 0 ? search : undefined,
  });
  res.json(data);
}));

/**
 * GET /api/mangas/:id
 * Get detailed information about a specific manga.
 */
app.get('/api/mangas/:id', asyncHandler(async (req, res) => {
  const data = await api.manga(req.params.id);
  res.json(data);
}));

// ============================================================
// CHAPTERS
// ============================================================

/**
 * GET /api/mangas/:mangaId/chapters
 * List chapters for a manga.
 */
app.get('/api/mangas/:mangaId/chapters', asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const data = await api.chaptersForRead(req.params.mangaId, {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  });
  res.json(data);
}));

/**
 * GET /api/chapters/:chapterId/pages
 * Get pages for a specific chapter.
 */
app.get('/api/chapters/:chapterId/pages', asyncHandler(async (req, res) => {
  const data = await api.chapterPages(req.params.chapterId);
  res.json(data);
}));

// ============================================================
// CHARACTERS
// ============================================================

/**
 * GET /api/characters
 * Search characters.
 */
app.get('/api/characters', asyncHandler(async (req, res) => {
  const { name, limit = 20, page = 1 } = req.query;
  const search = {};
  if (name) search.name = name;
  if (limit) search.limit = parseInt(limit, 10);
  if (page) search.page = parseInt(page, 10);

  const data = await api.characters(search);
  res.json(data);
}));

// ============================================================
// TAGS
// ============================================================

/**
 * GET /api/tags
 * Query tags.
 */
app.get('/api/tags', asyncHandler(async (req, res) => {
  const { name, type, page = 1, limit = 20 } = req.query;
  const search = {};
  if (name) search.name = name;
  if (type) search.tagType = type;
  if (page) search.page = parseInt(page, 10);
  if (limit) search.limit = parseInt(limit, 10);

  const data = await api.queryTags(search);
  res.json(data);
}));

// ============================================================
// MUSIC
// ============================================================

/**
 * GET /api/music
 * Query music.
 */
app.get('/api/music', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, name, artist, type } = req.query;
  const search = {};
  if (name) search.name = name;
  if (artist) search.artist = artist;
  if (type) search.type = type;

  const data = await api.musics(search, {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  });
  res.json(data);
}));

// ============================================================
// COMMENTS & REVIEWS
// ============================================================

/**
 * GET /api/comments
 * Query comments for a show/episode.
 */
app.get('/api/comments', asyncHandler(async (req, res) => {
  const { showId, referenceId, page = 1, limit = 20 } = req.query;
  if (!referenceId && !showId) {
    return res.status(400).json({ error: 'referenceId or showId is required' });
  }
  const search = { referenceId: referenceId || showId, page: parseInt(page, 10), limit: parseInt(limit, 10) };
  const data = await api.queryComments(search);
  res.json(data);
}));

/**
 * GET /api/reviews
 * Query reviews for a show.
 */
app.get('/api/reviews', asyncHandler(async (req, res) => {
  const { showId, page = 1, limit = 20 } = req.query;
  if (!showId) {
    return res.status(400).json({ error: 'showId is required' });
  }
  const search = { showId, page: parseInt(page, 10), limit: parseInt(limit, 10) };
  const data = await api.queryReviews(search);
  res.json(data);
}));

// ============================================================
// WATCH STATE
// ============================================================

/**
 * GET /api/watch-state/:showId
 * Get watch state for a show.
 */
app.get('/api/watch-state/:showId', asyncHandler(async (req, res) => {
  const data = await api.watchState(req.params.showId);
  res.json(data);
}));

// ============================================================
// PLAYLISTS
// ============================================================

/**
 * GET /api/playlists/:playlistId/shows
 * Get shows from a playlist.
 */
app.get('/api/playlists/:playlistId/shows', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const data = await api.showsWithPlaylistId(req.params.playlistId, {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  });
  res.json(data);
}));

// ============================================================
// GENRES & CATEGORIES
// ============================================================

/**
 * GET /api/genres
 * List all available anime genres.
 */
app.get('/api/genres', asyncHandler(async (req, res) => {
  const genres = [
    'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror',
    'Isekai', 'Magic', 'Mecha', 'Music', 'Mystery', 'Psychological',
    'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural',
    'Thriller', 'Ecchi', 'Harem', 'Shounen', 'Shoujo', 'Seinen', 'Josei',
    'Historical', 'Martial Arts', 'Parody', 'School', 'Military',
    'Police', 'Space', 'Super Power', 'Vampire', 'Demons', 'Game',
    'Kids', 'Cars', 'Samurai', 'Cooking', 'Dementia', 'Gods',
  ];
  res.json({ genres });
}));

/**
 * GET /api/categories
 * List available categories and metadata.
 */
app.get('/api/categories', asyncHandler(async (req, res) => {
  res.json({
    types: ['TV', 'Movie', 'OVA', 'ONA', 'Special', 'Music'],
    statuses: ['Releasing', 'Finished', 'Not yet aired', 'Cancelled'],
    seasons: ['WINTER', 'SPRING', 'SUMMER', 'FALL'],
    countries: ['ALL', 'JP', 'CN', 'KR', 'OTHER'],
    translationTypes: ['sub', 'dub', 'raw'],
  });
}));

// ============================================================
// HEALTH CHECK
// ============================================================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================================
// ERROR HANDLER
// ============================================================

app.use((err, req, res, next) => {
  console.error('API Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

app.listen(PORT, () => {
  console.log(`AllAnime Scraper API running on http://localhost:${PORT}`);
  console.log(``);
  console.log('Endpoints:');
  console.log('  ── Shows ──');
  console.log('  GET  /api/shows                           List/filter shows');
  console.log('  GET  /api/shows/:id                       Show details');
  console.log('  POST /api/shows/batch                     Batch get shows by IDs');
  console.log('  ── Episodes ──');
  console.log('  GET  /api/shows/:id/episodes              List episodes');
  console.log('  GET  /api/shows/:id/episodes/:ep          Episode details');
  console.log('  GET  /api/shows/:id/episode-info/:ep      Episode video info (vidInfors)');
  console.log('  GET  /api/shows/:id/episode-infos         Episode infos for a range');
  console.log('  ── Streams ──');
  console.log('  GET  /api/shows/:id/streams/:ep           Episode stream sources');
  console.log('  GET  /api/embed                           Generate embed URL');
  console.log('  ── Search ──');
  console.log('  GET  /api/search?q=...                    Search anime/manga');
  console.log('  ── Popular & Recommendations ──');
  console.log('  GET  /api/popular                         Popular shows');
  console.log('  GET  /api/recommendations                 Recommendations');
  console.log('  GET  /api/random-recommendations          Random recommendations');
  console.log('  ── Mangas ──');
  console.log('  GET  /api/mangas                          List mangas');
  console.log('  GET  /api/mangas/:id                      Manga details');
  console.log('  ── Chapters (Manga) ──');
  console.log('  GET  /api/mangas/:id/chapters             List chapters');
  console.log('  GET  /api/chapters/:id/pages              Chapter pages');
  console.log('  ── Other ──');
  console.log('  GET  /api/characters                      Search characters');
  console.log('  GET  /api/tags                            Query tags');
  console.log('  GET  /api/music                           Query music');
  console.log('  GET  /api/comments                        Query comments');
  console.log('  GET  /api/reviews                         Query reviews');
  console.log('  GET  /api/watch-state/:id                 Watch state');
  console.log('  GET  /api/playlists/:id/shows             Playlist shows');
  console.log('  GET  /api/genres                          List genres');
  console.log('  GET  /api/categories                      Browse categories');
  console.log('  GET  /api/health                          Health check');
});
