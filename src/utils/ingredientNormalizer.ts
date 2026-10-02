/**
 * Утилита нормализации и сопоставления названий пивоваренных ингредиентов.
 * Позволяет корректно находить совпадения между русскими и английскими названиями,
 * сокращениями, торговыми марками и синонимами.
 */

// Словарь канонических групп и синонимов для солода, хмеля и дрожжей
const SYNONYM_MAP: Record<string, string[]> = {
  // Солода базовые
  'pilsner': ['pilsner', 'pils', 'пилснер', 'пилс', 'пльзеньский', 'пльзенский', 'weyermann pilsner', 'солод пилснер'],
  'pale_ale': ['pale ale', 'pale', 'пэйл эль', 'пейл эль', 'пэйл', 'пейл', 'солод pale ale', 'солод пэйл эль'],
  'maris_otter': ['maris otter', 'maris', 'otter', 'мэрис оттер', 'марис оттер', 'английский пэйл'],
  'vienna': ['vienna', 'венский', 'солод венский', 'веймарн венский'],
  'munich': ['munich', 'мюнхенский', 'мюнхен', 'munich i', 'munich ii', 'солод мюнхенский'],
  'wheat': ['wheat', 'пшеничный', 'пшеничный солод', 'пшеница', 'weizen', 'weiss'],

  // Карамельные и специальные солода
  'carapils': ['carapils', 'carafoam', 'карапилс', 'карафом', 'кара фом'],
  'carahell': ['carahell', 'карахель', 'карахелль', 'кара хель'],
  'carared': ['carared', 'караред', 'кара ред'],
  'caramunich': ['caramunich', 'карамюнхен', 'кара мюнхен', 'caramunich i', 'caramunich ii', 'caramunich iii'],
  'caraaroma': ['caraaroma', 'караарома', 'кара арома'],
  'special_b': ['special b', 'спешиал б', 'специал б', 'спешиал-б'],
  'melanoidin': ['melanoidin', 'меланоидиновый', 'меланоидин', 'мелано'],
  'acidulated': ['acidulated', 'кислый', 'кислый солод', 'acid malt', 'sauermalz'],

  // Жженые и темные солода
  'chocolate': ['chocolate', 'шоколадный', 'солод шоколадный', 'шоколад'],
  'roasted_barley': ['roasted barley', 'жженый ячмень', 'жженка', 'roast barley', 'ячмень жженый'],
  'carafa': ['carafa', 'карафа', 'carafa special', 'карафа спешиал'],
  'black_malt': ['black malt', 'черный солод', 'блэк солод'],

  // Хлопья и несоложенка
  'flaked_oats': ['flaked oats', 'овсяные хлопья', 'овес', 'геркулес', 'хлопья овсяные'],
  'flaked_barley': ['flaked barley', 'ячменные хлопья', 'хлопья ячменные'],
  'flaked_wheat': ['flaked wheat', 'пшеничные хлопья', 'хлопья пшеничные'],

  // Хмели
  'citra': ['citra', 'цитра', 'ситра', 'хмель цитра'],
  'mosaic': ['mosaic', 'мозаик', 'мозаика', 'мозайк', 'хмель мозаик'],
  'simcoe': ['simcoe', 'симко', 'симкое', 'хмель симко'],
  'cascade': ['cascade', 'каскад', 'хмель каскад'],
  'centennial': ['centennial', 'центенниал', 'центениал', 'хмель центенниал'],
  'amarillo': ['amarillo', 'амарилло', 'амарило', 'хмель амарилло'],
  'chinook': ['chinook', 'чинук', 'чиноук', 'хмель чинук'],
  'columbus': ['columbus', 'ctz', 'zeus', 'tomahawk', 'колумбус', 'зевс', 'томагавк'],
  'sabro': ['sabro', 'сабро', 'хмель сабро'],
  'idaho_7': ['idaho 7', 'idaho', 'айдахо 7', 'айдахо'],
  'saaz': ['saaz', 'жатецкий', 'zatec', 'жатец', 'хмель жатецкий'],
  'hallertau': ['hallertau', 'халпертау', 'халлертау', 'mittelfruh', 'миттельфрю', 'hallertauer'],
  'tettnanger': ['tettnanger', 'теттнангер', 'тетнангер', 'tettnang'],
  'magnum': ['magnum', 'магнум', 'хмель магнум'],
  'perle': ['perle', 'перле', 'перл', 'хмель перле'],
  'spalt': ['spalt', 'шпальт', 'спальт'],
  'east_kent_goldings': ['east kent goldings', 'ekg', 'goldings', 'ист кент голдингс', 'голдингс', 'голдинг'],
  'fuggle': ['fuggle', 'фаггл', 'фуггл', 'фагглс', 'fuggles'],
  'northern_brewer': ['northern brewer', 'нортерн брюер', 'норзерн брюер'],
  'galaxy': ['galaxy', 'гэлакси', 'галакси', 'галактика'],
  'nelson_sauvin': ['nelson sauvin', 'нельсон совин', 'нельсон', 'nelson'],

  // Дрожжи
  'us_05': ['us-05', 'us05', 'ус-05', 'ус05', 'safale us-05', 'california ale', 'safale us 05', 'американские элевые'],
  's_04': ['s-04', 's04', 'с-04', 'с04', 'safale s-04', 'safale s 04', 'английские элевые'],
  'w_34_70': ['w-34/70', 'w34/70', 'w3470', '34/70', '3470', 'saflager w-34/70', 'лагерные дрожжи'],
  'wb_06': ['wb-06', 'wb06', 'вб-06', 'вб06', 'safale wb-06', 'пшеничные дрожжи'],
  'be_256': ['be-256', 'be256', 'safbrew be-256', 'аббатские дрожжи'],
  'be_134': ['be-134', 'be134', 'safbrew be-134', 'сэзон дрожжи', 'saison yeast'],
  's_33': ['s-33', 's33', 'safbrew s-33'],
  'kveik': ['kveik', 'voss', 'квейк', 'восс', 'lallemand voss kveik', 'voss kveik'],

  // Добавки
  'dextrose': ['dextrose', 'декстроза', 'глюкоза', 'glucose', 'сахар для карбонизации', 'праймер'],
  'lactose': ['lactose', 'лактоза', 'молочный сахар'],
  'coriander': ['coriander', 'кориандр', 'семена кориандра'],
  'orange_peel': ['orange peel', 'curacao', 'цедра апельсина', 'померанец', 'корка апельсина'],
  'irish_moss': ['irish moss', 'whirlfloc', 'ирландский мох', 'вирфлок']
};

