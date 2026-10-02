import React, { useState } from 'react';
import { BrewLog, Recipe } from '../types/brewing';
import {
  ClipboardList,
  Plus,
  Trash2,
  Edit3,
  Award,
  Calendar,
  CheckCircle2,
  FileText,
  Star,
  Activity
} from 'lucide-react';

interface Props {
  logs: BrewLog[];
  recipes: Recipe[];
  onUpdateLogs: (logs: BrewLog[]) => void;
}

export const BrewLogJournal: React.FC<Props> = ({ logs, recipes, onUpdateLogs }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);

  // Форма записи
  const [recipeId, setRecipeId] = useState(recipes[0]?.id || '');
  const [batchNumber, setBatchNumber] = useState(`Варка #${logs.length + 1}`);
  const [brewDate, setBrewDate] = useState(new Date().toISOString().split('T')[0]);
  const [actualOg, setActualOg] = useState<number>(1.052);
  const [actualFg, setActualFg] = useState<number>(1.011);
  const [mashPh, setMashPh] = useState<number>(5.3);
  const [fermentTempC, setFermentTempC] = useState<number>(20);
  const [aromaScore, setAromaScore] = useState<number>(10);
  const [appearanceScore, setAppearanceScore] = useState<number>(3);
  const [flavorScore, setFlavorScore] = useState<number>(17);
  const [mouthfeelScore, setMouthfeelScore] = useState<number>(4);
  const [overallScore, setOverallScore] = useState<number>(8);
  const [notes, setNotes] = useState('');
  const [aromaNotes, setAromaNotes] = useState('');
  const [flavorNotes, setFlavorNotes] = useState('');

  const totalBjcpScore = aromaScore + appearanceScore + flavorScore + mouthfeelScore + overallScore;
  const actualAbv = Number(((actualOg - actualFg) * 131.25).toFixed(1));

  const handleOpenNew = () => {
    setEditingLogId(null);
    const r = recipes[0];
    if (r) {
      setRecipeId(r.id);
      setActualOg(r.calculated.ogSg);
      setActualFg(r.calculated.fgSg);
    }
    setBatchNumber(`Варка #${logs.length + 1}`);
    setBrewDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setAromaNotes('');
    setFlavorNotes('');
    setModalOpen(true);
  };

  const handleSaveLog = (e: React.FormEvent) => {
    e.preventDefault();
    const recipe = recipes.find(r => r.id === recipeId);
    const rName = recipe ? recipe.name : 'Кастомная варка';

    const newLog: BrewLog = {
      id: editingLogId || `log_${Date.now()}`,
      recipeId,
      recipeName: rName,
      batchNumber,
      brewDate,
      targetOg: recipe?.calculated.ogSg || 1.050,
      targetFg: recipe?.calculated.fgSg || 1.010,
      targetAbv: recipe?.calculated.abv || 5.0,
      actualOg,
      actualFg,
      actualAbv,
      actualEfficiency: recipe?.efficiencyPercent || 72,
      mashPh,
      fermentTempC,
      bjcpScore: totalBjcpScore,
      tastingNotes: {
        aroma: aromaNotes || 'Цитрусовый, чистый',
        appearance: 'Стойкая белая пена, золотистый цвет',
        flavor: flavorNotes || 'Приятная мягкая горечь, свежий солод',
        mouthfeel: 'Среднее тело, умеренная карбонизация',
        overall: 'Отличный питкий результат'
      },
      notes,
      status: 'ready'
    };

    if (editingLogId) {
      onUpdateLogs(logs.map(l => (l.id === editingLogId ? newLog : l)));
    } else {
      onUpdateLogs([newLog, ...logs]);
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    onUpdateLogs(logs.filter(l => l.id !== id));
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Шапка журнала варок */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 sm:p-6 shadow-sm border border-stone-200/80 dark:border-stone-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-amber-500" />
              <span>Журнал варок & Личные заметки ({logs.length})</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Фиксация фактических замеров ареометра (OG, FG, ABV, pH) и дегустационные оценки по шкале BJCP
            </p>
          </div>

          <button
            onClick={handleOpenNew}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-amber-500/20 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Добавить запись о варке</span>
          </button>
        </div>
      </div>

      {/* Список записей */}
      {logs.length === 0 ? (
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-12 text-center border border-dashed border-stone-300 dark:border-stone-800 space-y-3">
          <FileText className="w-12 h-12 text-stone-400 mx-auto" />
          <h3 className="font-bold text-base text-stone-800 dark:text-stone-200">
            Журнал варок пока пуст
          </h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Записывайте параметры каждой варки: фактическую плотность, температуру брожения и дегустационные впечатления, чтобы совершенствовать свои рецепты!
          </p>
          <button
            onClick={handleOpenNew}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Сделать первую запись</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {logs.map(log => {
            return (
              <div
                key={log.id}
                className="bg-white dark:bg-stone-900 rounded-2xl p-5 border border-stone-200/90 dark:border-stone-800 shadow-xs space-y-4 hover:border-amber-400 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 uppercase">
                        {log.batchNumber}
                      </span>
                      <h3 className="text-lg font-black text-stone-900 dark:text-white mt-1 leading-tight">
                        {log.recipeName}
                      </h3>
                      <div className="text-xs text-stone-400 flex items-center gap-2 mt-0.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(log.brewDate).toLocaleDateString('ru-RU')}</span>
                      </div>
                    </div>

                    {/* Оценка BJCP */}
                    {log.bjcpScore !== undefined && (
                      <div className="text-right">
                        <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                          {log.bjcpScore}
                          <span className="text-xs text-stone-400 font-normal">/50</span>
                        </div>
                        <div className="text-[10px] text-stone-400 uppercase font-semibold">Оценка BJCP</div>
                      </div>
                    )}
                  </div>

                  {/* Сравнение План vs Факт */}
                  <div className="grid grid-cols-3 gap-2 my-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-stone-400 font-sans block">НП (OG) факт</span>
                      <b className="text-stone-900 dark:text-white">{log.actualOg.toFixed(3)}</b>
                      <span className="text-[10px] text-stone-500 font-sans block">план: {log.targetOg.toFixed(3)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 font-sans block">КП (FG) факт</span>
                      <b className="text-stone-900 dark:text-white">{log.actualFg.toFixed(3)}</b>
                      <span className="text-[10px] text-stone-500 font-sans block">план: {log.targetFg.toFixed(3)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 font-sans block">Алкоголь ABV</span>
                      <b className="text-amber-600 dark:text-amber-400">{log.actualAbv}%</b>
                      <span className="text-[10px] text-stone-500 font-sans block">pH: {log.mashPh || '5.3'}</span>
                    </div>
                  </div>

                  {/* Дегустационные заметки */}
                  {log.tastingNotes && (
                    <div className="space-y-1 text-xs">
                      {log.tastingNotes.aroma && (
                        <div className="text-stone-600 dark:text-stone-300">
                          <b>Аромат:</b> {log.tastingNotes.aroma}
                        </div>
                      )}
                      {log.tastingNotes.flavor && (
                        <div className="text-stone-600 dark:text-stone-300">
                          <b>Вкус:</b> {log.tastingNotes.flavor}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Заметки пивовара */}
                  {log.notes && (
                    <p className="mt-2 p-2.5 rounded-lg bg-amber-50/50 dark:bg-stone-800/40 text-stone-600 dark:text-stone-400 text-xs italic">
                      «{log.notes}»
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex justify-end gap-2">
                  <button
                    onClick={() => handleDelete(log.id)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 transition-colors"
                    title="Удалить запись"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Модальное окно добавления/редактирования записи */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveLog}
            className="bg-white dark:bg-stone-900 rounded-2xl p-6 max-w-lg w-full shadow-xl border border-stone-200 dark:border-stone-800 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center border-b border-stone-100 dark:border-stone-800 pb-3">
              <h3 className="font-bold text-base text-stone-900 dark:text-white flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-amber-500" />
                <span>Запись о процессе варки и дегустации</span>
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-stone-500 block mb-1 font-semibold">Рецепт:</label>
                  <select
                    value={recipeId}
                    onChange={(e) => setRecipeId(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 font-bold"
                  >
                    {recipes.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-stone-500 block mb-1 font-semibold">Номер партии:</label>
                  <input
                    type="text"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-stone-500 block mb-1 font-semibold">Дата варки:</label>
                <input
                  type="date"
                  value={brewDate}
                  onChange={(e) => setBrewDate(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 font-mono font-bold"
                />
              </div>

              {/* Замеры ареометра */}
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-2">
                <div className="font-bold text-stone-800 dark:text-stone-200 uppercase text-[10px]">
                  Фактические замеры:
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-stone-400 block mb-0.5">Фактическая НП (OG):</label>
                    <input
                      type="number"
                      step="0.001"
                      value={actualOg}
                      onChange={(e) => setActualOg(parseFloat(e.target.value) || 1.050)}
                      className="w-full bg-white dark:bg-stone-700 border border-stone-200 rounded px-2 py-1 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-stone-400 block mb-0.5">Фактическая КП (FG):</label>
                    <input
                      type="number"
                      step="0.001"
                      value={actualFg}
                      onChange={(e) => setActualFg(parseFloat(e.target.value) || 1.010)}
                      className="w-full bg-white dark:bg-stone-700 border border-stone-200 rounded px-2 py-1 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-stone-400 block mb-0.5">рН затора:</label>
                    <input
                      type="number"
                      step="0.1"
                      value={mashPh}
                      onChange={(e) => setMashPh(parseFloat(e.target.value) || 5.3)}
                      className="w-full bg-white dark:bg-stone-700 border border-stone-200 rounded px-2 py-1 font-mono font-bold"
                    />
                  </div>
                </div>
                <div className="text-[11px] text-amber-700 dark:text-amber-400 font-bold">
                  Рассчитанный фактический ABV: {actualAbv}%
                </div>
              </div>

              {/* Дегустационная оценка BJCP */}
              <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-2">
                <div className="flex justify-between items-center">
                  <div className="font-bold text-amber-900 dark:text-amber-200 text-xs">
                    Оценка дегустации (BJCP Score):
                  </div>
                  <div className="font-black text-amber-800 dark:text-amber-400 text-base">
                    {totalBjcpScore} / 50
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
                  <div>
                    <span className="text-stone-500 block">Аромат (12):</span>
                    <input
                      type="number"
                      min="0"
                      max="12"
                      value={aromaScore}
                      onChange={(e) => setAromaScore(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-white dark:bg-stone-700 border rounded px-1.5 py-0.5 font-bold font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-stone-500 block">Вид/пена (3):</span>
                    <input
                      type="number"
                      min="0"
                      max="3"
                      value={appearanceScore}
                      onChange={(e) => setAppearanceScore(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-white dark:bg-stone-700 border rounded px-1.5 py-0.5 font-bold font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-stone-500 block">Вкус (20):</span>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={flavorScore}
                      onChange={(e) => setFlavorScore(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-white dark:bg-stone-700 border rounded px-1.5 py-0.5 font-bold font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-stone-500 block">Тело (5):</span>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      value={mouthfeelScore}
                      onChange={(e) => setMouthfeelScore(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-white dark:bg-stone-700 border rounded px-1.5 py-0.5 font-bold font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-stone-500 block">Итог (10):</span>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={overallScore}
                      onChange={(e) => setOverallScore(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-white dark:bg-stone-700 border rounded px-1.5 py-0.5 font-bold font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-stone-500 block mb-1">Дегустационный профиль аромата и вкуса:</label>
                <input
                  type="text"
                  placeholder="напр. ноты сосны, маракуйи, карамельное послевкусие"
                  value={flavorNotes}
                  onChange={(e) => setFlavorNotes(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="text-stone-500 block mb-1">Заметки пивовара по процессу (что прошло гладко / ошибки):</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="напр. фильтрация шла быстро, промывочную воду держал строго 76°C..."
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs"
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
                Сохранить запись
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
