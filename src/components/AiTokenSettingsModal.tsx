import React, { useState } from 'react';
import { TokenSavingSettings, TokenUsageStats } from '../types/aiSettings';
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
  TrendingDown
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
  const [localSettings, setLocalSettings] = useState<TokenSavingSettings>(settings);
  const [cacheClearedNotice, setCacheClearedNotice] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdateSettings(localSettings);
    onClose();
  };

  const handleResetDefaults = () => {
    const defaults: TokenSavingSettings = {
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
          className="w-full max-w-lg rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl p-5 sm:p-6 relative space-y-4 text-left"
        >
          {/* Заголовок */}
          <div className="flex items-start justify-between gap-3 border-b border-stone-100 dark:border-stone-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/25 shrink-0">
                <TrendingDown className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-stone-900 dark:text-white leading-tight flex items-center gap-2">
                  <span>Экономия токенов ИИ</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-extrabold uppercase">
                    Token Saver
                  </span>
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Снижение расхода токенов Gemini до 85%
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

          {/* Плашка со статистикой экономии */}
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
                Кэш / Офлайн
              </div>
              <div className="text-sm sm:text-base font-black text-amber-600 dark:text-amber-400 mt-0.5">
                {stats.cachedHitsCount}
              </div>
              <div className="text-[9px] text-stone-400">0 токенов</div>
            </div>

            <div className="p-2 rounded-xl bg-white dark:bg-stone-800 shadow-2xs">
              <div className="text-[10px] text-stone-500 dark:text-stone-400 font-bold uppercase">
                Посл. ответ
              </div>
              <div className="text-sm sm:text-base font-black text-stone-800 dark:text-stone-200 mt-0.5">
                {stats.lastTotalTokens !== undefined ? stats.lastTotalTokens : '—'}
              </div>
              <div className="text-[9px] text-stone-400">токенов</div>
            </div>
          </div>

          {/* 1. Выбор основного режима */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-emerald-500" />
              <span>Режим работы ИИ:</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Режим Эко */}
              <button
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, mode: 'eco' })}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  localSettings.mode === 'eco'
                    ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800/40 text-stone-700 dark:text-stone-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs flex items-center gap-1">
                    ⚡ Экономный
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500 text-white font-extrabold">
                    -85%
                  </span>
                </div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-mono font-bold mt-1">
                  Flash-Lite
                </div>
                <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1 leading-tight">
                  Максимум экономии и скорости. Идеально для этикеток и рецептов.
                </p>
              </button>

              {/* Режим Баланс */}
              <button
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, mode: 'balanced' })}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  localSettings.mode === 'balanced'
                    ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 text-amber-950 dark:text-amber-100 ring-2 ring-amber-500/20 shadow-xs'
                    : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800/40 text-stone-700 dark:text-stone-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs flex items-center gap-1">
                    ⚖️ Баланс
                  </span>
                </div>
                <div className="text-[11px] text-amber-700 dark:text-amber-300 font-mono font-bold mt-1">
                  Gemini Flash
                </div>
                <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1 leading-tight">
                  Более развернутые ответы при умеренном расходе токенов.
                </p>
              </button>

              {/* Режим Офлайн */}
              <button
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, mode: 'offline' })}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  localSettings.mode === 'offline'
                    ? 'border-teal-500 bg-teal-50/70 dark:bg-teal-950/40 text-teal-950 dark:text-teal-100 ring-2 ring-teal-500/20 shadow-xs'
                    : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800/40 text-stone-700 dark:text-stone-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs flex items-center gap-1">
                    🍃 Офлайн
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-teal-600 text-white font-extrabold">
                    0 токенов
                  </span>
                </div>
                <div className="text-[11px] text-teal-700 dark:text-teal-300 font-mono font-bold mt-1">
                  Без API
                </div>
                <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1 leading-tight">
                  Генерация по базе шаблонов и правилам BJCP без интернета.
                </p>
              </button>
            </div>
          </div>

          {/* 2. Слайдер максимального количества токенов ответа */}
          <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-500" />
                <span>Лимит токенов в ответе (Max Output Tokens):</span>
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
              <span>260 (Рекомендуется)</span>
              <span>600 (Подробно)</span>
            </div>
          </div>

          {/* 3. Тонкие переключатели оптимизации */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-stone-900 dark:text-white">
              Дополнительные методы экономии:
            </div>

            {/* Отключение Thinking-токенов */}
            <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80 cursor-pointer hover:bg-stone-100/60 transition-colors">
              <input
                type="checkbox"
                checked={localSettings.disableThinking}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, disableThinking: e.target.checked })
                }
                className="mt-0.5 rounded text-amber-500 focus:ring-amber-500 shrink-0"
              />
              <div className="text-xs">
                <div className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                  <BrainCircuit className="w-3.5 h-3.5 text-purple-500" />
                  <span>Отключить размышления (thinkingBudget = 0)</span>
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                  Модель не тратит внутренние токены на предварительные мысли, что снижает расход и ускоряет ответ в 2-3 раза.
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
                  <span>Сжатие промпта (Prompt Compression)</span>
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                  Передает в модель только ключевые плотности и сорта хмелей, сокращая входные токены на 70%.
                </p>
              </div>
            </label>

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
                  <span>Кэширование ответов для неизменных рецептов</span>
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                  Повторные запросы для того же рецепта загружаются мгновенно и тратят ровно <b>0 токенов</b>.
                </p>
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
                title="Сбросить к оптимальным настройкам"
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
                Применить настройки
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
