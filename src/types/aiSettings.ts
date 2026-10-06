export type AiEconomyMode = 'eco' | 'balanced' | 'offline';

export type AiProvider = 'offline' | 'deepseek' | 'custom_openai' | 'gemini';

export interface TokenSavingSettings {
  /**
   * Провайдер ИИ:
   * 'offline': Автономный ИИ МастерВарка (100% без VPN, без интернета, 0 токенов, мгновенно)
   * 'deepseek': DeepSeek V3 / R1 (официально работает в РФ без VPN напрямую)
   * 'custom_openai': Пользовательский API (GigaChat / OpenRouter / Ollama / LM Studio)
   * 'gemini': Google Gemini (через серверный прокси или с VPN)
   */
  provider: AiProvider;

  /**
   * Ключ API DeepSeek (работает в РФ без VPN)
   */
  deepseekApiKey?: string;

  /**
   * Пользовательский Endpoint (для custom_openai)
   */
  customEndpoint?: string;
  customApiKey?: string;
  customModel?: string;

  /**
   * Режим экономии:
   * 'eco': gemini-3.1-flash-lite / deepseek-chat
   * 'balanced': gemini-3.8-flash / deepseek-reasoner
   * 'offline': 0 токенов (локальный генератор)
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
  provider: 'offline', // По умолчанию автономный ИИ — 100% гарантия работы в РФ без VPN и в Android APK!
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
