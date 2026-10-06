/**
 * Шаблоны промптов и офлайн-генераторы для ИИ-лаборатории пивовара
 */

import { GenerateLabelRequest, AuditRecipeRequest } from '../types/api.js';

export const OFFLINE_THEMES = [
  {
    names: ['Хмельной Горизонт', 'Янтарная Легенда', 'Крафтовый Прорыв'],
    slogan: 'Сварено с душой, проверено временем.',
    story: 'Истинный образец крафтового мастерства. Насыщенная засыпь солода и благородная хмелевая горчинка создают идеальный баланс вкуса.',
    themeStyle: 'craft_modern',
    palette: { background: '#1c1917', text: '#fef08a', accent: '#eab308', border: '#ca8a04' },
    artworkType: 'hop',
    brewerTip: 'Используйте чиллер для быстрого охлаждения сусла и контролируйте температуру брожения!'
  },
  {
    names: ['Северная Звезда', 'Баварский Бархат', 'Алхимия Солода'],
    slogan: 'Чистый вкус натурального зерна и свежего хмеля.',
    story: 'Авторская рецептура на стыке классических пивоваренных традиций и современного крафтового духа.',
    themeStyle: 'vintage_monastery',
    palette: { background: '#09090b', text: '#f4f4f5', accent: '#d97706', border: '#78350f' },
    artworkType: 'barrel',
    brewerTip: 'Обеспечьте чистоту ферментера и задавайте достаточное количество активных дрожжей.'
  },
  {
    names: ['Хмельная Волна', 'Солодовый Вектор', 'Пивной Компас'],
    slogan: 'Честное домашнее пиво без компромиссов.',
    story: 'Создано по выверенной крафтовой рецептуре с ярким профилем и чистым вкусом.',
    themeStyle: 'minimal_nordic',
    palette: { background: '#0f172a', text: '#38bdf8', accent: '#0ea5e9', border: '#0369a1' },
    artworkType: 'crown',
    brewerTip: 'Дайте пиву созреть в прохладном месте не менее 2-3 недель после розлива.'
  }
];

export function buildLabelPrompt(data: GenerateLabelRequest, compressPrompt = true): string {
  const hopList = Array.isArray(data.hops)
    ? data.hops.map(h => h.name).filter(Boolean).slice(0, 4).join(', ')
    : 'Крафтовые';
  const grainList = Array.isArray(data.grains)
    ? data.grains.map(g => g.name).filter(Boolean).slice(0, 4).join(', ')
    : 'Ячменные';

  if (compressPrompt) {
    return `Пиво: ${data.style}, OG:${data.og}, ABV:${data.abv}%, IBU:${data.ibu}, EBC:${data.colorEbc}. Хмель:${hopList}. Солод:${grainList}.${data.currentName ? ` Название:"${data.currentName}".` : ''}
Ответь ТОЛЬКО валидным JSON:
{"names":["Краткое 1","Краткое 2","Краткое 3"],"slogan":"Слоган до 6 слов","story":"Описание вкуса 1-2 предложения","themeStyle":"craft_modern"|"vintage_monastery"|"minimal_nordic"|"retro_arcade"|"botanical","palette":{"background":"#hex","text":"#hex","accent":"#hex","border":"#hex"},"artworkType":"hop"|"grain"|"barrel"|"crown"|"mountain","brewerTip":"Один краткий совет пивовара"}`;
  }

  return `Ты — креативный шеф-пивовар и дизайнер этикеток крафтовой пивоварни.
Параметры пива:
- Стиль: ${data.style}
- Начальная плотность: ${data.og}, Крепость: ${data.abv}%, Горечь: ${data.ibu} IBU, Цвет: ${data.colorEbc} EBC
- Хмели: ${hopList}
- Солода: ${grainList}
${data.currentName ? `- Текущее рабочее название: "${data.currentName}"` : ''}

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
}

export function buildAuditPrompt(data: AuditRecipeRequest, compressPrompt = true): string {
  const { recipe } = data;
  const grainSummary = recipe.grains?.map(g => `${g.name} ${g.weightKg}кг`).slice(0, 4).join(', ') || 'Солод';
  const hopSummary = recipe.hops?.map(h => `${h.name} ${h.weightG}г ${h.boilTimeMin}м`).slice(0, 4).join(', ') || 'Хмель';

  if (compressPrompt) {
    return `Аудит пива: ${recipe.name}, Стиль:${recipe.style}, OG:${recipe.calculated?.ogSg}, ABV:${recipe.calculated?.abv}%, IBU:${recipe.calculated?.ibu}, EBC:${recipe.calculated?.ebc}. Засыпь:${grainSummary}. Хмель:${hopSummary}. Дрожжи:${recipe.yeast?.name || 'Элевые'}.
JSON:
{"summary":"2 предложения оценки","strengths":["Плюс 1","Плюс 2"],"suggestions":["Совет по улучшению"],"foodPairings":["Блюдо 1","Блюдо 2"],"servingTemp":"8-10°C","glassType":"Бокал"}`;
  }

  return `Ты — международный судья BJCP и главный технолог пивоварения.
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
}
