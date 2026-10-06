import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '15mb' }));

// CORS middleware для поддержки Android APK (Capacitor/localhost) и PWA
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Инициализация Google Gemini API
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  } catch (err) {
    console.error('Failed to init GoogleGenAI:', err);
  }
}

// Хранилище облачной синхронизации между устройствами
const cloudSyncStore = new Map<string, { data: any; updatedAt: string }>();

// Сообщество (посты)
let communityPosts: any[] = [];

// ======================== API ROUTES ========================

// 1. ИИ Генератор названия, истории и концепта этикетки
app.post('/api/ai/generate-name-and-label', async (req, res) => {
  try {
    const { style, og, abv, ibu, colorEbc, hops, grains, currentName, tokenSettings } = req.body;
    const mode = tokenSettings?.mode || 'eco';
    const isOffline = mode === 'offline' || !aiClient;
    const isEco = mode === 'eco';
    const maxTokens = Math.max(120, Math.min(Number(tokenSettings?.maxOutputTokens) || (isEco ? 260 : 400), 800));
    const disableThinking = tokenSettings?.disableThinking !== false;
    const compressPrompt = tokenSettings?.compressPrompt !== false;

    if (isOffline || !aiClient) {
      // Локальный генератор без вызова внешнего API (0 токенов)
      const fallbackThemes = [
        {
          names: [`Хмельной Горизонт ${style}`, `Янтарная Легенда`, `Крафтовый Прорыв`],
          slogan: 'Сварено с душой, проверено временем.',
          story: `Истинный образец стиля ${style}. Насыщенная засыпь солода с плотностью ${og} и благородная горчинка ${ibu} IBU создают идеальный баланс вкуса.`,
          themeStyle: 'craft_modern',
          palette: { background: '#1c1917', text: '#fef08a', accent: '#eab308', border: '#ca8a04' }
        },
        {
          names: [`Северная Звезда`, `Баварский Бархат`, `Алхимия Солода`],
          slogan: 'Чистый вкус натурального зерна и свежего хмеля.',
          story: `Авторская рецептура на стыке классических пивоваренных традиций и современного крафтового духа.`,
          themeStyle: 'vintage_monastery',
          palette: { background: '#09090b', text: '#f4f4f5', accent: '#d97706', border: '#78350f' }
        },
        {
          names: [`Хмельная Волна`, `Солодовый Вектор`, `Пивной Компас`],
          slogan: 'Честное домашнее пиво без компромиссов.',
          story: `Создано по выверенной крафтовой рецептуре с ярким профилем и чистым вкусом.`,
          themeStyle: 'minimal_nordic',
          palette: { background: '#0f172a', text: '#38bdf8', accent: '#0ea5e9', border: '#0369a1' }
        }
      ];
      const pick = fallbackThemes[Math.floor(Math.random() * fallbackThemes.length)];
      return res.json({
        success: true,
        names: pick.names,
        slogan: pick.slogan,
        story: pick.story,
        themeStyle: pick.themeStyle,
        palette: pick.palette,
        brewerTip: 'Используйте чиллер для быстрого охлаждения и следите за температурой главного брожения!',
        usage: { promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 },
        isOfflineMode: true
      });
    }

    const hopList = Array.isArray(hops) ? hops.map((h: any) => h.name).filter(Boolean).slice(0, 4).join(', ') : 'Крафтовые';
    const grainList = Array.isArray(grains) ? grains.map((g: any) => g.name).filter(Boolean).slice(0, 4).join(', ') : 'Ячменные';

    // Формируем сжатый или расширенный промпт в зависимости от настроек экономии
    const prompt = compressPrompt
      ? `Пиво: ${style}, OG:${og}, ABV:${abv}%, IBU:${ibu}, EBC:${colorEbc}. Хмель:${hopList}. Солод:${grainList}.${currentName ? ` Название:"${currentName}".` : ''}
Ответь ТОЛЬКО валидным JSON:
{"names":["Краткое 1","Краткое 2","Краткое 3"],"slogan":"Слоган до 6 слов","story":"Описание вкуса 1-2 предложения","themeStyle":"craft_modern"|"vintage_monastery"|"minimal_nordic"|"retro_arcade"|"botanical","palette":{"background":"#hex","text":"#hex","accent":"#hex","border":"#hex"},"artworkType":"hop"|"grain"|"barrel"|"crown"|"mountain","brewerTip":"Один краткий совет пивовара"}`
      : `Ты — креативный шеф-пивовар и дизайнер этикеток крафтовой пивоварни.
Параметры пива:
- Стиль: ${style}
- Начальная плотность: ${og}, Крепость: ${abv}%, Горечь: ${ibu} IBU, Цвет: ${colorEbc} EBC
- Хмели: ${hopList}
- Солода: ${grainList}
${currentName ? `- Текущее рабочее название: "${currentName}"` : ''}

Сгенерируй JSON со следующими полями:
{
  "names": ["Название 1", "Название 2", "Название 3"],
  "slogan": "Короткий звучный слоган (до 8 слов)",
  "story": "Легенда или описание вкуса (2 предложения на русском)",
  "themeStyle": "craft_modern" | "vintage_monastery" | "minimal_nordic" | "retro_arcade" | "botanical",
  "palette": { "background": "#hex", "text": "#hex", "accent": "#hex", "border": "#hex" },
  "artworkType": "hop" | "grain" | "barrel" | "crown" | "mountain",
  "brewerTip": "Ценный совет пивовара для этого стиля"
}`;

    // Модель: Flash-Lite для экономного режима, Flash для сбалансированного
    const selectedModel = isEco ? 'gemini-3.1-flash-lite' : 'gemini-3.8-flash';

    const response = await aiClient.models.generateContent({
      model: selectedModel,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        maxOutputTokens: maxTokens,
        thinkingConfig: disableThinking ? { thinkingBudget: 0 } : undefined
      }
    });

    const responseText = response.text?.trim() || '{}';
    const parsed = JSON.parse(responseText);
    res.json({
      success: true,
      ...parsed,
      usage: response.usageMetadata,
      modelUsed: selectedModel
    });
  } catch (error: any) {
    console.error('Gemini error:', error);
    res.json({
      success: true,
      names: ['Крафтовый Шторм', 'Золотой Затор', 'Мастерский Эль'],
      slogan: 'Создано для истинных ценителей вкуса.',
      story: 'Гармоничное сочетание отборных солодов и яркого хмеля для незабываемого послевкусия.',
      themeStyle: 'craft_modern',
      palette: { background: '#1c1917', text: '#fef08a', accent: '#eab308', border: '#ca8a04' },
      artworkType: 'hop',
      brewerTip: 'Держите стабильную температуру брожения в первые 72 часа.',
      usage: { promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 },
      isFallback: true
    });
  }
});

