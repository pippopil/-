import { GrainItem, GrainType } from '../types/brewing';

/**
 * Справочник и алгоритмы подбора аналогов:
 * 1. Замена импортных солодов (Weyermann, Castle, Simpsons, Crisp, Dingemans, Briess и др.) на доступный Курский солод.
 * 2. Таблица взаимозаменяемости хмелей (Hop Substitution Guide).
 */

export interface KurskSubstituteInfo {
  kurskName: string;
  potentialSg: number;
  colorEbc: number;
  ratio: number; // Коэффициент пересчета массы (1.0 = 1 к 1)
  description: string;
  tip?: string;
  isExactMatch?: boolean;
  type: GrainType;
}

export interface HopAlternativeInfo {
  name: string;
  alphaRange: string;
  flavorProfile: string;
  bestFor: 'boil' | 'aroma' | 'both';
  similarity: number; // 0-100%
  conversionNote: string;
}

// Официальная линейка Курского солодовенного завода для прямого выбора
export const KURSK_MALT_PRODUCTS = [
  { name: 'Курский Пилснер (Pilsner Malt)', colorEbc: 3.8, potentialSg: 1.037, type: 'base' as const, description: 'Светлый ячменный базовый солод с высокой осахаривающей способностью.' },
  { name: 'Курский Премиум Пилснер (Premium Pilsner)', colorEbc: 3.4, potentialSg: 1.038, type: 'base' as const, description: 'Особо очищенный светлый солод высшего сорта с пониженным белком.' },
  { name: 'Курский Пэйл Эль (Pale Ale Malt)', colorEbc: 6.0, potentialSg: 1.038, type: 'base' as const, description: 'Универсальная основа для классических элей, дает округлый солодовый вкус.' },
  { name: 'Курский Венский (Vienna Malt)', colorEbc: 8.5, potentialSg: 1.036, type: 'base' as const, description: 'Золотисто-янтарный цвет и нотки свежеиспеченного тоста.' },
  { name: 'Курский Мюнхенский светлый (Munich Typ 1, 15 EBC)', colorEbc: 15.0, potentialSg: 1.036, type: 'base' as const, description: 'Глубокий зерновой аромат корки черного хлеба и бисквита.' },
  { name: 'Курский Мюнхенский темный (Munich Typ 2, 25 EBC)', colorEbc: 25.0, potentialSg: 1.035, type: 'base' as const, description: 'Выраженный солодовый характер для плотных темных лагеров и боков.' },
  { name: 'Курский Пшеничный светлый (Wheat Malt)', colorEbc: 4.5, potentialSg: 1.038, type: 'wheat' as const, description: 'Дает фирменную стойкую пенную шапку и бархатистое тело.' },
  { name: 'Курский Пшеничный темный (Dark Wheat Malt)', colorEbc: 18.0, potentialSg: 1.037, type: 'wheat' as const, description: 'Темный пшеничный солод для дункельвайценов и пшеничных боков.' },
  { name: 'Курский Ржаной неферментированный (светлый)', colorEbc: 8.0, potentialSg: 1.036, type: 'adjunct' as const, description: 'Пряные ржаные нотки для роггенбиров и темных сортов.' },
  { name: 'Курский Ржаной ферментированный (темный)', colorEbc: 150.0, potentialSg: 1.030, type: 'roasted' as const, description: 'Аромат бородинского хлеба и квасного сусла.' },
  { name: 'Курский Гречишный (Buckwheat Malt)', colorEbc: 8.0, potentialSg: 1.034, type: 'adjunct' as const, description: 'Уникальный орехово-медовый оттенок гречихи.' },
  { name: 'Курский Овсяный (Oat Malt)', colorEbc: 4.0, potentialSg: 1.034, type: 'adjunct' as const, description: 'Шелковистая кремовая текстура для стаутов и NEIPA.' },
  { name: 'Курский Десертный (Карамельный 20 EBC)', colorEbc: 20.0, potentialSg: 1.033, type: 'caramel' as const, description: 'Аналог Carapils/Carafoam, для стойкости пены и полноты тела.' },
  { name: 'Курский Карамельный 50 (Caramel 50 EBC)', colorEbc: 50.0, potentialSg: 1.034, type: 'caramel' as const, description: 'Мягкая карамельная сладость и золотистый медный блеск.' },
  { name: 'Курский Карамельный 100 (Caramel 100 EBC)', colorEbc: 100.0, potentialSg: 1.034, type: 'caramel' as const, description: 'Ириска, леденцы и сухие фрукты.' },
  { name: 'Курский Карамельный 150 (Caramel 150 EBC)', colorEbc: 150.0, potentialSg: 1.033, type: 'caramel' as const, description: 'Аналог Caramunich, богатый карамельно-бисквитный профиль.' },
  { name: 'Курский Карамельный 200 (Caramel 200 EBC)', colorEbc: 200.0, potentialSg: 1.033, type: 'caramel' as const, description: 'Глубокий рубиновый цвет и насыщенный карамельный вкус.' },
  { name: 'Курский Карамельный 250 (Caramel 250 EBC)', colorEbc: 250.0, potentialSg: 1.032, type: 'caramel' as const, description: 'Спелая слива, изюм и поджаренная карамель.' },
  { name: 'Курский Карамельный 300 (Caramel 300 EBC)', colorEbc: 300.0, potentialSg: 1.032, type: 'caramel' as const, description: 'Аналог Special B и Caraaroma, ноты инжира и чернослива.' },
  { name: 'Курский Меланоидиновый (Melanoidin 75 EBC)', colorEbc: 75.0, potentialSg: 1.035, type: 'caramel' as const, description: 'Имитация традиционного декокционного отварочного затирания.' },
  { name: 'Курский Бисквитный (Biscuit / Amber 50 EBC)', colorEbc: 50.0, potentialSg: 1.034, type: 'caramel' as const, description: 'Интенсивный вкус поджаренного хлеба, теплого бисквита и орехов.' },
  { name: 'Курский Шато Кристалл (Crystal 150 EBC)', colorEbc: 150.0, potentialSg: 1.033, type: 'caramel' as const, description: 'Кристаллический карамельный солод для насыщенных биттеров и элей.' },
  { name: 'Курский Кислый (Acidulated Malt)', colorEbc: 4.5, potentialSg: 1.027, type: 'acid' as const, description: 'Снижение pH затора натуральной молочной кислотой солода.' },
  { name: 'Курский Копченый (Smoked Malt)', colorEbc: 6.0, potentialSg: 1.036, type: 'base' as const, description: 'Окурен буковой щепой, идеален для раухбиров и копченых портеров.' },
  { name: 'Курский Шоколадный (Chocolate 900 EBC)', colorEbc: 900.0, potentialSg: 1.028, type: 'roasted' as const, description: 'Теплые тона горького шоколада, какао и кофейных зерен.' },
  { name: 'Курский Жженый (Roasted Barley 1100 EBC)', colorEbc: 1100.0, potentialSg: 1.025, type: 'roasted' as const, description: 'Сухая кофейная жженка и непроницаемый черный цвет для стаутов.' },
  { name: 'Курский Черный солод (Black Malt 1200 EBC)', colorEbc: 1200.0, potentialSg: 1.025, type: 'roasted' as const, description: 'Интенсивный черный цвет с минимальной горечью.' },
  { name: 'Курский Диафарин (Энзимный ферментативный солод)', colorEbc: 3.5, potentialSg: 1.037, type: 'base' as const, description: 'Высочайшая ферментативная сила для осахаривания несоложенки.' }
];

