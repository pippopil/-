import React, { useState } from 'react';
import { FermentationBatch, Recipe } from '../types/brewing';
import {
  Calendar,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Thermometer,
  Beer,
  Trash2,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface Props {
  batches: FermentationBatch[];
  recipes: Recipe[];
  onUpdateBatches: (batches: FermentationBatch[]) => void;
  onOpenRecipe: (recipe: Recipe) => void;
}

export const BrewCalendar: React.FC<Props> = ({
  batches,
  recipes,
  onUpdateBatches,
  onOpenRecipe
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState(recipes[0]?.id || '');
  const [batchNumber, setBatchNumber] = useState(`Batch #${batches.length + 1}`);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  // Создание новой партии с автоматическим расчетом таймлайна выдержки
  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    const recipe = recipes.find(r => r.id === selectedRecipeId);
    if (!recipe) return;

    const isLager = recipe.yeast.type === 'lager';
    const isWheat = recipe.yeast.type === 'wheat';

    // Формирование этапов
    const stages = [
      {
        id: 'st_1',
        name: 'День варки (Brew Day)',
        description: 'Затирание солода, фильтрация, кипячение с хмелем, охлаждение и аэрация',
        dayOffset: 0,
        durationDays: 1,
        targetTempC: recipe.calculated.strikeTempC,
        isCompleted: true,
        actionRequired: 'Внести регидрированные дрожжи и установить гидрозатвор'
      },
      {
        id: 'st_2',
        name: 'Активное первичное брожение',
        description: 'Интенсивное выделение CO2, образование деки и сбраживание сахаров',
        dayOffset: 1,
        durationDays: isLager ? 12 : 7,
        targetTempC: recipe.yeast.tempRange[0],
        isCompleted: false,
        actionRequired: 'Контролировать стабильную температуру в помещении'
      },
      {
        id: 'st_3',
        name: recipe.hops.some(h => h.use === 'dry_hop') ? 'Сухое охмеление (Dry Hop)' : 'Диацетиловая пауза',
        description: recipe.hops.some(h => h.use === 'dry_hop')
          ? 'Внесение ароматического хмеля без доступа кислорода'
          : 'Повышение температуры на 2°C для расщепления дрожжами диацетила',
        dayOffset: isLager ? 13 : 8,
        durationDays: 3,
        targetTempC: recipe.yeast.tempRange[1],
        isCompleted: false,
        actionRequired: 'Проверить плотность ареометром/рефрактометром'
      },
      {
        id: 'st_4',
        name: 'Розлив и внесение праймера',
        description: `Слив с осадка, добавление ${recipe.calculated.dextroseGrams}г декстрозы, укупорка бутылок`,
        dayOffset: isLager ? 16 : 11,
        durationDays: 1,
        targetTempC: recipe.beerTempAtBottlingC,
        isCompleted: false,
        actionRequired: 'Тщательная дезинфекция бутылок и кроненпробок'
      },
      {
        id: 'st_5',
        name: 'Карбонизация в бутылках',
        description: 'Насыщение углекислотой при комнатной температуре',
        dayOffset: isLager ? 17 : 12,
        durationDays: 14,
        targetTempC: 21,
        isCompleted: false,
        actionRequired: 'Держать бутылки в темноте при 20-22°C'
      },
      {
        id: 'st_6',
        name: isLager ? 'Лагеризация в холоде' : 'Созревание (Conditioning)',
        description: 'Осаждение дрожжей, скругление вкуса и формирование пены',
        dayOffset: isLager ? 31 : 26,
        durationDays: isLager ? 28 : (isWheat ? 7 : 14),
        targetTempC: isLager ? 2 : 5,
        isCompleted: false,
        actionRequired: 'Перенести в погреб или холодильник (2-5°C)'
      },
      {
        id: 'st_7',
        name: 'Пик вкуса / Готово к дегустации!',
        description: 'Пиво полностью раскрыло букет, прозрачность и пенную шапку',
        dayOffset: isLager ? 59 : 40,
        durationDays: 0,
        targetTempC: 8,
        isCompleted: false,
        actionRequired: 'Охладить бокал и наслаждаться авторским крафтом!'
      }
    ];

    const newBatch: FermentationBatch = {
      id: `batch_${Date.now()}`,
      recipeId: recipe.id,
      recipeName: recipe.name,
      batchNumber,
      startDate,
      stages,
      notes: `Сварено по рецепту «${recipe.name}» (${recipe.style}). Расчетный ABV: ${recipe.calculated.abv}%.`,
      isFinished: false
    };

    onUpdateBatches([newBatch, ...batches]);
    setModalOpen(false);
  };

  const toggleStage = (batchId: string, stageId: string) => {
    onUpdateBatches(
      batches.map(b => {
        if (b.id !== batchId) return b;
        const updatedStages = b.stages.map(s =>
          s.id === stageId ? { ...s, isCompleted: !s.isCompleted } : s
        );
        const allCompleted = updatedStages.every(s => s.isCompleted);
        return { ...b, stages: updatedStages, isFinished: allCompleted };
      })
    );
  };

  const deleteBatch = (batchId: string) => {
    onUpdateBatches(batches.filter(b => b.id !== batchId));
  };

  // Расчет текущего дня варки от даты старта
  const getDaysSinceStart = (startDateStr: string) => {
    const start = new Date(startDateStr).getTime();
    const now = new Date().getTime();
    const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Шапка календаря */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 sm:p-6 shadow-sm border border-stone-200/80 dark:border-stone-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-6 h-6 text-amber-500" />
              <span>Календарь брожения & Сроки выдержки партий</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Автоматический трекер этапов: главное брожение, сухое охмеление, розлив с декстрозой, созревание и лагеризация
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-amber-500/20 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Начать новую партию</span>
          </button>
        </div>
      </div>

      {/* Список отслеживаемых партий */}
      {batches.length === 0 ? (
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-12 text-center border border-dashed border-stone-300 dark:border-stone-800 space-y-3">
          <Beer className="w-12 h-12 text-amber-400 mx-auto" />
          <h3 className="font-bold text-base text-stone-800 dark:text-stone-200">
            Нет активных варок в календаре
          </h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Выберите рецепт из базы и запустите новую партию. Календарь автоматически рассчитает дни сухого охмеления, розлива и готовности к дегустации!
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Запустить партию</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {batches.map(batch => {
            const daysSinceStart = getDaysSinceStart(batch.startDate);
            const recipe = recipes.find(r => r.id === batch.recipeId);

            return (
              <div
                key={batch.id}
                className="bg-white dark:bg-stone-900 rounded-2xl p-5 sm:p-6 border border-stone-200/90 dark:border-stone-800 shadow-sm space-y-5"
              >
                {/* Шапка партии */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 dark:border-stone-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center font-black text-sm">
                      {batch.batchNumber}
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-stone-900 dark:text-white flex items-center gap-2">
                        <span>{batch.recipeName}</span>
                        {batch.isFinished && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
                            Готово к дегустации!
                          </span>
                        )}
                      </h3>
                      <div className="text-xs text-stone-500 flex items-center gap-3 mt-0.5">
                        <span>Дата варки: <b>{new Date(batch.startDate).toLocaleDateString('ru-RU')}</b></span>
                        <span>•</span>
                        <span className="font-semibold text-amber-600 dark:text-amber-400">
                          Идет <b>{daysSinceStart}-й день</b>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {recipe && (
                      <button
                        onClick={() => onOpenRecipe(recipe)}
                        className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold"
                      >
                        Рецепт
                      </button>
                    )}
                    <button
                      onClick={() => deleteBatch(batch.id)}
                      className="p-1.5 rounded-xl text-stone-400 hover:text-red-500 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                      title="Удалить партию"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Интерактивный таймлайн этапов */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                    График созревания и контрольные точки:
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {batch.stages.map((stage, idx) => {
                      const isCurrent =
                        daysSinceStart >= stage.dayOffset &&
                        (idx === batch.stages.length - 1 || daysSinceStart < batch.stages[idx + 1].dayOffset);

                      return (
                        <div
                          key={stage.id}
                          className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                            stage.isCompleted
                              ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/80'
                              : isCurrent
                              ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-400 dark:border-amber-700 shadow-xs'
                              : 'bg-stone-50 dark:bg-stone-800/50 border-stone-200/80 dark:border-stone-700/60'
                          }`}
                        >
                          <div>
                            <div className="flex justify-between items-start gap-1">
                              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                isCurrent
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300'
                              }`}>
                                День {stage.dayOffset}
                              </span>

                              <button
                                onClick={() => toggleStage(batch.id, stage.id)}
                                className={`text-xs p-1 rounded-md transition-colors ${
                                  stage.isCompleted
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-stone-300 hover:text-emerald-500'
                                }`}
                                title={stage.isCompleted ? 'Отметить как не завершено' : 'Отметить этап выполненным'}
                              >
                                <CheckCircle2 className={`w-5 h-5 ${stage.isCompleted ? 'fill-emerald-100 dark:fill-emerald-950' : ''}`} />
                              </button>
                            </div>

                            <div className="font-bold text-xs text-stone-900 dark:text-white mt-2 leading-tight">
                              {stage.name}
                            </div>
                            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 line-clamp-2">
                              {stage.description}
                            </p>
                          </div>

                          <div className="mt-3 pt-2 border-t border-stone-200/60 dark:border-stone-700/50 flex justify-between items-center text-[10px]">
                            <span className="font-mono text-stone-600 dark:text-stone-300 flex items-center gap-1">
                              <Thermometer className="w-3 h-3 text-red-500" />
                              {stage.targetTempC}°C
                            </span>
                            <span className="text-amber-700 dark:text-amber-400 font-semibold line-clamp-1">
                              {stage.actionRequired}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Модальное окно создания партии */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateBatch}
            className="bg-white dark:bg-stone-900 rounded-2xl p-6 max-w-md w-full shadow-xl border border-stone-200 dark:border-stone-800 space-y-4"
          >
            <div className="flex justify-between items-center border-b border-stone-100 dark:border-stone-800 pb-3">
              <h3 className="font-bold text-base text-stone-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-600" />
                <span>Запуск новой партии в календарь</span>
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-stone-500 block mb-1 font-semibold">Выберите рецепт из базы:</label>
                <select
                  value={selectedRecipeId}
                  onChange={(e) => setSelectedRecipeId(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 font-bold"
                >
                  {recipes.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.style}) — {r.calculated.abv}% ABV
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-stone-500 block mb-1 font-semibold">Номер или название партии:</label>
                <input
                  type="text"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 font-bold"
                  placeholder="напр. Партия #12 (Citra IPA)"
                />
              </div>

              <div>
                <label className="text-stone-500 block mb-1 font-semibold">Дата варки (Brew Day):</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 font-mono font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-semibold"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm"
              >
                Создать график выдержки
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
