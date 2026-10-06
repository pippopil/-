import { CommunityPost, InventoryItem, Lifehack, Recipe } from '../types/brewing';
import { calculateBrewMetrics } from '../utils/brewingMath';

// Полный каталог всех существующих пивоваренных солодов
export const COMMON_GRAINS = [
  // Базовые солода
  { name: 'Pilsner Malt (Пилснер)', potentialSg: 1.037, colorEbc: 3.5, type: 'base' as const, group: 'Базовые' },
  { name: 'Pale Ale Malt (Пэйл Эль)', potentialSg: 1.038, colorEbc: 6.0, type: 'base' as const, group: 'Базовые' },
  { name: 'Maris Otter (Английский Пэйл)', potentialSg: 1.038, colorEbc: 6.5, type: 'base' as const, group: 'Базовые' },
  { name: 'Vienna Malt (Венский)', potentialSg: 1.036, colorEbc: 8.0, type: 'base' as const, group: 'Базовые' },
  { name: 'Munich I (Мюнхенский светлый 15 EBC)', potentialSg: 1.036, colorEbc: 15.0, type: 'base' as const, group: 'Базовые' },
  { name: 'Munich II (Мюнхенский темный 25 EBC)', potentialSg: 1.035, colorEbc: 25.0, type: 'base' as const, group: 'Базовые' },
  { name: 'Wheat Malt (Пшеничный светлый)', potentialSg: 1.038, colorEbc: 4.0, type: 'wheat' as const, group: 'Пшеничные' },
  { name: 'Dark Wheat Malt (Пшеничный темный)', potentialSg: 1.037, colorEbc: 17.0, type: 'wheat' as const, group: 'Пшеничные' },
  { name: 'Rye Malt (Ржаной солод)', potentialSg: 1.036, colorEbc: 8.0, type: 'adjunct' as const, group: 'Специальные' },

  // Карамельные и специальные солода
  { name: 'Carapils / Carafoam (Карапилс для пены)', potentialSg: 1.033, colorEbc: 4.5, type: 'caramel' as const, group: 'Карамельные' },
  { name: 'Carahell (Карахелль 25 EBC)', potentialSg: 1.034, colorEbc: 25.0, type: 'caramel' as const, group: 'Карамельные' },
  { name: 'Carared (Караред 50 EBC для красного цвета)', potentialSg: 1.034, colorEbc: 50.0, type: 'caramel' as const, group: 'Карамельные' },
  { name: 'Caramunich I (Карамюнхен 90 EBC)', potentialSg: 1.034, colorEbc: 90.0, type: 'caramel' as const, group: 'Карамельные' },
  { name: 'Caramunich II (Карамюнхен 120 EBC)', potentialSg: 1.034, colorEbc: 120.0, type: 'caramel' as const, group: 'Карамельные' },
  { name: 'Caramunich III (Карамюнхен 150 EBC)', potentialSg: 1.033, colorEbc: 150.0, type: 'caramel' as const, group: 'Карамельные' },
  { name: 'Caraaroma (Караарома 350 EBC)', potentialSg: 1.033, colorEbc: 350.0, type: 'caramel' as const, group: 'Карамельные' },
  { name: 'Special B (Спешиал Б 300 EBC - изюм, чернослив)', potentialSg: 1.032, colorEbc: 300.0, type: 'caramel' as const, group: 'Карамельные' },
  { name: 'Melanoidin Malt (Меланоидиновый)', potentialSg: 1.035, colorEbc: 70.0, type: 'caramel' as const, group: 'Карамельные' },
  { name: 'Acidulated Malt (Кислый солод для pH)', potentialSg: 1.027, colorEbc: 4.5, type: 'acid' as const, group: 'Специальные' },

  // Жженые и темные солода
  { name: 'Chocolate Malt (Шоколадный 900 EBC)', potentialSg: 1.028, colorEbc: 900.0, type: 'roasted' as const, group: 'Жженые' },
  { name: 'Roasted Barley (Жженый ячмень 1100 EBC)', potentialSg: 1.025, colorEbc: 1100.0, type: 'roasted' as const, group: 'Жженые' },
  { name: 'Carafa Special I (Карафа 1 без горечи 900 EBC)', potentialSg: 1.029, colorEbc: 900.0, type: 'roasted' as const, group: 'Жженые' },
  { name: 'Carafa Special III (Карафа 3 без горечи 1400 EBC)', potentialSg: 1.028, colorEbc: 1400.0, type: 'roasted' as const, group: 'Жженые' },
  { name: 'Black Malt (Черный солод 1300 EBC)', potentialSg: 1.025, colorEbc: 1300.0, type: 'roasted' as const, group: 'Жженые' },

  // Несоложенка и хлопья
  { name: 'Flaked Oats (Овсяные хлопья для тела/крема)', potentialSg: 1.032, colorEbc: 2.0, type: 'adjunct' as const, group: 'Хлопья' },
  { name: 'Flaked Barley (Ячменные хлопья)', potentialSg: 1.032, colorEbc: 3.5, type: 'adjunct' as const, group: 'Хлопья' },
  { name: 'Flaked Wheat (Пшеничные хлопья для витбиров)', potentialSg: 1.035, colorEbc: 3.0, type: 'adjunct' as const, group: 'Хлопья' },

  // Полная линейка Курского солодовенного завода (Россия, все виды)
  { name: 'Курский Пилснер (Pilsner Malt)', potentialSg: 1.037, colorEbc: 3.8, type: 'base' as const, group: 'Курский солод' },
  { name: 'Курский Премиум Пилснер (Premium Pilsner)', potentialSg: 1.038, colorEbc: 3.4, type: 'base' as const, group: 'Курский солод' },
  { name: 'Курский Пэйл Эль (Pale Ale Malt)', potentialSg: 1.038, colorEbc: 6.0, type: 'base' as const, group: 'Курский солод' },
  { name: 'Курский Венский (Vienna Malt)', potentialSg: 1.036, colorEbc: 8.5, type: 'base' as const, group: 'Курский солод' },
  { name: 'Курский Мюнхенский светлый (Munich Typ 1, 15 EBC)', potentialSg: 1.036, colorEbc: 15.0, type: 'base' as const, group: 'Курский солод' },
  { name: 'Курский Мюнхенский темный (Munich Typ 2, 25 EBC)', potentialSg: 1.035, colorEbc: 25.0, type: 'base' as const, group: 'Курский солод' },
  { name: 'Курский Пшеничный светлый (Wheat Malt)', potentialSg: 1.038, colorEbc: 4.5, type: 'wheat' as const, group: 'Курский солод' },
  { name: 'Курский Пшеничный темный (Dark Wheat Malt)', potentialSg: 1.037, colorEbc: 18.0, type: 'wheat' as const, group: 'Курский солод' },
  { name: 'Курский Ржаной неферментированный (светлый)', potentialSg: 1.036, colorEbc: 8.0, type: 'adjunct' as const, group: 'Курский солод' },
  { name: 'Курский Ржаной ферментированный (темный)', potentialSg: 1.030, colorEbc: 150.0, type: 'roasted' as const, group: 'Курский солод' },
  { name: 'Курский Гречишный (Buckwheat Malt)', potentialSg: 1.034, colorEbc: 8.0, type: 'adjunct' as const, group: 'Курский солод' },
  { name: 'Курский Овсяный (Oat Malt)', potentialSg: 1.034, colorEbc: 4.0, type: 'adjunct' as const, group: 'Курский солод' },
  { name: 'Курский Десертный (Карамельный 20 EBC)', potentialSg: 1.033, colorEbc: 20.0, type: 'caramel' as const, group: 'Курский солод' },
  { name: 'Курский Карамельный 50 (Caramel 50 EBC)', potentialSg: 1.034, colorEbc: 50.0, type: 'caramel' as const, group: 'Курский солод' },
  { name: 'Курский Карамельный 100 (Caramel 100 EBC)', potentialSg: 1.034, colorEbc: 100.0, type: 'caramel' as const, group: 'Курский солод' },
  { name: 'Курский Карамельный 150 (Caramel 150 EBC)', potentialSg: 1.033, colorEbc: 150.0, type: 'caramel' as const, group: 'Курский солод' },
  { name: 'Курский Карамельный 200 (Caramel 200 EBC)', potentialSg: 1.033, colorEbc: 200.0, type: 'caramel' as const, group: 'Курский солод' },
  { name: 'Курский Карамельный 250 (Caramel 250 EBC)', potentialSg: 1.032, colorEbc: 250.0, type: 'caramel' as const, group: 'Курский солод' },
  { name: 'Курский Карамельный 300 (Caramel 300 EBC)', potentialSg: 1.032, colorEbc: 300.0, type: 'caramel' as const, group: 'Курский солод' },
  { name: 'Курский Меланоидиновый (Melanoidin 75 EBC)', potentialSg: 1.035, colorEbc: 75.0, type: 'caramel' as const, group: 'Курский солод' },
  { name: 'Курский Бисквитный (Biscuit / Amber 50 EBC)', potentialSg: 1.034, colorEbc: 50.0, type: 'caramel' as const, group: 'Курский солод' },
  { name: 'Курский Шато Кристалл (Crystal 150 EBC)', potentialSg: 1.033, colorEbc: 150.0, type: 'caramel' as const, group: 'Курский солод' },
  { name: 'Курский Кислый (Acidulated Malt)', potentialSg: 1.027, colorEbc: 4.5, type: 'acid' as const, group: 'Курский солод' },
  { name: 'Курский Копченый (Smoked Malt)', potentialSg: 1.036, colorEbc: 6.0, type: 'base' as const, group: 'Курский солод' },
  { name: 'Курский Шоколадный (Chocolate 900 EBC)', potentialSg: 1.028, colorEbc: 900.0, type: 'roasted' as const, group: 'Курский солод' },
  { name: 'Курский Жженый (Roasted Barley 1100 EBC)', potentialSg: 1.025, colorEbc: 1100.0, type: 'roasted' as const, group: 'Курский солод' },
  { name: 'Курский Черный солод (Black Malt 1200 EBC)', potentialSg: 1.025, colorEbc: 1200.0, type: 'roasted' as const, group: 'Курский солод' },
  { name: 'Курский Диафарин (Энзимный ферментативный солод)', potentialSg: 1.037, colorEbc: 3.5, type: 'base' as const, group: 'Курский солод' }
];

// Полный каталог хмелей
export const COMMON_HOPS = [
  // Американские яркие хмели
  { name: 'Citra', alphaAcid: 12.5, profile: 'Грейпфрут, лайм, манго, тропики', region: 'США' },
  { name: 'Mosaic', alphaAcid: 12.0, profile: 'Черника, маракуйя, цитрус, хвоя', region: 'США' },
  { name: 'Simcoe', alphaAcid: 13.0, profile: 'Сосновая смола, маракуйя, земля', region: 'США' },
  { name: 'Cascade', alphaAcid: 6.0, profile: 'Грейпфрутовая цедра, цветы, пряности', region: 'США' },
  { name: 'Centennial', alphaAcid: 10.0, profile: 'Лимон, сосна, супер-каскад', region: 'США' },
  { name: 'Amarillo', alphaAcid: 9.0, profile: 'Сладкий апельсин, персик, абрикос', region: 'США' },
  { name: 'Chinook', alphaAcid: 13.0, profile: 'Хвоя, смола, пряный грейпфрут', region: 'США' },
  { name: 'Columbus / Tomahawk / Zeus (CTZ)', alphaAcid: 15.0, profile: 'Мощная чистая смолистая горечь', region: 'США' },
  { name: 'Sabro', alphaAcid: 14.0, profile: 'Кокос, ананас, мандарин, сливки', region: 'США' },
  { name: 'Idaho 7', alphaAcid: 13.0, profile: 'Абрикос, мармелад, черный чай, хвоя', region: 'США' },

  // Европейские благородные хмели
  { name: 'Saaz (Жатецкий)', alphaAcid: 3.8, profile: 'Благородный травянистый, нежно-пряный лагерный', region: 'Чехия' },
  { name: 'Hallertau Mittelfrüh', alphaAcid: 4.0, profile: 'Нежный цветочный, благородный немецкий', region: 'Германия' },
  { name: 'Tettnanger', alphaAcid: 4.5, profile: 'Цветочно-пряный, травяной тонкий', region: 'Германия' },
  { name: 'Magnum', alphaAcid: 14.0, profile: 'Идеальная чистая базовая горечь без жесткости', region: 'Германия' },
  { name: 'Perle', alphaAcid: 8.0, profile: 'Универсальный немецкий пряно-мятный', region: 'Германия' },
  { name: 'Spalt Select', alphaAcid: 4.5, profile: 'Благородный пряный землистый', region: 'Германия' },

  // Английские классические хмели
  { name: 'East Kent Goldings', alphaAcid: 5.0, profile: 'Лаванда, специи, мед, землистый английский', region: 'Англия' },
  { name: 'Fuggle', alphaAcid: 4.5, profile: 'Древесный, травянистый, чайный традиционный', region: 'Англия' },
  { name: 'Northern Brewer', alphaAcid: 9.0, profile: 'Хвойный, мятный, древесный для стаутов', region: 'Англия' },

  // Австралия и Новая Зеландия
  { name: 'Galaxy', alphaAcid: 14.5, profile: 'Свежая маракуйя, спелый персик, цитрус', region: 'Австралия' },
  { name: 'Nelson Sauvin', alphaAcid: 12.0, profile: 'Белый виноград совиньон-блан, крыжовник', region: 'Новая Зеландия' }
];