// 1. БАЗА ЗАМЕНЫ НА КУРСКИЙ СОЛОД
export const KURSK_MALT_MAP: Record<string, KurskSubstituteInfo> = {
  // Пилснер и лагерные базовые
  'pilsner': {
    kurskName: 'Курский Пилснер (Pilsner Malt)',
    potentialSg: 1.037,
    colorEbc: 3.8,
    ratio: 1.0,
    type: 'base',
    description: 'Прямая замена 1:1 импортному Pilsner (Weyermann, Castle, BestMalz). Чистый солодовый профиль, отличная экстрактивность.',
    tip: 'Рекомендуется выдержать белковую паузу 52-54°C (10-15 мин) для идеальной прозрачности сусла.',
    isExactMatch: true
  },
  'lager': {
    kurskName: 'Курский Пилснер (Pilsner Malt)',
    potentialSg: 1.037,
    colorEbc: 3.8,
    ratio: 1.0,
    type: 'base',
    description: 'Прямая замена 1:1 для солодов Лагер/Экстра светлый.',
    isExactMatch: true
  },

  // Пэйл Эль и британские базовые
  'pale_ale': {
    kurskName: 'Курский Пэйл Эль (Pale Ale Malt)',
    potentialSg: 1.038,
    colorEbc: 6.0,
    ratio: 1.0,
    type: 'base',
    description: 'Прямая замена 1:1 солодам Pale Ale (Weyermann, Castle, Crisp). Дает золотистый оттенок и мягкий хлебный вкус.',
    tip: 'Универсальная основа для любых элей, IPA, APA, портеров и стаутов.',
    isExactMatch: true
  },
  'maris_otter': {
    kurskName: 'Курский Пэйл Эль (90%) + Курский Мюнхенский (10%)',
    potentialSg: 1.038,
    colorEbc: 7.0,
    ratio: 1.0,
    type: 'base',
    description: 'Точная имитация знаменитого английского Maris Otter. Мюнхенский добавляет характерный бисквитный и ореховый привкус.',
    tip: 'На 4.5 кг Пэйл Эля добавьте 0.5 кг Курского Мюнхенского.',
    isExactMatch: false
  },
  'golden_promise': {
    kurskName: 'Курский Пэйл Эль + Курский Венский (20%)',
    potentialSg: 1.038,
    colorEbc: 6.5,
    ratio: 1.0,
    type: 'base',
    description: 'Имитация шотландского Golden Promise со сладковатым чистым телом.',
    isExactMatch: false
  },

  // Венский
  'vienna': {
    kurskName: 'Курский Венский (Vienna Malt)',
    potentialSg: 1.036,
    colorEbc: 8.5,
    ratio: 1.0,
    type: 'base',
    description: 'Прямая замена 1:1 венским солодам. Придает напитку янтарный цвет и насыщенный зерновой аромат с тонами тостов.',
    tip: 'Отлично подходит для лагеров, венского лагера, марцена и янтарных элей.',
    isExactMatch: true
  },

  // Мюнхенский I и II
  'munich': {
    kurskName: 'Курский Мюнхенский (Munich 15-25 EBC)',
    potentialSg: 1.036,
    colorEbc: 20.0,
    ratio: 1.0,
    type: 'base',
    description: 'Прямая замена Munich I / Munich II. Насыщенный солодовый вкус корки ржаного хлеба и бисквита.',
    tip: 'Для рецептов с Munich I (15 EBC) возьмите 90% дозы; для Munich II — 100%.',
    isExactMatch: true
  },

  // Пшеничные солода
  'wheat': {
    kurskName: 'Курский Пшеничный (Wheat Malt)',
    potentialSg: 1.038,
    colorEbc: 4.5,
    ratio: 1.0,
    type: 'wheat',
    description: 'Прямая замена импортному светgroup Wheat Malt (Castle / Weyermann). Создает фирменную стойкую пенную шапку и бархатистое тело.',
    tip: 'В засыпи выше 50% рекомендуется использовать рисовую шелуху для облегчения фильтрации.',
    isExactMatch: true
  },
  'dark_wheat': {
    kurskName: 'Курский Пшеничный (80%) + Курский Мюнхенский (20%)',
    potentialSg: 1.037,
    colorEbc: 16.0,
    ratio: 1.0,
    type: 'wheat',
    description: 'Аналог Dunkelweizen / Dark Wheat Malt для темного пшеничного пива.',
    isExactMatch: false
  },

  // Ржаной солод
  'rye': {
    kurskName: 'Курский Ржаной неферментированный',
    potentialSg: 1.036,
    colorEbc: 8.0,
    ratio: 1.0,
    type: 'adjunct',
    description: 'Прямая замена импортному Rye Malt для пряного сухого ржаного вкуса.',
    tip: 'Обязательно добавьте глюканазную паузу (45-50°C, 15 мин), рожь очень вязкая при фильтрации.',
    isExactMatch: true
  },

  // Карапилс / Декстрин / Карафом
  'carapils': {
    kurskName: 'Курский Десертный (Карамельный 20 EBC)',
    potentialSg: 1.033,
    colorEbc: 20.0,
    ratio: 0.95,
    type: 'caramel',
    description: 'Аналог Weyermann Carapils / Carafoam / Dextrin Malt. Служит для удержания стойкой пены и полноты вкуса.',
    tip: 'Цвет Курского аналога чуть плотнее (20 EBC против 4 EBC), поэтому пиво получится на полтона золотистее, а пена будет исключительно плотной.',
    isExactMatch: true
  },

  // Карахелль
  'carahell': {
    kurskName: 'Курский Карамельный 50 (Caramel 50 EBC)',
    potentialSg: 1.034,
    colorEbc: 50.0,
    ratio: 0.85,
    type: 'caramel',
    description: 'Замена Carahell (25 EBC). Дает карамельную округлость и красивый золотисто-медный блеск.',
    tip: 'Так как цвет Курского Карамельного 50 насыщеннее, можно взять на 15% меньше исходного рецепта.',
    isExactMatch: true
  },

  // Караред / Мелано
  'carared': {
    kurskName: 'Курский Меланоидиновый + Курский Карамельный 50 (50/50)',
    potentialSg: 1.034,
    colorEbc: 60.0,
    ratio: 1.0,
    type: 'caramel',
    description: 'Аналог Carared для получения фирменного рубиново-красного оттенка. Меланоидины дают глубокий красный цвет и медовый привкус.',
    tip: 'Смешайте поровну Курский Меланоидиновый и Курский Карамельный 50.',
    isExactMatch: false
  },

  // Карамюнхен I/II/III
  'caramunich': {
    kurskName: 'Курский Карамельный 150 (Caramel 150 EBC)',
    potentialSg: 1.033,
    colorEbc: 150.0,
    ratio: 1.0,
    type: 'caramel',
    description: 'Аналог Caramunich I-II-III (90-150 EBC). Глубокий карамельный тон, ноты ириски, сушеных яблок и выпечки.',
    tip: 'Прямая замена 1:1 для темных элей, боков, дуббелей и портеров.',
    isExactMatch: true
  },

  // Караарома / Караамбер
  'caraaroma': {
    kurskName: 'Курский Карамельный 250-300 (Caramel 300 EBC)',
    potentialSg: 1.033,
    colorEbc: 300.0,
    ratio: 1.0,
    type: 'caramel',
    description: 'Аналог Caraaroma / Special B. Интенсивный аромат жареной карамели, темного изюма и сухофруктов.',
    tip: 'Идеален для крепких монастырских элей, барливайнов и плотных сортов.',
    isExactMatch: true
  },

  // Спешиал Б
  'special_b': {
    kurskName: 'Курский Карамельный 300 (95%) + Курский Шоколадный (5%)',
    potentialSg: 1.032,
    colorEbc: 320.0,
    ratio: 1.0,
    type: 'caramel',
    description: 'Замена бельгийского Castle Malting Chateau Special B. Вкус чернослива, инжира, жареной корочки пирога.',
    tip: 'Добавление 5% Курского Шоколадного дает аутентичную темную винную терпкость Special B.',
    isExactMatch: false
  },

  // Меланоидиновый
  'melanoidin': {
    kurskName: 'Курский Меланоидиновый (Melanoidin 75 EBC)',
    potentialSg: 1.035,
    colorEbc: 75.0,
    ratio: 1.0,
    type: 'caramel',
    description: 'Прямой аналог Weyermann Melanoidin / Castle Chateau Melano. Имитирует традиционное отварочное затирание.',
    tip: 'Добавляет плотность, округлость и насыщенный медный цвет даже при инфузионном затирании.',
    isExactMatch: true
  },

  // Бисквит / Эмбер
  'biscuit': {
    kurskName: 'Курский Бисквитный (Biscuit / Amber 50 EBC)',
    potentialSg: 1.034,
    colorEbc: 50.0,
    ratio: 1.0,
    type: 'caramel',
    description: 'Аналог Chateau Biscuit / Amber Malt. Теплый бисквитно-хлебный аромат свежего печенья и тостов.',
    isExactMatch: true
  },

  // Кристаллический солод Crystal
  'crystal': {
    kurskName: 'Курский Шато Кристалл (Crystal 150 EBC)',
    potentialSg: 1.033,
    colorEbc: 150.0,
    ratio: 1.0,
    type: 'caramel',
    description: 'Прямой аналог Crystal 150 EBC / Chateau Crystal. Кристаллический карамельный солод для насыщенных биттеров и элей.',
    tip: 'Придает глубокий рубиново-медный цвет и выразительный карамельный профиль.',
    isExactMatch: true
  },

  // Несоложеный ячмень и ячменные хлопья
  'flaked_barley': {
    kurskName: 'Ячменные хлопья / Курский Пилснер',
    potentialSg: 1.032,
    colorEbc: 3.5,
    ratio: 1.0,
    type: 'adjunct',
    description: 'Аналог Flaked Barley. Несоложеный ячмень для стойкой сливочной шапки пены сухого стаута.',
    tip: 'Добавьте овсяные или ячменные хлопья прямо в затор для бархатистого тела.',
    isExactMatch: true
  },

  // Кислый солод
  'acidulated': {
    kurskName: 'Курский Кислый солод (Acid Malt)',
    potentialSg: 1.027,
    colorEbc: 4.5,
    ratio: 1.0,
    type: 'acid',
    description: 'Прямая замена Acidulated / Saurmalz для мягкого снижения pH затора до идеальных 5.2-5.4.',
    tip: 'Альтернатива: 1-2 мл пищевой молочной кислоты 80% на каждые 10 л затора.',
    isExactMatch: true
  },

  // Копченый солод
  'smoked': {
    kurskName: 'Курский Копченый (Smoked Malt)',
    potentialSg: 1.036,
    colorEbc: 6.0,
    ratio: 1.0,
    type: 'base',
    description: 'Прямой аналог Weyermann Rauchmalz. Окурен на буковой щепе для классических раухбиров.',
    isExactMatch: true
  },

  // Шоколадный солод
  'chocolate': {
    kurskName: 'Курский Шоколадный (Chocolate 900 EBC)',
    potentialSg: 1.028,
    colorEbc: 900.0,
    ratio: 1.0,
    type: 'roasted',
    description: 'Прямой аналог Chocolate Malt. Теплые оттенки горького шоколада, какао-бобов и мокко.',
    tip: 'Для портеров и стаутов прямая замена 1:1.',
    isExactMatch: true
  },

  // Жженый ячмень
  'roasted_barley': {
    kurskName: 'Курский Жженый солод / Жженый ячмень (1100 EBC)',
    potentialSg: 1.025,
    colorEbc: 1100.0,
    ratio: 1.0,
    type: 'roasted',
    description: 'Аналог Roasted Barley для ирландских сухих стаутов и РИС. Дает сухую кофейную жженку и непроницаемо черный цвет.',
    tip: 'Если хотите мягче без терпкости — засыпайте за 10 минут до конца затирания (на мэшаут).',
    isExactMatch: true
  },

  // Карафа / Черный
  'carafa': {
    kurskName: 'Курский Черный солод (Black Malt 1200 EBC)',
    potentialSg: 1.025,
    colorEbc: 1200.0,
    ratio: 0.95,
    type: 'roasted',
    description: 'Аналог Carafa Special / Black Malt. Дает глубокий цвет черного кофе без лишней терпкости.',
    tip: 'Поскольку Карафа Special декортикационная (без шелухи), Курский солод лучше перемолоть отдельно и внести при фильтрации, чтобы избежать резкой танинности.',
    isExactMatch: false
  },

  // Овсяные хлопья
  'flaked_oats': {
    kurskName: 'Курский Овсяный солод / Овсяные хлопья «Геркулес»',
    potentialSg: 1.034,
    colorEbc: 4.0,
    ratio: 1.0,
    type: 'adjunct',
    description: 'Курский овсяный солод или обычные овсяные хлопья быстрого приготовления заменяют Flaked Oats 1:1.',
    tip: 'Засыпайте прямо в затор вместе с базовым солодом, предварительно варить не нужно.',
    isExactMatch: true
  }
};

