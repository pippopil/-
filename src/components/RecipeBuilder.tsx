import React, { useState, useEffect, useMemo } from 'react';
import {
  CalculatedBrewParams,
  GrainItem,
  HopItem,
  MashRest,
  Recipe,
  Yeast
} from '../types/brewing';
import {
  BJCP_STYLES,
  calculateBrewMetrics,
  ebcToHex,
  scaleRecipeIngredients,
  validateRecipeAgainstStyle,
  balanceRecipeForStyle,
  isNonBjcpStyle
} from '../utils/brewingMath';
import { COMMON_GRAINS, COMMON_HOPS, COMMON_YEASTS } from '../data/defaultData';
import {
  getKurskMaltSubstitute,
  getHopAlternatives,
  KURSK_MALT_MAP,
  HOP_ALTERNATIVES_MAP,
  KURSK_MALT_PRODUCTS,
  isKurskMalt,
  normalizeGrain
} from '../utils/brewingSubstitutions';
import {
  Beer,
  Plus,
  Trash2,
  Scale,
  Sparkles,
  Calendar,
  Save,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Info,
  Droplets,
  Flame,
  Thermometer,
  Layers,
  ArrowRight,
  Printer,
  BookOpen,
  X,
  Check,
  Search,
  Wheat
} from 'lucide-react';
import { SafeNumberInput } from './SafeNumberInput';
import { BrewingHistoryCallout } from './BrewingHistoryCallout';
import { MarqueeText } from './MarqueeText';
import { IngredientSearchSelect } from './IngredientSearchSelect';
import { OtherIngredientsSection } from './OtherIngredientsSection';

interface Props {
  recipe: Recipe;
  onUpdateRecipe: (updated: Recipe) => void;
  onSaveRecipe: (recipe: Recipe) => void;
  onSendToAiStudio: (recipe: Recipe) => void;
  onStartBrewBatch: (recipe: Recipe) => void;
  onPrintSheet: () => void;
  onOpenNewRecipeModal?: () => void;
  onOpenHistory?: (momentId?: string) => void;
}

