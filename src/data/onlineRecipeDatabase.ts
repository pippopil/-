import { Recipe } from '../types/brewing';
import { calculateBrewMetrics } from '../utils/brewingMath';

export interface OnlineRecipeSource {
  id: string;
  name: string;
  url: string;
  description: string;
  format: 'beerxml' | 'json' | 'web';
  sampleUrls: { title: string; url: string }[];
}

export const POPULAR_ONLINE_SOURCES: OnlineRecipeSource[] = [
  {
    id: 'brewersfriend',
    name: "Brewer's Friend",
    url: 'https://www.brewersfriend.com/homebrew/recipes/',
    description: 'Крупнейшая мировая база домашних и коммерческих рецептов с прямым экспортом в BeerXML.',
    format: 'beerxml',
    sampleUrls: [
      {
        title: 'Sierra Nevada Pale Ale Clone (BeerXML)',
        url: 'https://raw.githubusercontent.com/pippopil/-/main/public/sample-recipes/sierra-nevada-pale-ale.xml'
      },
      {
        title: 'Pliny the Elder Double IPA (BeerXML)',
        url: 'https://raw.githubusercontent.com/pippopil/-/main/public/sample-recipes/pliny-the-elder.xml'
      }
    ]
  },
  {
    id: 'brewfather',
    name: 'Brewfather App',
    url: 'https://brewfather.app',
    description: 'Популярное приложение для пивоваров. Поддерживает прямой экспорт в JSON и BeerXML.',
    format: 'json',
    sampleUrls: [
      {
        title: 'Guinness Extra Stout Clone (JSON)',
        url: 'https://raw.githubusercontent.com/pippopil/-/main/public/sample-recipes/guinness-stout.json'
      }
    ]
  },
  {
    id: 'beermir',
    name: 'Пивной портал & Форумы домашних пивоваров',
    url: 'https://beermir.com',
    description: 'Русскоязычное сообщество: рецепты крафтового пива, клоны российских и мировых сортов.',
    format: 'beerxml',
    sampleUrls: [
      {
        title: 'Жигулевское СССР ГОСТ 3473-78 (BeerXML)',
        url: 'https://raw.githubusercontent.com/pippopil/-/main/public/sample-recipes/zhigulevskoe-gost.xml'
      }
    ]
  }
];

export interface OnlineRecipeItem {
  id: string;
  name: string;
  style: string;
  category: string;
  origin: string;
  breweryClone?: string;
  description: string;
  batchSizeL: number;
  boilTimeMin: number;
  efficiencyPercent: number;
  grains: { name: string; weightKg: number; potentialSg: number; colorEbc: number; type: any }[];
  hops: { name: string; weightG: number; alphaAcid: number; boilTimeMin: number; use: any }[];
  mashSchedule: { name: string; tempC: number; timeMin: number; type: any }[];
  yeast: { name: string; lab: string; form: any; type: any; cellsPerGramOrVial: number; attenuationPercent: number; tempRange: [number, number] };
  tags: string[];
  sourceUrl?: string;
  featured?: boolean;
}

