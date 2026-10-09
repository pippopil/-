import React, { useState, useMemo } from 'react';
import { InventoryItem, Recipe, RecipeMatchResult } from '../types/brewing';
import {
  COMMON_GRAINS,
  COMMON_HOPS,
  COMMON_YEASTS,
  COMMON_ADJUNCTS
} from '../data/defaultData';
import { ebcToHex, scaleRecipeIngredients } from '../utils/brewingMath';
import {
  isIngredientMatch,
  getStandardBrewerStarterPack
} from '../utils/ingredientNormalizer';
import {
  getKurskMaltSubstitute,
  getHopAlternatives,
  KURSK_MALT_PRODUCTS,
  isKurskMalt
} from '../utils/brewingSubstitutions';
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
  Beer,
  Scale,
  Check,
  ChevronDown,
  ChevronUp,
  Sliders,
  Copy,
  RotateCcw,
  Zap,
  X
} from 'lucide-react';
import { SafeNumberInput } from './SafeNumberInput';

interface Props {
  inventory: InventoryItem[];
  recipes: Recipe[];
  onUpdateInventory: (inv: InventoryItem[]) => void;
  onSelectRecipe: (recipe: Recipe) => void;
  globalBatchSizeL: number;
  onSetGlobalBatchSizeL: (sizeL: number) => void;
  onCreateCustomRecipeFromPantry: (selectedGrains: string[], selectedHops: string[], selectedYeast?: string) => void;
}