// 2. БАЗА АЛЬТЕРНАТИВ ХМЕЛЯ (ПОЛНЫЙ СЕТ)
export const HOP_ALTERNATIVES_MAP: Record<string, HopAlternativeInfo[]> = {
  'citra': [
    {
      name: 'Mosaic',
      alphaRange: '11.5 - 13.5%',
      flavorProfile: 'Тропики, спелая маракуйя, цитрус, черника',
      bestFor: 'both',
      similarity: 92,
      conversionNote: 'Замена 1:1 по массе (альфа близкая ~12%). Идеальная пара для NEIPA и APA.'
    },
    {
      name: 'Cascade + Centennial',
      alphaRange: '7.0 - 10.0%',
      flavorProfile: 'Грейпфрут, лимон, хвоя, цветы',
      bestFor: 'both',
      similarity: 88,
      conversionNote: 'Смесь 50/50 даст классический яркий цитрусовый букет американского эля.'
    },
    {
      name: 'Amarillo',
      alphaRange: '8.0 - 11.0%',
      flavorProfile: 'Сладкий апельсин, персик, абрикос, грейпфрут',
      bestFor: 'aroma',
      similarity: 86,
      conversionNote: 'Возьмите на 15-20% больше для компенсации чуть более низкой альфы.'
    },
    {
      name: 'Idaho 7',
      alphaRange: '12.0 - 14.0%',
      flavorProfile: 'Манго, абрикос, мармелад, хвоя',
      bestFor: 'both',
      similarity: 87,
      conversionNote: 'Замена 1:1 по массе, очень сочный тропический профиль.'
    }
  ],

  'mosaic': [
    {
      name: 'Citra',
      alphaRange: '12.0 - 14.0%',
      flavorProfile: 'Лайм, манго, тропики, сладкий грейпфрут',
      bestFor: 'both',
      similarity: 90,
      conversionNote: 'Замена 1:1 по массе. Идеальный соратник Mosaic.'
    },
    {
      name: 'Simcoe',
      alphaRange: '12.0 - 14.0%',
      flavorProfile: 'Маракуйя, сосновая смола, теплая земля',
      bestFor: 'both',
      similarity: 86,
      conversionNote: 'Замена 1:1, Simcoe добавит чуть больше хвойной смолистости.'
    },
    {
      name: 'Galaxy',
      alphaRange: '13.5 - 15.5%',
      flavorProfile: 'Спелый персик, маракуйя, гуава',
      bestFor: 'aroma',
      similarity: 88,
      conversionNote: 'Очень яркий фруктовый хмель, можно взять на 10% меньше.'
    },
    {
      name: 'Sabro',
      alphaRange: '13.0 - 15.0%',
      flavorProfile: 'Кокос, ананас, мандарин, сливки',
      bestFor: 'aroma',
      similarity: 82,
      conversionNote: 'Даст тропический акцент с яркой кокосовой нотой.'
    }
  ],

  'cascade': [
    {
      name: 'Centennial',
      alphaRange: '9.5 - 11.5%',
      flavorProfile: 'Супер-Каскад: цитрусовая цедра, сосна, цветы',
      bestFor: 'both',
      similarity: 95,
      conversionNote: 'Поскольку альфа Centennial выше (10% против 6%), на кипячение на горечь возьмите на 35% меньше!'
    },
    {
      name: 'Amarillo',
      alphaRange: '8.5 - 10.0%',
      flavorProfile: 'Апельсин, персик, цветочный цитрус',
      bestFor: 'aroma',
      similarity: 90,
      conversionNote: 'Отличная альтернатива для аромата и сухого охмеления.'
    },
    {
      name: 'Chinook',
      alphaRange: '12.0 - 14.0%',
      flavorProfile: 'Хвоя, пряный грейпфрут',
      bestFor: 'boil',
      similarity: 80,
      conversionNote: 'Использовать вдвое меньшую навеску из-за высокой альфы.'
    }
  ],

  'centennial': [
    {
      name: 'Cascade',
      alphaRange: '5.5 - 7.5%',
      flavorProfile: 'Грейпфрут, цветочный аромат',
      bestFor: 'aroma',
      similarity: 92,
      conversionNote: 'Для горечи увеличьте навеску в 1.5 раза из-за меньшей альфы.'
    },
    {
      name: 'Columbus / CTZ',
      alphaRange: '14.0 - 16.0%',
      flavorProfile: 'Смола, хвоя, пряности',
      bestFor: 'boil',
      similarity: 84,
      conversionNote: 'Уверенная чистая смолистая горечь.'
    },
    {
      name: 'Chinook',
      alphaRange: '12.0 - 14.0%',
      flavorProfile: 'Хвоя, грейпфрут, смола',
      bestFor: 'both',
      similarity: 88,
      conversionNote: 'Замена 1:1 по массе.'
    }
  ],

  'simcoe': [
    {
      name: 'Columbus / CTZ',
      alphaRange: '14.0 - 16.0%',
      flavorProfile: 'Сосновая смола, пряности, земля',
      bestFor: 'both',
      similarity: 88,
      conversionNote: 'Замена 1:1 на горечь и вирпул.'
    },
    {
      name: 'Chinook',
      alphaRange: '12.0 - 14.0%',
      flavorProfile: 'Густая сосна, грейпфрут',
      bestFor: 'both',
      similarity: 86,
      conversionNote: 'Замена 1:1 по массе.'
    },
    {
      name: 'Mosaic',
      alphaRange: '11.5 - 13.0%',
      flavorProfile: 'Тропики, черника, хвоя',
      bestFor: 'aroma',
      similarity: 85,
      conversionNote: 'Идеален для сухого охмеления вместо Simcoe.'
    }
  ],

  'amarillo': [
    {
      name: 'Cascade',
      alphaRange: '5.5 - 7.0%',
      flavorProfile: 'Цветочный цитрус, грейпфрут',
      bestFor: 'both',
      similarity: 90,
      conversionNote: 'Для аналогичной горечи увеличьте навеску на 25%.'
    },
    {
      name: 'Centennial',
      alphaRange: '9.5 - 11.5%',
      flavorProfile: 'Лимон, апельсин, сосна',
      bestFor: 'both',
      similarity: 88,
      conversionNote: 'Замена 1:1 по массе.'
    },
    {
      name: 'Citra',
      alphaRange: '12.0 - 14.0%',
      flavorProfile: 'Манго, лайм, сладкий цитрус',
      bestFor: 'aroma',
      similarity: 86,
      conversionNote: 'Ярче и насыщеннее, можно взять на 15% меньше.'
    }
  ],

  'chinook': [
    {
      name: 'Columbus / CTZ',
      alphaRange: '14.0 - 16.0%',
      flavorProfile: 'Смола, хвоя, перец',
      bestFor: 'both',
      similarity: 90,
      conversionNote: 'Замена 1:1 по массе.'
    },
    {
      name: 'Northern Brewer',
      alphaRange: '8.5 - 10.5%',
      flavorProfile: 'Древесный, мятный, смолистый',
      bestFor: 'boil',
      similarity: 84,
      conversionNote: 'Увеличьте массу на 30% для компенсации альфы.'
    },
    {
      name: 'Nugget',
      alphaRange: '12.5 - 14.5%',
      flavorProfile: 'Травянистый, смолистый, пряный',
      bestFor: 'boil',
      similarity: 87,
      conversionNote: 'Замена 1:1 на кипячение.'
    }
  ],

  'columbus': [
    {
      name: 'Magnum',
      alphaRange: '13.0 - 15.0%',
      flavorProfile: 'Чистая округлая горечь',
      bestFor: 'boil',
      similarity: 92,
      conversionNote: 'Замена 1:1 на 60 минут кипячения.'
    },
    {
      name: 'Nugget',
      alphaRange: '13.0 - 15.0%',
      flavorProfile: 'Травянистая чистая горечь',
      bestFor: 'boil',
      similarity: 94,
      conversionNote: 'Замена 1:1 по массе.'
    },
    {
      name: 'Chinook',
      alphaRange: '12.0 - 14.0%',
      flavorProfile: 'Смола, сосна, грейпфрут',
      bestFor: 'both',
      similarity: 88,
      conversionNote: 'Замена 1:1 по массе.'
    }
  ],

  'saaz': [
    {
      name: 'Tettnanger',
      alphaRange: '3.5 - 5.0%',
      flavorProfile: 'Благородный цветочно-травяной, нежный пряный',
      bestFor: 'both',
      similarity: 94,
      conversionNote: 'Замена 1:1. Традиционный немецкий благородный сорт.'
    },
    {
      name: 'Hallertau Mittelfrüh',
      alphaRange: '3.5 - 4.5%',
      flavorProfile: 'Цветочный, легкий пряный, лагерный',
      bestFor: 'both',
      similarity: 92,
      conversionNote: 'Замена 1:1 по массе.'
    },
    {
      name: 'Подвязный / Истринский (Чувашия, РФ)',
      alphaRange: '3.8 - 5.5%',
      flavorProfile: 'Травянистый, луговой, традиционный благородный',
      bestFor: 'both',
      similarity: 90,
      conversionNote: 'Отечественные чувашские благородные сорта. Прямая замена 1:1!'
    },
    {
      name: 'Lubelski (Любельский)',
      alphaRange: '3.5 - 4.5%',
      flavorProfile: 'Польский потомок Жатецкого, магнолия, травы',
      bestFor: 'both',
      similarity: 95,
      conversionNote: 'Генетический клон Saaz, прямая замена 1:1.'
    }
  ],

  'hallertau': [
    {
      name: 'Tettnanger',
      alphaRange: '3.5 - 5.0%',
      flavorProfile: 'Цветочный, тонкий пряный, травяной',
      bestFor: 'both',
      similarity: 95,
      conversionNote: 'Идеальная замена 1:1 для баварских лагеров и вайценов.'
    },
    {
      name: 'Saaz (Жатецкий)',
      alphaRange: '3.2 - 4.2%',
      flavorProfile: 'Травянистый, нежно-пряный',
      bestFor: 'both',
      similarity: 92,
      conversionNote: 'Замена 1:1.'
    },
    {
      name: 'Perle',
      alphaRange: '7.0 - 9.0%',
      flavorProfile: 'Мята, пряности, благородный немецкий',
      bestFor: 'boil',
      similarity: 86,
      conversionNote: 'Так как альфа Perle вдвое выше (8% против 4%), на кип берите ровно вдвое меньше!'
    },
    {
      name: 'Подвязный (Россия)',
      alphaRange: '4.0 - 5.5%',
      flavorProfile: 'Благородный луговой цветочно-травяной',
      bestFor: 'both',
      similarity: 89,
      conversionNote: 'Отечественный благородный аналог. Замена 1:1.'
    }
  ],

  'tettnanger': [
    {
      name: 'Saaz (Жатецкий)',
      alphaRange: '3.5 - 4.2%',
      flavorProfile: 'Мягкий травяной, благородный пряный',
      bestFor: 'both',
      similarity: 95,
      conversionNote: 'Замена 1:1.'
    },
    {
      name: 'Hallertau Mittelfrüh',
      alphaRange: '3.5 - 4.5%',
      flavorProfile: 'Цветочный, свежий луговой',
      bestFor: 'both',
      similarity: 95,
      conversionNote: 'Замена 1:1.'
    },
    {
      name: 'Spalt Select',
      alphaRange: '4.0 - 5.5%',
      flavorProfile: 'Землистый, пряный, древесный',
      bestFor: 'both',
      similarity: 90,
      conversionNote: 'Замена 1:1.'
    }
  ],

  'magnum': [
    {
      name: 'Columbus / CTZ',
      alphaRange: '14.0 - 16.0%',
      flavorProfile: 'Мощная чистая горечь',
      bestFor: 'boil',
      similarity: 92,
      conversionNote: 'Замена 1:1 на 60 минут кипячения (альфа одинаковая ~14-15%).'
    },
    {
      name: 'Nugget',
      alphaRange: '13.0 - 15.0%',
      flavorProfile: 'Травянистая чистая базовая горечь',
      bestFor: 'boil',
      similarity: 94,
      conversionNote: 'Отличная замена 1:1 по массе.'
    },
    {
      name: 'Northern Brewer',
      alphaRange: '8.5 - 10.5%',
      flavorProfile: 'Хвойный, древесный, округлая горечь',
      bestFor: 'boil',
      similarity: 85,
      conversionNote: 'Из-за меньшей альфы увеличьте навеску на 30-40%.'
    },
    {
      name: 'Herkules',
      alphaRange: '14.0 - 17.0%',
      flavorProfile: 'Чистейшая нейтральная горечь',
      bestFor: 'boil',
      similarity: 95,
      conversionNote: 'Прямая замена 1:1 на начало кипячения.'
    }
  ],

  'perle': [
    {
      name: 'Northern Brewer',
      alphaRange: '8.5 - 10.5%',
      flavorProfile: 'Мята, хвоя, смола',
      bestFor: 'both',
      similarity: 92,
      conversionNote: 'Замена 1:1 по массе.'
    },
    {
      name: 'Hallertau Mittelfrüh',
      alphaRange: '3.5 - 4.5%',
      flavorProfile: 'Цветочный, пряный благородный',
      bestFor: 'aroma',
      similarity: 88,
      conversionNote: 'На аромат замена 1:1. На горечь удвойте навеску.'
    },
    {
      name: 'Magnum',
      alphaRange: '13.0 - 15.0%',
      flavorProfile: 'Чистая базовая горечь',
      bestFor: 'boil',
      similarity: 86,
      conversionNote: 'На кипячение возьмите на 40% меньше.'
    }
  ],

  'east_kent_goldings': [
    {
      name: 'Fuggle',
      alphaRange: '4.0 - 5.5%',
      flavorProfile: 'Древесный, землистый, чайный традиционный',
      bestFor: 'both',
      similarity: 92,
      conversionNote: 'Главная пара классического английского пивоварения. Замена 1:1.'
    },
    {
      name: 'Willamette',
      alphaRange: '4.5 - 6.0%',
      flavorProfile: 'Пряный, цветочный, травяной',
      bestFor: 'both',
      similarity: 90,
      conversionNote: 'Американский потомок Fuggle, замена 1:1.'
    },
    {
      name: 'Styrian Goldings (Бобек / Целея)',
      alphaRange: '4.5 - 6.0%',
      flavorProfile: 'Смолистый, землистый, нежный цветочный',
      bestFor: 'both',
      similarity: 94,
      conversionNote: 'Словенский клон Фуггл/Голдингс. Замена 1:1.'
    }
  ],

  'fuggle': [
    {
      name: 'East Kent Goldings',
      alphaRange: '4.5 - 6.0%',
      flavorProfile: 'Лаванда, специи, мед, травы',
      bestFor: 'both',
      similarity: 92,
      conversionNote: 'Замена 1:1.'
    },
    {
      name: 'Willamette',
      alphaRange: '4.5 - 6.0%',
      flavorProfile: 'Древесный, мягкий пряный',
      bestFor: 'both',
      similarity: 95,
      conversionNote: 'Прямая замена 1:1.'
    },
    {
      name: 'Styrian Goldings',
      alphaRange: '4.5 - 6.0%',
      flavorProfile: 'Травянисто-пряный с легкой смолой',
      bestFor: 'both',
      similarity: 90,
      conversionNote: 'Замена 1:1.'
    }
  ],

  'northern_brewer': [
    {
      name: 'Perle',
      alphaRange: '7.5 - 9.5%',
      flavorProfile: 'Мята, сосна, пряности',
      bestFor: 'both',
      similarity: 90,
      conversionNote: 'Замена 1:1 по массе.'
    },
    {
      name: 'Magnum',
      alphaRange: '13.0 - 15.0%',
      flavorProfile: 'Чистая горечь',
      bestFor: 'boil',
      similarity: 86,
      conversionNote: 'На кип возьмите на 30% меньше.'
    },
    {
      name: 'Chinook',
      alphaRange: '12.0 - 14.0%',
      flavorProfile: 'Хвойный, смолистый',
      bestFor: 'boil',
      similarity: 84,
      conversionNote: 'Возьмите на 25% меньше из-за более высокой альфы.'
    }
  ],

  'galaxy': [
    {
      name: 'Citra',
      alphaRange: '12.0 - 14.0%',
      flavorProfile: 'Тропики, манго, спелый лайм',
      bestFor: 'aroma',
      similarity: 88,
      conversionNote: 'Замена 1:1 по массе.'
    },
    {
      name: 'Mosaic',
      alphaRange: '11.5 - 13.0%',
      flavorProfile: 'Маракуйя, черника, персик',
      bestFor: 'aroma',
      similarity: 86,
      conversionNote: 'Замена 1:1.'
    },
    {
      name: 'Nelson Sauvin',
      alphaRange: '11.5 - 13.0%',
      flavorProfile: 'Белый виноград, крыжовник, свежие тропики',
      bestFor: 'aroma',
      similarity: 85,
      conversionNote: 'Очень яркий новозеландский сорт.'
    },
    {
      name: 'Vic Secret',
      alphaRange: '14.0 - 16.0%',
      flavorProfile: 'Ананас, сосна, маракуйя',
      bestFor: 'both',
      similarity: 92,
      conversionNote: 'Австралийский собрат Galaxy, замена 1:1.'
    }
  ],

  'nelson_sauvin': [
    {
      name: 'Hallertau Blanc',
      alphaRange: '9.0 - 11.0%',
      flavorProfile: 'Белое вино, бузина, крыжовник',
      bestFor: 'aroma',
      similarity: 90,
      conversionNote: 'Европейский аналог винного профиля Nelson Sauvin. Замена 1:1.'
    },
    {
      name: 'Galaxy',
      alphaRange: '13.5 - 15.0%',
      flavorProfile: 'Тропики, маракуйя',
      bestFor: 'aroma',
      similarity: 84,
      conversionNote: 'Замена 1:1.'
    },
    {
      name: 'Motueka',
      alphaRange: '6.5 - 7.5%',
      flavorProfile: 'Свежий лайм, тропические фрукты',
      bestFor: 'aroma',
      similarity: 82,
      conversionNote: 'Новозеландский сорт, увеличьте навеску на 30%.'
    }
  ],

  'sabro': [
    {
      name: 'Mosaic',
      alphaRange: '11.5 - 13.0%',
      flavorProfile: 'Тропики, черника, персик',
      bestFor: 'both',
      similarity: 82,
      conversionNote: 'Замена 1:1 по массе.'
    },
    {
      name: 'Talus (HBC 692)',
      alphaRange: '8.0 - 10.0%',
      flavorProfile: 'Розовый грейпфрут, сухие розы, сосна, кокос',
      bestFor: 'aroma',
      similarity: 88,
      conversionNote: 'Дочерний сорт Sabro, идеальная замена для сухого охмеления.'
    },
    {
      name: 'Idaho 7',
      alphaRange: '12.0 - 14.0%',
      flavorProfile: 'Абрикос, мармелад, хвоя',
      bestFor: 'both',
      similarity: 80,
      conversionNote: 'Замена 1:1.'
    }
  ],

  'idaho_7': [
    {
      name: 'Citra',
      alphaRange: '12.0 - 14.0%',
      flavorProfile: 'Манго, лайм, грейпфрут',
      bestFor: 'both',
      similarity: 88,
      conversionNote: 'Замена 1:1 по массе.'
    },
    {
      name: 'El Dorado',
      alphaRange: '13.0 - 15.0%',
      flavorProfile: 'Груша, арбуз, ананас, косточковые фрукты',
      bestFor: 'both',
      similarity: 86,
      conversionNote: 'Замена 1:1.'
    },
    {
      name: 'Azacca',
      alphaRange: '11.0 - 13.0%',
      flavorProfile: 'Манго, папайя, пряный цитрус',
      bestFor: 'both',
      similarity: 85,
      conversionNote: 'Замена 1:1.'
    }
  ],

  'el_dorado': [
    {
      name: 'Citra',
      alphaRange: '12.0 - 14.0%',
      flavorProfile: 'Тропики, цитрус',
      bestFor: 'both',
      similarity: 86,
      conversionNote: 'Замена 1:1.'
    },
    {
      name: 'Azacca',
      alphaRange: '11.0 - 13.0%',
      flavorProfile: 'Тропические фрукты, груша',
      bestFor: 'both',
      similarity: 90,
      conversionNote: 'Замена 1:1.'
    },
    {
      name: 'Galaxy',
      alphaRange: '13.5 - 15.0%',
      flavorProfile: 'Маракуйя, персик',
      bestFor: 'aroma',
      similarity: 88,
      conversionNote: 'Замена 1:1.'
    }
  ],

  'motueka': [
    {
      name: 'Saaz (Жатецкий)',
      alphaRange: '3.5 - 4.5%',
      flavorProfile: 'Травянистый, нежно-пряный',
      bestFor: 'both',
      similarity: 85,
      conversionNote: 'Motueka выведена на основе Saaz. Замена 1:1.'
    },
    {
      name: 'Cascade',
      alphaRange: '5.5 - 7.5%',
      flavorProfile: 'Лайм, грейпфрут',
      bestFor: 'aroma',
      similarity: 82,
      conversionNote: 'Замена 1:1.'
    }
  ],

  'подвязный': [
    {
      name: 'Saaz (Жатецкий)',
      alphaRange: '3.5 - 4.2%',
      flavorProfile: 'Благородный пряный, травяной',
      bestFor: 'both',
      similarity: 92,
      conversionNote: 'Классический чешский аналог. Замена 1:1.'
    },
    {
      name: 'Hallertau Mittelfrüh',
      alphaRange: '3.5 - 4.5%',
      flavorProfile: 'Цветочный, мягкий пряный',
      bestFor: 'both',
      similarity: 90,
      conversionNote: 'Немецкий благородный сорт. Замена 1:1.'
    },
    {
      name: 'Истринский (РФ)',
      alphaRange: '4.0 - 5.0%',
      flavorProfile: 'Цветочно-луговой, хмелевой',
      bestFor: 'both',
      similarity: 95,
      conversionNote: 'Родственный чувашский благородный хмель. Замена 1:1.'
    }
  ]
};