export const ONLINE_RECIPES_CATALOG: OnlineRecipeItem[] = [
  // 1. Клон Jaws Атомная Прачечная
  {
    id: 'online_prachyachka_ipa',
    name: 'Атомная Прачечная (Клон IPA)',
    style: 'American IPA',
    category: '18. Amber & Brown American Beer',
    origin: 'Россия (Jaws Brewery)',
    breweryClone: 'Jaws Brewery',
    description: 'Легендарный российский IPA с мощным хмелевым ударом, цитрусово-хвойной смолистостью и напористой чистой горечью свыше 100 IBU.',
    batchSizeL: 20,
    boilTimeMin: 90,
    efficiencyPercent: 72,
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
    mashSchedule: [
      { name: 'Осахаривание (Мальтозная)', tempC: 66, timeMin: 60, type: 'maltose' },
      { name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout' }
    ],
    yeast: {
      name: 'Fermentis SafAle US-05',
      lab: 'Fermentis',
      form: 'dry',
      type: 'ale',
      cellsPerGramOrVial: 20,
      attenuationPercent: 81,
      tempRange: [18, 21]
    },
    tags: ['IPA', 'Клон', 'Jaws', 'Атомная Прачечная', 'Хмель', 'Россия', 'Горькое'],
    featured: true
  },

  // 2. Guinness Extra Stout Clone
  {
    id: 'online_guinness_extra_stout',
    name: 'Guinness Extra Stout (Клон)',
    style: 'Irish Extra Stout',
    category: '15. Irish Beer',
    origin: 'Ирландия (St. James’s Gate)',
    breweryClone: 'Guinness',
    description: 'Эталон ирландского сухого стаута. Неповторимый кофейно-шоколадный профиль за счет 10% жженого несоложеного ячменя и ячменных хлопьев.',
    batchSizeL: 20,
    boilTimeMin: 60,
    efficiencyPercent: 74,
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
    mashSchedule: [
      { name: 'Осахаривание единое', tempC: 65, timeMin: 60, type: 'maltose' },
      { name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout' }
    ],
    yeast: {
      name: 'Wyeast 1084 Irish Ale / S-04',
      lab: 'Wyeast',
      form: 'liquid',
      type: 'ale',
      cellsPerGramOrVial: 20,
      attenuationPercent: 74,
      tempRange: [18, 20]
    },
    tags: ['Стаут', 'Guinness', 'Ирландия', 'Сухой стаут', 'Жженый ячмень'],
    featured: true
  },

  // 3. Sierra Nevada Pale Ale Clone
  {
    id: 'online_sierra_nevada_pa',
    name: 'Sierra Nevada Pale Ale (Клон)',
    style: 'American Pale Ale',
    category: '18. Amber & Brown American Beer',
    origin: 'США (Sierra Nevada Brewing Co.)',
    breweryClone: 'Sierra Nevada',
    description: 'Икона крафтовой революции США 1980 года. Чистейший хмель Cascade во всех ипостасях: грейпфрут, хвоя и мягкий карамельный баланс солода Crystal.',
    batchSizeL: 20,
    boilTimeMin: 60,
    efficiencyPercent: 75,
    grains: [
      { name: 'Pale Ale Malt (Пэйл Эль)', weightKg: 4.6, potentialSg: 1.038, colorEbc: 6.0, type: 'base' },
      { name: 'Caramunich I (Карамюнхен 90 EBC)', weightKg: 0.35, potentialSg: 1.034, colorEbc: 90.0, type: 'caramel' }
    ],
    hops: [
      { name: 'Magnum', weightG: 14, alphaAcid: 14.0, boilTimeMin: 60, use: 'boil' },
      { name: 'Cascade', weightG: 20, alphaAcid: 6.0, boilTimeMin: 30, use: 'boil' },
      { name: 'Cascade', weightG: 30, alphaAcid: 6.0, boilTimeMin: 10, use: 'boil' },
      { name: 'Cascade', weightG: 40, alphaAcid: 6.0, boilTimeMin: 0, use: 'whirlpool' },
      { name: 'Cascade', weightG: 45, alphaAcid: 6.0, boilTimeMin: 0, use: 'dry_hop' }
    ],
    mashSchedule: [
      { name: 'Осахаривание', tempC: 67, timeMin: 60, type: 'maltose' },
      { name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout' }
    ],
    yeast: {
      name: 'Fermentis SafAle US-05 (Chico strain)',
      lab: 'Fermentis',
      form: 'dry',
      type: 'ale',
      cellsPerGramOrVial: 20,
      attenuationPercent: 78,
      tempRange: [18, 20]
    },
    tags: ['APA', 'Cascade', 'Sierra Nevada', 'Классика', 'США'],
    featured: true
  },

  // 4. Pliny the Elder Double IPA Clone
  {
    id: 'online_pliny_the_elder',
    name: 'Pliny the Elder (Клон Double IPA)',
    style: 'Double IPA',
    category: '22. Strong American Ale',
    origin: 'США (Russian River)',
    breweryClone: 'Russian River Brewing',
    description: 'Один из самых знаменитых Double IPA в истории мирового крафта от Винни Силурзо. Экстремальное охмеление с сахаром для максимальной сухости и питкости.',
    batchSizeL: 20,
    boilTimeMin: 90,
    efficiencyPercent: 72,
    grains: [
      { name: 'Pilsner Malt (Пилснер)', weightKg: 5.5, potentialSg: 1.037, colorEbc: 3.5, type: 'base' },
      { name: 'Carapils / Carafoam', weightKg: 0.4, potentialSg: 1.033, colorEbc: 4.5, type: 'caramel' },
      { name: 'Caramunich I (Карамюнхен)', weightKg: 0.25, potentialSg: 1.034, colorEbc: 90.0, type: 'caramel' }
    ],
    hops: [
      { name: 'Columbus / Tomahawk / Zeus (CTZ)', weightG: 45, alphaAcid: 15.0, boilTimeMin: 90, use: 'boil' },
      { name: 'Simcoe', weightG: 30, alphaAcid: 13.0, boilTimeMin: 45, use: 'boil' },
      { name: 'Columbus / Tomahawk / Zeus (CTZ)', weightG: 30, alphaAcid: 15.0, boilTimeMin: 30, use: 'boil' },
      { name: 'Centennial', weightG: 35, alphaAcid: 10.0, boilTimeMin: 0, use: 'whirlpool' },
      { name: 'Simcoe', weightG: 35, alphaAcid: 13.0, boilTimeMin: 0, use: 'whirlpool' },
      { name: 'Amarillo', weightG: 35, alphaAcid: 9.0, boilTimeMin: 0, use: 'whirlpool' },
      { name: 'Simcoe', weightG: 50, alphaAcid: 13.0, boilTimeMin: 0, use: 'dry_hop' },
      { name: 'Centennial', weightG: 40, alphaAcid: 10.0, boilTimeMin: 0, use: 'dry_hop' },
      { name: 'Columbus / Tomahawk / Zeus (CTZ)', weightG: 35, alphaAcid: 15.0, boilTimeMin: 0, use: 'dry_hop' }
    ],
    mashSchedule: [
      { name: 'Низкая осахаривающая пауза', tempC: 64, timeMin: 75, type: 'maltose' },
      { name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout' }
    ],
    yeast: {
      name: 'Fermentis SafAle US-05',
      lab: 'Fermentis',
      form: 'dry',
      type: 'ale',
      cellsPerGramOrVial: 20,
      attenuationPercent: 84,
      tempRange: [18, 20]
    },
    tags: ['Double IPA', 'DIPA', 'Pliny the Elder', 'Хмель', 'США'],
    featured: true
  },

  // 5. BrewDog Punk IPA Clone
  {
    id: 'online_brewdog_punk_ipa',
    name: 'BrewDog Punk IPA (Клон)',
    style: 'American IPA',
    category: '18. Amber & Brown American Beer',
    origin: 'Шотландия (BrewDog)',
    breweryClone: 'BrewDog',
    description: 'Флагманский шотландский IPA с тропическим ароматом маракуйи, грейпфрута и ананаса от хмелей Chinook, Ahtanum, Amarillo и Simcoe.',
    batchSizeL: 20,
    boilTimeMin: 60,
    efficiencyPercent: 74,
    grains: [
      { name: 'Pale Ale Malt (Пэйл Эль)', weightKg: 4.8, potentialSg: 1.038, colorEbc: 6.0, type: 'base' },
      { name: 'Caramunich I (Карамюнхен)', weightKg: 0.25, potentialSg: 1.034, colorEbc: 90.0, type: 'caramel' }
    ],
    hops: [
      { name: 'Chinook', weightG: 20, alphaAcid: 13.0, boilTimeMin: 60, use: 'boil' },
      { name: 'Ahtanum / Amarillo', weightG: 18, alphaAcid: 8.5, boilTimeMin: 30, use: 'boil' },
      { name: 'Simcoe', weightG: 20, alphaAcid: 13.0, boilTimeMin: 15, use: 'boil' },
      { name: 'Cascade', weightG: 25, alphaAcid: 6.0, boilTimeMin: 0, use: 'whirlpool' },
      { name: 'Amarillo', weightG: 30, alphaAcid: 9.0, boilTimeMin: 0, use: 'dry_hop' },
      { name: 'Simcoe', weightG: 30, alphaAcid: 13.0, boilTimeMin: 0, use: 'dry_hop' },
      { name: 'Citra', weightG: 30, alphaAcid: 12.5, boilTimeMin: 0, use: 'dry_hop' }
    ],
    mashSchedule: [
      { name: 'Осахаривание', tempC: 65, timeMin: 65, type: 'maltose' },
      { name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout' }
    ],
    yeast: {
      name: 'Wyeast 1056 / US-05',
      lab: 'Wyeast',
      form: 'dry',
      type: 'ale',
      cellsPerGramOrVial: 20,
      attenuationPercent: 80,
      tempRange: [18, 20]
    },
    tags: ['BrewDog', 'Punk IPA', 'Шотландия', 'Тропики', 'Хмель'],
    featured: true
  },

  // 6. Жигулевское СССР (ГОСТ 3473-78)
  {
    id: 'online_zhigulevskoe_gost',
    name: 'Жигулевское Светлое (ГОСТ 3473-78)',
    style: 'Czech Premium Pale Lager / Soviet Lager',
    category: '3. Czech Lager',
    origin: 'СССР / Россия (Куйбышевский пивзавод)',
    breweryClone: 'Жигулевский Пивоваренный Завод',
    description: 'Аутентичный советский рецепт 11% плотности по ГОСТ 3473-78. Светлый солод, 15% несоложеного ячменя и благородный жатецкий хмель.',
    batchSizeL: 20,
    boilTimeMin: 75,
    efficiencyPercent: 75,
    grains: [
      { name: 'Pilsner Malt (Пилснер)', weightKg: 3.2, potentialSg: 1.037, colorEbc: 3.5, type: 'base' },
      { name: 'Flaked Barley (Ячменные хлопья / несоложенка)', weightKg: 0.55, potentialSg: 1.032, colorEbc: 3.5, type: 'adjunct' },
      { name: 'Vienna Malt (Венский)', weightKg: 0.3, potentialSg: 1.036, colorEbc: 8.0, type: 'base' }
    ],
    hops: [
      { name: 'Magnum', weightG: 10, alphaAcid: 14.0, boilTimeMin: 60, use: 'boil' },
      { name: 'Saaz (Жатецкий)', weightG: 25, alphaAcid: 3.8, boilTimeMin: 20, use: 'boil' },
      { name: 'Saaz (Жатецкий)', weightG: 20, alphaAcid: 3.8, boilTimeMin: 5, use: 'boil' }
    ],
    mashSchedule: [
      { name: 'Белковая пауза', tempC: 52, timeMin: 20, type: 'protein' },
      { name: 'Мальтозная пауза', tempC: 63, timeMin: 40, type: 'maltose' },
      { name: 'Декстриновая пауза', tempC: 72, timeMin: 25, type: 'dextrin' },
      { name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout' }
    ],
    yeast: {
      name: 'Fermentis Saflager W-34/70',
      lab: 'Fermentis',
      form: 'dry',
      type: 'lager',
      cellsPerGramOrVial: 20,
      attenuationPercent: 82,
      tempRange: [10, 14]
    },
    tags: ['Жигулевское', 'ГОСТ', 'СССР', 'Лагер', 'Классика'],
    featured: true
  },

  // 7. Tomato Gose "Чили & Базилик"
  {
    id: 'online_tomato_gose',
    name: 'Tomato Gose «Чили & Базилик»',
    style: 'Gose / Contemporary Sour',
    category: '27. Historical Beer',
    origin: 'Россия (Крафтовый тренд)',
    description: 'Освежающий кисло-соленый томатный эль. Пшеничная база с добавлением розовой гималайской соли, кориандра, томатного пюре и острого перца.',
    batchSizeL: 20,
    boilTimeMin: 60,
    efficiencyPercent: 72,
    grains: [
      { name: 'Pilsner Malt (Пилснер)', weightKg: 2.2, potentialSg: 1.037, colorEbc: 3.5, type: 'base' },
      { name: 'Wheat Malt (Пшеничный светлый)', weightKg: 1.8, potentialSg: 1.038, colorEbc: 4.0, type: 'wheat' },
      { name: 'Acidulated Malt (Кислый солод)', weightKg: 0.3, potentialSg: 1.027, colorEbc: 4.5, type: 'acid' }
    ],
    hops: [
      { name: 'Saaz (Жатецкий)', weightG: 15, alphaAcid: 3.8, boilTimeMin: 60, use: 'boil' }
    ],
    mashSchedule: [
      { name: 'Осахаривание', tempC: 66, timeMin: 60, type: 'maltose' },
      { name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout' }
    ],
    yeast: {
      name: 'Lallemand Philly Sour / US-05',
      lab: 'Lallemand',
      form: 'dry',
      type: 'sour',
      cellsPerGramOrVial: 20,
      attenuationPercent: 76,
      tempRange: [20, 24]
    },
    tags: ['Томатное', 'Gose', 'Гозе', 'Кислый эль', 'Чили', 'Соль'],
    featured: true
  },

  // 8. NEIPA "Hazy Juice Bomb" (Citra & Mosaic)
  {
    id: 'online_neipa_juice_bomb',
    name: 'NEIPA «Hazy Juice Bomb»',
    style: 'New England IPA',
    category: '21. IPA',
    origin: 'США (Вермонт)',
    description: 'Мутный, сочный, шелковистый New England IPA с взрывной ароматикой тропического мультифруктового сока без жесткой горечи.',
    batchSizeL: 20,
    boilTimeMin: 60,
    efficiencyPercent: 70,
    grains: [
      { name: 'Pale Ale Malt (Пэйл Эль)', weightKg: 4.5, potentialSg: 1.038, colorEbc: 6.0, type: 'base' },
      { name: 'Flaked Oats (Овсяные хлопья)', weightKg: 1.2, potentialSg: 1.032, colorEbc: 2.0, type: 'adjunct' },
      { name: 'Wheat Malt (Пшеничный светлый)', weightKg: 0.8, potentialSg: 1.038, colorEbc: 4.0, type: 'wheat' },
      { name: 'Carapils / Carafoam', weightKg: 0.3, potentialSg: 1.033, colorEbc: 4.5, type: 'caramel' }
    ],
    hops: [
      { name: 'Magnum', weightG: 10, alphaAcid: 14.0, boilTimeMin: 60, use: 'boil' },
      { name: 'Citra', weightG: 40, alphaAcid: 12.5, boilTimeMin: 0, use: 'whirlpool' },
      { name: 'Mosaic', weightG: 40, alphaAcid: 12.0, boilTimeMin: 0, use: 'whirlpool' },
      { name: 'Citra', weightG: 60, alphaAcid: 12.5, boilTimeMin: 0, use: 'dry_hop' },
      { name: 'Mosaic', weightG: 60, alphaAcid: 12.0, boilTimeMin: 0, use: 'dry_hop' }
    ],
    mashSchedule: [
      { name: 'Осахаривание полнотелое', tempC: 68, timeMin: 60, type: 'maltose' },
      { name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout' }
    ],
    yeast: {
      name: 'Lallemand LalBrew Verdant IPA',
      lab: 'Lallemand',
      form: 'dry',
      type: 'ale',
      cellsPerGramOrVial: 20,
      attenuationPercent: 77,
      tempRange: [18, 22]
    },
    tags: ['NEIPA', 'Hazy', 'Мутный IPA', 'Citra', 'Mosaic', 'Сок'],
    featured: true
  },

  // 9. Weihenstephaner Hefeweissbier Clone
  {
    id: 'online_weihenstephaner_weizen',
    name: 'Weihenstephaner Hefe-Weissbier (Клон)',
    style: 'Weissbier',
    category: '10. German Wheat Beer',
    origin: 'Германия (Старейшая пивоварня мира, 1040 год)',
    breweryClone: 'Weihenstephan',
    description: 'Эталон баварского пшеничного пива. 60% пшеничного солода, знаменитый эфирный профиль спелого банана и пряной гвоздики.',
    batchSizeL: 20,
    boilTimeMin: 60,
    efficiencyPercent: 75,
    grains: [
      { name: 'Wheat Malt (Пшеничный светлый)', weightKg: 2.8, potentialSg: 1.038, colorEbc: 4.0, type: 'wheat' },
      { name: 'Pilsner Malt (Пилснер)', weightKg: 1.8, potentialSg: 1.037, colorEbc: 3.5, type: 'base' },
      { name: 'Munich I (Мюнхенский)', weightKg: 0.3, potentialSg: 1.036, colorEbc: 15.0, type: 'base' }
    ],
    hops: [
      { name: 'Hallertau Mittelfrüh', weightG: 22, alphaAcid: 4.0, boilTimeMin: 60, use: 'boil' },
      { name: 'Tettnanger', weightG: 12, alphaAcid: 4.5, boilTimeMin: 15, use: 'boil' }
    ],
    mashSchedule: [
      { name: 'Феруловая пауза (для гвоздики)', tempC: 44, timeMin: 15, type: 'acid' },
      { name: 'Белковая пауза', tempC: 52, timeMin: 15, type: 'protein' },
      { name: 'Мальтозная пауза', tempC: 63, timeMin: 35, type: 'maltose' },
      { name: 'Осахаривание декстринов', tempC: 72, timeMin: 25, type: 'dextrin' },
      { name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout' }
    ],
    yeast: {
      name: 'Fermentis SafAle WB-06 / Lallemand Munich Classic',
      lab: 'Lallemand',
      form: 'dry',
      type: 'wheat',
      cellsPerGramOrVial: 20,
      attenuationPercent: 76,
      tempRange: [18, 22]
    },
    tags: ['Вайцен', 'Пшеничное', 'Бавария', 'Германия', 'Банан', 'Гвоздика'],
    featured: true
  },

  // 10. Клон "Достоевский" Имперский Балтийский Портер
  {
    id: 'online_dostoevsky_baltic_porter',
    name: 'Имперский Балтийский Портер «Достоевский»',
    style: 'Baltic Porter',
    category: '9. Strong European Beer',
    origin: 'Россия (Воронеж, Brewlok)',
    breweryClone: 'Brewlok',
    description: 'Глубокий, плотный, согревающий имперский балтийский портер лагерного брожения. Ноты чернослива, шоколада, поджаренной хлебной корки и мадеры.',
    batchSizeL: 20,
    boilTimeMin: 90,
    efficiencyPercent: 70,
    grains: [
      { name: 'Munich I (Мюнхенский)', weightKg: 4.5, potentialSg: 1.036, colorEbc: 15.0, type: 'base' },
      { name: 'Pilsner Malt (Пилснер)', weightKg: 2.5, potentialSg: 1.037, colorEbc: 3.5, type: 'base' },
      { name: 'Caramunich II (Карамюнхен 120 EBC)', weightKg: 0.6, potentialSg: 1.034, colorEbc: 120.0, type: 'caramel' },
      { name: 'Special B (Спешиал Б)', weightKg: 0.35, potentialSg: 1.032, colorEbc: 300.0, type: 'caramel' },
      { name: 'Carafa Special III (Карафа 3 без горечи)', weightKg: 0.3, potentialSg: 1.028, colorEbc: 1400.0, type: 'roasted' }
    ],
    hops: [
      { name: 'Magnum', weightG: 28, alphaAcid: 14.0, boilTimeMin: 60, use: 'boil' },
      { name: 'Saaz (Жатецкий)', weightG: 30, alphaAcid: 3.8, boilTimeMin: 20, use: 'boil' }
    ],
    mashSchedule: [
      { name: 'Белковая пауза', tempC: 52, timeMin: 15, type: 'protein' },
      { name: 'Мальтозная пауза', tempC: 65, timeMin: 60, type: 'maltose' },
      { name: 'Декстриновая пауза', tempC: 72, timeMin: 20, type: 'dextrin' },
      { name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout' }
    ],
    yeast: {
      name: 'Fermentis Saflager W-34/70',
      lab: 'Fermentis',
      form: 'dry',
      type: 'lager',
      cellsPerGramOrVial: 20,
      attenuationPercent: 78,
      tempRange: [10, 13]
    },
    tags: ['Портер', 'Балтийский портер', 'Россия', 'Крепкое', 'Чернослив', 'Шоколад'],
    featured: true
  }
];

/**
 * Преобразовать элемент онлайн-каталога в полноценный Recipe для приложения
 */
export function convertOnlineItemToRecipe(item: OnlineRecipeItem): Recipe {
  const calculated = calculateBrewMetrics({
    batchSizeL: item.batchSizeL,
    boilTimeMin: item.boilTimeMin,
    efficiencyPercent: item.efficiencyPercent,
    grainRatioLPerKg: 3.5,
    grainTempC: 20,
    targetCarbonationVol: 2.4,
    beerTempAtBottlingC: 20,
    grains: item.grains.map((g, idx) => ({ ...g, id: `g_online_${idx}_${Date.now()}` })),
    hops: item.hops.map((h, idx) => ({ ...h, id: `h_online_${idx}_${Date.now()}` })),
    yeast: item.yeast
  });

  return {
    id: `recipe_imported_${item.id}_${Date.now()}`,
    name: item.name,
    style: item.style,
    category: item.category,
    description: item.description,
    author: item.breweryClone ? `Клон: ${item.breweryClone}` : item.origin,
    batchSizeL: item.batchSizeL,
    boilTimeMin: item.boilTimeMin,
    efficiencyPercent: item.efficiencyPercent,
    grainRatioLPerKg: 3.5,
    grainTempC: 20,
    targetCarbonationVol: 2.4,
    beerTempAtBottlingC: 20,
    grains: item.grains.map((g, idx) => ({ ...g, id: `g_${idx}_${Date.now()}` })),
    hops: item.hops.map((h, idx) => ({ ...h, id: `h_${idx}_${Date.now()}` })),
    mashSchedule: item.mashSchedule.map((m, idx) => ({ ...m, id: `m_${idx}_${Date.now()}` })),
    yeast: item.yeast,
    calculated,
    tags: item.tags,
    isCustom: true,
    collection: 'my_recipes',
    favorite: false
  };
}
