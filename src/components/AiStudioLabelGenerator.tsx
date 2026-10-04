import React, { useState, useEffect, useRef } from 'react';
import { LabelDesign, Recipe } from '../types/brewing';
import { ebcToHex } from '../utils/brewingMath';
import {
  TokenSavingSettings,
  TokenUsageStats,
  DEFAULT_TOKEN_SAVING_SETTINGS
} from '../types/aiSettings';
import {
  loadTokenSettings,
  saveTokenSettings,
  loadTokenStats,
  recordTokenUsage,
  getAiCache,
  setAiCache
} from '../utils/aiTokenManager';
import { AiTokenSettingsModal } from './AiTokenSettingsModal';
import {
  Sparkles,
  Download,
  Check,
  RefreshCw,
  Palette,
  Type,
  Beer,
  Award,
  Utensils,
  Thermometer,
  GlassWater,
  Sliders,
  Zap,
  TrendingDown,
  Database
} from 'lucide-react';

interface Props {
  recipe: Recipe;
  onUpdateRecipe: (updated: Recipe) => void;
}

export const AiStudioLabelGenerator: React.FC<Props> = ({ recipe, onUpdateRecipe }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [aiNames, setAiNames] = useState<string[]>([]);
  const [aiSlogan, setAiSlogan] = useState<string>('');
  const [aiStory, setAiStory] = useState<string>('');
  const [aiTip, setAiTip] = useState<string>('');
  const [aiAudit, setAiAudit] = useState<any>(null);

  // Настройки расхода токенов и статистика
  const [tokenSettings, setTokenSettings] = useState<TokenSavingSettings>(loadTokenSettings);
  const [tokenStats, setTokenStats] = useState<TokenUsageStats>(loadTokenStats);
  const [isTokenSettingsOpen, setIsTokenSettingsOpen] = useState(false);
  const [isCachedResult, setIsCachedResult] = useState(false);

  const updateTokenSettings = (newSettings: TokenSavingSettings) => {
    setTokenSettings(newSettings);
    saveTokenSettings(newSettings);
  };

  // Локальное состояние дизайна этикетки
  const [labelState, setLabelState] = useState<LabelDesign>(() => {
    return (
      recipe.labelDesign || {
        title: recipe.name,
        subtitle: recipe.style,
        style: recipe.style,
        breweryName: 'Домашняя Пивоварня',
        abv: recipe.calculated.abv,
        ibu: recipe.calculated.ibu,
        volumeText: `${recipe.batchSizeL > 0 ? (recipe.batchSizeL <= 25 ? '0.5 L' : '1.0 L') : '0.5 L'}`,
        bottledDate: `${new Date().getFullYear()}`,
        themeStyle: 'craft_modern',
        palette: {
          background: '#18181b',
          text: '#fef08a',
          accent: '#eab308',
          border: '#ca8a04'
        },
        artworkType: 'hop',
        storyDescription: recipe.description
      }
    );
  });

  // Запуск ИИ генерации с учетом настроек экономии токенов и кэша
  const handleGenerateWithAi = async (forceNoCache = false) => {
    setIsLoading(true);
    setIsCachedResult(false);
    try {
      const cacheKey = `ai_gen_${recipe.style}_${recipe.calculated.ogSg}_${recipe.calculated.abv}_${recipe.calculated.ibu}_${recipe.name}_${tokenSettings.mode}_${tokenSettings.maxOutputTokens}`;

      // Если включено кэширование и ответ уже есть в кэше:
      if (!forceNoCache && tokenSettings.cacheResponses) {
        const cached = getAiCache<{ labelData: any; auditData: any }>(cacheKey);
        if (cached) {
          if (cached.labelData?.names?.length) {
            setAiNames(cached.labelData.names);
            setAiSlogan(cached.labelData.slogan || '');
            setAiStory(cached.labelData.story || '');
            setAiTip(cached.labelData.brewerTip || '');
            setLabelState(prev => ({
              ...prev,
              title: cached.labelData.names[0],
              subtitle: cached.labelData.slogan || prev.subtitle,
              themeStyle: cached.labelData.themeStyle || prev.themeStyle,
              palette: cached.labelData.palette || prev.palette,
              artworkType: cached.labelData.artworkType || prev.artworkType,
              storyDescription: cached.labelData.story || prev.storyDescription
            }));
          }
          if (cached.auditData) {
            setAiAudit(cached.auditData);
          }
          setIsCachedResult(true);
          const updatedStats = recordTokenUsage(undefined, tokenSettings.mode, true);
          setTokenStats(updatedStats);
          setIsLoading(false);
          return;
        }
      }

      // 1. Генерация названий и стиля с передачей настроек токенов
      const res = await fetch('/api/ai/generate-name-and-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          style: recipe.style,
          og: recipe.calculated.ogSg,
          abv: recipe.calculated.abv,
          ibu: recipe.calculated.ibu,
          colorEbc: recipe.calculated.ebc,
          hops: recipe.hops,
          grains: recipe.grains,
          currentName: recipe.name,
          tokenSettings
        })
      });

      const data = await res.json();
      if (data.names && data.names.length > 0) {
        setAiNames(data.names);
        setAiSlogan(data.slogan || '');
        setAiStory(data.story || '');
        setAiTip(data.brewerTip || '');

        setLabelState(prev => ({
          ...prev,
          title: data.names[0],
          subtitle: data.slogan || prev.subtitle,
          themeStyle: data.themeStyle || prev.themeStyle,
          palette: data.palette || prev.palette,
          artworkType: data.artworkType || prev.artworkType,
          storyDescription: data.story || prev.storyDescription
        }));
      }

      // 2. Экспертный аудит рецепта
      const auditRes = await fetch('/api/ai/audit-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipe,
          tokenSettings
        })
      });
      const auditData = await auditRes.json();
      if (auditData.audit) {
        setAiAudit(auditData.audit);
      }

      // Учет токенов
      const totalTokens = (data.usage?.totalTokenCount || 0) + (auditData.usage?.totalTokenCount || 0);
      const combinedUsage = {
        promptTokenCount: (data.usage?.promptTokenCount || 0) + (auditData.usage?.promptTokenCount || 0),
        candidatesTokenCount: (data.usage?.candidatesTokenCount || 0) + (auditData.usage?.candidatesTokenCount || 0),
        totalTokenCount: totalTokens
      };

      const updatedStats = recordTokenUsage(combinedUsage, tokenSettings.mode, false);
      setTokenStats(updatedStats);

      // Сохранение в локальный кэш
      if (tokenSettings.cacheResponses) {
        setAiCache(cacheKey, { labelData: data, auditData: auditData.audit });
      }
    } catch (err) {
      console.error('AI generation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Отрисовка этикетки на HTML5 Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 800;
    const height = 500;
    canvas.width = width;
    canvas.height = height;

    const { palette, title, subtitle, style, breweryName, abv, ibu, volumeText, bottledDate, artworkType, themeStyle } = labelState;

    // 1. Фон
    ctx.fillStyle = palette.background;
    ctx.fillRect(0, 0, width, height);

    // Фоновые паттерны в зависимости от стиля
    if (themeStyle === 'vintage_monastery') {
      ctx.strokeStyle = palette.border;
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Рамка
    ctx.strokeStyle = palette.border;
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, width - 40, height - 40);

    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(28, 28, width - 56, height - 56);

    // Угловые орнаменты
    const drawCorner = (x: number, y: number) => {
      ctx.fillStyle = palette.accent;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
    };
    drawCorner(28, 28);
    drawCorner(width - 28, 28);
    drawCorner(28, height - 28);
    drawCorner(width - 28, height - 28);

    // 3. Название пивоварни (верхний полукруг / текст)
    ctx.fillStyle = palette.accent;
    ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '4px';
    ctx.fillText(breweryName.toUpperCase(), width / 2, 70);

    // Разделительная линия
    ctx.strokeStyle = palette.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 120, 85);
    ctx.lineTo(width / 2 + 120, 85);
    ctx.stroke();

    // 4. Эмблема по центру (Иконка)
    ctx.fillStyle = palette.accent;
    ctx.beginPath();
    ctx.arc(width / 2, 145, 36, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fill();
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = '32px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let iconChar = '🍺';
    if (artworkType === 'hop') iconChar = '🌿';
    else if (artworkType === 'grain') iconChar = '🌾';
    else if (artworkType === 'barrel') iconChar = '🪵';
    else if (artworkType === 'crown') iconChar = '👑';
    else if (artworkType === 'mountain') iconChar = '🏔️';
    ctx.fillText(iconChar, width / 2, 145);

    // 5. Главное название пива
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = palette.text;
    ctx.font = 'bold 42px "Playfair Display", Georgia, serif';
    ctx.letterSpacing = '1px';
    ctx.fillText(title, width / 2, 235);

    // 6. Слоган или подзаголовок
    ctx.fillStyle = palette.accent;
    ctx.font = 'italic 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(subtitle, width / 2, 275);

    // 7. Стиль пива
    ctx.fillStyle = '#a1a1aa';
    ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
    ctx.letterSpacing = '2px';
    ctx.fillText(style.toUpperCase(), width / 2, 310);

    // Разделитель перед подвалом
    ctx.strokeStyle = palette.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, 345);
    ctx.lineTo(width - 60, 345);
    ctx.stroke();

    // 8. Подвал: ABV / IBU / Объем / Год
    ctx.font = 'bold 20px "JetBrains Mono", monospace';
    ctx.fillStyle = palette.text;
    ctx.textAlign = 'left';
    ctx.fillText(`${abv}% ABV`, 70, 395);

    ctx.font = 'bold 20px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${ibu} IBU`, width / 2, 395);

    ctx.textAlign = 'right';
    ctx.fillText(volumeText, width - 70, 395);

    // Подписи
    ctx.font = '10px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#71717a';
    ctx.textAlign = 'left';
    ctx.fillText('АЛКОГОЛЬ', 70, 415);

    ctx.textAlign = 'center';
    ctx.fillText('ГОРЕЧЬ', width / 2, 415);

    ctx.textAlign = 'right';
    ctx.fillText(`СВАРЕНО ${bottledDate}`, width - 70, 415);

    // Мелкий текст внизу
    ctx.font = '9px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#52525b';
    ctx.textAlign = 'center';
    ctx.fillText('ЖИВОЙ НЕФИЛЬТРОВАННЫЙ КРАФТ • СВАРЕНО С ДУШОЙ', width / 2, 455);
  }, [labelState]);

  // Скачивание этикетки в формате PNG
  const handleDownloadLabel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `Этикетка_${labelState.title.replace(/\s+/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Сохранение дизайна в рецепт
  const handleApplyToRecipe = () => {
    onUpdateRecipe({
      ...recipe,
      name: labelState.title || recipe.name,
      labelDesign: labelState
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Верхний баннер ИИ Лаборатории */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 rounded-3xl p-6 sm:p-8 text-white border border-stone-800 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Бесплатный ИИ-генератор крафтовых названий и дизайна этикетки</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              ИИ Лаборатория & Студия Этикеток
            </h2>
            <p className="text-xs sm:text-sm text-stone-300">
              Нейросеть Gemini анализирует ваш затор, сорта хмелей, стиль {recipe.style}, крепость {recipe.calculated.abv}% и горечь {recipe.calculated.ibu} IBU, создавая звучные названия, слоганы, историю для этикетки и рекомендации по подаче.
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
            <button
              onClick={() => handleGenerateWithAi(false)}
              disabled={isLoading}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all disabled:opacity-50 active:scale-98"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Генерация...' : 'Сгенерировать через ИИ'}</span>
            </button>

            {isCachedResult && (
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 font-bold">
                <Database className="w-3 h-3" />
                <span>Загружено из кэша (0 токенов)</span>
              </span>
            )}
          </div>
        </div>

        {/* Панель управления расходом токенов ИИ */}
        <div className="mt-5 pt-4 border-t border-stone-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-stone-400 font-semibold flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Режим экономии:</span>
            </span>

            {/* Быстрые переключатели режима */}
            <div className="flex bg-stone-850 rounded-xl p-0.5 border border-stone-700 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => updateTokenSettings({ ...tokenSettings, mode: 'eco' })}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                  tokenSettings.mode === 'eco'
                    ? 'bg-emerald-500 text-stone-950 font-black shadow-xs'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title="Flash-Lite: экономия 85% токенов"
              >
                <span>⚡ Эко (-85%)</span>
              </button>

              <button
                type="button"
                onClick={() => updateTokenSettings({ ...tokenSettings, mode: 'balanced' })}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                  tokenSettings.mode === 'balanced'
                    ? 'bg-amber-500 text-stone-950 font-black shadow-xs'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title="Стандартный Gemini Flash"
              >
                <span>⚖️ Баланс</span>
              </button>

              <button
                type="button"
                onClick={() => updateTokenSettings({ ...tokenSettings, mode: 'offline' })}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                  tokenSettings.mode === 'offline'
                    ? 'bg-teal-500 text-stone-950 font-black shadow-xs'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title="Офлайн: 0 токенов, генерация по шаблонам"
              >
                <span>🍃 0 токенов</span>
              </button>
            </div>

            <span className="text-[11px] text-stone-400 font-mono hidden md:inline">
              Лимит: {tokenSettings.maxOutputTokens} т.
            </span>

            <span className="text-[11px] text-emerald-400 font-mono font-bold hidden sm:inline">
              Сэкономлено: ~{tokenStats.totalTokensSavedEstimate.toLocaleString()} т.
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsTokenSettingsOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-200 hover:text-white border border-stone-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs active:scale-95"
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span>Настройки токенов</span>
          </button>
        </div>

        {/* Сгенерированные ИИ варианты названий */}
        {aiNames.length > 0 && (
          <div className="mt-6 pt-6 border-t border-stone-800/80 space-y-3">
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Варианты названий от ИИ (нажмите, чтобы выбрать):
            </div>
            <div className="flex flex-wrap gap-2">
              {aiNames.map((name, i) => (
                <button
                  key={i}
                  onClick={() => setLabelState(prev => ({ ...prev, title: name }))}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    labelState.title === name
                      ? 'bg-amber-500 text-stone-950 shadow-sm'
                      : 'bg-stone-800 hover:bg-stone-700 text-stone-200'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>

            {aiSlogan && (
              <div className="text-xs text-stone-300">
                <span className="text-amber-400 font-semibold">Слоган:</span> «{aiSlogan}»
              </div>
            )}
            {aiStory && (
              <div className="text-xs text-stone-400 italic">
                <span className="text-amber-400 font-semibold not-italic">Легенда:</span> {aiStory}
              </div>
            )}
            {aiTip && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
                💡 <b>Совет технолога:</b> {aiTip}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Экспертный аудит рецепта от ИИ */}
      {aiAudit && (
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 sm:p-6 shadow-sm border border-stone-200/80 dark:border-stone-800 space-y-4">
          <div className="border-b border-stone-100 dark:border-stone-800 pb-3 flex items-center justify-between">
            <h3 className="font-bold text-base text-stone-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>Экспертный аудит рецепта и гастрономия</span>
            </h3>
            <span className="text-xs text-stone-400">Стандарт BJCP</span>
          </div>

          <p className="text-xs text-stone-700 dark:text-stone-300 font-medium">
            {aiAudit.summary}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700/60 text-xs space-y-1">
              <div className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1">
                <Utensils className="w-3.5 h-3.5 text-amber-500" />
                <span>Гастрономические пары:</span>
              </div>
              <ul className="text-stone-600 dark:text-stone-400 list-disc list-inside">
                {aiAudit.foodPairings?.map((f: string, i: number) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700/60 text-xs space-y-1">
              <div className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-red-500" />
                <span>Температура подачи:</span>
              </div>
              <p className="text-stone-600 dark:text-stone-400 font-bold font-mono">
                {aiAudit.servingTemp || '8-10°C'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700/60 text-xs space-y-1">
              <div className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1">
                <GlassWater className="w-3.5 h-3.5 text-sky-500" />
                <span>Рекомендуемый бокал:</span>
              </div>
              <p className="text-stone-600 dark:text-stone-400 font-medium">
                {aiAudit.glassType || 'Пинта Nonic / Тюльпан'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Интерактивная дизайн-студия Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Панель настроек этикетки */}
        <div className="lg:col-span-5 bg-white dark:bg-stone-900 rounded-2xl p-5 shadow-sm border border-stone-200/80 dark:border-stone-800 space-y-4">
          <div className="border-b border-stone-100 dark:border-stone-800 pb-3">
            <h3 className="font-bold text-base text-stone-900 dark:text-white flex items-center gap-2">
              <Palette className="w-5 h-5 text-amber-500" />
              <span>Параметры этикетки</span>
            </h3>
            <p className="text-xs text-stone-500">Настройте текст, стиль и цвета для наклейки на бутылку</p>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-stone-500 dark:text-stone-400 block mb-1">Название пива</label>
              <input
                type="text"
                value={labelState.title}
                onChange={(e) => setLabelState(prev => ({ ...prev, title: e.target.value }))}
                className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-bold"
              />
            </div>

            <div>
              <label className="text-stone-500 dark:text-stone-400 block mb-1">Слоган / Подзаголовок</label>
              <input
                type="text"
                value={labelState.subtitle}
                onChange={(e) => setLabelState(prev => ({ ...prev, subtitle: e.target.value }))}
                className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-medium"
              />
            </div>

            <div>
              <label className="text-stone-500 dark:text-stone-400 block mb-1">Название вашей пивоварни</label>
              <input
                type="text"
                value={labelState.breweryName}
                onChange={(e) => setLabelState(prev => ({ ...prev, breweryName: e.target.value }))}
                className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-medium"
              />
            </div>

            {/* Стиль оформления */}
            <div>
              <label className="text-stone-500 dark:text-stone-400 block mb-1">Стиль дизайна</label>
              <select
                value={labelState.themeStyle}
                onChange={(e) => {
                  const style = e.target.value as any;
                  let pal = labelState.palette;
                  if (style === 'vintage_monastery') {
                    pal = { background: '#1c1917', text: '#fde047', accent: '#ca8a04', border: '#78350f' };
                  } else if (style === 'minimal_nordic') {
                    pal = { background: '#09090b', text: '#f4f4f5', accent: '#a1a1aa', border: '#3f3f46' };
                  } else if (style === 'botanical') {
                    pal = { background: '#142017', text: '#ecfdf5', accent: '#34d399', border: '#065f46' };
                  } else if (style === 'retro_arcade') {
                    pal = { background: '#1e1b4b', text: '#38bdf8', accent: '#f43f5e', border: '#818cf8' };
                  } else {
                    pal = { background: '#18181b', text: '#fef08a', accent: '#eab308', border: '#ca8a04' };
                  }
                  setLabelState(prev => ({ ...prev, themeStyle: style, palette: pal }));
                }}
                className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-semibold"
              >
                <option value="craft_modern">Craft Modern (Современный крафт)</option>
                <option value="vintage_monastery">Vintage Monastery (Траппистский / Аббатский)</option>
                <option value="minimal_nordic">Minimal Nordic (Скандинавский минимализм)</option>
                <option value="botanical">Botanical (Хмелевой / Ботанический)</option>
                <option value="retro_arcade">Retro Arcade (Киберпанк / Неон)</option>
              </select>
            </div>

            {/* Эмблема */}
            <div>
              <label className="text-stone-500 dark:text-stone-400 block mb-1">Центральная эмблема</label>
              <div className="flex gap-2">
                {[
                  { id: 'hop', label: '🌿 Хмель' },
                  { id: 'grain', label: '🌾 Колос' },
                  { id: 'barrel', label: '🪵 Бочка' },
                  { id: 'crown', label: '👑 Корона' },
                  { id: 'mountain', label: '🏔️ Горы' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setLabelState(prev => ({ ...prev, artworkType: item.id as any }))}
                    className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                      labelState.artworkType === item.id
                        ? 'bg-amber-100 border-amber-500 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
                        : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Выбор цветов */}
            <div className="grid grid-cols-4 gap-2 pt-1">
              <div>
                <label className="text-[10px] text-stone-400 block mb-1">Фон</label>
                <input
                  type="color"
                  value={labelState.palette.background}
                  onChange={(e) => setLabelState(prev => ({
                    ...prev,
                    palette: { ...prev.palette, background: e.target.value }
                  }))}
                  className="w-full h-8 rounded-lg cursor-pointer border border-stone-300 dark:border-stone-700 bg-transparent"
                />
              </div>
              <div>
                <label className="text-[10px] text-stone-400 block mb-1">Текст</label>
                <input
                  type="color"
                  value={labelState.palette.text}
                  onChange={(e) => setLabelState(prev => ({
                    ...prev,
                    palette: { ...prev.palette, text: e.target.value }
                  }))}
                  className="w-full h-8 rounded-lg cursor-pointer border border-stone-300 dark:border-stone-700 bg-transparent"
                />
              </div>
              <div>
                <label className="text-[10px] text-stone-400 block mb-1">Акцент</label>
                <input
                  type="color"
                  value={labelState.palette.accent}
                  onChange={(e) => setLabelState(prev => ({
                    ...prev,
                    palette: { ...prev.palette, accent: e.target.value }
                  }))}
                  className="w-full h-8 rounded-lg cursor-pointer border border-stone-300 dark:border-stone-700 bg-transparent"
                />
              </div>
              <div>
                <label className="text-[10px] text-stone-400 block mb-1">Рамка</label>
                <input
                  type="color"
                  value={labelState.palette.border}
                  onChange={(e) => setLabelState(prev => ({
                    ...prev,
                    palette: { ...prev.palette, border: e.target.value }
                  }))}
                  className="w-full h-8 rounded-lg cursor-pointer border border-stone-300 dark:border-stone-700 bg-transparent"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex gap-2">
              <button
                onClick={handleApplyToRecipe}
                className="flex-1 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-stone-800 dark:hover:bg-stone-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Применить к рецепту</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Canvas превью этикетки и кнопка скачивания */}
        <div className="lg:col-span-7 bg-white dark:bg-stone-900 rounded-2xl p-5 shadow-sm border border-stone-200/80 dark:border-stone-800 flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-center border-b border-stone-100 dark:border-stone-800 pb-3">
            <div>
              <h3 className="font-bold text-base text-stone-900 dark:text-white">
                Живой просмотр этикетки (800 × 500 px)
              </h3>
              <p className="text-xs text-stone-500">Готово для печати на самоклеящейся бумаге для бутылок</p>
            </div>

            <button
              onClick={handleDownloadLabel}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Скачать PNG</span>
            </button>
          </div>

          <div className="flex items-center justify-center p-4 bg-stone-100 dark:bg-stone-950 rounded-2xl overflow-hidden shadow-inner">
            <canvas
              ref={canvasRef}
              className="w-full max-w-xl h-auto rounded-xl shadow-lg border border-stone-300 dark:border-stone-800"
            />
          </div>

          <div className="text-center text-xs text-stone-400">
            Формат идеально подходит для стандартных пивных бутылок 0.5 л и 0.33 л. Разрешение 300 DPI при печати 10×6 см.
          </div>
        </div>
      </div>

      {/* Модальное окно настроек экономии токенов ИИ */}
      <AiTokenSettingsModal
        isOpen={isTokenSettingsOpen}
        onClose={() => setIsTokenSettingsOpen(false)}
        settings={tokenSettings}
        onUpdateSettings={updateTokenSettings}
        stats={tokenStats}
        onRefreshStats={() => setTokenStats(loadTokenStats())}
      />
    </div>
  );
};