export const RecipeBuilder: React.FC<Props> = ({
  recipe,
  onUpdateRecipe,
  onSaveRecipe,
  onSendToAiStudio,
  onStartBrewBatch,
  onPrintSheet,
  onOpenNewRecipeModal,
  onOpenHistory
}) => {
  const [scaleModalOpen, setScaleModalOpen] = useState(false);
  const [targetScaleL, setTargetScaleL] = useState(recipe.batchSizeL);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);
  const [kurskSwapNotice, setKurskSwapNotice] = useState(false);
  const [substitutionsGuideOpen, setSubstitutionsGuideOpen] = useState(false);
  const [guideActiveTab, setGuideActiveTab] = useState<'kursk' | 'hops'>('kursk');
  const [guideSearch, setGuideSearch] = useState('');
  const [balanceNotice, setBalanceNotice] = useState<string[] | null>(null);
  const [previousRecipeState, setPreviousRecipeState] = useState<Recipe | null>(null);

  const handleAutoBalanceRecipe = (target?: 'all' | 'grains' | 'hops') => {
    const isGrainsOnly = target === 'grains';
    const isHopsOnly = target === 'hops';
    setPreviousRecipeState(JSON.parse(JSON.stringify(recipe)));
    const opts = {
      balanceGrains: !isHopsOnly,
      balanceHops: !isGrainsOnly,
      balanceYeast: !isGrainsOnly && !isHopsOnly
    };
    const { balancedRecipe, changesSummary } = balanceRecipeForStyle(recipe, opts);
    onUpdateRecipe(balancedRecipe);
    setBalanceNotice(changesSummary);
  };

  const handleUndoBalance = () => {
    if (previousRecipeState) {
      onUpdateRecipe(previousRecipeState);
      setPreviousRecipeState(null);
      setBalanceNotice(null);
    }
  };

  // Пересчет показателей при любом изменении
  const updateParams = (fields: Partial<Recipe>) => {
    const nextRecipe = { ...recipe, ...fields };
    if (fields.grains) {
      nextRecipe.grains = fields.grains.map(normalizeGrain);
    }
    const calculated = calculateBrewMetrics({
      batchSizeL: nextRecipe.batchSizeL,
      boilTimeMin: nextRecipe.boilTimeMin,
      efficiencyPercent: nextRecipe.efficiencyPercent,
      grainRatioLPerKg: nextRecipe.grainRatioLPerKg,
      grainTempC: nextRecipe.grainTempC,
      targetCarbonationVol: nextRecipe.targetCarbonationVol,
      beerTempAtBottlingC: nextRecipe.beerTempAtBottlingC,
      grains: nextRecipe.grains,
      hops: nextRecipe.hops,
      yeast: nextRecipe.yeast,
      otherIngredients: nextRecipe.otherIngredients
    });
    onUpdateRecipe({
      ...nextRecipe,
      calculated,
      updatedAt: new Date().toISOString()
    });
  };

  // Автоматическая нормализация типов солодов (исправляет неверные типы и устаревшие заглушки)
  useEffect(() => {
    let hasAnomaly = false;
    const normalized = recipe.grains.map(g => {
      const n = normalizeGrain(g);
      if (n.name !== g.name || n.type !== g.type) {
        hasAnomaly = true;
      }
      return n;
    });
    if (hasAnomaly) {
      updateParams({ grains: normalized });
    }
  }, [recipe.id]);

  const isBjcpStyle = useMemo(() => {
    return !isNonBjcpStyle(recipe.style) && BJCP_STYLES.some(s => s.name === recipe.style || s.nameEn === recipe.style);
  }, [recipe.style]);

  const validation = validateRecipeAgainstStyle(recipe.calculated, recipe.style);

  // Добавление солода (импортного или Курского)
  const addGrain = (template?: {
    name: string;
    potentialSg?: number;
    colorEbc?: number;
    type?: GrainItem['type'];
    group?: string;
  }) => {
    const newGrain: GrainItem = template
      ? {
          id: `grain_${Date.now()}`,
          name: template.name,
          weightKg: 1.0,
          potentialSg: template.potentialSg ?? 1.037,
          colorEbc: template.colorEbc ?? 4.0,
          type: template.type ?? 'base'
        }
      : {
          id: `grain_${Date.now()}`,
          name: 'Новый солод',
          weightKg: 1.0,
          potentialSg: 1.037,
          colorEbc: 4.0,
          type: 'base'
        };
    updateParams({ grains: [...recipe.grains, newGrain] });
  };

  const removeGrain = (id: string) => {
    updateParams({ grains: recipe.grains.filter(g => g.id !== id) });
  };

  const updateGrain = (id: string, updates: Partial<GrainItem>) => {
    updateParams({
      grains: recipe.grains.map(g => (g.id === id ? { ...g, ...updates } : g))
    });
  };

  // Добавление хмеля
  const addHop = (template?: {
    name: string;
    alphaAcid?: number;
    profile?: string;
    region?: string;
  }) => {
    const newHop: HopItem = template
      ? {
          id: `hop_${Date.now()}`,
          name: template.name,
          weightG: 25,
          alphaAcid: template.alphaAcid ?? 5.0,
          boilTimeMin: 15,
          use: 'boil'
        }
      : {
          id: `hop_${Date.now()}`,
          name: 'Новый хмель',
          weightG: 20,
          alphaAcid: 8.0,
          boilTimeMin: 60,
          use: 'boil'
        };
    updateParams({ hops: [...recipe.hops, newHop] });
  };

  const removeHop = (id: string) => {
    updateParams({ hops: recipe.hops.filter(h => h.id !== id) });
  };

  const updateHop = (id: string, updates: Partial<HopItem>) => {
    updateParams({
      hops: recipe.hops.map(h => (h.id === id ? { ...h, ...updates } : h))
    });
  };

  // Замена отдельного солода на Курский аналог
  const handleApplyKurskSubstitute = (grainId: string) => {
    const grain = recipe.grains.find(g => g.id === grainId);
    if (!grain) return;
    const sub = getKurskMaltSubstitute(grain.name, grain.type, grain.colorEbc);
    if (!sub) return;

    updateGrain(grainId, {
      name: sub.kurskName,
      potentialSg: sub.potentialSg,
      colorEbc: sub.colorEbc,
      weightKg: Number((grain.weightKg * sub.ratio).toFixed(2)),
      type: sub.type || grain.type
    });
  };

  // Пакетная замена всех солодов рецепта на Курский солод
  const handleApplyAllKurskSubstitutes = () => {
    const updatedGrains = recipe.grains.map(grain => {
      const sub = getKurskMaltSubstitute(grain.name, grain.type, grain.colorEbc);
      if (!sub) return normalizeGrain(grain);
      return {
        ...grain,
        name: sub.kurskName,
        potentialSg: sub.potentialSg,
        colorEbc: sub.colorEbc,
        weightKg: Number((grain.weightKg * sub.ratio).toFixed(2)),
        type: sub.type || grain.type
      };
    });
    updateParams({ grains: updatedGrains });
    setKurskSwapNotice(true);
    setTimeout(() => setKurskSwapNotice(false), 3000);
  };

  // Замена хмеля на альтернативный сорт
  const handleApplyHopAlternative = (hopId: string, altHopName: string) => {
    const hop = recipe.hops.find(h => h.id === hopId);
    if (!hop) return;
    const foundHop = COMMON_HOPS.find(h => h.name.toLowerCase().includes(altHopName.toLowerCase()));
    let newAlpha = hop.alphaAcid;
    if (foundHop) {
      newAlpha = foundHop.alphaAcid;
    } else {
      const alts = getHopAlternatives(hop.name);
      const matched = alts.find(a => a.name.toLowerCase().includes(altHopName.toLowerCase()));
      if (matched) {
        const num = matched.alphaRange.match(/(\d+(\.\d+)?)/);
        if (num) newAlpha = parseFloat(num[1]);
      }
    }

    updateHop(hopId, {
      name: altHopName,
      alphaAcid: newAlpha
    });
  };

  // Паузы затирания
  const addMashRest = () => {
    const newRest: MashRest = {
      id: `rest_${Date.now()}`,
      name: 'Новая пауза',
      tempC: 65,
      timeMin: 30,
      type: 'custom'
    };
    updateParams({ mashSchedule: [...recipe.mashSchedule, newRest] });
  };

  const removeMashRest = (id: string) => {
    updateParams({ mashSchedule: recipe.mashSchedule.filter(r => r.id !== id) });
  };

  const updateMashRest = (id: string, updates: Partial<MashRest>) => {
    updateParams({
      mashSchedule: recipe.mashSchedule.map(r => (r.id === id ? { ...r, ...updates } : r))
    });
  };

  const applyMashPreset = (preset: 'dry' | 'balanced' | 'full' | 'weizen' | 'step' | 'kursk') => {
    let rests: MashRest[] = [];
    if (preset === 'kursk') {
      rests = [
        { id: 'p1', name: 'Белковая пауза (Курский солод)', tempC: 53, timeMin: 15, type: 'protein', description: 'Оптимальное расщепление белка для прозрачности и плотной стойкой пены' },
        { id: 'p2', name: 'Мальтозная пауза', tempC: 65, timeMin: 45, type: 'maltose', description: 'Осахаривание ферментами солода' },
        { id: 'p3', name: 'Декстриновая пауза', tempC: 72, timeMin: 20, type: 'dextrin', description: 'Формирование тела и мягкости пива' },
        { id: 'p4', name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout', description: 'Снижение вязкости затора и фиксация сахаров' }
      ];
    } else if (preset === 'dry') {
      rests = [
        { id: 'p1', name: 'Мальтозная пауза (Сухое тело)', tempC: 63, timeMin: 70, type: 'maltose', description: 'Максимум сбраживаемых сахаров' },
        { id: 'p2', name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout', description: 'Остановка ферментации' }
      ];
    } else if (preset === 'balanced') {
      rests = [
        { id: 'p1', name: 'Осахаривание (Сбалансированное)', tempC: 66, timeMin: 60, type: 'maltose', description: 'Баланс тела и сбраживаемости' },
        { id: 'p2', name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout' }
      ];
    } else if (preset === 'full') {
      rests = [
        { id: 'p1', name: 'Декстриновая пауза (Плотное тело)', tempC: 69, timeMin: 60, type: 'dextrin', description: 'Больше несбраживаемых декстринов' },
        { id: 'p2', name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout' }
      ];
    } else if (preset === 'weizen') {
      rests = [
        { id: 'p1', name: 'Феруловая пауза', tempC: 44, timeMin: 15, type: 'acid', description: 'Аромат гвоздики' },
        { id: 'p2', name: 'Белковая пауза', tempC: 52, timeMin: 15, type: 'protein', description: 'Расщепление клейковины' },
        { id: 'p3', name: 'Мальтозная', tempC: 64, timeMin: 40, type: 'maltose' },
        { id: 'p4', name: 'Осахаривание', tempC: 72, timeMin: 20, type: 'dextrin' },
        { id: 'p5', name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout' }
      ];
    } else {
      rests = [
        { id: 'p1', name: 'Белковая пауза', tempC: 52, timeMin: 15, type: 'protein' },
        { id: 'p2', name: 'Мальтозная', tempC: 63, timeMin: 45, type: 'maltose' },
        { id: 'p3', name: 'Декстриновая', tempC: 72, timeMin: 20, type: 'dextrin' },
        { id: 'p4', name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout' }
      ];
    }
    updateParams({ mashSchedule: rests });
  };

  // Масштабирование партии
  const handleScaleBatch = () => {
    if (targetScaleL <= 0 || targetScaleL === recipe.batchSizeL) {
      setScaleModalOpen(false);
      return;
    }
    const { scaledGrains, scaledHops } = scaleRecipeIngredients(
      recipe.grains,
      recipe.hops,
      recipe.batchSizeL,
      targetScaleL
    );
    const factor = targetScaleL / Math.max(1, recipe.batchSizeL);
    const scaledOther = (recipe.otherIngredients || []).map(item => ({
      ...item,
      amount: Number((item.amount * factor).toFixed(item.unit === 'kg' ? 2 : 1))
    }));
    updateParams({
      batchSizeL: targetScaleL,
      grains: scaledGrains,
      hops: scaledHops,
      otherIngredients: scaledOther
    });
    setScaleModalOpen(false);
  };

  const handleSave = () => {
    // Гарантируем надежное сохранение в авторские рецепты
    const isAlreadyCustom = recipe.isCustom;
    const authorRecipe: Recipe = {
      ...recipe,
      isCustom: true,
      collection: 'my_recipes',
      author: recipe.author && recipe.author !== 'МастерВарка' ? recipe.author : 'Вы',
      id: isAlreadyCustom ? recipe.id : `recipe_custom_${Date.now()}`,
      updatedAt: new Date().toISOString()
    };
    onSaveRecipe(authorRecipe);
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 3500);
  };

  const handleSaveCopy = () => {
    const copyRecipe: Recipe = {
      ...recipe,
      id: `recipe_custom_${Date.now()}`,
      name: recipe.name.startsWith('Копия: ') ? recipe.name : `Копия: ${recipe.name}`,
      isCustom: true,
      collection: 'my_recipes',
      author: 'Вы',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    onSaveRecipe(copyRecipe);
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 3500);
  };

  const beerColorHex = ebcToHex(recipe.calculated.ebc);

  return (
    <div className="space-y-6 pb-24 sm:pb-16">
      {/* Верхняя карточка с базовыми параметрами и действиями */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 sm:p-6 shadow-sm border border-stone-200/80 dark:border-stone-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-200/70 dark:border-stone-800 pb-5">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={recipe.name}
                onChange={(e) => updateParams({ name: e.target.value })}
                className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight bg-transparent text-stone-900 dark:text-white border-b border-stone-200 dark:border-stone-700 hover:border-amber-400 focus:border-amber-500 focus:outline-none w-full py-0.5"
                placeholder="Название рецепта..."
              />
            </div>
            {/* Графа стиля пива с уменьшенным адаптивным шрифтом и бегущей строкой */}
            <div className="space-y-1.5 pt-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
                <span className="text-stone-500 dark:text-stone-400 font-semibold text-[11px] sm:text-xs shrink-0 flex items-center gap-1">
                  <span>🍺 Стиль пива:</span>
                </span>
                <div className="flex items-center gap-1.5 flex-1 min-w-0 max-w-full">
                  <select
                    value={recipe.style}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'Без стиля (Свободный рецепт)' || isNonBjcpStyle(val)) {
                        updateParams({
                          style: 'Без стиля (Свободный рецепт)',
                          category: 'Авторские рецепты'
                        });
                      } else {
                        const s = BJCP_STYLES.find(st => st.name === val || st.nameEn === val);
                        updateParams({
                          style: val,
                          category: s ? s.category : 'Авторские рецепты'
                        });
                      }
                    }}
                    className="w-full sm:w-auto max-w-full bg-amber-50 dark:bg-stone-800 text-amber-900 dark:text-amber-300 font-bold px-2 py-1.5 rounded-lg border border-amber-200 dark:border-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-500 text-[10px] sm:text-xs truncate cursor-pointer"
                  >
                    <option value="Без стиля (Свободный рецепт)">
                      🎨 Без стиля (Свободный авторский рецепт — без рамок BJCP)
                    </option>
                    {!BJCP_STYLES.some(s => s.name === recipe.style) && recipe.style !== 'Без стиля (Свободный рецепт)' && (
                      <option value={recipe.style}>
                        🎨 {recipe.style} (Свободный рецепт)
                      </option>
                    )}
                    <optgroup label="Классические стили BJCP">
                      {BJCP_STYLES.map(s => (
                        <option key={s.id} value={s.name}>
                          {s.name} ({s.category})
                        </option>
                      ))}
                    </optgroup>
                  </select>

                  {isBjcpStyle && (
                    <button
                      type="button"
                      onClick={() => updateParams({ style: 'Без стиля (Свободный рецепт)', category: 'Авторские рецепты' })}
                      className="text-[10px] sm:text-[11px] text-stone-500 hover:text-amber-600 dark:hover:text-amber-400 underline cursor-pointer shrink-0"
                      title="Отвязать рецепт от рамок BJCP и варить в свободном стиле"
                    >
                      Снять стиль BJCP
                    </button>
                  )}
                </div>
              </div>

              {/* Бегущая строка (Marquee Ticker) с полным названием стиля и категорией */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 dark:bg-stone-800/80 border border-amber-300/60 dark:border-stone-700/60 max-w-full overflow-hidden">
                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold shrink-0 uppercase tracking-wider">
                  Выбранный стиль:
                </span>
                <MarqueeText
                  text={recipe.style}
                  subtext={recipe.category && recipe.category !== 'Авторские рецепты' ? recipe.category : undefined}
                  className="flex-1 min-w-0"
                  textClassName="text-[10px] sm:text-xs font-bold text-amber-950 dark:text-amber-200"
                  speedSec={16}
                  maxLengthThreshold={14}
                />
              </div>
            </div>
          </div>

          {/* Панель быстрых действий */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onOpenNewRecipeModal && (
              <button
                type="button"
                onClick={onOpenNewRecipeModal}
                className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="Создать новый рецепт с чистого листа или выбрать готовый стиль"
              >
                <Plus className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>+ Чистый шаблон</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-black flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Сохранить в Мои авторские рецепты"
            >
              <Save className="w-4 h-4" />
              <span>Сохранить в авторские 🛠️</span>
            </button>

            <button
              type="button"
              onClick={handleSaveCopy}
              className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-amber-100/70 dark:bg-stone-800 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Создать независимую авторскую копию этого рецепта в «Мои авторские»"
            >
              <Copy className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="hidden sm:inline">+ Копия в авторские</span>
              <span className="sm:hidden">+ Копия</span>
            </button>

            <button
              type="button"
              onClick={() => onStartBrewBatch(recipe)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Варка в календарь</span>
            </button>

            <button
              type="button"
              onClick={() => setScaleModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Пересчитать ингредиенты под другой объем варки"
            >
              <Scale className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Масштаб ({recipe.batchSizeL} л)</span>
            </button>

            <button
              type="button"
              onClick={() => onSendToAiStudio(recipe)}
              className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-amber-100/70 dark:bg-stone-800 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>ИИ Этикетка</span>
            </button>

            <button
              type="button"
              onClick={onPrintSheet}
              className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 transition-colors flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer"
              title="Печать варочного листа (PDF)"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline text-xs font-bold">PDF</span>
            </button>
          </div>
        </div>

        {saveSuccessNotice && (
          <div className="mt-3 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center gap-2 border border-emerald-200 dark:border-emerald-800 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Рецепт «{recipe.name}» успешно сохранен в «Мои авторские» 🛠️!</span>
          </div>
        )}

        {/* Настройки варочного порядка */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4">
          <div>
            <label className="text-[11px] font-medium text-stone-500 dark:text-stone-400 block mb-1">
              Объем варки (л)
            </label>
            <SafeNumberInput
              value={recipe.batchSizeL}
              onChange={(val) => updateParams({ batchSizeL: val })}
              min={1}
              max={1000}
              fallbackValue={30}
              className="w-full bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-stone-500 dark:text-stone-400 block mb-1">
              Эффективность (%)
            </label>
            <SafeNumberInput
              value={recipe.efficiencyPercent}
              onChange={(val) => updateParams({ efficiencyPercent: val })}
              min={40}
              max={95}
              fallbackValue={72}
              allowDecimals={false}
              className="w-full bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-stone-500 dark:text-stone-400 block mb-1">
              Кипячение (мин)
            </label>
            <SafeNumberInput
              value={recipe.boilTimeMin}
              onChange={(val) => updateParams({ boilTimeMin: val })}
              min={30}
              max={180}
              fallbackValue={60}
              allowDecimals={false}
              className="w-full bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-stone-500 dark:text-stone-400 block mb-1">
              Гидромодуль (л/кг)
            </label>
            <SafeNumberInput
              value={recipe.grainRatioLPerKg}
              onChange={(val) => updateParams({ grainRatioLPerKg: val })}
              min={2.0}
              max={6.0}
              fallbackValue={3.5}
              allowDecimals={true}
              className="w-full bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-stone-500 dark:text-stone-400 block mb-1">
              Темп. зерна (°C)
            </label>
            <SafeNumberInput
              value={recipe.grainTempC}
              onChange={(val) => updateParams({ grainTempC: val })}
              min={0}
              max={35}
              fallbackValue={20}
              allowDecimals={false}
              className="w-full bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-stone-500 dark:text-stone-400 block mb-1">
              CO2 Карбонизация (vol)
            </label>
            <SafeNumberInput
              value={recipe.targetCarbonationVol}
              onChange={(val) => updateParams({ targetCarbonationVol: val })}
              min={1.0}
              max={4.5}
              fallbackValue={2.4}
              allowDecimals={true}
              className="w-full bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Историческая справка и первоисточники стилей */}
      <BrewingHistoryCallout
        currentStyleName={recipe.style}
        onOpenFullHistory={(momentId) => onOpenHistory?.(momentId)}
      />

      {/* Интерактивный дашборд характеристик и визуализатор бокала */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Визуальный бокал пива с реальным цветом SRM/EBC */}
        <div className="bg-gradient-to-br from-stone-900 to-stone-950 text-white rounded-2xl p-5 border border-stone-800 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">Цвет и Внешний вид</span>
            <div className="text-2xl font-black">{recipe.calculated.ebc} EBC</div>
            <div className="text-xs text-stone-400">{recipe.calculated.srm} SRM</div>
            <div className="text-[11px] text-stone-300 pt-1">
              Баланс BU:GU: <b className="text-amber-400">{recipe.calculated.buGuRatio}</b>
            </div>
          </div>

          {/* Иллюстрация бокала пива с пенной шапкой и живым градиентом */}
          <div className="relative w-16 h-28 flex flex-col items-center justify-end">
            {/* Пена */}
            <div className="w-12 h-4 bg-amber-50 rounded-t-lg shadow-inner z-10 border-b border-amber-200/50 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white opacity-80" />
            </div>
            {/* Тело бокала */}
            <div
              className="w-12 h-20 rounded-b-xl border border-white/20 shadow-lg relative overflow-hidden transition-colors duration-500"
              style={{ backgroundColor: beerColorHex }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-black/30 pointer-events-none" />
              {/* Пузырьки */}
              <div className="absolute bottom-2 left-2 w-1 h-1 rounded-full bg-white/40 animate-pulse" />
              <div className="absolute bottom-5 right-3 w-1.5 h-1.5 rounded-full bg-white/30 animate-pulse" />
            </div>
            {/* Ножка/основание */}
            <div className="w-8 h-1 bg-stone-600 rounded-full mt-0.5" />
          </div>
        </div>

        {/* Метрики: OG / FG / ABV / IBU */}
        <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* НП (OG) */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200/80 dark:border-stone-800 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">Начальная плотность</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold">
                {recipe.calculated.ogPlato}°P
              </span>
            </div>
            <div className="my-2">
              <div className="text-2xl font-black font-mono text-stone-900 dark:text-white">
                {recipe.calculated.ogSg.toFixed(3)}
              </div>
              <div className="text-[11px] text-stone-500">Засыпь: {recipe.calculated.totalGrainWeightKg} кг</div>
            </div>
            <div className="text-[10px] text-stone-400">
              Потенциал экстракта
            </div>
          </div>

          {/* КП (FG) */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200/80 dark:border-stone-800 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">Конечная плотность</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold">
                {recipe.calculated.fgPlato}°P
              </span>
            </div>
            <div className="my-2">
              <div className="text-2xl font-black font-mono text-stone-900 dark:text-white">
                {recipe.calculated.fgSg.toFixed(3)}
              </div>
              <div className="text-[11px] text-stone-500">Аттенюация: {recipe.yeast.attenuationPercent}%</div>
            </div>
            <div className="text-[10px] text-stone-400">
              Степень сбраживания
            </div>
          </div>

          {/* Алкоголь (ABV) */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200/80 dark:border-stone-800 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">Крепость (ABV)</span>
              <Flame className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="my-2">
              <div className="text-2xl font-black font-mono text-amber-700 dark:text-amber-400">
                {recipe.calculated.abv}%
              </div>
              <div className="text-[11px] text-stone-500">~{recipe.calculated.caloriesPer500ml} ккал / 0.5л</div>
            </div>
            <div className="text-[10px] text-stone-400">
              Объемный спирт
            </div>
          </div>

          {/* Горечь (IBU) */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200/80 dark:border-stone-800 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">Горечь (IBU)</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                Tinseth
              </span>
            </div>
            <div className="my-2">
              <div className="text-2xl font-black font-mono text-stone-900 dark:text-white">
                {recipe.calculated.ibu}
              </div>
              <div className="text-[11px] text-stone-500">Хмелей: {recipe.hops.length} поз.</div>
            </div>
            <div className="text-[10px] text-stone-400">
              Международные единицы
            </div>
          </div>
        </div>
      </div>

      {/* Валидатор сбалансированности по BJCP или карточка свободного рецепта */}
      {!isBjcpStyle ? (
        <div className="p-4 sm:p-5 rounded-2xl border bg-stone-50/80 dark:bg-stone-850/60 border-stone-200/80 dark:border-stone-800 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center flex-wrap gap-2">
                  <span>Свободный авторский рецепт</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200">
                    Стили BJCP отключены
                  </span>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-300 mt-1">
                  Для чистого авторского шаблона рамки BJCP не используются. Вы можете свободно экспериментировать с любыми пропорциями солода, охмелением и температурными паузами без предупреждений калькулятора.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const defaultStyle = BJCP_STYLES[0];
                  updateParams({ style: defaultStyle.name, category: defaultStyle.category });
                }}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-amber-400 text-stone-700 dark:text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                title="Привязать рецепт к классическому стилю BJCP"
              >
                <span>Привязать к стилю BJCP</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          validation.isCompliant
            ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
            : 'bg-amber-50/80 dark:bg-amber-950/25 border-amber-300 dark:border-amber-800/70'
        }`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-white dark:bg-stone-800 shadow-xs mt-0.5 shrink-0">
                {validation.isCompliant ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                )}
              </div>
              <div>
                <div className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center flex-wrap gap-2">
                  <span>Проверка соответствия стилю «{recipe.style}»</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    validation.isCompliant
                      ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200'
                      : 'bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200'
                  }`}>
                    {validation.isCompliant ? 'Сбалансировано' : 'Есть замечания'}
                  </span>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-300 mt-1">
                  {validation.balanceVerdict}
                </p>
                {validation.recommendations.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs text-stone-700 dark:text-stone-300 list-disc list-inside">
                    {validation.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Быстрое действие: Балансировка в 1 клик при замечаниях */}
            <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
              {!validation.isCompliant ? (
                <button
                  type="button"
                  onClick={() => handleAutoBalanceRecipe('all')}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 active:scale-[0.98] text-white font-bold text-xs shadow-sm hover:shadow transition-all flex items-center gap-2 cursor-pointer"
                  title="Автоматически скорректировать засыпь, цвет, хмели и плотность в 1 клик"
                >
                  <Sparkles className="w-4 h-4 text-amber-200 animate-pulse" />
                  <span>Скорректировать рецепт (сбалансировать)</span>
                </button>
              ) : previousRecipeState ? (
                <button
                  type="button"
                  onClick={handleUndoBalance}
                  className="px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-white dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Вернуть предыдущие значения до балансировки"
                >
                  <span>Отменить корректировку</span>
                </button>
              ) : null}
            </div>
          </div>

          {/* Информационный отчет о примененных изменениях */}
          {balanceNotice && (
            <div className="mt-3.5 pt-3 border-t border-stone-200/60 dark:border-stone-800">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Рецепт сбалансирован под стиль «{recipe.style}»
                </span>
                <button
                  type="button"
                  onClick={() => setBalanceNotice(null)}
                  className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-0.5 rounded cursor-pointer"
                  title="Закрыть уведомление"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <ul className="space-y-1 text-xs text-stone-700 dark:text-stone-300 list-disc list-inside bg-white/70 dark:bg-stone-900/60 p-3 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40">
                {balanceNotice.map((change, idx) => (
                  <li key={idx}>{change}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Секция 1: Засыпь солода (Grain Bill) */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 sm:p-6 shadow-sm border border-stone-200/80 dark:border-stone-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
          <div>
            <h2 className="text-lg font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-600" />
              <span>Засыпь солода и несоложенки</span>
            </h2>
            <p className="text-xs text-stone-500">
              Общий вес: <b>{recipe.calculated.totalGrainWeightKg} кг</b> • Расчетная НП: <b>{recipe.calculated.ogSg.toFixed(3)}</b> ({recipe.calculated.ogPlato}°P)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleAutoBalanceRecipe('grains')}
              className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Авто-баланс веса зерна под плотность (OG) и цветность выбранного стиля BJCP"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Авто-баланс</span>
            </button>

            <button
              type="button"
              onClick={handleApplyAllKurskSubstitutes}
              className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Заменить все импортные солода в рецепте на проверенные аналоги Курского солода"
            >
              <span>🇷🇺 Все на Курский</span>
            </button>

            {recipe.grains.length > 0 && (
              <button
                type="button"
                onClick={() => updateParams({ grains: [] })}
                className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-red-50 dark:hover:bg-red-950/30 text-stone-500 hover:text-red-600 dark:hover:text-red-400 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title="Полностью очистить засыпь (удалить все солода)"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Очистить засыпь</span>
              </button>
            )}

            {/* Поисковая строка добавления солода (мгновенная фильтрация по началу ввода букв) */}
            <IngredientSearchSelect
              type="grain"
              onSelectGrain={(g) => {
                addGrain({
                  name: g.name,
                  potentialSg: g.potentialSg,
                  colorEbc: g.colorEbc,
                  type: g.type,
                  group: g.group
                });
              }}
              onCustomAdd={(customName) => {
                addGrain(customName ? { name: customName, colorEbc: 4.0, potentialSg: 1.037, type: 'base' } : undefined);
              }}
              className="w-full sm:w-64 md:w-72"
            />

            <button
              type="button"
              onClick={() => { setGuideActiveTab('kursk'); setSubstitutionsGuideOpen(true); }}
              className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
              title="Таблица соответствия импортных солодов и Курского солода"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-600" />
              <span>Справочник</span>
            </button>
          </div>
        </div>

        {/* Уведомление об успешной замене на Курский солод */}
        {kurskSwapNotice && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-center gap-2 text-xs font-semibold text-amber-900 dark:text-amber-200 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-amber-600" />
            <span>Все солода успешно заменены на отечественные аналоги Курского солодовенного завода с пересчетом плотности и цветности!</span>
          </div>
        )}

        {/* Панель «Курский солод — основа варки» */}
        {(() => {
          const kurskGrainsCount = recipe.grains.filter(g => isKurskMalt(g.name)).length;
          const totalGrainsCount = recipe.grains.length;
          const kurskWeightKg = recipe.grains.filter(g => isKurskMalt(g.name)).reduce((sum, g) => sum + g.weightKg, 0);
          const totalWeightKg = Math.max(0.1, recipe.calculated.totalGrainWeightKg);
          const kurskPercent = Math.min(100, Math.round((kurskWeightKg / totalWeightKg) * 100));
          const hasImportedGrains = recipe.grains.some(g => !isKurskMalt(g.name));

          return (
            <div className="p-3.5 sm:p-4 rounded-xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-300/80 dark:border-amber-800/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                    <span>🌾 Засыпь из Курского солода:</span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${kurskPercent >= 90 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700' : 'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-300 dark:border-amber-700'}`}>
                      {kurskPercent}% ({kurskWeightKg.toFixed(1)} из {totalWeightKg.toFixed(1)} кг)
                    </span>
                  </span>
                  {kurskPercent === 100 && (
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>100% отечественный крафт</span>
                    </span>
                  )}
                </div>

                {hasImportedGrains && (
                  <button
                    type="button"
                    onClick={handleApplyAllKurskSubstitutes}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
                    title="Заменить все импортные солода в засыпи на проверенные аналоги Курского солода"
                  >
                    <span>🇷🇺 Заменить всё на Курский ({totalGrainsCount - kurskGrainsCount} имп.)</span>
                  </button>
                )}
              </div>

              {/* Быстрое добавление ходовых сортов Курского завода в 1 клик */}
              <div>
                <div className="text-[11px] text-stone-500 dark:text-stone-400 mb-1.5 font-medium flex items-center gap-1">
                  <span>Быстрое добавление ходовых сортов Курского завода (+1 кг):</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { name: 'Курский Пилснер (Pilsner Malt)', label: 'Пилснер 3.8 EBC' },
                    { name: 'Курский Пэйл Эль (Pale Ale Malt)', label: 'Пэйл Эль 6 EBC' },
                    { name: 'Курский Венский (Vienna Malt)', label: 'Венский 8.5 EBC' },
                    { name: 'Курский Мюнхенский темный (Munich Typ 2, 25 EBC)', label: 'Мюнхенский 25 EBC' },
                    { name: 'Курский Пшеничный светлый (Wheat Malt)', label: 'Пшеничный 4.5 EBC' },
                    { name: 'Курский Десертный (Карамельный 20 EBC)', label: 'Десертный 20 EBC' },
                    { name: 'Курский Карамельный 50 (Caramel 50 EBC)', label: 'Карамель 50 EBC' },
                    { name: 'Курский Карамельный 150 (Caramel 150 EBC)', label: 'Карамель 150 EBC' },
                    { name: 'Курский Меланоидиновый (Melanoidin 75 EBC)', label: 'Мелано 75 EBC' },
                    { name: 'Курский Солод двойной обжарки (250-350 EBC)', label: 'Двойная обжарка 300 EBC' },
                    { name: 'Курский Шоколадный (Chocolate 900 EBC)', label: 'Шоколад 900 EBC' },
                    { name: 'Курский Жженый ячмень (Roasted Barley 1100 EBC)', label: 'Жженый ячмень 1100 EBC' }
                  ].map(item => {
                    const product = KURSK_MALT_PRODUCTS.find(p => p.name === item.name);
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => {
                          if (product) {
                            addGrain(product);
                          }
                        }}
                        className="px-2 py-1 rounded-lg bg-white dark:bg-stone-800 hover:bg-amber-100 dark:hover:bg-amber-950/60 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                        title={`Добавить ${item.name} (+1 кг)`}
                      >
                        <Plus className="w-3 h-3 text-amber-600" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Визуальная полоса долей солода в засыпи */}
        <div className="w-full h-3 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden flex shadow-inner">
          {recipe.grains.map((g, idx) => {
            const pct = (g.weightKg / Math.max(0.1, recipe.calculated.totalGrainWeightKg)) * 100;
            return (
              <div
                key={g.id || idx}
                style={{
                  width: `${pct}%`,
                  backgroundColor: ebcToHex(g.colorEbc)
                }}
                title={`${g.name}: ${pct.toFixed(1)}% (${g.weightKg} кг)`}
                className="h-full border-r border-stone-900/10"
              />
            );
          })}
        </div>

        {/* Таблица солодов */}
        <div className="w-full max-w-full overflow-x-auto rounded-xl border border-stone-200/60 dark:border-stone-800/60 swipe-scroll-x">
          <table className="w-full text-left text-xs min-w-[620px]">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400">
                <th className="py-2 px-2 min-w-[220px]">Название и аналог солода</th>
                <th className="py-2 px-1">Тип</th>
                <th className="py-2 px-1 w-24">Вес (кг)</th>
                <th className="py-2 px-1 w-20">Доля (%)</th>
                <th className="py-2 px-1 w-24">Цвет (EBC)</th>
                <th className="py-2 px-1 w-24">Потенциал</th>
                <th className="py-2 px-1 w-10 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
              {recipe.grains.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-500 dark:text-stone-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Wheat className="w-8 h-8 text-stone-300 dark:text-stone-600" />
                      <span className="font-bold text-xs text-stone-700 dark:text-stone-300">Засыпь пуста (0 кг)</span>
                      <span className="text-[11px] text-stone-400 max-w-md">
                        Все солода удалены. Найдите нужный солод в строке поиска ниже или создайте свой.
                      </span>
                      <div className="w-full max-w-xs mt-1">
                        <IngredientSearchSelect
                          type="grain"
                          onSelectGrain={(g) => addGrain(g)}
                          onCustomAdd={(customName) => {
                            addGrain(customName ? { name: customName, colorEbc: 4.0, potentialSg: 1.037, type: 'base' } : undefined);
                          }}
                          placeholder="🔍 Найти солод (начните ввод)..."
                          className="w-full"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => addGrain()}
                        className="mt-1 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs border border-stone-200 dark:border-stone-700"
                      >
                        <Plus className="w-3.5 h-3.5 text-amber-600" />
                        <span>+ Создать солод вручную</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                recipe.grains.map((grain) => {
                const sharePercent = ((grain.weightKg / Math.max(0.1, recipe.calculated.totalGrainWeightKg)) * 100).toFixed(1);
                const sub = getKurskMaltSubstitute(grain.name, grain.type, grain.colorEbc);
                const isAlreadyKursk = isKurskMalt(grain.name);

                return (
                  <tr key={grain.id} className="hover:bg-amber-50/40 dark:hover:bg-stone-800/40 transition-colors">
                    <td className="py-2 px-2 min-w-[220px] max-w-[290px]">
                      {/* Поле ввода названия с компактным читаемым шрифтом */}
                      <input
                        type="text"
                        value={grain.name}
                        onChange={(e) => updateGrain(grain.id, { name: e.target.value })}
                        placeholder="Название солода..."
                        className="w-full font-bold text-[11px] sm:text-xs text-stone-900 dark:text-stone-100 bg-transparent border-b border-transparent hover:border-stone-300 focus:border-amber-500 focus:outline-none py-0.5 truncate"
                        title={grain.name}
                      />

                      {/* Бегущая строка (Marquee Ticker) для длинных названий солода */}
                      <div className="mt-0.5 max-w-full overflow-hidden">
                        <MarqueeText
                          text={grain.name}
                          subtext={`${grain.colorEbc} EBC`}
                          prefix={<span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold shrink-0">🌾 Солод:</span>}
                          className="w-full"
                          textClassName="text-[10px] sm:text-[11px] font-semibold text-stone-700 dark:text-stone-300"
                          maxLengthThreshold={14}
                          speedSec={15}
                        />
                      </div>
                      {/* Подсказка Курского аналога при указании солода */}
                      {sub && !isAlreadyKursk && (
                        <div className="mt-1.5 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 text-xs space-y-1">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] text-amber-800 dark:text-amber-300 font-bold flex items-center gap-1">
                                <span>🌾 Рекомендуемый Курский аналог:</span>
                              </span>
                              <span className="text-[11px] font-extrabold text-stone-900 dark:text-white bg-white dark:bg-stone-800 px-2 py-0.5 rounded border border-amber-200 dark:border-stone-700">
                                {sub.kurskName}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-200/80 dark:bg-amber-900 text-amber-900 dark:text-amber-200 font-bold">
                                {sub.colorEbc} EBC
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleApplyKurskSubstitute(grain.id)}
                              className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] flex items-center gap-1 shadow-2xs transition-colors shrink-0 self-start sm:self-auto"
                              title={`${sub.description} ${sub.tip || ''}`}
                            >
                              <Check className="w-3 h-3" />
                              <span>Заменить на Курский ({sub.ratio !== 1.0 ? `${sub.ratio}x вес` : '1:1'})</span>
                            </button>
                          </div>
                          <p className="text-[10px] text-stone-600 dark:text-stone-300 leading-snug">
                            {sub.description} {sub.tip && <b className="text-amber-800 dark:text-amber-400">Совет: {sub.tip}</b>}
                          </p>
                        </div>
                      )}

                      {/* Если уже выбран Курский солод */}
                      {isAlreadyKursk && (
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>Отечественный солод Курского завода (в наличии и проверен)</span>
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-1">
                      <select
                        value={grain.type}
                        onChange={(e) => updateGrain(grain.id, { type: e.target.value as any })}
                        className="bg-transparent text-stone-600 dark:text-stone-400 focus:outline-none text-[11px]"
                      >
                        <option value="base">Базовый</option>
                        <option value="caramel">Карамельный</option>
                        <option value="roasted">Жженый</option>
                        <option value="wheat">Пшеничный</option>
                        <option value="adjunct">Несоложенка</option>
                        <option value="acid">Кислый (pH)</option>
                      </select>
                    </td>
                    <td className="py-2 px-1">
                      <input
                        type="number"
                        min="0.05"
                        max="500"
                        step="0.05"
                        value={grain.weightKg}
                        onChange={(e) => updateGrain(grain.id, { weightKg: Math.max(0.01, parseFloat(e.target.value) || 0) })}
                        className="w-20 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded px-2 py-1 font-mono font-bold"
                      />
                    </td>
                    <td className="py-2 px-1 font-mono text-stone-600 dark:text-stone-400">
                      {sharePercent}%
                    </td>
                    <td className="py-2 px-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-3 h-3 rounded-full border border-stone-300 dark:border-stone-600"
                          style={{ backgroundColor: ebcToHex(grain.colorEbc) }}
                        />
                        <input
                          type="number"
                          min="1"
                          max="2000"
                          step="1"
                          value={grain.colorEbc}
                          onChange={(e) => updateGrain(grain.id, { colorEbc: Math.max(1, parseFloat(e.target.value) || 4) })}
                          className="w-14 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded px-1.5 py-1 font-mono"
                        />
                      </div>
                    </td>
                    <td className="py-2 px-1">
                      <input
                        type="number"
                        min="1.010"
                        max="1.045"
                        step="0.001"
                        value={grain.potentialSg}
                        onChange={(e) => updateGrain(grain.id, { potentialSg: parseFloat(e.target.value) || 1.037 })}
                        className="w-16 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded px-1.5 py-1 font-mono"
                      />
                    </td>
                    <td className="py-2 px-1 text-right">
                      <button
                        type="button"
                        onClick={() => removeGrain(grain.id)}
                        className="p-1 text-stone-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                        title="Удалить этот солод"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Секция 2: Водоподготовка и Температурные паузы затирания */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Калькулятор воды и температуры засыпи */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 shadow-sm border border-stone-200/80 dark:border-stone-800 space-y-4">
          <div className="border-b border-stone-100 dark:border-stone-800 pb-3">
            <h3 className="font-bold text-stone-900 dark:text-white flex items-center gap-2 text-base">
              <Droplets className="w-5 h-5 text-sky-500" />
              <span>Водоподготовка & Засыпь</span>
            </h3>
            <p className="text-xs text-stone-500">Точный расчет объема воды и температуры засыпи зерна</p>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60">
              <div className="text-xs text-stone-600 dark:text-stone-300 font-medium">
                Температура воды для засыпи (Strike Temp):
              </div>
              <div className="text-2xl font-black text-amber-700 dark:text-amber-400 font-mono mt-0.5">
                {recipe.calculated.strikeTempC} °C
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                Нагрейте воду до этой температуры, чтобы после засыпи сухого зерна ({recipe.grainTempC}°C) получить первую паузу 67°C.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              {/* 1. Заторная вода (компактно, без вылезания за строку) */}
              <div className="flex items-center justify-between py-1.5 border-b border-stone-100 dark:border-stone-800 gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Droplets className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="text-stone-600 dark:text-stone-300 font-medium truncate">Заторная вода:</span>
                </div>
                <span className="font-mono font-bold text-stone-900 dark:text-white shrink-0 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded text-xs">
                  {recipe.calculated.strikeWaterL} л
                </span>
              </div>

              {/* 2. Промывочная вода (компактно, без вылезания за строку) */}
              <div className="flex items-center justify-between py-1.5 border-b border-stone-100 dark:border-stone-800 gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Droplets className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                  <span className="text-stone-600 dark:text-stone-300 font-medium truncate">Промывочная вода (до 78°C):</span>
                </div>
                <span className="font-mono font-bold text-sky-600 dark:text-sky-400 shrink-0 bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 rounded border border-sky-200/50 dark:border-sky-800/50 text-xs">
                  {recipe.calculated.spargeWaterL} л
                </span>
              </div>

              {/* 3. Красиво обыгранный итоговый расход воды */}
              <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-sky-500/5 to-amber-500/5 dark:from-amber-950/40 dark:via-stone-900 dark:to-sky-950/30 border border-amber-300/70 dark:border-amber-700/60 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-200 font-extrabold text-xs">
                    <Droplets className="w-4 h-4 text-amber-500" />
                    <span>Суммарный расход воды</span>
                  </div>
                  <div className="text-base font-black font-mono text-amber-800 dark:text-amber-300">
                    {recipe.calculated.totalWaterL} л
                  </div>
                </div>

                {/* Визуальная сегментированная шкала баланса воды */}
                <div className="space-y-1">
                  <div className="w-full h-2 rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden flex">
                    <div
                      style={{ width: `${Math.min(100, (recipe.calculated.strikeWaterL / Math.max(1, recipe.calculated.totalWaterL)) * 100)}%` }}
                      className="bg-amber-500 h-full"
                      title={`Заторная: ${recipe.calculated.strikeWaterL} л`}
                    />
                    <div
                      style={{ width: `${Math.min(100, (recipe.calculated.spargeWaterL / Math.max(1, recipe.calculated.totalWaterL)) * 100)}%` }}
                      className="bg-sky-500 h-full"
                      title={`Промывочная: ${recipe.calculated.spargeWaterL} л`}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-stone-500 dark:text-stone-400 font-medium pt-0.5">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                      Затор {recipe.calculated.strikeWaterL} л
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500 inline-block" />
                      Промывка {recipe.calculated.spargeWaterL} л
                    </span>
                  </div>
                </div>

                <div className="pt-1 border-t border-amber-200/50 dark:border-stone-800 flex justify-between text-[10px] text-stone-500 dark:text-stone-400">
                  <span>Впитывание зерном:</span>
                  <span className="font-mono font-semibold text-stone-600 dark:text-stone-300">~{(recipe.calculated.totalGrainWeightKg * 0.96).toFixed(1)} л</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Паузы затирания (Mash Schedule) */}
        <div className="lg:col-span-2 bg-white dark:bg-stone-900 rounded-2xl p-5 shadow-sm border border-stone-200/80 dark:border-stone-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
            <div>
              <h3 className="font-bold text-stone-900 dark:text-white flex items-center gap-2 text-base">
                <Thermometer className="w-5 h-5 text-red-500" />
                <span>Температурные паузы затирания</span>
              </h3>
              <p className="text-xs text-stone-500">Профиль ферментации сусла</p>
            </div>

            {/* Быстрые пресеты пауз */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-stone-400 text-[11px]">Пресеты:</span>
              <button
                onClick={() => applyMashPreset('kursk')}
                className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-200 font-bold text-[11px] border border-amber-300 dark:border-amber-700 flex items-center gap-1 cursor-pointer transition-colors"
                title="Рекомендуемый технологический профиль для Курского солода (53°C белковая 15 мин -> 65°C мальтозная -> 72°C декстриновая -> 78°C мэшаут)"
              >
                🌾 Курский стандарт
              </button>
              <button
                onClick={() => applyMashPreset('dry')}
                className="px-2 py-1 rounded bg-stone-100 dark:bg-stone-800 hover:bg-amber-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-medium text-[11px]"
              >
                Сухое
              </button>
              <button
                onClick={() => applyMashPreset('balanced')}
                className="px-2 py-1 rounded bg-stone-100 dark:bg-stone-800 hover:bg-amber-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-medium text-[11px]"
              >
                Баланс
              </button>
              <button
                onClick={() => applyMashPreset('full')}
                className="px-2 py-1 rounded bg-stone-100 dark:bg-stone-800 hover:bg-amber-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-medium text-[11px]"
              >
                Полнотелое
              </button>
              <button
                onClick={() => applyMashPreset('weizen')}
                className="px-2 py-1 rounded bg-stone-100 dark:bg-stone-800 hover:bg-amber-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-medium text-[11px]"
              >
                Пшеничное
              </button>

              {recipe.mashSchedule.length > 0 && (
                <button
                  type="button"
                  onClick={() => updateParams({ mashSchedule: [] })}
                  className="px-2 py-1 rounded border border-stone-200 dark:border-stone-700 hover:bg-red-50 dark:hover:bg-red-950/30 text-stone-500 hover:text-red-600 dark:hover:text-red-400 font-semibold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                  title="Очистить все температурные паузы"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Очистить паузы</span>
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2.5">
            {recipe.mashSchedule.length === 0 ? (
              <div className="p-6 text-center border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-xl space-y-2">
                <p className="text-xs text-stone-600 dark:text-stone-300 font-semibold">
                  Температурные паузы не заданы (0 пауз).
                </p>
                <p className="text-[11px] text-stone-400 max-w-sm mx-auto">
                  Все паузы удалены. Выберите готовый профиль затирания выше или добавьте паузу вручную.
                </p>
                <button
                  type="button"
                  onClick={addMashRest}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Добавить первую паузу</span>
                </button>
              </div>
            ) : (
              recipe.mashSchedule.map((rest, idx) => (
                <div
                  key={rest.id || idx}
                  className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/60"
                >
                  <div className="w-6 h-6 rounded-full bg-amber-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2.5 min-w-0">
                    <input
                      type="text"
                      value={rest.name}
                      onChange={(e) => updateMashRest(rest.id, { name: e.target.value })}
                      className="font-medium text-xs bg-transparent text-stone-900 dark:text-stone-100 focus:outline-none flex-1 min-w-0 py-0.5 border-b border-transparent focus:border-amber-400"
                      placeholder="Название паузы..."
                    />
                    <div className="flex items-center gap-3 shrink-0 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-stone-400 text-[11px]">Темп:</span>
                        <input
                          type="number"
                          min="35"
                          max="85"
                          step="1"
                          value={rest.tempC}
                          onChange={(e) => updateMashRest(rest.id, { tempC: parseFloat(e.target.value) || 65 })}
                          className="w-14 bg-white dark:bg-stone-700 border border-stone-300 dark:border-stone-600 rounded px-1.5 py-0.5 font-mono font-bold text-center text-xs"
                        />
                        <span className="text-stone-500 font-mono text-[11px]">°C</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-stone-400 text-[11px]">Время:</span>
                        <input
                          type="number"
                          min="1"
                          max="120"
                          step="5"
                          value={rest.timeMin}
                          onChange={(e) => updateMashRest(rest.id, { timeMin: parseInt(e.target.value, 10) || 15 })}
                          className="w-14 bg-white dark:bg-stone-700 border border-stone-300 dark:border-stone-600 rounded px-1.5 py-0.5 font-mono font-bold text-center text-xs"
                        />
                        <span className="text-stone-500 font-mono text-[11px]">мин</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMashRest(rest.id)}
                    className="p-1 text-stone-400 hover:text-red-500 transition-colors cursor-pointer"
                    title="Удалить эту паузу"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}

            <button
              onClick={addMashRest}
              className="w-full py-2 border-2 border-dashed border-stone-200 dark:border-stone-800 hover:border-amber-400 rounded-xl text-stone-500 hover:text-amber-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Добавить паузу затирания</span>
            </button>
          </div>
        </div>
      </div>

      {/* Секция 3: Охмеление и кипячение (Hop Schedule) */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 sm:p-6 shadow-sm border border-stone-200/80 dark:border-stone-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
          <div>
            <h2 className="text-lg font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-600" />
              <span>Охмеление и кипячение ({recipe.boilTimeMin} мин)</span>
            </h2>
            <p className="text-xs text-stone-500">
              Расчетная горечь: <b>{recipe.calculated.ibu} IBU</b> • Баланс горечи BU:GU: <b>{recipe.calculated.buGuRatio}</b>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleAutoBalanceRecipe('hops')}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Авто-баланс навески хмеля под горечь (IBU) и баланс BU:GU выбранного стиля BJCP"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Авто-баланс</span>
            </button>

            {recipe.hops.length > 0 && (
              <button
                type="button"
                onClick={() => updateParams({ hops: [] })}
                className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-red-50 dark:hover:bg-red-950/30 text-stone-500 hover:text-red-600 dark:hover:text-red-400 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title="Полностью очистить список хмелей (удалить все позиции)"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Очистить хмель</span>
              </button>
            )}

            {/* Поисковая строка добавления хмеля (мгновенная фильтрация по началу ввода букв) */}
            <IngredientSearchSelect
              type="hop"
              onSelectHop={(h) => {
                addHop({
                  name: h.name,
                  alphaAcid: h.alphaAcid,
                  profile: h.profile,
                  region: h.region
                });
              }}
              onCustomAdd={(customName) => {
                addHop(customName ? { name: customName, alphaAcid: 4.5 } : undefined);
              }}
              className="w-full sm:w-64 md:w-72"
            />

            <button
              type="button"
              onClick={() => { setGuideActiveTab('hops'); setSubstitutionsGuideOpen(true); }}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Таблица взаимозаменяемости хмелей"
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              <span>Таблица замен</span>
            </button>
          </div>
        </div>

        {/* Таблица хмелей */}
        <div className="w-full max-w-full overflow-x-auto rounded-xl border border-stone-200/60 dark:border-stone-800/60 swipe-scroll-x">
          <table className="w-full text-left text-xs min-w-[620px]">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400">
                <th className="py-2 px-2 min-w-[200px]">Хмель и альтернативы</th>
                <th className="py-2 px-1 w-24">Вес (г)</th>
                <th className="py-2 px-1 w-24">Альфа-к-та (%)</th>
                <th className="py-2 px-1 w-28">Время / Этап</th>
                <th className="py-2 px-1 w-28">Назначение</th>
                <th className="py-2 px-1">Примечания</th>
                <th className="py-2 px-1 w-10 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
              {recipe.hops.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-500 dark:text-stone-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Flame className="w-8 h-8 text-stone-300 dark:text-stone-600" />
                      <span className="font-bold text-xs text-stone-700 dark:text-stone-300">Список хмеля пуст (0 г, 0 IBU)</span>
                      <span className="text-[11px] text-stone-400 max-w-md">
                        Все хмели удалены. Найдите нужный сорт в строке поиска ниже или добавьте свой.
                      </span>
                      <div className="w-full max-w-xs mt-1">
                        <IngredientSearchSelect
                          type="hop"
                          onSelectHop={(h) => addHop(h)}
                          onCustomAdd={(customName) => {
                            addHop(customName ? { name: customName, alphaAcid: 4.5 } : undefined);
                          }}
                          placeholder="🔍 Найти хмель (начните ввод)..."
                          className="w-full"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => addHop()}
                        className="mt-1 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs border border-stone-200 dark:border-stone-700"
                      >
                        <Plus className="w-3.5 h-3.5 text-emerald-600" />
                        <span>+ Создать хмель вручную</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                recipe.hops.map((hop) => {
                const alts = getHopAlternatives(hop.name);
                return (
                  <tr key={hop.id} className="hover:bg-amber-50/40 dark:hover:bg-stone-800/40 transition-colors">
                    <td className="py-2 px-2 min-w-[200px] max-w-[280px]">
                      {/* Поле ввода с компактным адаптивным шрифтом */}
                      <input
                        type="text"
                        value={hop.name}
                        onChange={(e) => updateHop(hop.id, { name: e.target.value })}
                        placeholder="Название хмеля..."
                        className="w-full font-bold text-[11px] sm:text-xs text-stone-900 dark:text-stone-100 bg-transparent border-b border-transparent hover:border-stone-300 focus:border-amber-500 focus:outline-none py-0.5 truncate"
                        title={hop.name}
                      />

                      {/* Бегущая строка (Marquee Ticker) для длинных названий хмеля */}
                      <div className="mt-0.5 max-w-full overflow-hidden">
                        <MarqueeText
                          text={hop.name}
                          subtext={`${hop.alphaAcid}% AA`}
                          prefix={<span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold shrink-0">🌿 Хмель:</span>}
                          className="w-full"
                          textClassName="text-[10px] sm:text-[11px] font-semibold text-stone-700 dark:text-stone-300"
                          maxLengthThreshold={18}
                          speedSec={15}
                        />
                      </div>
                      {/* Предложение альтернативных сортов хмеля при указании хмеля */}
                      {alts && alts.length > 0 && (
                        <div className="mt-1.5 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 text-xs space-y-1.5">
                          <div className="flex items-center justify-between gap-1 flex-wrap">
                            <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-emerald-600" />
                              <span>Альтернативные варианты хмеля:</span>
                            </span>
                            <span className="text-[9px] text-stone-500">нажмите для быстрой замены сорта</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5">
                            {alts.slice(0, 3).map((alt, aIdx) => (
                              <div
                                key={aIdx}
                                className="p-1.5 rounded-lg bg-white dark:bg-stone-800 border border-emerald-200 dark:border-emerald-700/70 shadow-2xs flex flex-col justify-between"
                              >
                                <div>
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-bold text-stone-900 dark:text-white text-[11px] truncate">{alt.name}</span>
                                    <span className="text-[9px] font-bold font-mono px-1 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 shrink-0">
                                      {alt.similarity}%
                                    </span>
                                  </div>
                                  <div className="text-[9px] text-stone-500 font-mono">Альфа: {alt.alphaRange}</div>
                                  <div className="text-[9px] text-stone-600 dark:text-stone-300 line-clamp-1" title={alt.flavorProfile}>
                                    {alt.flavorProfile}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleApplyHopAlternative(hop.id, alt.name)}
                                  className="mt-1 w-full py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] transition-colors flex items-center justify-center gap-0.5"
                                  title={alt.conversionNote}
                                >
                                  <Check className="w-2.5 h-2.5" />
                                  <span>Выбрать {alt.name}</span>
                                </button>
                              </div>
                            ))}
                          </div>
                          {alts[0] && (
                            <div className="text-[9px] text-emerald-800 dark:text-emerald-300 font-medium">
                              💡 <b>Рекомендация:</b> {alts[0].conversionNote}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  <td className="py-2 px-1">
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      step="1"
                      value={hop.weightG}
                      onChange={(e) => updateHop(hop.id, { weightG: Math.max(1, parseFloat(e.target.value) || 0) })}
                      className="w-20 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded px-2 py-1 font-mono font-bold"
                    />
                  </td>
                  <td className="py-2 px-1">
                    <input
                      type="number"
                      min="0.5"
                      max="30"
                      step="0.1"
                      value={hop.alphaAcid}
                      onChange={(e) => updateHop(hop.id, { alphaAcid: Math.max(0.1, parseFloat(e.target.value) || 5) })}
                      className="w-20 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded px-2 py-1 font-mono font-bold"
                    />
                  </td>
                  <td className="py-2 px-1">
                    <input
                      type="number"
                      min="0"
                      max={recipe.boilTimeMin}
                      step="5"
                      value={hop.boilTimeMin}
                      onChange={(e) => updateHop(hop.id, { boilTimeMin: parseInt(e.target.value, 10) || 0 })}
                      className="w-16 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded px-2 py-1 font-mono"
                    />
                    <span className="text-stone-400 ml-1">мин</span>
                  </td>
                  <td className="py-2 px-1">
                    <select
                      value={hop.use}
                      onChange={(e) => updateHop(hop.id, { use: e.target.value as any })}
                      className="bg-transparent text-stone-700 dark:text-stone-300 focus:outline-none"
                    >
                      <option value="boil">Кипячение</option>
                      <option value="aroma">Аромат (15м)</option>
                      <option value="whirlpool">Вирпул (0м)</option>
                      <option value="dry_hop">Сухое (Dry Hop)</option>
                    </select>
                  </td>
                  <td className="py-2 px-1">
                    <input
                      type="text"
                      value={hop.notes || ''}
                      onChange={(e) => updateHop(hop.id, { notes: e.target.value })}
                      placeholder="напр. на 4 дня до розлива"
                      className="w-full bg-transparent text-stone-500 focus:outline-none"
                    />
                  </td>
                  <td className="py-2 px-1 text-right">
                    <button
                      type="button"
                      onClick={() => removeHop(hop.id)}
                      className="p-1 text-stone-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                      title="Удалить этот хмель"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            }))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Секция: Дополнительные ингредиенты (хлопья, несоложенка, мёд, сахара, фрукты, специи, мох, добавки) */}
      <OtherIngredientsSection
        ingredients={recipe.otherIngredients || []}
        onChange={(updated) => updateParams({ otherIngredients: updated })}
        batchSizeL={recipe.batchSizeL}
      />

      {/* Секция 4: Дрожжи (Pitch Rate) и Карбонизация (Праймер) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Дрожжи и расчет нормы засева */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 shadow-sm border border-stone-200/80 dark:border-stone-800 space-y-4">
          <div className="border-b border-stone-100 dark:border-stone-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-stone-900 dark:text-white flex items-center gap-2 text-base">
                <Beer className="w-5 h-5 text-amber-500" />
                <span>Дрожжи & Норма засева (Pitch Rate)</span>
              </h3>
              <p className="text-xs text-stone-500">Точный расчет для здорового сбраживания без эфирных дефектов</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={COMMON_YEASTS.some(y => y.name === recipe.yeast.name) ? recipe.yeast.name : '__CUSTOM__'}
                onChange={(e) => {
                  if (e.target.value === '__CUSTOM__') {
                    updateParams({
                      yeast: {
                        name: 'Свои дрожжи',
                        lab: 'Другая лаборатория',
                        form: 'dry',
                        type: 'ale',
                        cellsPerGramOrVial: 20,
                        attenuationPercent: 75,
                        tempRange: [18, 22],
                        styleDescription: 'Пользовательский штамм дрожжей'
                      }
                    });
                  } else {
                    const y = COMMON_YEASTS.find(item => item.name === e.target.value);
                    if (y) updateParams({ yeast: y });
                  }
                }}
                className="flex-1 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2 text-xs font-semibold text-stone-900 dark:text-stone-100 focus:outline-none cursor-pointer"
              >
                <option value="__CUSTOM__">✍️ Раздел «Другое / Внести свое название дрожжей»</option>
                <optgroup label="🇳🇿 Mangrove Jack's (Все виды)">
                  {COMMON_YEASTS.filter(y => y.lab === "Mangrove Jack's").map(y => (
                    <option key={y.name} value={y.name}>
                      {y.name} — {y.styleDescription}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🇫🇷 Fermentis (SafAle / SafLager)">
                  {COMMON_YEASTS.filter(y => y.lab === 'Fermentis').map(y => (
                    <option key={y.name} value={y.name}>
                      {y.name} — {y.styleDescription}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🇨🇦 Lallemand (LalBrew)">
                  {COMMON_YEASTS.filter(y => y.lab === 'Lallemand').map(y => (
                    <option key={y.name} value={y.name}>
                      {y.name} — {y.styleDescription}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Если выбран раздел Другое / свои дрожжи */}
            {!COMMON_YEASTS.some(y => y.name === recipe.yeast.name) && (
              <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/60 space-y-2 animate-in fade-in duration-150">
                <div className="text-[11px] font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <span>✍️ Свои дрожжи (Раздел «Другое»):</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-stone-500 dark:text-stone-400 block mb-0.5">Название штамма:</label>
                    <input
                      type="text"
                      value={recipe.yeast.name}
                      onChange={(e) => updateParams({ yeast: { ...recipe.yeast, name: e.target.value } })}
                      placeholder="Напр., Danstar Windsor"
                      className="w-full bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg px-2 py-1 font-bold text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-500 dark:text-stone-400 block mb-0.5">Производитель / Лаб:</label>
                    <input
                      type="text"
                      value={recipe.yeast.lab}
                      onChange={(e) => updateParams({ yeast: { ...recipe.yeast, lab: e.target.value } })}
                      placeholder="Производитель"
                      className="w-full bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg px-2 py-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-500 dark:text-stone-400 block mb-0.5">Аттенюация (% сбраживания):</label>
                    <input
                      type="number"
                      min="50"
                      max="100"
                      value={recipe.yeast.attenuationPercent}
                      onChange={(e) => updateParams({ yeast: { ...recipe.yeast, attenuationPercent: parseInt(e.target.value, 10) || 75 } })}
                      className="w-full bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg px-2 py-1 text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700/60">
                <span className="text-stone-400 block mb-0.5">Требуется сухих дрожжей:</span>
                <span className="text-xl font-black font-mono text-stone-900 dark:text-white">
                  {recipe.calculated.dryYeastGramsNeeded} г
                </span>
                <span className="text-[11px] text-amber-600 dark:text-amber-400 block mt-0.5 font-medium">
                  ~{recipe.calculated.yeastPacksNeeded} пач. по 11.5г
                </span>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700/60">
                <span className="text-stone-400 block mb-0.5">Температура брожения:</span>
                <span className="text-xl font-black font-mono text-stone-900 dark:text-white">
                  {recipe.yeast.tempRange[0]} - {recipe.yeast.tempRange[1]} °C
                </span>
                <span className="text-[11px] text-stone-500 block mt-0.5">
                  Аттенюация: {recipe.yeast.attenuationPercent}%
                </span>
              </div>
            </div>

            <div className="text-[11px] text-stone-500 dark:text-stone-400 p-2.5 rounded-lg bg-amber-50/50 dark:bg-stone-800/40 border border-amber-200/50 dark:border-stone-700/50 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <b>Совет технолога:</b> При плотности выше 15°P рекомендуется запустить стартер или добавить дополнительный пакетик дрожжей для предотвращения «застрявшего» брожения.
              </span>
            </div>
          </div>
        </div>

        {/* Калькулятор карбонизации и праймера */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 shadow-sm border border-stone-200/80 dark:border-stone-800 space-y-4">
          <div className="border-b border-stone-100 dark:border-stone-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-stone-900 dark:text-white flex items-center gap-2 text-base">
                <Droplets className="w-5 h-5 text-amber-500" />
                <span>Карбонизация & Расчет праймера</span>
              </h3>
              <p className="text-xs text-stone-500">
                Целевой уровень: <b>{recipe.targetCarbonationVol} vol CO2</b> при темп. пива <b>{recipe.beerTempAtBottlingC}°C</b>
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-center">
                <span className="text-[11px] text-stone-600 dark:text-stone-300 font-semibold block">Декстроза (глюкоза)</span>
                <span className="text-xl font-black font-mono text-amber-800 dark:text-amber-400 block my-1">
                  {recipe.calculated.dextroseGrams} г
                </span>
                <span className="text-[10px] text-stone-500 font-mono">
                  {(recipe.calculated.dextroseGrams / Math.max(1, recipe.batchSizeL)).toFixed(1)} г/л
                </span>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700/60 text-center">
                <span className="text-[11px] text-stone-600 dark:text-stone-300 font-semibold block">Обычный сахар</span>
                <span className="text-xl font-black font-mono text-stone-800 dark:text-stone-200 block my-1">
                  {recipe.calculated.sucroseGrams} г
                </span>
                <span className="text-[10px] text-stone-500 font-mono">
                  {(recipe.calculated.sucroseGrams / Math.max(1, recipe.batchSizeL)).toFixed(1)} г/л
                </span>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700/60 text-center">
                <span className="text-[11px] text-stone-600 dark:text-stone-300 font-semibold block">Сусло (Шпайзе)</span>
                <span className="text-xl font-black font-mono text-stone-800 dark:text-stone-200 block my-1">
                  {recipe.calculated.speiseMl} мл
                </span>
                <span className="text-[10px] text-stone-500">
                  Плотность {recipe.calculated.ogPlato}°P
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 text-xs text-stone-600 dark:text-stone-300 space-y-1">
              <div className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                <span>Сроки карбонизации и созревания:</span>
              </div>
              <p>
                • <b>Карбонизация в бутылках:</b> 14–21 день при температуре 20–22°C в темноте.
              </p>
              <p>
                • <b>Созревание (Cold conditioning):</b> от 7 дней (для пшеничных и охмеленных IPA) до 4–8 недель (для лагеров и стаутов) при температуре 2–5°C.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно быстрого масштабирования объема партии */}
      {scaleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 max-w-md w-full shadow-xl border border-stone-200 dark:border-stone-800 space-y-4">
            <div className="flex justify-between items-center border-b border-stone-100 dark:border-stone-800 pb-3">
              <h3 className="font-bold text-lg text-stone-900 dark:text-white flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-600" />
                <span>Масштабировать объем варки</span>
              </h3>
              <button
                onClick={() => setScaleModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-300">
              Все количества солодов и порций хмелей будут пропорционально пересчитаны с сохранением оригинальной плотности (OG), горечи (IBU) и цвета.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-stone-500 block">
                Новый целевой объем варки (литров):
              </label>
              <SafeNumberInput
                value={targetScaleL}
                onChange={(val) => setTargetScaleL(val)}
                min={1}
                max={1000}
                fallbackValue={20}
                className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-lg font-bold font-mono text-center text-amber-700 dark:text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <div className="flex justify-center gap-2 pt-1">
                {[10, 20, 25, 30, 50, 100].map(vol => (
                  <button
                    key={vol}
                    type="button"
                    onClick={() => setTargetScaleL(vol)}
                    className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-xs font-mono font-semibold hover:bg-amber-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200"
                  >
                    {vol}л
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-100 dark:border-stone-800">
              <button
                onClick={() => setScaleModalOpen(false)}
                className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800 text-xs font-semibold"
              >
                Отмена
              </button>
              <button
                onClick={handleScaleBatch}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm"
              >
                Пересчитать ингредиенты
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно: Справочник замен (Курский солод & Взаимозаменяемость хмеля) */}
      {substitutionsGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-3xl rounded-3xl bg-white dark:bg-stone-900 p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-stone-100 dark:border-stone-800 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-stone-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-amber-500" />
                  <span>Справочник замен ингредиентов</span>
                </h3>
                <p className="text-xs text-stone-500">
                  Таблицы соответствия Курского солода и взаимозаменяемости хмелей
                </p>
              </div>
              <button
                onClick={() => setSubstitutionsGuideOpen(false)}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Табы справочника и поиск */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setGuideActiveTab('kursk')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    guideActiveTab === 'kursk'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
                  }`}
                >
                  🌾 Аналоги Курского солода
                </button>
                <button
                  onClick={() => setGuideActiveTab('hops')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    guideActiveTab === 'hops'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
                  }`}
                >
                  🌿 Взаимозаменяемость хмеля
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Поиск по сорту..."
                  value={guideSearch}
                  onChange={(e) => setGuideSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs focus:outline-none"
                />
              </div>
            </div>

            {/* Контент таба: Курский солод */}
            {guideActiveTab === 'kursk' && (
              <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
                  💡 <b>Совет пивовара:</b> Продукция Курского солодовенного завода производится из качественного двухрядного ячменя. При замене импортных солодов (Weyermann, Castle, Simpsons) пиво сохраняет аутентичный вкусовой баланс стиля при снижении себестоимости в 2-3 раза.
                </div>

                <div className="space-y-2">
                  {Object.entries(KURSK_MALT_MAP)
                    .filter(([key, val]) =>
                      key.toLowerCase().includes(guideSearch.toLowerCase()) ||
                      val.kurskName.toLowerCase().includes(guideSearch.toLowerCase()) ||
                      val.description.toLowerCase().includes(guideSearch.toLowerCase())
                    )
                    .map(([key, val]) => (
                      <div
                        key={key}
                        className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/70 border border-stone-200/80 dark:border-stone-700 space-y-1.5"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div className="font-extrabold text-sm text-stone-900 dark:text-white flex items-center gap-2">
                            <span className="text-amber-600 dark:text-amber-400 uppercase tracking-wider text-xs">
                              {key.replace('_', ' ')}:
                            </span>
                            <span>{val.kurskName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs font-mono">
                            <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold">
                              {val.colorEbc} EBC
                            </span>
                            <span className="text-stone-500">Пропорция: {val.ratio}x</span>
                          </div>
                        </div>

                        <p className="text-xs text-stone-600 dark:text-stone-300">
                          {val.description}
                        </p>

                        {val.tip && (
                          <div className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-100/50 dark:bg-stone-750 px-2.5 py-1 rounded-lg">
                            <b>Рекомендация:</b> {val.tip}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Контент таба: Хмель */}
            {guideActiveTab === 'hops' && (
              <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200">
                  🌿 <b>Правило замены хмеля:</b> При замене хмеля на горечь (кипячение 60 минут) пересчитывайте массу пропорционально содержанию альфа-кислоты: <code>Вес = Вес_исходный × (Альфа_исходная / Альфа_нового)</code>. Для аромата (вирпул, сухое охмеление) важнее совпадение эфирного букета.
                </div>

                <div className="space-y-3">
                  {Object.entries(HOP_ALTERNATIVES_MAP)
                    .filter(([hopKey, alts]) =>
                      hopKey.toLowerCase().includes(guideSearch.toLowerCase()) ||
                      alts.some(a => a.name.toLowerCase().includes(guideSearch.toLowerCase()))
                    )
                    .map(([hopKey, alts]) => (
                      <div
                        key={hopKey}
                        className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/70 border border-stone-200/80 dark:border-stone-700 space-y-2"
                      >
                        <div className="font-extrabold text-sm text-stone-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                          <span className="text-emerald-600 dark:text-emerald-400">Хмель {hopKey}:</span>
                          <span className="text-xs font-normal text-stone-500">альтернативы для замены</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {alts.map((alt, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700 text-xs space-y-1"
                            >
                              <div className="flex justify-between items-center">
                                <b className="text-stone-900 dark:text-white font-bold">{alt.name}</b>
                                <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono font-bold text-[10px]">
                                  {alt.similarity}% сходство
                                </span>
                              </div>
                              <div className="text-[11px] text-stone-500 font-mono">
                                Альфа-кислота: {alt.alphaRange}
                              </div>
                              <div className="text-[11px] text-stone-600 dark:text-stone-300">
                                {alt.flavorProfile}
                              </div>
                              <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium pt-0.5">
                                {alt.conversionNote}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex justify-end">
              <button
                onClick={() => setSubstitutionsGuideOpen(false)}
                className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-stone-700 dark:hover:bg-stone-600 text-white text-xs font-bold transition-colors"
              >
                Закрыть справочник
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