// 2. ИИ Экспертный аудит рецепта и гастрономические пары
app.post('/api/ai/audit-recipe', async (req, res) => {
  try {
    const { recipe, tokenSettings } = req.body;
    const mode = tokenSettings?.mode || 'eco';
    const isOffline = mode === 'offline' || !aiClient;
    const isEco = mode === 'eco';
    const maxTokens = Math.max(150, Math.min(Number(tokenSettings?.maxOutputTokens) || (isEco ? 280 : 420), 800));
    const disableThinking = tokenSettings?.disableThinking !== false;
    const compressPrompt = tokenSettings?.compressPrompt !== false;

    if (isOffline || !aiClient) {
      return res.json({
        success: true,
        audit: {
          summary: 'Рецепт составлен сбалансированно. Соотношение солодовой базы и охмеления гармонично.',
          strengths: ['Хорошая плотность сусла', 'Адекватный расчет нормы засева дрожжей'],
          suggestions: ['Контролируйте температуру брожения без резких перепадов'],
          foodPairings: ['Твердые сыры', 'Бургеры на гриле', 'Пряные колбаски'],
          servingTemp: '8-10°C',
          glassType: 'Тюльпан'
        },
        usage: { promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 },
        isOfflineMode: true
      });
    }

    const grainSummary = recipe.grains?.map((g: any) => `${g.name} ${g.weightKg}кг`).slice(0, 4).join(', ') || 'Солод';
    const hopSummary = recipe.hops?.map((h: any) => `${h.name} ${h.weightG}г ${h.boilTimeMin}м`).slice(0, 4).join(', ') || 'Хмель';

    const prompt = compressPrompt
      ? `Аудит пива: ${recipe.name}, Стиль:${recipe.style}, OG:${recipe.calculated?.ogSg}, ABV:${recipe.calculated?.abv}%, IBU:${recipe.calculated?.ibu}, EBC:${recipe.calculated?.ebc}. Засыпь:${grainSummary}. Хмель:${hopSummary}. Дрожжи:${recipe.yeast?.name || 'Элевые'}.
JSON:
{"summary":"2 предложения оценки","strengths":["Плюс 1","Плюс 2"],"suggestions":["Совет по улучшению"],"foodPairings":["Блюдо 1","Блюдо 2"],"servingTemp":"8-10°C","glassType":"Бокал"}`
      : `Ты — международный судья BJCP и главный технолог пивоварения.
Проанализируй рецепт:
Название: ${recipe.name}, Стиль: ${recipe.style}
Партия: ${recipe.batchSizeL} л, Кипячение: ${recipe.boilTimeMin} мин
OG: ${recipe.calculated?.ogSg}, ABV: ${recipe.calculated?.abv}%, IBU: ${recipe.calculated?.ibu}, EBC: ${recipe.calculated?.ebc}
Засыпь: ${grainSummary}
Хмели: ${hopSummary}
Дрожжи: ${recipe.yeast?.name} (${recipe.yeast?.attenuationPercent || 75}% аттенюация)

Сформируй экспертное заключение в JSON:
{
  "summary": "Краткая оценка рецепта (2 предложения)",
  "strengths": ["Плюс 1", "Плюс 2"],
  "suggestions": ["Рекомендация по улучшению засыпи или охмеления"],
  "foodPairings": ["Гастрономическая пара 1", "Пара 2", "Пара 3"],
  "servingTemp": "Рекомендуемая температура подачи (напр. 7-9°C)",
  "glassType": "Рекомендуемый бокал (напр. Тюльпан, Пинта Nonic, Снифтер)"
}`;

    const selectedModel = isEco ? 'gemini-3.1-flash-lite' : 'gemini-3.8-flash';

    const response = await aiClient.models.generateContent({
      model: selectedModel,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        maxOutputTokens: maxTokens,
        thinkingConfig: disableThinking ? { thinkingBudget: 0 } : undefined
      }
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    res.json({
      success: true,
      audit: parsed,
      usage: response.usageMetadata,
      modelUsed: selectedModel
    });
  } catch (err: any) {
    res.json({
      success: true,
      audit: {
        summary: 'Рецепт составлен гармонично и готов к варке.',
        strengths: ['Баланс засыпи и охмеления'],
        suggestions: ['Аэрируйте сусло перед внесением дрожжей'],
        foodPairings: ['Твердые сыры', 'Мясные закуски'],
        servingTemp: '8-10°C',
        glassType: 'Тюльпан'
      },
      usage: { promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 },
      isFallback: true
    });
  }
});

// 3. Облачная синхронизация между устройствами (Cloud Sync)
app.post('/api/sync/save', (req, res) => {
  const { syncCode, payload } = req.body;
  if (!syncCode || !payload) {
    return res.status(400).json({ error: 'syncCode and payload are required' });
  }
  const cleanCode = String(syncCode).trim().toUpperCase();
  cloudSyncStore.set(cleanCode, {
    data: payload,
    updatedAt: new Date().toISOString()
  });
  res.json({ success: true, syncCode: cleanCode, message: 'Данные успешно сохранены в облаке' });
});

app.get('/api/sync/load/:code', (req, res) => {
  const cleanCode = String(req.params.code).trim().toUpperCase();
  const entry = cloudSyncStore.get(cleanCode);
  if (!entry) {
    return res.status(404).json({ error: 'Синхронизационный код не найден или устарел' });
  }
  res.json({ success: true, syncCode: cleanCode, data: entry.data, updatedAt: entry.updatedAt });
});

// 4. Сообщество пивоваров
app.get('/api/community/posts', (req, res) => {
  res.json({ success: true, posts: communityPosts });
});

app.post('/api/community/posts', (req, res) => {
  const newPost = {
    id: `post_${Date.now()}`,
    createdAt: new Date().toISOString(),
    likesCount: 0,
    comments: [],
    ...req.body
  };
  communityPosts.unshift(newPost);
  res.json({ success: true, post: newPost });
});

// 5. Загрузка рецептов по URL из интернета (BeerXML, JSON, веб-страницы) без CORS-ограничений
app.post('/api/recipes/fetch-url', async (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ success: false, error: 'URL is required' });
  }

  try {
    const targetUrl = url.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      return res.status(400).json({ success: false, error: 'Некорректная ссылка (должна начинаться с http:// или https://)' });
    }

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 MasterVarka/1.0',
        'Accept': 'text/xml, application/xml, application/json, text/plain, */*'
      },
      signal: AbortSignal.timeout(12000)
    });

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: `Сервер источника вернул статус ${response.status}: ${response.statusText}`
      });
    }

    const content = await response.text();
    const contentType = response.headers.get('content-type') || 'text/plain';

    res.json({
      success: true,
      content,
      contentType,
      url: targetUrl
    });
  } catch (err: any) {
    console.error('Error fetching recipe URL:', err);
    res.status(500).json({
      success: false,
      error: `Не удалось загрузить данные по ссылке: ${err.message || 'Ошибка сети'}`
    });
  }
});

// 6. Скачивание архива с исходным кодом проекта для GitHub и компиляции в APK
app.get('/api/project/download-zip', (_req, res) => {
  const outputPath = '/tmp/mastervarka-source.zip';
  const scriptPath = path.resolve(__dirname, 'scripts', 'export_zip.py');

  execFile('python3', [scriptPath, outputPath], (error) => {
    if (error) {
      console.error('Failed to create project zip:', error);
      return res.status(500).json({ error: 'Failed to create zip archive' });
    }
    res.download(outputPath, 'mastervarka-source.zip', (err) => {
      if (err) {
        console.error('Error sending zip file:', err);
      }
    });
  });
});

// ======================== DEV & PROD SERVING ========================

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`МастерВарка full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
