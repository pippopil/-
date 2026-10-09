import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, Plus, Wheat, Flame, Sparkles } from 'lucide-react';
import { KURSK_MALT_PRODUCTS, isKurskMalt } from '../utils/brewingSubstitutions';
import { COMMON_GRAINS, COMMON_HOPS } from '../data/defaultData';
import { ebcToHex } from '../utils/brewingMath';

export interface GrainOption {
  name: string;
  potentialSg: number;
  colorEbc: number;
  type: 'base' | 'caramel' | 'roasted' | 'wheat' | 'adjunct' | 'acid';
  group?: string;
  isKursk?: boolean;
}

export interface HopOption {
  name: string;
  alphaAcid: number;
  profile?: string;
  region?: string;
}

interface Props {
  type: 'grain' | 'hop';
  onSelectGrain?: (grain: GrainOption) => void;
  onSelectHop?: (hop: HopOption) => void;
  onCustomAdd: (customName?: string) => void;
  className?: string;
  placeholder?: string;
}

// Карта соответствия первых букв и слогов RU <-> EN для мгновенного поиска хмеля и солода
const RU_TO_EN_LETTER_MAP: Record<string, string[]> = {
  'а': ['a'],
  'б': ['b'],
  'в': ['v', 'w'],
  'г': ['g'],
  'д': ['d'],
  'е': ['e'],
  'ё': ['yo', 'e'],
  'ж': ['zh', 'j'],
  'з': ['z'],
  'и': ['i'],
  'й': ['y', 'j'],
  'к': ['k', 'c'],
  'л': ['l'],
  'м': ['m'],
  'н': ['n'],
  'о': ['o'],
  'п': ['p'],
  'р': ['r'],
  'с': ['s', 'c'],
  'т': ['t'],
  'у': ['u'],
  'ф': ['f', 'ph'],
  'х': ['h', 'kh'],
  'ц': ['ts', 'c'],
  'ч': ['ch'],
  'ш': ['sh'],
  'щ': ['shch'],
  'э': ['e'],
  'ю': ['yu', 'u'],
  'я': ['ya', 'ja'],
};

const EN_TO_RU_LETTER_MAP: Record<string, string[]> = {
  'a': ['а'],
  'b': ['б'],
  'c': ['к', 'с', 'ц'],
  'd': ['д'],
  'e': ['е', 'э'],
  'f': ['ф'],
  'g': ['г'],
  'h': ['х'],
  'i': ['и'],
  'j': ['дж', 'ж', 'й'],
  'k': ['к'],
  'l': ['л'],
  'm': ['м'],
  'n': ['н'],
  'o': ['о'],
  'p': ['п'],
  'q': ['к'],
  'r': ['р'],
  's': ['с', 'ш'],
  't': ['т'],
  'u': ['у', 'ю'],
  'v': ['в'],
  'w': ['в'],
  'x': ['кс', 'х'],
  'y': ['й', 'ы', 'я'],
  'z': ['з'],
};

/**
 * Получение вариантов транслитерации для первых букв / слогов
 */
function getTransliterationPrefixes(query: string): string[] {
  if (!query) return [];
  const q = query.toLowerCase().trim();
  const list = new Set<string>();

  const first = q[0];
  if (RU_TO_EN_LETTER_MAP[first]) {
    RU_TO_EN_LETTER_MAP[first].forEach(l => list.add(l));
  }
  if (EN_TO_RU_LETTER_MAP[first]) {
    EN_TO_RU_LETTER_MAP[first].forEach(l => list.add(l));
  }

  // Частые пивоваренные префиксы
  if (q.startsWith('наг')) {
    list.add('nug');
    list.add('nag');
  }
  if (q.startsWith('nug') || q.startsWith('nag')) {
    list.add('наг');
  }
  if (q.startsWith('цит')) list.add('cit');
  if (q.startsWith('cit')) list.add('цит');
  if (q.startsWith('кас')) list.add('cas');
  if (q.startsWith('cas')) list.add('кас');
  if (q.startsWith('моз')) list.add('mos');
  if (q.startsWith('mos')) list.add('моз');
  if (q.startsWith('сим')) list.add('sim');
  if (q.startsWith('sim')) list.add('сим');
  if (q.startsWith('маг')) list.add('mag');
  if (q.startsWith('mag')) list.add('маг');
  if (q.startsWith('пер')) list.add('per');
  if (q.startsWith('per')) list.add('пер');
  if (q.startsWith('ноз')) list.add('nor');
  if (q.startsWith('nor')) list.add('ноз');
  if (q.startsWith('жат')) list.add('saa');
  if (q.startsWith('saa')) list.add('жат');

  return Array.from(list);
}