/**
 * Проверка, является ли солод уже Курским
 */
export function isKurskMalt(grainName: string): boolean {
  const lower = grainName.toLowerCase();
  // Если это старая заглушка "по цветности", она не является нормальным Курским солодом
  if (lower.includes('по цветности')) {
    return false;
  }
  return lower.includes('курск') || lower.includes('kursk');
}

/**
 * Поиск аналога Курского солода по названию ингредиента, типу и цветности EBC
 */
export function getKurskMaltSubstitute(
  grainName: string,
  grainType?: GrainType,
  colorEbc?: number
): KurskSubstituteInfo | null {
  const lower = grainName.toLowerCase();

  // Если это уже полноценный Курский солод, не предлагаем заменить его на самого себя
  if (isKurskMalt(grainName)) {
    return null;
  }

  // 1. СПЕЦИАЛЬНЫЕ / КАРАМЕЛЬНЫЕ СОЛОДА (ПРОВЕРЯЕМ ПЕРВЫМИ, ЧТОБЫ НЕ СРЕЗАТЬСЯ НА ПОДСТРОКАХ PILSNER ИЛИ MUNICH!)
  // Carapils / Carafoam / Dextrin / Карапилс
  if (
    lower.includes('carapils') ||
    lower.includes('carafoam') ||
    lower.includes('dextrin') ||
    lower.includes('карапилс') ||
    lower.includes('карафом') ||
    lower.includes('декстрин')
  ) {
    return KURSK_MALT_MAP['carapils'];
  }

  // Caramunich / Карамюнхен
  if (
    lower.includes('caramunich') ||
    lower.includes('карамюнхен') ||
    lower.includes('кара 150') ||
    lower.includes('cara 150') ||
    lower.includes('cara 120') ||
    lower.includes('cara 90')
  ) {
    return KURSK_MALT_MAP['caramunich'];
  }

  // Carahell / Карахелль
  if (lower.includes('carahell') || lower.includes('карахел')) {
    return KURSK_MALT_MAP['carahell'];
  }

  // Carared / Chateau Red / Караред
  if (lower.includes('carared') || lower.includes('караред') || lower.includes('chateau red')) {
    return KURSK_MALT_MAP['carared'];
  }

  // Caraaroma / Caraamber / Караарома
  if (lower.includes('caraaroma') || lower.includes('караарома') || lower.includes('caraamber') || lower.includes('караамбер')) {
    return KURSK_MALT_MAP['caraaroma'];
  }

  // Special B / Спешиал Б
  if (lower.includes('special b') || lower.includes('спешиал') || lower.includes('спесиал')) {
    return KURSK_MALT_MAP['special_b'];
  }

  // Crystal / Chateau Crystal / Кристалл
  if (lower.includes('crystal') || lower.includes('кристалл') || lower.includes('кристал')) {
    return KURSK_MALT_MAP['crystal'];
  }

  // Melanoidin / Меланоидиновый
  if (lower.includes('melanoidin') || lower.includes('меланоидин') || lower.includes('melano') || lower.includes('мелано')) {
    return KURSK_MALT_MAP['melanoidin'];
  }

  // Biscuit / Amber / Бисквитный
  if (lower.includes('biscuit') || lower.includes('бисквит') || lower.includes('amber') || lower.includes('эмбер')) {
    return KURSK_MALT_MAP['biscuit'];
  }

  // 2. ЖЖЕНЫЕ И ТЕМНЫЕ СОЛОДА
  // Carafa / Карафа / Black / Черный
  if (lower.includes('carafa') || lower.includes('карафа') || lower.includes('black') || lower.includes('черный')) {
    return KURSK_MALT_MAP['carafa'];
  }
  // Chocolate / Шоколадный
  if (lower.includes('chocolate') || lower.includes('шоколад')) {
    return KURSK_MALT_MAP['chocolate'];
  }
  // Roasted Barley / Жженый
  if (lower.includes('roasted') || lower.includes('жжен') || lower.includes('роастед')) {
    return KURSK_MALT_MAP['roasted_barley'];
  }

  // 3. ПШЕНИЧНЫЕ СОЛОДА
  if (lower.includes('dark wheat') || lower.includes('темный пшенич')) {
    return KURSK_MALT_MAP['dark_wheat'];
  }
  if (lower.includes('wheat') || lower.includes('пшенич') || lower.includes('weizen')) {
    return KURSK_MALT_MAP['wheat'];
  }

  // 4. НЕСОЛОЖЕНКА, ХЛОПЬЯ И ЗЕРНОВЫЕ
  if (
    lower.includes('flaked barley') ||
    lower.includes('ячменные хлоп') ||
    lower.includes('ячменных хлоп') ||
    lower.includes('несоложеный ячмень') ||
    lower.includes('несоложенка')
  ) {
    return KURSK_MALT_MAP['flaked_barley'];
  }
  if (lower.includes('oat') || lower.includes('овес') || lower.includes('овсян') || lower.includes('геркулес')) {
    return KURSK_MALT_MAP['flaked_oats'];
  }
  if (lower.includes('rye') || lower.includes('ржан')) {
    return KURSK_MALT_MAP['rye'];
  }

  // 5. КИСЛЫЙ И КОПЧЕНЫЙ
  if (lower.includes('acid') || lower.includes('кислый') || lower.includes('saurmalz')) {
    return KURSK_MALT_MAP['acidulated'];
  }
  if (lower.includes('smoked') || lower.includes('rauch') || lower.includes('копчен')) {
    return KURSK_MALT_MAP['smoked'];
  }

  // 6. БАЗОВЫЕ СОЛОДА (ПРОВЕРЯЕМ ПОСЛЕ СПЕЦИАЛЬНЫХ!)
  if (lower.includes('maris otter') || lower.includes('мэрис') || lower.includes('марис')) {
    return KURSK_MALT_MAP['maris_otter'];
  }
  if (lower.includes('golden promise') || lower.includes('голден промис')) {
    return KURSK_MALT_MAP['golden_promise'];
  }
  if (lower.includes('vienna') || lower.includes('венский')) {
    return KURSK_MALT_MAP['vienna'];
  }
  if (!lower.includes('caramunich') && !lower.includes('карамюнхен') && (lower.includes('munich') || lower.includes('мюнхен'))) {
    return KURSK_MALT_MAP['munich'];
  }
  if (lower.includes('pale ale') || lower.includes('пэйл') || lower.includes('пейл') || lower.includes('пэйлель') || lower.includes('ale malt')) {
    return KURSK_MALT_MAP['pale_ale'];
  }
  if (
    !lower.includes('carapils') &&
    !lower.includes('карапилс') &&
    (lower.includes('pilsner') ||
      lower.includes('пилснер') ||
      lower.includes('pils') ||
      lower.includes('пилс') ||
      lower.includes('extra pale') ||
      lower.includes('экстра светлый') ||
      lower.includes('lager') ||
      lower.includes('лагер') ||
      lower.includes('светлый ячменный') ||
      lower.includes('базовый'))
  ) {
    return KURSK_MALT_MAP['pilsner'];
  }

  // 7. УМНЫЙ ФОЛЛБЭК: ВСЕГДА ВЫБИРАЕМ КОНКРЕТНЫЙ РЕАЛЬНЫЙ КУРСКИЙ СОЛОД ПО ТИПУ И EBC (НИКАКИХ НЕОПРЕДЕЛЕННЫХ ЗАГЛУШЕК!)
  const effType = grainType || (lower.includes('карамель') || lower.includes('caramel') ? 'caramel' : 'base');
  const effEbc = colorEbc !== undefined && colorEbc > 0 ? colorEbc : 6.0;

  if (effType === 'roasted' || effEbc >= 500) {
    return effEbc >= 1000 ? KURSK_MALT_MAP['roasted_barley'] : KURSK_MALT_MAP['chocolate'];
  }
  if (effType === 'caramel' || effEbc > 20) {
    if (effEbc >= 250) return KURSK_MALT_MAP['caraaroma'];
    if (effEbc >= 100) return KURSK_MALT_MAP['caramunich'];
    if (effEbc >= 60) return KURSK_MALT_MAP['melanoidin'];
    return KURSK_MALT_MAP['carahell'];
  }
  if (effType === 'wheat') {
    return effEbc > 10 ? KURSK_MALT_MAP['dark_wheat'] : KURSK_MALT_MAP['wheat'];
  }
  if (effType === 'acid') {
    return KURSK_MALT_MAP['acidulated'];
  }
  if (effType === 'adjunct') {
    return KURSK_MALT_MAP['flaked_oats'];
  }

  // Базовый фоллбэк
  if (effEbc >= 15) return KURSK_MALT_MAP['munich'];
  if (effEbc >= 7) return KURSK_MALT_MAP['vienna'];
  return KURSK_MALT_MAP['pilsner'];
}

