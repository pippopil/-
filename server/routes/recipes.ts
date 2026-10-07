import { Router, Request, Response } from 'express';
import { validateExternalUrl } from '../services/security.js';
import { FetchRecipeUrlRequest } from '../types/api.js';

export const recipesRouter = Router();

// Загрузка рецептов по URL из интернета (BeerXML, JSON, Бир.РФ, веб-страницы) с защитой от SSRF
recipesRouter.post('/fetch-url', async (req: Request<{}, {}, FetchRecipeUrlRequest>, res: Response) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ success: false, error: 'URL не указан' });
  }

  // 1. Проверка URL на безопасность (SSRF защита)
  const validation = validateExternalUrl(url);
  if (!validation.isValid || !validation.sanitizedUrl) {
    return res.status(400).json({
      success: false,
      error: validation.error || 'Недопустимый или опасный адрес URL'
    });
  }

  try {
    const targetUrl = validation.sanitizedUrl;

    // 2. Безопасный запрос с таймаутом и контролем размера
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 MasterVarka/1.0',
        'Accept': 'text/xml, application/xml, application/json, text/plain, text/html, */*'
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: `Сервер источника вернул статус ${response.status}: ${response.statusText}`
      });
    }

    // Ограничение размера принимаемого контента (максимум 5MB) для защиты от DoS
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > 5 * 1024 * 1024) {
      return res.status(413).json({
        success: false,
        error: 'Файл рецепта превышает допустимый размер (максимум 5 МБ)'
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

// Поиск рецептов в интернет-базе по заданным параметрам (тип брожения, стиль, крепость, запрос)
recipesRouter.post('/search-online', (req: Request, res: Response) => {
  const { query, fermentationType, styleCategory, minAbv, maxAbv } = req.body;

  // Базовая коллекция проверенных интернет-рецептов (Бир.РФ, крафт клоны, мировые образцы)
  const masterOnlineCatalog = [
    {
      id: 'online_prachyachka_ipa',
      name: 'Атомная Прачечная (Клон IPA)',
      style: 'American IPA',
      category: 'Эли / Хмелевые',
      fermentationType: 'ale',
      origin: 'Россия (Jaws Brewery)',
      breweryClone: 'Jaws Brewery',
      abv: 7.0,
      ibu: 101,
      ebc: 16,
      og: 1.068,
      description: 'Легендарный российский IPA с мощным хмелевым ударом, цитрусово-хвойной смолистостью и напористой чистой горечью свыше 100 IBU.',
      batchSizeL: 20,
      boilTimeMin: 90,
      grains: [
        { name: 'Pale Ale Malt (Пэйл Эль)', weightKg: 5.8, potentialSg: 1.038, colorEbc: 6.0, type: 'base' },
        { name: 'Munich I (Мюнхенский)', weightKg: 0.8, potentialSg: 1.036, colorEbc: 15.0, type: 'base' },
        { name: 'Carapils / Carafoam', weightKg: 0.4, potentialSg: 1.033, colorEbc: 4.5, type: 'caramel' },
        { name: 'Carared (Караред)', weightKg: 0.3, potentialSg: 1.034, colorEbc: 50.0, type: 'caramel' }
      ],
      hops: [
        { name: 'Columbus / Tomahawk / Zeus (CTZ)', weightG: 30, alphaAcid: 15.0, boilTimeMin: 60, use: 'boil' },
        { name: 'Chinook', weightG: 25, alphaAcid: 13.0, boilTimeMin: 30, use: 'boil' },
        { name: 'Centennial', weightG: 30, alphaAcid: 10.0, boilTimeMin: 15, use: 'boil' },
        { name: 'Citra', weightG: 35, alphaAcid: 12.5, boilTimeMin: 5, use: 'boil' },
        { name: 'Simcoe', weightG: 40, alphaAcid: 13.0, boilTimeMin: 0, use: 'whirlpool' },
        { name: 'Cascade', weightG: 50, alphaAcid: 6.0, boilTimeMin: 0, use: 'dry_hop' },
        { name: 'Citra', weightG: 40, alphaAcid: 12.5, boilTimeMin: 0, use: 'dry_hop' }
      ],
      yeast: { name: 'SafAle US-05', lab: 'Fermentis', form: 'dry', type: 'ale', attenuationPercent: 81 },
      tags: ['IPA', 'Клон', 'Jaws', 'Верховое брожение', 'Хмель']
    },
    {
      id: 'online_guinness_extra_stout',
      name: 'Guinness Extra Stout (Клон)',
      style: 'Irish Extra Stout',
      category: 'Темные эли / Портеры',
      fermentationType: 'ale',
      origin: 'Ирландия (St. James’s Gate)',
      breweryClone: 'Guinness',
      abv: 4.8,
      ibu: 40,
      ebc: 75,
      og: 1.048,
      description: 'Эталон ирландского сухого стаута. Неповторимый кофейно-шоколадный профиль за счет 10% жженого несоложеного ячменя и ячменных хлопьев.',
      batchSizeL: 20,
      boilTimeMin: 60,
      grains: [
        { name: 'Pale Ale Malt (Пэйл Эль)', weightKg: 3.8, potentialSg: 1.038, colorEbc: 6.0, type: 'base' },
        { name: 'Flaked Barley (Ячменные хлопья)', weightKg: 0.6, potentialSg: 1.032, colorEbc: 3.5, type: 'adjunct' },
        { name: 'Roasted Barley (Жженый ячмень 1100 EBC)', weightKg: 0.48, potentialSg: 1.025, colorEbc: 1100.0, type: 'roasted' },
        { name: 'Acidulated Malt (Кислый солод)', weightKg: 0.1, potentialSg: 1.027, colorEbc: 4.5, type: 'acid' }
      ],
      hops: [
        { name: 'Magnum', weightG: 22, alphaAcid: 14.0, boilTimeMin: 60, use: 'boil' },
        { name: 'East Kent Goldings (EKG)', weightG: 20, alphaAcid: 5.0, boilTimeMin: 15, use: 'boil' }
      ],
      yeast: { name: 'Wyeast 1084 Irish Ale / S-04', lab: 'Wyeast', form: 'dry', type: 'ale', attenuationPercent: 74 },
      tags: ['Стаут', 'Guinness', 'Верховое брожение', 'Ирландия', 'Сухой стаут']
    },
    {
      id: 'online_london_brown_porter',
      name: 'Fuller’s London Porter (Клон)',
      style: 'English Porter',
      category: 'Темные эли / Портеры',
      fermentationType: 'ale',
      origin: 'Англия (Fuller’s Brewery)',
      breweryClone: 'Fuller’s',
      abv: 5.4,
      ibu: 33,
      ebc: 58,
      og: 1.054,
      description: 'Мягкий лондонский портер с богатыми нотами молочного шоколада, лесного ореха и поджаренного тоста.',
      batchSizeL: 20,
      boilTimeMin: 60,
      grains: [
        { name: 'Maris Otter (Английский Пэйл)', weightKg: 4.2, potentialSg: 1.038, colorEbc: 6.5, type: 'base' },
        { name: 'Caramunich II', weightKg: 0.4, potentialSg: 1.034, colorEbc: 120.0, type: 'caramel' },
        { name: 'Chocolate Malt', weightKg: 0.35, potentialSg: 1.028, colorEbc: 900.0, type: 'roasted' },
        { name: 'Carapils', weightKg: 0.2, potentialSg: 1.033, colorEbc: 4.5, type: 'caramel' }
      ],
      hops: [
        { name: 'Northern Brewer', weightG: 25, alphaAcid: 9.0, boilTimeMin: 60, use: 'boil' },
        { name: 'Fuggle', weightG: 20, alphaAcid: 4.5, boilTimeMin: 15, use: 'boil' }
      ],
      yeast: { name: 'SafAle S-04', lab: 'Fermentis', form: 'dry', type: 'ale', attenuationPercent: 75 },
      tags: ['Портер', 'Верховое брожение', 'Fuller’s', 'Англия', 'Шоколад']
    },
    {
      id: 'online_dostoevsky_baltic_porter',
      name: 'Балтийский Портер «Достоевский» (Клон Brewlok)',
      style: 'Baltic Porter',
      category: 'Темные эли / Портеры',
      fermentationType: 'lager',
      origin: 'Россия (Brewlok)',
      breweryClone: 'Brewlok',
      abv: 8.5,
      ibu: 35,
      ebc: 70,
      og: 1.082,
      description: 'Глубокий согревающий имперский балтийский портер низового лагерного брожения. Тона чернослива, шоколада и портвейна.',
      batchSizeL: 20,
      boilTimeMin: 90,
      grains: [
        { name: 'Munich I (Мюнхенский)', weightKg: 4.5, potentialSg: 1.036, colorEbc: 15.0, type: 'base' },
        { name: 'Pilsner Malt (Пилснер)', weightKg: 2.5, potentialSg: 1.037, colorEbc: 3.5, type: 'base' },
        { name: 'Caramunich II', weightKg: 0.6, potentialSg: 1.034, colorEbc: 120.0, type: 'caramel' },
        { name: 'Special B', weightKg: 0.35, potentialSg: 1.032, colorEbc: 300.0, type: 'caramel' },
        { name: 'Carafa Special III', weightKg: 0.3, potentialSg: 1.028, colorEbc: 1400.0, type: 'roasted' }
      ],
      hops: [
        { name: 'Magnum', weightG: 28, alphaAcid: 14.0, boilTimeMin: 60, use: 'boil' },
        { name: 'Saaz (Жатецкий)', weightG: 30, alphaAcid: 3.8, boilTimeMin: 20, use: 'boil' }
      ],
      yeast: { name: 'Saflager W-34/70', lab: 'Fermentis', form: 'dry', type: 'lager', attenuationPercent: 82 },
      tags: ['Портер', 'Балтийский портер', 'Низовое брожение', 'Лагер', 'Россия']
    },
    {
      id: 'online_zhigulevskoe_gost',
      name: 'Жигулевское Светлое (СССР ГОСТ 3473-78)',
      style: 'Czech Premium Pale Lager / Soviet Lager',
      category: 'Лагеры',
      fermentationType: 'lager',
      origin: 'СССР / Россия (Бир.РФ Архив)',
      abv: 4.2,
      ibu: 20,
      ebc: 8,
      og: 1.044,
      description: 'Аутентичный советский лагер 11% плотности по ГОСТ 3473-78. Светлый солод, 15% несоложеного ячменя и жатецкий хмель.',
      batchSizeL: 20,
      boilTimeMin: 75,
      grains: [
        { name: 'Pilsner Malt (Пилснер)', weightKg: 3.2, potentialSg: 1.037, colorEbc: 3.5, type: 'base' },
        { name: 'Flaked Barley (Ячменные хлопья)', weightKg: 0.55, potentialSg: 1.032, colorEbc: 3.5, type: 'adjunct' },
        { name: 'Vienna Malt (Венский)', weightKg: 0.3, potentialSg: 1.036, colorEbc: 8.0, type: 'base' }
      ],
      hops: [
        { name: 'Magnum', weightG: 10, alphaAcid: 14.0, boilTimeMin: 60, use: 'boil' },
        { name: 'Saaz (Жатецкий)', weightG: 25, alphaAcid: 3.8, boilTimeMin: 20, use: 'boil' },
        { name: 'Saaz (Жатецкий)', weightG: 20, alphaAcid: 3.8, boilTimeMin: 5, use: 'boil' }
      ],
      yeast: { name: 'Saflager W-34/70', lab: 'Fermentis', form: 'dry', type: 'lager', attenuationPercent: 82 },
      tags: ['Жигулевское', 'Низовое брожение', 'Лагер', 'СССР', 'Бир.РФ']
    },
    {
      id: 'online_weihenstephaner_weizen',
      name: 'Weihenstephaner Hefe-Weissbier (Клон)',
      style: 'Weissbier',
      category: 'Пшеничное',
      fermentationType: 'ale',
      origin: 'Германия (Weihenstephan)',
      breweryClone: 'Weihenstephan',
      abv: 5.4,
      ibu: 14,
      ebc: 9,
      og: 1.052,
      description: 'Классическое баварское пшеничное пиво. 60% пшеничного солода, пышная пена и эфиры спелого банана с пряной гвоздикой.',
      batchSizeL: 20,
      boilTimeMin: 60,
      grains: [
        { name: 'Wheat Malt (Пшеничный светлый)', weightKg: 2.8, potentialSg: 1.038, colorEbc: 4.0, type: 'wheat' },
        { name: 'Pilsner Malt (Пилснер)', weightKg: 1.8, potentialSg: 1.037, colorEbc: 3.5, type: 'base' },
        { name: 'Munich I (Мюнхенский)', weightKg: 0.3, potentialSg: 1.036, colorEbc: 15.0, type: 'base' }
      ],
      hops: [
        { name: 'Hallertau Mittelfrüh', weightG: 22, alphaAcid: 4.0, boilTimeMin: 60, use: 'boil' },
        { name: 'Tettnanger', weightG: 12, alphaAcid: 4.5, boilTimeMin: 15, use: 'boil' }
      ],
      yeast: { name: 'SafAle WB-06', lab: 'Fermentis', form: 'dry', type: 'wheat', attenuationPercent: 86 },
      tags: ['Пшеничное', 'Вайцен', 'Верховое брожение', 'Бавария', 'Банан']
    },
    {
      id: 'online_tomato_gose',
      name: 'Tomato Gose «Чили & Базилик»',
      style: 'Gose',
      category: 'Кислые эли',
      fermentationType: 'spontaneous',
      origin: 'Россия (Крафтовый тренд)',
      abv: 4.5,
      ibu: 8,
      ebc: 8,
      og: 1.042,
      description: 'Кисло-соленый томатный эль спонтанного/молочнокислого закисления с розовой солью, базиликом и дробленым чили.',
      batchSizeL: 20,
      boilTimeMin: 60,
      grains: [
        { name: 'Pilsner Malt (Пилснер)', weightKg: 2.2, potentialSg: 1.037, colorEbc: 3.5, type: 'base' },
        { name: 'Wheat Malt (Пшеничный светлый)', weightKg: 1.8, potentialSg: 1.038, colorEbc: 4.0, type: 'wheat' },
        { name: 'Acidulated Malt (Кислый солод)', weightKg: 0.3, potentialSg: 1.027, colorEbc: 4.5, type: 'acid' }
      ],
      hops: [
        { name: 'Saaz (Жатецкий)', weightG: 15, alphaAcid: 3.8, boilTimeMin: 60, use: 'boil' }
      ],
      yeast: { name: 'Philly Sour / US-05', lab: 'Lallemand', form: 'dry', type: 'sour', attenuationPercent: 76 },
      tags: ['Гозе', 'Кислый эль', 'Спонтанное брожение', 'Томатное', 'Россия']
    },
    {
      id: 'online_belgian_tripel_karmeliet',
      name: 'Tripel Karmeliet (Клон)',
      style: 'Belgian Tripel',
      category: 'Бельгийские эли',
      fermentationType: 'ale',
      origin: 'Бельгия (Bosteels)',
      breweryClone: 'Bosteels',
      abv: 8.4,
      ibu: 28,
      ebc: 11,
      og: 1.080,
      description: 'Знаменитый бельгийский трипель из трех злаков: ячменя, пшеницы и овса с пряными дрожжевыми эфирами и белым леденцовым сахаром.',
      batchSizeL: 20,
      boilTimeMin: 75,
      grains: [
        { name: 'Pilsner Malt', weightKg: 5.2, potentialSg: 1.037, colorEbc: 3.5, type: 'base' },
        { name: 'Wheat Malt', weightKg: 0.7, potentialSg: 1.038, colorEbc: 4.0, type: 'wheat' },
        { name: 'Flaked Oats', weightKg: 0.5, potentialSg: 1.032, colorEbc: 2.0, type: 'adjunct' },
        { name: 'Carapils', weightKg: 0.3, potentialSg: 1.033, colorEbc: 4.5, type: 'caramel' }
      ],
      hops: [
        { name: 'Saaz (Жатецкий)', weightG: 35, alphaAcid: 3.8, boilTimeMin: 60, use: 'boil' },
        { name: 'Tettnanger', weightG: 20, alphaAcid: 4.5, boilTimeMin: 15, use: 'boil' }
      ],
      mashSchedule: [
        { name: 'Мальтозная пауза', tempC: 63, timeMin: 50, type: 'maltose' },
        { name: 'Осахаривание', tempC: 72, timeMin: 20, type: 'dextrin' },
        { name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout' }
      ],
      yeast: { name: 'SafAle BE-256', lab: 'Fermentis', form: 'dry', type: 'belgian', attenuationPercent: 84 },
      tags: ['Трипель', 'Бельгия', 'Верховое брожение', 'Монастырское']
    },
    {
      id: 'online_founders_robust_porter',
      name: 'Founders Robust Porter (Клон)',
      style: 'Robust Porter',
      category: 'Темные эли / Портеры',
      fermentationType: 'ale',
      origin: 'США (Founders Brewing)',
      breweryClone: 'Founders',
      abv: 6.5,
      ibu: 45,
      ebc: 65,
      og: 1.065,
      description: 'Эталон американского робуст-портера верхового брожения. Насыщенные ноты эспрессо, темного шоколада и ощутимая хмелевая горчинка.',
      batchSizeL: 20,
      boilTimeMin: 60,
      grains: [
        { name: 'Pale Ale Malt (Пэйл)', weightKg: 5.0, potentialSg: 1.038, colorEbc: 6.0, type: 'base' },
        { name: 'Munich I', weightKg: 0.6, potentialSg: 1.036, colorEbc: 15.0, type: 'base' },
        { name: 'Chocolate Malt', weightKg: 0.45, potentialSg: 1.028, colorEbc: 900.0, type: 'roasted' },
        { name: 'Black Patent', weightKg: 0.2, potentialSg: 1.025, colorEbc: 1300.0, type: 'roasted' },
        { name: 'Crystal 60L', weightKg: 0.4, potentialSg: 1.034, colorEbc: 120.0, type: 'caramel' }
      ],
      hops: [
        { name: 'Nugget', weightG: 25, alphaAcid: 13.0, boilTimeMin: 60, use: 'boil' },
        { name: 'Willamette', weightG: 30, alphaAcid: 4.8, boilTimeMin: 20, use: 'boil' }
      ],
      mashSchedule: [
        { name: 'Осахаривание (Полнотелое)', tempC: 68, timeMin: 60, type: 'maltose' },
        { name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout' }
      ],
      yeast: { name: 'SafAle US-05', lab: 'Fermentis', form: 'dry', type: 'ale', attenuationPercent: 78 },
      tags: ['Портер', 'Робуст портер', 'Верховое брожение', 'Шоколад', 'Кофе']
    },
    {
      id: 'online_sierra_nevada_pale_ale',
      name: 'Sierra Nevada Pale Ale (Клон)',
      style: 'American Pale Ale',
      category: 'Эли / Хмелевые',
      fermentationType: 'ale',
      origin: 'США (Sierra Nevada)',
      breweryClone: 'Sierra Nevada',
      abv: 5.6,
      ibu: 38,
      ebc: 20,
      og: 1.053,
      description: 'Икона крафтового пивоварения. Чистый эль верхового брожения на культовом американском хмеле Cascade с цитрусово-хвойным ароматом.',
      batchSizeL: 20,
      boilTimeMin: 60,
      grains: [
        { name: 'Pale Ale Malt (Пэйл Эль)', weightKg: 4.6, potentialSg: 1.038, colorEbc: 6.0, type: 'base' },
        { name: 'Crystal 60L (Карамельный)', weightKg: 0.45, potentialSg: 1.034, colorEbc: 120.0, type: 'caramel' }
      ],
      hops: [
        { name: 'Magnum', weightG: 14, alphaAcid: 14.0, boilTimeMin: 60, use: 'boil' },
        { name: 'Perle', weightG: 15, alphaAcid: 7.5, boilTimeMin: 30, use: 'boil' },
        { name: 'Cascade', weightG: 40, alphaAcid: 6.0, boilTimeMin: 10, use: 'boil' },
        { name: 'Cascade', weightG: 45, alphaAcid: 6.0, boilTimeMin: 0, use: 'whirlpool' }
      ],
      mashSchedule: [
        { name: 'Осахаривание', tempC: 67, timeMin: 60, type: 'maltose' },
        { name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout' }
      ],
      yeast: { name: 'SafAle US-05', lab: 'Fermentis', form: 'dry', type: 'ale', attenuationPercent: 81 },
      tags: ['Эль', 'APA', 'Верховое брожение', 'Cascade', 'Клон']
    },
    {
      id: 'online_pilsner_urquell_clone',
      name: 'Pilsner Urquell (Клон Пилснера)',
      style: 'Czech Premium Pale Lager',
      category: 'Лагеры',
      fermentationType: 'lager',
      origin: 'Чехия (Пльзень)',
      breweryClone: 'Pilsner Urquell',
      abv: 4.4,
      ibu: 40,
      ebc: 9,
      og: 1.047,
      description: 'Родоначальник всех пилснеров мира. Низовое лагерное брожение, мягкая вода, 100% солод Пилснер и щедрое добавление жатецкого хмеля Saaz.',
      batchSizeL: 20,
      boilTimeMin: 90,
      grains: [
        { name: 'Bohemian Pilsner Malt', weightKg: 4.4, potentialSg: 1.037, colorEbc: 3.5, type: 'base' },
        { name: 'Carapils', weightKg: 0.2, potentialSg: 1.033, colorEbc: 4.5, type: 'caramel' }
      ],
      hops: [
        { name: 'Saaz (Жатецкий)', weightG: 40, alphaAcid: 3.8, boilTimeMin: 90, use: 'boil' },
        { name: 'Saaz (Жатецкий)', weightG: 30, alphaAcid: 3.8, boilTimeMin: 30, use: 'boil' },
        { name: 'Saaz (Жатецкий)', weightG: 35, alphaAcid: 3.8, boilTimeMin: 5, use: 'boil' }
      ],
      mashSchedule: [
        { name: 'Белковая пауза', tempC: 52, timeMin: 15, type: 'protein' },
        { name: 'Мальтозная пауза', tempC: 63, timeMin: 45, type: 'maltose' },
        { name: 'Осахаривание', tempC: 72, timeMin: 25, type: 'dextrin' },
        { name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout' }
      ],
      yeast: { name: 'Saflager W-34/70', lab: 'Fermentis', form: 'dry', type: 'lager', attenuationPercent: 82 },
      tags: ['Пилснер', 'Лагер', 'Низовое брожение', 'Чехия', 'Жатецкий']
    }
  ];

  let results = masterOnlineCatalog;

  // Фильтрация по строке поиска
  if (query && typeof query === 'string' && query.trim()) {
    const q = query.toLowerCase().trim();
    results = results.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.style.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      (r.breweryClone && r.breweryClone.toLowerCase().includes(q)) ||
      r.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  // Фильтрация по типу брожения
  if (fermentationType && fermentationType !== 'all') {
    results = results.filter(r => r.fermentationType === fermentationType);
  }

  // Фильтрация по стилю/категории
  if (styleCategory && styleCategory !== 'all') {
    results = results.filter(r => {
      const s = r.style.toLowerCase();
      const c = r.category.toLowerCase();
      if (styleCategory === 'porter') return s.includes('porter') || c.includes('портер');
      if (styleCategory === 'stout') return s.includes('stout') || c.includes('стаут');
      if (styleCategory === 'ipa') return s.includes('ipa');
      if (styleCategory === 'lager') return s.includes('lager') || s.includes('pils') || c.includes('лагер');
      if (styleCategory === 'wheat') return s.includes('weizen') || s.includes('wheat') || s.includes('witbier') || c.includes('пшенич');
      if (styleCategory === 'sour') return s.includes('gose') || s.includes('sour') || s.includes('berliner') || c.includes('кисл');
      if (styleCategory === 'belgian') return c.includes('бельгийск') || s.includes('tripel') || s.includes('dubbel') || s.includes('blond');
      if (styleCategory === 'ale') return r.fermentationType === 'ale';
      return true;
    });
  }

  // Фильтрация по крепости (ABV)
  if (typeof minAbv === 'number') {
    results = results.filter(r => r.abv >= minAbv);
  }
  if (typeof maxAbv === 'number') {
    results = results.filter(r => r.abv <= maxAbv);
  }

  res.json({
    success: true,
    totalFound: results.length,
    recipes: results
  });
});