/**
 * Проверка совпадения по началу названия или началу любого слова.
 * Для 1-2 букв строго проверяем только начало слов (чтобы при вводе 'Н' не вылезали все хмели с буквой 'н' внутри слова).
 */
function matchesPrefix(target: string, query: string): boolean {
  if (!query) return true;
  const cleanTarget = target.toLowerCase().trim();
  const cleanQuery = query.toLowerCase().trim();

  // 1. Прямое совпадение начала названия
  if (cleanTarget.startsWith(cleanQuery)) return true;

  // 2. Начало любого из слов (разделители: пробелы, скобки, тире, слэши)
  const words = cleanTarget.split(/[\s\(\)\/\-\,\.]+/).filter(Boolean);
  if (words.some(w => w.startsWith(cleanQuery))) return true;

  // 3. Фонетическое / транслитерационное совпадение первой буквы или префикса
  const prefixes = getTransliterationPrefixes(cleanQuery);
  for (const p of prefixes) {
    if (cleanTarget.startsWith(p)) return true;
    if (words.some(w => w.startsWith(p))) return true;
  }

  // 4. При вводе от 3 символов разрешаем вхождение подстроки (как запасной вариант)
  if (cleanQuery.length >= 3 && cleanTarget.includes(cleanQuery)) {
    return true;
  }

  return false;
}

/**
 * Приоритет ранжирования:
 * 0 - Название начинается в точности с запроса (например "Наггет" при вводе "Н" или "На")
 * 1 - Одно из слов в названии начинается с запроса (например "Nugget (Наггет)" при вводе "Н")
 * 2 - Название начинается с транслитерированной буквы/префикса (например "Nugget" при вводе "Н")
 * 3 - Одно из слов начинается с транслитерированной буквы/префикса
 * 10 - Подстрока внутри названия (для длинных запросов)
 */
function getMatchScore(target: string, query: string): number {
  if (!query) return 100;
  const cleanTarget = target.toLowerCase().trim();
  const cleanQuery = query.toLowerCase().trim();

  if (cleanTarget.startsWith(cleanQuery)) return 0;

  const words = cleanTarget.split(/[\s\(\)\/\-\,\.]+/).filter(Boolean);
  if (words.some(w => w.startsWith(cleanQuery))) return 1;

  const prefixes = getTransliterationPrefixes(cleanQuery);
  for (const p of prefixes) {
    if (cleanTarget.startsWith(p)) return 2;
    if (words.some(w => w.startsWith(p))) return 3;
  }

  if (cleanQuery.length >= 3 && cleanTarget.includes(cleanQuery)) return 10;
  return 999;
}