/**
 * Нормализация и автокоррекция параметров солода:
 * - Устраняет рассинхрон типа (например, если солод Пилснер или Мюнхенский ошибочно числился 'caramel')
 * - Заменяет устаревшие временные заглушки на полноценный Курский солод
 */
export function normalizeGrain(grain: GrainItem): GrainItem {
  const lower = grain.name.toLowerCase();

  // Если попалась устаревшая заглушка "по цветности"
  if (lower.includes('по цветности')) {
    const sub = getKurskMaltSubstitute('Crystal 150', grain.type, grain.colorEbc) || KURSK_MALT_MAP['crystal'];
    return {
      ...grain,
      name: sub.kurskName,
      potentialSg: sub.potentialSg,
      colorEbc: sub.colorEbc,
      type: sub.type
    };
  }

  // Базовые солода не должны иметь тип 'caramel' или 'roasted'
  const isBaseName =
    (lower.includes('пилснер') ||
      lower.includes('pilsner') ||
      lower.includes('пэйл') ||
      lower.includes('pale') ||
      lower.includes('венский') ||
      lower.includes('vienna') ||
      lower.includes('мюнхен') ||
      lower.includes('munich')) &&
    !lower.includes('кара') &&
    !lower.includes('cara');

  if (isBaseName && (grain.type === 'caramel' || grain.type === 'roasted')) {
    return { ...grain, type: 'base' };
  }

  // Карамельные солода не должны иметь тип 'base'
  const isCaramelName =
    lower.includes('карамель') ||
    lower.includes('десертный') ||
    lower.includes('кристалл') ||
    lower.includes('caramel') ||
    lower.includes('crystal') ||
    lower.includes('carapils') ||
    lower.includes('caramunich') ||
    lower.includes('carahell') ||
    lower.includes('carared') ||
    lower.includes('caraaroma') ||
    lower.includes('special b') ||
    lower.includes('спешиал');

  if (isCaramelName && grain.type === 'base') {
    return { ...grain, type: 'caramel' };
  }

  return grain;
}

