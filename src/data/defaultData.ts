import { CommunityPost, InventoryItem, Lifehack, Recipe } from '../types/brewing';
import { calculateBrewMetrics } from '../utils/brewingMath';

export const COMMON_GRAINS = [
  { name: 'Pilsner Malt (Пилснер)', potentialSg: 1.037, colorEbc: 3.5, type: 'base' as const },
  { name: 'Pale Ale Malt (Пэйл Эль)', potentialSg: 1.038, colorEbc: 6.0, type: 'base' as const },
  { name: 'Vienna Malt (Венский)', potentialSg: 1.036, colorEbc: 8.0, type: 'base' as const },
  { name: 'Munich I (Мюнхенский светлый)', potentialSg: 1.036, colorEbc: 15.0, type: 'base' as const },
  { name: 'Munich II (Мюнхенский темный)', potentialSg: 1.035, colorEbc: 25.0, type: 'base' as const },
  { name: 'Wheat Malt (Пшеничный светлый)', potentialSg: 1.038, colorEbc: 4.0, type: 'wheat' as const },
  { name: 'Dark Wheat Malt (Пшеничный темный)', potentialSg: 1.037, colorEbc: 17.0, type: 'wheat' as const },
  { name: 'Carapils / Carafoam (Карапилс)', potentialSg: 1.033, colorEbc: 4.5, type: 'caramel' as const },
  { name: 'Carared (Караред)', potentialSg: 1.034, colorEbc: 50.0, type: 'caramel' as const },
  { name: 'Caramunich II (Карамюнхен)', potentialSg: 1.034, colorEbc: 120.0, type: 'caramel' as const },
  { name: 'Caraaroma (Караарома)', potentialSg: 1.033, colorEbc: 350.0, type: 'caramel' as const },
  { name: 'Special B (Спешиал Б)', potentialSg: 1.032, colorEbc: 300.0, type: 'caramel' as const },
  { name: 'Chocolate Malt (Шоколадный)', potentialSg: 1.028, colorEbc: 900.0, type: 'roasted' as const },
  { name: 'Roasted Barley (Жженый ячмень)', potentialSg: 1.025, colorEbc: 1100.0, type: 'roasted' as const },
  { name: 'Carafa Special III (Карафа 3 без горечи)', potentialSg: 1.028, colorEbc: 1400.0, type: 'roasted' as const },
  { name: 'Flaked Oats (Овсяные хлопья)', potentialSg: 1.032, colorEbc: 2.0, type: 'adjunct' as const },
  { name: 'Flaked Barley (Ячменные хлопья)', potentialSg: 1.032, colorEbc: 3.5, type: 'adjunct' as const },
  { name: 'Acidulated Malt (Кислый солод для pH)', potentialSg: 1.027, colorEbc: 4.5, type: 'acid' as const }
];

export const COMMON_HOPS = [
  { name: 'Citra', alphaAcid: 12.5, profile: 'Тропические фрукты, грейпфрут, лайм' },
  { name: 'Mosaic', alphaAcid: 12.0, profile: 'Черника, манго, цитрусы, хвоя' },
  { name: 'Cascade', alphaAcid: 6.0, profile: 'Грейпфрут, цветочный, пряный' },
  { name: 'Centennial', alphaAcid: 10.0, profile: 'Лимон, сосна, цветочный' },
  { name: 'Simcoe', alphaAcid: 13.0, profile: 'Сосновая смола, маракуйя, земляные ноты' },
  { name: 'Amarillo', alphaAcid: 9.0, profile: 'Сладкий апельсин, абрикос, персик' },
  { name: 'Galaxy', alphaAcid: 14.5, profile: 'Персик, маракуйя, цитрусы' },
  { name: 'Saaz (Жатецкий)', alphaAcid: 3.5, profile: 'Благородный, травянистый, нежный пряный' },
  { name: 'Hallertau Mittelfrüh', alphaAcid: 4.0, profile: 'Нежный цветочный, благородный немецкий' },
  { name: 'Tettnanger', alphaAcid: 4.5, profile: 'Цветочно-пряный, травяной' },
  { name: 'Magnum', alphaAcid: 14.0, profile: 'Чистая мягкая горечь без резкости' },
  { name: 'Northern Brewer', alphaAcid: 9.0, profile: 'Древесный, хвойный, мятный' },
  { name: 'East Kent Goldings', alphaAcid: 5.0, profile: 'Классический английский, землистый, лаванда' },
  { name: 'Fuggle', alphaAcid: 4.5, profile: 'Английский землистый, древесный, чайный' }
];

