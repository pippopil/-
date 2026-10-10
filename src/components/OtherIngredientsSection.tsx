import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  Clock,
  Search,
  X,
  Apple,
  Candy,
  Flame,
  Droplet,
  Beaker,
  TreePine,
  Check
} from 'lucide-react';
import { OtherIngredientItem, OtherIngredientStage, OtherIngredientType } from '../types/brewing';
import {
  ALL_ADDITIONAL_INGREDIENTS,
  PredefinedOtherIngredient,
  searchAdditionalIngredients
} from '../data/additionalIngredients';

interface Props {
  ingredients: OtherIngredientItem[];
  onChange: (items: OtherIngredientItem[]) => void;
  batchSizeL: number;
}

const STAGE_LABELS: Record<OtherIngredientStage, { label: string; icon: string }> = {
  mash: { label: 'Затирание (Мэш)', icon: '🌾' },
  boil: { label: 'Варка (Кипячение)', icon: '🔥' },
  primary: { label: 'Первичное брожение', icon: '🫧' },
  secondary: { label: 'Вторичное брожение / Выдержка', icon: '🧊' },
  bottling: { label: 'Розлив (Карбонизация)', icon: '🍾' }
};

const CATEGORY_TABS: Array<{ id: 'all' | 'sugar' | 'spice' | 'fruit' | 'fining' | 'water_agent' | 'wood' | 'flavor'; label: string; icon: string }> = [
  { id: 'all', label: 'Все', icon: '✨' },
  { id: 'sugar', label: 'Сахара и мёд', icon: '🍯' },
  { id: 'spice', label: 'Специи и цедра', icon: '🌿' },
  { id: 'fruit', label: 'Фрукты и ягоды', icon: '🍒' },
  { id: 'fining', label: 'Осветлители', icon: '🧪' },
  { id: 'water_agent', label: 'Соли и кислоты', icon: '💧' },
  { id: 'wood', label: 'Дуб и выдержка', icon: '🪵' },
  { id: 'flavor', label: 'Ароматизаторы', icon: '☕' },
];

