// ============================================================
// AllManga - SPA Client
// ============================================================

const API_BASE = '/api';
const SHOWS_PER_PAGE = 20;

// ============================================================
// State
// ============================================================

const state = {
  currentPage: 1,
  currentQuery: '',
  currentSort: 'Trending',
  currentType: '',
  totalShows: 0,
  shows: [],
  showDetail: null,
  episodes: [],
  episodeTranslationType: 'sub',
  currentEpisodeList: [],
  isLoading: false,
  error: null,
};

// ============================================================
// Helpers
// ============================================================

function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function showToast(message, type = 'info') {
  const container = $('#toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function formatNumber(n) {
  if (!n) return '0';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

function getThumbnailUrl(show) {
  if (show.thumbnail) return show.thumbnail;
  if (show.poster) return show.poster;
  return null;
}

function getShowName(show) {
  return show.name || show.englishName || 'Unknown';
}

function getShowStatus(show) {
  if (!show.status) return null;
  const map = { '0': 'Finished', '1': 'Releasing', '2': 'Not yet aired', '3': 'Cancelled' };
  return map[show.status] || show.status;
}

function getScoreDisplay(show) {
  if (show.score && show.score.averageScore) {
    return (show.score.averageScore / 10).toFixed(1);
  }
  return null;
}

// ============================================================
// API Calls
// ============================================================

async function apiFetch(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function fetchShows(page = 1, query = '', sort = 'Trending', type = '') {
  const params = new URLSearchParams({ page, limit: SHOWS_PER_PAGE });
  if (query) params.set('query', query);
  if (sort) params.set('sortBy', sort);
  if (type) params.set('type', type);
  return apiFetch(`/shows?${params}`);
}

async function fetchShowDetail(id) {
  return apiFetch(`/shows/${id}`);
}

async function fetchEpisodes(showId, translationType = 'sub') {
  return apiFetch(`/shows/${showId}/episodes?translationType=${translationType}`);
}

async function fetchStreams(showId, episodeString, translationType = 'sub') {
  return apiFetch(`/shows/${showId}/streams/${episodeString}?translationType=${translationType}`);
}

async function fetchSearch(query) {
  return apiFetch(`/search?q=${encodeURIComponent(query)}`);
}

async function fetchCategories() {
  return apiFetch('/categories');
}

// ============================================================
// Router
// ============================================================

function navigate(hash) {
  window.location.hash = hash;
}

function getRoute() {
  const hash = window.location.hash.slice(1) || '/';
  const parts = hash.split('/').filter(Boolean);

  if (parts[0] === 'watch' && parts[1]) {
    return { page: 'watch', showId: parts[1], episode: parts[2] || '1' };
  }
  if (parts[0] === 'show' && parts[1]) {
    return { page: 'show', id: parts[1] };
  }
  return { page: 'home' };
}

function handleRoute() {
  const route = getRoute();
  switch (route.page) {
    case 'show':
      renderShowPage(route.id);
      break;
    case 'watch':
      renderWatchPage(route.showId, route.episode);
      break;
    default:
      renderHomePage();
  }
}

// ============================================================
// Home Page
// ============================================================

async function renderHomePage() {
  const app = $('#app');
  app.innerHTML = `
    <div class="section" style="margin-top: 32px;">
      <div class="section-header">
        <div>
          <h1 class="page-title">${state.currentQuery ? `Results for "${escapeHtml(state.currentQuery)}"` : 'Browse Anime'}</h1>
          <p class="page-subtitle" id="subtitle">Loading shows...</p>
        </div>
        <div class="section-actions">
          <div class="view-toggle">
            <button class="active" data-view="grid" title="Grid view">▦</button>
            <button data-view="list" title="List view">☰</button>
          </div>
        </div>
      </div>
      <div class="filters-bar">
        <select class="filter-select" id="sortSelect">
          <option value="Trending" ${state.currentSort === 'Trending' ? 'selected' : ''}>Trending</option>
          <option value="Score" ${state.currentSort === 'Score' ? 'selected' : ''}>Highest Rated</option>
          <option value="Name" ${state.currentSort === 'Name' ? 'selected' : ''}>Name (A-Z)</option>
          <option value="Latest" ${state.currentSort === 'Latest' ? 'selected' : ''}>Latest</option>
        </select>
        <select class="filter-select" id="typeSelect">
          <option value="">All Types</option>
          <option value="TV" ${state.currentType === 'TV' ? 'selected' : ''}>TV</option>
          <option value="Movie" ${state.currentType === 'Movie' ? 'selected' : ''}>Movie</option>
          <option value="OVA" ${state.currentType === 'OVA' ? 'selected' : ''}>OVA</option>
          <option value="ONA" ${state.currentType === 'ONA' ? 'selected' : ''}>ONA</option>
          <option value="Special" ${state.currentType === 'Special' ? 'selected' : ''}>Special</option>
        </select>
        <button class="btn btn-secondary btn-sm" id="showsRefreshBtn">↻ Refresh</button>
      </div>
      <div class="shows-grid" id="showsGrid">
        ${Array.from({ length: 8 }, () => `
          <div class="show-card">
            <div class="loading-skeleton" style="aspect-ratio:3/4;width:100%"></div>
            <div class="show-card-body">
              <div class="loading-skeleton" style="height:16px;width:80%;margin-bottom:6px"></div>
              <div class="loading-skeleton" style="height:12px;width:50%"></div>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="pagination" id="pagination"></div>
      <div class="empty-state" id="emptyState" style="display:none">
        <div class="empty-state-icon">🎬</div>
        <h3>No shows found</h3>
        <p>Try adjusting your filters or search query.</p>
      </div>
    </div>
  `;

  // Attach event listeners
  $('#sortSelect').addEventListener('change', (e) => {
    state.currentSort = e.target.value;
    state.currentPage = 1;
    loadHomeShows();
  });
  $('#typeSelect').addEventListener('change', (e) => {
    state.currentType = e.target.value;
    state.currentPage = 1;
    loadHomeShows();
  });
  $('#showsRefreshBtn').addEventListener('click', () => {
    state.currentPage = 1;
    loadHomeShows();
  });

  // View toggle
  $$('.view-toggle button').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.view-toggle button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const grid = $('#showsGrid');
      if (btn.dataset.view === 'list') {
        grid.style.gridTemplateColumns = '1fr';
      } else {
        grid.style.gridTemplateColumns = '';
      }
    });
  });

  await loadHomeShows();
}

async function loadHomeShows() {
  const grid = $('#showsGrid');
  const subtitle = $('#subtitle');
  const pagination = $('#pagination');
  const emptyState = $('#emptyState');

  if (!grid) return;

  state.isLoading = true;

  try {
    const data = await fetchShows(
      state.currentPage,
      state.currentQuery,
      state.currentSort,
      state.currentType
    );

    state.shows = data.edges || [];
    state.totalShows = data.pageInfo?.total || state.shows.length;

    if (state.shows.length === 0) {
      grid.innerHTML = '';
      pagination.innerHTML = '';
      emptyState.style.display = 'block';
      subtitle.textContent = 'No shows found.';
      return;
    }

    emptyState.style.display = 'none';
    subtitle.textContent = `${formatNumber(state.totalShows)} shows found`;

    // Render grid
    grid.innerHTML = state.shows.map(show => {
      const thumb = getThumbnailUrl(show);
      const name = getShowName(show);
      const score = getScoreDisplay(show);
      const epCount = show.availableEpisodesDetail?.sub?.length || show.episodeCount || 0;
      const status = getShowStatus(show);
      const type = show.type || '';

      return `
        <div class="show-card" data-id="${escapeHtml(show._id)}" role="link" tabindex="0">
          ${status ? `<div class="show-card-badge">${escapeHtml(status)}</div>` : ''}
          ${thumb
            ? `<img class="show-card-thumb" src="${escapeHtml(thumb)}" alt="${escapeHtml(name)}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'show-card-thumb-placeholder\\'>🎬</div>'">`
            : `<div class="show-card-thumb-placeholder">🎬</div>`
          }
          <div class="show-card-body">
            <div class="show-card-title">${escapeHtml(name)}</div>
            <div class="show-card-meta">
              ${score ? `<span class="show-card-score">★ ${score}</span>` : ''}
              ${type ? `<span>${escapeHtml(type)}</span>` : ''}
              ${epCount ? `<span class="show-card-episodes">${epCount} ep</span>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach click handlers
    grid.querySelectorAll('.show-card').forEach(card => {
      card.addEventListener('click', () => navigate(`/show/${card.dataset.id}`));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') navigate(`/show/${card.dataset.id}`);
      });
    });

    // Pagination
    const totalPages = Math.ceil(state.totalShows / SHOWS_PER_PAGE);
    const maxVisible = 7;
    renderPagination(pagination, state.currentPage, totalPages, maxVisible, (page) => {
      state.currentPage = page;
      loadHomeShows();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

  } catch (err) {
    console.error('Failed to load shows:', err);
    grid.innerHTML = `<div class="empty-state">
      <div class="empty-state-icon">⚠️</div>
      <h3>Failed to load shows</h3>
      <p>${escapeHtml(err.message)}</p>
      <button class="btn btn-primary btn-sm" onclick="location.reload()" style="margin-top:16px">Retry</button>
    </div>`;
    subtitle.textContent = 'Error loading shows';
    pagination.innerHTML = '';
  }

  state.isLoading = false;
}

function renderPagination(container, current, total, maxVisible, onPage) {
  if (total <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = '';
  html += `<button class="page-btn" ${current <= 1 ? 'disabled' : ''} data-page="${current - 1}">‹</button>`;

  let start = Math.max(1, current - Math.floor(maxVisible / 2));
  let end = Math.min(total, start + maxVisible - 1);
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1);
  }

  if (start > 1) {
    html += `<button class="page-btn" data-page="1">1</button>`;
    if (start > 2) html += `<span class="page-info">…</span>`;
  }

  for (let i = start; i <= end; i++) {
    html += `<button class="page-btn ${i === current ? 'active' : ''}" data-page="${i}">${i}</button>`;
  }

  if (end < total) {
    if (end < total - 1) html += `<span class="page-info">…</span>`;
    html += `<button class="page-btn" data-page="${total}">${total}</button>`;
  }

  html += `<button class="page-btn" ${current >= total ? 'disabled' : ''} data-page="${current + 1}">›</button>`;

  container.innerHTML = html;

  container.querySelectorAll('.page-btn:not(:disabled)').forEach(btn => {
    btn.addEventListener('click', () => onPage(parseInt(btn.dataset.page)));
  });
}

// ============================================================
// Show Detail Page
// ============================================================

async function renderShowPage(id) {
  const app = $('#app');
  app.innerHTML = `
    <div style="margin-top: 24px;">
      <button class="back-btn" id="backBtn">← Back to browse</button>
    </div>
    <div class="loading-spinner">
      <div class="spinner"></div>
    </div>
  `;

  $('#backBtn').addEventListener('click', () => navigate('/'));

  try {
    const show = await fetchShowDetail(id);
    state.showDetail = show;
    renderShowDetail(show);
  } catch (err) {
    app.innerHTML = `
      <div style="margin-top: 24px;">
        <button class="back-btn" id="backBtn2">← Back to browse</button>
      </div>
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <h3>Failed to load show</h3>
        <p>${escapeHtml(err.message)}</p>
      </div>
    `;
    $('#backBtn2').addEventListener('click', () => navigate('/'));
  }
}

function renderShowDetail(show) {
  const app = $('#app');
  const thumb = getThumbnailUrl(show);
  const name = getShowName(show);
  const altName = show.englishName && show.englishName !== name ? show.englishName : null;
  const score = getScoreDisplay(show);
  const status = getShowStatus(show);
  const type = show.type || '';
  const season = (() => {
    if (!show.season) return '';
    // AllAnime returns season as { quarter: 'Spring', year: 2026 }
    if (typeof show.season === 'object' && show.season.quarter) {
      const q = show.season.quarter;
      return q.charAt(0).toUpperCase() + q.slice(1).toLowerCase();
    }
    // If it's a number: 1=Winter, 2=Spring, 3=Summer, 4=Fall
    if (typeof show.season === 'number') {
      const seasonNames = ['', 'Winter', 'Spring', 'Summer', 'Fall'];
      if (show.season >= 1 && show.season <= 4) return seasonNames[show.season];
    }
    // If it's a string (e.g. "WINTER"), format it
    if (typeof show.season === 'string') {
      return show.season.charAt(0).toUpperCase() + show.season.slice(1).toLowerCase();
    }
    return '';
  })();
  const year = show.year || '';
  const epCount = show.availableEpisodesDetail?.sub?.length || show.episodeCount || 0;
  const description = show.description || show.description || '';
  const genres = show.genres || [];

  app.innerHTML = `
    <div style="margin-top: 24px;">
      <button class="back-btn" id="backBtn">← Back to browse</button>
    </div>

    <div class="show-detail-header" style="margin-top:0">
      <div class="show-detail-bg">
        ${thumb ? `<img src="${escapeHtml(thumb)}" alt="">` : ''}
      </div>
      <div class="show-detail-content">
        <div class="show-detail-poster">
          ${thumb
            ? `<img src="${escapeHtml(thumb)}" alt="${escapeHtml(name)}">`
            : `<div class="placeholder">🎬</div>`
          }
        </div>
        <div class="show-detail-info">
          <h1>${escapeHtml(name)}</h1>
          ${altName ? `<div class="show-detail-alt-title">${escapeHtml(altName)}</div>` : ''}
          <div class="show-detail-meta">
            ${score ? `<span class="tag score">★ ${score}</span>` : ''}
            ${type ? `<span class="tag">${escapeHtml(type)}</span>` : ''}
            ${season ? `<span class="tag">${escapeHtml(season)}</span>` : ''}
            ${year ? `<span class="tag">${escapeHtml(year)}</span>` : ''}
            ${status ? `<span class="tag status">${escapeHtml(status)}</span>` : ''}
            ${epCount ? `<span class="tag">${epCount} episodes</span>` : ''}
          </div>
          ${description ? `<p class="show-detail-description">${escapeHtml(description)}</p>` : ''}
          ${genres.length > 0 ? `
            <div class="show-detail-genres">
              ${genres.map(g => `<span class="genre-tag">${escapeHtml(g)}</span>`).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-header">
        <h2 class="section-title">Episodes</h2>
        <div class="section-actions">
          <button class="btn btn-primary btn-sm" id="watchFirstEpBtn" ${epCount === 0 ? 'disabled' : ''}>
            ▶ Watch Latest
          </button>
        </div>
      </div>

      <div class="episode-filters" id="episodeFilters">
        <button class="episode-filter-btn active" data-type="sub">Sub</button>
        <button class="episode-filter-btn" data-type="dub">Dub</button>
        <button class="episode-filter-btn" data-type="raw">Raw</button>
      </div>

      <div id="episodeList">
        <div class="loading-spinner"><div class="spinner"></div></div>
      </div>
    </div>
  `;

  // Back button
  $('#backBtn').addEventListener('click', () => navigate('/'));

  // Watch first episode
  $('#watchFirstEpBtn').addEventListener('click', () => {
    const type = state.episodeTranslationType || 'sub';
    const eps = show.availableEpisodesDetail?.[type] || [];
    if (eps.length > 0) {
      navigate(`/watch/${show._id}/${eps[eps.length - 1]}`);
    }
  });

  // Episode type filter
  $$('.episode-filter-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      $$('.episode-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.episodeTranslationType = btn.dataset.type;
      await loadEpisodesList(show._id, btn.dataset.type, show.availableEpisodesDetail);
    });
  });

  // Load episodes
  loadEpisodesList(show._id, 'sub', show.availableEpisodesDetail);
}

async function loadEpisodesList(showId, type, availableDetail) {
  const container = $('#episodeList');
  if (!container) return;

  const eps = availableDetail?.[type] || [];
  if (eps.length === 0) {
    // Try the API directly
    try {
      const data = await fetchEpisodes(showId, type);
      const edges = data.edges || [];
      if (edges.length > 0) {
        renderEpisodeList(container, edges.map(e => e.episodeString).filter(Boolean), showId);
        return;
      }
    } catch {}
    container.innerHTML = '<div class="empty-state" style="padding:40px"><h3>No episodes available</h3><p>Check another translation type.</p></div>';
    return;
  }

  renderEpisodeList(container, eps, showId);
}

function renderEpisodeList(container, episodes, showIdOverride) {
  // Show latest episodes first, grouped
  const sorted = [...episodes].sort((a, b) => {
    const na = parseInt(a, 10);
    const nb = parseInt(b, 10);
    if (!isNaN(na) && !isNaN(nb)) return nb - na;
    return String(b).localeCompare(String(a));
  });

  const showId = showIdOverride || state.showDetail?._id;

  container.innerHTML = `
    <div style="margin-bottom:12px">
      <span style="color:var(--text-muted);font-size:13px">${sorted.length} episodes</span>
    </div>
    <div class="episode-grid" id="epGrid">
      ${sorted.map(ep => `
        <div class="episode-card" data-show="${escapeHtml(showId)}" data-ep="${escapeHtml(ep)}" data-type="${state.episodeTranslationType}">
          <div class="ep-num">${escapeHtml(ep)}</div>
          <div class="ep-label">Episode</div>
        </div>
      `).join('')}
    </div>
  `;

  // Attach click handlers
  $('#epGrid').querySelectorAll('.episode-card').forEach(card => {
    card.addEventListener('click', () => {
      navigate(`/watch/${card.dataset.show}/${card.dataset.ep}?type=${card.dataset.type}`);
    });
  });
}

// ============================================================
// Watch / Player Page
// ============================================================

let playerIframe = null;
let watchEpisodesList = [];
let watchKeyHandlerRef = null;

function cleanupWatchPage() {
  if (playerIframe) {
    playerIframe.remove();
    playerIframe = null;
  }
  if (watchKeyHandlerRef) {
    document.removeEventListener('keydown', watchKeyHandlerRef);
    watchKeyHandlerRef = null;
  }
  watchEpisodesList = [];
}

async function renderWatchPage(showId, episode) {
  const params = new URLSearchParams(window.location.search);
  const translationType = params.get('type') || 'sub';

  // Clean up previous watch page resources
  cleanupWatchPage();

  const app = $('#app');
  app.innerHTML = `
    <div class="watch-container">
      <div class="watch-nav">
        <div class="watch-nav-left">
          <button class="btn btn-ghost btn-icon" id="watchBackBtn" title="Back to show">←</button>
          <div>
            <div class="watch-nav-title" id="watchTitle">Loading...</div>
            <div class="watch-nav-ep" id="watchEpLabel">Episode ${escapeHtml(episode)}</div>
          </div>
        </div>
        <div class="watch-nav-right">
          <button class="btn btn-ghost btn-icon" id="watchPrevBtn" title="Previous episode">◀</button>
          <button class="btn btn-ghost btn-icon" id="watchNextBtn" title="Next episode">▶</button>
          <button class="btn btn-secondary btn-sm" id="watchEpListToggle">☰ Episodes</button>
        </div>
      </div>
      <div class="watch-player-wrap" id="playerWrap">
        <div class="watch-player-loading" id="playerLoading">
          <div class="spinner"></div>
          <span>Loading stream...</span>
        </div>
      </div>
    </div>
    <div class="watch-sidebar" id="watchSidebar">
      <div class="watch-sidebar-header">
        <span class="watch-sidebar-title">Episodes</span>
        <button class="btn btn-ghost btn-sm" id="sidebarClose">✕</button>
      </div>
      <div class="episode-rows-sidebar" id="epSidebarList">
        <div class="loading-spinner"><div class="spinner"></div></div>
      </div>
    </div>
  `;

  // Load show info and episodes
  try {
    const show = await fetchShowDetail(showId);
    state.showDetail = show;
    const name = getShowName(show);
    $('#watchTitle').textContent = name;

    const eps = show.availableEpisodesDetail?.[translationType] || [];
    watchEpisodesList = [...eps].sort((a, b) => {
      const na = parseInt(a, 10);
      const nb = parseInt(b, 10);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return String(a).localeCompare(String(b));
    });

    renderEpisodeSidebar(watchEpisodesList, showId, episode, translationType);
  } catch {
    $('#watchTitle').textContent = 'Unknown Show';
  }

  // Load stream
  loadStream(showId, episode, translationType);

  // Event listeners
  $('#watchBackBtn').addEventListener('click', () => navigate(`/show/${showId}`));

  $('#watchPrevBtn').addEventListener('click', () => {
    const idx = watchEpisodesList.indexOf(episode);
    if (idx > 0) navigate(`/watch/${showId}/${watchEpisodesList[idx - 1]}?type=${translationType}`);
  });

  $('#watchNextBtn').addEventListener('click', () => {
    const idx = watchEpisodesList.indexOf(episode);
    if (idx >= 0 && idx < watchEpisodesList.length - 1) navigate(`/watch/${showId}/${watchEpisodesList[idx + 1]}?type=${translationType}`);
  });

  $('#watchEpListToggle').addEventListener('click', () => {
    $('#watchSidebar').classList.toggle('open');
  });

  $('#sidebarClose').addEventListener('click', () => {
    $('#watchSidebar').classList.remove('open');
  });

  // Keyboard shortcuts - store reference so it can be cleaned up
  watchKeyHandlerRef = (e) => {
    if (e.key === 'Escape') $('#watchSidebar').classList.remove('open');
    if (e.key === 'ArrowLeft') $('#watchPrevBtn').click();
    if (e.key === 'ArrowRight') $('#watchNextBtn').click();
  };
  document.addEventListener('keydown', watchKeyHandlerRef);
}

function renderEpisodeSidebar(episodes, showId, currentEp, translationType) {
  const container = $('#epSidebarList');
  if (!container) return;

  if (episodes.length === 0) {
    container.innerHTML = '<div style="color:var(--text-muted);padding:16px;text-align:center">No episodes</div>';
    return;
  }

  container.innerHTML = episodes.map(ep => `
    <div class="ep-sidebar-row ${ep === currentEp ? 'active' : ''}" data-ep="${escapeHtml(ep)}">
      <span style="min-width:28px;font-weight:600;color:${ep === currentEp ? 'var(--accent-1)' : 'var(--text-muted)'}">${escapeHtml(ep)}</span>
      <span>Episode ${escapeHtml(ep)}</span>
    </div>
  `).join('');

  container.querySelectorAll('.ep-sidebar-row').forEach(row => {
    row.addEventListener('click', () => {
      navigate(`/watch/${showId}/${row.dataset.ep}?type=${translationType}`);
    });
  });
}

async function loadStream(showId, episode, translationType) {
  const playerWrap = $('#playerWrap');
  const loading = $('#playerLoading');
  const epLabel = $('#watchEpLabel');

  if (epLabel) epLabel.textContent = `Episode ${episode}`;

  // Remove old player
  if (playerIframe) {
    playerIframe.remove();
    playerIframe = null;
  }
  // Remove any existing video element
  const oldVideo = $('#playerVideo');
  if (oldVideo) oldVideo.remove();
  const oldHlsPlayer = $('#streamPlayer');
  if (oldHlsPlayer) oldHlsPlayer.remove();

  loading.style.display = 'flex';

  try {
    const data = await fetchStreams(showId, episode, translationType);
    const sources = data.sources || [];
    const watchUrl = data.watchUrl;
    const embedUrl = data.embedUrl;

    // Sort sources by priority: direct video > iframe embed > link fallback
    const videoSources = sources.filter(s => {
      const url = s.sourceUrl || '';
      return url.startsWith('http') && (
        s.sourceName === 'Yt-mp4' ||
        url.includes('tools.fast4speed') ||
        url.includes('.mp4') ||
        url.includes('.m3u8') ||
        url.includes('.webm')
      );
    });

    const iframeSources = sources.filter(s => {
      const url = s.sourceUrl || '';
      return url.startsWith('http') && (
        url.includes('mp4upload.com') ||
        url.includes('ok.ru') ||
        url.includes('allanime.uns.bio') ||
        url.includes('bysekoze.com')
      );
    });

    function buildLinkBar(links) {
      const bar = document.createElement('div');
      bar.style.cssText = `
        padding:10px 16px;
        background:rgba(0,0,0,0.85);
        display:flex;justify-content:center;gap:10px;flex-wrap:wrap;
      `;
      if (links.length > 0) {
        bar.innerHTML = `<span style="color:rgba(255,255,255,0.5);font-size:12px;display:flex;align-items:center;margin-right:4px">Sources:</span>
          ${links.map(p => `
            <a href="${escapeHtml(p.url)}" target="_blank" rel="noopener"
               style="padding:6px 12px;background:rgba(124,58,237,0.8);color:white;
                      border-radius:6px;text-decoration:none;font-size:12px;font-weight:500;
                      transition:0.2s"
               onmouseover="this.style.background='rgba(124,58,237,1)'"
               onmouseout="this.style.background='rgba(124,58,237,0.8)'">
              ${escapeHtml(p.name || 'Source')}
            </a>
          `).join('')}
          <button onclick="document.getElementById('playerWrap').requestFullscreen()"
                  style="padding:6px 12px;background:rgba(255,255,255,0.1);color:white;
                         border:1px solid rgba(255,255,255,0.2);border-radius:6px;
                         font-size:12px;cursor:pointer">
            &#9974; Fullscreen
          </button>`;
      } else {
        bar.innerHTML = `
          <button onclick="document.getElementById('playerWrap').requestFullscreen()"
                  style="padding:6px 12px;background:rgba(255,255,255,0.1);color:white;
                         border:1px solid rgba(255,255,255,0.2);border-radius:6px;
                         font-size:12px;cursor:pointer">
            &#9974; Fullscreen
          </button>`;
      }
      return bar;
    }

    function buildFallbackContainer(message, submessage, btns) {
      const container = document.createElement('div');
      container.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;padding:40px';
      container.innerHTML = `
        <div style="text-align:center;color:var(--text-muted);max-width:400px">
          <div style="font-size:48px;margin-bottom:16px">🎬</div>
          <h3 style="color:var(--text);margin-bottom:8px">${escapeHtml(message)}</h3>
          <p style="font-size:14px;line-height:1.6">${escapeHtml(submessage || '')}</p>
        </div>
        <div style="display:flex;gap:12px">
          ${btns}
        </div>
      `;
      return container;
    }

    if (videoSources.length > 0) {
      // Priority 1: Direct video URL → use HTML5 video player
      const videoUrl = videoSources[0].sourceUrl;
      loading.style.display = 'none';

      const playerDiv = document.createElement('div');
      playerDiv.id = 'streamPlayer';
      playerDiv.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column';

      const video = document.createElement('video');
      video.id = 'playerVideo';
      video.controls = true;
      video.autoplay = true;
      video.playsInline = true;
      video.style.cssText = 'flex:1;width:100%;height:100%;background:#000;object-fit:contain';

      // Try HLS.js if video is HLS, otherwise direct src
      const isHls = videoUrl.includes('.m3u8');
      if (isHls && typeof Hls !== 'undefined') {
        if (Hls.isSupported()) {
          const hls = new Hls();
          hls.loadSource(videoUrl);
          hls.attachMedia(video);
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = videoUrl;
        }
      } else {
        video.src = videoUrl;
      }

      // Error handler: fall back to iframe sources if direct video fails
      let fallbackAttempted = false;
      video.addEventListener('error', () => {
        if (fallbackAttempted) return;
        fallbackAttempted = true;
        console.warn('Direct video failed, falling back to iframe sources');
        playerDiv.remove();
        // Try iframe sources
        if (iframeSources.length > 0) {
          const iframeUrl = iframeSources[0].sourceUrl;
          const container = document.createElement('div');
          container.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column';
          const fallbackIframe = document.createElement('iframe');
          fallbackIframe.src = iframeUrl;
          fallbackIframe.allow = 'fullscreen; autoplay; encrypted-media';
          fallbackIframe.allowFullscreen = true;
          fallbackIframe.style.cssText = 'flex:1;width:100%;height:100%;border:none;background:#000';
          const links = iframeSources.map(s => ({ name: s.sourceName, url: s.sourceUrl }));
          container.appendChild(fallbackIframe);
          container.appendChild(buildLinkBar(links));
          playerWrap.appendChild(container);
        } else if (watchUrl || embedUrl) {
          // Last resort: mkissa.to link
          const primaryUrl = watchUrl || embedUrl;
          const btns = `<a href="${escapeHtml(primaryUrl)}" target="_blank" rel="noopener"
            style="padding:10px 24px;background:rgba(124,58,237,0.9);color:white;
                   border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;transition:0.2s"
             onmouseover="this.style.background='rgba(124,58,237,1)'"
             onmouseout="this.style.background='rgba(124,58,237,0.9)'">
            &#9654; Watch on mkissa.to
          </a>`;
          playerWrap.appendChild(buildFallbackContainer('Video playback failed', 'Try opening the episode on the external player.', btns));
        }
      });

      // Collect all provider links
      const allLinks = [];
      iframeSources.forEach(s => allLinks.push({ name: s.sourceName || s.sourceOriginalName || 'Source', url: s.sourceUrl }));
      if (videoSources.length > 1) {
        videoSources.slice(1).forEach(s => allLinks.push({ name: s.sourceName, url: s.sourceUrl }));
      }

      playerDiv.appendChild(video);
      playerDiv.appendChild(buildLinkBar(allLinks));
      playerWrap.appendChild(playerDiv);

      return;
    }

    if (iframeSources.length > 0) {
      // Priority 2: Iframe embed (no CSP blocking for these providers)
      const iframeUrl = iframeSources[0].sourceUrl;
      const iframeName = iframeSources[0].sourceName || 'Provider';
      loading.style.display = 'none';

      const container = document.createElement('div');
      container.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column';

      playerIframe = document.createElement('iframe');
      playerIframe.src = iframeUrl;
      playerIframe.allow = 'fullscreen; autoplay; encrypted-media';
      playerIframe.allowFullscreen = true;
      playerIframe.style.cssText = 'flex:1;width:100%;height:100%;border:none;background:#000';

      // Link bar with provider options
      const linkBar = document.createElement('div');
      linkBar.style.cssText = `
        padding:10px 16px;
        background:rgba(0,0,0,0.85);
        display:flex;justify-content:center;gap:10px;flex-wrap:wrap;
      `;

      linkBar.innerHTML = iframeSources.map(s => `
        <a href="${escapeHtml(s.sourceUrl)}" target="_blank" rel="noopener"
           style="padding:6px 12px;background:rgba(124,58,237,0.8);color:white;
                  border-radius:6px;text-decoration:none;font-size:12px;font-weight:500;
                  transition:0.2s"
           onmouseover="this.style.background='rgba(124,58,237,1)'"
           onmouseout="this.style.background='rgba(124,58,237,0.8)'">
          ${escapeHtml(s.sourceName || 'Source')}
        </a>
      `).join('') +
      `<button onclick="document.getElementById('playerWrap').requestFullscreen()"
              style="padding:6px 12px;background:rgba(255,255,255,0.1);color:white;
                     border:1px solid rgba(255,255,255,0.2);border-radius:6px;
                     font-size:12px;cursor:pointer">
        &#9974; Fullscreen
      </button>`;

      container.appendChild(playerIframe);
      container.appendChild(linkBar);
      playerWrap.appendChild(container);

      return;
    }

    // Priority 3: mkissa.to or allanime.day links (may be blocked by CSP in iframe)
    if (watchUrl || embedUrl) {
      const primaryUrl = watchUrl || embedUrl;
      loading.style.display = 'none';
      const btns = `
        <a href="${escapeHtml(primaryUrl)}" target="_blank" rel="noopener"
           style="padding:10px 24px;background:rgba(124,58,237,0.9);color:white;
                  border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;
                  transition:0.2s"
           onmouseover="this.style.background='rgba(124,58,237,1)'"
           onmouseout="this.style.background='rgba(124,58,237,0.9)'">
          &#9654; Watch on mkissa.to
        </a>
        ${embedUrl && embedUrl !== primaryUrl ? `
          <a href="${escapeHtml(embedUrl)}" target="_blank" rel="noopener"
             style="padding:10px 24px;background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.8);
                    border:1px solid rgba(255,255,255,0.15);border-radius:8px;text-decoration:none;
                    font-size:13px;font-weight:500;transition:0.2s"
             onmouseover="this.style.background='rgba(255,255,255,0.15)'"
             onmouseout="this.style.background='rgba(255,255,255,0.08)'">
            &#9654; Embed backup
          </a>
        ` : ''}
      `;
      playerWrap.appendChild(buildFallbackContainer('External Player Required', 'No embedded sources available for this episode. Open it on the external player site to watch.', btns));
      return;
    }

    // No sources at all
    loading.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔗</div>
        <h3>No stream URL available</h3>
        <p>No streaming sources could be found for this episode.</p>
      </div>
    `;

  } catch (err) {
    console.error('Stream error:', err);
    loading.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <h3>Failed to load stream</h3>
        <p>${escapeHtml(err.message)}</p>
        <button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="window.location.reload()">Retry</button>
      </div>
    `;
  }
}

// ============================================================
// Search
// ============================================================

let searchTimeout = null;

function setupSearch() {
  const input = $('#searchInput');
  const btn = $('#searchBtn');

  function doSearch() {
    const query = input.value.trim();
    state.currentQuery = query;
    state.currentPage = 1;
    navigate('/');
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doSearch();
  });

  btn.addEventListener('click', doSearch);

  // Debounced search on typing (optional, just updates URL params)
  input.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      const q = input.value.trim();
      if (q.length >= 3 || q.length === 0) {
        state.currentQuery = q;
        if (state.currentQuery !== '' || q === '') {
          // Only auto-search if we're on home page
          const route = getRoute();
          if (route.page === 'home') {
            state.currentPage = 1;
            loadHomeShows();
          }
        }
      }
    }, 500);
  });

  // Focus search with Ctrl+K or /
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      input.focus();
    }
    if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
      e.preventDefault();
      input.focus();
    }
  });
}

// ============================================================
// Init
// ============================================================

function init() {
  setupSearch();

  // Handle route changes
  window.addEventListener('hashchange', handleRoute);

  // Initial route
  handleRoute();
}

document.addEventListener('DOMContentLoaded', init);
