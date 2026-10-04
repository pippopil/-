import { TokenSavingSettings, DEFAULT_TOKEN_SAVING_SETTINGS, TokenUsageStats } from '../types/aiSettings';

const SETTINGS_KEY = 'mastervarka_ai_token_settings_v1';
const STATS_KEY = 'mastervarka_ai_token_stats_v1';
const CACHE_PREFIX = 'mastervarka_ai_cache_';

export function loadTokenSettings(): TokenSavingSettings {
  if (typeof window === 'undefined') return DEFAULT_TOKEN_SAVING_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_TOKEN_SAVING_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to load token settings:', e);
  }
  return DEFAULT_TOKEN_SAVING_SETTINGS;
}

export function saveTokenSettings(settings: TokenSavingSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save token settings:', e);
  }
}

export function loadTokenStats(): TokenUsageStats {
  const initial: TokenUsageStats = {
    totalTokensUsed: 0,
    totalTokensSavedEstimate: 0,
    cachedHitsCount: 0
  };
  if (typeof window === 'undefined') return initial;
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) {
      return { ...initial, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn('Failed to load token stats:', e);
  }
  return initial;
}

export function recordTokenUsage(
  usage: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number } | undefined,
  mode: TokenSavingSettings['mode'],
  isCached: boolean = false
): TokenUsageStats {
  const current = loadTokenStats();
  if (isCached) {
    current.cachedHitsCount += 1;
    // Each cache hit saves roughly ~800 tokens compared to full unoptimized request
    current.totalTokensSavedEstimate += 800;
  } else if (usage && typeof usage.totalTokenCount === 'number') {
    current.lastPromptTokens = usage.promptTokenCount;
    current.lastCandidateTokens = usage.candidatesTokenCount;
    current.lastTotalTokens = usage.totalTokenCount;
    current.totalTokensUsed += usage.totalTokenCount;
    current.lastMode = mode;

    // Normal baseline request without optimization is ~1200 tokens
    const baselineEstimate = 1200;
    const saved = Math.max(0, baselineEstimate - usage.totalTokenCount);
    current.totalTokensSavedEstimate += saved;
  } else if (mode === 'offline') {
    // Offline mode consumes 0 tokens, saves ~1200 tokens
    current.cachedHitsCount += 1;
    current.totalTokensSavedEstimate += 1200;
    current.lastMode = 'offline';
    current.lastTotalTokens = 0;
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(current));
    } catch {
      // ignore quota
    }
  }
  return current;
}

export function getAiCache<T = any>(cacheKey: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + cacheKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // 7 days expiration
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
      localStorage.removeItem(CACHE_PREFIX + cacheKey);
      return null;
    }
    return parsed.data as T;
  } catch {
    return null;
  }
}

export function setAiCache(cacheKey: string, data: any): void {
  if (typeof window === 'undefined') return;
  try {
    const payload = {
      data,
      savedAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
    };
    localStorage.setItem(CACHE_PREFIX + cacheKey, JSON.stringify(payload));
  } catch {
    // quota
  }
}

export function clearAiCache(): void {
  if (typeof window === 'undefined') return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(CACHE_PREFIX)) {
        keys.push(k);
      }
    }
    keys.forEach(k => localStorage.removeItem(k));
  } catch (e) {
    console.warn('Failed to clear AI cache:', e);
  }
}
