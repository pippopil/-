import React, { useState, useMemo } from 'react';
import { InventoryItem, Recipe, RecipeMatchResult } from '../types/brewing';
import { COMMON_GRAINS, COMMON_HOPS, COMMON_YEASTS } from '../data/defaultData';
import { ebcToHex } from '../utils/brewingMath';
import {
  Search,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ShoppingCart,
  ArrowRight,
  Filter,
  Sparkles,
  Package,
  Layers,
  Flame,
  Beer
} from 'lucide-react';

interface Props {
  inventory: InventoryItem[];
  recipes: Recipe[];
  onUpdateInventory: (inv: InventoryItem[]) => void;
  onSelectRecipe: (recipe: Recipe) => void;
}

export const IngredientMatcher: React.FC<Props> = ({
  inventory,
  recipes,
  onUpdateInventory,
  onSelectRecipe
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'full_match' | 'high_match'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [inventoryCategory, setInventoryCategory] = useState<'all' | 'grain' | 'hop' | 'yeast' | 'misc'>('all');

  // Форма добавления нового ингредиента в кладовую
  const [newInvName, setNewInvName] = useState('');
  const [newInvCategory, setNewInvCategory] = useState<'grain' | 'hop' | 'yeast' | 'misc'>('grain');
  const [newInvAmount, setNewInvAmount] = useState<number>(5.0);
  const [newInvUnit, setNewInvUnit] = useState<'kg' | 'g' | 'pack'>('kg');

  // Добавление в инвентарь
  const handleAddInventory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvName.trim()) return;

    const newItem: InventoryItem = {
      id: `inv_${Date.now()}`,
      name: newInvName.trim(),
      category: newInvCategory,
      amount: newInvAmount,
      unit: newInvUnit
    };
    onUpdateInventory([...inventory, newItem]);
    setNewInvName('');
  };

  const removeInventoryItem = (id: string) => {
    onUpdateInventory(inventory.filter(item => item.id !== id));
  };

  const updateInventoryAmount = (id: string, amount: number) => {
    onUpdateInventory(
      inventory.map(item => (item.id === id ? { ...item, amount: Math.max(0, amount) } : item))
    );
  };

  // Умный алгоритм сопоставления рецептов с запасами в кладовой
  const matchResults: RecipeMatchResult[] = useMemo(() => {
    return recipes.map(recipe => {
      let totalItems = 0;
      let matchedItems = 0;
      const availableIngredients: string[] = [];
      const missingIngredients: RecipeMatchResult['missingIngredients'] = [];

      // 1. Проверка солодов
      recipe.grains.forEach(grain => {
        totalItems += 1;
        const matched = inventory.find(
          inv =>
            inv.category === 'grain' &&
            (inv.name.toLowerCase().includes(grain.name.toLowerCase()) ||
              grain.name.toLowerCase().includes(inv.name.toLowerCase()))
        );

        if (matched && matched.amount >= grain.weightKg) {
          matchedItems += 1;
          availableIngredients.push(`${grain.name} (${grain.weightKg} кг)`);
        } else {
          const invAmount = matched ? matched.amount : 0;
          missingIngredients.push({
            name: grain.name,
            category: 'grain',
            requiredAmount: grain.weightKg,
            unit: 'кг',
            inventoryAmount: invAmount,
            differenceToBuy: Number((grain.weightKg - invAmount).toFixed(2))
          });
        }
      });

      // 2. Проверка хмелей
      recipe.hops.forEach(hop => {
        totalItems += 1;
        const matched = inventory.find(
          inv =>
            inv.category === 'hop' &&
            (inv.name.toLowerCase().includes(hop.name.toLowerCase()) ||
              hop.name.toLowerCase().includes(inv.name.toLowerCase()))
        );

        if (matched && matched.amount >= hop.weightG) {
          matchedItems += 1;
          availableIngredients.push(`${hop.name} (${hop.weightG} г)`);
        } else {
          const invAmount = matched ? matched.amount : 0;
          missingIngredients.push({
            name: hop.name,
            category: 'hop',
            requiredAmount: hop.weightG,
            unit: 'г',
            inventoryAmount: invAmount,
            differenceToBuy: Number((hop.weightG - invAmount).toFixed(1))
          });
        }
      });

      // 3. Проверка дрожжей
      totalItems += 1;
      const matchedYeast = inventory.find(
        inv =>
          inv.category === 'yeast' &&
          (inv.name.toLowerCase().includes(recipe.yeast.name.toLowerCase()) ||
            recipe.yeast.name.toLowerCase().includes(inv.name.toLowerCase()))
      );

      if (matchedYeast && matchedYeast.amount >= recipe.calculated.yeastPacksNeeded) {
        matchedItems += 1;
        availableIngredients.push(`${recipe.yeast.name} (${recipe.calculated.yeastPacksNeeded} пач.)`);
      } else {
        const invPacks = matchedYeast ? matchedYeast.amount : 0;
        missingIngredients.push({
          name: recipe.yeast.name,
          category: 'yeast',
          requiredAmount: recipe.calculated.yeastPacksNeeded,
          unit: 'пач.',
          inventoryAmount: invPacks,
          differenceToBuy: Math.max(1, recipe.calculated.yeastPacksNeeded - invPacks)
        });
      }

      const matchPercentage = totalItems > 0 ? Math.round((matchedItems / totalItems) * 100) : 0;
      const isFullyMatch = missingIngredients.length === 0;

      return {
        recipe,
        matchPercentage,
        isFullyMatch,
        availableIngredients,
        missingIngredients
      };
    }).sort((a, b) => b.matchPercentage - a.matchPercentage);
  }, [recipes, inventory]);

  // Фильтрация результатов
  const filteredMatches = useMemo(() => {
    return matchResults.filter(({ recipe, isFullyMatch, matchPercentage }) => {
      const matchesSearch =
        recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.style.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.grains.some(g => g.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        recipe.hops.some(h => h.name.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      if (filterType === 'full_match' && !isFullyMatch) return false;
      if (filterType === 'high_match' && matchPercentage < 60) return false;

      if (categoryFilter !== 'all' && recipe.category !== categoryFilter) return false;

      return true;
    });
  }, [matchResults, searchTerm, filterType, categoryFilter]);

  const categories = Array.from(new Set(recipes.map(r => r.category)));

  return (
    <div className="space-y-6 pb-12">
      {/* Верхний блок: Кладовая пивовара (Pantry) */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 sm:p-6 shadow-sm border border-stone-200/80 dark:border-stone-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 dark:border-stone-800 pb-4">
          <div>
            <h2 className="text-xl font-extrabold text-stone-900 dark:text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-600" />
              <span>Моя кладовая пивовара (Запасы ингредиентов)</span>
            </h2>
            <p className="text-xs text-stone-500">
              Внесите имеющиеся солода, хмели и дрожжи — система автоматически подберет подходящие рецепты
            </p>
          </div>

          <div className="flex items-center gap-2">
            {(['all', 'grain', 'hop', 'yeast', 'misc'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setInventoryCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  inventoryCategory === cat
                    ? 'bg-amber-500 text-white'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                }`}
              >
                {cat === 'all' ? 'Все' : cat === 'grain' ? 'Солод' : cat === 'hop' ? 'Хмель' : cat === 'yeast' ? 'Дрожжи' : 'Разное'}
              </button>
            ))}
          </div>
        </div>

        {/* Форма добавления нового ингредиента в кладовую */}
        <form onSubmit={handleAddInventory} className="flex flex-wrap items-center gap-2 pt-1">
          <input
            type="text"
            placeholder="Название (напр. Pilsner, Citra, US-05)..."
            value={newInvName}
            onChange={(e) => setNewInvName(e.target.value)}
            className="flex-1 min-w-[200px] bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-medium text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />

          <select
            value={newInvCategory}
            onChange={(e) => {
              const cat = e.target.value as any;
              setNewInvCategory(cat);
              if (cat === 'grain') setNewInvUnit('kg');
              else if (cat === 'hop') setNewInvUnit('g');
              else if (cat === 'yeast') setNewInvUnit('pack');
            }}
            className="bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-medium text-stone-900 dark:text-stone-100 focus:outline-none"
          >
            <option value="grain">Солод (Grain)</option>
            <option value="hop">Хмель (Hop)</option>
            <option value="yeast">Дрожжи (Yeast)</option>
            <option value="misc">Добавки / Праймер</option>
          </select>

          <input
            type="number"
            step={newInvUnit === 'kg' ? '0.1' : '1'}
            min="0.1"
            value={newInvAmount}
            onChange={(e) => setNewInvAmount(parseFloat(e.target.value) || 1)}
            className="w-24 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-center"
          />

          <span className="text-xs font-medium text-stone-500 font-mono">{newInvUnit}</span>

          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>В кладовую</span>
          </button>
        </form>

        {/* Список текущих запасов */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-2">
          {inventory
            .filter(item => inventoryCategory === 'all' || item.category === inventoryCategory)
            .map(item => (
              <div
                key={item.id}
                className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700/80 flex flex-col justify-between group hover:border-amber-400 transition-colors"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      {item.category === 'grain' ? 'Солод' : item.category === 'hop' ? 'Хмель' : item.category === 'yeast' ? 'Дрожжи' : 'Разное'}
                    </span>
                    <button
                      onClick={() => removeInventoryItem(item.id)}
                      className="text-stone-300 hover:text-red-500 transition-colors"
                      title="Удалить из кладовой"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="font-bold text-xs text-stone-800 dark:text-stone-200 line-clamp-1 mt-1">
                    {item.name}
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-1">
                  <input
                    type="number"
                    value={item.amount}
                    onChange={(e) => updateInventoryAmount(item.id, parseFloat(e.target.value) || 0)}
                    className="w-full bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded px-1.5 py-0.5 text-xs font-mono font-bold text-stone-900 dark:text-stone-100"
                  />
                  <span className="text-[10px] text-stone-500 font-mono">{item.unit}</span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Подбор рецептов (Smart Matcher) */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 sm:p-6 shadow-sm border border-stone-200/80 dark:border-stone-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-stone-100 dark:border-stone-800 pb-4">
          <div>
            <h2 className="text-xl font-extrabold text-stone-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>Рецепты под ваши запасы ({filteredMatches.length})</span>
            </h2>
            <p className="text-xs text-stone-500">
              Зеленым отмечены готовые к варке на 100%, желтым — рецепты с подсказкой «Что докупить»
            </p>
          </div>

          {/* Фильтры и поиск */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Поиск по названию или хмелю..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none"
            >
              <option value="all">Все совпадения</option>
              <option value="full_match">Только 100% (Можно варить)</option>
              <option value="high_match">Совпадение от 60%</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none"
            >
              <option value="all">Все стили</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Сетка карточек совпадений */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMatches.map(({ recipe, matchPercentage, isFullyMatch, availableIngredients, missingIngredients }) => {
            const hex = ebcToHex(recipe.calculated.ebc);
            return (
              <div
                key={recipe.id}
                className={`rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                  isFullyMatch
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/80 shadow-xs'
                    : 'bg-white dark:bg-stone-900 border-stone-200/90 dark:border-stone-800 hover:border-amber-400'
                }`}
              >
                <div>
                  {/* Заголовок рецепта и процент готовности */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl shadow-xs border border-white/40 flex items-center justify-center shrink-0"
                        style={{ backgroundColor: hex }}
                      >
                        <Beer className="w-5 h-5 text-white/90 drop-shadow" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base text-stone-900 dark:text-white leading-tight">
                          {recipe.name}
                        </h3>
                        <div className="text-xs text-stone-500 font-medium mt-0.5">
                          {recipe.style} • {recipe.category}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold ${
                        isFullyMatch
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                          : matchPercentage >= 60
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                      }`}>
                        {isFullyMatch ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
                        <span>{matchPercentage}% в наличии</span>
                      </span>
                    </div>
                  </div>

                  {/* Характеристики партии */}
                  <div className="grid grid-cols-4 gap-2 my-3 p-2.5 rounded-xl bg-stone-100/70 dark:bg-stone-800/60 text-center font-mono text-xs">
                    <div>
                      <span className="text-[10px] text-stone-400 font-sans block">НП</span>
                      <b>{recipe.calculated.ogSg.toFixed(3)}</b>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 font-sans block">ABV</span>
                      <b className="text-amber-600 dark:text-amber-400">{recipe.calculated.abv}%</b>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 font-sans block">IBU</span>
                      <b>{recipe.calculated.ibu}</b>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 font-sans block">Объем</span>
                      <b>{recipe.batchSizeL} л</b>
                    </div>
                  </div>

                  {/* Блок: Что есть в наличии */}
                  {availableIngredients.length > 0 && (
                    <div className="mb-2">
                      <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 mb-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Есть в запасе ({availableIngredients.length}):</span>
                      </div>
                      <div className="text-xs text-stone-600 dark:text-stone-300 flex flex-wrap gap-1">
                        {availableIngredients.map((item, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 text-[11px]">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Блок: Что докупить/добавить */}
                  {missingIngredients.length > 0 && (
                    <div className="mt-2 p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60">
                      <div className="text-[11px] font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1 mb-1">
                        <ShoppingCart className="w-3.5 h-3.5 text-amber-600" />
                        <span>Необходимо докупить ({missingIngredients.length}):</span>
                      </div>
                      <ul className="space-y-1 text-xs text-stone-700 dark:text-stone-300">
                        {missingIngredients.map((item, idx) => (
                          <li key={idx} className="flex justify-between items-center text-[11px]">
                            <span>{item.name}:</span>
                            <b className="text-amber-700 dark:text-amber-400 font-mono">
                              +{item.differenceToBuy} {item.unit}
                            </b>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Кнопка запуска */}
                <div className="pt-4 border-t border-stone-100 dark:border-stone-800/80 mt-3 flex justify-end">
                  <button
                    onClick={() => onSelectRecipe(recipe)}
                    className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-stone-950 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <span>Открыть в калькуляторе</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