// Полный каталог штаммов дрожжей
export const COMMON_YEASTS = [
  {
    name: 'SafAle US-05',
    lab: 'Fermentis',
    form: 'dry' as const,
    type: 'ale' as const,
    cellsPerGramOrVial: 20,
    attenuationPercent: 81,
    tempRange: [18, 26] as [number, number],
    styleDescription: 'Американский эталонный чистый элевый штамм. Максимально раскрывает хмель.'
  },
  {
    name: 'SafAle S-04',
    lab: 'Fermentis',
    form: 'dry' as const,
    type: 'ale' as const,
    cellsPerGramOrVial: 20,
    attenuationPercent: 75,
    tempRange: [15, 20] as [number, number],
    styleDescription: 'Английский элевый штамм: быстрая флокуляция, плотная пена, мягкие эфиры.'
  },
  {
    name: 'SafLager W-34/70',
    lab: 'Fermentis',
    form: 'dry' as const,
    type: 'lager' as const,
    cellsPerGramOrVial: 20,
    attenuationPercent: 83,
    tempRange: [9, 15] as [number, number],
    styleDescription: 'Знаменитый штамм Вайенштефан (Германия). Чистейший лагерный профиль.'
  },
  {
    name: 'SafAle WB-06',
    lab: 'Fermentis',
    form: 'dry' as const,
    type: 'wheat' as const,
    cellsPerGramOrVial: 20,
    attenuationPercent: 86,
    tempRange: [18, 24] as [number, number],
    styleDescription: 'Штамм для баварского пшеничного пива с тонами банана и гвоздики.'
  },
  {
    name: 'SafAle BE-256 (Abbaye)',
    lab: 'Fermentis',
    form: 'dry' as const,
    type: 'belgian' as const,
    cellsPerGramOrVial: 20,
    attenuationPercent: 84,
    tempRange: [18, 25] as [number, number],
    styleDescription: 'Монастырский бельгийский штамм: высокая спиртоустойчивость (Дуббель, Трипель).'
  },
  {
    name: 'SafAle BE-134 (Saison)',
    lab: 'Fermentis',
    form: 'dry' as const,
    type: 'belgian' as const,
    cellsPerGramOrVial: 20,
    attenuationPercent: 90,
    tempRange: [18, 28] as [number, number],
    styleDescription: 'Фермерский сэзон: сбраживает почти в ноль (сухое шипучее тело), пряный перечный букет.'
  },
  {
    name: 'LalBrew Nottingham',
    lab: 'Lallemand',
    form: 'dry' as const,
    type: 'ale' as const,
    cellsPerGramOrVial: 20,
    attenuationPercent: 80,
    tempRange: [14, 21] as [number, number],
    styleDescription: 'Высокоуниверсальный английский штамм: высокая сбраживаемость и кристальное осветление.'
  },
  {
    name: 'LalBrew Voss Kveik',
    lab: 'Lallemand',
    form: 'dry' as const,
    type: 'kveik' as const,
    cellsPerGramOrVial: 20,
    attenuationPercent: 78,
    tempRange: [25, 40] as [number, number],
    styleDescription: 'Норвежский квейк: сбраживает сусло до 40°C за 48 часов без сивушных спиртов с апельсиновым профилем!'
  },

  // Полная линейка дрожжей Mangrove Jack's (Новая Зеландия / Великобритания)
  {
    name: "Mangrove Jack's M02 Cider",
    lab: "Mangrove Jack's",
    form: 'dry' as const,
    type: 'ale' as const,
    cellsPerGramOrVial: 20,
    attenuationPercent: 95,
    tempRange: [12, 28] as [number, number],
    styleDescription: 'Специальный штамм для сидра: сохраняет свежий яблочный аромат, дает чистое сухое тело.'
  },
  {
    name: "Mangrove Jack's M05 Mead",
    lab: "Mangrove Jack's",
    form: 'dry' as const,
    type: 'ale' as const,
    cellsPerGramOrVial: 20,
    attenuationPercent: 95,
    tempRange: [15, 30] as [number, number],
    styleDescription: 'Штамм для медовухи (мида): высокая спиртоустойчивость до 18% ABV, раскрывает цветочные тона меда.'
  },
  {
    name: "Mangrove Jack's M12 Kveik",
    lab: "Mangrove Jack's",
    form: 'dry' as const,
    type: 'kveik' as const,
    cellsPerGramOrVial: 20,
    attenuationPercent: 80,
    tempRange: [20, 40] as [number, number],
    styleDescription: 'Норвежский фермерский квейк: сверхбыстрое сбраживание при высоких температурах с цитрусовым профилем.'
  },
  {
    name: "Mangrove Jack's M15 Empire Ale",
    lab: "Mangrove Jack's",
    form: 'dry' as const,
    type: 'ale' as const,
    cellsPerGramOrVial: 20,
    attenuationPercent: 73,
    tempRange: [18, 22] as [number, number],
    styleDescription: 'Насыщенный английский эль, темные мягкие стили (портеры, стауты, майлды), дает плотное солодовое тело.'
  },
  {
    name: "Mangrove Jack's M20 Bavarian Wheat",
    lab: "Mangrove Jack's",
    form: 'dry' as const,
    type: 'wheat' as const,
    cellsPerGramOrVial: 20,
    attenuationPercent: 73,
    tempRange: [18, 30] as [number, number],
    styleDescription: 'Классическое баварское пшеничное пиво (Hefeweizen, Dunkelweizen): банановые эфиры и пряная гвоздика.'
  },
  {
    name: "Mangrove Jack's M21 Belgian Wit",
    lab: "Mangrove Jack's",
    form: 'dry' as const,
    type: 'wheat' as const,
    cellsPerGramOrVial: 20,
    attenuationPercent: 73,
    tempRange: [18, 25] as [number, number],
    styleDescription: 'Бельгийский бланш / витбир: легкая пряность, фенолы и тонкая фруктовая кислинка, подчеркивает цедру и кориандр.'
  },
  {
    name: "Mangrove Jack's M29 French Saison",
    lab: "Mangrove Jack's",
    form: 'dry' as const,
    type: 'belgian' as const,
    cellsPerGramOrVial: 20,
    attenuationPercent: 88,
    tempRange: [26, 32] as [number, number],
    styleDescription: 'Французский и бельгийский сэзон: сбраживает почти в ноль (высокая аттенюация), перечный сухой пряный профиль.'
  },
  {
    name: "Mangrove Jack's M31 Belgian Tripel",
    lab: "Mangrove Jack's",
    form: 'dry' as const,
    type: 'belgian' as const,
    cellsPerGramOrVial: 20,
    attenuationPercent: 85,
    tempRange: [18, 28] as [number, number],
    styleDescription: 'Крепкие бельгийские эли (Tripel, Belgian Strong Ale): перечные и гвоздичные фенолы, фрукты, спирт до 14%.'
  },
  {
    name: "Mangrove Jack's M36 Liberty Bell Ale",
    lab: "Mangrove Jack's",
    form: 'dry' as const,
    type: 'ale' as const,
    cellsPerGramOrVial: 20,
    attenuationPercent: 76,
    tempRange: [18, 23] as [number, number],
    styleDescription: 'Универсальный британский и американский штамм: мягкие ягодные и карамельные эфиры для бледных и янтарных элей.'
  },
  {
    name: "Mangrove Jack's M41 Belgian Ale",
    lab: "Mangrove Jack's",
    form: 'dry' as const,
    type: 'belgian' as const,
    cellsPerGramOrVial: 20,
    attenuationPercent: 85,
    tempRange: [18, 28] as [number, number],
    styleDescription: 'Пряный бельгийский монастырский эль высокой сбраживаемости (Blond, Dubbel, Golden Strong).'
  },
  {
    name: "Mangrove Jack's M42 New World Strong Ale",
    lab: "Mangrove Jack's",
    form: 'dry' as const,
    type: 'ale' as const,
    cellsPerGramOrVial: 20,
    attenuationPercent: 80,
    tempRange: [16, 22] as [number, number],
    styleDescription: 'Нейтральный чистый профиль для крепких элей, DIPA, Imperial Stout, Barleywine. Быстрое сбраживание.'
  },
  {
    name: "Mangrove Jack's M44 US West Coast",
    lab: "Mangrove Jack's",
    form: 'dry' as const,
    type: 'ale' as const,
    cellsPerGramOrVial: 20,
    attenuationPercent: 81,
    tempRange: [18, 23] as [number, number],
    styleDescription: 'Золотой стандарт для крафтовых IPA и APA: ультра-чистый профиль, сухое тело, максимальное раскрытие хмеля.'
  },
  {
    name: "Mangrove Jack's M47 Belgian Abbey",
    lab: "Mangrove Jack's",
    form: 'dry' as const,
    type: 'belgian' as const,
    cellsPerGramOrVial: 20,
    attenuationPercent: 75,
    tempRange: [18, 25] as [number, number],
    styleDescription: 'Траппистские аббатские эли: умеренная сбраживаемость, ноты банана, специй, сухофруктов и инжира.'
  },
  {
    name: "Mangrove Jack's M54 Californian Lager",
    lab: "Mangrove Jack's",
    form: 'dry' as const,
    type: 'lager' as const,
    cellsPerGramOrVial: 20,
    attenuationPercent: 80,
    tempRange: [18, 20] as [number, number],
    styleDescription: 'Лагерный штамм для теплого сбраживания без холодильника (18-20°C): чистый лагерный профиль без серы.'
  },
  {
    name: "Mangrove Jack's M66 Hophead Ale",
    lab: "Mangrove Jack's",
    form: 'dry' as const,
    type: 'ale' as const,
    cellsPerGramOrVial: 20,
    attenuationPercent: 76,
    tempRange: [18, 22] as [number, number],
    styleDescription: 'Смесь дрожжей и ферментов для усиления биопревращения хмеля в сочных мутных NEIPA, Hazy DIPA.'
  },
  {
    name: "Mangrove Jack's M76 Bavarian Lager",
    lab: "Mangrove Jack's",
    form: 'dry' as const,
    type: 'lager' as const,
    cellsPerGramOrVial: 20,
    attenuationPercent: 78,
    tempRange: [8, 14] as [number, number],
    styleDescription: 'Традиционный баварский лагерный штамм: мягкий солодовый характер для хеллесов, мерцена и темных лагеров.'
  },
  {
    name: "Mangrove Jack's M84 Bohemian Lager",
    lab: "Mangrove Jack's",
    form: 'dry' as const,
    type: 'lager' as const,
    cellsPerGramOrVial: 20,
    attenuationPercent: 74,
    tempRange: [10, 15] as [number, number],
    styleDescription: 'Классический чешский лагер (Bohemian Pilsner): хрустящая чистая горечь и плотное солодовое тело.'
  },
  {
    name: "Mangrove Jack's M03 Newcastle Dark Ale",
    lab: "Mangrove Jack's",
    form: 'dry' as const,
    type: 'ale' as const,
    cellsPerGramOrVial: 20,
    attenuationPercent: 74,
    tempRange: [18, 22] as [number, number],
    styleDescription: 'Английский коричневый эль, майлд, портер. Мягкие фруктовые эфиры и округлое солодовое тело.'
  },
  {
    name: "Mangrove Jack's M07 British Ale",
    lab: "Mangrove Jack's",
    form: 'dry' as const,
    type: 'ale' as const,
    cellsPerGramOrVial: 20,
    attenuationPercent: 75,
    tempRange: [18, 22] as [number, number],
    styleDescription: 'Традиционные английские биттеры, пейл-эли и IPA с выраженным хмелевым акцентом.'
  },
  {
    name: "Mangrove Jack's M10 Workhorse Beer Yeast",
    lab: "Mangrove Jack's",
    form: 'dry' as const,
    type: 'ale' as const,
    cellsPerGramOrVial: 20,
    attenuationPercent: 78,
    tempRange: [15, 28] as [number, number],
    styleDescription: 'Универсальный и выносливый штамм с высокой температурной толерантностью для любых стилей.'
  },
  {
    name: "Mangrove Jack's M24 Belgian Pale Ale",
    lab: "Mangrove Jack's",
    form: 'dry' as const,
    type: 'belgian' as const,
    cellsPerGramOrVial: 20,
    attenuationPercent: 77,
    tempRange: [18, 24] as [number, number],
    styleDescription: 'Бельгийские светлые и янтарные эли с мягким пряным букетом гвоздики и сухофруктов.'
  },
  {
    name: "Mangrove Jack's M27 Belgian Ale",
    lab: "Mangrove Jack's",
    form: 'dry' as const,
    type: 'belgian' as const,
    cellsPerGramOrVial: 20,
    attenuationPercent: 89,
    tempRange: [26, 32] as [number, number],
    styleDescription: 'Классический бельгийский фермерский штамм высокой сбраживаемости и сухим фенольным финишем.'
  },
  {
    name: "Mangrove Jack's M38 Honest Ale",
    lab: "Mangrove Jack's",
    form: 'dry' as const,
    type: 'ale' as const,
    cellsPerGramOrVial: 20,
    attenuationPercent: 75,
    tempRange: [18, 23] as [number, number],
    styleDescription: 'Чистые британские светлые и золотистые эли с легкими эфирами груши и яблока.'
  },
  {
    name: "Mangrove Jack's M45 Belgian Strong Ale",
    lab: "Mangrove Jack's",
    form: 'dry' as const,
    type: 'belgian' as const,
    cellsPerGramOrVial: 20,
    attenuationPercent: 84,
    tempRange: [18, 26] as [number, number],
    styleDescription: 'Бельгийские темные и крепкие эли (Dubbel, Quadrupel), богатые ноты темных фруктов и карамели.'
  },
  {
    name: "Mangrove Jack's M79 Burton Union",
    lab: "Mangrove Jack's",
    form: 'dry' as const,
    type: 'ale' as const,
    cellsPerGramOrVial: 20,
    attenuationPercent: 77,
    tempRange: [18, 23] as [number, number],
    styleDescription: 'Легендарный бёртонский штамм: подчеркивает минеральность воды, сухость и чистую хмелевую горечь.'
  }
];