/**
 * Поиск альтернативных хмелей по названию
 */
export function getHopAlternatives(hopName: string): HopAlternativeInfo[] {
  const lower = hopName.toLowerCase();

  for (const [key, alts] of Object.entries(HOP_ALTERNATIVES_MAP)) {
    if (lower.includes(key)) {
      return alts;
    }
  }

  // Специальные сопоставления по синонимам и подтипам
  if (lower.includes('ctz') || lower.includes('tomahawk') || lower.includes('zeus')) {
    return HOP_ALTERNATIVES_MAP['columbus'];
  }
  if (lower.includes('жатецк') || lower.includes('saaz')) {
    return HOP_ALTERNATIVES_MAP['saaz'];
  }
  if (lower.includes('mittelfr') || lower.includes('халдертау') || lower.includes('халлертау')) {
    return HOP_ALTERNATIVES_MAP['hallertau'];
  }
  if (lower.includes('тетнанг') || lower.includes('tettnang')) {
    return HOP_ALTERNATIVES_MAP['tettnanger'];
  }
  if (lower.includes('магнум')) {
    return HOP_ALTERNATIVES_MAP['magnum'];
  }
  if (lower.includes('перле')) {
    return HOP_ALTERNATIVES_MAP['perle'];
  }
  if (lower.includes('каскад') || lower.includes('cascade')) {
    return HOP_ALTERNATIVES_MAP['cascade'];
  }
  if (lower.includes('мозаик') || lower.includes('мозаика')) {
    return HOP_ALTERNATIVES_MAP['mosaic'];
  }
  if (lower.includes('цитра') || lower.includes('ситра')) {
    return HOP_ALTERNATIVES_MAP['citra'];
  }
  if (lower.includes('симко')) {
    return HOP_ALTERNATIVES_MAP['simcoe'];
  }
  if (lower.includes('чинук')) {
    return HOP_ALTERNATIVES_MAP['chinook'];
  }
  if (lower.includes('амарилло') || lower.includes('амарило')) {
    return HOP_ALTERNATIVES_MAP['amarillo'];
  }
  if (lower.includes('гэлакси') || lower.includes('галакси')) {
    return HOP_ALTERNATIVES_MAP['galaxy'];
  }
  if (lower.includes('голдинг') || lower.includes('golding')) {
    return HOP_ALTERNATIVES_MAP['east_kent_goldings'];
  }
  if (lower.includes('фаггл') || lower.includes('фуггл') || lower.includes('fuggle')) {
    return HOP_ALTERNATIVES_MAP['fuggle'];
  }
  if (lower.includes('норсен') || lower.includes('норзен')) {
    return HOP_ALTERNATIVES_MAP['northern_brewer'];
  }

  // Общие универсальные альтернативы для редких или неизвестных хмелей
  return [
    {
      name: 'Magnum (на горечь)',
      alphaRange: '13.0 - 15.0%',
      flavorProfile: 'Универсальная чистая горечь для 60 мин кипячения',
      bestFor: 'boil',
      similarity: 85,
      conversionNote: 'Используйте на 60 мин. Пересчитайте массу по альфе.'
    },
    {
      name: 'Cascade / Centennial (на аромат)',
      alphaRange: '6.5 - 10.0%',
      flavorProfile: 'Яркий цитрусово-цветочный букет',
      bestFor: 'aroma',
      similarity: 80,
      conversionNote: 'Используйте за 15-0 мин до конца кипячения или на сухое охмеление.'
    },
    {
      name: 'Saaz / Tettnanger (для лагеров)',
      alphaRange: '3.5 - 4.5%',
      flavorProfile: 'Традиционный европейский травянисто-цветочный лагерный профиль',
      bestFor: 'both',
      similarity: 82,
      conversionNote: 'Идеален для классических светлых и темных лагеров, пилснеров и вайценов.'
    }
  ];
}