export const IngredientMatcher: React.FC<Props> = ({
  inventory,
  recipes,
  onUpdateInventory,
  onSelectRecipe,
  globalBatchSizeL,
  onSetGlobalBatchSizeL,
  onCreateCustomRecipeFromPantry
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [matchViewTab, setMatchViewTab] = useState<'all' | '100_percent' | 'missing_1' | 'missing_2'>('100_percent');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showCatalogDrawer, setShowCatalogDrawer] = useState(false);
  const [catalogTab, setCatalogTab] = useState<'grain' | 'hop' | 'yeast' | 'misc'>('grain');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [showShoppingModal, setShowShoppingModal] = useState(false);
  const [copySuccessToast, setCopySuccessToast] = useState(false);

  // Фильтры каталога
  const [grainGroupFilter, setGrainGroupFilter] = useState<'all' | 'kursk' | 'base' | 'caramel' | 'roasted' | 'adjunct'>('all');
  const [yeastLabFilter, setYeastLabFilter] = useState<'all' | 'mangrove' | 'fermentis' | 'lallemand' | 'custom'>('all');
  const [customYeastName, setCustomYeastName] = useState('');
  const [customYeastLab, setCustomYeastLab] = useState('');
  const [customYeastAmount, setCustomYeastAmount] = useState<number>(1);

  // Форма ручного добавления кастомного ингредиента
  const [newInvName, setNewInvName] = useState('');
  const [newInvCategory, setNewInvCategory] = useState<'grain' | 'hop' | 'yeast' | 'misc'>('grain');
  const [newInvAmount, setNewInvAmount] = useState<number>(5.0);
  const [newInvUnit, setNewInvUnit] = useState<'kg' | 'g' | 'pack'>('kg');

  const handleAddManual = (e: React.FormEvent) => {
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

  const adjustInventoryAmount = (id: string, delta: number) => {
    onUpdateInventory(
      inventory.map(item => {
        if (item.id !== id) return item;
        const newAmount = Math.max(0, Number((item.amount + delta).toFixed(2)));
        return { ...item, amount: newAmount };
      })
    );
  };

  // Быстрое добавление ингредиента из каталога
  const addCatalogItem = (name: string, category: 'grain' | 'hop' | 'yeast' | 'misc', addAmount: number, unit: 'kg' | 'g' | 'pack' | 'ml') => {
    const existing = inventory.find(inv => isIngredientMatch(inv.name, name));

    if (existing) {
      onUpdateInventory(
        inventory.map(inv =>
          inv.id === existing.id
            ? { ...inv, amount: Number((inv.amount + addAmount).toFixed(2)) }
            : inv
        )
      );
    } else {
      const newItem: InventoryItem = {
        id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name,
        category,
        amount: addAmount,
        unit
      };
      onUpdateInventory([...inventory, newItem]);
    }
  };

  // Проверка наличия предмета в инвентаре
  const getPantryAmount = (name: string) => {
    const existing = inventory.find(inv => isIngredientMatch(inv.name, name));
    return existing ? existing.amount : 0;
  };

  // Заполнение типового набора пивовара
  const handleLoadStarterPack = () => {
    onUpdateInventory(getStandardBrewerStarterPack());
  };

  // Очистка кладовой
  const handleClearPantry = () => {
    onUpdateInventory([]);
  };

  // УМНЫЙ АЛГОРИТМ СОПОСТАВЛЕНИЯ РЕЦЕПТОВ С ЗАПАСАМИ ПОД ЖЕЛАЕМЫЙ ОБЪЕМ ПАРТИИ
  const matchResults: Array<RecipeMatchResult & { scaledRecipe: Recipe; missingCount: number }> = useMemo(() => {
    return recipes.map(recipe => {
      // Масштабируем рецепт под желаемый объем партии
      const scaleRatio = globalBatchSizeL / (recipe.batchSizeL || 30);
      const { scaledGrains, scaledHops } = scaleRecipeIngredients(
        recipe.grains,
        recipe.hops,
        recipe.batchSizeL,
        globalBatchSizeL
      );

      const scaledRecipe: Recipe = {
        ...recipe,
        batchSizeL: globalBatchSizeL,
        grains: scaledGrains,
        hops: scaledHops,
        calculated: {
          ...recipe.calculated,
          dryYeastGramsNeeded: Number((recipe.calculated.dryYeastGramsNeeded * scaleRatio).toFixed(1)),
          yeastPacksNeeded: Math.max(1, Math.ceil(recipe.calculated.yeastPacksNeeded * scaleRatio)),
          dextroseGrams: Math.round(recipe.calculated.dextroseGrams * scaleRatio),
          totalGrainWeightKg: Number((recipe.calculated.totalGrainWeightKg * scaleRatio).toFixed(2))
        }
      };

      let totalItems = 0;
      let matchedItems = 0;
      const availableIngredients: string[] = [];
      const missingIngredients: RecipeMatchResult['missingIngredients'] = [];

      // 1. Проверка солодов с использованием нормализатора синонимов и аналогов Курского солода
      scaledRecipe.grains.forEach(grain => {
        totalItems += 1;
        const matched = inventory.find(
          inv => inv.category === 'grain' && isIngredientMatch(inv.name, grain.name)
        );

        if (matched && matched.amount >= grain.weightKg) {
          matchedItems += 1;
          availableIngredients.push(`${grain.name} (${grain.weightKg} кг)`);
        } else {
          // Проверяем, есть ли аналог из Курского солода на складе
          const kurskSub = getKurskMaltSubstitute(grain.name);
          const matchedKurskInStock = kurskSub
            ? inventory.find(
                inv => inv.category === 'grain' && (isIngredientMatch(inv.name, kurskSub.kurskName) || (isKurskMalt(inv.name) && isIngredientMatch(inv.name, grain.name))) && inv.amount >= grain.weightKg
              )
            : null;

          if (matchedKurskInStock) {
            matchedItems += 1;
            availableIngredients.push(`${grain.name} (Заменен на ${matchedKurskInStock.name}) (${grain.weightKg} кг)`);
          } else {
            const invAmount = matched ? matched.amount : 0;
            missingIngredients.push({
              name: grain.name,
              category: 'grain',
              requiredAmount: grain.weightKg,
              unit: 'кг',
              inventoryAmount: invAmount,
              differenceToBuy: Number(Math.max(0.1, grain.weightKg - invAmount).toFixed(2)),
              substituteSuggestion: kurskSub ? `Курский аналог: ${kurskSub.kurskName} (${kurskSub.colorEbc} EBC)` : undefined,
              substituteName: kurskSub ? kurskSub.kurskName : undefined
            });
          }
        }
      });

      // 2. Проверка хмелей и подбор альтернатив
      scaledRecipe.hops.forEach(hop => {
        totalItems += 1;
        const matched = inventory.find(
          inv => inv.category === 'hop' && isIngredientMatch(inv.name, hop.name)
        );

        if (matched && matched.amount >= hop.weightG) {
          matchedItems += 1;
          availableIngredients.push(`${hop.name} (${hop.weightG} г)`);
        } else {
          // Проверяем, есть ли альтернативный сорт хмеля в наличии
          const alts = getHopAlternatives(hop.name);
          const matchedAltInStock = alts
            .map(alt => inventory.find(inv => inv.category === 'hop' && isIngredientMatch(inv.name, alt.name) && inv.amount >= hop.weightG))
            .find(Boolean);

          if (matchedAltInStock) {
            matchedItems += 1;
            availableIngredients.push(`${hop.name} (Заменен на ${matchedAltInStock.name}) (${hop.weightG} г)`);
          } else {
            const invAmount = matched ? matched.amount : 0;
            missingIngredients.push({
              name: hop.name,
              category: 'hop',
              requiredAmount: hop.weightG,
              unit: 'г',
              inventoryAmount: invAmount,
              differenceToBuy: Number(Math.max(1, hop.weightG - invAmount).toFixed(1)),
              substituteSuggestion: alts.length > 0 ? `Альтернативы: ${alts.slice(0, 3).map(a => a.name).join(', ')}` : undefined,
              substituteName: alts.length > 0 ? alts[0].name : undefined
            });
          }
        }
      });

      // 3. Проверка дрожжей
      totalItems += 1;
      const matchedYeast = inventory.find(
        inv => inv.category === 'yeast' && isIngredientMatch(inv.name, scaledRecipe.yeast.name)
      );

      if (matchedYeast && matchedYeast.amount >= scaledRecipe.calculated.yeastPacksNeeded) {
        matchedItems += 1;
        availableIngredients.push(`${scaledRecipe.yeast.name} (${scaledRecipe.calculated.yeastPacksNeeded} пач.)`);
      } else {
        const invPacks = matchedYeast ? matchedYeast.amount : 0;
        missingIngredients.push({
          name: scaledRecipe.yeast.name,
          category: 'yeast',
          requiredAmount: scaledRecipe.calculated.yeastPacksNeeded,
          unit: 'пач.',
          inventoryAmount: invPacks,
          differenceToBuy: Math.max(1, scaledRecipe.calculated.yeastPacksNeeded - invPacks)
        });
      }

      const matchPercentage = totalItems > 0 ? Math.round((matchedItems / totalItems) * 100) : 0;
      const isFullyMatch = missingIngredients.length === 0;

      return {
        recipe,
        scaledRecipe,
        matchPercentage,
        isFullyMatch,
        missingCount: missingIngredients.length,
        availableIngredients,
        missingIngredients
      };
    }).sort((a, b) => {
      if (a.isFullyMatch !== b.isFullyMatch) return a.isFullyMatch ? -1 : 1;
      if (a.missingCount !== b.missingCount) return a.missingCount - b.missingCount;
      return b.matchPercentage - a.matchPercentage;
    });
  }, [recipes, inventory, globalBatchSizeL]);

  // Фильтрация совпадений
  const filteredMatches = useMemo(() => {
    return matchResults.filter(({ recipe, isFullyMatch, missingCount }) => {
      const matchSearch =
        recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.style.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.grains.some(g => g.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        recipe.hops.some(h => h.name.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchSearch) return false;

      if (matchViewTab === '100_percent' && !isFullyMatch) return false;
      if (matchViewTab === 'missing_1' && missingCount !== 1) return false;
      if (matchViewTab === 'missing_2' && missingCount !== 2) return false;

      if (categoryFilter !== 'all' && recipe.category !== categoryFilter) return false;

      return true;
    });
  }, [matchResults, searchTerm, matchViewTab, categoryFilter]);

  const categories = useMemo(() => Array.from(new Set(recipes.map(r => r.category))), [recipes]);

  // Статистика подбора
  const fullMatchCount = matchResults.filter(r => r.isFullyMatch).length;
  const missing1Count = matchResults.filter(r => r.missingCount === 1).length;
  const missing2Count = matchResults.filter(r => r.missingCount === 2).length;

  // Сводный список покупок для всех рецептов с 1 недостающим ингредиентом
  const aggregatedShoppingList = useMemo(() => {
    const listMap = new Map<string, { name: string; category: string; amount: number; unit: string }>();

    matchResults
      .filter(r => r.missingCount <= 2 && r.missingCount > 0)
      .forEach(res => {
        res.missingIngredients.forEach(item => {
          const key = `${item.category}_${item.name.toLowerCase()}`;
          if (listMap.has(key)) {
            const current = listMap.get(key)!;
            current.amount = Math.max(current.amount, item.differenceToBuy);
          } else {
            listMap.set(key, {
              name: item.name,
              category: item.category,
              amount: item.differenceToBuy,
              unit: item.unit
            });
          }
        });
      });

    return Array.from(listMap.values());
  }, [matchResults]);

  // Копирование списка покупок в буфер обмена
  const handleCopyShoppingList = () => {
    if (aggregatedShoppingList.length === 0) return;

    const text = [
      `🛒 Список покупок для пивоварения (варка ${globalBatchSizeL} л):`,
      '----------------------------------------',
      ...aggregatedShoppingList.map(
        item => `• ${item.name}: ${item.amount} ${item.unit}`
      ),
      '----------------------------------------',
      'Создано в приложении «МастерВарка»'
    ].join('\n');

    navigator.clipboard.writeText(text).then(() => {
      setCopySuccessToast(true);
      setTimeout(() => setCopySuccessToast(false), 2500);
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Блок выбора желаемого объема партии */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-amber-500/10 dark:from-amber-950/40 dark:via-stone-900 dark:to-amber-950/30 rounded-2xl p-4 sm:p-5 border border-amber-300/80 dark:border-amber-700/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black shadow-sm shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
              Желаемый объём партии для варки:
            </div>
            <div className="text-xs text-stone-600 dark:text-stone-400">
              Все рецепты и списки «что докупить» автоматически рассчитываются под этот литраж
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white dark:bg-stone-800 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 shadow-xs">
            <SafeNumberInput
              value={globalBatchSizeL}
              onChange={(val) => onSetGlobalBatchSizeL(val)}
              min={1}
              max={500}
              fallbackValue={20}
              className="w-16 font-mono font-black text-center text-lg text-amber-700 dark:text-amber-400 bg-transparent focus:outline-none"
            />
            <span className="font-bold text-xs text-stone-500">ЛИТРОВ</span>
          </div>

          {/* Быстрые кнопки литража */}
          <div className="flex flex-wrap gap-1">
            {[10, 15, 20, 25, 30, 50].map(vol => (
              <button
                key={vol}
                onClick={() => onSetGlobalBatchSizeL(vol)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
                  globalBatchSizeL === vol
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-amber-100 dark:hover:bg-stone-700'
                }`}
              >
                {vol}л
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Блок «Склад ингредиентов» с возможностью быстрого добавления любых ингредиентов */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 sm:p-6 shadow-sm border border-stone-200/80 dark:border-stone-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 dark:border-stone-800 pb-4">
          <div>
            <h2 className="text-xl font-black text-stone-900 dark:text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-500" />
              <span>Склад ингредиентов (В наличии: {inventory.length} поз.)</span>
            </h2>
            <p className="text-xs text-stone-500">
              Добавьте имеющиеся у вас ингредиенты — алгоритм рассчитает, что можно сварить и что нужно докупить
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleLoadStarterPack}
              className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-300/80 dark:border-amber-700/80 hover:bg-amber-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Заполнить популярным базовым набором солода, хмеля и дрожжей"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Типовой набор</span>
            </button>

            {inventory.length > 0 && (
              <button
                onClick={handleClearPantry}
                className="px-2.5 py-1.5 rounded-xl text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-semibold transition-colors flex items-center gap-1"
                title="Очистить все запасы"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Очистить</span>
              </button>
            )}

            <button
              onClick={() => setShowCatalogDrawer(!showCatalogDrawer)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-amber-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Каталог ингредиентов</span>
              {showCatalogDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Раскрывающийся каталог для быстрого выбора ингредиентов в 1 клик */}
        {showCatalogDrawer && (
          <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-stone-850 border border-amber-200/80 dark:border-stone-700 space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-amber-200/60 dark:border-stone-700 pb-3">
              <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
                {[
                  { id: 'grain', label: '🌾 Солода' },
                  { id: 'hop', label: '🌿 Хмели' },
                  { id: 'yeast', label: '🧪 Дрожжи' },
                  { id: 'misc', label: '✨ Добавки' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setCatalogTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      catalogTab === tab.id
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Поиск ингредиента..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-xs focus:outline-none"
                />
              </div>
            </div>

            {/* Фильтры по группам солодов */}
            {catalogTab === 'grain' && (
              <div className="flex flex-wrap gap-1.5 text-[11px] pb-1 border-b border-amber-200/40 dark:border-stone-800">
                {[
                  { id: 'all', label: 'Все солода' },
                  { id: 'kursk', label: '🌾 Курский солод (все виды)' },
                  { id: 'base', label: 'Базовые' },
                  { id: 'caramel', label: 'Карамельные' },
                  { id: 'roasted', label: 'Жженые' },
                  { id: 'adjunct', label: 'Хлопья / Спец.' }
                ].map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setGrainGroupFilter(f.id as any)}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                      grainGroupFilter === f.id
                        ? 'bg-amber-500 text-stone-950 font-black shadow-xs'
                        : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}

            {/* Фильтры и раздел "Другое" для дрожжей */}
            {catalogTab === 'yeast' && (
              <div className="space-y-3 pb-1 border-b border-amber-200/40 dark:border-stone-800">
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  {[
                    { id: 'all', label: 'Все дрожжи' },
                    { id: 'mangrove', label: "🇳🇿 Mangrove Jack's (все виды)" },
                    { id: 'fermentis', label: '🇫🇷 Fermentis' },
                    { id: 'lallemand', label: '🇨🇦 Lallemand' },
                    { id: 'custom', label: '✍️ Другое (Внести свое название)' }
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setYeastLabFilter(f.id as any)}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                        yeastLabFilter === f.id
                          ? 'bg-purple-600 text-white font-bold shadow-xs'
                          : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Блок ручного внесения своих дрожжей (Раздел «Другое») */}
                {(yeastLabFilter === 'custom' || yeastLabFilter === 'all') && (
                  <div className="p-3 rounded-2xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-xs text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        <span>Раздел «Другое» — внести свое название дрожжей:</span>
                      </div>
                      <span className="text-[10px] text-purple-700 dark:text-purple-300 font-semibold">Любой штамм или домашняя культура</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          placeholder="Название дрожжей (напр., Danstar Windsor, Omega OYL-052)..."
                          value={customYeastName}
                          onChange={(e) => setCustomYeastName(e.target.value)}
                          className="w-full bg-white dark:bg-stone-900 border border-purple-300 dark:border-purple-700 rounded-xl px-3 py-1.5 font-bold text-xs"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Производитель / Лаб (опционально)"
                          value={customYeastLab}
                          onChange={(e) => setCustomYeastLab(e.target.value)}
                          className="w-full bg-white dark:bg-stone-900 border border-purple-300 dark:border-purple-700 rounded-xl px-3 py-1.5 text-xs"
                        />
                      </div>
                      <div className="flex gap-1">
                        <select
                          value={customYeastAmount}
                          onChange={(e) => setCustomYeastAmount(Number(e.target.value))}
                          className="w-16 bg-white dark:bg-stone-900 border border-purple-300 dark:border-purple-700 rounded-xl px-2 py-1.5 text-xs font-bold"
                        >
                          <option value={1}>1 шт</option>
                          <option value={2}>2 шт</option>
                          <option value={3}>3 шт</option>
                          <option value={5}>5 шт</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            if (!customYeastName.trim()) return;
                            const fullName = customYeastLab.trim() ? `${customYeastName.trim()} (${customYeastLab.trim()})` : customYeastName.trim();
                            addCatalogItem(fullName, 'yeast', customYeastAmount, 'pack');
                            setCustomYeastName('');
                            setCustomYeastLab('');
                          }}
                          disabled={!customYeastName.trim()}
                          className="flex-1 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs disabled:opacity-40 transition-all cursor-pointer shadow-xs active:scale-95"
                        >
                          + Добавить на склад
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Список ингредиентов для быстрого добавления в 1 клик */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-72 overflow-y-auto pr-1">
              {catalogTab === 'grain' &&
                COMMON_GRAINS
                  .filter(g => {
                    const matchSearch = g.name.toLowerCase().includes(catalogSearch.toLowerCase());
                    if (!matchSearch) return false;
                    if (grainGroupFilter === 'kursk') return g.group === 'Курский солод';
                    if (grainGroupFilter === 'base') return g.type === 'base' && g.group !== 'Курский солод';
                    if (grainGroupFilter === 'caramel') return g.type === 'caramel';
                    if (grainGroupFilter === 'roasted') return g.type === 'roasted';
                    if (grainGroupFilter === 'adjunct') return g.group === 'Хлопья' || g.type === 'adjunct' || g.type === 'wheat';
                    return true;
                  })
                  .map(grain => {
                  const currentAmount = getPantryAmount(grain.name);
                  const inPantry = currentAmount > 0;
                  return (
                    <div
                      key={grain.name}
                      className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all ${
                        inPantry
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700 shadow-xs'
                          : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 hover:border-amber-400'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <span className={`text-[10px] font-bold ${grain.group === 'Курский солод' ? 'text-amber-800 dark:text-amber-300' : 'text-stone-500'}`}>{grain.group}</span>
                          {inPantry && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500 text-white font-mono font-bold">
                              {currentAmount} кг
                            </span>
                          )}
                        </div>
                        <div className="font-bold text-xs text-stone-900 dark:text-stone-100 line-clamp-2 leading-snug break-words mt-0.5 min-h-[2rem]" title={grain.name}>
                          {grain.name}
                        </div>
                        <div className="text-[10px] text-stone-500 font-mono">
                          {grain.colorEbc} EBC
                        </div>
                      </div>

                      <div className="mt-2 flex items-center gap-1">
                        <button
                          onClick={() => addCatalogItem(grain.name, 'grain', 1.0, 'kg')}
                          className="flex-1 py-1 rounded bg-amber-100 hover:bg-amber-200 dark:bg-stone-700 dark:hover:bg-stone-600 text-amber-900 dark:text-amber-300 text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          +1 кг
                        </button>
                        <button
                          onClick={() => addCatalogItem(grain.name, 'grain', 5.0, 'kg')}
                          className="flex-1 py-1 rounded bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          +5 кг
                        </button>
                      </div>
                    </div>
                  );
                })}

              {catalogTab === 'hop' &&
                COMMON_HOPS.filter(h => h.name.toLowerCase().includes(catalogSearch.toLowerCase())).map(hop => {
                  const currentAmount = getPantryAmount(hop.name);
                  const inPantry = currentAmount > 0;
                  return (
                    <div
                      key={hop.name}
                      className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all ${
                        inPantry
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700 shadow-xs'
                          : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 hover:border-amber-400'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">{hop.region}</span>
                          {inPantry && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500 text-white font-mono font-bold">
                              {currentAmount} г
                            </span>
                          )}
                        </div>
                        <div className="font-bold text-xs text-stone-900 dark:text-stone-100 line-clamp-2 leading-snug break-words mt-0.5 min-h-[2rem]" title={hop.name}>
                          {hop.name}
                        </div>
                        <div className="text-[10px] text-stone-500 font-mono">
                          α {hop.alphaAcid}%
                        </div>
                      </div>

                      <div className="mt-2 flex items-center gap-1">
                        <button
                          onClick={() => addCatalogItem(hop.name, 'hop', 50, 'g')}
                          className="flex-1 py-1 rounded bg-amber-100 hover:bg-amber-200 dark:bg-stone-700 dark:hover:bg-stone-600 text-amber-900 dark:text-amber-300 text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          +50 г
                        </button>
                        <button
                          onClick={() => addCatalogItem(hop.name, 'hop', 100, 'g')}
                          className="flex-1 py-1 rounded bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          +100 г
                        </button>
                      </div>
                    </div>
                  );
                })}

              {catalogTab === 'yeast' &&
                COMMON_YEASTS
                  .filter(y => {
                    const matchSearch = y.name.toLowerCase().includes(catalogSearch.toLowerCase()) || y.lab.toLowerCase().includes(catalogSearch.toLowerCase());
                    if (!matchSearch) return false;
                    if (yeastLabFilter === 'mangrove') return y.lab === "Mangrove Jack's";
                    if (yeastLabFilter === 'fermentis') return y.lab === 'Fermentis';
                    if (yeastLabFilter === 'lallemand') return y.lab === 'Lallemand';
                    return true;
                  })
                  .map(yeast => {
                  const currentAmount = getPantryAmount(yeast.name);
                  const inPantry = currentAmount > 0;
                  return (
                    <div
                      key={yeast.name}
                      className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all ${
                        inPantry
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700 shadow-xs'
                          : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 hover:border-amber-400'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <span className={`text-[10px] font-bold ${yeast.lab === "Mangrove Jack's" ? 'text-indigo-600 dark:text-indigo-400' : 'text-purple-600 dark:text-purple-400'}`}>{yeast.lab}</span>
                          {inPantry && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500 text-white font-mono font-bold">
                              {currentAmount} шт
                            </span>
                          )}
                        </div>
                        <div className="font-bold text-xs text-stone-900 dark:text-stone-100 line-clamp-1 mt-0.5">
                          {yeast.name}
                        </div>
                        <div className="text-[10px] text-stone-500 line-clamp-1">
                          {yeast.type === 'ale' ? 'Эль' : yeast.type === 'lager' ? 'Лагер' : yeast.type === 'wheat' ? 'Пшеничные' : 'Бельгия'} • {yeast.attenuationPercent}%
                        </div>
                      </div>

                      <div className="mt-2 flex items-center gap-1">
                        <button
                          onClick={() => addCatalogItem(yeast.name, 'yeast', 1, 'pack')}
                          className="flex-1 py-1 rounded bg-amber-100 hover:bg-amber-200 dark:bg-stone-700 dark:hover:bg-stone-600 text-amber-900 dark:text-amber-300 text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          +1 пач
                        </button>
                        <button
                          onClick={() => addCatalogItem(yeast.name, 'yeast', 2, 'pack')}
                          className="flex-1 py-1 rounded bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          +2 пач
                        </button>
                      </div>
                    </div>
                  );
                })}

              {catalogTab === 'misc' &&
                [
                  { name: 'Декстроза (глюкоза)', defaultAmount: 1000, unit: 'g' as const, desc: 'Для карбонизации' },
                  { name: 'Лактоза (молочный сахар)', defaultAmount: 500, unit: 'g' as const, desc: 'Для молочных стаутов' },
                  { name: 'Ирландский мох (Whirlfloc)', defaultAmount: 50, unit: 'g' as const, desc: 'Для осветления сусла' },
                  { name: 'Кориандр (семена)', defaultAmount: 50, unit: 'g' as const, desc: 'Для витбиров и бланша' }
                ].map(item => {
                  const currentAmount = getPantryAmount(item.name);
                  const inPantry = currentAmount > 0;
                  return (
                    <div
                      key={item.name}
                      className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all ${
                        inPantry
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700 shadow-xs'
                          : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 hover:border-amber-400'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] text-stone-500 font-semibold">{item.desc}</span>
                          {inPantry && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500 text-white font-mono font-bold">
                              {currentAmount} {item.unit}
                            </span>
                          )}
                        </div>
                        <div className="font-bold text-xs text-stone-900 dark:text-stone-100 line-clamp-1 mt-0.5">
                          {item.name}
                        </div>
                      </div>

                      <button
                        onClick={() => addCatalogItem(item.name, 'misc', item.defaultAmount, item.unit)}
                        className="mt-2 py-1 rounded bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold transition-colors w-full"
                      >
                        +{item.defaultAmount} {item.unit}
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Сетка текущих запасов пользователя */}
        {inventory.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-2xl border-2 border-dashed border-stone-200 dark:border-stone-800 space-y-3">
            <Package className="w-10 h-10 text-stone-300 dark:text-stone-600 mx-auto" />
            <div className="text-sm font-bold text-stone-700 dark:text-stone-300">
              Ваш склад пока пуст
            </div>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              Нажмите кнопку <b>«Типовой набор»</b> для быстрой загрузки стандартного набора пивовара или откройте <b>«Каталог ингредиентов»</b>, чтобы добавить имеющиеся солод, хмель и дрожжи.
            </p>
            <button
              onClick={handleLoadStarterPack}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Zap className="w-4 h-4" />
              <span>Загрузить типовой набор пивовара</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
            {inventory.map(item => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700/80 flex flex-col justify-between group hover:border-amber-400 transition-colors shadow-2xs"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                      item.category === 'grain' ? 'text-amber-600 dark:text-amber-400' :
                      item.category === 'hop' ? 'text-emerald-600 dark:text-emerald-400' :
                      item.category === 'yeast' ? 'text-purple-600 dark:text-purple-400' : 'text-stone-500'
                    }`}>
                      {item.category === 'grain' ? '🌾 Солод' : item.category === 'hop' ? '🌿 Хмель' : item.category === 'yeast' ? '🧪 Дрожжи' : '✨ Добавка'}
                    </span>
                    <button
                      onClick={() => removeInventoryItem(item.id)}
                      className="text-stone-300 hover:text-red-500 transition-colors"
                      title="Удалить"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="font-bold text-xs text-stone-900 dark:text-stone-100 line-clamp-2 mt-1">
                    {item.name}
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-stone-200/60 dark:border-stone-700/60">
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <input
                      type="number"
                      step={item.unit === 'kg' ? '0.1' : '1'}
                      value={item.amount}
                      onChange={(e) => updateInventoryAmount(item.id, parseFloat(e.target.value) || 0)}
                      className="w-16 bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded px-1.5 py-0.5 text-xs font-mono font-bold text-stone-900 dark:text-stone-100 text-center"
                    />
                    <span className="text-xs text-stone-600 dark:text-stone-300 font-mono font-bold">{item.unit}</span>
                  </div>

                  {/* Быстрые кнопки регулировки остатка */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => adjustInventoryAmount(item.id, item.unit === 'kg' ? -1 : item.unit === 'g' ? -25 : -1)}
                      className="flex-1 py-0.5 rounded bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 text-[10px] font-bold hover:bg-stone-300 transition-colors"
                    >
                      -{item.unit === 'kg' ? '1' : item.unit === 'g' ? '25' : '1'}
                    </button>
                    <button
                      onClick={() => adjustInventoryAmount(item.id, item.unit === 'kg' ? 1 : item.unit === 'g' ? 50 : 1)}
                      className="flex-1 py-0.5 rounded bg-amber-500/10 text-amber-800 dark:text-amber-300 text-[10px] font-bold hover:bg-amber-500/20 transition-colors"
                    >
                      +{item.unit === 'kg' ? '1' : item.unit === 'g' ? '50' : '1'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Быстрое добавление кастомного ингредиента */}
        <form onSubmit={handleAddManual} className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
          <input
            type="text"
            placeholder="Вписать свой солод / хмель / дрожжи..."
            value={newInvName}
            onChange={(e) => setNewInvName(e.target.value)}
            className="flex-1 min-w-[200px] bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
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
            className="bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-2.5 py-1.5 text-xs font-medium"
          >
            <option value="grain">Солод (кг)</option>
            <option value="hop">Хмель (г)</option>
            <option value="yeast">Дрожжи (пач)</option>
            <option value="misc">Разное</option>
          </select>
          <input
            type="number"
            step={newInvUnit === 'kg' ? '0.1' : '1'}
            value={newInvAmount}
            onChange={(e) => setNewInvAmount(parseFloat(e.target.value) || 1)}
            className="w-20 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-2 py-1.5 text-xs font-mono font-bold text-center"
          />
          <button
            type="submit"
            className="px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-stone-700 text-white text-xs font-bold transition-colors"
          >
            Добавить
          </button>
        </form>
      </div>

      {/* 3. Результаты подбора рецептов под остатки */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 sm:p-6 shadow-sm border border-stone-200/80 dark:border-stone-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-stone-100 dark:border-stone-800 pb-4">
          <div>
            <h2 className="text-xl font-extrabold text-stone-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>Что можно сварить на {globalBatchSizeL} л ({filteredMatches.length} из {recipes.length} рецептов)</span>
            </h2>
            <p className="text-xs text-stone-500">
              Сгруппировано по наличию: рецепты, которые можно варить прямо сейчас, и те, куда нужно добавить 1-2 ингредиента
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {aggregatedShoppingList.length > 0 && (
              <button
                onClick={() => setShowShoppingModal(true)}
                className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 hover:bg-amber-500/20 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Список покупок ({aggregatedShoppingList.length})</span>
              </button>
            )}

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Поиск по названию или хмелю..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs focus:outline-none"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none"
            >
              <option value="all">Все категории BJCP</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Табы групп доступности */}
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={() => setMatchViewTab('100_percent')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              matchViewTab === '100_percent'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Можно сварить прямо сейчас ({fullMatchCount})</span>
          </button>

          <button
            onClick={() => setMatchViewTab('missing_1')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              matchViewTab === 'missing_1'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Не хватает 1 ингредиента ({missing1Count})</span>
          </button>

          <button
            onClick={() => setMatchViewTab('missing_2')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              matchViewTab === 'missing_2'
                ? 'bg-stone-700 text-white shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
            }`}
          >
            <span>Не хватает 2 ингредиентов ({missing2Count})</span>
          </button>

          <button
            onClick={() => setMatchViewTab('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              matchViewTab === 'all'
                ? 'bg-stone-900 text-white dark:bg-amber-500 dark:text-stone-950 shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
            }`}
          >
            Все рецепты ({matchResults.length})
          </button>
        </div>

        {/* Сетка подобранных рецептов */}
        {filteredMatches.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-stone-200 dark:border-stone-800 space-y-3">
            <Beer className="w-10 h-10 text-stone-300 dark:text-stone-600 mx-auto" />
            <div className="text-sm font-bold text-stone-700 dark:text-stone-300">
              {matchViewTab === '100_percent'
                ? `На объем ${globalBatchSizeL} л пока нет рецептов со 100% наличием всех ингредиентов`
                : 'По выбранным фильтрам рецептов не найдено'}
            </div>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              {matchViewTab === '100_percent' ? (
                <>
                  Переключитесь на вкладку <b>«Не хватает 1 ингредиента»</b> ({missing1Count} рецептов) — там вы увидите, что можно сварить, добавив всего один солод или хмель! Либо попробуйте уменьшить объем варки.
                </>
              ) : (
                'Попробуйте изменить поисковый запрос или категорию'
              )}
            </p>
            {matchViewTab === '100_percent' && missing1Count > 0 && (
              <button
                onClick={() => setMatchViewTab('missing_1')}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Показать рецепты, где не хватает 1 ингредиента ({missing1Count})</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {filteredMatches.map(({ recipe, scaledRecipe, matchPercentage, isFullyMatch, missingIngredients, availableIngredients, missingCount }) => {
              const hex = ebcToHex(recipe.calculated.ebc);
              return (
                <div
                  key={recipe.id}
                  className={`rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                    isFullyMatch
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/25 border-emerald-400 dark:border-emerald-700 shadow-sm'
                      : missingCount === 1
                      ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/80 shadow-xs'
                      : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-11 h-11 rounded-xl shadow-xs border border-white/40 flex items-center justify-center shrink-0"
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

                      <div className="text-right shrink-0">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black ${
                          isFullyMatch
                            ? 'bg-emerald-500 text-white'
                            : missingCount === 1
                            ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300'
                            : 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
                        }`}>
                          {isFullyMatch ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
                          <span>{isFullyMatch ? '100% В наличии' : `Не хватает ${missingCount}`}</span>
                        </span>
                      </div>
                    </div>

                    {/* Параметры партии на заданный литраж */}
                    <div className="grid grid-cols-4 gap-2 my-3 p-2.5 rounded-xl bg-stone-100/70 dark:bg-stone-800/60 text-center font-mono text-xs">
                      <div>
                        <span className="text-[10px] text-stone-400 font-sans block">НП</span>
                        <b>{scaledRecipe.calculated.ogSg.toFixed(3)}</b>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-400 font-sans block">ABV</span>
                        <b className="text-amber-600 dark:text-amber-400">{scaledRecipe.calculated.abv}%</b>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-400 font-sans block">IBU</span>
                        <b>{scaledRecipe.calculated.ibu}</b>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-400 font-sans block">Объем</span>
                        <b className="text-stone-900 dark:text-white">{globalBatchSizeL} л</b>
                      </div>
                    </div>

                    {/* В наличии */}
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

                    {/* Что докупить / добавить под желаемый объем партии */}
                    {missingIngredients.length > 0 && (
                      <div className="mt-2 p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-1.5">
                        <div className="text-[11px] font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1">
                          <ShoppingCart className="w-3.5 h-3.5 text-amber-600" />
                          <span>Что необходимо добавить/докупить на {globalBatchSizeL} л ({missingIngredients.length} поз.):</span>
                        </div>
                        <ul className="space-y-1.5 text-xs text-stone-700 dark:text-stone-300">
                          {missingIngredients.map((item, idx) => (
                            <li key={idx} className="text-[11px] pb-1 border-b border-amber-200/50 dark:border-amber-900/40 last:border-0">
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-stone-800 dark:text-stone-200">
                                  {item.name} <span className="text-stone-500 font-normal">(нужно: {item.requiredAmount} {item.unit})</span>:
                                </span>
                                <b className="text-amber-700 dark:text-amber-400 font-mono">
                                  +{item.differenceToBuy} {item.unit}
                                </b>
                              </div>
                              {item.substituteSuggestion && (
                                <div className="mt-0.5 text-[10px] text-amber-900 dark:text-amber-300 font-medium flex items-center gap-1 bg-amber-100/70 dark:bg-amber-900/40 px-2 py-0.5 rounded">
                                  <span>💡 {item.substituteSuggestion}</span>
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Кнопка отправки рецепта в калькулятор с автоматическим масштабированием */}
                  <div className="pt-4 border-t border-stone-100 dark:border-stone-800 mt-4 flex items-center justify-between">
                    <span className="text-[11px] text-stone-500 font-medium">
                      Засыпь: {scaledRecipe.calculated.totalGrainWeightKg} кг • Дрожжи: {scaledRecipe.calculated.yeastPacksNeeded} пач.
                    </span>

                    <button
                      onClick={() => onSelectRecipe(scaledRecipe)}
                      className={`px-4 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors ${
                        isFullyMatch ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-500 hover:bg-amber-600'
                      }`}
                    >
                      <span>Сварить на {globalBatchSizeL} л</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Модальное окно списка покупок */}
      {showShoppingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-stone-900 p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4">
            <div className="flex justify-between items-center border-b border-stone-100 dark:border-stone-800 pb-3">
              <h3 className="text-base font-bold text-stone-900 dark:text-white flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-amber-600" />
                <span>Список покупок ингредиентов (варка {globalBatchSizeL} л)</span>
              </h3>
              <button
                onClick={() => setShowShoppingModal(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-400">
              Сводный список недостающих ингредиентов для приготовления выбранных рецептов:
            </p>

            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {aggregatedShoppingList.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="font-semibold text-stone-900 dark:text-stone-100">{item.name}</span>
                  </div>
                  <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                    {item.amount} {item.unit}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
              <button
                onClick={handleCopyShoppingList}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                {copySuccessToast ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copySuccessToast ? 'Скопировано!' : 'Скопировать список'}</span>
              </button>
              <button
                onClick={() => setShowShoppingModal(false)}
                className="px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-bold hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