export const COMMON_ADJUNCTS = [
  { name: 'Декстроза (глюкоза)', category: 'misc' as const, unit: 'g' as const, notes: 'Чистый сахар для праймера карбонизации' },
  { name: 'Лактоза (молочный сахар)', category: 'misc' as const, unit: 'g' as const, notes: 'Несбраживаемый сахар для Milk Stout' },
  { name: 'Ирландский мох (Whirlfloc)', category: 'misc' as const, unit: 'pack' as const, notes: 'Осветлитель сусла за 15 мин до конца кипа' },
  { name: 'Зерна кориандра', category: 'misc' as const, unit: 'g' as const, notes: 'Пряность для бельгийского витбира и гозе' },
  { name: 'Цедра горького апельсина (Кюрасао)', category: 'misc' as const, unit: 'g' as const, notes: 'Цитрусовый аромат для бланшей' },
  { name: 'Морская соль пищевая', category: 'misc' as const, unit: 'g' as const, notes: 'Для немецкого стиля Гозе (Gose)' }
];

// Функция генерации рецепта
function createRecipe(
  id: string,
  name: string,
  style: string,
  category: string,
  description: string,
  author: string,
  batchSizeL: number,
  boilTimeMin: number,
  efficiencyPercent: number,
  grains: Recipe['grains'],
  hops: Recipe['hops'],
  mashSchedule: Recipe['mashSchedule'],
  yeast: Recipe['yeast'],
  targetCarbonationVol: number,
  beerTempAtBottlingC: number,
  tags: string[],
  collection: Recipe['collection'] = undefined
): Recipe {
  const calculated = calculateBrewMetrics({
    batchSizeL,
    boilTimeMin,
    efficiencyPercent,
    grainRatioLPerKg: 3.5,
    grainTempC: 20,
    targetCarbonationVol,
    beerTempAtBottlingC,
    grains,
    hops,
    yeast
  });

  return {
    id,
    name,
    style,
    category,
    description,
    author,
    batchSizeL,
    boilTimeMin,
    efficiencyPercent,
    grainRatioLPerKg: 3.5,
    grainTempC: 20,
    targetCarbonationVol,
    beerTempAtBottlingC,
    grains,
    hops,
    yeast,
    mashSchedule,
    calculated,
    tags,
    collection,
    isCustom: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

// ОБШИРНАЯ БАЗА 30+ ЭТАЛОННЫХ РЕЦЕПТОВ ДЛЯ ОФЛАЙН-ПРОСМОТРА
export const INITIAL_RECIPES: Recipe[] = [
  // 1. Чешский светлый премиум-лагер
  createRecipe(
    'rec_czech_pilsner',
    'Богемский Хрусталь (Czech Pilsner)',
    'Czech Premium Pale Lager',
    'Лагеры',
    'Классический пльзеньский светлый лагер. 100% солод Pilsner, четырехкратная задача жатецкого хмеля Saaz и мягкая вода. Золотистый блеск и плотная кремовая пена.',
    'МастерВарка Классика',
    20, 90, 75,
    [
      { id: 'g1', name: 'Pilsner Malt', weightKg: 4.8, potentialSg: 1.037, colorEbc: 3.5, type: 'base' },
      { id: 'g2', name: 'Carapils', weightKg: 0.2, potentialSg: 1.033, colorEbc: 4.5, type: 'caramel' }
    ],
    [
      { id: 'h1', name: 'Saaz (Жатецкий)', weightG: 35, alphaAcid: 3.8, boilTimeMin: 60, use: 'boil' },
      { id: 'h2', name: 'Saaz (Жатецкий)', weightG: 30, alphaAcid: 3.8, boilTimeMin: 30, use: 'boil' },
      { id: 'h3', name: 'Saaz (Жатецкий)', weightG: 25, alphaAcid: 3.8, boilTimeMin: 15, use: 'aroma' },
      { id: 'h4', name: 'Saaz (Жатецкий)', weightG: 30, alphaAcid: 3.8, boilTimeMin: 0, use: 'whirlpool' }
    ],
    [
      { id: 'm1', name: 'Белковая пауза', tempC: 52, timeMin: 15, type: 'protein' },
      { id: 'm2', name: 'Мальтозная пауза', tempC: 63, timeMin: 45, type: 'maltose' },
      { id: 'm3', name: 'Осахаривание (Декстриновая)', tempC: 72, timeMin: 20, type: 'dextrin' },
      { id: 'm4', name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout' }
    ],
    COMMON_YEASTS[2], // W-34/70
    2.5, 12,
    ['Лагер', 'Чехия', 'Жатецкий', 'Пилснер'],
    'favorites'
  ),

  // 2. Американский IPA Citra
  createRecipe(
    'rec_american_ipa_citra',
    'Цитрусовый Шторм (Citra Wave IPA)',
    'American IPA',
    'Эли / Хмелевые',
    'Флагманский американский IPA с ярким профилем тропических фруктов и грейпфрута. Чистая солодовая база Pale Ale со щепоткой Carapils для стойкой белой пены.',
    'МастерВарка Крафт',
    20, 60, 72,
    [
      { id: 'g1', name: 'Pale Ale Malt', weightKg: 5.0, potentialSg: 1.038, colorEbc: 6.0, type: 'base' },
      { id: 'g2', name: 'Munich I', weightKg: 0.5, potentialSg: 1.036, colorEbc: 15.0, type: 'base' },
      { id: 'g3', name: 'Carapils', weightKg: 0.3, potentialSg: 1.033, colorEbc: 4.5, type: 'caramel' }
    ],
    [
      { id: 'h1', name: 'Magnum', weightG: 20, alphaAcid: 14.0, boilTimeMin: 60, use: 'boil' },
      { id: 'h2', name: 'Citra', weightG: 30, alphaAcid: 12.5, boilTimeMin: 15, use: 'boil' },
      { id: 'h3', name: 'Citra', weightG: 40, alphaAcid: 12.5, boilTimeMin: 0, use: 'whirlpool' },
      { id: 'h4', name: 'Mosaic', weightG: 50, alphaAcid: 12.0, boilTimeMin: 0, use: 'dry_hop' }
    ],
    [
      { id: 'm1', name: 'Осахаривание (Сухой финал)', tempC: 65, timeMin: 65, type: 'maltose' },
      { id: 'm2', name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout' }
    ],
    COMMON_YEASTS[0], // US-05
    2.4, 19,
    ['IPA', 'Хмель', 'Цитрус', 'Америка'],
    'favorites'
  ),

  // 3. Баварский вайцен
  createRecipe(
    'rec_bavarian_weizen',
    'Баварское Золото (Bavarian Weissbier)',
    'Weissbier / Hefeweizen',
    'Пшеничное',
    'Традиционное баварское нефильтрованное пшеничное пиво. 55% пшеничного солода, пышная шапка пены, бархатистая текстура с естественными оттенками банана и гвоздики.',
    'МастерВарка Классика',
    20, 60, 72,
    [
      { id: 'g1', name: 'Wheat Malt (Пшеничный светлый)', weightKg: 2.8, potentialSg: 1.038, colorEbc: 4.0, type: 'wheat' },
      { id: 'g2', name: 'Pilsner Malt', weightKg: 2.0, potentialSg: 1.037, colorEbc: 3.5, type: 'base' },
      { id: 'g3', name: 'Munich I', weightKg: 0.3, potentialSg: 1.036, colorEbc: 15.0, type: 'base' }
    ],
    [
      { id: 'h1', name: 'Hallertau Mittelfrüh', weightG: 22, alphaAcid: 4.0, boilTimeMin: 60, use: 'boil' },
      { id: 'h2', name: 'Hallertau Mittelfrüh', weightG: 15, alphaAcid: 4.0, boilTimeMin: 15, use: 'boil' }
    ],
    [
      { id: 'm1', name: 'Феруловая пауза (Гвоздика)', tempC: 44, timeMin: 15, type: 'acid' },
      { id: 'm2', name: 'Белковая пауза', tempC: 52, timeMin: 15, type: 'protein' },
      { id: 'm3', name: 'Мальтозная', tempC: 64, timeMin: 40, type: 'maltose' },
      { id: 'm4', name: 'Осахаривание', tempC: 72, timeMin: 20, type: 'dextrin' },
      { id: 'm5', name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout' }
    ],
    COMMON_YEASTS[3], // WB-06
    3.0, 18,
    ['Пшеничное', 'Вайцен', 'Бавария', 'Банан'],
    'favorites'
  ),

  // 4. Овсяный стаут
  createRecipe(
    'rec_oatmeal_stout',
    'Черный Бархат (Velvet Oatmeal Stout)',
    'Oatmeal Stout',
    'Темные эли / Портеры',
    'Глубокий непроницаемо-черный стаут с мягким сливочным телом за счет добавления нежных овсяных хлопьев. Ноты обжаренных зерен кофе, горького шоколада и бисквита.',
    'МастерВарка Крафт',
    20, 60, 70,
    [
      { id: 'g1', name: 'Pale Ale Malt', weightKg: 4.2, potentialSg: 1.038, colorEbc: 6.0, type: 'base' },
      { id: 'g2', name: 'Flaked Oats (Овсяные хлопья)', weightKg: 0.6, potentialSg: 1.032, colorEbc: 2.0, type: 'adjunct' },
      { id: 'g3', name: 'Roasted Barley (Жженый ячмень)', weightKg: 0.35, potentialSg: 1.025, colorEbc: 1100.0, type: 'roasted' },
      { id: 'g4', name: 'Chocolate Malt', weightKg: 0.3, potentialSg: 1.028, colorEbc: 900.0, type: 'roasted' },
      { id: 'g5', name: 'Caramunich II', weightKg: 0.25, potentialSg: 1.034, colorEbc: 120.0, type: 'caramel' }
    ],
    [
      { id: 'h1', name: 'Northern Brewer', weightG: 30, alphaAcid: 9.0, boilTimeMin: 60, use: 'boil' },
      { id: 'h2', name: 'East Kent Goldings', weightG: 20, alphaAcid: 5.0, boilTimeMin: 15, use: 'boil' }
    ],
    [
      { id: 'm1', name: 'Полнотелое осахаривание', tempC: 68, timeMin: 60, type: 'dextrin' },
      { id: 'm2', name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout' }
    ],
    COMMON_YEASTS[1], // S-04
    2.0, 19,
    ['Стаут', 'Шоколад', 'Кофе', 'Овес'],
    'favorites'
  ),

  // 5. Бельгийский трипель
  createRecipe(
    'rec_belgian_tripel',
    'Аббатский Трипель (Monk Tripel 8.5%)',
    'Belgian Tripel',
    'Бельгийские эли',
    'Крепкий золотистый монастырский эль со сложным фруктово-пряным букетом груши, белого перца и гвоздики. Замечательная маскировка алкоголя и кремовая белая пена.',
    'МастерВарка Монастырское',
    20, 75, 74,
    [
      { id: 'g1', name: 'Pilsner Malt', weightKg: 6.2, potentialSg: 1.037, colorEbc: 3.5, type: 'base' },
      { id: 'g2', name: 'Vienna Malt', weightKg: 0.5, potentialSg: 1.036, colorEbc: 8.0, type: 'base' }
    ],
    [
      { id: 'h1', name: 'Magnum', weightG: 25, alphaAcid: 14.0, boilTimeMin: 60, use: 'boil' },
      { id: 'h2', name: 'Saaz (Жатецкий)', weightG: 30, alphaAcid: 3.8, boilTimeMin: 15, use: 'boil' },
      { id: 'h3', name: 'Hallertau Mittelfrüh', weightG: 20, alphaAcid: 4.0, boilTimeMin: 5, use: 'boil' }
    ],
    [
      { id: 'm1', name: 'Мальтозная пауза', tempC: 63, timeMin: 50, type: 'maltose' },
      { id: 'm2', name: 'Осахаривание', tempC: 70, timeMin: 20, type: 'dextrin' },
      { id: 'm3', name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout' }
    ],
    COMMON_YEASTS[4], // BE-256
    2.8, 20,
    ['Бельгия', 'Трипель', 'Крепкое', 'Аббатское']
  ),

  // 6. Мюнхенский хеллес
  createRecipe(
    'rec_munich_helles',
    'Мюнхенский Хеллес (Bavarian Helles)',
    'Munich Helles',
    'Лагеры',
    'Истинно баварский золотистый солодовый лагер. Сладковатый зерновой аромат солода Pilsner со сдержанной благородной хмелевой горчинкой хмеля Hallertau.',
    'МастерВарка Классика',
    20, 70, 75,
    [
      { id: 'g1', name: 'Pilsner Malt', weightKg: 4.4, potentialSg: 1.037, colorEbc: 3.5, type: 'base' },
      { id: 'g2', name: 'Munich I', weightKg: 0.4, potentialSg: 1.036, colorEbc: 15.0, type: 'base' },
      { id: 'g3', name: 'Carapils', weightKg: 0.2, potentialSg: 1.033, colorEbc: 4.5, type: 'caramel' }
    ],
    [
      { id: 'h1', name: 'Hallertau Mittelfrüh', weightG: 30, alphaAcid: 4.0, boilTimeMin: 60, use: 'boil' },
      { id: 'h2', name: 'Hallertau Mittelfrüh', weightG: 20, alphaAcid: 4.0, boilTimeMin: 15, use: 'boil' }
    ],
    [
      { id: 'm1', name: 'Мальтозная', tempC: 64, timeMin: 40, type: 'maltose' },
      { id: 'm2', name: 'Осахаривание', tempC: 71, timeMin: 25, type: 'dextrin' },
      { id: 'm3', name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout' }
    ],
    COMMON_YEASTS[2], // W-34/70
    2.5, 12,
    ['Хеллес', 'Лагер', 'Мюнхен', 'Питкое']
  ),

  // 7. Новоанглийский мутный IPA (NEIPA)
  createRecipe(
    'rec_neipa_juicy',
    'Сочный Туман (Juicy Cloud NEIPA)',
    'New England / Hazy IPA',
    'Эли / Хмелевые',
    'Сочный, мутный и шелковистый крафтовый эль. Щедрая добавка овсяных хлопьев, минимальная горечь на кипе и двойное сухое охмеление Citra, Mosaic и Galaxy.',
    'МастерВарка Крафт',
    20, 60, 70,
    [
      { id: 'g1', name: 'Pale Ale Malt', weightKg: 4.5, potentialSg: 1.038, colorEbc: 6.0, type: 'base' },
      { id: 'g2', name: 'Wheat Malt (Пшеничный светлый)', weightKg: 0.8, potentialSg: 1.038, colorEbc: 4.0, type: 'wheat' },
      { id: 'g3', name: 'Flaked Oats (Овсяные хлопья)', weightKg: 0.8, potentialSg: 1.032, colorEbc: 2.0, type: 'adjunct' }
    ],
    [
      { id: 'h1', name: 'Magnum', weightG: 10, alphaAcid: 14.0, boilTimeMin: 60, use: 'boil' },
      { id: 'h2', name: 'Citra', weightG: 40, alphaAcid: 12.5, boilTimeMin: 0, use: 'whirlpool' },
      { id: 'h3', name: 'Mosaic', weightG: 40, alphaAcid: 12.0, boilTimeMin: 0, use: 'whirlpool' },
      { id: 'h4', name: 'Galaxy', weightG: 60, alphaAcid: 14.5, boilTimeMin: 0, use: 'dry_hop' }
    ],
    [
      { id: 'm1', name: 'Плотное тело', tempC: 68, timeMin: 60, type: 'dextrin' },
      { id: 'm2', name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout' }
    ],
    COMMON_YEASTS[0], // US-05
    2.3, 19,
    ['NEIPA', 'Hazy', 'Сочный', 'Тропики', 'Овес'],
    'planned'
  ),

  // 8. Американский бледный эль (APA)
  createRecipe(
    'rec_american_pale_ale',
    'Калифорнийский Закат (Sierra Pale Ale)',
    'American Pale Ale',
    'Эли / Хмелевые',
    'Легендарный питкий эль в стиле западного побережья США. Карамельная солодовая основа со знаменитым хмелем Cascade (грейпфрут, хвоя, цветы).',
    'МастерВарка Крафт',
    20, 60, 74,
    [
      { id: 'g1', name: 'Pale Ale Malt', weightKg: 4.5, potentialSg: 1.038, colorEbc: 6.0, type: 'base' },
      { id: 'g2', name: 'Caramunich I (Карамюнхен 90 EBC)', weightKg: 0.35, potentialSg: 1.034, colorEbc: 90.0, type: 'caramel' },
      { id: 'g3', name: 'Carapils', weightKg: 0.2, potentialSg: 1.033, colorEbc: 4.5, type: 'caramel' }
    ],
    [
      { id: 'h1', name: 'Magnum', weightG: 15, alphaAcid: 14.0, boilTimeMin: 60, use: 'boil' },
      { id: 'h2', name: 'Cascade', weightG: 30, alphaAcid: 6.0, boilTimeMin: 15, use: 'boil' },
      { id: 'h3', name: 'Cascade', weightG: 35, alphaAcid: 6.0, boilTimeMin: 0, use: 'whirlpool' },
      { id: 'h4', name: 'Centennial', weightG: 35, alphaAcid: 10.0, boilTimeMin: 0, use: 'dry_hop' }
    ],
    [
      { id: 'm1', name: 'Сбалансированное осахаривание', tempC: 66, timeMin: 60, type: 'maltose' },
      { id: 'm2', name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout' }
    ],
    COMMON_YEASTS[0],
    2.4, 19,
    ['APA', 'Cascade', 'Америка', 'Грейпфрут']
  ),

  // 9. Бельгийский витбир (Бланш)
  createRecipe(
    'rec_belgian_witbier',
    'Бельгийский Бланш (Blanche de Bruxelles)',
    'Belgian Witbier',
    'Пшеничное',
    'Освежающий элегантный пшеничный эль с несоложеной пшеницей, растертыми зернами кориандра и коркой горького померанца (апельсина кюрасао). Мутный молочно-соломенный цвет.',
    'МастерВарка Традиции',
    20, 60, 72,
    [
      { id: 'g1', name: 'Pilsner Malt', weightKg: 2.3, potentialSg: 1.037, colorEbc: 3.5, type: 'base' },
      { id: 'g2', name: 'Wheat Malt (Пшеничный светлый)', weightKg: 1.8, potentialSg: 1.038, colorEbc: 4.0, type: 'wheat' },
      { id: 'g3', name: 'Flaked Oats (Овсяные хлопья)', weightKg: 0.3, potentialSg: 1.032, colorEbc: 2.0, type: 'adjunct' }
    ],
    [
      { id: 'h1', name: 'Hallertau Mittelfrüh', weightG: 25, alphaAcid: 4.0, boilTimeMin: 60, use: 'boil' },
      { id: 'h2', name: 'Saaz (Жатецкий)', weightG: 15, alphaAcid: 3.8, boilTimeMin: 10, use: 'boil' }
    ],
    [
      { id: 'm1', name: 'Белковая пауза', tempC: 50, timeMin: 20, type: 'protein' },
      { id: 'm2', name: 'Осахаривание', tempC: 65, timeMin: 50, type: 'maltose' },
      { id: 'm3', name: 'Декстриновая', tempC: 72, timeMin: 15, type: 'dextrin' },
      { id: 'm4', name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout' }
    ],
    COMMON_YEASTS[3],
    2.7, 20,
    ['Бланш', 'Витбир', 'Кориандр', 'Апельсин', 'Бельгия']
  ),

  // 10. Русский имперский стаут (RIS)
  createRecipe(
    'rec_imperial_stout',
    'Императорский Оплот (Russian Imperial Stout 10%)',
    'Russian Imperial Stout',
    'Темные эли / Портеры',
    'Могучий, смолянисто-черный согревающий эль королевской плотности 24°P. Глубокие оттенки эспрессо, мадагаскарской ванили, чернослива и горького шоколада.',
    'МастерВарка Крафт',
    20, 90, 68,
    [
      { id: 'g1', name: 'Pale Ale Malt', weightKg: 7.5, potentialSg: 1.038, colorEbc: 6.0, type: 'base' },
      { id: 'g2', name: 'Munich II (Мюнхенский темный 25 EBC)', weightKg: 1.0, potentialSg: 1.035, colorEbc: 25.0, type: 'base' },
      { id: 'g3', name: 'Roasted Barley (Жженый ячмень)', weightKg: 0.6, potentialSg: 1.025, colorEbc: 1100.0, type: 'roasted' },
      { id: 'g4', name: 'Chocolate Malt', weightKg: 0.5, potentialSg: 1.028, colorEbc: 900.0, type: 'roasted' },
      { id: 'g5', name: 'Special B (Спешиал Б)', weightKg: 0.4, potentialSg: 1.032, colorEbc: 300.0, type: 'caramel' }
    ],
    [
      { id: 'h1', name: 'Magnum', weightG: 45, alphaAcid: 14.0, boilTimeMin: 60, use: 'boil' },
      { id: 'h2', name: 'Northern Brewer', weightG: 35, alphaAcid: 9.0, boilTimeMin: 30, use: 'boil' },
      { id: 'h3', name: 'East Kent Goldings', weightG: 30, alphaAcid: 5.0, boilTimeMin: 10, use: 'boil' }
    ],
    [
      { id: 'm1', name: 'Плотное осахаривание', tempC: 67, timeMin: 75, type: 'dextrin' },
      { id: 'm2', name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout' }
    ],
    COMMON_YEASTS[1], // S-04
    2.0, 19,
    ['РИС', 'Имперский', 'Стаут', 'Крепкое', 'Кофе']
  ),

  // 11. Сухой ирландский стаут (Гиннесс стайл)
  createRecipe(
    'rec_dry_irish_stout',
    'Дублинский Вечер (Dry Irish Stout)',
    'Irish Stout',
    'Темные эли / Портеры',
    'Сухой, питкий классический ирландский стаут с характерной сухой кофейной жженкой, кремовой стойкой пеной и умеренным алкоголем 4.2%.',
    'МастерВарка Ирландия',
    20, 60, 72,
    [
      { id: 'g1', name: 'Pale Ale Malt', weightKg: 3.4, potentialSg: 1.038, colorEbc: 6.0, type: 'base' },
      { id: 'g2', name: 'Flaked Barley (Ячменные хлопья)', weightKg: 0.7, potentialSg: 1.032, colorEbc: 3.5, type: 'adjunct' },
      { id: 'g3', name: 'Roasted Barley (Жженый ячмень)', weightKg: 0.4, potentialSg: 1.025, colorEbc: 1100.0, type: 'roasted' }
    ],
    [
      { id: 'h1', name: 'East Kent Goldings', weightG: 40, alphaAcid: 5.0, boilTimeMin: 60, use: 'boil' }
    ],
    [
      { id: 'm1', name: 'Сухое затирание', tempC: 65, timeMin: 60, type: 'maltose' },
      { id: 'm2', name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout' }
    ],
    COMMON_YEASTS[1],
    1.9, 18,
    ['Стаут', 'Ирландия', 'Сухой', 'Жженка']
  ),

  // 12. Сливочный / Молочный стаут (Milk Stout)
  createRecipe(
    'rec_milk_stout',
    'Молочный Шоколад (Sweet Milk Stout)',
    'Sweet Stout',
    'Темные эли / Портеры',
    'Сладковатый десертный стаут с добавлением 500г пищевой молочной лактозы на кипячении. Нежное кремовое тело, напоминающее шоколадный капучино.',
    'МастерВарка Крафт',
    20, 60, 72,
    [
      { id: 'g1', name: 'Pale Ale Malt', weightKg: 4.2, potentialSg: 1.038, colorEbc: 6.0, type: 'base' },
      { id: 'g2', name: 'Flaked Oats (Овсяные хлопья)', weightKg: 0.5, potentialSg: 1.032, colorEbc: 2.0, type: 'adjunct' },
      { id: 'g3', name: 'Chocolate Malt', weightKg: 0.35, potentialSg: 1.028, colorEbc: 900.0, type: 'roasted' },
      { id: 'g4', name: 'Roasted Barley (Жженый ячмень)', weightKg: 0.25, potentialSg: 1.025, colorEbc: 1100.0, type: 'roasted' },
      { id: 'g5', name: 'Caramunich II', weightKg: 0.25, potentialSg: 1.034, colorEbc: 120.0, type: 'caramel' }
    ],
    [
      { id: 'h1', name: 'Magnum', weightG: 18, alphaAcid: 14.0, boilTimeMin: 60, use: 'boil' },
      { id: 'h2', name: 'Fuggle', weightG: 20, alphaAcid: 4.5, boilTimeMin: 15, use: 'boil' }
    ],
    [
      { id: 'm1', name: 'Сладковатое осахаривание', tempC: 68, timeMin: 60, type: 'dextrin' },
      { id: 'm2', name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout' }
    ],
    COMMON_YEASTS[1],
    2.1, 19,
    ['Стаут', 'Лактоза', 'Молочный', 'Десерт']
  ),

  // 13. Лейпцигский гозе (Gose)
  createRecipe(
    'rec_leipzig_gose',
    'Морской Бриз (Leipzig Gose Sour)',
    'Gose',
    'Кислые эли',
    'Традиционный кислый освежающий эль с добавлением щепотки морской соли и зерен кориандра. Яркая цитрусовая кислинка, утоляющая жажду в знойный летний день.',
    'МастерВарка Крафт',
    20, 60, 72,
    [
      { id: 'g1', name: 'Pilsner Malt', weightKg: 2.2, potentialSg: 1.037, colorEbc: 3.5, type: 'base' },
      { id: 'g2', name: 'Wheat Malt (Пшеничный светлый)', weightKg: 2.0, potentialSg: 1.038, colorEbc: 4.0, type: 'wheat' },
      { id: 'g3', name: 'Acidulated Malt (Кислый солод)', weightKg: 0.2, potentialSg: 1.027, colorEbc: 4.5, type: 'acid' }
    ],
    [
      { id: 'h1', name: 'Hallertau Mittelfrüh', weightG: 15, alphaAcid: 4.0, boilTimeMin: 60, use: 'boil' }
    ],
    [
      { id: 'm1', name: 'Осахаривание', tempC: 65, timeMin: 60, type: 'maltose' },
      { id: 'm2', name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout' }
    ],
    COMMON_YEASTS[0],
    2.6, 20,
    ['Гозе', 'Кислый', 'Соль', 'Кориандр', 'Лето']
  ),

  // 14. Сэзон / Фермерский эль (Saison)
  createRecipe(
    'rec_belgian_saison',
    'Фермерский Сэзон (Wallonian Saison)',
    'Saison',
    'Бельгийские эли',
    'Сухой, шипучий и перечный бельгийский фермерский эль. Сброжен штаммом BE-134 почти насухо, раскрывает нюансы белого перца, цитруса и сухих луговых трав.',
    'МастерВарка Валлония',
    20, 60, 75,
    [
      { id: 'g1', name: 'Pilsner Malt', weightKg: 4.5, potentialSg: 1.037, colorEbc: 3.5, type: 'base' },
      { id: 'g2', name: 'Vienna Malt', weightKg: 0.5, potentialSg: 1.036, colorEbc: 8.0, type: 'base' },
      { id: 'g3', name: 'Wheat Malt (Пшеничный светлый)', weightKg: 0.3, potentialSg: 1.038, colorEbc: 4.0, type: 'wheat' }
    ],
    [
      { id: 'h1', name: 'Magnum', weightG: 15, alphaAcid: 14.0, boilTimeMin: 60, use: 'boil' },
      { id: 'h2', name: 'Saaz (Жатецкий)', weightG: 25, alphaAcid: 3.8, boilTimeMin: 15, use: 'boil' },
      { id: 'h3', name: 'East Kent Goldings', weightG: 25, alphaAcid: 5.0, boilTimeMin: 0, use: 'whirlpool' }
    ],
    [
      { id: 'm1', name: 'Низкая мальтозная (Сухой финал)', tempC: 63, timeMin: 75, type: 'maltose' },
      { id: 'm2', name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout' }
    ],
    COMMON_YEASTS[5], // BE-134
    2.9, 24,
    ['Сэзон', 'Бельгия', 'Фермерский', 'Перец', 'Шипучее']
  ),

  // 15. Квейк IPA за 48 часов
  createRecipe(
    'rec_kveik_express_ipa',
    'Скандинавская Молния (Voss Kveik Express 48h)',
    'American IPA',
    'Эли / Хмелевые',
    'Сверхбыстрый крафтовый IPA на норвежском штамме Voss Kveik. Сбраживается при температуре 35-38°C за 48-72 часа без малейших дефектов с натуральным апельсиновым букетом!',
    'МастерВарка Крафт',
    20, 60, 72,
    [
      { id: 'g1', name: 'Pale Ale Malt', weightKg: 5.2, potentialSg: 1.038, colorEbc: 6.0, type: 'base' },
      { id: 'g2', name: 'Carapils', weightKg: 0.3, potentialSg: 1.033, colorEbc: 4.5, type: 'caramel' }
    ],
    [
      { id: 'h1', name: 'Magnum', weightG: 18, alphaAcid: 14.0, boilTimeMin: 60, use: 'boil' },
      { id: 'h2', name: 'Citra', weightG: 30, alphaAcid: 12.5, boilTimeMin: 10, use: 'boil' },
      { id: 'h3', name: 'Mosaic', weightG: 40, alphaAcid: 12.0, boilTimeMin: 0, use: 'whirlpool' },
      { id: 'h4', name: 'Citra', weightG: 50, alphaAcid: 12.5, boilTimeMin: 0, use: 'dry_hop' }
    ],
    [
      { id: 'm1', name: 'Осахаривание', tempC: 66, timeMin: 60, type: 'maltose' },
      { id: 'm2', name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout' }
    ],
    COMMON_YEASTS[7], // Voss Kveik
    2.4, 35,
    ['Квейк', 'Kveik', 'Экспресс', '48часов', 'Норвегия']
  ),

  // 16. Венский лагер (Vienna Lager)
  createRecipe(
    'rec_vienna_lager',
    'Венский Вальс (Vienna Amber Lager)',
    'Vienna Lager',
    'Лагеры',
    'Элегантный янтарный австрийский лагер с глубоким поджаристым солодовым вкусом венского солода и чистым лагерным финалом.',
    'МастерВарка Классика',
    20, 75, 75,
    [
      { id: 'g1', name: 'Vienna Malt', weightKg: 3.5, potentialSg: 1.036, colorEbc: 8.0, type: 'base' },
      { id: 'g2', name: 'Pilsner Malt', weightKg: 1.2, potentialSg: 1.037, colorEbc: 3.5, type: 'base' },
      { id: 'g3', name: 'Caramunich I (Карамюнхен 90 EBC)', weightKg: 0.3, potentialSg: 1.034, colorEbc: 90.0, type: 'caramel' }
    ],
    [
      { id: 'h1', name: 'Hallertau Mittelfrüh', weightG: 30, alphaAcid: 4.0, boilTimeMin: 60, use: 'boil' },
      { id: 'h2', name: 'Tettnanger', weightG: 20, alphaAcid: 4.5, boilTimeMin: 20, use: 'boil' }
    ],
    [
      { id: 'm1', name: 'Мальтозная', tempC: 64, timeMin: 45, type: 'maltose' },
      { id: 'm2', name: 'Декстриновая', tempC: 71, timeMin: 20, type: 'dextrin' },
      { id: 'm3', name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout' }
    ],
    COMMON_YEASTS[2],
    2.5, 12,
    ['Лагер', 'Венский', 'Янтарное', 'Австрия']
  ),

  // 17. Английский лучший биттер (Best Bitter ESB)
  createRecipe(
    'rec_english_esb',
    'Лондонский Паб (Extra Special Bitter)',
    'English Best Bitter',
    'Эли / Хмелевые',
    'Классический английский пабный янтарный эль. Солодовая основа Maris Otter с карамельными тонами и благородными хмелями East Kent Goldings и Fuggle.',
    'МастерВарка Англия',
    20, 60, 74,
    [
      { id: 'g1', name: 'Maris Otter (Английский Пэйл)', weightKg: 4.2, potentialSg: 1.038, colorEbc: 6.5, type: 'base' },
      { id: 'g2', name: 'Caramunich II', weightKg: 0.35, potentialSg: 1.034, colorEbc: 120.0, type: 'caramel' },
      { id: 'g3', name: 'Chocolate Malt', weightKg: 0.05, potentialSg: 1.028, colorEbc: 900.0, type: 'roasted' }
    ],
    [
      { id: 'h1', name: 'East Kent Goldings', weightG: 35, alphaAcid: 5.0, boilTimeMin: 60, use: 'boil' },
      { id: 'h2', name: 'Fuggle', weightG: 25, alphaAcid: 4.5, boilTimeMin: 15, use: 'boil' }
    ],
    [
      { id: 'm1', name: 'Осахаривание', tempC: 67, timeMin: 60, type: 'maltose' },
      { id: 'm2', name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout' }
    ],
    COMMON_YEASTS[1], // S-04
    2.0, 18,
    ['Биттер', 'ESB', 'Англия', 'Паб', 'Карамель']
  ),

  // 18. Ирландский красный эль (Irish Red Ale)
  createRecipe(
    'rec_irish_red_ale',
    'Кельтский Огонь (Irish Red Ale)',
    'Irish Red Ale',
    'Эли / Хмелевые',
    'Питкий эль рубиново-красного цвета с мягкой ирисочно-карамельной сладостью, легким намеком на поджаренное зерно и сухим чистым послевкусием.',
    'МастерВарка Ирландия',
    20, 60, 74,
    [
      { id: 'g1', name: 'Pale Ale Malt', weightKg: 4.2, potentialSg: 1.038, colorEbc: 6.0, type: 'base' },
      { id: 'g2', name: 'Carared (Караред 50 EBC)', weightKg: 0.5, potentialSg: 1.034, colorEbc: 50.0, type: 'caramel' },
      { id: 'g3', name: 'Roasted Barley (Жженый ячмень)', weightKg: 0.06, potentialSg: 1.025, colorEbc: 1100.0, type: 'roasted' }
    ],
    [
      { id: 'h1', name: 'East Kent Goldings', weightG: 30, alphaAcid: 5.0, boilTimeMin: 60, use: 'boil' },
      { id: 'h2', name: 'Fuggle', weightG: 15, alphaAcid: 4.5, boilTimeMin: 15, use: 'boil' }
    ],
    [
      { id: 'm1', name: 'Осахаривание', tempC: 66, timeMin: 60, type: 'maltose' },
      { id: 'm2', name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout' }
    ],
    COMMON_YEASTS[1],
    2.2, 18,
    ['Красный эль', 'Ирландия', 'Карамель', 'Рубин']
  ),

  // 19. Бельгийский дуббель (Belgian Dubbel)
  createRecipe(
    'rec_belgian_dubbel',
    'Монастырский Дуббель (Abbey Dubbel 7.0%)',
    'Belgian Dubbel',
    'Бельгийские эли',
    'Темно-янтарный крепкий траппистский эль с богатым букетом темных фруктов (чернослив, сушеный инжир, темный изюм) и пряными фенолами бельгийских дрожжей.',
    'МастерВарка Монастырское',
    20, 75, 73,
    [
      { id: 'g1', name: 'Pilsner Malt', weightKg: 4.8, potentialSg: 1.037, colorEbc: 3.5, type: 'base' },
      { id: 'g2', name: 'Munich II (Мюнхенский темный 25 EBC)', weightKg: 0.8, potentialSg: 1.035, colorEbc: 25.0, type: 'base' },
      { id: 'g3', name: 'Special B (Спешиал Б)', weightKg: 0.35, potentialSg: 1.032, colorEbc: 300.0, type: 'caramel' },
      { id: 'g4', name: 'Caraaroma (Караарома 350 EBC)', weightKg: 0.2, potentialSg: 1.033, colorEbc: 350.0, type: 'caramel' }
    ],
    [
      { id: 'h1', name: 'Magnum', weightG: 18, alphaAcid: 14.0, boilTimeMin: 60, use: 'boil' },
      { id: 'h2', name: 'Saaz (Жатецкий)', weightG: 25, alphaAcid: 3.8, boilTimeMin: 15, use: 'boil' }
    ],
    [
      { id: 'm1', name: 'Мальтозная', tempC: 64, timeMin: 45, type: 'maltose' },
      { id: 'm2', name: 'Декстриновая', tempC: 70, timeMin: 25, type: 'dextrin' },
      { id: 'm3', name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout' }
    ],
    COMMON_YEASTS[4], // BE-256
    2.7, 21,
    ['Дуббель', 'Бельгия', 'Траппист', 'Изюм', 'Крепкое']
  ),

  // 20. Кёльш (Kölsch)
  createRecipe(
    'rec_cologne_kolsch',
    'Кёльнский Свежий (Cologne Kölsch)',
    'Kölsch',
    'Эли / Хмелевые',
    'Невероятно легкий, хрустящий светлый гибридный эль из города Кёльн. Сбраживается элевыми дрожжами при прохладной температуре с последующей долгой лагеризацией.',
    'МастерВарка Германия',
    20, 60, 75,
    [
      { id: 'g1', name: 'Pilsner Malt', weightKg: 4.2, potentialSg: 1.037, colorEbc: 3.5, type: 'base' },
      { id: 'g2', name: 'Wheat Malt (Пшеничный светлый)', weightKg: 0.3, potentialSg: 1.038, colorEbc: 4.0, type: 'wheat' }
    ],
    [
      { id: 'h1', name: 'Hallertau Mittelfrüh', weightG: 30, alphaAcid: 4.0, boilTimeMin: 60, use: 'boil' },
      { id: 'h2', name: 'Tettnanger', weightG: 20, alphaAcid: 4.5, boilTimeMin: 15, use: 'boil' }
    ],
    [
      { id: 'm1', name: 'Осахаривание на сухой финал', tempC: 65, timeMin: 60, type: 'maltose' },
      { id: 'm2', name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout' }
    ],
    COMMON_YEASTS[6], // Nottingham
    2.5, 14,
    ['Кёльш', 'Германия', 'Легкое', 'Хрустящее']
  ),

  // 21. Немецкий Пилснер (German Pils)
  createRecipe(
    'rec_german_pils',
    'Северный Норд (German Northern Pils)',
    'German Pils',
    'Лагеры',
    'Сухой, искрящийся светло-соломенный лагер с акцентированной, хрустящей горечью благородных немецких хмелей Hallertau и Tettnanger. Идеально чистый финал.',
    'МастерВарка Германия',
    20, 75, 75,
    [
      { id: 'g1', name: 'Pilsner Malt', weightKg: 4.5, potentialSg: 1.037, colorEbc: 3.5, type: 'base' },
      { id: 'g2', name: 'Carapils', weightKg: 0.2, potentialSg: 1.033, colorEbc: 4.5, type: 'caramel' },
      { id: 'g3', name: 'Acidulated Malt (Кислый солод)', weightKg: 0.1, potentialSg: 1.027, colorEbc: 4.5, type: 'acid' }
    ],
    [
      { id: 'h1', name: 'Magnum', weightG: 18, alphaAcid: 14.0, boilTimeMin: 60, use: 'boil' },
      { id: 'h2', name: 'Hallertau Mittelfrüh', weightG: 25, alphaAcid: 4.0, boilTimeMin: 20, use: 'boil' },
      { id: 'h3', name: 'Tettnanger', weightG: 25, alphaAcid: 4.5, boilTimeMin: 5, use: 'boil' }
    ],
    [
      { id: 'm1', name: 'Белковая пауза', tempC: 52, timeMin: 15, type: 'protein' },
      { id: 'm2', name: 'Мальтозная пауза', tempC: 63, timeMin: 50, type: 'maltose' },
      { id: 'm3', name: 'Осахаривание', tempC: 71, timeMin: 20, type: 'dextrin' },
      { id: 'm4', name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout' }
    ],
    COMMON_YEASTS[2], // W-34/70
    2.5, 11,
    ['Пилснер', 'Германия', 'Сухое', 'Хмель', 'Лагер']
  ),

  // 22. Октоберфест Марцен (Märzen / Oktoberfest)
  createRecipe(
    'rec_oktoberfest_marzen',
    'Мюнхенский Октоберфест (Bavarian Märzen)',
    'Märzen',
    'Лагеры',
    'Праздничный янтарный баварский лагер. Глубокий, насыщенный хлебно-тостовый вкус солодов Munich и Vienna с благородной травянистой ноткой Hallertau.',
    'МастерВарка Бавария',
    20, 75, 75,
    [
      { id: 'g1', name: 'Munich I (Мюнхенский светлый 15 EBC)', weightKg: 2.8, potentialSg: 1.036, colorEbc: 15.0, type: 'base' },
      { id: 'g2', name: 'Vienna Malt (Венский)', weightKg: 1.8, potentialSg: 1.036, colorEbc: 8.0, type: 'base' },
      { id: 'g3', name: 'Pilsner Malt', weightKg: 0.8, potentialSg: 1.037, colorEbc: 3.5, type: 'base' },
      { id: 'g4', name: 'Caramunich II', weightKg: 0.25, potentialSg: 1.034, colorEbc: 120.0, type: 'caramel' }
    ],
    [
      { id: 'h1', name: 'Hallertau Mittelfrüh', weightG: 30, alphaAcid: 4.0, boilTimeMin: 60, use: 'boil' },
      { id: 'h2', name: 'Tettnanger', weightG: 20, alphaAcid: 4.5, boilTimeMin: 15, use: 'boil' }
    ],
    [
      { id: 'm1', name: 'Мальтозная', tempC: 64, timeMin: 45, type: 'maltose' },
      { id: 'm2', name: 'Декстриновая', tempC: 71, timeMin: 25, type: 'dextrin' },
      { id: 'm3', name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout' }
    ],
    COMMON_YEASTS[2], // W-34/70
    2.5, 12,
    ['Марцен', 'Октоберфест', 'Бавария', 'Янтарный', 'Лагер']
  ),

  // 23. Мюнхенский дункель (Munich Dunkel)
  createRecipe(
    'rec_munich_dunkel',
    'Баварская Ночь (Munich Dunkel Lager)',
    'Munich Dunkel',
    'Лагеры',
    'Традиционный темный лагер Баварии. Доминирование темного мюнхенского солода дарит теплый вкус поджаренной корочки ржаного хлеба, шоколада и орехов без жженой горечи.',
    'МастерВарка Бавария',
    20, 75, 74,
    [
      { id: 'g1', name: 'Munich II (Мюнхенский темный 25 EBC)', weightKg: 4.2, potentialSg: 1.035, colorEbc: 25.0, type: 'base' },
      { id: 'g2', name: 'Pilsner Malt', weightKg: 0.8, potentialSg: 1.037, colorEbc: 3.5, type: 'base' },
      { id: 'g3', name: 'Carafa Special I', weightKg: 0.15, potentialSg: 1.029, colorEbc: 900.0, type: 'roasted' },
      { id: 'g4', name: 'Melanoidin Malt', weightKg: 0.2, potentialSg: 1.035, colorEbc: 70.0, type: 'caramel' }
    ],
    [
      { id: 'h1', name: 'Hallertau Mittelfrüh', weightG: 32, alphaAcid: 4.0, boilTimeMin: 60, use: 'boil' },
      { id: 'h2', name: 'Hallertau Mittelfrüh', weightG: 18, alphaAcid: 4.0, boilTimeMin: 15, use: 'boil' }
    ],
    [
      { id: 'm1', name: 'Мальтозная', tempC: 64, timeMin: 40, type: 'maltose' },
      { id: 'm2', name: 'Осахаривание', tempC: 70, timeMin: 25, type: 'dextrin' },
      { id: 'm3', name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout' }
    ],
    COMMON_YEASTS[2], // W-34/70
    2.4, 12,
    ['Дункель', 'Темный лагер', 'Мюнхен', 'Хлебный']
  ),

  // 24. Балтийский портер (Baltic Porter)
  createRecipe(
    'rec_baltic_porter',
    'Балтийская Корона (Baltic Imperial Porter 8.4%)',
    'Baltic Porter',
    'Темные эли / Портеры',
    'Мощный, согревающий темный лагер балтийского региона. Плотность 20°P, бархатистый вкус карамели, темной патоки, чернослива и какао, сглаженный холодным лагерным брожением.',
    'МастерВарка Балтика',
    20, 90, 72,
    [
      { id: 'g1', name: 'Munich II (Мюнхенский темный 25 EBC)', weightKg: 4.0, potentialSg: 1.035, colorEbc: 25.0, type: 'base' },
      { id: 'g2', name: 'Pilsner Malt', weightKg: 2.5, potentialSg: 1.037, colorEbc: 3.5, type: 'base' },
      { id: 'g3', name: 'Caramunich III', weightKg: 0.6, potentialSg: 1.033, colorEbc: 150.0, type: 'caramel' },
      { id: 'g4', name: 'Special B (Спешиал Б)', weightKg: 0.35, potentialSg: 1.032, colorEbc: 300.0, type: 'caramel' },
      { id: 'g5', name: 'Carafa Special III', weightKg: 0.25, potentialSg: 1.028, colorEbc: 1400.0, type: 'roasted' }
    ],
    [
      { id: 'h1', name: 'Magnum', weightG: 30, alphaAcid: 14.0, boilTimeMin: 60, use: 'boil' },
      { id: 'h2', name: 'Saaz (Жатецкий)', weightG: 25, alphaAcid: 3.8, boilTimeMin: 15, use: 'boil' },
      { id: 'h3', name: 'Saaz (Жатецкий)', weightG: 20, alphaAcid: 3.8, boilTimeMin: 5, use: 'boil' }
    ],
    [
      { id: 'm1', name: 'Мальтозная пауза', tempC: 65, timeMin: 50, type: 'maltose' },
      { id: 'm2', name: 'Осахаривание', tempC: 71, timeMin: 25, type: 'dextrin' },
      { id: 'm3', name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout' }
    ],
    COMMON_YEASTS[2], // W-34/70
    2.3, 12,
    ['Портер', 'Балтика', 'Крепкое', 'Чернослив', 'Лагер']
  ),

  // 25. Двойной IPA (Double IPA / DIPA)
  createRecipe(
    'rec_west_coast_dipa',
    'Калифорнийский Титан (West Coast DIPA 8.2%)',
    'Double IPA',
    'Эли / Хмелевые',
    'Бескомпромиссный хмелевой монстр в стиле Западного побережья США. Взрывная смесь хмелей CTZ, Simcoe, Citra и Amarillo. Мощная смолистая хвоя, сочный грейпфрут и уверенные 80 IBU.',
    'МастерВарка Крафт',
    20, 75, 73,
    [
      { id: 'g1', name: 'Pale Ale Malt', weightKg: 6.5, potentialSg: 1.038, colorEbc: 6.0, type: 'base' },
      { id: 'g2', name: 'Munich I', weightKg: 0.6, potentialSg: 1.036, colorEbc: 15.0, type: 'base' },
      { id: 'g3', name: 'Carapils', weightKg: 0.3, potentialSg: 1.033, colorEbc: 4.5, type: 'caramel' }
    ],
    [
      { id: 'h1', name: 'Columbus / Tomahawk / Zeus (CTZ)', weightG: 35, alphaAcid: 15.0, boilTimeMin: 60, use: 'boil' },
      { id: 'h2', name: 'Simcoe', weightG: 30, alphaAcid: 13.0, boilTimeMin: 15, use: 'boil' },
      { id: 'h3', name: 'Citra', weightG: 40, alphaAcid: 12.5, boilTimeMin: 0, use: 'whirlpool' },
      { id: 'h4', name: 'Simcoe', weightG: 50, alphaAcid: 13.0, boilTimeMin: 0, use: 'dry_hop' },
      { id: 'h5', name: 'Amarillo', weightG: 40, alphaAcid: 9.0, boilTimeMin: 0, use: 'dry_hop' }
    ],
    [
      { id: 'm1', name: 'Сухое осахаривание', tempC: 64, timeMin: 65, type: 'maltose' },
      { id: 'm2', name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout' }
    ],
    COMMON_YEASTS[0], // US-05
    2.4, 19,
    ['DIPA', 'Двойной IPA', 'Хмель', 'Хвоя', 'Горечь', 'Крепкое']
  ),

  // 26. Сессионный IPA (Session IPA)
  createRecipe(
    'rec_session_ipa',
    'Летний Бриз (All-Day Session IPA 4.2%)',
    'Session IPA',
    'Эли / Хмелевые',
    'Легкий, невероятно питкий эль на весь день. Невысокая плотность 10.5°P компенсируется овсяными хлопьями и щедрым ароматическим охмелением Mosaic и Citra.',
    'МастерВарка Крафт',
    20, 60, 72,
    [
      { id: 'g1', name: 'Pale Ale Malt', weightKg: 3.4, potentialSg: 1.038, colorEbc: 6.0, type: 'base' },
      { id: 'g2', name: 'Flaked Oats (Овсяные хлопья)', weightKg: 0.5, potentialSg: 1.032, colorEbc: 2.0, type: 'adjunct' },
      { id: 'g3', name: 'Munich I', weightKg: 0.3, potentialSg: 1.036, colorEbc: 15.0, type: 'base' },
      { id: 'g4', name: 'Carapils', weightKg: 0.2, potentialSg: 1.033, colorEbc: 4.5, type: 'caramel' }
    ],
    [
      { id: 'h1', name: 'Magnum', weightG: 12, alphaAcid: 14.0, boilTimeMin: 60, use: 'boil' },
      { id: 'h2', name: 'Mosaic', weightG: 30, alphaAcid: 12.0, boilTimeMin: 5, use: 'boil' },
      { id: 'h3', name: 'Citra', weightG: 40, alphaAcid: 12.5, boilTimeMin: 0, use: 'whirlpool' },
      { id: 'h4', name: 'Mosaic', weightG: 40, alphaAcid: 12.0, boilTimeMin: 0, use: 'dry_hop' }
    ],
    [
      { id: 'm1', name: 'Полнотелое осахаривание', tempC: 68, timeMin: 60, type: 'dextrin' },
      { id: 'm2', name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout' }
    ],
    COMMON_YEASTS[0], // US-05
    2.4, 19,
    ['Сессионный', 'Легкое', 'IPA', 'Mosaic', 'Цитрус']
  ),

  // 27. Традиционный английский IPA (English IPA)
  createRecipe(
    'rec_english_colonial_ipa',
    'Колониальный Капитан (English Colonial IPA)',
    'English IPA',
    'Эли / Хмелевые',
    'Исторический английский эль XIX века. База из отборного солода Maris Otter, карамельная подложка и строгая землисто-цветочная горечь благородных хмелей East Kent Goldings и Fuggles.',
    'МастерВарка Англия',
    20, 60, 74,
    [
      { id: 'g1', name: 'Maris Otter (Английский Пэйл)', weightKg: 4.8, potentialSg: 1.038, colorEbc: 6.5, type: 'base' },
      { id: 'g2', name: 'Caramunich I (Карамюнхен 90 EBC)', weightKg: 0.35, potentialSg: 1.034, colorEbc: 90.0, type: 'caramel' }
    ],
    [
      { id: 'h1', name: 'East Kent Goldings', weightG: 45, alphaAcid: 5.0, boilTimeMin: 60, use: 'boil' },
      { id: 'h2', name: 'Fuggle', weightG: 30, alphaAcid: 4.5, boilTimeMin: 20, use: 'boil' },
      { id: 'h3', name: 'East Kent Goldings', weightG: 25, alphaAcid: 5.0, boilTimeMin: 5, use: 'boil' }
    ],
    [
      { id: 'm1', name: 'Осахаривание', tempC: 66, timeMin: 60, type: 'maltose' },
      { id: 'm2', name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout' }
    ],
    COMMON_YEASTS[1], // S-04
    2.2, 19,
    ['Англия', 'IPA', 'Goldings', 'Традиции']
  ),

  // 28. Черный IPA / Cascadian Dark Ale (Black IPA)
  createRecipe(
    'rec_black_cascadian_ipa',
    'Черная Пантера (Cascadian Black IPA)',
    'Black IPA',
    'Эли / Хмелевые',
    'Интригующий гибридный стиль: цвет ночного неба и взрывной аромат сосны и грейпфрута. Специальный солод Carafa без шелухи дает цвет без кофейной терпкости.',
    'МастерВарка Крафт',
    20, 60, 72,
    [
      { id: 'g1', name: 'Pale Ale Malt', weightKg: 5.2, potentialSg: 1.038, colorEbc: 6.0, type: 'base' },
      { id: 'g2', name: 'Carafa Special III', weightKg: 0.4, potentialSg: 1.028, colorEbc: 1400.0, type: 'roasted' },
      { id: 'g3', name: 'Munich I', weightKg: 0.4, potentialSg: 1.036, colorEbc: 15.0, type: 'base' },
      { id: 'g4', name: 'Carapils', weightKg: 0.25, potentialSg: 1.033, colorEbc: 4.5, type: 'caramel' }
    ],
    [
      { id: 'h1', name: 'Magnum', weightG: 22, alphaAcid: 14.0, boilTimeMin: 60, use: 'boil' },
      { id: 'h2', name: 'Chinook', weightG: 25, alphaAcid: 13.0, boilTimeMin: 15, use: 'boil' },
      { id: 'h3', name: 'Cascade', weightG: 35, alphaAcid: 6.0, boilTimeMin: 0, use: 'whirlpool' },
      { id: 'h4', name: 'Simcoe', weightG: 45, alphaAcid: 13.0, boilTimeMin: 0, use: 'dry_hop' }
    ],
    [
      { id: 'm1', name: 'Осахаривание (Carafa задается за 15 мин до конца)', tempC: 65, timeMin: 60, type: 'maltose' },
      { id: 'm2', name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout' }
    ],
    COMMON_YEASTS[0], // US-05
    2.4, 19,
    ['Black IPA', 'Темный IPA', 'Хмель', 'Хвоя']
  ),

  // 29. Дункельвайцен (Dunkelweizen)
  createRecipe(
    'rec_bavarian_dunkelweizen',
    'Баварский Сумрак (Munich Dunkelweizen)',
    'Dunkelweizen',
    'Пшеничное',
    'Темное баварское пшеничное пиво. Сочетает бананово-гвоздичные эфиры вайцена с мягкой карамелью, свежим бисквитом и изюмом от темных мюнхенских солодов.',
    'МастерВарка Бавария',
    20, 60, 72,
    [
      { id: 'g1', name: 'Wheat Malt (Пшеничный светлый)', weightKg: 2.6, potentialSg: 1.038, colorEbc: 4.0, type: 'wheat' },
      { id: 'g2', name: 'Munich II (Мюнхенский темный 25 EBC)', weightKg: 1.8, potentialSg: 1.035, colorEbc: 25.0, type: 'base' },
      { id: 'g3', name: 'Caramunich II', weightKg: 0.3, potentialSg: 1.034, colorEbc: 120.0, type: 'caramel' },
      { id: 'g4', name: 'Carafa Special I', weightKg: 0.08, potentialSg: 1.029, colorEbc: 900.0, type: 'roasted' }
    ],
    [
      { id: 'h1', name: 'Hallertau Mittelfrüh', weightG: 22, alphaAcid: 4.0, boilTimeMin: 60, use: 'boil' },
      { id: 'h2', name: 'Tettnanger', weightG: 15, alphaAcid: 4.5, boilTimeMin: 10, use: 'boil' }
    ],
    [
      { id: 'm1', name: 'Феруловая (Гвоздика)', tempC: 44, timeMin: 15, type: 'acid' },
      { id: 'm2', name: 'Белковая', tempC: 52, timeMin: 15, type: 'protein' },
      { id: 'm3', name: 'Мальтозная', tempC: 64, timeMin: 40, type: 'maltose' },
      { id: 'm4', name: 'Осахаривание', tempC: 72, timeMin: 20, type: 'dextrin' },
      { id: 'm5', name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout' }
    ],
    COMMON_YEASTS[3], // WB-06
    3.0, 19,
    ['Дункельвайцен', 'Пшеничное', 'Темное', 'Банан', 'Бавария']
  ),

  // 30. Берлинер Вайссе (Berliner Weisse)
  createRecipe(
    'rec_berliner_weisse',
    'Берлинское Шампанское (Berliner Weisse)',
    'Berliner Weisse',
    'Кислые эли',
    'Исторический берлинский освежающий кислый эль, прозванный наполеоновскими солдатами «северным шампанским». Легкий алкоголь 3.2%, чистая бодрящая молочнокислая свежесть.',
    'МастерВарка Германия',
    20, 45, 74,
    [
      { id: 'g1', name: 'Pilsner Malt', weightKg: 1.6, potentialSg: 1.037, colorEbc: 3.5, type: 'base' },
      { id: 'g2', name: 'Wheat Malt (Пшеничный светлый)', weightKg: 1.4, potentialSg: 1.038, colorEbc: 4.0, type: 'wheat' },
      { id: 'g3', name: 'Acidulated Malt (Кислый солод)', weightKg: 0.35, potentialSg: 1.027, colorEbc: 4.5, type: 'acid' }
    ],
    [
      { id: 'h1', name: 'Hallertau Mittelfrüh', weightG: 12, alphaAcid: 4.0, boilTimeMin: 45, use: 'boil' }
    ],
    [
      { id: 'm1', name: 'Белковая', tempC: 50, timeMin: 20, type: 'protein' },
      { id: 'm2', name: 'Осахаривание', tempC: 65, timeMin: 50, type: 'maltose' },
      { id: 'm3', name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout' }
    ],
    COMMON_YEASTS[0], // US-05
    3.2, 20,
    ['Берлинер', 'Кислый', 'Легкое', 'Шампанское', 'Лето']
  ),

  // 31. Лондонский портер (London Porter)
  createRecipe(
    'rec_london_porter',
    'Темза на Рассвете (London Brown Porter)',
    'English Porter',
    'Темные эли / Портеры',
    'Уравновешенный исторический портер лондонских докеров. Бархатистые тона молочного шоколада, лесного ореха, поджаренного тоста и карамели со сдержанной горечью Fuggle.',
    'МастерВарка Англия',
    20, 60, 72,
    [
      { id: 'g1', name: 'Maris Otter (Английский Пэйл)', weightKg: 4.0, potentialSg: 1.038, colorEbc: 6.5, type: 'base' },
      { id: 'g2', name: 'Caramunich II', weightKg: 0.4, potentialSg: 1.034, colorEbc: 120.0, type: 'caramel' },
      { id: 'g3', name: 'Chocolate Malt', weightKg: 0.3, potentialSg: 1.028, colorEbc: 900.0, type: 'roasted' },
      { id: 'g4', name: 'Carapils', weightKg: 0.2, potentialSg: 1.033, colorEbc: 4.5, type: 'caramel' }
    ],
    [
      { id: 'h1', name: 'Northern Brewer', weightG: 25, alphaAcid: 9.0, boilTimeMin: 60, use: 'boil' },
      { id: 'h2', name: 'Fuggle', weightG: 20, alphaAcid: 4.5, boilTimeMin: 15, use: 'boil' }
    ],
    [
      { id: 'm1', name: 'Осахаривание', tempC: 67, timeMin: 60, type: 'maltose' },
      { id: 'm2', name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout' }
    ],
    COMMON_YEASTS[1], // S-04
    2.1, 19,
    ['Портер', 'Лондон', 'Шоколад', 'Орех', 'Англия']
  ),

  // 32. Американский стаут (American Stout)
  createRecipe(
    'rec_american_stout',
    'Черный Метеор (American Craft Stout)',
    'American Stout',
    'Темные эли / Портеры',
    'Смелый крафтовый стаут американской школы. Глубокая кофейная и шоколадная база поддержана мощной цитрусово-хвойной горечью хмелей Chinook и Cascade.',
    'МастерВарка Крафт',
    20, 60, 71,
    [
      { id: 'g1', name: 'Pale Ale Malt', weightKg: 4.6, potentialSg: 1.038, colorEbc: 6.0, type: 'base' },
      { id: 'g2', name: 'Roasted Barley (Жженый ячмень)', weightKg: 0.45, potentialSg: 1.025, colorEbc: 1100.0, type: 'roasted' },
      { id: 'g3', name: 'Chocolate Malt', weightKg: 0.3, potentialSg: 1.028, colorEbc: 900.0, type: 'roasted' },
      { id: 'g4', name: 'Caramunich I', weightKg: 0.3, potentialSg: 1.034, colorEbc: 90.0, type: 'caramel' }
    ],
    [
      { id: 'h1', name: 'Magnum', weightG: 25, alphaAcid: 14.0, boilTimeMin: 60, use: 'boil' },
      { id: 'h2', name: 'Chinook', weightG: 25, alphaAcid: 13.0, boilTimeMin: 20, use: 'boil' },
      { id: 'h3', name: 'Cascade', weightG: 30, alphaAcid: 6.0, boilTimeMin: 5, use: 'boil' }
    ],
    [
      { id: 'm1', name: 'Осахаривание', tempC: 66, timeMin: 60, type: 'maltose' },
      { id: 'm2', name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout' }
    ],
    COMMON_YEASTS[0], // US-05
    2.2, 19,
    ['Стаут', 'Америка', 'Хмель', 'Кофе', 'Смола']
  ),

  // 33. Бельгийский блонд эль (Belgian Blonde Ale)
  createRecipe(
    'rec_belgian_blonde',
    'Брюссельский Полдень (Belgian Blonde Ale)',
    'Belgian Blond Ale',
    'Бельгийские эли',
    'Золотистый, умеренно крепкий бельгийский эль с тонкой солодовой сладостью, деликатными фруктовыми эфирами спелой груши и легким пряным перцем бельгийских дрожжей.',
    'МастерВарка Бельгия',
    20, 75, 75,
    [
      { id: 'g1', name: 'Pilsner Malt', weightKg: 5.0, potentialSg: 1.037, colorEbc: 3.5, type: 'base' },
      { id: 'g2', name: 'Vienna Malt', weightKg: 0.4, potentialSg: 1.036, colorEbc: 8.0, type: 'base' },
      { id: 'g3', name: 'Carapils', weightKg: 0.25, potentialSg: 1.033, colorEbc: 4.5, type: 'caramel' }
    ],
    [
      { id: 'h1', name: 'Saaz (Жатецкий)', weightG: 35, alphaAcid: 3.8, boilTimeMin: 60, use: 'boil' },
      { id: 'h2', name: 'Hallertau Mittelfrüh', weightG: 20, alphaAcid: 4.0, boilTimeMin: 15, use: 'boil' }
    ],
    [
      { id: 'm1', name: 'Мальтозная', tempC: 64, timeMin: 45, type: 'maltose' },
      { id: 'm2', name: 'Осахаривание', tempC: 71, timeMin: 20, type: 'dextrin' },
      { id: 'm3', name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout' }
    ],
    COMMON_YEASTS[4], // BE-256
    2.7, 20,
    ['Блонд', 'Бельгия', 'Золотистый', 'Груша', 'Монастырское']
  ),

  // 34. Бамбергское копченое (Bamberg Rauchbier)
  createRecipe(
    'rec_bamberg_rauchbier',
    'Бамбергский Костер (Bamberg Smoked Rauchbier)',
    'Rauchbier',
    'Лагеры',
    'Знаменитый копченый лагер из франконского города Бамберг. Интенсивный аппетитный аромат костра, копченого бекона и буковой древесины в идеальном балансе с солодовым телом.',
    'МастерВарка Германия',
    20, 75, 75,
    [
      { id: 'g1', name: 'Munich I (Мюнхенский светлый 15 EBC)', weightKg: 3.0, potentialSg: 1.036, colorEbc: 15.0, type: 'base' },
      { id: 'g2', name: 'Vienna Malt (Венский)', weightKg: 1.5, potentialSg: 1.036, colorEbc: 8.0, type: 'base' },
      { id: 'g3', name: 'Caramunich II', weightKg: 0.3, potentialSg: 1.034, colorEbc: 120.0, type: 'caramel' },
      { id: 'g4', name: 'Carafa Special I', weightKg: 0.08, potentialSg: 1.029, colorEbc: 900.0, type: 'roasted' }
    ],
    [
      { id: 'h1', name: 'Hallertau Mittelfrüh', weightG: 32, alphaAcid: 4.0, boilTimeMin: 60, use: 'boil' },
      { id: 'h2', name: 'Tettnanger', weightG: 18, alphaAcid: 4.5, boilTimeMin: 15, use: 'boil' }
    ],
    [
      { id: 'm1', name: 'Мальтозная', tempC: 64, timeMin: 45, type: 'maltose' },
      { id: 'm2', name: 'Осахаривание', tempC: 71, timeMin: 25, type: 'dextrin' },
      { id: 'm3', name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout' }
    ],
    COMMON_YEASTS[2], // W-34/70
    2.5, 12,
    ['Копченое', 'Rauchbier', 'Бамберг', 'Лагер', 'Дымок']
  )
];

// Начальный инвентарь (Кладовая)
export const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 'inv_1', name: 'Pale Ale Malt', category: 'grain', amount: 12.0, unit: 'kg', potentialSgOrAlpha: 1.038, colorEbc: 6.0, notes: 'Базовый солод для элей' },
  { id: 'inv_2', name: 'Pilsner Malt', category: 'grain', amount: 10.0, unit: 'kg', potentialSgOrAlpha: 1.037, colorEbc: 3.5, notes: 'Для лагеров и легких сортов' },
  { id: 'inv_3', name: 'Wheat Malt (Пшеничный светлый)', category: 'grain', amount: 4.0, unit: 'kg', potentialSgOrAlpha: 1.038, colorEbc: 4.0, notes: 'Для пшеничного пива' },
  { id: 'inv_4', name: 'Carapils', category: 'grain', amount: 1.5, unit: 'kg', potentialSgOrAlpha: 1.033, colorEbc: 4.5, notes: 'Для стойкой пены' },
  { id: 'inv_5', name: 'Flaked Oats (Овсяные хлопья)', category: 'grain', amount: 2.0, unit: 'kg', potentialSgOrAlpha: 1.032, colorEbc: 2.0, notes: 'Для стаутов и NEIPA' },
  { id: 'inv_6', name: 'Citra', category: 'hop', amount: 150, unit: 'g', potentialSgOrAlpha: 12.5, notes: 'Американский хмель' },
  { id: 'inv_7', name: 'Mosaic', category: 'hop', amount: 100, unit: 'g', potentialSgOrAlpha: 12.0, notes: 'Хмель для сухого охмеления' },
  { id: 'inv_8', name: 'Saaz (Жатецкий)', category: 'hop', amount: 100, unit: 'g', potentialSgOrAlpha: 3.8, notes: 'Благородный чешский хмель' },
  { id: 'inv_9', name: 'Magnum', category: 'hop', amount: 60, unit: 'g', potentialSgOrAlpha: 14.0, notes: 'Чистая базовая горечь' },
  { id: 'inv_10', name: 'SafAle US-05', category: 'yeast', amount: 3, unit: 'pack', potentialSgOrAlpha: 81, notes: 'Сухие элевые дрожжи' },
  { id: 'inv_11', name: 'SafAle WB-06', category: 'yeast', amount: 2, unit: 'pack', potentialSgOrAlpha: 86, notes: 'Дрожжи для вайцена' },
  { id: 'inv_12', name: 'Декстроза (глюкоза)', category: 'misc', amount: 1000, unit: 'g', notes: 'Для карбонизации бутылок' }
];

export const INITIAL_LIFEHACKS: Lifehack[] = [
  {
    id: 'lh_1',
    title: 'Борьба с холодным помутнением: правильный Cold Break и ирландский мох',
    category: 'boiling',
    summary: 'Как добиться кристальной прозрачности лагеров и элей без фильтрации',
    content: 'Добавьте 1 таблетку Whirlfloc (или 2-3 грамма ирландского мха) за 10-15 минут до конца кипячения. После варки критически важно быстро охладить сусло чиллером со 100°C до 20°C менее чем за 20 минут. Это коагулирует танин-белковые комплексы, которые выпадают в плотный осадок на дно варочника.',
    author: 'Алексей, опыт 8 лет',
    rating: 154,
    proTip: 'Дайте суслу отстояться 15 минут после охлаждения перед переливом в ферментер, брух осядет плотной лепешкой на дне.'
  },
  {
    id: 'lh_2',
    title: 'Регидратация сухих дрожжей: стоит ли тратить время?',
    category: 'fermentation',
    summary: 'Регидратация в теплой воде 30°C сохраняет до 50% больше живых клеток',
    content: 'При рассыпании сухих дрожжей прямо на пену сусла (особенно плотностью выше 14°P), мембрана дрожжевой клетки получает осмотический шок, и до 40-50% клеток гибнут. Разведите дрожжи в 100 мл стерильной воды (30-32°C) за 20 минут до внесения, дайте постоять и аккуратно перемешайте.',
    author: 'Дмитрий, пивоварня HopsLab',
    rating: 198,
    proTip: 'Температура разведенных дрожжей и температура сусла в ферментере не должны отличаться более чем на 5°C, иначе дрожжи уйдут в спячку.'
  },
  {
    id: 'lh_3',
    title: 'Техника Whirlpool (Водоворот) для взрывного аромата хмеля',
    category: 'boiling',
    summary: 'Как сохранить эфирные масла хмеля без лишней резкой горечи',
    content: 'Когда кипячение завершено, охладите сусло до 80-82°C (температура ниже изомеризации альфа-кислот). Внесите ароматический хмель (Citra, Mosaic, Galaxy), закрутите сусло лопаткой в водоворот и оставьте под крышкой на 20-30 минут. Эфирные масла мирцен и линалоол растворятся, а IBU почти не вырастет.',
    author: 'CraftBro Ivan',
    rating: 242,
    proTip: 'Вся муть и белок соберутся идеальным конусом в центре дна котла, сливайте прозрачное сусло с края.'
  },
  {
    id: 'lh_4',
    title: 'Идеальная карбонизация декстрозой: варите сахарный сироп!',
    category: 'bottling',
    summary: 'Никогда не сыпьте сухой порошок декстрозы в бутылки чайными ложками',
    content: 'Засыпание сухого сахара в бутылки приводит к неравномерной карбонизации и риску заражения. Рассчитайте общую массу декстрозы на всю партию на нашем калькуляторе, растворите в 150-200 мл воды, прокипятите 5 минут для дезинфекции, остудите и вылейте на дно промежуточной емкости перед розливом.',
    author: 'Сергей Николаев',
    rating: 186,
    proTip: 'Переливайте пиво из ферментера шлангом на дно емкости по спирали — сироп равномерно перемешается сам без аэрации.'
  }
];

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
    story: 'Сварил партию по рецепту Citra Wave. Карбонизировал 16 дней на декстрозе (7.5 г/л). Аромат спелого манго и цитрусовой цедры бьет в нос еще до первого глотка. Пена кремовая, держится до самого дна бокала.',
    tastingScore: 46,
    likesCount: 42,
    likedByMe: true,
    comments: [
      { id: 'c1', author: 'Андрей К.', text: 'Шикарный цвет! Сколько сухого охмеления давал?', date: '2 часа назад' }
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
    story: 'Выдержала феруловую паузу 44°C ровно 15 минут — гвоздика в аромате потрясающая, очень благородная. Дрожжи WB-06 отработали как часы за 5 дней при 21°C.',
    tastingScore: 48,
    likesCount: 56,
    likedByMe: false,
    comments: [
      { id: 'c3', author: 'Viktor Pils', text: 'Какая пена! Шапка образцовая для вайцена!', date: 'Вчера' }
    ],
    createdAt: '2026-03-27T18:10:00Z'
  }
];