export const COMMON_YEASTS = [
  {
    name: 'SafAle US-05',
    lab: 'Fermentis',
    form: 'dry' as const,
    type: 'ale' as const,
    cellsPerGramOrVial: 20,
    attenuationPercent: 81,
    tempRange: [18, 26] as [number, number],
    styleDescription: 'Самый популярный американский нейтральный штамм. Дает раскрыться хмелю.'
  },
  {
    name: 'SafAle S-04',
    lab: 'Fermentis',
    form: 'dry' as const,
    type: 'ale' as const,
    cellsPerGramOrVial: 20,
    attenuationPercent: 75,
    tempRange: [15, 20] as [number, number],
    styleDescription: 'Английский элевый штамм с быстрой флокуляцией и мягкими фруктовыми эфирами.'
  },
  {
    name: 'SafLager W-34/70',
    lab: 'Fermentis',
    form: 'dry' as const,
    type: 'lager' as const,
    cellsPerGramOrVial: 20,
    attenuationPercent: 83,
    tempRange: [9, 15] as [number, number],
    styleDescription: 'Знаменитый штамм из Вайенштефан (Weihenstephan). Чистый немецкий лагер.'
  },
  {
    name: 'SafAle WB-06',
    lab: 'Fermentis',
    form: 'dry' as const,
    type: 'wheat' as const,
    cellsPerGramOrVial: 20,
    attenuationPercent: 86,
    tempRange: [18, 24] as [number, number],
    styleDescription: 'Пшеничный штамм с яркими нотами банана и гвоздики для баварских вайценов.'
  },
  {
    name: 'SafAle BE-256 (Abbaye)',
    lab: 'Fermentis',
    form: 'dry' as const,
    type: 'belgian' as const,
    cellsPerGramOrVial: 20,
    attenuationPercent: 84,
    tempRange: [18, 25] as [number, number],
    styleDescription: 'Для крепких бельгийских элей (Дуббель, Трипель). Высокая спиртоустойчивость.'
  },
  {
    name: 'LalBrew Voss Kveik',
    lab: 'Lallemand',
    form: 'dry' as const,
    type: 'kveik' as const,
    cellsPerGramOrVial: 20,
    attenuationPercent: 78,
    tempRange: [25, 40] as [number, number],
    styleDescription: 'Норвежский штамм, сбраживающий при температуре до 38-40°C за 48 часов без дефектов!'
  }
];