export const OtherIngredientsSection: React.FC<Props> = ({
  ingredients,
  onChange,
  batchSizeL
}) => {
  const [search, setSearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeCategoryTab, setActiveCategoryTab] = useState<'all' | 'sugar' | 'spice' | 'fruit' | 'fining' | 'water_agent' | 'wood' | 'flavor'>('all');
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Закрытие выпадающего списка при клике снаружи
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCatalog = React.useMemo(() => {
    let list = searchAdditionalIngredients(search);
    if (activeCategoryTab !== 'all') {
      list = list.filter(item => {
        if (activeCategoryTab === 'sugar') return item.type === 'sugar';
        if (activeCategoryTab === 'spice') return item.type === 'spice' || item.category === 'herb';
        if (activeCategoryTab === 'fruit') return item.type === 'fruit';
        if (activeCategoryTab === 'fining') return item.type === 'fining';
        if (activeCategoryTab === 'water_agent') return item.type === 'water_agent';
        if (activeCategoryTab === 'wood') return item.type === 'wood';
        if (activeCategoryTab === 'flavor') return item.type === 'flavor';
        return true;
      });
    }
    return list.slice(0, 40);
  }, [search, activeCategoryTab]);

  const handleAddPredefined = (item: PredefinedOtherIngredient) => {
    // Масштабируем дозировку под размер варки (базовый 30л)
    const scale = batchSizeL > 0 ? batchSizeL / 30 : 1;
    let initialAmount = Number((item.defaultAmount * scale).toFixed(item.defaultUnit === 'kg' ? 2 : 1));
    if (initialAmount <= 0) initialAmount = item.defaultAmount;

    const newItem: OtherIngredientItem = {
      id: `other_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: item.name,
      amount: initialAmount,
      unit: item.defaultUnit,
      stage: item.stage,
      timeMinOrDays: item.timeMinOrDays,
      type: item.type,
      colorEbc: item.colorEbc,
      extractPercent: item.extractPercent,
      fermentablePercent: item.fermentablePercent,
      notes: item.description
    };

    onChange([...ingredients, newItem]);
    setSearch('');
    setIsSearchOpen(false);
  };

  const handleAddCustom = (customName?: string) => {
    const newItem: OtherIngredientItem = {
      id: `other_cust_${Date.now()}`,
      name: customName?.trim() || 'Пользовательская добавка',
      amount: 10,
      unit: 'g',
      stage: 'boil',
      timeMinOrDays: 10,
      type: 'other',
      notes: ''
    };
    onChange([...ingredients, newItem]);
    setSearch('');
    setIsSearchOpen(false);
  };

  const handleUpdateItem = (id: string, updates: Partial<OtherIngredientItem>) => {
    onChange(
      ingredients.map(item => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const handleRemoveItem = (id: string) => {
    onChange(ingredients.filter(item => item.id !== id));
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-stone-200/80 dark:border-stone-800 space-y-5">
      {/* Шапка блока */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 dark:border-stone-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-stone-900 dark:text-white leading-tight">
                Дополнительные ингредиенты и добавки
              </h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                {ingredients.length}
              </span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              Мёд, декстроза, лактоза, фрукты, специи, цедра, ирландский мох, соли и выдержка на дубе
            </p>
          </div>
        </div>

        {/* Строка поиска и быстрого добавления */}
        <div ref={searchContainerRef} className="relative w-full sm:w-80 shrink-0">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onFocus={() => setIsSearchOpen(true)}
              onChange={(e) => {
                setSearch(e.target.value);
                setIsSearchOpen(true);
              }}
              placeholder="🔍 Найти добавку (мёд, мох, цедра...)"
              className="w-full pl-9 pr-8 py-2 rounded-xl text-xs font-semibold bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  searchInputRef.current?.focus();
                }}
                className="absolute right-2.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Выпадающий список базы добавок */}
          {isSearchOpen && (
            <div className="absolute z-50 left-0 right-0 mt-1 max-h-80 overflow-y-auto rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-2xl divide-y divide-stone-100 dark:divide-stone-800 animate-in fade-in zoom-in-95 duration-100 min-w-[300px]">
              {/* Категории фильтрации внутри поиска */}
              <div className="p-1.5 bg-stone-50 dark:bg-stone-850 flex items-center gap-1 overflow-x-auto swipe-scroll-x">
                {CATEGORY_TABS.map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveCategoryTab(tab.id)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer ${
                      activeCategoryTab === tab.id
                        ? 'bg-amber-500 text-stone-950 shadow-2xs'
                        : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-750'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Результаты поиска */}
              <div className="py-1">
                {filteredCatalog.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-xs text-stone-500 mb-2">Ничего не найдено по запросу «{search}»</p>
                    <button
                      type="button"
                      onClick={() => handleAddCustom(search)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Создать свой: «{search}»</span>
                    </button>
                  </div>
                ) : (
                  filteredCatalog.map((item, idx) => (
                    <button
                      key={`${item.name}_${idx}`}
                      type="button"
                      onClick={() => handleAddPredefined(item)}
                      className="w-full px-3 py-2 text-left hover:bg-amber-50/60 dark:hover:bg-amber-950/40 flex items-center justify-between gap-2 transition-colors cursor-pointer"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-stone-900 dark:text-stone-100">
                            {item.name}
                          </span>
                          {item.extractPercent && item.extractPercent > 0 && (
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                              {item.extractPercent}% экстр.
                            </span>
                          )}
                          {item.colorEbc && item.colorEbc > 0 && (
                            <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                              {item.colorEbc} EBC
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
                          {STAGE_LABELS[item.stage].icon} {STAGE_LABELS[item.stage].label} • {item.description}
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    </button>
                  ))
                )}
              </div>

              {/* Кнопка добавления кастомного */}
              <div className="p-2 bg-stone-50 dark:bg-stone-850">
                <button
                  type="button"
                  onClick={() => handleAddCustom(search)}
                  className="w-full py-1.5 rounded-lg border border-dashed border-stone-300 dark:border-stone-700 hover:border-amber-500 text-stone-600 dark:text-stone-300 hover:text-amber-600 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Добавить свою произвольную добавку</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Быстрые чипы популярных ингредиентов для быстрого добавления */}
      {ingredients.length === 0 && (
        <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
            <Candy className="w-4 h-4 text-amber-600" />
            <span>Частые добавки для варки в 1 клик:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { name: 'Мёд', icon: '🍯', note: '1 кг (Кипячение)' },
              { name: 'Декстроза', icon: '🍬', note: '0.5 кг' },
              { name: 'Лактоза', icon: '🥛', note: '0.5 кг (Sweet Stout)' },
              { name: 'Ирландский мох', icon: '🌿', note: '5 г (Осветление)' },
              { name: 'Кориандр молотый', icon: '🌱', note: '15 г (Витбир)' },
              { name: 'Цедра апельсина', icon: '🍊', note: '20 г' },
              { name: 'Вишня', icon: '🍒', note: '2 кг (Вторичка)' },
              { name: 'Дубовая щепа', icon: '🪵', note: '40 г' },
              { name: 'Молочная кислота', icon: '🧪', note: '5 мл (pH затора)' },
              { name: 'Какао-бобы', icon: '🍫', note: '100 г' },
              { name: 'Вирофлок', icon: '✨', note: '1 шт' },
            ].map((chip) => (
              <button
                key={chip.name}
                type="button"
                onClick={() => {
                  const found = ALL_ADDITIONAL_INGREDIENTS.find(x => x.name.toLowerCase().includes(chip.name.toLowerCase()));
                  if (found) handleAddPredefined(found);
                  else handleAddCustom(chip.name);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-stone-850 border border-amber-200 dark:border-stone-700 hover:border-amber-400 dark:hover:border-amber-600 text-stone-800 dark:text-stone-200 text-xs font-semibold flex items-center gap-1.5 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
              >
                <span>{chip.icon}</span>
                <span>{chip.name}</span>
                <span className="text-[10px] text-stone-400">({chip.note})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Список добавленных ингредиентов */}
      {ingredients.length > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ingredients.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-850/80 border border-stone-200/80 dark:border-stone-800 flex flex-col justify-between gap-3 relative group transition-all hover:border-amber-300 dark:hover:border-amber-700/60 shadow-2xs"
              >
                <div className="space-y-2">
                  {/* Верхняя строка: Название и удаление */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleUpdateItem(item.id, { name: e.target.value })}
                        className="font-black text-sm text-stone-900 dark:text-stone-100 bg-transparent border-b border-transparent hover:border-stone-300 focus:border-amber-500 focus:outline-none w-full"
                        placeholder="Название ингредиента"
                      />
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-200/70 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                          {STAGE_LABELS[item.stage].icon} {STAGE_LABELS[item.stage].label}
                        </span>
                        {item.extractPercent && item.extractPercent > 0 && (
                          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
                            {item.extractPercent}% экстр. / {item.fermentablePercent ?? 100}% сбраж.
                          </span>
                        )}
                        {item.colorEbc && item.colorEbc > 0 && (
                          <span className="text-[10px] text-stone-500 dark:text-stone-400">
                            {item.colorEbc} EBC
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                      title="Удалить ингредиент"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Вторая строка: Количество, Единица и Этап внесения */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                    {/* Количество и единицы */}
                    <div className="flex items-center gap-1 bg-white dark:bg-stone-800 rounded-xl p-1 border border-stone-200 dark:border-stone-700">
                      <input
                        type="number"
                        step={item.unit === 'kg' ? '0.05' : '1'}
                        min="0"
                        value={item.amount}
                        onChange={(e) => handleUpdateItem(item.id, { amount: parseFloat(e.target.value) || 0 })}
                        className="w-16 px-1.5 py-1 text-xs font-bold text-stone-900 dark:text-stone-100 bg-transparent text-right focus:outline-none"
                      />
                      <select
                        value={item.unit}
                        onChange={(e) => handleUpdateItem(item.id, { unit: e.target.value as any })}
                        className="text-xs font-bold text-stone-600 dark:text-stone-300 bg-transparent pr-1 cursor-pointer focus:outline-none"
                      >
                        <option value="kg">кг</option>
                        <option value="g">г</option>
                        <option value="ml">мл</option>
                        <option value="pcs">шт</option>
                        <option value="drop">капель</option>
                      </select>
                    </div>

                    {/* Этап внесения */}
                    <div className="col-span-1 sm:col-span-2">
                      <select
                        value={item.stage}
                        onChange={(e) => handleUpdateItem(item.id, { stage: e.target.value as OtherIngredientStage })}
                        className="w-full h-full px-2 py-1 text-xs font-semibold bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                      >
                        <option value="boil">🔥 Кипячение (Варка)</option>
                        <option value="mash">🌾 Затирание (Затор)</option>
                        <option value="primary">🫧 Главное брожение</option>
                        <option value="secondary">🧊 Вторичное / Выдержка</option>
                        <option value="bottling">🍾 Розлив / Карбонизация</option>
                      </select>
                    </div>
                  </div>

                  {/* Время внесения / примечание */}
                  <div className="flex items-center gap-2 pt-1 text-xs">
                    {(item.stage === 'boil' || item.stage === 'secondary') && (
                      <div className="flex items-center gap-1.5 bg-white dark:bg-stone-800 px-2 py-1 rounded-lg border border-stone-200 dark:border-stone-700 shrink-0">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        <span className="text-[10px] text-stone-500">
                          {item.stage === 'boil' ? 'мин кипа:' : 'дней:'}
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={item.timeMinOrDays ?? (item.stage === 'boil' ? 10 : 7)}
                          onChange={(e) => handleUpdateItem(item.id, { timeMinOrDays: parseInt(e.target.value, 10) || 0 })}
                          className="w-10 text-[11px] font-bold text-stone-800 dark:text-stone-200 bg-transparent text-center focus:outline-none"
                        />
                      </div>
                    )}
                    <input
                      type="text"
                      value={item.notes || ''}
                      onChange={(e) => handleUpdateItem(item.id, { notes: e.target.value })}
                      placeholder="Примечание к добавлению..."
                      className="flex-1 px-2 py-1 text-[11px] text-stone-600 dark:text-stone-300 bg-transparent border border-dashed border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:border-amber-400 truncate"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Кнопка добавления еще одной добавки */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => handleAddCustom()}
              className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-300 dark:border-amber-700/80 text-amber-900 dark:text-amber-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>+ Добавить еще ингредиент</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
