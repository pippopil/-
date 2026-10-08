import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  BrewingHistoryMoment,
  getHistoryEraBadge,
  getHistoryCategoryBadge
} from '../data/brewingHistoryData';
import { useBrewingHistory } from '../context/BrewingHistoryContext';
import {
  X,
  Search,
  BookOpen,
  Calendar,
  MapPin,
  ExternalLink,
  Quote,
  Lightbulb,
  Sparkles,
  Filter,
  Layers,
  Copy,
  Check,
  Compass,
  RefreshCw,
  Globe,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialMomentId?: string;
  onSelectStyle?: (styleName: string) => void;
}

export const BrewingHistoryModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initialMomentId,
  onSelectStyle
}) => {
  const {
    moments,
    isLoading,
    lastSyncTime,
    timeUntilNextSync,
    syncStatus,
    statusMessage,
    refreshFromNetwork
  } = useBrewingHistory();

  const [search, setSearch] = useState('');
  const [selectedEra, setSelectedEra] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedMomentId, setExpandedMomentId] = useState<string | null>(initialMomentId || null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Сброс скролла на начало при открытии или смене фильтров (если не задан конкретный момент)
  useEffect(() => {
    if (!initialMomentId && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [isOpen, selectedEra, selectedCategory, initialMomentId]);

  // Сортировка по хронологии
  const sortedMoments = useMemo(() => {
    return [...moments].sort((a, b) => a.numericYear - b.numericYear);
  }, [moments]);

  const filteredMoments = useMemo(() => {
    return sortedMoments.filter(m => {
      const matchEra = selectedEra === 'all' || m.era === selectedEra;
      const matchCat = selectedCategory === 'all' || m.category === selectedCategory;
      const s = search.toLowerCase();
      const matchText =
        m.title.toLowerCase().includes(s) ||
        m.location.toLowerCase().includes(s) ||
        m.summary.toLowerCase().includes(s) ||
        m.fullStory.toLowerCase().includes(s) ||
        (m.quote && m.quote.text.toLowerCase().includes(s)) ||
        m.relevantStyles.some(st => st.toLowerCase().includes(s)) ||
        m.historicalLinks.some(l => l.title.toLowerCase().includes(s) || l.note.toLowerCase().includes(s));

      return matchEra && matchCat && (!search.trim() || matchText);
    });
  }, [sortedMoments, selectedEra, selectedCategory, search]);

  const handleCopyQuote = (moment: BrewingHistoryMoment) => {
    if (!moment.quote) return;
    const textToCopy = `«${moment.quote.text}» — ${moment.quote.author} (${moment.quote.source})`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(moment.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatLastSyncString = (date: Date | null) => {
    if (!date) return 'Еще не обновлялось из сети';
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Шапка модального окна */}
        <div className="p-5 sm:p-6 border-b border-stone-200 dark:border-stone-800 flex items-start justify-between gap-4 bg-gradient-to-r from-amber-50 via-white to-stone-50 dark:from-stone-900 dark:via-stone-900 dark:to-stone-950">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-300 dark:border-amber-700/50 flex items-center justify-center text-2xl shrink-0 shadow-sm">
              📜
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  Хроника и первоисточники
                </span>
                <span className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                  {moments.length} исторических вех
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700">
                  <Globe className="w-3 h-3 text-sky-500" />
                  Автообновление: раз в 3 дня
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white mt-0.5 tracking-tight">
                История пивоварения и первоисточники
              </h2>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 max-w-2xl">
                Ключевые исторические моменты от шумерских клинописных табличек до крафтовой революции с кликабельными ссылками на древние манускрипты, архивы и музейные коллекции.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            title="Закрыть"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Панель сетевой синхронизации (периодичность раз в 3 дня) */}
        <div className="px-4 sm:px-6 py-2.5 bg-gradient-to-r from-sky-50/80 via-amber-50/40 to-stone-50/80 dark:from-stone-900 dark:via-stone-850 dark:to-stone-900 border-b border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              isLoading
                ? 'bg-amber-500 animate-ping'
                : syncStatus === 'synced'
                ? 'bg-emerald-500 ring-2 ring-emerald-300 dark:ring-emerald-900'
                : 'bg-amber-500 ring-2 ring-amber-300 dark:ring-amber-900'
            }`} />
            <div className="text-[11px] sm:text-xs text-stone-600 dark:text-stone-300 leading-tight">
              <span className="font-semibold text-stone-900 dark:text-stone-100">
                Синхронизация из сети:
              </span>{' '}
              {isLoading ? (
                <span className="text-amber-600 dark:text-amber-400 font-medium">
                  Загрузка свежих данных...
                </span>
              ) : (
                <span>
                  {lastSyncTime ? `Обновлено: ${formatLastSyncString(lastSyncTime)}` : 'Готово к первой загрузке'}
                  <span className="text-stone-400 mx-1.5">•</span>
                  {timeUntilNextSync.isDue ? (
                    <span className="text-amber-600 dark:text-amber-400 font-medium">
                      прошло 3 дня, выполняется плановое обновление
                    </span>
                  ) : (
                    <span className="text-stone-500 dark:text-stone-400">
                      следующее автообновление через {timeUntilNextSync.days > 0 ? `${timeUntilNextSync.days} дн. ` : ''}{timeUntilNextSync.hours} ч.
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => refreshFromNetwork(true)}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-stone-800 hover:bg-sky-50 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-700 font-medium text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
              title="Принудительно подгрузить исторические справки из сети"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-sky-600 dark:text-sky-400 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Загрузка...' : 'Обновить из сети'}</span>
            </button>
          </div>
        </div>

        {/* Информационное уведомление о результате синхронизации */}
        {statusMessage && (
          <div className="px-4 sm:px-6 py-2 bg-sky-50 dark:bg-sky-950/40 border-b border-sky-100 dark:border-sky-900/40 flex items-center gap-2 text-xs text-sky-800 dark:text-sky-300">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-sky-600 dark:text-sky-400" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Панель фильтров и поиска */}
        <div className="p-4 sm:px-6 bg-stone-50/70 dark:bg-stone-900/50 border-b border-stone-200 dark:border-stone-800 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по вехам, авторам, городам, источникам (Пастер, Хаммурапи, Пилснер, хмель)..."
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
              >
                Очистить
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Фильтр по эпохам */}
            <select
              value={selectedEra}
              onChange={(e) => setSelectedEra(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-semibold text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">🌍 Все эпохи</option>
              <option value="ancient">🏺 Древний мир (-2500 – 500)</option>
              <option value="medieval">⛪ Средневековье (500 – 1700)</option>
              <option value="industrial">⚙️ Пром. революция (XVIII-XIX в.)</option>
              <option value="modern">🚀 Крафтовая эра (XX-XXI в.)</option>
            </select>

            {/* Фильтр по категориям */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-semibold text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">📁 Все категории</option>
              <option value="law">⚖️ Законы и указы</option>
              <option value="science">🔬 Наука и открытия</option>
              <option value="style">🍺 Рождение стилей</option>
              <option value="event">🌊 События и легенды</option>
              <option value="recipe">📜 Древние рецепты</option>
            </select>
          </div>
        </div>

        {/* Список исторических карточек */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {filteredMoments.length === 0 ? (
            <div className="text-center py-16 text-stone-500 dark:text-stone-400 space-y-3">
              <div className="text-4xl">🔍</div>
              <div className="font-bold text-base">Ничего не найдено</div>
              <p className="text-xs max-w-sm mx-auto">
                Попробуйте изменить поисковый запрос или сбросить фильтры эпох.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSelectedEra('all');
                  setSelectedCategory('all');
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Сбросить фильтры
              </button>
            </div>
          ) : (
            filteredMoments.map((moment) => {
              const eraBadge = getHistoryEraBadge(moment.era);
              const catBadge = getHistoryCategoryBadge(moment.category);
              const isExpanded = expandedMomentId === moment.id;

              return (
                <article
                  key={moment.id}
                  id={`history-${moment.id}`}
                  className="bg-white dark:bg-stone-850 rounded-2xl border border-stone-200/90 dark:border-stone-800 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                >
                  {/* Верхняя плашка карточки */}
                  <div className="p-4 sm:p-5 border-b border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50/50 dark:bg-stone-900/40">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl shrink-0 select-none">
                        {moment.iconEmoji}
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${eraBadge.color}`}>
                            {eraBadge.label}
                          </span>
                          <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-900/50 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {moment.year}
                          </span>
                          <span className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-stone-400" />
                            {moment.location}
                          </span>
                        </div>
                        <h3 className="text-base sm:text-lg font-black text-stone-900 dark:text-white leading-tight">
                          {moment.title}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400 px-2 py-1 rounded-lg bg-stone-100 dark:bg-stone-800">
                        {catBadge.icon} {moment.categoryName}
                      </span>
                      <button
                        type="button"
                        onClick={() => setExpandedMomentId(isExpanded ? null : moment.id)}
                        className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold transition-colors cursor-pointer"
                      >
                        {isExpanded ? 'Свернуть' : 'Подробнее'}
                      </button>
                    </div>
                  </div>

                  {/* Краткое описание */}
                  <div className="p-4 sm:p-5 space-y-4">
                    <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-normal">
                      {moment.summary}
                    </p>

                    {/* Развернутая история */}
                    {isExpanded && (
                      <div className="space-y-4 pt-2 border-t border-dashed border-stone-200 dark:border-stone-800 animate-fade-in">
                        <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-900/70 border border-stone-200/70 dark:border-stone-800 text-xs sm:text-sm text-stone-800 dark:text-stone-200 leading-relaxed">
                          <div className="font-bold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1 flex items-center gap-1.5">
                            <Compass className="w-3.5 h-3.5" />
                            <span>Историческая хроника</span>
                          </div>
                          {moment.fullStory}
                        </div>

                        {/* Историческая цитата */}
                        {moment.quote && (
                          <div className="relative p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 text-stone-800 dark:text-stone-200">
                            <Quote className="w-6 h-6 text-amber-500/40 dark:text-amber-400/30 absolute top-3 right-3" />
                            <p className="italic text-xs sm:text-sm font-serif pr-6 leading-relaxed">
                              «{moment.quote.text}»
                            </p>
                            <div className="mt-2 text-[11px] font-bold text-amber-900 dark:text-amber-300 flex items-center justify-between flex-wrap gap-2">
                              <span>— {moment.quote.author} ({moment.quote.source})</span>
                              <button
                                type="button"
                                onClick={() => handleCopyQuote(moment)}
                                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/50 dark:hover:bg-amber-800 text-amber-900 dark:text-amber-200 transition-colors cursor-pointer"
                                title="Скопировать цитату"
                              >
                                {copiedId === moment.id ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span>Скопировано</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Копировать</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Урок для современного пивовара */}
                    <div className="p-3 sm:p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/50 flex items-start gap-2.5">
                      <Lightbulb className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <div className="text-xs text-emerald-950 dark:text-emerald-200">
                        <span className="font-bold mr-1">Урок для домашнего пивовара:</span>
                        <span>{moment.brewingTakeaway}</span>
                      </div>
                    </div>

                    {/* Связанные стили */}
                    {moment.relevantStyles && moment.relevantStyles.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                          Связанные стили:
                        </span>
                        {moment.relevantStyles.map((st, i) => (
                          <span
                            key={i}
                            className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700"
                          >
                            🍺 {st}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Исторические ссылки и первоисточники */}
                    <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
                      <div className="text-[11px] font-black uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>Исторические первоисточники и ссылки:</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {moment.historicalLinks.map((link, idx) => {
                          const badgeColor =
                            link.type === 'source'
                              ? 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border-red-200'
                              : link.type === 'manuscript'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200'
                              : link.type === 'museum'
                              ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200'
                              : link.type === 'archive'
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200'
                              : 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border-stone-200';

                          const badgeText =
                            link.type === 'source'
                              ? 'Первоисточник'
                              : link.type === 'manuscript'
                              ? 'Манускрипт'
                              : link.type === 'museum'
                              ? 'Музей / Экспонат'
                              : link.type === 'archive'
                              ? 'Архив'
                              : 'Энциклопедия';

                          return (
                            <a
                              key={idx}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group p-2.5 rounded-xl border border-stone-200/90 dark:border-stone-700/80 bg-stone-50/70 hover:bg-amber-50/70 dark:bg-stone-800/60 dark:hover:bg-amber-950/30 transition-all flex items-start justify-between gap-2 text-left"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${badgeColor}`}>
                                    {badgeText}
                                  </span>
                                </div>
                                <div className="text-xs font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 leading-snug line-clamp-1">
                                  {link.title}
                                </div>
                                <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 line-clamp-1">
                                  {link.note}
                                </div>
                              </div>
                              <ExternalLink className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-600 shrink-0 mt-1 transition-colors" />
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>

        {/* Футер модалки */}
        <div className="p-4 sm:px-6 bg-stone-100 dark:bg-stone-950 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
          <div className="flex items-center gap-2">
            <span>📚 Все материалы верифицированы по научным изданиям и музейным архивам.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-900 dark:bg-stone-800 dark:hover:bg-stone-700 text-white font-bold rounded-xl transition-colors cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
