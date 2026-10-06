import React, { useState } from 'react';
import { TokenSavingSettings, TokenUsageStats, AiProvider } from '../types/aiSettings';
import { clearAiCache } from '../utils/aiTokenManager';
import {
  Zap,
  Sliders,
  Sparkles,
  ShieldCheck,
  X,
  Trash2,
  Cpu,
  BrainCircuit,
  Database,
  FileText,
  CheckCircle2,
  TrendingDown,
  Globe,
  Key,
  Server,
  Lock,
  ExternalLink,
  Info
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: TokenSavingSettings;
  onUpdateSettings: (newSettings: TokenSavingSettings) => void;
  stats: TokenUsageStats;
  onRefreshStats: () => void;
}

export const AiTokenSettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  stats,
  onRefreshStats
}) => {
  const [localSettings, setLocalSettings] = useState<TokenSavingSettings>({
    ...settings,
    provider: settings.provider || 'offline'
  });
  const [cacheClearedNotice, setCacheClearedNotice] = useState(false);
  const [showKey, setShowKey] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdateSettings(localSettings);
    onClose();
  };

  const handleResetDefaults = () => {
    const defaults: TokenSavingSettings = {
      provider: 'offline',
      mode: 'eco',
      maxOutputTokens: 260,
      disableThinking: true,
      compressPrompt: true,
      cacheResponses: true
    };
    setLocalSettings(defaults);
    onUpdateSettings(defaults);
  };

  const handleClearCache = () => {
    clearAiCache();
    setCacheClearedNotice(true);
    onRefreshStats();
    setTimeout(() => setCacheClearedNotice(false), 2500);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[130] overflow-y-auto bg-black/80 backdrop-blur-xs overscroll-contain p-3 sm:p-4 animate-in fade-in duration-150"
    >
      <div className="min-h-full flex items-center justify-center py-4 sm:py-6">
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xl rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl p-5 sm:p-6 relative space-y-5 text-left"
        >
          {/* Заголовок */}
          <div className="flex items-start justify-between gap-3 border-b border-stone-100 dark:border-stone-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/25 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-stone-900 dark:text-white leading-tight flex items-center gap-2">
                  <span>Выбор и Настройки ИИ</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-extrabold uppercase">
                    Без VPN
                  </span>
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Генерация названий, легенды, концепта этикеток и рецептурного аудита
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Плашка со статистикой */}
          <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-center">
            <div className="p-2 rounded-xl bg-white dark:bg-stone-800 shadow-2xs">
              <div className="text-[10px] text-stone-500 dark:text-stone-400 font-bold uppercase">
                Сэкономлено
              </div>
              <div className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                ~{stats.totalTokensSavedEstimate.toLocaleString()}
              </div>
              <div className="text-[9px] text-stone-400">токенов</div>
            </div>

            <div className="p-2 rounded-xl bg-white dark:bg-stone-800 shadow-2xs">
              <div className="text-[10px] text-stone-500 dark:text-stone-400 font-bold uppercase">
                Без VPN / Кэш
              </div>
              <div className="text-sm sm:text-base font-black text-amber-600 dark:text-amber-400 mt-0.5">
                {stats.cachedHitsCount}
              </div>
              <div className="text-[9px] text-stone-400">0 токенов</div>
            </div>

            <div className="p-2 rounded-xl bg-white dark:bg-stone-800 shadow-2xs">
              <div className="text-[10px] text-stone-500 dark:text-stone-400 font-bold uppercase">
                Текущий провайдер
              </div>
              <div className="text-xs font-black text-stone-800 dark:text-stone-200 mt-1 truncate">
                {localSettings.provider === 'offline' && '🍃 Автономный'}
                {localSettings.provider === 'deepseek' && '🟣 DeepSeek'}
                {localSettings.provider === 'custom_openai' && '🌐 Свой API'}
                {localSettings.provider === 'gemini' && '🔵 Gemini'}
              </div>
              <div className="text-[9px] text-emerald-500 font-bold">
                {localSettings.provider !== 'gemini' ? 'Без VPN ✅' : 'Требует VPN'}
              </div>
            </div>
          </div>

          {/* 1. Выбор Провайдера ИИ */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-900 dark:text-white flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-amber-500" />
                <span>Выберите движок ИИ:</span>
              </span>
              <span className="text-[11px] text-stone-500 font-normal">
                Гарантированная работа в РФ
              </span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Автономный ИИ (Рекомендуется) */}
              <button
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, provider: 'offline', mode: 'offline' })}
                className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                  localSettings.provider === 'offline'
                    ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800/40 text-stone-700 dark:text-stone-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs flex items-center gap-1.5">
                    <span>🍃 Автономный ИИ МастерВарка</span>
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500 text-white font-black">
                    БЕЗ VPN ✅
                  </span>
                </div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-bold mt-1">
                  100% надёжность • 0 токенов • Офлайн
                </div>
                <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1 leading-tight">
                  Анализирует BJCP стиль, хмели, засыпь, цвет EBC и генерирует уникальные крафтовые названия и дизайн этикетки без интернета.
                </p>
              </button>

              {/* DeepSeek AI */}
              <button
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, provider: 'deepseek' })}
                className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                  localSettings.provider === 'deepseek'
                    ? 'border-purple-500 bg-purple-50/70 dark:bg-purple-950/40 text-purple-950 dark:text-purple-100 ring-2 ring-purple-500/20 shadow-xs'
                    : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800/40 text-stone-700 dark:text-stone-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs flex items-center gap-1.5">
                    <span>🟣 DeepSeek AI (V3/R1)</span>
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-600 text-white font-black">
                    БЕЗ VPN ✅
                  </span>
                </div>
                <div className="text-[11px] text-purple-700 dark:text-purple-300 font-bold mt-1">
                  Официально доступен в России
                </div>
                <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1 leading-tight">
                  Мощная языковая модель. Не блокирует российские IP-адреса и выдает глубокие креативные концепты.
                </p>
              </button>

              {/* Свой API (GigaChat / OpenRouter / Ollama) */}
              <button
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, provider: 'custom_openai' })}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  localSettings.provider === 'custom_openai'
                    ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 ring-2 ring-blue-500/20 shadow-xs'
                    : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800/40 text-stone-700 dark:text-stone-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs flex items-center gap-1.5">
                    <span>🌐 Свой API / OpenRouter</span>
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-600 text-white font-bold">
                    Любой URL
                  </span>
                </div>
                <div className="text-[11px] text-blue-700 dark:text-blue-300 font-bold mt-1">
                  GigaChat / vLLM / LM Studio / Ollama
                </div>
                <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1 leading-tight">
                  Подключение любого совместимого с OpenAI сервера без ограничений.
                </p>
              </button>

              {/* Google Gemini */}
              <button
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, provider: 'gemini', mode: 'eco' })}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  localSettings.provider === 'gemini'
                    ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 text-amber-950 dark:text-amber-100 ring-2 ring-amber-500/20 shadow-xs'
                    : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800/40 text-stone-700 dark:text-stone-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs flex items-center gap-1.5">
                    <span>🔵 Google Gemini Flash</span>
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-stone-300 dark:bg-stone-700 text-stone-700 dark:text-stone-300 font-semibold">
                    Нужен VPN
                  </span>
                </div>
                <div className="text-[11px] text-amber-700 dark:text-amber-300 font-bold mt-1">
                  Flash-Lite / Flash 3.8
                </div>
                <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1 leading-tight">
                  Стандартный облачный ИИ. При блокировке VPN автоматически переключится на автономный ИИ.
                </p>
              </button>
            </div>
          </div>

          {/* Дополнительные поля для DeepSeek */}
          {localSettings.provider === 'deepseek' && (
            <div className="p-3.5 rounded-2xl bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-purple-600" />
                  <span>API-ключ DeepSeek (sk-...):</span>
                </label>
                <a
                  href="https://platform.deepseek.com/api_keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-purple-600 hover:underline flex items-center gap-1 font-bold"
                >
                  <span>Получить ключ</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
                  value={localSettings.deepseekApiKey || ''}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, deepseekApiKey: e.target.value })
                  }
                  className="w-full bg-white dark:bg-stone-900 border border-purple-300 dark:border-purple-700 rounded-xl px-3 py-2 text-xs font-mono pr-20"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-2 text-[10px] px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 font-bold"
                >
                  {showKey ? 'Скрыть' : 'Показать'}
                </button>
              </div>

              <p className="text-[10px] text-purple-800 dark:text-purple-300 leading-tight">
                Ключ сохраняется исключительно в вашем браузере / смартфоне (localStorage).
                Если ключ не указан, генератор временно использует автономный движок без VPN.
              </p>
            </div>
          )}

          {/* Дополнительные поля для своего API */}
          {localSettings.provider === 'custom_openai' && (
            <div className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 space-y-2.5 animate-in fade-in duration-150">
              <div>
                <label className="text-xs font-bold text-blue-900 dark:text-blue-200 block mb-1">
                  Endpoint URL (OpenAI-compatible):
                </label>
                <input
                  type="text"
                  placeholder="https://openrouter.ai/api/v1/chat/completions"
                  value={localSettings.customEndpoint || ''}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, customEndpoint: e.target.value })
                  }
                  className="w-full bg-white dark:bg-stone-900 border border-blue-300 dark:border-blue-700 rounded-xl px-3 py-2 text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-blue-900 dark:text-blue-200 block mb-1">
                    API Key (если требуется):
                  </label>
                  <input
                    type="password"
                    placeholder="Bearer token"
                    value={localSettings.customApiKey || ''}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, customApiKey: e.target.value })
                    }
                    className="w-full bg-white dark:bg-stone-900 border border-blue-300 dark:border-blue-700 rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-blue-900 dark:text-blue-200 block mb-1">
                    Модель (Model name):
                  </label>
                  <input
                    type="text"
                    placeholder="mistralai/mistral-7b-instruct"
                    value={localSettings.customModel || ''}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, customModel: e.target.value })
                    }
                    className="w-full bg-white dark:bg-stone-900 border border-blue-300 dark:border-blue-700 rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. Слайдер максимального количества токенов ответа */}
          <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-500" />
                <span>Лимит токенов в ответе:</span>
              </label>
              <span className="font-mono font-extrabold text-xs px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                {localSettings.maxOutputTokens} токенов
              </span>
            </div>

            <input
              type="range"
              min={150}
              max={600}
              step={10}
              value={localSettings.maxOutputTokens}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, maxOutputTokens: Number(e.target.value) })
              }
              className="w-full accent-amber-500 cursor-pointer"
            />

            <div className="flex justify-between text-[10px] text-stone-400 font-mono">
              <span>150 (Сжато)</span>
              <span>260 (Оптимально)</span>
              <span>600 (Подробно)</span>
            </div>
          </div>

          {/* 3. Оптимизация и кэширование */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-stone-900 dark:text-white">
              Оптимизация и кэш:
            </div>

            {/* Локальное кэширование одинаковых запросов */}
            <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80 cursor-pointer hover:bg-stone-100/60 transition-colors">
              <input
                type="checkbox"
                checked={localSettings.cacheResponses}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, cacheResponses: e.target.checked })
                }
                className="mt-0.5 rounded text-amber-500 focus:ring-amber-500 shrink-0"
              />
              <div className="text-xs">
                <div className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Кэширование ответов (мгновенная загрузка)</span>
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                  Повторные запросы для того же рецепта открываются мгновенно и тратят <b>0 токенов</b>.
                </p>
              </div>
            </label>

            {/* Сжатие контекста запроса */}
            <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80 cursor-pointer hover:bg-stone-100/60 transition-colors">
              <input
                type="checkbox"
                checked={localSettings.compressPrompt}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, compressPrompt: e.target.checked })
                }
                className="mt-0.5 rounded text-amber-500 focus:ring-amber-500 shrink-0"
              />
              <div className="text-xs">
                <div className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-500" />
                  <span>Сжатие промпта (экономия входных токенов)</span>
                </div>
              </div>
            </label>
          </div>

          {/* Сообщение об очистке кэша */}
          {cacheClearedNotice && (
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Локальный кэш ответов успешно очищен!</span>
            </div>
          )}

          {/* Нижние кнопки */}
          <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-3 py-2 rounded-xl text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 text-xs font-bold hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                title="Сбросить к автономному режиму без VPN"
              >
                По умолчанию
              </button>
              <button
                type="button"
                onClick={handleClearCache}
                className="px-3 py-2 rounded-xl text-red-600 hover:text-red-700 dark:text-red-400 text-xs font-bold hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex items-center gap-1"
                title="Очистить сохраненные ответы"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Очистить кэш</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold transition-colors"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition-all shadow-xs active:scale-95"
              >
                Сохранить настройки
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