// Эталонные проверенные рецепты для базы
export const INITIAL_RECIPES: Recipe[] = [
  {
    id: 'rec_american_ipa_citra',
    name: 'Цитрусовый Шторм (Citra Wave IPA)',
    style: 'American IPA',
    category: 'Эли / Хмелевые',
    description: 'Флагманский американский IPA с ярким профилем тропических фруктов и грейпфрута. Чистая солодовая база Pale Ale со щепоткой Carapils для стойкой белой пены.',
    author: 'МастерВарка Рецепт',
    batchSizeL: 20,
    boilTimeMin: 60,
    efficiencyPercent: 72,
    grainRatioLPerKg: 3.5,
    grainTempC: 20,
    targetCarbonationVol: 2.4,
    beerTempAtBottlingC: 19,
    grains: [
      { id: 'g1', name: 'Pale Ale Malt', weightKg: 5.0, potentialSg: 1.038, colorEbc: 6.0, type: 'base' },
      { id: 'g2', name: 'Munich I', weightKg: 0.5, potentialSg: 1.036, colorEbc: 15.0, type: 'base' },
      { id: 'g3', name: 'Carapils', weightKg: 0.3, potentialSg: 1.033, colorEbc: 4.5, type: 'caramel' }
    ],
    hops: [
      { id: 'h1', name: 'Magnum', weightG: 20, alphaAcid: 14.0, boilTimeMin: 60, use: 'boil', notes: 'Чистая базовая горечь' },
      { id: 'h2', name: 'Citra', weightG: 30, alphaAcid: 12.5, boilTimeMin: 15, use: 'boil', notes: 'Вкус и аромат' },
      { id: 'h3', name: 'Citra', weightG: 40, alphaAcid: 12.5, boilTimeMin: 0, use: 'whirlpool', notes: 'Вирпул при 82°C (20 мин)' },
      { id: 'h4', name: 'Mosaic', weightG: 50, alphaAcid: 12.0, boilTimeMin: 0, use: 'dry_hop', notes: 'Сухое охмеление на 4 дня до розлива' }
    ],
    mashSchedule: [
      { id: 'm1', name: 'Осахаривание (Мальтоза/Сухой финал)', tempC: 65, timeMin: 60, type: 'maltose', description: 'Оптимум бета-амилазы' },
      { id: 'm2', name: 'Мэшаут (Mash Out)', tempC: 78, timeMin: 10, type: 'mashout', description: 'Остановка ферментов и лучшая фильтрация' }
    ],
    yeast: COMMON_YEASTS[0],
    calculated: {} as any, // пересчитаем ниже
    tags: ['IPA', 'Хмель', 'Цитрус', 'Топ'],
    collection: 'favorites',
    isCustom: false,
    createdAt: '2026-03-15T10:00:00Z',
    updatedAt: '2026-03-15T10:00:00Z',
    labelDesign: {
      title: 'Citra Wave',
      subtitle: 'American India Pale Ale',
      style: 'American IPA',
      breweryName: 'Craft Laboratory',
      abv: 6.2,
      ibu: 55,
      volumeText: '0.5 L',
      bottledDate: '2026',
      themeStyle: 'craft_modern',
      palette: {
        background: '#1c1917',
        text: '#fef08a',
        accent: '#eab308',
        border: '#ca8a04'
      },
      artworkType: 'hop',
      storyDescription: 'Освежающий тропический ураган в твоем бокале. Мощный сухой охмел Citra & Mosaic.'
    }
  },
  {
    id: 'rec_czech_pilsner',
    name: 'Богемский Хрусталь (Bohemian Pilsner)',
    style: 'Czech Premium Pale Lager',
    category: 'Лагеры',
    description: 'Классический чешский светлый лагер. 100% солод Pilsner, четырехкратная задача жатецкого хмеля Saaz и мягкая вода. Золотистый блеск и плотная кремовая пена.',
    author: 'МастерВарка Рецепт',
    batchSizeL: 20,
    boilTimeMin: 90,
    efficiencyPercent: 75,
    grainRatioLPerKg: 3.5,
    grainTempC: 20,
    targetCarbonationVol: 2.5,
    beerTempAtBottlingC: 12,
    grains: [
      { id: 'g1', name: 'Pilsner Malt', weightKg: 4.8, potentialSg: 1.037, colorEbc: 3.5, type: 'base' },
      { id: 'g2', name: 'Carapils', weightKg: 0.2, potentialSg: 1.033, colorEbc: 4.5, type: 'caramel' }
    ],
    hops: [
      { id: 'h1', name: 'Saaz (Жатецкий)', weightG: 35, alphaAcid: 3.8, boilTimeMin: 60, use: 'boil' },
      { id: 'h2', name: 'Saaz (Жатецкий)', weightG: 30, alphaAcid: 3.8, boilTimeMin: 30, use: 'boil' },
      { id: 'h3', name: 'Saaz (Жатецкий)', weightG: 25, alphaAcid: 3.8, boilTimeMin: 15, use: 'aroma' },
      { id: 'h4', name: 'Saaz (Жатецкий)', weightG: 30, alphaAcid: 3.8, boilTimeMin: 0, use: 'whirlpool' }
    ],
    mashSchedule: [
      { id: 'm1', name: 'Белковая пауза', tempC: 52, timeMin: 15, type: 'protein', description: 'Расщепление белков для прозрачности' },
      { id: 'm2', name: 'Мальтозная пауза', tempC: 63, timeMin: 45, type: 'maltose', description: 'Сбраживаемые сахара' },
      { id: 'm3', name: 'Осахаривание (Декстриновая)', tempC: 72, timeMin: 20, type: 'dextrin', description: 'Тело пива' },
      { id: 'm4', name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout', description: 'Окончание затирания' }
    ],
    yeast: COMMON_YEASTS[2], // W-34/70
    calculated: {} as any,
    tags: ['Лагер', 'Чехия', 'Жатецкий', 'Классика'],
    collection: 'favorites',
    isCustom: false,
    createdAt: '2026-03-10T12:00:00Z',
    updatedAt: '2026-03-10T12:00:00Z',
    labelDesign: {
      title: 'Bohemian Crystal',
      subtitle: 'Czech Premium Lager',
      style: 'Czech Pilsner',
      breweryName: 'Old Brewery House',
      abv: 4.8,
      ibu: 38,
      volumeText: '0.5 L',
      bottledDate: '2026',
      themeStyle: 'vintage_monastery',
      palette: {
        background: '#0c0a09',
        text: '#fef3c7',
        accent: '#f59e0b',
        border: '#d97706'
      },
      artworkType: 'crown',
      storyDescription: 'Сварено по канонам пльзеньских пивоварен 1842 года с благородным жатецким хмелем.'
    }
  },
  {
    id: 'rec_bavarian_weizen',
    name: 'Баварское Золото (Bavarian Weissbier)',
    style: 'Weissbier / Hefeweizen',
    category: 'Пшеничное',
    description: 'Традиционное баварское нефильтрованное пшеничное пиво. 55% пшеничного солода, пышная шапка пены, бархатистая текстура с естественными оттенками банана и гвоздики.',
    author: 'МастерВарка Рецепт',
    batchSizeL: 20,
    boilTimeMin: 60,
    efficiencyPercent: 72,
    grainRatioLPerKg: 3.5,
    grainTempC: 20,
    targetCarbonationVol: 3.0,
    beerTempAtBottlingC: 18,
    grains: [
      { id: 'g1', name: 'Wheat Malt (Пшеничный)', weightKg: 2.8, potentialSg: 1.038, colorEbc: 4.0, type: 'wheat' },
      { id: 'g2', name: 'Pilsner Malt', weightKg: 2.0, potentialSg: 1.037, colorEbc: 3.5, type: 'base' },
      { id: 'g3', name: 'Munich I', weightKg: 0.3, potentialSg: 1.036, colorEbc: 15.0, type: 'base' }
    ],
    hops: [
      { id: 'h1', name: 'Hallertau Mittelfrüh', weightG: 20, alphaAcid: 4.0, boilTimeMin: 60, use: 'boil' },
      { id: 'h2', name: 'Hallertau Mittelfrüh', weightG: 15, alphaAcid: 4.0, boilTimeMin: 15, use: 'boil' }
    ],
    mashSchedule: [
      { id: 'm1', name: 'Феруловая пауза', tempC: 44, timeMin: 15, type: 'acid', description: 'Выделение феруловой кислоты для аромата гвоздики' },
      { id: 'm2', name: 'Белковая пауза', tempC: 52, timeMin: 15, type: 'protein', description: 'Расщепление клейковины пшеницы' },
      { id: 'm3', name: 'Мальтозная пауза', tempC: 64, timeMin: 40, type: 'maltose', description: 'Сбраживание' },
      { id: 'm4', name: 'Осахаривание', tempC: 72, timeMin: 20, type: 'dextrin', description: 'Тело' },
      { id: 'm5', name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout', description: 'Окончание' }
    ],
    yeast: COMMON_YEASTS[3], // WB-06
    calculated: {} as any,
    tags: ['Пшеничное', 'Вайцен', 'Бавария', 'Банан'],
    collection: 'favorites',
    isCustom: false,
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
    labelDesign: {
      title: 'Bavarian Gold',
      subtitle: 'Hefeweizen Ale',
      style: 'Bavarian Weissbier',
      breweryName: 'Alps Brewery',
      abv: 5.2,
      ibu: 12,
      volumeText: '0.5 L',
      bottledDate: '2026',
      themeStyle: 'botanical',
      palette: {
        background: '#1c1917',
        text: '#fef9c3',
        accent: '#eab308',
        border: '#a16207'
      },
      artworkType: 'grain',
      storyDescription: 'Баварская пшеничная классика с шелковистым телом и ароматом спелого банана.'
    }
  },
  {
    id: 'rec_oatmeal_stout',
    name: 'Черный Бархат (Velvet Oatmeal Stout)',
    style: 'Oatmeal Stout',
    category: 'Темные эли / Портеры',
    description: 'Глубокий непроницаемо-черный стаут с мягким сливочным телом за счет добавления нежных овсяных хлопьев. Ноты обжаренных зерен кофе, горького шоколада и бисквита.',
    author: 'МастерВарка Рецепт',
    batchSizeL: 20,
    boilTimeMin: 60,
    efficiencyPercent: 70,
    grainRatioLPerKg: 3.5,
    grainTempC: 20,
    targetCarbonationVol: 2.0,
    beerTempAtBottlingC: 19,
    grains: [
      { id: 'g1', name: 'Pale Ale Malt', weightKg: 4.2, potentialSg: 1.038, colorEbc: 6.0, type: 'base' },
      { id: 'g2', name: 'Flaked Oats (Овсяные хлопья)', weightKg: 0.6, potentialSg: 1.032, colorEbc: 2.0, type: 'adjunct' },
      { id: 'g3', name: 'Roasted Barley (Жженый ячмень)', weightKg: 0.35, potentialSg: 1.025, colorEbc: 1100.0, type: 'roasted' },
      { id: 'g4', name: 'Chocolate Malt', weightKg: 0.3, potentialSg: 1.028, colorEbc: 900.0, type: 'roasted' },
      { id: 'g5', name: 'Caramunich II', weightKg: 0.25, potentialSg: 1.034, colorEbc: 120.0, type: 'caramel' }
    ],
    hops: [
      { id: 'h1', name: 'Northern Brewer', weightG: 30, alphaAcid: 9.0, boilTimeMin: 60, use: 'boil' },
      { id: 'h2', name: 'East Kent Goldings', weightG: 20, alphaAcid: 5.0, boilTimeMin: 15, use: 'boil' }
    ],
    mashSchedule: [
      { id: 'm1', name: 'Полнотелое осахаривание', tempC: 68, timeMin: 60, type: 'dextrin', description: 'Оптимум альфа-амилазы для густого бархатного тела' },
      { id: 'm2', name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout', description: 'Мэшаут' }
    ],
    yeast: COMMON_YEASTS[1], // S-04
    calculated: {} as any,
    tags: ['Стаут', 'Шоколад', 'Кофе', 'Овес', 'Темное'],
    collection: 'favorites',
    isCustom: false,
    createdAt: '2026-02-20T10:00:00Z',
    updatedAt: '2026-02-20T10:00:00Z',
    labelDesign: {
      title: 'Velvet Night',
      subtitle: 'Oatmeal Stout',
      style: 'Oatmeal Stout',
      breweryName: 'Dark Barrel Craft',
      abv: 5.4,
      ibu: 32,
      volumeText: '0.5 L',
      bottledDate: '2026',
      themeStyle: 'minimal_nordic',
      palette: {
        background: '#09090b',
        text: '#f4f4f5',
        accent: '#71717a',
        border: '#27272a'
      },
      artworkType: 'barrel',
      storyDescription: 'Кофе, черный шоколад и шелковый овес в густой кремовой гармонии.'
    }
  },
  {
    id: 'rec_belgian_tripel',
    name: 'Аббатский Трипель (Monk Tripel 8.5%)',
    style: 'Belgian Tripel',
    category: 'Бельгийские эли',
    description: 'Крепкий золотистый монастырский эль со сложным фруктово-пряным букетом груши, белого перца и гвоздики. Замечательная маскировка алкоголя и кремовая белая пена.',
    author: 'МастерВарка Рецепт',
    batchSizeL: 20,
    boilTimeMin: 75,
    efficiencyPercent: 74,
    grainRatioLPerKg: 3.2,
    grainTempC: 20,
    targetCarbonationVol: 2.8,
    beerTempAtBottlingC: 20,
    grains: [
      { id: 'g1', name: 'Pilsner Malt', weightKg: 6.2, potentialSg: 1.037, colorEbc: 3.5, type: 'base' },
      { id: 'g2', name: 'Vienna Malt', weightKg: 0.5, potentialSg: 1.036, colorEbc: 8.0, type: 'base' }
    ],
    hops: [
      { id: 'h1', name: 'Magnum', weightG: 25, alphaAcid: 14.0, boilTimeMin: 60, use: 'boil' },
      { id: 'h2', name: 'Saaz (Жатецкий)', weightG: 30, alphaAcid: 3.5, boilTimeMin: 15, use: 'boil' },
      { id: 'h3', name: 'Hallertau Mittelfrüh', weightG: 20, alphaAcid: 4.0, boilTimeMin: 5, use: 'boil' }
    ],
    mashSchedule: [
      { id: 'm1', name: 'Мальтозная пауза', tempC: 63, timeMin: 50, type: 'maltose', description: 'Максимальная сбраживаемость' },
      { id: 'm2', name: 'Осахаривание', tempC: 70, timeMin: 20, type: 'dextrin', description: 'Декстрины' },
      { id: 'm3', name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout', description: 'Мэшаут' }
    ],
    yeast: COMMON_YEASTS[4], // BE-256
    calculated: {} as any,
    tags: ['Бельгия', 'Трипель', 'Крепкое', 'Аббатское'],
    collection: 'favorites',
    isCustom: false,
    createdAt: '2026-02-10T10:00:00Z',
    updatedAt: '2026-02-10T10:00:00Z',
    labelDesign: {
      title: 'Monk Secret',
      subtitle: 'Belgian Abbey Tripel',
      style: 'Belgian Tripel',
      breweryName: 'Trappist Soul',
      abv: 8.5,
      ibu: 30,
      volumeText: '0.33 L',
      bottledDate: '2026',
      themeStyle: 'vintage_monastery',
      palette: {
        background: '#18181b',
        text: '#fde047',
        accent: '#ca8a04',
        border: '#854d0e'
      },
      artworkType: 'crown',
      storyDescription: 'Тайный рецепт фламандских монахов. Золотистая мощь с пряным послевкусием.'
    }
  }
];

// Рассчитываем параметры для каждого рецепта из базы
for (const recipe of INITIAL_RECIPES) {
  recipe.calculated = calculateBrewMetrics({
    batchSizeL: recipe.batchSizeL,
    boilTimeMin: recipe.boilTimeMin,
    efficiencyPercent: recipe.efficiencyPercent,
    grainRatioLPerKg: recipe.grainRatioLPerKg,
    grainTempC: recipe.grainTempC,
    targetCarbonationVol: recipe.targetCarbonationVol,
    beerTempAtBottlingC: recipe.beerTempAtBottlingC,
    grains: recipe.grains,
    hops: recipe.hops,
    yeast: recipe.yeast
  });
}

// Начальный инвентарь пивовара (Кладовая)
export const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 'inv_1', name: 'Pale Ale Malt', category: 'grain', amount: 15.0, unit: 'kg', potentialSgOrAlpha: 1.038, colorEbc: 6.0, notes: 'Базовый солод для элей' },
  { id: 'inv_2', name: 'Pilsner Malt', category: 'grain', amount: 10.0, unit: 'kg', potentialSgOrAlpha: 1.037, colorEbc: 3.5, notes: 'Для лагеров и легких элей' },
  { id: 'inv_3', name: 'Carapils', category: 'grain', amount: 1.0, unit: 'kg', potentialSgOrAlpha: 1.033, colorEbc: 4.5, notes: 'Для пены' },
  { id: 'inv_4', name: 'Munich I', category: 'grain', amount: 2.0, unit: 'kg', potentialSgOrAlpha: 1.036, colorEbc: 15.0, notes: 'Для солодового аромата' },
  { id: 'inv_5', name: 'Flaked Oats (Овсяные хлопья)', category: 'grain', amount: 1.5, unit: 'kg', potentialSgOrAlpha: 1.032, colorEbc: 2.0, notes: 'Для стаутов и NEIPA' },
  { id: 'inv_6', name: 'Citra', category: 'hop', amount: 150, unit: 'g', potentialSgOrAlpha: 12.5, notes: 'Американский хмель' },
  { id: 'inv_7', name: 'Mosaic', category: 'hop', amount: 100, unit: 'g', potentialSgOrAlpha: 12.0, notes: 'Хмель для сухого охмеления' },
  { id: 'inv_8', name: 'Magnum', category: 'hop', amount: 50, unit: 'g', potentialSgOrAlpha: 14.0, notes: 'Чистая горечь' },
  { id: 'inv_9', name: 'SafAle US-05', category: 'yeast', amount: 3, unit: 'pack', potentialSgOrAlpha: 81, notes: 'Сухие элевые дрожжи' },
  { id: 'inv_10', name: 'SafAle S-04', category: 'yeast', amount: 2, unit: 'pack', potentialSgOrAlpha: 75, notes: 'Для стаутов и биттеров' },
  { id: 'inv_11', name: 'Декстроза (глюкоза)', category: 'misc', amount: 1000, unit: 'g', notes: 'Для карбонизации бутылок' },
  { id: 'inv_12', name: 'Ирландский мох (Whirlfloc)', category: 'misc', amount: 10, unit: 'pack', notes: 'Осветлитель сусла' }
];

// Проверенные лайфхаки для домашнего пивоварения
export const INITIAL_LIFEHACKS: Lifehack[] = [
  {
    id: 'lh_1',
    title: 'Борьба с холодным помутнением: правильный Cold Break и ирландский мох',
    category: 'boiling',
    summary: 'Как добиться кристальной прозрачности лагеров и элей без фильтрации',
    content: 'Добавьте 1 таблетку Whirlfloc (или 2-3 грамма ирландского мха) за 10-15 минут до конца кипячения. После варки критически важно быстро охладить сусло чиллером со 100°C до 20°C менее чем за 20 минут. Это коагулирует танин-белковые комплексы, которые выпадают в плотный осадок на дно варочника.',
    author: 'Алексей, опыт 8 лет',
    rating: 142,
    proTip: 'Дайте суслу отстояться 15 минут после охлаждения перед переливом в ферментер, брух осядет плотной лепешкой на дне.'
  },
  {
    id: 'lh_2',
    title: 'Регидратация сухих дрожжей: стоит ли тратить время?',
    category: 'fermentation',
    summary: 'Регидратация в теплой воде 30°C сохраняет до 50% больше живых клеток',
    content: 'При рассыпании сухих дрожжей прямо на пену сусла (особенно плотностью выше 14°P), мембрана дрожжевой клетки получает осмотический шок, и до 40-50% клеток гибнут. Разведите дрожжи в 100 мл стерильной воды (30-32°C) за 20 минут до внесения, дайте постоять и аккуратно перемешайте.',
    author: 'Дмитрий, пивоварня HopsLab',
    rating: 189,
    proTip: 'Температура разведенных дрожжей и температура сусла в ферментере не должны отличаться более чем на 5°C, иначе дрожжи уйдут в спячку.'
  },
  {
    id: 'lh_3',
    title: 'Техника Whirlpool (Водоворот) для взрывного аромата хмеля',
    category: 'boiling',
    summary: 'Как сохранить эфирные масла хмеля без лишней резкой горечи',
    content: 'Когда кипячение завершено, охладите сусло до 80-82°C (температура ниже изомеризации альфа-кислот). Внесите ароматический хмель (Citra, Mosaic, Galaxy), закрутите сусло лопаткой в водоворот и оставьте под крышкой на 20-30 минут. Эфирные масла мирцен и линалоол растворятся, а IBU почти не вырастет.',
    author: 'CraftBro Ivan',
    rating: 230,
    proTip: 'Вся муть и белок соберутся идеальным конусом в центре дна котла, сливайте прозрачное сусло с края.'
  },
  {
    id: 'lh_4',
    title: 'Идеальная карбонизация декстрозой: варите сахарный сироп!',
    category: 'bottling',
    summary: 'Никогда не сыпьте сухой порошок декстрозы в бутылки чайными ложками',
    content: 'Засыпание сухого сахара в бутылки приводит к неравномерной карбонизации и риску заражения. Рассчитайте общую массу декстрозы на всю партию на нашем калькуляторе, растворите в 150-200 мл воды, прокипятите 5 минут для дезинфекции, остудите и вылейте на дно промежуточной емкости перед розливом.',
    author: 'Сергей Николаев',
    rating: 175,
    proTip: 'Переливайте пиво из ферментера шлангом на дно емкости по спирали — сироп равномерно перемешается сам без аэрации.'
  },
  {
    id: 'lh_5',
    title: 'Защита от кислорода при холодном охмелении (Dry Hopping)',
    category: 'fermentation',
    summary: 'Главный враг хмелевых IPA — кислород. Как спасти пиво от окисления и потемнения',
    content: 'Вносите хмель на сухое охмеление на стадии затухания активного брожения (когда плотность упала на 70-80%). Дрожжи еще активны и мгновенно поглотят весь кислород, попавший в ферментер при открытии крышки. Если брожение завершилось, продуйте свободное пространство углекислотой из баллончика.',
    author: 'BrewLab Studio',
    rating: 310,
    proTip: 'Окисленный IPA приобретает цвет грязного чая и вкус мокрого картона уже через 3 недели.'
  },
  {
    id: 'lh_6',
    title: 'Температура промывочной воды: не превышайте 78°C!',
    category: 'mashing',
    summary: 'Как избежать терпкого «песочного» вяжущего вкуса танинов в светлом пиве',
    content: 'Многие начинающие пивовары промывают дробину почти кипятком. Это фатальная ошибка: при температуре выше 78-80°C и pH выше 5.8 из оболочек зерна интенсивно вымываются полифенолы и танины. Промывочная вода должна быть строго 75-78°C.',
    author: 'Владимир, технолог',
    rating: 154,
    proTip: 'Подкислите промывочную воду несколькими каплями молочной или фосфорной кислоты до pH 5.5.'
  }
];

// Социальная лента сообщества пивоваров
export const INITIAL_POSTS: CommunityPost[] = [
  {
    id: 'post_1',
    author: 'Михаил «HopHead»',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    recipeName: 'Citra Wave IPA',
    style: 'American IPA',
    abv: 6.2,
    ibu: 55,
    brewDate: '2026-02-14',
    imageUrl: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=800&auto=format&fit=crop&q=80',
    story: 'Сварил партию по рецепту Citra Wave. Карбонизировал 16 дней на декстрозе (7.5 г/л). Ребята, это просто пушка! Аромат спелого манго и цитрусовой цедры бьет в нос еще до первого глотка. Пена кремовая, держится до самого дна бокала. Однозначно повторять!',
    tastingScore: 46,
    likesCount: 38,
    likedByMe: true,
    comments: [
      { id: 'c1', author: 'Андрей К.', text: 'Шикарный цвет! Сколько сухого охмеления давал?', date: '2 часа назад' },
      { id: 'c2', author: 'Михаил «HopHead»', text: '50 грамм Mosaic на 20 литров за 4 дня до розлива при 16°C.', date: '1 час назад' }
    ],
    createdAt: '2026-03-28T14:30:00Z'
  },
  {
    id: 'post_2',
    author: 'Елена BrewLady',
    authorAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80',
    recipeName: 'Bavarian Weissbier',
    style: 'Weissbier',
    abv: 5.2,
    ibu: 12,
    brewDate: '2026-02-28',
    imageUrl: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=800&auto=format&fit=crop&q=80',
    story: 'Первая варка пшенички в этом сезоне! Выдержала феруловую паузу 44°C ровно 15 минут — гвоздика в аромате потрясающая, очень благородная. Дрожжи WB-06 отработали как часы за 5 дней при 21°C.',
    tastingScore: 48,
    likesCount: 52,
    likedByMe: false,
    comments: [
      { id: 'c3', author: 'Viktor Pils', text: 'Какая пена! Шапка образцовая для вайцена!', date: 'Вчера' }
    ],
    createdAt: '2026-03-27T18:10:00Z'
  },
  {
    id: 'post_3',
    author: 'Константин С.',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    recipeName: 'Velvet Oatmeal Stout',
    style: 'Oatmeal Stout',
    abv: 5.5,
    ibu: 33,
    brewDate: '2026-01-20',
    imageUrl: 'https://images.unsplash.com/photo-1575037614876-c38a4d44f5b8?w=800&auto=format&fit=crop&q=80',
    story: 'Выдержал этот овсяный стаут 2 месяца в прохладном погребе. Жженка полностью скруглилась, остался бархатный горький шоколад со сливочным послевкусием. Карбонизировал на 2.0 объема — идеально для английского стаута.',
    tastingScore: 49,
    likesCount: 67,
    likedByMe: true,
    comments: [
      { id: 'c4', author: 'Дмитрий', text: 'Овес обжаривал перед затором или брал обычные нежные хлопья?', date: '3 дня назад' },
      { id: 'c5', author: 'Константин С.', text: 'Обычные хлопья геркулес быстрого приготовления, затирал прямо с базовым солодом при 68°C.', date: '3 дня назад' }
    ],
    createdAt: '2026-03-25T11:20:00Z'
  }
];
