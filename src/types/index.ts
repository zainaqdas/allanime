// ============================================================
// KaiStream - TypeScript Types
// ============================================================

// ---- Shows ----
export interface Show {
  _id: string;
  name: string;
  englishName?: string;
  description?: string;
  score?: { averageScore?: number; };
  status?: string;
  type?: string;
  genres?: string[];
  thumbnail?: string;
  episodeCount?: number;
  season?: string | { quarter: string; year: number; } | number;
  year?: number;
  availableEpisodesDetail?: Record<string, string[]>;
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
  sourceUrls?: any;
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
  type?: string;
  thumbnail?: string;
  score?: any;
  status?: string;
  genres?: string[];
  episodeCount?: number;
  availableEpisodesDetail?: Record<string, string[]>;
  format?: string;
}

// ---- Popular / Recommendations ----
export interface PopularResponse {
  recommendations: Array<{
    anyCard: SearchCard;
  }>;
  total: number;
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

