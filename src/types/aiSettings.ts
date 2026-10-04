export type AiEconomyMode = 'eco' | 'balanced' | 'offline';

export interface TokenSavingSettings {
  /**
   * Режим экономии:
   * 'eco': gemini-3.1-flash-lite (наименьший расход токенов и стоимости)
   * 'balanced': gemini-3.8-flash (стандартный баланс)
   * 'offline': 0 токенов (локальный алгоритмический генератор без API)
   */
  mode: AiEconomyMode;

  /**
   * Максимальное количество токенов в ответе (150–600)
   */
  maxOutputTokens: number;

  /**
   * Отключение размышлений (thinkingBudget = 0) для экономии thinking-токенов
   */
  disableThinking: boolean;

  /**
   * Сжатие контекста запроса (удаление избыточных описаний, только ключевые параметры)
   */
  compressPrompt: boolean;

  /**
   * Локальное кэширование одинаковых запросов (повторный клик = 0 токенов)
   */
  cacheResponses: boolean;
}

export const DEFAULT_TOKEN_SAVING_SETTINGS: TokenSavingSettings = {
  mode: 'eco',
  maxOutputTokens: 260,
  disableThinking: true,
  compressPrompt: true,
  cacheResponses: true
};

export interface TokenUsageStats {
  lastPromptTokens?: number;
  lastCandidateTokens?: number;
  lastTotalTokens?: number;
  totalTokensUsed: number;
  totalTokensSavedEstimate: number;
  cachedHitsCount: number;
  lastMode?: AiEconomyMode;
}
