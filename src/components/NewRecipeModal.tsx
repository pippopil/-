import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  Sparkles,
  Layers,
  Thermometer,
  Flame,
  X,
  Check,
  Search,
  Filter,
  Beer,
  ArrowRight,
  Info,
  Minus,
  Plus,
  Trash2
} from 'lucide-react';
import { Recipe } from '../types/brewing';
import { BJCP_STYLES, calculateBrewMetrics, ebcToHex } from '../utils/brewingMath';
import { COMMON_YEASTS } from '../data/defaultData';
import { MarqueeText } from './MarqueeText';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreateRecipe: (recipe: Recipe) => void;
  defaultBatchSizeL?: number;
}

export const NewRecipeModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onCreateRecipe,
  defaultBatchSizeL = 30
}) => {
  const [creationMode, setCreationMode] = useState<'blank' | 'style'>('blank');

  // Параметры для чистого рецепта с нуля (храним строкой для свободного ввода без блокировки)
  const [blankName, setBlankName] = useState('Мой новый рецепт');
  const [blankBatchSizeL, setBlankBatchSizeL] = useState<string>(String(defaultBatchSizeL || 30));
  const [blankEfficiency, setBlankEfficiency] = useState<string>('72');
  const [blankBoilTime, setBlankBoilTime] = useState<string>('60');
  const [blankStartWithEmpty, setBlankStartWithEmpty] = useState<boolean>(true);

  // Синхронизируем начальные значения при открытии окна
  useEffect(() => {
    if (isOpen) {
      setBlankBatchSizeL(String(defaultBatchSizeL || 30));
      setBlankEfficiency('72');
      setBlankBoilTime('60');
    }
  }, [isOpen, defaultBatchSizeL]);

  // Фильтры стилей BJCP
  const [styleSearch, setStyleSearch] = useState('');
  const [selectedFermentation, setSelectedFermentation] = useState<'all' | 'ale' | 'lager' | 'spontaneous'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStyleId, setSelectedStyleId] = useState<string>('american_pale_ale');

  const categories = useMemo(() => {
    return Array.from(new Set(BJCP_STYLES.map(s => s.category)));
  }, []);

  const filteredStyles = useMemo(() => {
    return BJCP_STYLES.filter(s => {
      const matchQuery =
        !styleSearch ||
        s.name.toLowerCase().includes(styleSearch.toLowerCase()) ||
        s.nameEn.toLowerCase().includes(styleSearch.toLowerCase()) ||
        s.description.toLowerCase().includes(styleSearch.toLowerCase()) ||
        s.category.toLowerCase().includes(styleSearch.toLowerCase());

      if (!matchQuery) return false;

      if (selectedFermentation !== 'all' && s.fermentationType !== selectedFermentation) {
        return false;
      }

      if (selectedCategory !== 'all' && s.category !== selectedCategory) {
        return false;
      }

      return true;
    });
  }, [styleSearch, selectedFermentation, selectedCategory]);

  const activeStyle = useMemo(() => {
    return BJCP_STYLES.find(s => s.id === selectedStyleId) || BJCP_STYLES[0];
  }, [selectedStyleId]);

  if (!isOpen) return null;

  // Создание чистого рецепта с нуля
  const handleCreateBlank = () => {
    const finalBatchSizeL = Math.max(1, Math.min(1000, parseFloat(blankBatchSizeL) || 30));
    const finalEfficiency = Math.max(40, Math.min(95, parseFloat(blankEfficiency) || 72));
    const finalBoilTime = Math.max(30, Math.min(180, parseInt(blankBoilTime, 10) || 60));

    const initialGrains = blankStartWithEmpty
      ? []
      : [
          {
            id: `grain_${Date.now()}_1`,
            name: 'Курский Пилснер (Pilsner Malt)',
            weightKg: Number(((finalBatchSizeL * 0.22)).toFixed(1)),
            potentialSg: 1.037,
            colorEbc: 3.8,
            type: 'base' as const
          }
        ];

    const initialHops = blankStartWithEmpty
      ? []
      : [
          {
            id: `hop_${Date.now()}_1`,
            name: 'Хмель на горечь (напр. Magnum / Tradition)',
            weightG: Math.max(5, Math.round(finalBatchSizeL * 1.0)),
            alphaAcid: 12.0,
            boilTimeMin: finalBoilTime,
            use: 'boil' as const
          }
        ];

    const initialMash = blankStartWithEmpty
      ? []
      : [
          {
            id: 'rest_1',
            name: 'Осахаривание (Универсальная пауза)',
            tempC: 66,
            timeMin: 60,
            type: 'maltose' as const
          },
          {
            id: 'rest_2',
            name: 'Мэшаут',
            tempC: 78,
            timeMin: 10,
            type: 'mashout' as const
          }
        ];

    const newRecipe: Recipe = {
      id: `recipe_custom_${Date.now()}`,
      name: blankName.trim() || 'Новый рецепт (с нуля)',
      style: 'Без стиля (Свободный рецепт)',
      category: 'Авторские рецепты',
      description: 'Чистый авторский шаблон, созданный пивоваром с нуля без ограничений BJCP.',
      author: 'Вы',
      batchSizeL: finalBatchSizeL,
      boilTimeMin: finalBoilTime,
      efficiencyPercent: finalEfficiency,
      grainRatioLPerKg: 3.5,
      grainTempC: 20,
      targetCarbonationVol: 2.4,
      beerTempAtBottlingC: 19,
      grains: initialGrains,
      hops: initialHops,
      mashSchedule: initialMash,
      yeast: {
        name: 'SafAle US-05',
        lab: 'Fermentis',
        form: 'dry',
        type: 'ale',
        cellsPerGramOrVial: 20,
        attenuationPercent: 80,
        tempRange: [18, 24],
        styleDescription: 'Универсальные элевые дрожжи с нейтральным чистым профилем'
      },
      calculated: {} as any,
      tags: ['Чистый шаблон', 'Свободный рецепт', 'Без ограничений BJCP'],
      isCustom: true,
      collection: 'my_recipes',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    newRecipe.calculated = calculateBrewMetrics({
      batchSizeL: newRecipe.batchSizeL,
      boilTimeMin: newRecipe.boilTimeMin,
      efficiencyPercent: newRecipe.efficiencyPercent,
      grainRatioLPerKg: newRecipe.grainRatioLPerKg,
      grainTempC: newRecipe.grainTempC,
      targetCarbonationVol: newRecipe.targetCarbonationVol,
      beerTempAtBottlingC: newRecipe.beerTempAtBottlingC,
      grains: newRecipe.grains,
      hops: newRecipe.hops,
      yeast: newRecipe.yeast
    });

    onCreateRecipe(newRecipe);
    onClose();
  };

  // Создание рецепта на основе выбранного стиля BJCP
  const handleCreateFromStyle = () => {
    if (!activeStyle) return;

    // Подбираем дрожжи в зависимости от типа брожения стиля
    let yeastChoice = COMMON_YEASTS[0]; // SafAle US-05
    if (activeStyle.fermentationType === 'lager') {
      const lagerYeast = COMMON_YEASTS.find(y => y.type === 'lager');
      if (lagerYeast) yeastChoice = lagerYeast;
    } else if (activeStyle.category.includes('Пшенич')) {
      const wheatYeast = COMMON_YEASTS.find(y => y.type === 'wheat');
      if (wheatYeast) yeastChoice = wheatYeast;
    } else if (activeStyle.category.includes('Бельгий')) {
      const belgianYeast = COMMON_YEASTS.find(y => y.type === 'belgian');
      if (belgianYeast) yeastChoice = belgianYeast;
    }

    // Рассчитываем ориентировочный базовый вес засыпи для целевой плотности стиля
    const finalBatchSizeL = Math.max(1, Math.min(1000, parseFloat(blankBatchSizeL) || 30));
    const finalEfficiency = Math.max(40, Math.min(95, parseFloat(blankEfficiency) || 72));

    const targetOg = (activeStyle.ogRange[0] + activeStyle.ogRange[1]) / 2;
    const targetPoints = (targetOg - 1.0) * 1000;
    const estGrainWeight = Math.max(4.5, Number(((targetPoints * finalBatchSizeL * 0.264172) / (37 * (finalEfficiency / 100) * 2.20462)).toFixed(1)));

    // Подбираем базовый Курский солод в соответствии со стилем
    let baseMaltName = 'Курский Пэйл Эль (Pale Ale Malt)';
    let baseColor = 6.0;
    let basePotential = 1.038;
    let baseType: 'base' | 'caramel' | 'roasted' | 'wheat' | 'adjunct' | 'acid' = 'base';

    if (activeStyle.fermentationType === 'lager' || activeStyle.name.includes('Пилснер')) {
      baseMaltName = 'Курский Пилснер (Pilsner Malt)';
      baseColor = 3.8;
      basePotential = 1.037;
    } else if (activeStyle.name.includes('Мюнхен') || activeStyle.name.includes('Дункель')) {
      baseMaltName = 'Курский Мюнхенский темный (Munich Typ 2, 25 EBC)';
      baseColor = 25.0;
      basePotential = 1.035;
    } else if (activeStyle.name.includes('Венский')) {
      baseMaltName = 'Курский Венский (Vienna Malt)';
      baseColor = 8.5;
      basePotential = 1.036;
    } else if (activeStyle.category.includes('Пшенич') || activeStyle.name.includes('Вайцен')) {
      baseMaltName = 'Курский Пшеничный светлый (Wheat Malt)';
      baseColor = 4.5;
      basePotential = 1.038;
      baseType = 'wheat';
    }

    const newRecipe: Recipe = {
      id: `recipe_bjcp_${activeStyle.id}_${Date.now()}`,
      name: `${activeStyle.name} (Шаблон)`,
      style: activeStyle.name,
      category: activeStyle.category,
      description: activeStyle.description,
      author: 'Вы (по стилю BJCP)',
      batchSizeL: finalBatchSizeL,
      boilTimeMin: activeStyle.fermentationType === 'lager' ? 75 : 60,
      efficiencyPercent: finalEfficiency,
      grainRatioLPerKg: 3.5,
      grainTempC: 20,
      targetCarbonationVol: activeStyle.category.includes('Пшенич') ? 2.8 : 2.4,
      beerTempAtBottlingC: activeStyle.fermentationType === 'lager' ? 12 : 19,
      grains: [
        {
          id: `grain_${Date.now()}_1`,
          name: baseMaltName,
          weightKg: estGrainWeight,
          potentialSg: basePotential,
          colorEbc: baseColor,
          type: baseType
        }
      ],
      hops: [
        {
          id: `hop_${Date.now()}_1`,
          name: activeStyle.fermentationType === 'lager' ? 'Saaz (Жатецкий)' : 'Magnum',
          weightG: activeStyle.fermentationType === 'lager' ? 30 : 20,
          alphaAcid: activeStyle.fermentationType === 'lager' ? 3.8 : 13.0,
          boilTimeMin: 60,
          use: 'boil'
        }
      ],
      mashSchedule: [
        {
          id: 'rest_1',
          name: activeStyle.fermentationType === 'lager' ? 'Мальтозная пауза' : 'Осахаривание',
          tempC: activeStyle.fermentationType === 'lager' ? 63 : 66,
          timeMin: activeStyle.fermentationType === 'lager' ? 45 : 60,
          type: 'maltose'
        },
        {
          id: 'rest_2',
          name: 'Мэшаут',
          tempC: 78,
          timeMin: 10,
          type: 'mashout'
        }
      ],
      yeast: yeastChoice,
      calculated: {} as any,
      tags: [activeStyle.category, activeStyle.fermentationType === 'lager' ? 'Низовое брожение' : 'Верховое брожение', 'BJCP'],
      isCustom: true,
      collection: 'my_recipes',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    newRecipe.calculated = calculateBrewMetrics({
      batchSizeL: newRecipe.batchSizeL,
      boilTimeMin: newRecipe.boilTimeMin,
      efficiencyPercent: newRecipe.efficiencyPercent,
      grainRatioLPerKg: newRecipe.grainRatioLPerKg,
      grainTempC: newRecipe.grainTempC,
      targetCarbonationVol: newRecipe.targetCarbonationVol,
      beerTempAtBottlingC: newRecipe.beerTempAtBottlingC,
      grains: newRecipe.grains,
      hops: newRecipe.hops,
      yeast: newRecipe.yeast
    });

    onCreateRecipe(newRecipe);
    onClose();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overscroll-contain animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[92dvh] bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl flex flex-col overflow-hidden relative"
      >
        {/* Шапка модального окна */}
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 bg-amber-500/5 dark:bg-amber-500/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-sm shadow-amber-500/30 shrink-0">
              <Beer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-stone-900 dark:text-white leading-tight">
                Создание Нового Рецепта
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Чистый шаблон для авторской варки или выбор из полного справочника стилей
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Выбор режима создания: Чистый шаблон VS По стилю BJCP */}
        <div className="flex border-b border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-800/40 p-1.5 gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setCreationMode('blank')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              creationMode === 'blank'
                ? 'bg-white dark:bg-stone-850 text-amber-600 dark:text-amber-400 shadow-xs border border-stone-200/80 dark:border-stone-700'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Чистый шаблон (с нуля)</span>
          </button>

          <button
            type="button"
            onClick={() => setCreationMode('style')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              creationMode === 'style'
                ? 'bg-white dark:bg-stone-850 text-amber-600 dark:text-amber-400 shadow-xs border border-stone-200/80 dark:border-stone-700'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Выбрать стиль (все стили BJCP)</span>
          </button>
        </div>

        {/* Тело модального окна */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* ============= РЕЖИМ 1: ЧИСТЫЙ ШАБЛОН ============= */}
          {creationMode === 'blank' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-950 dark:text-amber-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-900 dark:text-amber-300">
                  <Info className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Полный контроль над засыпью и охмелением</span>
                </div>
                <p className="text-[11px] text-stone-600 dark:text-stone-300">
                  Создается чистый лист без лишних коммерческих солодов и хмелей. Вы добавляете только те сорта, которые реально планируете использовать в варке.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    Название рецепта:
                  </label>
                  <input
                    type="text"
                    value={blankName}
                    onChange={(e) => setBlankName(e.target.value)}
                    placeholder="Например: Мой первый IPA, Сухой стаут на овсе..."
                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Объем варки */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                        Объем партии (л):
                      </label>
                      <span className="text-[11px] font-mono font-semibold text-amber-600 dark:text-amber-400">
                        {parseFloat(blankBatchSizeL) || 20} л
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const cur = parseFloat(blankBatchSizeL) || 20;
                          const step = cur > 15 ? 5 : 1;
                          setBlankBatchSizeL(String(Math.max(1, cur - step)));
                        }}
                        className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                        title="Уменьшить объем"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <div className="relative flex-1">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={blankBatchSizeL}
                          onChange={(e) => {
                            const raw = e.target.value.replace(',', '.');
                            if (raw === '' || /^[0-9]*\.?[0-9]*$/.test(raw)) {
                              setBlankBatchSizeL(raw);
                            }
                          }}
                          onBlur={() => {
                            const val = parseFloat(blankBatchSizeL);
                            if (isNaN(val) || val <= 0) {
                              setBlankBatchSizeL('20');
                            } else {
                              setBlankBatchSizeL(String(Math.min(1000, Math.max(1, Math.round(val * 10) / 10))));
                            }
                          }}
                          placeholder="20"
                          className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-2.5 py-1.5 text-center text-sm font-mono font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const cur = parseFloat(blankBatchSizeL) || 20;
                          const step = cur >= 15 ? 5 : 1;
                          setBlankBatchSizeL(String(Math.min(1000, cur + step)));
                        }}
                        className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                        title="Увеличить объем"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {[10, 15, 20, 25, 30, 50].map((vol) => (
                        <button
                          key={vol}
                          type="button"
                          onClick={() => setBlankBatchSizeL(String(vol))}
                          className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-semibold transition-all cursor-pointer ${
                            parseFloat(blankBatchSizeL) === vol
                              ? 'bg-amber-500 text-stone-950 font-bold shadow-2xs'
                              : 'bg-stone-100 dark:bg-stone-800/80 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                          }`}
                        >
                          {vol}л
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Эффективность */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                        Эффективность:
                      </label>
                      <span className="text-[11px] font-mono font-semibold text-amber-600 dark:text-amber-400">
                        {parseFloat(blankEfficiency) || 72}%
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const cur = parseFloat(blankEfficiency) || 72;
                          setBlankEfficiency(String(Math.max(40, cur - 1)));
                        }}
                        className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <div className="relative flex-1">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={blankEfficiency}
                          onChange={(e) => {
                            const raw = e.target.value.replace(',', '.');
                            if (raw === '' || /^[0-9]*\.?[0-9]*$/.test(raw)) {
                              setBlankEfficiency(raw);
                            }
                          }}
                          onBlur={() => {
                            const val = parseFloat(blankEfficiency);
                            if (isNaN(val) || val < 40) {
                              setBlankEfficiency('72');
                            } else {
                              setBlankEfficiency(String(Math.min(95, Math.max(40, Math.round(val)))));
                            }
                          }}
                          placeholder="72"
                          className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-2.5 py-1.5 text-center text-sm font-mono font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const cur = parseFloat(blankEfficiency) || 72;
                          setBlankEfficiency(String(Math.min(95, cur + 1)));
                        }}
                        className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {[65, 70, 72, 75, 80].map((eff) => (
                        <button
                          key={eff}
                          type="button"
                          onClick={() => setBlankEfficiency(String(eff))}
                          className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-semibold transition-all cursor-pointer ${
                            parseFloat(blankEfficiency) === eff
                              ? 'bg-amber-500 text-stone-950 font-bold shadow-2xs'
                              : 'bg-stone-100 dark:bg-stone-800/80 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                          }`}
                        >
                          {eff}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Кипячение */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                        Кипячение:
                      </label>
                      <span className="text-[11px] font-mono font-semibold text-amber-600 dark:text-amber-400">
                        {parseInt(blankBoilTime, 10) || 60} мин
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const cur = parseInt(blankBoilTime, 10) || 60;
                          setBlankBoilTime(String(Math.max(30, cur - 15)));
                        }}
                        className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <div className="relative flex-1">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={blankBoilTime}
                          onChange={(e) => {
                            const raw = e.target.value;
                            if (raw === '' || /^[0-9]*$/.test(raw)) {
                              setBlankBoilTime(raw);
                            }
                          }}
                          onBlur={() => {
                            const val = parseInt(blankBoilTime, 10);
                            if (isNaN(val) || val < 30) {
                              setBlankBoilTime('60');
                            } else {
                              setBlankBoilTime(String(Math.min(180, Math.max(30, val))));
                            }
                          }}
                          placeholder="60"
                          className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-2.5 py-1.5 text-center text-sm font-mono font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const cur = parseInt(blankBoilTime, 10) || 60;
                          setBlankBoilTime(String(Math.min(180, cur + 15)));
                        }}
                        className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {[30, 60, 75, 90].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setBlankBoilTime(String(mins))}
                          className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-semibold transition-all cursor-pointer ${
                            parseInt(blankBoilTime, 10) === mins
                              ? 'bg-amber-500 text-stone-950 font-bold shadow-2xs'
                              : 'bg-stone-100 dark:bg-stone-800/80 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                          }`}
                        >
                          {mins}м
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Выбор начального наполнения: пустой или базовый солод */}
                <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/80 dark:border-stone-700 space-y-2">
                  <div className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center justify-between">
                    <span>Стартовое наполнение рецепта:</span>
                    <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">Стили BJCP отключены</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setBlankStartWithEmpty(true)}
                      className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                        blankStartWithEmpty
                          ? 'bg-amber-500/15 border-amber-500 text-amber-950 dark:text-amber-200 shadow-2xs'
                          : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-amber-300'
                      }`}
                    >
                      <Trash2 className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                      <div>
                        <div className="font-bold text-stone-900 dark:text-white">Полностью чистый лист</div>
                        <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                          0 солода, 0 хмеля, 0 пауз — вводите только свои ингредиенты
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBlankStartWithEmpty(false)}
                      className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                        !blankStartWithEmpty
                          ? 'bg-amber-500/15 border-amber-500 text-amber-950 dark:text-amber-200 shadow-2xs'
                          : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-amber-300'
                      }`}
                    >
                      <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                      <div>
                        <div className="font-bold text-stone-900 dark:text-white">Базовый Курский шаблон</div>
                        <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                          Курский Пилснер и 1 хмель на горечь (можно удалить или заменить)
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCreateBlank}
                  className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Открыть чистый рецепт в калькуляторе</span>
                </button>
              </div>
            </div>
          )}

          {/* ============= РЕЖИМ 2: ВЫБОР СТИЛЯ BJCP ============= */}
          {creationMode === 'style' && (
            <div className="space-y-4">
              {/* Фильтры стилей: тип брожения + категория + поиск */}
              <div className="space-y-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={styleSearch}
                    onChange={(e) => setStyleSearch(e.target.value)}
                    placeholder="Поиск по стилю (напр. Портер, Пилснер, NEIPA, Вайцен, Стаут)..."
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  {styleSearch && (
                    <button
                      type="button"
                      onClick={() => setStyleSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Табы типа брожения */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-stone-400 text-[11px] mr-1">Брожение:</span>
                  {[
                    { id: 'all', label: 'Все' },
                    { id: 'ale', label: '🌿 Верхнее (Эли)' },
                    { id: 'lager', label: '❄️ Низовое (Лагеры)' },
                    { id: 'spontaneous', label: '🍇 Спонтанное / Дикое' }
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedFermentation(item.id as any)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        selectedFermentation === item.id
                          ? 'bg-amber-500 text-white shadow-2xs'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Фильтр категорий */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-stone-400 text-[11px] mr-1">Категория:</span>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-all ${
                      selectedCategory === 'all'
                        ? 'bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 font-bold'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    Все
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-all ${
                        selectedCategory === cat
                          ? 'bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 font-bold'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Список найденных стилей BJCP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                {filteredStyles.map(s => {
                  const isSelected = s.id === selectedStyleId;
                  const ebcAvg = (s.ebcRange[0] + s.ebcRange[1]) / 2;
                  const hexColor = ebcToHex(ebcAvg);

                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedStyleId(s.id)}
                      className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 shadow-xs ring-1 ring-amber-500'
                          : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800/60 hover:border-amber-300'
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-lg shrink-0 shadow-2xs border border-white/40 flex items-center justify-center mt-0.5"
                        style={{ backgroundColor: hexColor }}
                      >
                        <Beer className="w-3.5 h-3.5 text-white/90 drop-shadow-xs" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="font-extrabold text-xs text-stone-900 dark:text-white leading-tight truncate">
                          {s.name}
                        </div>
                        <div className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span>{s.category}</span>
                          <span>•</span>
                          <span className="font-mono">{s.abvRange[0]}–{s.abvRange[1]}%</span>
                          <span>•</span>
                          <span className="font-mono">{s.ibuRange[0]}–{s.ibuRange[1]} IBU</span>
                        </div>
                      </div>

                      {isSelected && (
                        <Check className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Карточка выбранного стиля с описанием и кнопкой создания */}
              {activeStyle && (
                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                        Выбранный стиль BJCP:
                      </div>
                      <div className="mt-0.5 max-w-full overflow-hidden">
                        <MarqueeText
                          text={activeStyle.name}
                          subtext={activeStyle.nameEn}
                          textClassName="text-sm font-black text-stone-900 dark:text-white"
                          maxLengthThreshold={25}
                          speedSec={15}
                        />
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 shrink-0">
                      {activeStyle.fermentationType === 'lager' ? 'Низовое (Лагер)' : 'Верховое (Эль)'}
                    </span>
                  </div>

                  <p className="text-xs text-stone-600 dark:text-stone-300">
                    {activeStyle.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-stone-700 dark:text-stone-300 pt-1">
                    <span className="px-2 py-0.5 rounded bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600">
                      НП: {activeStyle.ogRange[0].toFixed(3)}–{activeStyle.ogRange[1].toFixed(3)}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600">
                      ABV: {activeStyle.abvRange[0]}–{activeStyle.abvRange[1]}%
                    </span>
                    <span className="px-2 py-0.5 rounded bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600">
                      Горечь: {activeStyle.ibuRange[0]}–{activeStyle.ibuRange[1]} IBU
                    </span>
                    <span className="px-2 py-0.5 rounded bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600">
                      Цвет: {activeStyle.ebcRange[0]}–{activeStyle.ebcRange[1]} EBC
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-200 dark:border-stone-700">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400">Объем варки:</span>
                      <div className="flex items-center gap-1">
                        {[10, 15, 20, 25, 30, 50].map((vol) => (
                          <button
                            key={vol}
                            type="button"
                            onClick={() => setBlankBatchSizeL(String(vol))}
                            className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold transition-all cursor-pointer ${
                              parseFloat(blankBatchSizeL) === vol
                                ? 'bg-amber-500 text-stone-950 font-bold shadow-2xs'
                                : 'bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-amber-100'
                            }`}
                          >
                            {vol} л
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleCreateFromStyle}
                      className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Создать рецепт по стилю «{activeStyle.name}» ({parseFloat(blankBatchSizeL) || 20} л)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
