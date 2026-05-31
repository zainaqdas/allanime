const axios = require('axios');

const { decryptTobeparsed, parseSources, parseJsonSources } = require('./decrypt');

const API_URL = 'https://api.allanime.day/api';
const EMBED_BASE = 'https://allanime.day/embed';
const WATCH_BASE = 'https://mkissa.to/anime';

// Referrer that bypasses CAPTCHA (per ani-cli reverse engineering)
const ALLANIME_REFR = 'https://youtu-chan.com';

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Referer': ALLANIME_REFR,
  'Origin': ALLANIME_REFR,
};

// Persisted query hash for fetching episode source URLs (from ani-cli)
const EPISODE_SOURCE_HASH = 'd405d0edd690624b66baba3068e0edc3ac90f1597d898a1ec8db4e5c43c00fec';

/**
 * Execute a GraphQL query against the AllAnime API.
 */
async function graphql(query, variables = {}) {
  try {
    const response = await axios.post(
      API_URL,
      { query, variables },
      { headers: DEFAULT_HEADERS, timeout: 30000 }
    );

    if (response.data.errors) {
      throw new Error(
        `GraphQL error: ${response.data.errors.map((e) => e.message).join(', ')}`
      );
    }

    return response.data.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`API error ${error.response.status}: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

// ============================================================
// SHOWS
// ============================================================

const SHOWS_QUERY = `
  query Shows($search: SearchInput, $page: Int, $limit: Int, $translationType: VaildTranslationTypeEnumType, $countryOrigin: VaildCountryOriginEnumType) {
    shows(search: $search, page: $page, limit: $limit, translationType: $translationType, countryOrigin: $countryOrigin) {
      edges {
        _id
        name
        englishName
        nativeName
        altNames
        description
        score
        averageScore
        popularity
        status
        type
        genres
        tags
        thumbnail
        banner
        episodeCount
        episodeDuration
        season
        airedStart
        airedEnd
        studios
        isAdult
        availableEpisodesDetail
        malId
        aniListId
        nextAiringEpisode
        countryOfOrigin
        rating
      }
      pageInfo {
        total
        hasNextPage
        nextPage
        prevPage
        page
      }
    }
  }
`;

/**
 * Get a paginated list of shows.
 */
async function shows({ page = 1, limit = 20, translationType, countryOrigin, search } = {}) {
  const variables = { page, limit };
  if (translationType) variables.translationType = translationType.toLowerCase();
  if (countryOrigin) variables.countryOrigin = countryOrigin.toUpperCase();
  if (search) {
    // SortBy is a GraphQL enum — pass as-is, strip any sortDirection field
    delete search.sortDirection;
    // Backward compat: if sortBy is still { property, order } object, extract property
    if (search.sortBy && typeof search.sortBy === 'object') {
      search.sortBy = search.sortBy.property;
    }
    variables.search = search;
  }

  const data = await graphql(SHOWS_QUERY, variables);
  return data.shows;
}

const SHOW_QUERY = `
  query Show($_id: String!) {
    show(_id: $_id) {
      _id
      name
      englishName
      nativeName
      altNames
      description
      score
      averageScore
      popularity
      status
      type
      genres
      tags
      thumbnail
      banner
      thumbnails
      episodeCount
      episodeDuration
      season
      airedStart
      airedEnd
      studios
      isAdult
      hidden
      availableEpisodesDetail
      malId
      aniListId
      countryOfOrigin
      rating
      nextAiringEpisode
      lastEpisodeDate
      lastEpisodeTimestamp
      lastEpisodeInfo
      broadcastInterval
    }
  }
`;

/**
 * Get a single show by ID.
 */
async function show(showId) {
  const data = await graphql(SHOW_QUERY, { _id: showId });
  return data.show;
}

const SHOWS_WITH_IDS_QUERY = `
  query ShowsWithIds($ids: [String!]!) {
    showsWithIds(ids: $ids) {
      _id
      name
      englishName
      type
      thumbnail
      score
      status
      episodeCount
      availableEpisodesDetail
    }
  }
`;

/**
 * Get multiple shows by their IDs.
 */
async function showsWithIds(ids) {
  const data = await graphql(SHOWS_WITH_IDS_QUERY, { ids });
  return data.showsWithIds;
}

// ============================================================
// EPISODES
// ============================================================

const EPISODES_QUERY = `
  query Episodes($showId: String!, $translationType: VaildTranslationTypeEnumType, $episodeNumStart: Int, $episodeNumEnd: Int) {
    episodes(showId: $showId, translationType: $translationType, episodeNumStart: $episodeNumStart, episodeNumEnd: $episodeNumEnd) {
      edges {
        _id
        showId
        episodeString
        episodeNumStart
        episodeNumEnd
        translationType
        thumbnail
        notes
        description
        episodeAiredDateString
        videoUrlProcessed
        sourceUrls
      }
      pageInfo {
        total
        hasNextPage
      }
    }
  }
`;

/**
 * Get episodes for a show.
 */
async function episodes(showId, { translationType, episodeNumStart, episodeNumEnd } = {}) {
  const variables = { showId };
  if (translationType) variables.translationType = translationType.toLowerCase();
  if (episodeNumStart !== undefined) variables.episodeNumStart = episodeNumStart;
  if (episodeNumEnd !== undefined) variables.episodeNumEnd = episodeNumEnd;

  const data = await graphql(EPISODES_QUERY, variables);
  return data.episodes;
}

const EPISODE_QUERY = `
  query Episode($showId: String!, $episodeString: String!, $translationType: VaildTranslationTypeEnumType!) {
    episode(showId: $showId, episodeString: $episodeString, translationType: $translationType) {
      _id
      showId
      episodeString
      episodeNumStart
      episodeNumEnd
      translationType
      thumbnail
      notes
      description
      episodeAiredDateString
      videoUrlProcessed
      sourceUrls
      uploadDate
      show {
        _id
        name
        englishName
        thumbnail
      }
    }
  }
`;

/**
 * Get a single episode by showId, episodeString, and translationType.
 */
async function episode(showId, episodeString, translationType = 'sub') {
  const data = await graphql(EPISODE_QUERY, {
    showId,
    episodeString,
    translationType: translationType.toLowerCase(),
  });
  return data.episode;
}

const EPISODE_INFO_QUERY = `
  query Episode($showId: String!, $episodeString: String!, $translationType: VaildTranslationTypeEnumType!) {
    episode(showId: $showId, episodeString: $episodeString, translationType: $translationType) {
      _id
      episodeInfo {
        _id
        showId
        episodeIdNum
        notes
        description
        thumbnails
        isManga
        vidInforssub
        vidInforsdub
        vidInforsraw
      }
    }
  }
`;

/**
 * Get episode info with video source data (vidInfors).
 */
async function episodeInfo(showId, episodeString, translationType = 'sub') {
  const data = await graphql(EPISODE_INFO_QUERY, {
    showId,
    episodeString,
    translationType: translationType.toLowerCase(),
  });
  return data.episode;
}

const EPISODE_INFOS_QUERY = `
  query EpisodeInfos($showId: String!, $episodeNumStart: Int!, $episodeNumEnd: Int!) {
    episodeInfos(showId: $showId, episodeNumStart: $episodeNumStart, episodeNumEnd: $episodeNumEnd) {
      _id
      showId
      episodeIdNum
      notes
      description
      thumbnails
      isManga
      vidInforssub
      vidInforsdub
      vidInforsraw
    }
  }
`;

/**
 * Get episode infos for a range of episodes.
 */
async function episodeInfos(showId, episodeNumStart, episodeNumEnd) {
  const data = await graphql(EPISODE_INFOS_QUERY, { showId, episodeNumStart, episodeNumEnd });
  return data.episodeInfos;
}

/**
 * Fetch episode source URLs using the persisted query approach.
 * Uses the correct referrer (youtu-chan.com) and decrypts the response.
 * Based on the ani-cli reverse engineering.
 */
async function episodeDirectSources(showId, episodeString, translationType = 'sub') {
  const variables = {
    showId,
    translationType: translationType.toLowerCase(),
    episodeString,
  };

  const extensions = {
    persistedQuery: {
      version: 1,
      sha256Hash: EPISODE_SOURCE_HASH,
    },
  };

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Origin': ALLANIME_REFR,
    'Referer': ALLANIME_REFR,
  };

  // Try GET with persisted query first
  try {
    const params = new URLSearchParams({
      variables: JSON.stringify(variables),
      extensions: JSON.stringify(extensions),
    });

    const response = await axios.get(`${API_URL}?${params}`, {
      headers,
      timeout: 15000,
    });

    const data = response.data;
    
    // AllAnime API returns encrypted data in a flat structure:
    // { data: { _m: "b7", tobeparsed: "base64..." } }
    // The tobeparsed field contains encrypted source URL data.
    if (data && data.data && data.data.tobeparsed) {
      const b64data = data.data.tobeparsed;
      // Prepend "tobeparsed" so the decrypt function recognizes the format
      const encryptedPayload = 'tobeparsed' + b64data;
      const decrypted = decryptTobeparsed(encryptedPayload);
      
      if (decrypted && typeof decrypted === 'string' && decrypted !== encryptedPayload) {
        // Try parsing as JSON first (new format)
        let sources = parseJsonSources(decrypted);
        if (sources.length === 0) {
          // Fall back to legacy format
          sources = parseSources(decrypted);
        }
        return { episodeString, sources };
      }
    }
  } catch (e) {
    // Fall through to POST method
  }

  // Fallback: POST with raw GraphQL query
  try {
    const query = `
      query ($showId: String!, $translationType: VaildTranslationTypeEnumType!, $episodeString: String!) {
        episode(showId: $showId, translationType: $translationType, episodeString: $episodeString) {
          episodeString
          sourceUrls
        }
      }
    `;

    const response = await axios.post(
      API_URL,
      { query, variables },
      {
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    const data = response.data;
    
    if (data && data.data && data.data.tobeparsed) {
      const b64data = data.data.tobeparsed;
      const encryptedPayload = 'tobeparsed' + b64data;
      const decrypted = decryptTobeparsed(encryptedPayload);
      
      if (decrypted && typeof decrypted === 'string' && decrypted !== encryptedPayload) {
        let sources = parseJsonSources(decrypted);
        if (sources.length === 0) {
          sources = parseSources(decrypted);
        }
        return { episodeString, sources };
      }
    }
  } catch (e) {
    throw new Error(`Failed to fetch episode sources: ${e.message}`);
  }

  return { episodeString, sources: [] };
}

/**
 * Get episode with processed stream sources.
 * Uses the decrypted API source URLs when available, falls back to embed/watch URLs.
 */
async function episodeWithSources(showId, episodeString, translationType = 'sub') {
  // Generate URLs first - these are the primary working stream links
  const embedUrl = generateEmbedUrl(showId, episodeString, translationType);
  const watchUrl = generateWatchUrl(showId, episodeString, translationType);

  let ep = null;
  let episodeInfoData = null;
  let directSources = [];

  try {
    ep = await episode(showId, episodeString, translationType);
  } catch (e) {
    // Episode query may fail - that's expected
  }

  try {
    const infoData = await episodeInfo(showId, episodeString, translationType);
    episodeInfoData = infoData?.episodeInfo;
  } catch (e) {
    // EpisodeInfo query may fail - that's expected
  }

  // Fetch and decrypt direct sources (this is the key part)
  try {
    const result = await episodeDirectSources(showId, episodeString, translationType);
    directSources = result.sources || [];
  } catch (e) {
    // Direct source fetch may fail - fall back to embed
  }

  // Process source URLs into a clean array
  const sources = [];

  // Add decrypted direct sources first (these are actual video URLs like m3u8)
  for (const s of directSources) {
    sources.push({
      ...s,
      type: s.sourceUrl && s.sourceUrl.includes('.m3u8') ? 'hls' : 'direct',
      priority: 100,
    });
  }

  // Add embed URL as a fallback
  sources.push({
    sourceName: 'AllAnime Embed',
    sourceUrl: embedUrl,
    type: 'embed',
    priority: 10,
  });

  // Parse sourceUrls if they exist
  if (ep && ep.sourceUrls) {
    try {
      const sourceUrls = typeof ep.sourceUrls === 'string'
        ? JSON.parse(ep.sourceUrls)
        : ep.sourceUrls;

      if (Array.isArray(sourceUrls)) {
        for (const source of sourceUrls) {
          sources.push({
            sourceName: source.sourceName || 'Unknown',
            sourceUrl: source.sourceUrl || source.sourceName,
            streamerId: source.streamerId,
            priority: source.priority || 0,
          });
        }
      }
    } catch (e) {
      if (typeof ep.sourceUrls === 'string') {
        sources.push({ sourceName: 'Direct', sourceUrl: ep.sourceUrls });
      }
    }
  }

  // Process episodeInfo for video sources
  if (episodeInfoData) {
    const vidKey = `vidInfors${translationType}`;
    const vidInfo = episodeInfoData[vidKey];

    if (vidInfo) {
      try {
        const parsed = typeof vidInfo === 'string' ? JSON.parse(vidInfo) : vidInfo;
        if (Array.isArray(parsed)) {
          for (const v of parsed) {
            sources.push({
              sourceName: v.sourceName || 'Stream',
              sourceUrl: v.sourceUrl,
              streamerId: v.streamerId,
              priority: v.priority || 1,
              links: v.links || [],
            });
          }
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }

  return {
    ...(ep || {}),
    episodeInfo: episodeInfoData,
    sources,
    embedUrl,
    watchUrl,
  };
}

// ============================================================
// SEARCH
// ============================================================

const FAST_SEARCH_QUERY = `
  query FastSearch($search: SearchInput!) {
    fastSearch(search: $search) {
      anyCards {
        _id
        name
        englishName
        nativeName
        type
        thumbnail
        score
        status
        genres
        episodeCount
        chapterCount
        availableEpisodesDetail
        availableChaptersDetail
        format
      }
    }
  }
`;

/**
 * Fast search across anime and manga.
 * Falls back to shows query if fastSearch is unavailable.
 */
async function fastSearch(queryStr, limit = 10) {
  try {
    const data = await graphql(FAST_SEARCH_QUERY, {
      search: { query: queryStr, allowAdult: true },
    });
    if (data && data.fastSearch) return data.fastSearch;
  } catch (e) {
    // fastSearch failed, fall through to shows-based search
  }

  // Fallback: search using shows and mangas queries
  const [showsData, mangasData] = await Promise.all([
    graphql(
      `query SearchShows($search: SearchInput) { shows(search: $search, limit: ${limit}) { edges { _id name englishName nativeName type thumbnail score status genres episodeCount } } }`,
      { search: { query: queryStr, allowAdult: true } }
    ),
    graphql(
      `query SearchMangas($search: SearchInput) { mangas(search: $search, limit: ${limit}) { edges { _id name englishName type thumbnail score status chapterCount } } }`,
      { search: { query: queryStr, allowAdult: true } }
    ),
  ]);

  const anyCards = [
    ...(showsData?.shows?.edges || []).map(e => ({ ...e, format: 'anime' })),
    ...(mangasData?.mangas?.edges || []).map(e => ({ ...e, format: 'manga' })),
  ];

  return { anyCards };
}

// ============================================================
// MANGAS
// ============================================================

const MANGAS_QUERY = `
  query Mangas($search: SearchInput, $page: Int, $limit: Int, $translationType: VaildTranslationTypeMangaEnumType, $countryOrigin: VaildCountryOriginEnumType) {
    mangas(search: $search, page: $page, limit: $limit, translationType: $translationType, countryOrigin: $countryOrigin) {
      edges {
        _id
        name
        englishName
        nativeName
        altNames
        description
        score
        popularity
        status
        type
        genres
        tags
        thumbnail
        banner
        chapterCount
        volumes
        authors
        magazine
        airedStart
        airedEnd
        isAdult
        availableChaptersDetail
        countryOfOrigin
      }
      pageInfo {
        total
        hasNextPage
        nextPage
        page
      }
    }
  }
`;

/**
 * Get a paginated list of mangas.
 */
async function mangas({ page = 1, limit = 20, translationType, countryOrigin, search } = {}) {
  const variables = { page, limit };
  if (translationType) variables.translationType = translationType.toLowerCase();
  if (countryOrigin) variables.countryOrigin = countryOrigin.toUpperCase();
  if (search) {
    if (search.sortBy && typeof search.sortBy === 'object') {
      search.sortDirection = (search.sortBy.order === 'DESC' || search.sortBy.order === 'DSC') ? 'DSC' : 'ASC';
      search.sortBy = search.sortBy.property;
    }
  }

  const data = await graphql(MANGAS_QUERY, variables);
  return data.mangas;
}

const MANGA_QUERY = `
  query Manga($_id: String!) {
    manga(_id: $_id) {
      _id
      name
      englishName
      nativeName
      altNames
      description
      score
      popularity
      status
      type
      genres
      tags
      thumbnail
      banner
      thumbnails
      chapterCount
      volumes
      authors
      magazine
      airedStart
      airedEnd
      isAdult
      availableChaptersDetail
      countryOfOrigin
      rating
    }
  }
`;

/**
 * Get a single manga by ID.
 */
async function manga(mangaId) {
  const data = await graphql(MANGA_QUERY, { _id: mangaId });
  return data.manga;
}

// ============================================================
// CHAPTERS (Manga)
// ============================================================

const CHAPTERS_QUERY = `
  query Chapters($mangaId: String!, $page: Int, $limit: Int) {
    chaptersForRead(mangaId: $mangaId, page: $page, limit: $limit) {
      edges {
        _id
        mangaId
        chapterString
        chapterNumStart
        chapterNumEnd
        notes
        chapterAiredDateString
        volume
        translationType
        thumbnail
        sourceUrl
        sourceName
        streamerId
        priority
        pictureUrls
        pictureUrlHead
      }
      pageInfo {
        total
        hasNextPage
        nextPage
        page
      }
      manga {
        _id
        name
        englishName
        thumbnail
      }
    }
  }
`;

/**
 * Get chapters for a manga.
 */
async function chaptersForRead(mangaId, { page = 1, limit = 50 } = {}) {
  const data = await graphql(CHAPTERS_QUERY, { mangaId, page, limit });
  return data.chaptersForRead;
}

const CHAPTER_PAGES_QUERY = `
  query ChapterPages($chapterId: String!) {
    chapterPages(chapterId: $chapterId) {
      _id
      mangaId
      chapterString
      chapterNumStart
      chapterNumEnd
      pictureUrls
      pictureUrlHead
      sourceUrl
      sourceName
    }
  }
`;

/**
 * Get pages for a specific chapter.
 */
async function chapterPages(chapterId) {
  const data = await graphql(CHAPTER_PAGES_QUERY, { chapterId });
  return data.chapterPages;
}

// ============================================================
// POPULAR & RECOMMENDATIONS
// ============================================================

const QUERY_POPULAR_QUERY = `
  query QueryPopular($type: VaildPopularTypeEnumType!, $size: Int!, $page: Int, $allowAdult: Boolean) {
    queryPopular(type: $type, size: $size, page: $page, allowAdult: $allowAdult) {
      recommendations {
        anyCard {
          _id
          name
          englishName
          type
          thumbnail
          score
          status
          episodeCount
          chapterCount
        }
        isManga
      }
      total
    }
  }
`;

/**
 * Get popular anime/manga.
 */
async function queryPopular(type = 'anime', { size = 20, page = 1, allowAdult = true } = {}) {
  const data = await graphql(QUERY_POPULAR_QUERY, {
    type: type.toLowerCase(),
    size,
    page,
    allowAdult,
  });
  return data.queryPopular;
}

const QUERY_RECOMMENDATION_QUERY = `
  query QueryRecommendation($pageSearch: queryPageInput!) {
    queryRecommendation(pageSearch: $pageSearch) {
      recommendations {
        anyCard {
          _id
          name
          englishName
          type
          thumbnail
          score
          status
          episodeCount
          chapterCount
        }
        isManga
      }
      total
    }
  }
`;

/**
 * Get recommendations.
 * @param {Object} opts
 * @param {string} opts.type - Popular type enum ('anime', 'manga', 'all'). Default 'anime'.
 * @param {string} opts.pageType - Recommendation enum ('ep_cp', 'anime_manga', 'music'). Default 'ep_cp'.
 * @param {number} opts.size - Number of results.
 * @param {number} opts.page - Page number.
 */
async function queryRecommendation({ type = 'anime', size = 20, page = 1, pageType = 'ep_cp', allowAdult = true } = {}) {
  const data = await graphql(QUERY_RECOMMENDATION_QUERY, {
    pageSearch: {
      type: type.toLowerCase(),
      size,
      page,
      pageType,
      allowAdult,
    },
  });
  return data.queryRecommendation;
}

const QUERY_RANDOM_RECOMMENDATION_QUERY = `
  query QueryRandomRecommendation($format: String!, $allowAdult: Boolean) {
    queryRandomRecommendation(format: $format, allowAdult: $allowAdult) {
      _id
      name
      englishName
      type
      thumbnail
      score
      status
      episodeCount
      chapterCount
    }
  }
`;

/**
 * Get random recommendations.
 */
async function queryRandomRecommendation(format = 'anime', allowAdult = true) {
  const data = await graphql(QUERY_RANDOM_RECOMMENDATION_QUERY, { format, allowAdult });
  return data.queryRandomRecommendation;
}

// ============================================================
// PLAYLISTS
// ============================================================

const SHOWS_WITH_PLAYLIST_QUERY = `
  query ShowsWithPlaylistId($playlistId: String!, $page: Int, $limit: Int, $visitor: Int) {
    showsWithPlaylistId(playlistId: $playlistId, page: $page, limit: $limit, visitor: $visitor) {
      edges {
        _id
        name
        englishName
        type
        thumbnail
        score
        episodeCount
        availableEpisodesDetail
      }
      pageInfo {
        total
        hasNextPage
        page
      }
    }
  }
`;

/**
 * Get shows associated with a playlist.
 */
async function showsWithPlaylistId(playlistId, { page = 1, limit = 20, visitor } = {}) {
  const variables = { playlistId, page, limit };
  if (visitor !== undefined) variables.visitor = visitor;

  const data = await graphql(SHOWS_WITH_PLAYLIST_QUERY, variables);
  return data.showsWithPlaylistId;
}

// ============================================================
// CHARACTERS
// ============================================================

const CHARACTERS_QUERY = `
  query Characters($search: CharacterSearch) {
    characters(search: $search) {
      edges {
        _id
        name
        image
        description
        gender
        age
        relatedRoles {
          role
          anyCard {
            _id
            name
            englishName
            type
            thumbnail
          }
          voiceActors {
            language
            staff {
              _id
              name
              image
            }
          }
        }
      }
      pageInfo {
        total
        hasNextPage
        page
      }
    }
  }
`;

/**
 * Search characters.
 */
async function characters(search = {}) {
  const data = await graphql(CHARACTERS_QUERY, { search });
  return data.characters;
}

// ============================================================
// TAGS
// ============================================================

const QUERY_TAGS_QUERY = `
  query QueryTags($search: TagSearchInput!) {
    queryTags(search: $search) {
      edges {
        _id
        name
        slug
        animeCount
        mangaCount
        tagType
        sampleAnime {
          _id
          name
          thumbnail
        }
      }
      pageInfo {
        total
        hasNextPage
        page
      }
    }
  }
`;

/**
 * Query tags.
 */
async function queryTags(search = {}) {
  const data = await graphql(QUERY_TAGS_QUERY, { search });
  return data.queryTags;
}

// ============================================================
// MUSIC
// ============================================================

const MUSICS_QUERY = `
  query Musics($search: MusicSearchInput, $page: Int, $limit: Int) {
    musics(search: $search, page: $page, limit: $limit) {
      edges {
        _id
        musicTitle
        artist
        type
        cover
        duration
        album
        show {
          showId
          name
          thumbnail
        }
        musicUrls
        listens
        likes
      }
      pageInfo {
        total
        hasNextPage
        page
      }
    }
  }
`;

/**
 * Query music.
 */
async function musics(search = {}, { page = 1, limit = 20 } = {}) {
  const data = await graphql(MUSICS_QUERY, { search, page, limit });
  return data.musics;
}

// ============================================================
// COMMENTS & REVIEWS
// ============================================================

const QUERY_COMMENTS_QUERY = `
  query QueryComments($search: CommentsSearch!) {
    queryComments(search: $search) {
      edges {
        _id
        referenceId
        userId
        user {
          _id
          displayName
          picture
        }
        comment
        createdDate
        likesCount
        dislikesCount
        commentCount
      }
      pageInfo {
        total
        hasNextPage
        page
      }
    }
  }
`;

/**
 * Query comments for a show/episode.
 */
async function queryComments(search = {}) {
  const data = await graphql(QUERY_COMMENTS_QUERY, { search });
  return data.queryComments;
}

const QUERY_REVIEWS_QUERY = `
  query QueryReviews($search: ReviewsSearch!) {
    queryReviews(search: $search) {
      edges {
        _id
        showId
        episodeIdNum
        user {
          _id
          displayName
          picture
        }
        comment
        uScore
        createdDate
        likesCount
        dislikesCount
      }
      pageInfo {
        total
        hasNextPage
        page
      }
    }
  }
`;

/**
 * Query reviews for a show.
 */
async function queryReviews(search = {}) {
  const data = await graphql(QUERY_REVIEWS_QUERY, { search });
  return data.queryReviews;
}

// ============================================================
// WATCH STATE / WATCH LIST
// ============================================================

const WATCH_STATE_QUERY = `
  query WatchState($showId: String!) {
    watchState(showId: $showId) {
      _id
      showId
      isManga
      watching
      dropped
      completed
      planned
      held
      watchingCount
      droppedCount
      completedCount
      plannedCount
      heldCount
      lastEpisodeTimestamp
    }
  }
`;

/**
 * Get watch state for a show.
 */
async function watchState(showId) {
  const data = await graphql(WATCH_STATE_QUERY, { showId });
  return data.watchState;
}

// ============================================================
// UTILITY: Generate embed URL
// ============================================================

/**
 * Generate the AllAnime embed URL (works when opened in a browser tab).
 * May be blocked by CSP when embedded in an iframe.
 */
function generateEmbedUrl(showId, episodeString, translationType = 'sub') {
  return `${EMBED_BASE}?animeiframe=${showId}/${episodeString}/${translationType}`;
}

/**
 * Generate the mkissa.to direct watch page URL.
 * This is the actual player page that users open in their browser.
 * Format: https://mkissa.to/anime/{showId}/p-{episodeString}-{translationType}
 */
function generateWatchUrl(showId, episodeString, translationType = 'sub') {
  return `${WATCH_BASE}/${showId}/p-${episodeString}-${translationType}`;
}

/**
 * Full search using the shows query with comprehensive filtering.
 * Accepts tr (translationType), cty (countryOrigin), sortBy, sortDirection, page, limit.
 * Returns results in anyCards format compatible with frontend SearchResult.
 */
async function searchAnime({ query, tr, cty, sortBy, sortDirection, page = 1, limit = 40 } = {}) {
  const search = { query, allowAdult: true };
  if (sortBy) {
    // SortBy is a GraphQL enum — pass the value directly (e.g., Trending, Latest_Update)
    // Sort order is baked into the enum value (e.g., Name_ASC, Name_DESC)
    search.sortBy = sortBy;
  }

  const data = await graphql(SHOWS_QUERY, {
    page,
    limit,
    search,
    translationType: tr || undefined,
    countryOrigin: cty || undefined,
  });

  const showsData = data.shows;
  const anyCards = (showsData.edges || []).map(e => ({
    ...e,
    format: 'anime',
  }));

  return {
    anyCards,
    pageInfo: showsData.pageInfo,
  };
}

module.exports = {
  graphql,
  // Shows
  shows,
  show,
  searchAnime,
  showsWithIds,
  showsWithPlaylistId,
  // Episodes
  episodes,
  episode,
  episodeInfo,
  episodeInfos,
  episodeWithSources,
  episodeDirectSources,
  // Search
  fastSearch,
  // Mangas
  mangas,
  manga,
  // Chapters
  chaptersForRead,
  chapterPages,
  // Popular & Recommendations
  queryPopular,
  queryRecommendation,
  queryRandomRecommendation,
  // Characters
  characters,
  // Tags
  queryTags,
  // Music
  musics,
  // Comments & Reviews
  queryComments,
  queryReviews,
  // Watch State
  watchState,
  // Utility
  generateEmbedUrl,
  generateWatchUrl,
};
