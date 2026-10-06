import React, { useState, useEffect, useRef } from 'react';
import { LabelDesign, Recipe } from '../types/brewing';
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
import { generateRecipeBeerIdentity } from '../services/beerAiService';
import { AiTokenSettingsModal } from './AiTokenSettingsModal';
import {
  Sparkles,
  Download,
  Check,
  RefreshCw,
  Palette,
  Award,
  Utensils,
  Thermometer,
  GlassWater,
  Sliders,
  Zap,
  TrendingDown,
  Database,
  Image as ImageIcon,
  Copy,
  Printer,
  CheckCircle2,
  AlertCircle,
  Upload,
  Cpu
} from 'lucide-react';

interface Props {
  recipe: Recipe;
  onUpdateRecipe: (updated: Recipe) => void;
}

export const AiStudioLabelGenerator: React.FC<Props> = ({ recipe, onUpdateRecipe }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [aiNames, setAiNames] = useState<string[]>([]);
  const [aiSlogan, setAiSlogan] = useState<string>('');
  const [aiStory, setAiStory] = useState<string>('');
  const [aiTip, setAiTip] = useState<string>('');
  const [aiAudit, setAiAudit] = useState<any>(null);
  const [imagePromptRu, setImagePromptRu] = useState<string>('');
  const [promptCopied, setPromptCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Настройки расхода токенов и статистика
  const [tokenSettings, setTokenSettings] = useState<TokenSavingSettings>(loadTokenSettings);
  const [tokenStats, setTokenStats] = useState<TokenUsageStats>(loadTokenStats);
  const [isTokenSettingsOpen, setIsTokenSettingsOpen] = useState(false);
  const [isCachedResult, setIsCachedResult] = useState(false);
  const [customImageElement, setCustomImageElement] = useState<HTMLImageElement | null>(null);

  const updateTokenSettings = (newSettings: TokenSavingSettings) => {
    setTokenSettings(newSettings);
    saveTokenSettings(newSettings);
  };

  // Локальное состояние дизайна этикетки
  const [labelState, setLabelState] = useState<LabelDesign>(() => {
    return (
      recipe.labelDesign || {
        title: recipe.name || 'Крафтовый Эль',
        subtitle: recipe.style || 'Авторское пивоварение',
        style: recipe.style || 'Craft Beer',
        breweryName: 'Домашняя Пивоварня',
        abv: recipe.calculated?.abv || 5.0,
        ibu: recipe.calculated?.ibu || 30,
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

  // Загрузка сохраненного кастомного изображения, если оно есть
  useEffect(() => {
    if (labelState.customImageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => setCustomImageElement(img);
      img.src = labelState.customImageUrl;
    }
  }, [labelState.customImageUrl]);

  // Запуск ИИ генерации с поддержкой работы БЕЗ VPN
  const handleGenerateWithAi = async (forceNoCache = false) => {
    setIsLoading(true);
    setIsCachedResult(false);
    setStatusMessage('');

    try {
      const cacheKey = `ai_gen_${recipe.style}_${recipe.calculated?.ogSg}_${recipe.calculated?.abv}_${recipe.calculated?.ibu}_${recipe.name}_${tokenSettings.provider}_${tokenSettings.mode}_${tokenSettings.maxOutputTokens}`;

      // Если включено кэширование и ответ уже есть в кэше:
      if (!forceNoCache && tokenSettings.cacheResponses) {
        const cached = getAiCache<{ labelData: any; auditData: any; promptRu: string }>(cacheKey);
        if (cached?.labelData?.names?.length) {
          setAiNames(cached.labelData.names);
          setAiSlogan(cached.labelData.slogan || '');
          setAiStory(cached.labelData.story || '');
          setAiTip(cached.labelData.brewerTip || '');
          setImagePromptRu(cached.promptRu || '');
          setLabelState(prev => ({
            ...prev,
            title: cached.labelData.names[0],
            subtitle: cached.labelData.slogan || prev.subtitle,
            themeStyle: cached.labelData.themeStyle || prev.themeStyle,
            palette: cached.labelData.palette || prev.palette,
            artworkType: cached.labelData.artworkType || prev.artworkType,
            storyDescription: cached.labelData.story || prev.storyDescription
          }));
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

      // Вызов универсального ИИ сервиса (работает без VPN)
      const res = await generateRecipeBeerIdentity(recipe, tokenSettings);

      if (res.names && res.names.length > 0) {
        setAiNames(res.names);
        setAiSlogan(res.slogan || '');
        setAiStory(res.story || '');
        setAiTip(res.brewerTip || '');
        if (res.imagePromptRu) setImagePromptRu(res.imagePromptRu);

        setLabelState(prev => ({
          ...prev,
          title: res.names[0],
          subtitle: res.slogan || prev.subtitle,
          themeStyle: res.themeStyle || prev.themeStyle,
          palette: res.palette || prev.palette,
          artworkType: (res.artworkType as any) || prev.artworkType,
          storyDescription: res.story || prev.storyDescription
        }));
      }

      if (res.audit) {
        setAiAudit(res.audit);
      }

      if (res.warning) {
        setStatusMessage(res.warning);
      } else {
        setStatusMessage(`Сгенерировано: ${res.providerUsed}`);
      }

      // Запись токенов
      const updatedStats = recordTokenUsage(res.usage, tokenSettings.mode, false);
      setTokenStats(updatedStats);

      // Сохранение в кэш
      if (tokenSettings.cacheResponses) {
        setAiCache(cacheKey, {
          labelData: res,
          auditData: res.audit,
          promptRu: res.imagePromptRu
        });
      }
    } catch (err: any) {
      console.error('AI generation fatal error:', err);
      setStatusMessage('Ошибка подключения к сети. Попробуйте еще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  // Отрисовка этикетки на HTML5 Canvas (800x500)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 800;
    const height = 500;
    canvas.width = width;
    canvas.height = height;

    const {
      palette,
      title,
      subtitle,
      style,
      breweryName,
      abv,
      ibu,
      volumeText,
      bottledDate,
      artworkType,
      themeStyle
    } = labelState;

    // 1. Фон
    ctx.fillStyle = palette.background;
    ctx.fillRect(0, 0, width, height);

    // Фоновые паттерны в зависимости от стиля
    if (themeStyle === 'vintage_monastery' || themeStyle === 'slavic_craft') {
      ctx.strokeStyle = palette.border;
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 35) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(0, 0, width, height);
    } else if (themeStyle === 'retro_arcade') {
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      for (let y = 0; y < height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }

    // 2. Рамки
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

    // 4. Эмблема по центру (Иконка или Кастомное ИИ изображение)
    if (customImageElement && artworkType === 'custom') {
      // Рисуем круглое или обрамленное фото
      ctx.save();
      ctx.beginPath();
      ctx.arc(width / 2, 150, 48, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(customImageElement, width / 2 - 48, 150 - 48, 96, 96);
      ctx.restore();

      // Ободок вокруг арта
      ctx.strokeStyle = palette.accent;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(width / 2, 150, 50, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // Векторная эмблема
      ctx.beginPath();
      ctx.arc(width / 2, 145, 38, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fill();
      ctx.strokeStyle = palette.accent;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = '34px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      let iconChar = '🍺';
      if (artworkType === 'hop') iconChar = '🌿';
      else if (artworkType === 'grain') iconChar = '🌾';
      else if (artworkType === 'barrel') iconChar = '🪵';
      else if (artworkType === 'crown') iconChar = '👑';
      else if (artworkType === 'mountain') iconChar = '🏔️';
      else if (artworkType === 'shield') iconChar = '🛡️';
      else if (artworkType === 'bear') iconChar = '🐻';
      else if (artworkType === 'wolf') iconChar = '🐺';
      else if (artworkType === 'kettle') iconChar = '⚗️';
      else if (artworkType === 'mug') iconChar = '🍺';
      ctx.fillText(iconChar, width / 2, 145);
    }

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
    ctx.fillText((style || '').toUpperCase(), width / 2, 310);

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
  }, [labelState, customImageElement]);

  // Скачивание этикетки в формате PNG (300 DPI)
  const handleDownloadLabel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `Этикетка_${labelState.title.replace(/\s+/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Печать листа этикеток (A4 — 6 шт на лист)
  const handlePrintSheet = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');

    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert('Пожалуйста, разрешите всплывающие окна для печати этикеток');
      return;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Лист этикеток для печати - ${labelState.title}</title>
          <style>
            @page { size: A4 portrait; margin: 10mm; }
            body { font-family: sans-serif; margin: 0; padding: 0; background: white; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8mm; }
            .label-item { border: 1px dashed #ccc; padding: 2mm; text-align: center; page-break-inside: avoid; }
            img { width: 100%; height: auto; display: block; border-radius: 4px; }
            .info { font-size: 8px; color: #888; margin-top: 3px; }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="padding: 15px; background: #f3f4f6; text-align: center; border-bottom: 1px solid #ddd;">
            <button onclick="window.print()" style="padding: 10px 20px; font-weight: bold; background: #d97706; color: white; border: none; border-radius: 8px; cursor: pointer;">
              🖨️ Распечатать 6 этикеток на лист А4
            </button>
          </div>
          <div class="grid" style="margin-top: 10px;">
            ${Array(6).fill(0).map(() => `
              <div class="label-item">
                <img src="${dataUrl}" />
                <div class="info">Линия обреза • МастерВарка</div>
              </div>
            `).join('')}
          </div>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  // Загрузка своего изображения на этикетку
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        setCustomImageElement(img);
        setLabelState(prev => ({
          ...prev,
          artworkType: 'custom',
          customImageUrl: url
        }));
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
  };

  // Копирование промпта для Шедеврум / Kandinsky
  const handleCopyPrompt = () => {
    const prompt = imagePromptRu || `Высокодетализированная этикетка крафтового пива "${labelState.title}" стиль ${labelState.style}, винтажная гравюра, шишки хмеля, золото и темная медь, эмблема пивоварни 4k`;
    navigator.clipboard.writeText(prompt);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 2500);
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
      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 rounded-3xl p-5 sm:p-7 text-white border border-stone-800 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Работает без VPN: {tokenSettings.provider === 'gemini' ? 'Облако' : '100% ДА'}</span>
              </span>

              <span className="text-xs px-2.5 py-0.5 rounded-full bg-stone-800 text-stone-300 border border-stone-700 font-mono">
                {tokenSettings.provider === 'offline' && '🍃 Автономный движок'}
                {tokenSettings.provider === 'deepseek' && '🟣 DeepSeek AI'}
                {tokenSettings.provider === 'custom_openai' && '🌐 Свой API'}
                {tokenSettings.provider === 'gemini' && '🔵 Gemini Flash'}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              ИИ Генератор Названий & Студия Этикеток
            </h2>
            <p className="text-xs sm:text-sm text-stone-300">
              Создание звучных крафтовых названий, легенды вкуса и дизайна этикетки на основе стиля {recipe.style}, хмелей, цвета {recipe.calculated?.ebc || 12} EBC и горечи {recipe.calculated?.ibu || 30} IBU.
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2.5 shrink-0">
            <button
              onClick={() => handleGenerateWithAi(false)}
              disabled={isLoading}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all disabled:opacity-50 active:scale-98 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Генерация...' : 'Сгенерировать через ИИ'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsTokenSettingsOpen(true)}
              className="text-xs text-stone-400 hover:text-white flex items-center gap-1.5 transition-colors underline-offset-4 hover:underline"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>Сменить ИИ (DeepSeek / Автономный / Gemini)</span>
            </button>
          </div>
        </div>

        {/* Статус сообщение или уведомление */}
        {statusMessage && (
          <div className="mt-4 p-2.5 rounded-xl bg-stone-800/80 border border-stone-700 text-xs text-stone-300 flex items-center gap-2">
            <InfoIcon className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Сгенерированные ИИ варианты названий */}
        {aiNames.length > 0 && (
          <div className="mt-5 pt-5 border-t border-stone-800/80 space-y-3">
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Варианты названий от ИИ (нажмите, чтобы применить к этикетке):
            </div>
            <div className="flex flex-wrap gap-2">
              {aiNames.map((name, i) => (
                <button
                  key={i}
                  onClick={() => setLabelState(prev => ({ ...prev, title: name }))}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    labelState.title === name
                      ? 'bg-amber-500 text-stone-950 shadow-sm scale-102'
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
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 shadow-sm border border-stone-200/80 dark:border-stone-800 space-y-3.5">
          <div className="border-b border-stone-100 dark:border-stone-800 pb-2.5 flex items-center justify-between">
            <h3 className="font-bold text-sm sm:text-base text-stone-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>Экспертный аудит рецепта и гастрономия</span>
            </h3>
            <span className="text-xs text-stone-400">Стандарт BJCP</span>
          </div>

          <p className="text-xs text-stone-700 dark:text-stone-300 font-medium">
            {aiAudit.summary}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
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
          <div className="border-b border-stone-100 dark:border-stone-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-stone-900 dark:text-white flex items-center gap-2">
                <Palette className="w-5 h-5 text-amber-500" />
                <span>Параметры этикетки</span>
              </h3>
              <p className="text-xs text-stone-500">Настройте текст, логотип и цвета для наклейки на бутылку</p>
            </div>
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
                  } else if (style === 'slavic_craft') {
                    pal = { background: '#271b12', text: '#fed7aa', accent: '#d97706', border: '#92400e' };
                  } else {
                    pal = { background: '#18181b', text: '#fef08a', accent: '#eab308', border: '#ca8a04' };
                  }
                  setLabelState(prev => ({ ...prev, themeStyle: style, palette: pal }));
                }}
                className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-semibold"
              >
                <option value="craft_modern">Craft Modern (Современный крафт)</option>
                <option value="vintage_monastery">Vintage Monastery (Траппистский / Аббатский)</option>
                <option value="slavic_craft">Slavic Heritage (Славянский крафт)</option>
                <option value="minimal_nordic">Minimal Nordic (Скандинавский минимализм)</option>
                <option value="botanical">Botanical (Хмелевой / Ботанический)</option>
                <option value="retro_arcade">Retro Arcade (Киберпанк / Неон)</option>
              </select>
            </div>

            {/* Эмблема или Свое Изображение */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-stone-500 dark:text-stone-400">Центральная эмблема или ИИ-арт:</label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-bold"
                >
                  <Upload className="w-3 h-3" />
                  <span>Загрузить арт</span>
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { id: 'hop', label: '🌿 Хмель' },
                  { id: 'grain', label: '🌾 Колос' },
                  { id: 'barrel', label: '🪵 Бочка' },
                  { id: 'crown', label: '👑 Корона' },
                  { id: 'mountain', label: '🏔️ Горы' },
                  { id: 'shield', label: '🛡️ Щит' },
                  { id: 'bear', label: '🐻 Медведь' },
                  { id: 'wolf', label: '🐺 Волк' },
                  { id: 'kettle', label: '⚗️ Котёл' },
                  { id: 'mug', label: '🍺 Кружка' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setLabelState(prev => ({ ...prev, artworkType: item.id as any }))}
                    className={`py-1.5 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer ${
                      labelState.artworkType === item.id
                        ? 'bg-amber-100 border-amber-500 text-amber-900 dark:bg-amber-950 dark:text-amber-200 font-bold'
                        : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {customImageElement && (
                <div className="mt-2 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-center justify-between">
                  <span className="text-[11px] text-amber-900 dark:text-amber-200 font-bold">
                    Загружено пользовательское изображение
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomImageElement(null);
                      setLabelState(prev => ({ ...prev, artworkType: 'hop', customImageUrl: undefined }));
                    }}
                    className="text-[10px] text-red-600 hover:underline"
                  >
                    Удалить
                  </button>
                </div>
              )}
            </div>

            {/* Копирование промпта для Шедеврум / Kandinsky */}
            <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[11px] text-stone-800 dark:text-stone-200 flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5 text-purple-500" />
                  <span>ИИ-картинка (Шедеврум / Kandinsky)</span>
                </span>
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="px-2 py-0.5 rounded-md bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200 text-[10px] font-bold flex items-center gap-1 hover:bg-stone-300 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  <span>{promptCopied ? 'Скопировано!' : 'Скопировать промт'}</span>
                </button>
              </div>
              <p className="text-[10px] text-stone-500 dark:text-stone-400 leading-tight">
                Скопируйте готовый промпт на русском, сгенерируйте арт в Шедеврум / Kandinsky без VPN и загрузите на этикетку через кнопку «Загрузить арт»!
              </p>
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

            <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex gap-2">
              <button
                onClick={handleApplyToRecipe}
                className="flex-1 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-stone-800 dark:hover:bg-stone-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Применить к рецепту</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Canvas превью этикетки и кнопки экспорта */}
        <div className="lg:col-span-7 bg-white dark:bg-stone-900 rounded-2xl p-5 shadow-sm border border-stone-200/80 dark:border-stone-800 flex flex-col justify-between space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-stone-900 dark:text-white">
                Живой просмотр этикетки (800 × 500 px)
              </h3>
              <p className="text-xs text-stone-500">Готово для печати на самоклеящейся бумаге для пивных бутылок</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrintSheet}
                className="px-3 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                title="Печать 6 этикеток на лист А4"
              >
                <Printer className="w-3.5 h-3.5 text-stone-600 dark:text-stone-300" />
                <span className="hidden sm:inline">Лист А4</span>
              </button>

              <button
                onClick={handleDownloadLabel}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Скачать PNG</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center p-3 sm:p-5 bg-stone-100 dark:bg-stone-950 rounded-2xl overflow-hidden shadow-inner">
            <canvas
              ref={canvasRef}
              className="w-full max-w-xl h-auto rounded-xl shadow-lg border border-stone-300 dark:border-stone-800"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between text-[11px] text-stone-400 pt-1">
            <span>Стандарт для бутылок 0.5 л и 0.33 л (10 × 6.2 см при печати)</span>
            <span className="text-emerald-500 font-bold">Высокое качество 300 DPI</span>
          </div>
        </div>
      </div>

      {/* Модальное окно выбора ИИ и настроек */}
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

function InfoIcon(props: any) {
  return <AlertCircle {...props} />;
}
