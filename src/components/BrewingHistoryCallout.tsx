import React, { useState, useMemo } from 'react';
import {
  BrewingHistoryMoment,
  getHistoryEraBadge
} from '../data/brewingHistoryData';
import { useBrewingHistory } from '../context/BrewingHistoryContext';
import {
  BookOpen,
  Calendar,
  MapPin,
  ExternalLink,
  Quote,
  Lightbulb,
  Shuffle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Globe,
  RefreshCw
} from 'lucide-react';

interface Props {
  currentStyleName?: string;
  onOpenFullHistory: (momentId?: string) => void;
  variant?: 'card' | 'compact' | 'banner';
}

export const BrewingHistoryCallout: React.FC<Props> = ({
  currentStyleName,
  onOpenFullHistory,
  variant = 'card'
}) => {
  const { moments, isLoading, timeUntilNextSync } = useBrewingHistory();

  // Ищем момент, связанный со стилем текущего рецепта
  const matchingMoment = useMemo(() => {
    if (!currentStyleName || moments.length === 0) return null;
    const lower = currentStyleName.toLowerCase();
    return moments.find(m =>
      m.relevantStyles.some(st => lower.includes(st.toLowerCase()) || st.toLowerCase().includes(lower))
    );
  }, [currentStyleName, moments]);

  const [currentIndex, setCurrentIndex] = useState(() => {
    if (matchingMoment) {
      const idx = moments.findIndex(m => m.id === matchingMoment.id);
      return idx >= 0 ? idx : 0;
    }
    // Случайный начальный факт
    return moments.length > 0 ? Math.floor(Math.random() * moments.length) : 0;
  });

  const [isExpanded, setIsExpanded] = useState(false);

  // Безопасный индекс
  const safeIndex = moments.length > 0 ? Math.min(Math.max(0, currentIndex), moments.length - 1) : 0;
  const currentMoment: BrewingHistoryMoment | undefined = moments[safeIndex];

  const handleNextRandom = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (moments.length <= 1) return;
    let nextIdx = Math.floor(Math.random() * moments.length);
    if (nextIdx === safeIndex) {
      nextIdx = (safeIndex + 1) % moments.length;
    }
    setCurrentIndex(nextIdx);
  };

  if (!currentMoment) return null;

  const eraBadge = getHistoryEraBadge(currentMoment.era);

  if (variant === 'compact') {
    return (
      <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl shrink-0">{currentMoment.iconEmoji}</span>
          <div className="min-w-0">
            <span className="font-bold text-amber-950 dark:text-amber-200 truncate block">
              {currentMoment.year}: {currentMoment.title}
            </span>
            <span className="text-[11px] text-stone-600 dark:text-stone-400 line-clamp-1">
              {currentMoment.summary}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleNextRandom}
            className="p-1.5 rounded-lg bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-amber-600 border border-stone-200 dark:border-stone-700 cursor-pointer"
            title="Другой исторический момент"
          >
            <Shuffle className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onOpenFullHistory(currentMoment.id)}
            className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] transition-colors cursor-pointer"
          >
            Хроника ({moments.length})
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="bg-gradient-to-br from-amber-50/90 via-white to-amber-50/30 dark:from-stone-900 dark:via-stone-850 dark:to-stone-900 rounded-2xl border border-amber-200/90 dark:border-amber-900/50 shadow-sm p-4 sm:p-5 relative overflow-hidden transition-all duration-200">
      {/* Фоновый легкий декоративный значок */}
      <div className="absolute -right-4 -bottom-4 text-7xl opacity-5 dark:opacity-10 pointer-events-none select-none">
        📜
      </div>

      {/* Верхняя строка: Лейбл, Эпоха, Кнопка случайного факта */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-400">
            <span>📜</span>
            <span>Историческая справка и источники</span>
          </div>
          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${eraBadge.color}`}>
            {eraBadge.label}
          </span>
          <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100/70 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-900/50 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {currentMoment.year}
          </span>
          <span
            className="text-[10px] font-semibold text-stone-500 dark:text-stone-400 bg-white/80 dark:bg-stone-800/80 px-2 py-0.5 rounded-full border border-stone-200 dark:border-stone-700 hidden sm:flex items-center gap-1"
            title={`Периодическая подгрузка из сети раз в 3 дня. След. автопроверка через ${timeUntilNextSync.days} дн. ${timeUntilNextSync.hours} ч.`}
          >
            <Globe className="w-2.5 h-2.5 text-sky-500" />
            <span>Сеть: раз в 3 дня</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleNextRandom}
            className="px-2.5 py-1 rounded-xl bg-white dark:bg-stone-800 border border-amber-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:text-amber-600 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
            title="Показать случайный исторический факт"
          >
            <Shuffle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            <span className="hidden sm:inline">Случайный факт</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenFullHistory(currentMoment.id)}
            className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
          >
            <BookOpen className="w-3 h-3" />
            <span>Вся хроника ({moments.length})</span>
          </button>
        </div>
      </div>

      {/* Заголовок и локация */}
      <div className="mb-2">
        <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 mb-0.5">
          <MapPin className="w-3 h-3 text-stone-400" />
          <span>{currentMoment.location}</span>
          <span className="text-stone-300 dark:text-stone-700">•</span>
          <span>{currentMoment.categoryName}</span>
        </div>
        <h4 className="text-base sm:text-lg font-black text-stone-900 dark:text-white leading-snug">
          {currentMoment.iconEmoji} {currentMoment.title}
        </h4>
      </div>

      {/* Краткая суть */}
      <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed mb-3">
        {currentMoment.summary}
      </p>

      {/* Раскрывающаяся подробная история */}
      {isExpanded && (
        <div className="space-y-3 pt-2 mb-3 border-t border-dashed border-amber-200/80 dark:border-stone-800 animate-fade-in">
          <div className="p-3.5 rounded-xl bg-white/80 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 text-xs sm:text-sm text-stone-800 dark:text-stone-200 leading-relaxed">
            {currentMoment.fullStory}
          </div>

          {currentMoment.quote && (
            <div className="p-3.5 rounded-xl bg-amber-100/40 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 relative">
              <Quote className="w-5 h-5 text-amber-500/30 absolute top-2 right-2" />
              <p className="italic text-xs font-serif text-stone-800 dark:text-stone-200 pr-5 leading-relaxed">
                «{currentMoment.quote.text}»
              </p>
              <div className="mt-1 text-[11px] font-bold text-amber-900 dark:text-amber-300">
                — {currentMoment.quote.author} ({currentMoment.quote.source})
              </div>
            </div>
          )}

          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 flex items-start gap-2 text-xs text-emerald-950 dark:text-emerald-200">
            <Lightbulb className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold mr-1">Урок для домашнего пивовара:</span>
              <span>{currentMoment.brewingTakeaway}</span>
            </div>
          </div>
        </div>
      )}

      {/* Нижняя плашка: Ссылки на первоисточники и кнопка развертывания */}
      <div className="pt-2 border-t border-amber-200/60 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 flex items-center gap-1">
            <ExternalLink className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            <span>Первоисточники:</span>
          </span>
          {currentMoment.historicalLinks.slice(0, 2).map((link, idx) => (
            <a
              key={idx}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-amber-400 text-[11px] font-bold text-stone-700 dark:text-stone-300 hover:text-amber-600 transition-colors shadow-2xs"
              title={link.note}
            >
              <span className="truncate max-w-[200px] sm:max-w-[260px]">{link.title}</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-60" />
            </a>
          ))}
          {currentMoment.historicalLinks.length > 2 && (
            <button
              type="button"
              onClick={() => onOpenFullHistory(currentMoment.id)}
              className="text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
            >
              +{currentMoment.historicalLinks.length - 2} ссылки
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="self-end sm:self-center text-xs font-bold text-amber-700 dark:text-amber-400 hover:text-amber-800 flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>{isExpanded ? 'Свернуть' : 'Подробности & Урок'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>
    </section>
  );
};
