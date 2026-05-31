/**
 * In-memory cache with TTL (time-to-live).
 *
 * Stores API responses so we don't hit the upstream AllAnime API on every request.
 * Entries expire after a configurable TTL and are lazily evicted on read.
 * A maximum size limit prevents memory leaks.
 */

// ── TTL presets (in seconds) ───────────────────────────────────
// These map to the expected staleness of each data type.
export const TTL = {
  SHOWS:        300,    // 5 min  — browse listings change infrequently
  SHOW:         600,    // 10 min — show details are very stable
  SEARCH:       300,    // 5 min  — search results
  EPISODES:     600,    // 10 min — episode lists rarely change
  EPISODE:      300,    // 5 min  — single episode
  STREAMS:      120,    // 2 min  — source URLs can expire/rotate
  POPULAR:      600,    // 10 min — popular lists
  RECOMMEND:    600,    // 10 min — recommendations
  CATEGORIES:   3600,   // 1 hr   — essentially static
  GENRES:       3600,   // 1 hr   — essentially static
  CHARACTERS:   600,    // 10 min
  TAGS:         600,    // 10 min
  MUSIC:        600,    // 10 min
  COMMENTS:     120,    // 2 min  — user-generated, could change
  REVIEWS:      300,    // 5 min
  WATCH_STATE:  120,    // 2 min  — could change
  PLAYLISTS:    600,    // 10 min
  DEFAULT:      300,    // 5 min  — fallback
};

const MAX_SIZE = 500;

/**
 * @type {Map<string, { data: any, expires: number }>}
 */
const store = new Map();

/**
 * Derive a readable, deterministic cache key from a GraphQL query + variables.
 * We extract the query operation name (e.g. "Shows") for readability.
 */
function cacheKey(query, variables = {}) {
  const nameMatch = query.match(/query\s+(\w+)/);
  const queryName = nameMatch ? nameMatch[1] : 'unknown';
  // Sort keys so the same data always produces the same string
  const sorted = Object.keys(variables).sort().reduce((acc, k) => {
    acc[k] = variables[k];
    return acc;
  }, {});
  return `${queryName}:${JSON.stringify(sorted)}`;
}

/**
 * Look up a cached entry.  Returns the data or `null` if expired / missing.
 */
function get(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    store.delete(key);
    return null;
  }
  return entry.data;
}

/**
 * Store data in the cache with the given TTL (in seconds).
 */
function set(key, data, ttlSeconds = TTL.DEFAULT) {
  // Evict the oldest entry if we're at capacity
  if (store.size >= MAX_SIZE) {
    const oldest = store.keys().next().value;
    if (oldest !== undefined) store.delete(oldest);
  }
  store.set(key, {
    data,
    expires: Date.now() + ttlSeconds * 1000,
  });
}

/**
 * Invalidate a single key or all keys matching a prefix.
 * Useful if we ever add a manual refresh mechanism.
 */
function invalidate(keyOrPrefix) {
  if (store.has(keyOrPrefix)) {
    store.delete(keyOrPrefix);
    return;
  }
  // Treat as prefix — delete every key that starts with it
  for (const key of store.keys()) {
    if (key.startsWith(keyOrPrefix)) {
      store.delete(key);
    }
  }
}

/**
 * Return the number of entries currently in the cache (for diagnostics).
 */
function size() {
  return store.size;
}

/**
 * Clear the entire cache.
 */
function clear() {
  store.clear();
}

export {
  cacheKey,
  get,
  set,
  invalidate,
  size,
  clear,
};
