import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Globe,
  Search,
  Download,
  Link as LinkIcon,
  Sparkles,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Beer,
  FileCode,
  Flame,
  ArrowRight,
  X,
  Layers,
  HelpCircle,
  RefreshCw,
  Plus,
  Filter
} from 'lucide-react';
import { Recipe } from '../types/brewing';
import {
  ONLINE_RECIPES_CATALOG,
  OnlineRecipeItem,
  POPULAR_ONLINE_SOURCES,
  convertOnlineItemToRecipe
} from '../data/onlineRecipeDatabase';
import { importFromBeerXml } from '../utils/beerXml';
import { parseBirRfRecipe } from '../utils/birRfParser';
import { ebcToHex } from '../utils/brewingMath';
import { getKurskMaltSubstitute } from '../utils/brewingSubstitutions';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImportRecipe: (recipe: Recipe, openInCalculator?: boolean) => void;
}

export const OnlineRecipeHubModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onImportRecipe
}) => {
  // Активная вкладка в хабе: 'catalog' | 'url_loader' | 'guide'
  const [activeTab, setActiveTab] = useState<'catalog' | 'url_loader' | 'guide'>('catalog');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Сброс скролла на начало при открытии или переключении вкладок
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [activeTab, isOpen]);

  // Параметры поиска по онлайн-каталогу
  const [searchQuery, setSearchQuery] = useState('');
  const [fermentationFilter, setFermentationFilter] = useState<'all' | 'ale' | 'lager' | 'spontaneous'>('all');
  const [styleCategory, setStyleCategory] = useState<'all' | 'porter' | 'stout' | 'ale' | 'ipa' | 'lager' | 'wheat' | 'belgian' | 'sour'>('all');
  const [abvFilter, setAbvFilter] = useState<'all' | 'light' | 'standard' | 'strong'>('all');

  // Сетевой поиск рецептов через бэкенд
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [serverRecipes, setServerRecipes] = useState<OnlineRecipeItem[]>(ONLINE_RECIPES_CATALOG);
  const [isLoadedFromNetwork, setIsLoadedFromNetwork] = useState(false);

  // Загрузка по ссылке
  const [inputUrl, setInputUrl] = useState('');
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [urlSuccessRecipe, setUrlSuccessRecipe] = useState<Recipe | null>(null);

  // Ручная вставка XML/JSON
  const [rawText, setRawText] = useState('');
  const [showRawPaste, setShowRawPaste] = useState(false);

  // Выполнение сетевого запроса к интернет-базе по заданным параметрам
  const handleSearchOnlineByParams = async () => {
    setIsSearchingOnline(true);
    try {
      const minAbv = abvFilter === 'standard' ? 4.8 : abvFilter === 'strong' ? 6.5 : undefined;
      const maxAbv = abvFilter === 'light' ? 4.8 : abvFilter === 'standard' ? 6.5 : undefined;

      const res = await fetch('/api/recipes/search-online', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          fermentationType: fermentationFilter,
          styleCategory,
          minAbv,
          maxAbv
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.recipes)) {
          setServerRecipes(data.recipes);
          setIsLoadedFromNetwork(true);
        }
      }
    } catch (e) {
      console.warn('Network search fallback to local:', e);
    } finally {
      setIsSearchingOnline(false);
    }
  };

  // Автоматический поиск при изменении ключевых фильтров
  useEffect(() => {
    if (isOpen) {
      handleSearchOnlineByParams();
    }
  }, [isOpen, fermentationFilter, styleCategory, abvFilter]);

  // Фильтрация онлайн-рецептов (из сервера или резервного каталога)
  const filteredCatalog = useMemo(() => {
    return serverRecipes.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.style.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.breweryClone && item.breweryClone.toLowerCase().includes(q)) ||
        item.origin.toLowerCase().includes(q) ||
        item.grains.some(g => g.name.toLowerCase().includes(q)) ||
        item.hops.some(h => h.name.toLowerCase().includes(q)) ||
        item.tags.some(t => t.toLowerCase().includes(q));

      if (!matchQuery) return false;

      // Фильтр по типу брожения
      if (fermentationFilter !== 'all' && (item as any).fermentationType && (item as any).fermentationType !== fermentationFilter) {
        return false;
      }

      // Фильтр по стилю
      if (styleCategory !== 'all') {
        const s = item.style.toLowerCase();
        const c = item.category.toLowerCase();
        if (styleCategory === 'porter' && !s.includes('porter') && !c.includes('портер')) return false;
        if (styleCategory === 'stout' && !s.includes('stout') && !c.includes('стаут')) return false;
        if (styleCategory === 'ipa' && !s.includes('ipa')) return false;
        if (styleCategory === 'lager' && !s.includes('lager') && !s.includes('pils') && !c.includes('лагер')) return false;
        if (styleCategory === 'wheat' && !s.includes('weizen') && !s.includes('wheat') && !s.includes('witbier') && !c.includes('пшенич')) return false;
        if (styleCategory === 'sour' && !s.includes('gose') && !s.includes('sour') && !c.includes('кисл')) return false;
        if (styleCategory === 'belgian' && !c.includes('бельгийск') && !s.includes('tripel') && !s.includes('dubbel')) return false;
        if (styleCategory === 'ale' && (item as any).fermentationType && (item as any).fermentationType !== 'ale') return false;
      }

      return true;
    });
  }, [serverRecipes, searchQuery, fermentationFilter, styleCategory]);

  // Загрузка рецепта по URL через backend-прокси
  const handleFetchFromUrl = async (urlToFetch?: string) => {
    const targetUrl = (urlToFetch || inputUrl).trim();
    if (!targetUrl) {
      setUrlError('Пожалуйста, введите интернет-ссылку на рецепт (BeerXML или JSON)');
      return;
    }

    setIsLoadingUrl(true);
    setUrlError(null);
    setUrlSuccessRecipe(null);

    try {
      const response = await fetch('/api/recipes/fetch-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Не удалось загрузить данные по ссылке');
      }

      const content = data.content as string;

      // Попытка 1: Парсинг как BeerXML
      if (content.includes('<RECIPE') || content.includes('<RECIPES') || targetUrl.endsWith('.xml') || targetUrl.endsWith('.beerxml')) {
        const parsed = importFromBeerXml(content);
        if (parsed) {
          setUrlSuccessRecipe(parsed);
          setIsLoadingUrl(false);
          return;
        }
      }

      // Попытка 2: Парсинг как JSON
      try {
        const jsonData = JSON.parse(content);
        // Если это Brewfather JSON или стандартный рецепт
        const recipeData = jsonData.recipe || jsonData;
        if (recipeData.name && (recipeData.grains || recipeData.fermentables || recipeData.hops)) {
          // Создаем Recipe из JSON
          const imported: Recipe = {
            id: `json_imp_${Date.now()}`,
            name: recipeData.name || 'Импортированный рецепт',
            style: recipeData.style?.name || recipeData.style || 'Крафтовый стиль',
            category: recipeData.category || 'Крафт',
            description: recipeData.notes || recipeData.description || `Загружено из ${targetUrl}`,
            batchSizeL: parseFloat(recipeData.batchSizeL || recipeData.batch_size || '20'),
            boilTimeMin: parseInt(recipeData.boilTimeMin || recipeData.boil_time || '60', 10),
            efficiencyPercent: parseFloat(recipeData.efficiencyPercent || recipeData.efficiency || '72'),
            grainRatioLPerKg: 3.5,
            grainTempC: 20,
            targetCarbonationVol: 2.4,
            beerTempAtBottlingC: 20,
            grains: (recipeData.grains || recipeData.fermentables || []).map((g: any, idx: number) => ({
              id: `g_${idx}_${Date.now()}`,
              name: g.name || `Солод ${idx + 1}`,
              weightKg: parseFloat(g.weightKg || g.amount || '1'),
              potentialSg: parseFloat(g.potentialSg || '1.037'),
              colorEbc: parseFloat(g.colorEbc || g.color || '4'),
              type: g.type || 'base'
            })),
            hops: (recipeData.hops || []).map((h: any, idx: number) => ({
              id: `h_${idx}_${Date.now()}`,
              name: h.name || `Хмель ${idx + 1}`,
              weightG: parseFloat(h.weightG || (h.amount ? h.amount * 1000 : 20)),
              alphaAcid: parseFloat(h.alphaAcid || h.alpha || '8'),
              boilTimeMin: parseInt(h.boilTimeMin || h.time || '60', 10),
              use: h.use || 'boil'
            })),
            mashSchedule: [
              { id: 'm1', name: 'Осахаривание', tempC: 65, timeMin: 60, type: 'maltose' },
              { id: 'm2', name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout' }
            ],
            yeast: {
              name: recipeData.yeast?.name || 'US-05',
              lab: recipeData.yeast?.lab || 'Fermentis',
              form: 'dry',
              type: 'ale',
              cellsPerGramOrVial: 20,
              attenuationPercent: 78,
              tempRange: [18, 22]
            },
            calculated: {
              ogSg: 1.050,
              ogPlato: 12.4,
              fgSg: 1.011,
              fgPlato: 2.8,
              abv: 5.1,
              ibu: 35,
              srm: 6,
              ebc: 12,
              buGuRatio: 0.7,
              totalGrainWeightKg: 4.5,
              strikeWaterL: 15.7,
              spargeWaterL: 11.5,
              totalWaterL: 27.2,
              strikeTempC: 72,
              dryYeastGramsNeeded: 11.5,
              yeastPacksNeeded: 1,
              dextroseGrams: 140,
              sucroseGrams: 130,
              dmeGrams: 180,
              speiseMl: 1600,
              caloriesPer500ml: 215
            },
            tags: ['Интернет-импорт', 'JSON'],
            isCustom: true,
            collection: 'my_recipes',
            author: recipeData.author || 'Интернет-ресурс',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          setUrlSuccessRecipe(imported);
          setIsLoadingUrl(false);
          return;
        }
      } catch {
        // не JSON
      }

      // Попытка 3: Парсинг страниц Бир.РФ (xn--90aoy.xn--p1ai, бир.рф, беер.рф)
      if (
        targetUrl.includes('xn--90aoy') ||
        targetUrl.includes('бир.рф') ||
        targetUrl.includes('беер.рф') ||
        content.includes('Зерновые:</i>') ||
        content.includes('Бир.РФ') ||
        content.includes('Параметры затирания') ||
        content.includes('beer_recipes')
      ) {
        const parsedBir = parseBirRfRecipe(content, targetUrl);
        if (parsedBir) {
          setUrlSuccessRecipe(parsedBir);
          setIsLoadingUrl(false);
          return;
        }
      }

      // Если парсинг не удался напрямую
      throw new Error(
        'Файл по ссылке был успешно загружен, но его формат не распознан. Поддерживаются ссылки на BeerXML (.xml), JSON и рецепты с Бир.РФ (xn--90aoy.xn--p1ai/beer_recipes/...).'
      );
    } catch (err: any) {
      console.error(err);
      setUrlError(err.message || 'Ошибка сети при обращении к ресурсу');
    } finally {
      setIsLoadingUrl(false);
    }
  };

  // Парсинг вставленного текста напрямую
  const handleParseRawText = () => {
    if (!rawText.trim()) return;
    try {
      const parsed = importFromBeerXml(rawText);
      if (parsed) {
        setUrlSuccessRecipe(parsed);
        setUrlError(null);
      } else {
        setUrlError('Не удалось распознать формат BeerXML. Проверьте теги <RECIPE> и <RECIPES>.');
      }
    } catch (e: any) {
      setUrlError('Ошибка парсинга: ' + e.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overscroll-contain animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[92dvh] bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl flex flex-col overflow-hidden relative"
      >
        {/* Шапка модального окна */}
        <div className="p-4 sm:p-5 border-b border-stone-200/80 dark:border-stone-800 bg-amber-500/5 dark:bg-amber-500/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-sm shadow-amber-500/30 shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-stone-900 dark:text-white leading-tight">
                  Онлайн-поиск и Загрузка Рецептов
                </h2>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                  Интернет-хаб
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Поиск по открытой базе мировых сортов и прямая загрузка по ссылке с ресурсов
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

        {/* Навигационные табы в модалке */}
        <div className="flex items-center gap-1 px-4 sm:px-5 pt-3 border-b border-stone-200/70 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 shrink-0 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'catalog'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Онлайн-база крафтовых рецептов ({ONLINE_RECIPES_CATALOG.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('url_loader')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'url_loader'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            <span>Загрузка по ссылке из интернета</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'guide'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Ресурсы и Инструкция</span>
          </button>
        </div>

        {/* Тело модального окна со скроллом */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* =================== ВКЛАДКА 1: ОНЛАЙН-КАТАЛОГ =================== */}
          {activeTab === 'catalog' && (
            <div className="space-y-4">
              {/* Поиск и расширенные параметры */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSearchOnlineByParams();
                      }}
                      placeholder="Поиск (напр. Guinness, Атомная Прачечная, Портер, Пилснер, Cascade)..."
                      className="w-full pl-10 pr-8 py-2.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleSearchOnlineByParams}
                    disabled={isSearchingOnline}
                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-stone-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer shrink-0"
                  >
                    {isSearchingOnline ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Globe className="w-4 h-4" />
                    )}
                    <span>{isSearchingOnline ? 'Загрузка...' : 'Искать в сети'}</span>
                  </button>
                </div>

                {/* Фильтр 1: Тип брожения */}
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-stone-500 dark:text-stone-400">
                    Тип брожения:
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { id: 'all', label: 'Все типы' },
                      { id: 'ale', label: '🌿 Верхнее брожение (Эли, Портеры, Стауты)' },
                      { id: 'lager', label: '❄️ Низовое брожение (Лагеры, Пилснеры)' },
                      { id: 'spontaneous', label: '🍇 Спонтанное (Гозе, Сауэры)' }
                    ].map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setFermentationFilter(item.id as any)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          fermentationFilter === item.id
                            ? 'bg-amber-500 text-white shadow-2xs font-bold'
                            : 'bg-white dark:bg-stone-750 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Фильтр 2: Стиль / Категория */}
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-stone-500 dark:text-stone-400">
                    Стиль пива:
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { id: 'all', label: 'Все стили' },
                      { id: 'porter', label: '☕ Портеры' },
                      { id: 'stout', label: '🍫 Стауты' },
                      { id: 'ale', label: '🍺 Классический Эль' },
                      { id: 'ipa', label: '🌿 IPAs & Хмель' },
                      { id: 'lager', label: '❄️ Лагеры & Пилснеры' },
                      { id: 'wheat', label: '🌾 Пшеничное (Вайцен)' },
                      { id: 'belgian', label: '🇧🇪 Бельгийские эли' },
                      { id: 'sour', label: '🍋 Кислые эли / Гозе' }
                    ].map(st => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setStyleCategory(st.id as any)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                          styleCategory === st.id
                            ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold shadow-2xs'
                            : 'bg-white dark:bg-stone-750 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Фильтр 3: Крепость (ABV) */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-stone-200/60 dark:border-stone-700 text-xs">
                  <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">Крепость (ABV):</span>
                  {[
                    { id: 'all', label: 'Любая' },
                    { id: 'light', label: 'Легкое (< 4.8%)' },
                    { id: 'standard', label: 'Стандарт (4.8%–6.5%)' },
                    { id: 'strong', label: 'Крепкое (> 6.5%)' }
                  ].map(ab => (
                    <button
                      key={ab.id}
                      type="button"
                      onClick={() => setAbvFilter(ab.id as any)}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                        abvFilter === ab.id
                          ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 font-bold border border-amber-300 dark:border-amber-700'
                          : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                      }`}
                    >
                      {ab.label}
                    </button>
                  ))}

                  {/* Индикатор загрузки из сети */}
                  <div className="ml-auto text-[11px] text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <Globe className="w-3 h-3 text-emerald-600" />
                    <span>Связь с базой активна • Найдено: <b>{filteredCatalog.length}</b></span>
                  </div>
                </div>
              </div>

              {/* Список найденных рецептов */}
              <div className="space-y-3">
                {filteredCatalog.length === 0 ? (
                  <div className="p-8 text-center bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-dashed border-stone-200 dark:border-stone-700">
                    <Beer className="w-10 h-10 text-stone-300 dark:text-stone-600 mx-auto mb-2" />
                    <div className="font-bold text-sm text-stone-700 dark:text-stone-300">
                      По вашему запросу ничего не найдено
                    </div>
                    <p className="text-xs text-stone-500 mt-1">
                      Попробуйте изменить поисковый запрос или воспользуйтесь вкладкой «Загрузка по ссылке»
                    </p>
                  </div>
                ) : (
                  filteredCatalog.map(item => {
                    const tempRecipe = convertOnlineItemToRecipe(item);
                    const hexColor = ebcToHex(tempRecipe.calculated.ebc);

                    return (
                      <div
                        key={item.id}
                        className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-800/80 border border-stone-200/90 dark:border-stone-700 shadow-xs hover:border-amber-400 dark:hover:border-amber-500 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                      >
                        {/* Информация о рецепте */}
                        <div className="space-y-2 flex-1 min-w-0">
                          <div className="flex items-start gap-3">
                            <div
                              className="w-10 h-10 rounded-xl shadow-xs border border-white/40 flex items-center justify-center shrink-0 mt-0.5"
                              style={{ backgroundColor: hexColor }}
                              title={`Цвет: ${tempRecipe.calculated.ebc} EBC`}
                            >
                              <Beer className="w-5 h-5 text-white/90 drop-shadow" />
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-black text-sm sm:text-base text-stone-900 dark:text-white leading-tight">
                                  {item.name}
                                </h3>
                                {item.breweryClone && (
                                  <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                                    Клон: {item.breweryClone}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                                <span>{item.style}</span>
                                <span>•</span>
                                <span>{item.origin}</span>
                                <span>•</span>
                                <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                                  (item as any).fermentationType === 'lager'
                                    ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                                    : (item as any).fermentationType === 'spontaneous'
                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                }`}>
                                  {(item as any).fermentationType === 'lager'
                                    ? '❄️ Низовое брожение'
                                    : (item as any).fermentationType === 'spontaneous'
                                    ? '🍇 Спонтанное брожение'
                                    : '🌿 Верхнее брожение'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2">
                            {item.description}
                          </p>

                          {/* Ключевые показатели */}
                          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono">
                            <span className="px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold">
                              НП {tempRecipe.calculated.ogSg.toFixed(3)} ({tempRecipe.calculated.ogPlato}°P)
                            </span>
                            <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold">
                              ABV {tempRecipe.calculated.abv}%
                            </span>
                            <span className="px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold">
                              IBU {tempRecipe.calculated.ibu}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold">
                              {tempRecipe.calculated.ebc} EBC
                            </span>
                            <span className="text-stone-400 hidden sm:inline">
                              Засыпь: {tempRecipe.calculated.totalGrainWeightKg} кг ({item.grains.length} сортов)
                            </span>
                          </div>
                        </div>

                        {/* Действия */}
                        <div className="flex sm:flex-row lg:flex-col gap-2 shrink-0 pt-2 lg:pt-0 border-t sm:border-t-0 border-stone-100 dark:border-stone-700">
                          <button
                            type="button"
                            onClick={() => {
                              onImportRecipe(tempRecipe, true);
                              onClose();
                            }}
                            className="flex-1 lg:flex-none px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                            title="Открыть в калькуляторе и сразу начать настройку варки"
                          >
                            <Flame className="w-3.5 h-3.5" />
                            <span>В калькулятор</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              onImportRecipe(tempRecipe, false);
                            }}
                            className="flex-1 lg:flex-none px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-700 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            title="Добавить в вашу базу рецептов"
                          >
                            <Download className="w-3.5 h-3.5 text-stone-500 dark:text-stone-300" />
                            <span>Сохранить в базу</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* =================== ВКЛАДКА 2: ЗАГРУЗКА ПО ССЫЛКЕ ИЗ ИНТЕРНЕТА =================== */}
          {activeTab === 'url_loader' && (
            <div className="space-y-5">
              <div className="p-4 sm:p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-3">
                <div className="font-extrabold text-sm text-stone-900 dark:text-white flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-amber-500" />
                  <span>Прямая загрузка рецепта с любого сайта или ресурса</span>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  Вставьте прямую ссылку на любой рецепт с <b>Бир.РФ (xn--90aoy.xn--p1ai / бир.рф)</b> или файл в формате <b>BeerXML (.xml)</b> / <b>JSON</b>. Наш сервер и парсер автоматически загрузят состав засыпи, хмель, паузы затирания и рассчитают варку.
                </p>

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <input
                    type="url"
                    value={inputUrl}
                    onChange={(e) => {
                      setInputUrl(e.target.value);
                      setUrlError(null);
                    }}
                    placeholder="https://xn--90aoy.xn--p1ai/beer_recipes/... или ссылка на .xml/.json"
                    className="flex-1 px-3.5 py-2.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                  <button
                    type="button"
                    disabled={isLoadingUrl}
                    onClick={() => handleFetchFromUrl()}
                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
                  >
                    {isLoadingUrl ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Загрузка...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Скачать и импортировать</span>
                      </>
                    )}
                  </button>
                </div>

                {urlError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2 border border-rose-200 dark:border-rose-800">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>{urlError}</span>
                  </div>
                )}
              </div>

              {/* Успешно распознанный рецепт по ссылке */}
              {urlSuccessRecipe && (
                <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-extrabold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Рецепт успешно загружен и распознан из интернета!</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-stone-800 border border-emerald-200 dark:border-emerald-800 space-y-1">
                    <div className="font-extrabold text-stone-900 dark:text-white text-base">
                      {urlSuccessRecipe.name}
                    </div>
                    <div className="text-xs text-stone-500">
                      Стиль: {urlSuccessRecipe.style} | Объем: {urlSuccessRecipe.batchSizeL} л | Солодов: {urlSuccessRecipe.grains.length} | Хмелей: {urlSuccessRecipe.hops.length}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        onImportRecipe(urlSuccessRecipe, true);
                        onClose();
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Flame className="w-4 h-4" />
                      <span>Открыть в калькуляторе варки</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onImportRecipe(urlSuccessRecipe, false);
                        alert(`Рецепт «${urlSuccessRecipe.name}» успешно добавлен в вашу базу!`);
                      }}
                      className="px-4 py-2 rounded-xl bg-white dark:bg-stone-800 hover:bg-stone-100 text-stone-800 dark:text-stone-200 font-bold text-xs border border-stone-200 dark:border-stone-700 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Сохранить в мою базу</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Быстрые примеры для проверки */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-stone-600 dark:text-stone-400">
                  Попробуйте готовые примеры интернет-рецептов (1 клик):
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {POPULAR_ONLINE_SOURCES.flatMap(s => s.sampleUrls).map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setInputUrl(sample.url);
                        handleFetchFromUrl(sample.url);
                      }}
                      className="p-3 rounded-xl bg-stone-50 hover:bg-stone-100 dark:bg-stone-800/50 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 text-left transition-colors flex items-center justify-between group cursor-pointer"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-bold text-stone-800 dark:text-stone-200 truncate group-hover:text-amber-600">
                          {sample.title}
                        </div>
                        <div className="text-[10px] text-stone-400 font-mono truncate">
                          {sample.url}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-amber-500 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Вставка сырого текста BeerXML */}
              <div className="border-t border-stone-200 dark:border-stone-800 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRawPaste(!showRawPaste)}
                  className="text-xs font-bold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <FileCode className="w-4 h-4" />
                  <span>{showRawPaste ? 'Скрыть вставку текста' : 'Или вставить текст BeerXML / JSON вручную'}</span>
                </button>

                {showRawPaste && (
                  <div className="mt-3 space-y-2 animate-in fade-in duration-150">
                    <textarea
                      rows={5}
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                      placeholder="Вставьте содержимое файла <RECIPES><RECIPE>...</RECIPE></RECIPES>..."
                      className="w-full p-3 font-mono text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={handleParseRawText}
                      className="px-4 py-2 rounded-xl bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileCode className="w-4 h-4" />
                      <span>Распознать вставленный текст</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =================== ВКЛАДКА 3: РЕСУРСЫ И ИНСТРУКЦИЯ =================== */}
          {activeTab === 'guide' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-stone-700 dark:text-stone-300 space-y-2">
                <div className="font-extrabold text-sm text-stone-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Как работает интернет-поиск и где брать рецепты:</span>
                </div>
                <p>
                  В мировом сообществе пивоваров общепринятым стандартом обмена рецептами является формат <b>BeerXML</b>.
                  Любая программа (BeerSmith, Brewfather, Brewer's Friend, Grainfather) умеет экспортировать рецепты в один клик.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {POPULAR_ONLINE_SOURCES.map(source => (
                  <div
                    key={source.id}
                    className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-1">
                      <div className="font-extrabold text-sm text-stone-900 dark:text-white">
                        {source.name}
                      </div>
                      <p className="text-xs text-stone-500">
                        {source.description}
                      </p>
                    </div>

                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 text-stone-700 dark:text-stone-200 text-xs font-bold flex items-center justify-between hover:text-amber-600 transition-colors"
                    >
                      <span>Перейти на сайт</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
              </div>

              {/* Пошаговая инструкция */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-3">
                <div className="font-extrabold text-xs uppercase tracking-wider text-stone-500">
                  Пошаговая инструкция загрузки с Brewer's Friend / форумов:
                </div>
                <ol className="text-xs space-y-2 text-stone-600 dark:text-stone-400 list-decimal list-inside leading-relaxed">
                  <li>
                    Откройте понравившийся рецепт на <b>Brewer's Friend</b> или любом пивоваренном форуме.
                  </li>
                  <li>
                    Найдите кнопку <b>«Download BeerXML»</b> или <b>«BeerXML Export»</b>.
                  </li>
                  <li>
                    Скопируйте ссылку на этот файл (правый клик ➔ «Копировать адрес ссылки») или откройте и скопируйте текст.
                  </li>
                  <li>
                    В приложении <b>«МастерВарка»</b> откройте вкладку <i>«Загрузка по ссылке»</i> и вставьте URL.
                  </li>
                  <li>
                    Приложение мгновенно пересчитает плотность, горечь IBU, цветность и адаптирует рецепт под ваш объем партии (например, 20 или 30 литров)!
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
