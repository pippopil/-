import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));

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
    const { style, og, abv, ibu, colorEbc, hops, grains, currentName } = req.body;

    if (!aiClient) {
      // Качественный локальный генератор при отсутствии ключа или в офлайн-режиме
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
        brewerTip: 'Используйте чиллер для быстрого охлаждения и следите за температурой главного брожения!'
      });
    }

    const prompt = `Ты — креативный шеф-пивовар и дизайнер этикеток для крафтовой пивоварни.
Параметры пива:
- Стиль: ${style}
- Начальная плотность: ${og}
- Крепость: ${abv}% ABV
- Горечь: ${ibu} IBU
- Цвет: ${colorEbc} EBC
- Хмели: ${Array.isArray(hops) ? hops.map((h: any) => h.name).join(', ') : 'Крафтовые'}
- Солода: ${Array.isArray(grains) ? grains.map((g: any) => g.name).join(', ') : 'Ячменные'}
${currentName ? `- Текущее рабочее название: "${currentName}"` : ''}

Сгенерируй ответ строго в формате JSON со следующими полями:
{
  "names": ["Название 1", "Название 2", "Название 3"],
  "slogan": "Короткий звучный слоган для этикетки (до 8 слов)",
  "story": "Красивая легенда или описание вкуса для контрэтикетки (2-3 предложения на русском языке)",
  "themeStyle": "craft_modern" | "vintage_monastery" | "minimal_nordic" | "retro_arcade" | "botanical",
  "palette": {
    "background": "#hex",
    "text": "#hex",
    "accent": "#hex",
    "border": "#hex"
  },
  "artworkType": "hop" | "grain" | "barrel" | "crown" | "mountain",
  "brewerTip": "Один ценный профессиональный совет пивовара именно для этого стиля и параметров"
}`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const responseText = response.text?.trim() || '{}';
    const parsed = JSON.parse(responseText);
    res.json({ success: true, ...parsed });
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
      brewerTip: 'Держите стабильную температуру брожения в первые 72 часа.'
    });
  }
});

// 2. ИИ Экспертный аудит рецепта и гастрономические пары
app.post('/api/ai/audit-recipe', async (req, res) => {
  try {
    const { recipe } = req.body;
    if (!aiClient) {
      return res.json({
        success: true,
        audit: {
          summary: 'Рецепт составлен сбалансированно. Соотношение солодовой базы и охмеления гармонично.',
          strengths: ['Хорошая плотность сусла', 'Адекватный расчет нормы засева дрожжей'],
          suggestions: ['Контролируйте температуру брожения без резких перепадов'],
          foodPairings: ['Твердые сыры', 'Бургеры на гриле', 'Пряные колбаски'],
          servingTemp: '8-10°C'
        }
      });
    }

    const prompt = `Ты — международный судья BJCP (Beer Judge Certification Program) и главный технолог пивоварения.
Проанализируй рецепт:
Название: ${recipe.name}
Стиль: ${recipe.style}
Партия: ${recipe.batchSizeL} л, Кипячение: ${recipe.boilTimeMin} мин
Расчеты: OG ${recipe.calculated?.ogSg}, FG ${recipe.calculated?.fgSg}, ABV ${recipe.calculated?.abv}%, IBU ${recipe.calculated?.ibu}, EBC ${recipe.calculated?.ebc}, BU:GU ${recipe.calculated?.buGuRatio}
Засыпь: ${recipe.grains?.map((g: any) => `${g.name} (${g.weightKg} кг)`).join(', ')}
Хмели: ${recipe.hops?.map((h: any) => `${h.name} ${h.weightG}г на ${h.boilTimeMin}м (${h.use})`).join(', ')}
Дрожжи: ${recipe.yeast?.name} (${recipe.yeast?.attenuationPercent}% аттенюация)

Сформируй экспертное заключение в JSON:
{
  "summary": "Краткая оценка рецепта (2 предложения)",
  "strengths": ["Плюс 1", "Плюс 2"],
  "suggestions": ["Рекомендация по улучшению засыпи или охмеления"],
  "foodPairings": ["Гастрономическая пара 1", "Пара 2", "Пара 3"],
  "servingTemp": "Рекомендуемая температура подачи (напр. 7-9°C)",
  "glassType": "Рекомендуемый бокал (напр. Тюльпан, Пинта Nonic, Снифтер, Кружка)"
}`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    res.json({ success: true, audit: parsed });
  } catch (err: any) {
    res.json({
      success: true,
      audit: {
        summary: 'Рецепт выглядит сбалансированным и готовым к варке.',
        strengths: ['Классическая засыпь', 'Надежные дрожжи'],
        suggestions: ['Не забывайте про аэрацию сусла перед внесением дрожжей'],
        foodPairings: ['Крафтовые бургеры', 'Выдержанный сыр Чеддер'],
        servingTemp: '8-10°C',
        glassType: 'Пинта Nonic'
      }
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
