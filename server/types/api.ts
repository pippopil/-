/**
 * TypeScript интерфейсы и DTO для серверного API МастерВарка
 */

export interface TokenSettings {
  mode?: 'eco' | 'detailed' | 'offline';
  maxOutputTokens?: number;
  disableThinking?: boolean;
  compressPrompt?: boolean;
}

export interface GenerateLabelRequest {
  style: string;
  og: number | string;
  abv: number | string;
  ibu: number | string;
  colorEbc: number | string;
  hops?: Array<{ name: string; weightG?: number }>;
  grains?: Array<{ name: string; weightKg?: number }>;
  currentName?: string;
  tokenSettings?: TokenSettings;
}

export interface LabelResponsePalette {
  background: string;
  text: string;
  accent: string;
  border: string;
}

export interface GenerateLabelResponse {
  success: boolean;
  names: string[];
  slogan: string;
  story: string;
  themeStyle: string;
  palette: LabelResponsePalette;
  artworkType?: string;
  brewerTip: string;
  usage?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
  modelUsed?: string;
  isOfflineMode?: boolean;
  isFallback?: boolean;
}

export interface AuditRecipeRequest {
  recipe: {
    name: string;
    style: string;
    batchSizeL: number;
    boilTimeMin: number;
    calculated?: {
      ogSg?: number;
      fgSg?: number;
      abv?: number;
      ibu?: number;
      ebc?: number;
    };
    grains?: Array<{ name: string; weightKg: number }>;
    hops?: Array<{ name: string; weightG: number; boilTimeMin: number }>;
    yeast?: { name: string; attenuationPercent?: number };
  };
  tokenSettings?: TokenSettings;
}

export interface RecipeAuditData {
  summary: string;
  strengths: string[];
  suggestions: string[];
  foodPairings: string[];
  servingTemp: string;
  glassType: string;
}

export interface AuditRecipeResponse {
  success: boolean;
  audit: RecipeAuditData;
  usage?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
  modelUsed?: string;
  isOfflineMode?: boolean;
  isFallback?: boolean;
}

export interface SyncSaveRequest {
  syncCode: string;
  payload: any;
}

export interface FetchRecipeUrlRequest {
  url: string;
}

export interface SearchOnlineRecipesRequest {
  query?: string;
  fermentationType?: 'all' | 'ale' | 'lager' | 'spontaneous';
  styleCategory?: 'all' | 'porter' | 'stout' | 'ale' | 'ipa' | 'lager' | 'wheat' | 'sour' | 'belgian';
  minAbv?: number;
  maxAbv?: number;
}

export interface SearchOnlineRecipesResponse {
  success: boolean;
  totalFound: number;
  recipes: any[];
}

export interface CommunityPostItem {
  id: string;
  createdAt: string;
  authorName?: string;
  recipeName?: string;
  style?: string;
  abv?: number;
  ibu?: number;
  comment?: string;
  likesCount?: number;
  comments?: any[];
  [key: string]: any;
}
