import { Recipe } from '../types/brewing';
import { ebcToHex } from './brewingMath';

export interface CraftAiGenerationResult {
  names: string[];
  slogan: string;
  story: string;
  themeStyle: 'craft_modern' | 'vintage_monastery' | 'minimal_nordic' | 'retro_arcade' | 'botanical' | 'slavic_craft';
  palette: {
    background: string;
    text: string;
    accent: string;
    border: string;
  };
  artworkType: 'hop' | 'grain' | 'barrel' | 'crown' | 'mountain' | 'shield' | 'bear' | 'wolf' | 'kettle' | 'mug';
  brewerTip: string;
  audit: {
    summary: string;
    strengths: string[];
    suggestions: string[];
    foodPairings: string[];
    servingTemp: string;
    glassType: string;
  };
  imagePromptRu: string;
  imagePromptEn: string;
  providerUsed: string;
  isOffline: boolean;
}

// Вспомогательная функция случайного выбора
function pickOne<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickMultiple<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * Автономный интеллектуальный ИИ-генератор крафтовых названий и дизайна этикеток.
 * Работает 100% без VPN, без интернета, на смартфонах в Android APK и PWA.
 */
export function generateOfflineCraftIdentity(recipe: Recipe): CraftAiGenerationResult {
  const styleRaw = (recipe.style || '').toLowerCase();
  const abv = Number(recipe.calculated?.abv || 5.0);
  const ibu = Number(recipe.calculated?.ibu || 30);
  const ebc = Number(recipe.calculated?.ebc || 12);
  const og = recipe.calculated?.ogSg || 1.050;

  // Анализ хмелей
  const hopNames = (recipe.hops || []).map(h => (h.name || '').trim());
  const hopString = hopNames.join(' ').toLowerCase();

  // Анализ солода
  const grainNames = (recipe.grains || []).map(g => (g.name || '').trim());
  const grainString = grainNames.join(' ').toLowerCase();

  // Определение ключевого профиля стиля
  let isIpa = styleRaw.includes('ipa') || styleRaw.includes('айпиэй') || styleRaw.includes('pale ale') || styleRaw.includes('apa');
  let isStout = styleRaw.includes('stout') || styleRaw.includes('стаут') || styleRaw.includes('porter') || styleRaw.includes('портер');
  let isWheat = styleRaw.includes('wheat') || styleRaw.includes('вайс') || styleRaw.includes('пшенич') || styleRaw.includes('weizen') || styleRaw.includes('witbier') || styleRaw.includes('blanche');
  let isLager = styleRaw.includes('lager') || styleRaw.includes('лагер') || styleRaw.includes('pils') || styleRaw.includes('пилс') || styleRaw.includes('helles') || styleRaw.includes('хеллес') || styleRaw.includes('жигул');
  let isSour = styleRaw.includes('sour') || styleRaw.includes('кислый') || styleRaw.includes('gose') || styleRaw.includes('гозе') || styleRaw.includes('berliner');
  let isBelgian = styleRaw.includes('belgian') || styleRaw.includes('бельгий') || styleRaw.includes('tripel') || styleRaw.includes('dubbel') || styleRaw.includes('saison') || styleRaw.includes('сезон');
  let isMeadOrCider = styleRaw.includes('mead') || styleRaw.includes('мид') || styleRaw.includes('медовуха') || styleRaw.includes('cider') || styleRaw.includes('сидр');

  // Если стиль не распознан, смотрим по горечи и цвету
  if (!isIpa && !isStout && !isWheat && !isLager && !isSour && !isBelgian && !isMeadOrCider) {
    if (ebc > 45) isStout = true;
    else if (ibu > 40) isIpa = true;
    else isLager = true;
  }

  // Генерация базы названий в зависимости от категории
  let candidates: string[] = [];
  let slogans: string[] = [];
  let storySnippets: string[] = [];
  let tips: string[] = [];
  let defaultTheme: 'craft_modern' | 'vintage_monastery' | 'minimal_nordic' | 'retro_arcade' | 'botanical' | 'slavic_craft' = 'craft_modern';
  let defaultArtwork: 'hop' | 'grain' | 'barrel' | 'crown' | 'mountain' | 'shield' | 'bear' | 'wolf' | 'kettle' | 'mug' = 'hop';
  let glass = 'Пинта Nonic';
  let food: string[] = ['Бургеры', 'Крафтовые сыры'];
  let serving = '8-10°C';

  if (isIpa) {
    candidates = [
      'Хмельной Горизонт', 'Северный Хмель', 'Mosaic Mirage', 'Цитрусовый Всплеск',
      'Вектор Горечи', 'Штормовой Эль', 'Cascade Dreams', 'Хмелевая Буря',
      'Крафтовый Маяк', 'Солнечный Непал', 'Citra Nebula', 'Хмель & Ярость',
      'Тихоокеанский Бриз', 'Зелёный Орден', 'Энигма Хмелевода', 'Игла Сосны',
      'Смоляной Пик', 'Радио Хмель', 'Индиго Эль', 'Дерзкий Самурай'
    ];
    slogans = [
      'Яркий взрыв хмеля и чистого крафтового духа.',
      'Там, где горечь встречается с тропическим солнцем.',
      'Настоящий охмеленный шторм в каждом глотке.',
      'Для тех, кто ценит дерзкий характер и благородную смолу.'
    ];
    storySnippets = [
      `Сварено с акцентом на взрывную ароматику хмелей (${hopNames.slice(0, 3).join(', ') || 'Citra & Mosaic'}). Мощное сухое охмеление на фоне бархатистого солодового тела плотностью ${og}.`,
      `Современный взгляд на эталонную хмелевую классику. Яркие ноты цитруса, манго и сосновой хвои создают неповторимый баланс с выразительной горчинкой ${ibu} IBU.`
    ];
    tips = [
      'Вносите хмель на сухое охмеление (Dry Hop) на спаде активного брожения при температуре 17–19°C для максимального сохранения эфирных масел.',
      'Минимизируйте контакт сусла с кислородом при переливе, чтобы хмелевая ароматика не окислилась и радовала свежестью.'
    ];
    defaultTheme = 'craft_modern';
    defaultArtwork = 'hop';
    glass = 'IPA Glass (Spiegelau) или Тюльпан';
    food = ['Острые крылышки Баффало', 'Мраморный бургер с беконом', 'Выдержанный чеддер', 'Индийский карри'];
    serving = '7-9°C';
  } else if (isStout) {
    candidates = [
      'Черный Бархат', 'Полуночный Имперец', 'Карамельная Тьма', 'Угольный Мост',
      'Сибирская Вьюга', 'Шоколадный Кочегар', 'Млечный Стаут', 'Ночной Дозор',
      'Пепел и Золото', 'Смоляной Котёл', 'Северная Ночь', 'Густой Туман',
      'Кофейный Барон', 'Чёрная Смородина', 'Стальной Портер', 'Атласный Омут'
    ];
    slogans = [
      'Глубина бархатной ночи с нотами темного шоколада.',
      'Густая плотность, согревающий характер и благородный жженый солод.',
      'Тепло очага и крепкий дух северных широт.',
      'Непроглядная тьма истинного имперского мастерства.'
    ];
    storySnippets = [
      `Богатая засыпь жженых и карамельных солодов дарит глубокий оттенок и ароматы свежемолотого эспрессо, темного шоколада и ванили. Согревающая крепость ${abv}% окутывает мягким теплом.`,
      `Мощный темный сорт с кремовой стойкой пенной шапкой. Медленное брожение и длительное созревание раскрывают бархатную текстуру десертного солода.`
    ];
    tips = [
      'Для глубокого вкуса и мягкой жжености без резкой кислотности добавляйте специальные жженые солода (Carafa Special, Roasted Barley) в последние 15 минут затирания.',
      'Дайте стауту созреть в бутылке не менее 4–6 недель — с каждой неделей баланс кофе и шоколада будет становиться только благороднее.'
    ];
    defaultTheme = 'vintage_monastery';
    defaultArtwork = 'barrel';
    glass = 'Снифтер или Тюльпан';
    food = ['Шоколадный брауни', 'Стейк слабой прожарки', 'Устрицы', 'Сыры с плесенью (Дор Блю, Горгонзола)'];
    serving = '11-14°C';
  } else if (isWheat) {
    candidates = [
      'Солнечный Колосок', 'Белый Шёпот', 'Баварский Полдень', 'Пшеничная Ласка',
      'Альпийское Утро', 'Золотая Нива', 'Вайсберг', 'Ветряная Мельница',
      'Бланш де Волга', 'Кориандр & Цедра', 'Пшеничный Рассвет', 'Туманный Полдень'
    ];
    slogans = [
      'Освежающая легкость отборного пшеничного зерна.',
      'Мягкий фруктовый профиль с оттенками банана и гвоздики.',
      'Летняя свежесть и пышная белоснежная пена.',
      'Традиции баварских пивоварен в авторском прочтении.'
    ];
    storySnippets = [
      `Сварено с высокой долей отборной пшеницы и аутентичными дрожжами верхового брожения, сформировавшими шелковистый вкус с классическими нотами банана и пряной гвоздики.`,
      `Идеальное освежающее пиво с легкой естественной дрожжевой мутностью и стойкой шапкой пены. Умеренная крепость ${abv}% делает каждый глоток невесомым.`
    ];
    tips = [
      'Для пшеничных элей критически важно использовать рисовую шелуху при фильтрации, чтобы избежать залипания фильтр-чана из-за отсутствия оболочки у пшеницы.',
      'Держите температуру брожения строго около 20–22°C для идеального баланса эфиров (банан) и фенолов (гвоздика).'
    ];
    defaultTheme = 'botanical';
    defaultArtwork = 'grain';
    glass = 'Weizen Glass (высокий бокал для пшеничного)';
    food = ['Мюнхенские белые колбаски (Вайсвурст)', 'Козий сыр', 'Легкие салаты с цитрусовой заправкой', 'Морепродукты'];
    serving = '6-8°C';
  } else if (isLager) {
    candidates = [
      'Богемский Хрусталь', 'Золото Затора', 'Чешский Рубеж', 'Жигулевский Стандарт',
      'Баварский Погреб', 'Янтарный Лагер', 'Кристальный Пилс', 'Солодовый Свод',
      'Медный Чан', 'Хмельной Северок', 'Балтийский Ветер', 'Классика Варки'
    ];
    slogans = [
      'Честное пиво низового брожения с кристальной чистотой вкуса.',
      'Традиционная лагерная выдержка и звонкая благородная горчинка.',
      'Золотой эталон освежающего солодового вкуса.',
      'Сварено по канонам классического пивоваренного мастерства.'
    ];
    storySnippets = [
      `Классический лагер длительной холодной выдержки. Чистый солодовый профиль на светлом солоде Pilsner гармонично дополнен благородным хмелем с цветочно-травянистым ароматом.`,
      `Выверенная рецептура низового брожения: мягкая вода, точный температурный режим затирания и идеальная прозрачность дарят непревзойденную питкость.`
    ];
    tips = [
      'Лагерные дрожжи требуют вдвое большей нормы засева по сравнению с элевыми. Обязательно делайте стартер или используйте 2 пачки дрожжей на 20-25 литров.',
      'Проведите диацетиловую паузу при температуре 15–16°C в конце брожения, чтобы дрожжи полностью утилизировали диацетил и пиво было кристально чистым во вкусе.'
    ];
    defaultTheme = 'slavic_craft';
    defaultArtwork = 'mug';
    glass = 'Пивная кружка с гранями или Pilsner Flute';
    food = ['Традиционные жареные колбаски', 'Вяленая рыба', 'Хрустящие чесночные гренки', 'Пицца Маргарита'];
    serving = '4-6°C';
  } else if (isSour) {
    candidates = [
      'Кислый Шёпот', 'Ягодный Шторм', 'Морской Гозе', 'Дикий Сад',
      'Малиновый Закат', 'Солёный Ветер', 'Терпкий Омут', 'Кислый Взрыв'
    ];
    slogans = [
      'Бодрящая кислотность, морская соль и сочные фрукты.',
      'Для тех, кто ищет новые вкусовые горизонты.',
      'Искристая свежесть дикого крафтового брожения.'
    ];
    storySnippets = [
      `Сварено по технологии быстрого закисления сусла лактобактериями (Kettle Sour). Освежающая яркая кислотность дополнена нотами кориандра и розовой гималайской соли.`
    ];
    tips = [
      'Контролируйте pH закисления — оптимальный диапазон 3.3–3.5 для чистого, яркого и не обжигающего кислого вкуса.'
    ];
    defaultTheme = 'retro_arcade';
    defaultArtwork = 'mountain';
    glass = 'Бокал Тюльпан или Винный кубок';
    food = ['Устрицы', 'Мягкие козьи сыры', 'Лимонный тарт', 'Севиче'];
    serving = '5-7°C';
  } else {
    candidates = [
      'Мастерский Затор', 'Янтарная Легенда', 'Алхимия Солода', 'Крафтовый Компас',
      'Золотой Колос', 'Медный Вектор', 'Старый Шкипер', 'Пивная Руна'
    ];
    slogans = [
      'Сварено с душой, проверено временем.',
      'Честный авторский крафт из отборных ингредиентов.',
      'Баланс классических традиций и современного мастерства.'
    ];
    storySnippets = [
      `Сбалансированное авторское пиво с плотностью ${og} и гармоничной горечью ${ibu} IBU. Отборная засыпь солода дарит глубокий цвет и чистое зерновое послевкусие.`
    ];
    tips = [
      'Обеспечьте активное кипячение с открытой крышкой не менее 60 минут для испарения диметилсульфида (DMS) и чистоты вкуса.'
    ];
    defaultTheme = 'craft_modern';
    defaultArtwork = 'kettle';
    glass = 'Пинта';
    food = ['Твердые сыры', 'Колбаски гриль', 'Мясные деликатесы'];
    serving = '8-10°C';
  }

  // Если у рецепта уже есть имя, предлагаем его модификации или вариации
  if (recipe.name && recipe.name.trim().length > 2 && recipe.name !== 'Новый рецепт') {
    candidates.unshift(`${recipe.name} Special Edition`, `Мастер ${recipe.name}`);
  }

  // Расчет палитры на основе реального цвета пива EBC
  const beerHex = ebcToHex(ebc);
  
  let palette = {
    background: '#1c1917',
    text: '#fef08a',
    accent: '#f59e0b',
    border: '#d97706'
  };

  if (ebc < 10) {
    // Светлое, золотое
    palette = {
      background: '#1e293b',
      text: '#f8fafc',
      accent: '#fbbf24',
      border: '#f59e0b'
    };
  } else if (ebc < 25) {
    // Янтарное, медное
    palette = {
      background: '#18181b',
      text: '#fef3c7',
      accent: '#d97706',
      border: '#b45309'
    };
  } else if (ebc < 50) {
    // Коричневое, рубиновое
    palette = {
      background: '#0c0a09',
      text: '#fed7aa',
      accent: '#ea580c',
      border: '#9a3412'
    };
  } else {
    // Темное, черное
    palette = {
      background: '#09090b',
      text: '#fafaf9',
      accent: '#d97706',
      border: '#78350f'
    };
  }

  // Промпты для генерации изображений в российских и мировых нейросетях (Шедеврум, Kandinsky, Midjourney)
  const imagePromptRu = `Высокодетализированная этикетка крафтового пива для стиля "${recipe.style}", винтажная гравюра, тема "${pickOne(candidates)}", шишки хмеля, ячменные колосья, благородные медные и золотые оттенки, стиль крафтовой пивоварни, шедевр графики 4k`;
  const imagePromptEn = `Detailed craft beer label vintage engraving artwork for "${recipe.style}" named "${pickOne(candidates)}", hop cones, barley malt, amber and dark gold tones, atmospheric microbrewery badge logo, vector graphic masterpiece`;

  return {
    names: pickMultiple(candidates, 3),
    slogan: pickOne(slogans),
    story: pickOne(storySnippets),
    themeStyle: defaultTheme,
    palette,
    artworkType: defaultArtwork,
    brewerTip: pickOne(tips),
    audit: {
      summary: `Рецепт стиля ${recipe.style} сбалансирован: начальная плотность ${og}, расчетная крепость ${abv}% и горечь ${ibu} IBU идеально соотносятся с солодовой засыпью.`,
      strengths: [
        `Гармоничное соотношение плотности ${og} и горечи ${ibu} IBU`,
        `Грамотно подобранная основа: ${(recipe.grains || []).map(g => g.name).slice(0, 2).join(' + ') || 'Базовый солод'}`,
        `Своевременное внесение хмеля для баланса вкуса и аромата`
      ],
      suggestions: [
        `Контролируйте температуру брожения в первые 48–72 часа для максимальной чистоты профиля дрожжей.`,
        `Убедитесь в достаточной аэрации сусла перед внесением дрожжей.`
      ],
      foodPairings: food,
      servingTemp: serving,
      glassType: glass
    },
    imagePromptRu,
    imagePromptEn,
    providerUsed: 'МастерВарка AI (Без VPN, 100% автономно)',
    isOffline: true
  };
}
