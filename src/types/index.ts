// ============================================================
// KaiStream - TypeScript Types
// ============================================================

// ---- Shows ----
export interface Show {
  _id: string;
  name: string;
  englishName?: string;
  nativeName?: string;
  altNames?: string[];
  description?: string;
  score?: { averageScore?: number; };
  averageScore?: number;
  popularity?: number;
  status?: string;
  type?: string;
  genres?: string[];
  tags?: string[];
  thumbnail?: string;
  banner?: string;
  episodeCount?: number;
  episodeDuration?: number;
  season?: string | { quarter: string; year: number; } | number;
  year?: number;
  airedStart?: string;
  airedEnd?: string;
  studios?: string[];
  isAdult?: boolean;
  availableEpisodesDetail?: Record<string, string[]>;
  malId?: string;
  aniListId?: string;
  nextAiringEpisode?: any;
  countryOfOrigin?: string;
  rating?: any;
}

export interface ShowsResponse {
  edges: Show[];
  pageInfo: {
    total: number;
    hasNextPage: boolean;
    nextPage?: number;
    prevPage?: number;
    page: number;
  };
}

// ---- Episodes ----
export interface Episode {
  _id: string;
  showId: string;
  episodeString: string;
  episodeNumStart?: number;
  episodeNumEnd?: number;
  translationType?: string;
  thumbnail?: string;
  notes?: string;
  description?: string;
  episodeAiredDateString?: string;
  videoUrlProcessed?: string;
  sourceUrls?: any;
  uploadDate?: string;
  show?: {
    _id: string;
    name: string;
    englishName?: string;
    thumbnail?: string;
  };
}

export interface EpisodesResponse {
  edges: Episode[];
  pageInfo: {
    total: number;
    hasNextPage: boolean;
  };
}

// ---- Sources / Streams ----
export interface SourceItem {
  sourceName: string;
  sourceUrl: string;
  sourceOriginalName?: string;
  type?: string;
  priority?: number;
}

export interface StreamsResponse {
  sources: SourceItem[];
  embedUrl: string;
  watchUrl: string;
}

// ---- Search ----
export interface SearchResult {
  anyCards: SearchCard[];
  pageInfo?: {
    total: number;
    hasNextPage: boolean;
    nextPage?: number;
    prevPage?: number;
    page: number;
  };
}

export interface SearchCard {
  _id: string;
  name: string;
  englishName?: string;
  nativeName?: string;
  type?: string;
  thumbnail?: string;
  score?: any;
  status?: string;
  genres?: string[];
  episodeCount?: number;
  chapterCount?: number;
  availableEpisodesDetail?: Record<string, string[]>;
  availableChaptersDetail?: Record<string, string[]>;
  format?: string;
}

// ---- Popular / Recommendations ----
export interface PopularResponse {
  recommendations: Array<{
    anyCard: SearchCard;
    isManga: boolean;
  }>;
  total: number;
}

// ---- Categories ----
export interface CategoriesResponse {
  types: string[];
  statuses: string[];
  seasons: string[];
  countries: string[];
  translationTypes: string[];
}

// ---- Genres ----
export interface GenresResponse {
  genres: string[];
}

// ---- Characters ----
export interface Character {
  _id: string;
  name: string;
  image?: string;
  description?: string;
  gender?: string;
  age?: string;
  relatedRoles?: Array<{
    role: string;
    anyCard?: SearchCard;
    voiceActors?: Array<{
      language: string;
      staff: {
        _id: string;
        name: string;
        image?: string;
      };
    }>;
  }>;
}

export interface CharactersResponse {
  edges: Character[];
  pageInfo: {
    total: number;
    hasNextPage: boolean;
    page: number;
  };
}

// ---- Tags ----
export interface Tag {
  _id: string;
  name: string;
  slug: string;
  animeCount?: number;
  mangaCount?: number;
  tagType?: string;
  sampleAnime?: Array<{
    _id: string;
    name: string;
    thumbnail?: string;
  }>;
}

export interface TagsResponse {
  edges: Tag[];
  pageInfo: {
    total: number;
    hasNextPage: boolean;
    page: number;
  };
}

// ---- Music ----
export interface MusicItem {
  _id: string;
  musicTitle: string;
  artist?: string;
  type?: string;
  cover?: string;
  duration?: number;
  album?: string;
  show?: {
    showId: string;
    name: string;
    thumbnail?: string;
  };
  musicUrls?: string[];
  listens?: number;
  likes?: number;
}

export interface MusicResponse {
  edges: MusicItem[];
  pageInfo: {
    total: number;
    hasNextPage: boolean;
    page: number;
  };
}

// ---- Comments ----
export interface Comment {
  _id: string;
  referenceId: string;
  userId: string;
  user?: {
    _id: string;
    displayName: string;
    picture?: string;
  };
  comment: string;
  createdDate: string;
  likesCount?: number;
  dislikesCount?: number;
  commentCount?: number;
}

export interface CommentsResponse {
  edges: Comment[];
  pageInfo: {
    total: number;
    hasNextPage: boolean;
    page: number;
  };
}

// ---- Reviews ----
export interface Review {
  _id: string;
  showId: string;
  episodeIdNum?: number;
  user: {
    _id: string;
    displayName: string;
    picture?: string;
  };
  comment: string;
  uScore?: number;
  createdDate: string;
  likesCount?: number;
  dislikesCount?: number;
}

export interface ReviewsResponse {
  edges: Review[];
  pageInfo: {
    total: number;
    hasNextPage: boolean;
    page: number;
  };
}

// ---- Watch State ----
export interface WatchState {
  _id: string;
  showId: string;
  isManga?: boolean;
  watching?: number;
  dropped?: number;
  completed?: number;
  planned?: number;
  held?: number;
  watchingCount?: number;
  droppedCount?: number;
  completedCount?: number;
  plannedCount?: number;
  heldCount?: number;
  lastEpisodeTimestamp?: string;
}