export const IngredientSearchSelect: React.FC<Props> = ({
  type,
  onSelectGrain,
  onSelectHop,
  onCustomAdd,
  className = '',
  placeholder
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Каталог всех доступных солодов
  const allGrains: GrainOption[] = useMemo(() => {
    const list: GrainOption[] = [];
    // Курский солод - первоочередный приоритет
    KURSK_MALT_PRODUCTS.forEach(g => {
      list.push({
        name: g.name,
        potentialSg: g.potentialSg,
        colorEbc: g.colorEbc,
        type: g.type,
        group: 'Курский солод',
        isKursk: true
      });
    });
    // Импортные солода
    COMMON_GRAINS.forEach(g => {
      if (!list.some(existing => existing.name === g.name)) {
        list.push({
          name: g.name,
          potentialSg: g.potentialSg,
          colorEbc: g.colorEbc,
          type: g.type,
          group: g.group || 'Импортный',
          isKursk: isKurskMalt(g.name)
        });
      }
    });
    return list;
  }, []);

  // Фильтрация солодов по началу ввода букв
  const filteredGrains = useMemo(() => {
    const q = search.trim();
    if (!q) {
      // Когда поиск пустой: показываем сначала Курские солода, затем популярные импортные
      return allGrains.slice(0, 35);
    }
    return allGrains
      .filter(g => matchesPrefix(g.name, q) || (g.group && matchesPrefix(g.group, q)))
      .sort((a, b) => {
        const scoreA = getMatchScore(a.name, q);
        const scoreB = getMatchScore(b.name, q);
        if (scoreA !== scoreB) return scoreA - scoreB;
        if (a.isKursk && !b.isKursk) return -1;
        if (!a.isKursk && b.isKursk) return 1;
        return a.name.localeCompare(b.name, 'ru');
      })
      .slice(0, 35);
  }, [allGrains, search]);

  // Фильтрация хмелей по началу ввода букв
  const filteredHops = useMemo(() => {
    const q = search.trim();
    if (!q) {
      // По умолчанию показываем срез популярных сортов
      return COMMON_HOPS.slice(0, 35);
    }
    return COMMON_HOPS
      .filter(h => matchesPrefix(h.name, q) || (h.region && matchesPrefix(h.region, q)))
      .sort((a, b) => {
        const scoreA = getMatchScore(a.name, q);
        const scoreB = getMatchScore(b.name, q);
        if (scoreA !== scoreB) return scoreA - scoreB;
        return a.name.localeCompare(b.name, 'ru');
      })
      .slice(0, 35);
  }, [search]);

  // Закрытие при клике снаружи
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectGrainItem = (grain: GrainOption) => {
    onSelectGrain?.(grain);
    setSearch('');
    setIsOpen(false);
  };

  const handleSelectHopItem = (hop: HopOption) => {
    onSelectHop?.(hop);
    setSearch('');
    setIsOpen(false);
  };

  const handleCreateCustom = () => {
    onCustomAdd(search.trim() || undefined);
    setSearch('');
    setIsOpen(false);
  };

  const currentCount = type === 'grain' ? filteredGrains.length : filteredHops.length;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev + 1) % (currentCount + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev - 1 + currentCount + 1) % (currentCount + 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex === currentCount || currentCount === 0) {
        handleCreateCustom();
      } else if (type === 'grain' && filteredGrains[highlightedIndex]) {
        handleSelectGrainItem(filteredGrains[highlightedIndex]);
      } else if (type === 'hop' && filteredHops[highlightedIndex]) {
        handleSelectHopItem(filteredHops[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const defaultPlaceholder = type === 'grain'
    ? '🔍 Найти солод (введите «К», «Пилснер»...)'
    : '🔍 Найти хмель (введите «Н», «Наггет», «Citra»...)';

  return (
    <div ref={containerRef} className={`relative min-w-0 ${className}`}>
      {/* Строка поиска с иконкой */}
      <div className="relative flex items-center">
        <div className="absolute left-2.5 pointer-events-none text-stone-400 dark:text-stone-500">
          {type === 'grain' ? (
            <Wheat className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
          ) : (
            <Flame className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={search}
          onFocus={() => {
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || defaultPlaceholder}
          className={`w-full pl-8 pr-8 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold bg-white dark:bg-stone-850 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-900 dark:text-stone-100 border transition-all focus:outline-none focus:ring-2 shadow-2xs ${
            type === 'grain'
              ? 'border-amber-300 dark:border-amber-700/80 focus:ring-amber-500/30 focus:border-amber-500'
              : 'border-emerald-300 dark:border-emerald-700/80 focus:ring-emerald-500/30 focus:border-emerald-500'
          }`}
        />

        {search ? (
          <button
            type="button"
            onClick={() => {
              setSearch('');
              inputRef.current?.focus();
            }}
            className="absolute right-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-0.5 rounded cursor-pointer"
            title="Очистить поиск"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="absolute right-2 text-stone-400 pointer-events-none">
            <Search className="w-3.5 h-3.5 opacity-60" />
          </div>
        )}
      </div>

      {/* Выпадающий список результатов */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 max-h-80 overflow-y-auto rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-2xl divide-y divide-stone-100 dark:divide-stone-800 swipe-scroll-x animate-in fade-in zoom-in-95 duration-100 min-w-[280px] sm:min-w-[340px]">
          {/* Информационная строка активного поиска */}
          {search ? (
            <div className="px-3 py-1.5 bg-stone-50/90 dark:bg-stone-850 text-[10px] text-stone-500 dark:text-stone-400 flex items-center justify-between">
              <span>
                Совпадение по началу «<b className="text-amber-800 dark:text-amber-300 font-extrabold">{search}</b>»:
              </span>
              <span className="font-mono font-bold bg-stone-200/70 dark:bg-stone-800 px-1.5 py-0.2 rounded text-[9px]">
                {currentCount} {type === 'grain' ? 'солодов' : 'хмелей'}
              </span>
            </div>
          ) : (
            <div className="px-3 py-1.5 bg-stone-50/90 dark:bg-stone-850 text-[10px] text-stone-500 dark:text-stone-400 flex items-center justify-between">
              <span>
                {type === 'grain' ? '🌾 Начните ввод буквы (К, П, В...) или выберите:' : '🌿 Начните ввод буквы (Н, C, М...) или выберите:'}
              </span>
              <span className="text-[9px] text-stone-400">быстрый выбор</span>
            </div>
          )}

          {/* Результаты для СОЛОДА */}
          {type === 'grain' && (
            <div className="py-1">
              {filteredGrains.length === 0 ? (
                <div className="p-3 text-center text-xs text-stone-500">
                  Солод с началом на «{search}» не найден
                </div>
              ) : (
                filteredGrains.map((g, idx) => {
                  const isHighlighted = idx === highlightedIndex;
                  return (
                    <button
                      key={`${g.name}_${idx}`}
                      type="button"
                      onClick={() => handleSelectGrainItem(g)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={`w-full px-3 py-2 text-left flex items-center justify-between gap-2 transition-colors cursor-pointer text-xs ${
                        isHighlighted
                          ? 'bg-amber-500/15 dark:bg-amber-950/60 text-amber-950 dark:text-amber-200'
                          : 'hover:bg-stone-50 dark:hover:bg-stone-850 text-stone-800 dark:text-stone-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 border border-stone-300 dark:border-stone-600 shadow-2xs"
                          style={{ backgroundColor: ebcToHex(g.colorEbc) }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-[11px] sm:text-xs leading-tight truncate">
                            {g.name}
                          </div>
                          <div className="text-[10px] text-stone-500 dark:text-stone-400 flex items-center gap-1.5 mt-0.5">
                            {g.isKursk ? (
                              <span className="px-1.5 py-0.2 rounded font-bold bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-300/40 text-[9px]">
                                🌾 Курский
                              </span>
                            ) : (
                              <span className="opacity-80 text-[10px]">{g.group}</span>
                            )}
                            <span>•</span>
                            <span className="font-mono font-bold text-[10px]">{g.colorEbc} EBC</span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400">
                        <Plus className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Добавить</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {/* Результаты для ХМЕЛЯ */}
          {type === 'hop' && (
            <div className="py-1">
              {filteredHops.length === 0 ? (
                <div className="p-3 text-center text-xs text-stone-500">
                  Хмель с началом на «{search}» не найден
                </div>
              ) : (
                filteredHops.map((h, idx) => {
                  const isHighlighted = idx === highlightedIndex;
                  return (
                    <button
                      key={`${h.name}_${idx}`}
                      type="button"
                      onClick={() => handleSelectHopItem(h)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={`w-full px-3 py-2 text-left flex items-center justify-between gap-2 transition-colors cursor-pointer text-xs ${
                        isHighlighted
                          ? 'bg-emerald-500/15 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-200'
                          : 'hover:bg-stone-50 dark:hover:bg-stone-850 text-stone-800 dark:text-stone-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs shrink-0">
                          🌿
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-[11px] sm:text-xs leading-tight truncate">
                            {h.name}
                          </div>
                          <div className="text-[10px] text-stone-500 dark:text-stone-400 flex items-center gap-1.5 mt-0.5 truncate">
                            <span className="px-1.5 py-0.2 rounded font-mono font-bold bg-emerald-500/15 text-emerald-900 dark:text-emerald-300 text-[9px]">
                              α {h.alphaAcid}%
                            </span>
                            {h.region && (
                              <span className="font-semibold text-stone-600 dark:text-stone-300 text-[10px]">{h.region}</span>
                            )}
                            {h.profile && (
                              <>
                                <span>•</span>
                                <span className="truncate opacity-75 text-[10px]">{h.profile}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                        <Plus className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Добавить</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {/* Опция создания своего солода или хмеля с произвольными свойствами */}
          <div className="p-1.5 bg-stone-50 dark:bg-stone-850">
            <button
              type="button"
              onClick={handleCreateCustom}
              className="w-full py-2 px-3 rounded-lg border border-dashed border-stone-300 dark:border-stone-700 hover:border-amber-400 dark:hover:border-amber-600 hover:bg-white dark:hover:bg-stone-800 text-left flex items-center justify-between text-xs font-bold text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 truncate">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate">
                  {search.trim()
                    ? `✍️ Создать «${search.trim()}» (свой ${type === 'grain' ? 'солод' : 'хмель'})`
                    : `✍️ + Создать свой ${type === 'grain' ? 'солод' : 'хмель'} с нуля`}
                </span>
              </div>
              <span className="text-[10px] text-amber-700 dark:text-amber-400 font-normal shrink-0 ml-1">
                свои параметры
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
