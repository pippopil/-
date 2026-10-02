import React, { useState } from 'react';
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
  validateRecipeAgainstStyle
} from '../utils/brewingMath';
import { COMMON_GRAINS, COMMON_HOPS, COMMON_YEASTS } from '../data/defaultData';
import {
  Beer,
  Plus,
  Trash2,
  Scale,
  Sparkles,
  Calendar,
  Save,
  CheckCircle2,
  AlertTriangle,
  Info,
  Droplets,
  Flame,
  Thermometer,
  Layers,
  ArrowRight,
  Printer
} from 'lucide-react';

interface Props {
  recipe: Recipe;
  onUpdateRecipe: (updated: Recipe) => void;
  onSaveRecipe: (recipe: Recipe) => void;
  onSendToAiStudio: (recipe: Recipe) => void;
  onStartBrewBatch: (recipe: Recipe) => void;
  onPrintSheet: () => void;
}

export const RecipeBuilder: React.FC<Props> = ({
  recipe,
  onUpdateRecipe,
  onSaveRecipe,
  onSendToAiStudio,
  onStartBrewBatch,
  onPrintSheet
}) => {
  const [scaleModalOpen, setScaleModalOpen] = useState(false);
  const [targetScaleL, setTargetScaleL] = useState(recipe.batchSizeL);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // Пересчет показателей при любом изменении
  const updateParams = (fields: Partial<Recipe>) => {
    const nextRecipe = { ...recipe, ...fields };
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
      yeast: nextRecipe.yeast
    });
    onUpdateRecipe({
      ...nextRecipe,
      calculated,
      updatedAt: new Date().toISOString()
    });
  };

  const validation = validateRecipeAgainstStyle(recipe.calculated, recipe.style);

  // Добавление солода
  const addGrain = (template?: typeof COMMON_GRAINS[0]) => {
    const newGrain: GrainItem = template
      ? {
          id: `grain_${Date.now()}`,
          name: template.name,
          weightKg: 1.0,
          potentialSg: template.potentialSg,
          colorEbc: template.colorEbc,
          type: template.type
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
    if (recipe.grains.length <= 1) return;
    updateParams({ grains: recipe.grains.filter(g => g.id !== id) });
  };

  const updateGrain = (id: string, updates: Partial<GrainItem>) => {
    updateParams({
      grains: recipe.grains.map(g => (g.id === id ? { ...g, ...updates } : g))
    });
  };

  // Добавление хмеля
  const addHop = (template?: typeof COMMON_HOPS[0]) => {
    const newHop: HopItem = template
      ? {
          id: `hop_${Date.now()}`,
          name: template.name,
          weightG: 25,
          alphaAcid: template.alphaAcid,
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
    if (recipe.hops.length <= 1) return;
    updateParams({ hops: recipe.hops.filter(h => h.id !== id) });
  };

  const updateHop = (id: string, updates: Partial<HopItem>) => {
    updateParams({
      hops: recipe.hops.map(h => (h.id === id ? { ...h, ...updates } : h))
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

  const applyMashPreset = (preset: 'dry' | 'balanced' | 'full' | 'weizen' | 'step') => {
    let rests: MashRest[] = [];
    if (preset === 'dry') {
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
    updateParams({
      batchSizeL: targetScaleL,
      grains: scaledGrains,
      hops: scaledHops
    });
    setScaleModalOpen(false);
  };

  const handleSave = () => {
    onSaveRecipe(recipe);
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 3000);
  };

  const beerColorHex = ebcToHex(recipe.calculated.ebc);

  return (
    <div className="space-y-6 pb-12">
      {/* Верхняя карточка с базовыми параметрами и действиями */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 sm:p-6 shadow-sm border border-stone-200/80 dark:border-stone-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-5">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={recipe.name}
                onChange={(e) => updateParams({ name: e.target.value })}
                className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-transparent text-stone-900 dark:text-white border-b border-transparent hover:border-amber-400 focus:border-amber-500 focus:outline-none w-full"
                placeholder="Название рецепта..."
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-stone-500 dark:text-stone-400">Стиль BJCP:</span>
              <select
                value={recipe.style}
                onChange={(e) => {
                  const s = BJCP_STYLES.find(st => st.name === e.target.value || st.nameEn === e.target.value);
                  updateParams({
                    style: e.target.value,
                    category: s ? s.category : recipe.category
                  });
                }}
                className="bg-amber-50 dark:bg-stone-800 text-amber-900 dark:text-amber-300 font-semibold px-2.5 py-1 rounded-md border border-amber-200 dark:border-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                {BJCP_STYLES.map(s => (
                  <option key={s.id} value={s.name}>
                    {s.name} ({s.category})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Панель быстрых действий */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setScaleModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Пересчитать ингредиенты под другой объем варки"
            >
              <Scale className="w-4 h-4 text-amber-600" />
              <span>Масштабировать ({recipe.batchSizeL} л)</span>
            </button>

            <button
              onClick={() => onSendToAiStudio(recipe)}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-amber-500/20 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>ИИ Название & Этикетка</span>
            </button>

            <button
              onClick={() => onStartBrewBatch(recipe)}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Calendar className="w-4 h-4" />
              <span>Варка в календарь</span>
            </button>

            <button
              onClick={handleSave}
              className="px-3 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-stone-900 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Сохранить</span>
            </button>

            <button
              onClick={onPrintSheet}
              className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors"
              title="Печать варочного листа"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {saveSuccessNotice && (
          <div className="mt-3 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center gap-2 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Рецепт «{recipe.name}» успешно сохранен в вашу базу!</span>
          </div>
        )}

        {/* Настройки варочного порядка */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4">
          <div>
            <label className="text-[11px] font-medium text-stone-500 dark:text-stone-400 block mb-1">
              Объем варки (л)
            </label>
            <input
              type="number"
              min="1"
              max="1000"
              step="1"
              value={recipe.batchSizeL}
              onChange={(e) => updateParams({ batchSizeL: Math.max(1, parseFloat(e.target.value) || 20) })}
              className="w-full bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-stone-500 dark:text-stone-400 block mb-1">
              Эффективность (%)
            </label>
            <input
              type="number"
              min="40"
              max="95"
              step="1"
              value={recipe.efficiencyPercent}
              onChange={(e) => updateParams({ efficiencyPercent: Math.max(40, Math.min(95, parseFloat(e.target.value) || 72)) })}
              className="w-full bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-stone-500 dark:text-stone-400 block mb-1">
              Кипячение (мин)
            </label>
            <input
              type="number"
              min="30"
              max="180"
              step="5"
              value={recipe.boilTimeMin}
              onChange={(e) => updateParams({ boilTimeMin: Math.max(30, parseInt(e.target.value, 10) || 60) })}
              className="w-full bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-stone-500 dark:text-stone-400 block mb-1">
              Гидромодуль (л/кг)
            </label>
            <input
              type="number"
              min="2.0"
              max="6.0"
              step="0.1"
              value={recipe.grainRatioLPerKg}
              onChange={(e) => updateParams({ grainRatioLPerKg: Math.max(2, parseFloat(e.target.value) || 3.5) })}
              className="w-full bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-stone-500 dark:text-stone-400 block mb-1">
              Темп. зерна (°C)
            </label>
            <input
              type="number"
              min="0"
              max="35"
              step="1"
              value={recipe.grainTempC}
              onChange={(e) => updateParams({ grainTempC: parseFloat(e.target.value) || 20 })}
              className="w-full bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-stone-500 dark:text-stone-400 block mb-1">
              CO2 Карбонизация (vol)
            </label>
            <input
              type="number"
              min="1.0"
              max="4.5"
              step="0.1"
              value={recipe.targetCarbonationVol}
              onChange={(e) => updateParams({ targetCarbonationVol: Math.max(1, parseFloat(e.target.value) || 2.4) })}
              className="w-full bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

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

      {/* Валидатор сбалансированности по BJCP */}
      <div className={`p-4 rounded-2xl border transition-all ${
        validation.isCompliant
          ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
          : 'bg-amber-50/80 dark:bg-amber-950/25 border-amber-300 dark:border-amber-800/70'
      }`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-white dark:bg-stone-800 shadow-xs mt-0.5">
              {validation.isCompliant ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              )}
            </div>
            <div>
              <div className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
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
        </div>
      </div>

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

          <div className="flex items-center gap-2">
            <select
              onChange={(e) => {
                const found = COMMON_GRAINS.find(g => g.name === e.target.value);
                if (found) addGrain(found);
                e.target.value = '';
              }}
              defaultValue=""
              className="bg-amber-50 dark:bg-stone-800 text-amber-900 dark:text-amber-300 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-stone-700 focus:outline-none"
            >
              <option value="" disabled>+ Выбрать из каталога солодов...</option>
              {COMMON_GRAINS.map(g => (
                <option key={g.name} value={g.name}>
                  {g.name} ({g.colorEbc} EBC)
                </option>
              ))}
            </select>

            <button
              onClick={() => addGrain()}
              className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Свой солод</span>
            </button>
          </div>
        </div>

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
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400">
                <th className="py-2 px-1">Название</th>
                <th className="py-2 px-1">Тип</th>
                <th className="py-2 px-1 w-24">Вес (кг)</th>
                <th className="py-2 px-1 w-20">Доля (%)</th>
                <th className="py-2 px-1 w-24">Цвет (EBC)</th>
                <th className="py-2 px-1 w-24">Потенциал</th>
                <th className="py-2 px-1 w-10 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
              {recipe.grains.map((grain) => {
                const sharePercent = ((grain.weightKg / Math.max(0.1, recipe.calculated.totalGrainWeightKg)) * 100).toFixed(1);
                return (
                  <tr key={grain.id} className="hover:bg-amber-50/40 dark:hover:bg-stone-800/40 transition-colors">
                    <td className="py-2 px-1">
                      <input
                        type="text"
                        value={grain.name}
                        onChange={(e) => updateGrain(grain.id, { name: e.target.value })}
                        className="w-full font-medium bg-transparent text-stone-900 dark:text-stone-100 focus:outline-none focus:border-b focus:border-amber-500"
                      />
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
                        onClick={() => removeGrain(grain.id)}
                        disabled={recipe.grains.length <= 1}
                        className="p-1 text-stone-400 hover:text-red-600 disabled:opacity-30 transition-colors"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
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
              <div className="flex justify-between py-1 border-b border-stone-100 dark:border-stone-800">
                <span className="text-stone-500">Вода на затирание (Strike Water):</span>
                <span className="font-mono font-bold">{recipe.calculated.strikeWaterL} л</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100 dark:border-stone-800">
                <span className="text-stone-500">Промывочная вода (Sparge Water, до 78°C):</span>
                <span className="font-mono font-bold text-sky-600 dark:text-sky-400">{recipe.calculated.spargeWaterL} л</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100 dark:border-stone-800">
                <span className="text-stone-500">Общий расход воды:</span>
                <span className="font-mono font-bold text-stone-800 dark:text-stone-200">{recipe.calculated.totalWaterL} л</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-stone-500">Впитывание зерном:</span>
                <span className="font-mono text-stone-500">~{(recipe.calculated.totalGrainWeightKg * 0.96).toFixed(1)} л</span>
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
            </div>
          </div>

          <div className="space-y-2.5">
            {recipe.mashSchedule.map((rest, idx) => (
              <div
                key={rest.id || idx}
                className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/60"
              >
                <div className="w-6 h-6 rounded-full bg-amber-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={rest.name}
                    onChange={(e) => updateMashRest(rest.id, { name: e.target.value })}
                    className="font-medium text-xs bg-transparent text-stone-900 dark:text-stone-100 focus:outline-none"
                    placeholder="Название паузы..."
                  />
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-stone-400">Темп:</span>
                    <input
                      type="number"
                      min="35"
                      max="85"
                      step="1"
                      value={rest.tempC}
                      onChange={(e) => updateMashRest(rest.id, { tempC: parseFloat(e.target.value) || 65 })}
                      className="w-16 bg-white dark:bg-stone-700 border border-stone-300 dark:border-stone-600 rounded px-1.5 py-0.5 font-mono font-bold text-center"
                    />
                    <span className="text-stone-500 font-mono">°C</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-stone-400">Время:</span>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      step="5"
                      value={rest.timeMin}
                      onChange={(e) => updateMashRest(rest.id, { timeMin: parseInt(e.target.value, 10) || 15 })}
                      className="w-16 bg-white dark:bg-stone-700 border border-stone-300 dark:border-stone-600 rounded px-1.5 py-0.5 font-mono font-bold text-center"
                    />
                    <span className="text-stone-500 font-mono">мин</span>
                  </div>
                </div>
                <button
                  onClick={() => removeMashRest(rest.id)}
                  disabled={recipe.mashSchedule.length <= 1}
                  className="p-1 text-stone-400 hover:text-red-500 disabled:opacity-20"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

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

          <div className="flex items-center gap-2">
            <select
              onChange={(e) => {
                const found = COMMON_HOPS.find(h => h.name === e.target.value);
                if (found) addHop(found);
                e.target.value = '';
              }}
              defaultValue=""
              className="bg-amber-50 dark:bg-stone-800 text-amber-900 dark:text-amber-300 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-stone-700 focus:outline-none"
            >
              <option value="" disabled>+ Добавить из каталога хмелей...</option>
              {COMMON_HOPS.map(h => (
                <option key={h.name} value={h.name}>
                  {h.name} ({h.alphaAcid}% AA)
                </option>
              ))}
            </select>

            <button
              onClick={() => addHop()}
              className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Свой хмель</span>
            </button>
          </div>
        </div>

        {/* Таблица хмелей */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400">
                <th className="py-2 px-1">Хмель</th>
                <th className="py-2 px-1 w-24">Вес (г)</th>
                <th className="py-2 px-1 w-24">Альфа-к-та (%)</th>
                <th className="py-2 px-1 w-28">Время / Этап</th>
                <th className="py-2 px-1 w-28">Назначение</th>
                <th className="py-2 px-1">Примечания</th>
                <th className="py-2 px-1 w-10 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
              {recipe.hops.map((hop) => (
                <tr key={hop.id} className="hover:bg-amber-50/40 dark:hover:bg-stone-800/40 transition-colors">
                  <td className="py-2 px-1">
                    <input
                      type="text"
                      value={hop.name}
                      onChange={(e) => updateHop(hop.id, { name: e.target.value })}
                      className="w-full font-medium bg-transparent text-stone-900 dark:text-stone-100 focus:outline-none focus:border-b focus:border-amber-500"
                    />
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
                      onClick={() => removeHop(hop.id)}
                      disabled={recipe.hops.length <= 1}
                      className="p-1 text-stone-400 hover:text-red-600 disabled:opacity-30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
            <div className="flex gap-2">
              <select
                value={recipe.yeast.name}
                onChange={(e) => {
                  const y = COMMON_YEASTS.find(item => item.name === e.target.value);
                  if (y) updateParams({ yeast: y });
                }}
                className="flex-1 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2 text-xs font-semibold text-stone-900 dark:text-stone-100 focus:outline-none"
              >
                {COMMON_YEASTS.map(y => (
                  <option key={y.name} value={y.name}>
                    {y.name} ({y.lab}) — {y.styleDescription}
                  </option>
                ))}
              </select>
            </div>

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
            <div className="grid grid-cols-3 gap-2">
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
              <input
                type="number"
                min="5"
                max="1000"
                step="5"
                value={targetScaleL}
                onChange={(e) => setTargetScaleL(Math.max(1, parseFloat(e.target.value) || 20))}
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
    </div>
  );
};