/**
 * Очистка и токенизация строки для сравнения
 */
export function cleanToken(str: string): string {
  return str
    .toLowerCase()
    .replace(/[()[\]{}"'«»,./\\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Определение канонического ключа группы ингредиента
 */
export function getCanonicalKey(name: string): string | null {
  const cleaned = cleanToken(name);

  for (const [key, synonyms] of Object.entries(SYNONYM_MAP)) {
    for (const syn of synonyms) {
      const cleanedSyn = cleanToken(syn);
      if (cleaned.includes(cleanedSyn) || cleanedSyn.includes(cleaned)) {
        return key;
      }
    }
  }

  return null;
}

/**
 * Умная проверка соответствия ингредиента из инвентаря ингредиенту из рецепта
 */
export function isIngredientMatch(invName: string, recipeIngredientName: string): boolean {
  const invClean = cleanToken(invName);
  const recClean = cleanToken(recipeIngredientName);

  // 1. Прямое вхождение подстроки
  if (invClean.includes(recClean) || recClean.includes(invClean)) {
    return true;
  }

  // 2. Сравнение через канонический словарь синонимов
  const invKey = getCanonicalKey(invName);
  const recKey = getCanonicalKey(recipeIngredientName);

  if (invKey && recKey && invKey === recKey) {
    return true;
  }

  // 3. Пословное совпадение ключевых слов длиной > 3 символов
  const invWords = invClean.split(' ').filter(w => w.length > 3);
  const recWords = recClean.split(' ').filter(w => w.length > 3);

  const sharedWords = invWords.filter(w => recWords.some(rw => rw.includes(w) || w.includes(rw)));
  if (sharedWords.length > 0) {
    return true;
  }

  return false;
}

/**
 * Типовой стартовый набор пивовара для быстрого заполнения
 */
export function getStandardBrewerStarterPack() {
  return [
    { id: 'pack_1', name: 'Pilsner Malt (Пилснер)', category: 'grain' as const, amount: 15.0, unit: 'kg' as const, potentialSgOrAlpha: 1.037, colorEbc: 3.5, notes: 'Базовый лагерный солод' },
    { id: 'pack_2', name: 'Pale Ale Malt (Пэйл Эль)', category: 'grain' as const, amount: 12.0, unit: 'kg' as const, potentialSgOrAlpha: 1.038, colorEbc: 6.0, notes: 'Базовый солод для элей и IPA' },
    { id: 'pack_3', name: 'Wheat Malt (Пшеничный светлый)', category: 'grain' as const, amount: 5.0, unit: 'kg' as const, potentialSgOrAlpha: 1.038, colorEbc: 4.0, notes: 'Для вайценов и бланшей' },
    { id: 'pack_4', name: 'Munich I (Мюнхенский солод)', category: 'grain' as const, amount: 3.0, unit: 'kg' as const, potentialSgOrAlpha: 1.036, colorEbc: 15.0, notes: 'Для солодового аромата' },
    { id: 'pack_5', name: 'Carapils / Carafoam', category: 'grain' as const, amount: 1.5, unit: 'kg' as const, potentialSgOrAlpha: 1.033, colorEbc: 4.5, notes: 'Для стойкой белоснежной пены' },
    { id: 'pack_6', name: 'Flaked Oats (Овсяные хлопья)', category: 'grain' as const, amount: 2.0, unit: 'kg' as const, potentialSgOrAlpha: 1.032, colorEbc: 2.0, notes: 'Для кремового тела NEIPA и стаутов' },
    { id: 'pack_7', name: 'Roasted Barley (Жженый ячмень)', category: 'grain' as const, amount: 1.0, unit: 'kg' as const, potentialSgOrAlpha: 1.025, colorEbc: 1100.0, notes: 'Для черных стаутов' },
    { id: 'pack_8', name: 'Citra', category: 'hop' as const, amount: 150, unit: 'g' as const, potentialSgOrAlpha: 12.5, notes: 'Тропики и цитрус' },
    { id: 'pack_9', name: 'Mosaic', category: 'hop' as const, amount: 100, unit: 'g' as const, potentialSgOrAlpha: 12.0, notes: 'Черника и маракуйя' },
    { id: 'pack_10', name: 'Saaz (Жатецкий)', category: 'hop' as const, amount: 100, unit: 'g' as const, potentialSgOrAlpha: 3.8, notes: 'Чешский благородный' },
    { id: 'pack_11', name: 'Magnum', category: 'hop' as const, amount: 100, unit: 'g' as const, potentialSgOrAlpha: 14.0, notes: 'Чистая базовая горечь' },
    { id: 'pack_12', name: 'SafAle US-05', category: 'yeast' as const, amount: 3, unit: 'pack' as const, potentialSgOrAlpha: 81, notes: 'Универсальные чистые элевые' },
    { id: 'pack_13', name: 'SafLager W-34/70', category: 'yeast' as const, amount: 2, unit: 'pack' as const, potentialSgOrAlpha: 83, notes: 'Эталонный немецкий лагер' },
    { id: 'pack_14', name: 'SafAle WB-06', category: 'yeast' as const, amount: 2, unit: 'pack' as const, potentialSgOrAlpha: 86, notes: 'Пшеничный баварский профиль' },
    { id: 'pack_15', name: 'Декстроза (глюкоза)', category: 'misc' as const, amount: 1000, unit: 'g' as const, notes: 'Для естественной карбонизации в бутылках' }
  ];
}
