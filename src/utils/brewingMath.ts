import {
  BJCPStyle,
  CalculatedBrewParams,
  GrainItem,
  HopItem,
  Recipe,
  StyleValidation,
  Yeast
} from '../types/brewing';

/**
 * Преобразование Specific Gravity (SG, напр. 1.050) в градусы Плато (°P)
 */
export function sgToPlato(sg: number): number {
  if (sg <= 1.0) return 0;
  // Полиномиальная формула де Фрейнца (Lincoln/ASBC)
  const plato = -463.37 + 668.72 * sg - 205.35 * Math.pow(sg, 2);
  return Math.max(0, Number(plato.toFixed(1)));
}

/**
 * Преобразование градусов Плато (°P) в Specific Gravity (SG)
 */
export function platoToSg(plato: number): number {
  if (plato <= 0) return 1.000;
  // SG = 1 + (Plato / (258.6 - ((Plato / 258.2) * 227.1)))
  const sg = 1 + (plato / (258.6 - (plato / 258.2) * 227.1));
  return Number(sg.toFixed(3));
}

/**
 * Преобразование EBC в SRM и шестнадцатеричный цвет HEX пива
 */
export function ebcToHex(ebc: number): string {
  // Реалистичная палитра цветов пива по шкале SRM/EBC
  const srm = ebc / 1.97;
  if (srm <= 2) return '#F8F17A'; // Pale straw (Pilsner)
  if (srm <= 3) return '#F5E452'; // Straw
  if (srm <= 4) return '#E8D03C'; // Pale gold
  if (srm <= 6) return '#D99B26'; // Deep gold (Helles/IPA)
  if (srm <= 8) return '#C9771B'; // Pale amber
  if (srm <= 10) return '#B95813'; // Amber
  if (srm <= 13) return '#A83B0E'; // Medium amber
  if (srm <= 17) return '#8D2208'; // Copper
  if (srm <= 20) return '#741505'; // Dark copper/brown
  if (srm <= 25) return '#560D04'; // Brown (Porter)
  if (srm <= 30) return '#3B0903'; // Dark brown
  if (srm <= 35) return '#280602'; // Very dark
  return '#120301'; // Black/Opaque (Imperial Stout)
}

/**
 * Полный расчет характеристик рецепта:
 * НП, КП, ABV, IBU, EBC, BU:GU, объемы воды, температура засыпи, дрожжи и праймер
 */
export function calculateBrewMetrics(params: {
  batchSizeL: number;
  boilTimeMin: number;
  efficiencyPercent: number;
  grainRatioLPerKg: number;
  grainTempC: number;
  targetCarbonationVol: number;
  beerTempAtBottlingC: number;
  grains: GrainItem[];
  hops: HopItem[];
  yeast: Yeast;
}): CalculatedBrewParams {
  const {
    batchSizeL,
    boilTimeMin,
    efficiencyPercent,
    grainRatioLPerKg,
    grainTempC,
    targetCarbonationVol,
    beerTempAtBottlingC,
    grains,
    hops,
    yeast
  } = params;

  // 1. Расчет засыпи и начальной плотности (OG)
  let totalGrainWeightKg = 0;
  let totalGravityPoints = 0;
  let totalMcu = 0;

  const batchSizeGal = batchSizeL * 0.264172;
  const effFactor = efficiencyPercent / 100;

  for (const grain of grains) {
    totalGrainWeightKg += grain.weightKg;
    const weightLbs = grain.weightKg * 2.20462;
    // Потенциал в гравитационных пунктах (напр. 1.037 -> 37)
    const pointsPerLbGal = (grain.potentialSg - 1.0) * 1000;
    // Набранные пункты с учетом эффективности варочника
    const pts = (pointsPerLbGal * weightLbs * effFactor) / batchSizeGal;
    totalGravityPoints += pts;

    // Цвет: Malt Color Units (MCU) = (lbs * Lovibond) / gallons
    // EBC = 1.97 * Lovibond, следовательно Lovibond = EBC / 1.97
    const lovibond = grain.colorEbc / 1.97;
    totalMcu += (weightLbs * lovibond) / batchSizeGal;
  }

  const ogPoints = totalGravityPoints > 0 ? totalGravityPoints : 0;
  const ogSg = Number((1.0 + ogPoints / 1000).toFixed(3));
  const ogPlato = sgToPlato(ogSg);

  // 2. Расчет цвета SRM (Morey) и EBC
  // Morey equation: SRM = 1.4922 * (MCU ^ 0.6859)
  const srm = totalMcu > 0 ? Number((1.4922 * Math.pow(totalMcu, 0.6859)).toFixed(1)) : 2.0;
  const ebc = Number((srm * 1.97).toFixed(1));

  // 3. Расчет конечной плотности (FG) и ABV
  // Учет аттенюации дрожжей (по умолч. 75-80%)
  const attenuation = yeast.attenuationPercent / 100;
  const fgPoints = ogPoints * (1.0 - attenuation);
  const fgSg = Number((1.0 + fgPoints / 1000).toFixed(3));
  const fgPlato = sgToPlato(fgSg);

  // Алкоголь: ABV = (OG - FG) * 131.25
  const abv = Number(((ogSg - fgSg) * 131.25).toFixed(1));

  // 4. Расчет горечи IBU (Tinseth)
  let totalIbu = 0;
  const bignessFactor = 1.65 * Math.pow(0.000125, ogSg - 1.0);

  for (const hop of hops) {
    if (hop.use === 'dry_hop') continue; // Сухое охмеление не добавляет IBU горечи

    let timeForCalc = hop.boilTimeMin;
    if (hop.use === 'whirlpool') {
      timeForCalc = 10; // Эквивалент вирпула при 80-85°C
    }

    const boilTimeFactor = (1.0 - Math.exp(-0.04 * timeForCalc)) / 4.15;
    const utilization = bignessFactor * boilTimeFactor;
    // IBU = (Utilization * (Alpha% / 100) * WeightGrams * 1000) / BatchVolumeLitres / 10
    const hopIbu = (utilization * (hop.alphaAcid / 100) * hop.weightG * 1000) / batchSizeL;
    totalIbu += hopIbu;
  }
  const ibu = Math.max(0, Math.round(totalIbu));

  // 5. Отношение горечи к плотности BU:GU
  const buGuRatio = ogPoints > 0 ? Number((ibu / ogPoints).toFixed(2)) : 0;

  // 6. Расчет объемов воды и температуры засыпи
  // Объем воды на затирание (Strike water) = вес засыпи * гидромодуль
  const strikeWaterL = Number((totalGrainWeightKg * grainRatioLPerKg).toFixed(1));
  // Впитывание воды зерном (~0.96 л/кг)
  const grainAbsorptionL = totalGrainWeightKg * 0.96;
  // Выкипание (~10% от объема варки за час)
  const boilOffRateL = (batchSizeL * 0.12 * (boilTimeMin / 60));
  // Промывочная вода (Sparge water)
  const spargeWaterL = Math.max(0, Number((batchSizeL + grainAbsorptionL + boilOffRateL - strikeWaterL).toFixed(1)));
  const totalWaterL = Number((strikeWaterL + spargeWaterL).toFixed(1));

  // Температура воды для засыпи (Strike temp formula Palmer):
  // Strike Temp = (0.4 / r) * (T_mash - T_grain) + T_mash
  // где r = гидромодуль (л/кг), T_mash = 67°C (стандартная сахаризация)
  const targetFirstMashTemp = 67.0;
  const strikeTempC = Number(
    ((0.4 / Math.max(1, grainRatioLPerKg)) * (targetFirstMashTemp - grainTempC) + targetFirstMashTemp).toFixed(1)
  );

  // 7. Расчет нормы засева дрожжей (Pitch Rate)
  // Норма: для элей 0.75 млн клеток / мл / °Plato; для лагеров 1.5 млн
  const pitchRateMillionPerMl = yeast.type === 'lager' ? 1.5 : (ogPlato > 16 ? 1.0 : 0.75);
  const wortVolumeMl = batchSizeL * 1000;
  const totalCellsNeededBillions = (pitchRateMillionPerMl * wortVolumeMl * ogPlato) / 1000;
  
  // В 1 грамме качественных сухих дрожжей ~20 млрд жизнеспособных клеток
  const cellsPerGram = yeast.cellsPerGramOrVial > 0 ? yeast.cellsPerGramOrVial : 20;
  const dryYeastGramsNeeded = Number((totalCellsNeededBillions / cellsPerGram).toFixed(1));
  const yeastPacksNeeded = Math.ceil(dryYeastGramsNeeded / 11.5); // Стандартный пакетик 11.5г (Fermentis/Lallemand)

  // 8. Калькулятор карбонизации (Праймер)
  // Расчет остаточного растворенного CO2 в пиве в зависимости от температуры (в фаренгейтах):
  const tempF = beerTempAtBottlingC * 1.8 + 32;
  const dissolvedCo2Vol = 3.0378 - 0.050062 * tempF + 0.00026555 * Math.pow(tempF, 2);
  const neededCo2Vol = Math.max(0, targetCarbonationVol - dissolvedCo2Vol);

  // Декстроза (глюкоза) моногидрат: 4.0 г на 1 литр для увеличения на 1.0 vol CO2
  const dextroseGrams = Math.max(0, Math.round(neededCo2Vol * 4.0 * batchSizeL));
  // Обычный столовый сахар (сахароза): более чистый сбраживаемый экстракт (на 9% меньше)
  const sucroseGrams = Math.round(dextroseGrams * 0.91);
  // Сухой солодовый экстракт (DME): содержит несбраживаемые сахара (нужно на ~30% больше)
  const dmeGrams = Math.round(dextroseGrams * 1.30);
  // Сусло (шпайзе, Speise): объем молодого сусла с плотностью OG для розлива
  const speiseFactor = ogPoints > 0 ? 1200 / ogPoints : 24;
  const speiseMl = Math.round(neededCo2Vol * speiseFactor * batchSizeL);

  // Калорийность (ккал на 500 мл):
  // Углеводы и спирт: калории = (6.9 * ABV_вес + 4.0 * (RE - 0.1)) * 5
  const caloriesPer500ml = Math.round((abv * 2.5 + (ogPlato - fgPlato) * 1.6 + fgPlato * 1.5) * 5);

  return {
    ogSg,
    ogPlato,
    fgSg,
    fgPlato,
    abv,
    ibu,
    srm,
    ebc,
    buGuRatio,
    totalGrainWeightKg: Number(totalGrainWeightKg.toFixed(2)),
    strikeWaterL,
    spargeWaterL,
    totalWaterL,
    strikeTempC,
    dryYeastGramsNeeded,
    yeastPacksNeeded: Math.max(1, yeastPacksNeeded),
    dextroseGrams,
    sucroseGrams,
    dmeGrams,
    speiseMl,
    caloriesPer500ml
  };
}

/**
 * Коллекция основных стилей BJCP (Beer Judge Certification Program)
 * с диапазонами плотности, горечи, цвета и рекомендациями
 */
export const BJCP_STYLES: BJCPStyle[] = [
  // --- ЛАГЕРЫ (НИЗОВОЕ БРОЖЕНИЕ) ---
  {
    id: 'czech_pilsner',
    name: 'Чешский светлый премиум-лагер (Пилснер)',
    nameEn: 'Czech Premium Pale Lager',
    category: 'Лагеры',
    fermentationType: 'lager',
    ogRange: [1.044, 1.060],
    fgRange: [1.013, 1.017],
    abvRange: [4.2, 5.8],
    ibuRange: [30, 45],
    ebcRange: [7, 14],
    buGuRatioRange: [0.65, 0.90],
    description: 'Богатый солодовый золотистый лагер с заметной, но мягкой хмелевой горечью благородного жатецкого хмеля Saaz и чистым послевкусием.',
    mashProfilePreset: 'Отварочное или ступенчатое затирание: 52°C (белковая), 63°C (мальтозная 40 мин), 70°C (декстриновая 20 мин), 78°C (мэшаут).'
  },
  {
    id: 'german_pils',
    name: 'Немецкий пилс (German Pils)',
    nameEn: 'German Pils',
    category: 'Лагеры',
    fermentationType: 'lager',
    ogRange: [1.044, 1.050],
    fgRange: [1.008, 1.013],
    abvRange: [4.4, 5.2],
    ibuRange: [22, 40],
    ebcRange: [4, 8],
    buGuRatioRange: [0.60, 0.85],
    description: 'Светлый, прозрачный немецкий лагер с сухим телом, выразительной хрустящей горечью благородных хмелей Hallertau/Tettnanger.',
    mashProfilePreset: 'Ступенчатое: 63°C (40 мин), 72°C (20 мин), 78°C (10 мин).'
  },
  {
    id: 'munich_helles',
    name: 'Мюнхенский хеллес (Munich Helles)',
    nameEn: 'Munich Helles',
    category: 'Лагеры',
    fermentationType: 'lager',
    ogRange: [1.044, 1.048],
    fgRange: [1.006, 1.012],
    abvRange: [4.7, 5.4],
    ibuRange: [16, 22],
    ebcRange: [6, 10],
    buGuRatioRange: [0.35, 0.48],
    description: 'Чистый, солодово-ориентированный золотистый немецкий лагер. Сладковатый зерновой вкус пилснер-солода с едва заметной хмелевой поддержкой.',
    mashProfilePreset: '63°C (30 мин), 68°C (30 мин), 78°C (10 мин). Лагеризация 4-6 недель при 1-2°C.'
  },
  {
    id: 'vienna_lager',
    name: 'Венский лагер (Vienna Lager)',
    nameEn: 'Vienna Lager',
    category: 'Лагеры',
    fermentationType: 'lager',
    ogRange: [1.048, 1.055],
    fgRange: [1.010, 1.014],
    abvRange: [4.7, 5.5],
    ibuRange: [18, 30],
    ebcRange: [18, 30],
    buGuRatioRange: [0.40, 0.60],
    description: 'Умеренно янтарный лагер с мягкой солодовой округлостью венского солода, легким поджаренным профилем и сухим чистым финалом.',
    mashProfilePreset: '64°C (40 мин), 70°C (25 мин), 78°C (10 мин).'
  },
  {
    id: 'munich_dunkel',
    name: 'Мюнхенский темный дункель (Munich Dunkel)',
    nameEn: 'Лагеры',
    category: 'Лагеры',
    fermentationType: 'lager',
    ogRange: [1.048, 1.056],
    fgRange: [1.010, 1.016],
    abvRange: [4.5, 5.6],
    ibuRange: [18, 28],
    ebcRange: [28, 55],
    buGuRatioRange: [0.38, 0.55],
    description: 'Классический темный лагер Баварии с глубоким хлебным, шоколадным и карамельным вкусом мюнхенского солода без терпкой жжености.',
    mashProfilePreset: 'Отварочное или ступенчатое: 63°C (35 мин), 71°C (30 мин), 78°C (10 мин).'
  },
  {
    id: 'baltic_porter',
    name: 'Балтийский портер (Baltic Porter - Лагер)',
    nameEn: 'Baltic Porter',
    category: 'Темные эли / Портеры',
    fermentationType: 'lager',
    ogRange: [1.060, 1.090],
    fgRange: [1.016, 1.024],
    abvRange: [6.5, 9.5],
    ibuRange: [20, 40],
    ebcRange: [40, 75],
    buGuRatioRange: [0.35, 0.55],
    description: 'Плотный, согревающий темный портер низового брожения с тонами темного шоколада, патоки, чернослива и вишни с мягким лагерным профилем.',
    mashProfilePreset: 'Затирание: 66°C (75 мин), мэшаут 78°C (10 мин). Долгая лагеризация при 2°C.'
  },
  {
    id: 'schwarzbier',
    name: 'Шварцбир / Черный лагер (Schwarzbier)',
    nameEn: 'Schwarzbier',
    category: 'Лагеры',
    fermentationType: 'lager',
    ogRange: [1.046, 1.052],
    fgRange: [1.010, 1.016],
    abvRange: [4.4, 5.4],
    ibuRange: [20, 30],
    ebcRange: [40, 65],
    buGuRatioRange: [0.45, 0.60],
    description: 'Германский черный лагер, сухой и освежающий, с мягким оттенком горького шоколада и кофе без жженой резкости (солод Carafa Special).',
    mashProfilePreset: '65°C (60 мин), 78°C (10 мин).'
  },
  {
    id: 'doppelbock',
    name: 'Доппельбок (Doppelbock)',
    nameEn: 'Doppelbock',
    category: 'Лагеры',
    fermentationType: 'lager',
    ogRange: [1.072, 1.112],
    fgRange: [1.016, 1.024],
    abvRange: [7.0, 10.0],
    ibuRange: [16, 26],
    ebcRange: [20, 60],
    buGuRatioRange: [0.22, 0.35],
    description: 'Крепкий, плотный, согревающий баварский лагер с богатейшей солодовой сладостью, тонами свежевыпеченного хлеба, изюма и ириски.',
    mashProfilePreset: '64°C (45 мин), 70°C (35 мин), 78°C (15 мин).'
  },
  {
    id: 'bamberg_rauchbier',
    name: 'Бамбергское копченое (Rauchbier)',
    nameEn: 'Bamberg Rauchbier',
    category: 'Лагеры',
    fermentationType: 'lager',
    ogRange: [1.050, 1.057],
    fgRange: [1.012, 1.016],
    abvRange: [4.8, 6.0],
    ibuRange: [20, 30],
    ebcRange: [25, 45],
    buGuRatioRange: [0.40, 0.55],
    description: 'Исторический лагер из Бамберга на буковом копченом солоде. Выразительный, аппетитный аромат костра, дымка и бекона с мягким солодовым телом.',
    mashProfilePreset: '64°C (45 мин), 72°C (25 мин), 78°C (10 мин).'
  },

  // --- ЭЛИ И IPA (ВЕРХОВОЕ БРОЖЕНИЕ) ---
  {
    id: 'american_pale_ale',
    name: 'Американский бледный эль (APA)',
    nameEn: 'American Pale Ale',
    category: 'Эли / Хмелевые',
    fermentationType: 'ale',
    ogRange: [1.045, 1.060],
    fgRange: [1.010, 1.015],
    abvRange: [4.5, 6.2],
    ibuRange: [30, 50],
    ebcRange: [10, 28],
    buGuRatioRange: [0.60, 0.85],
    description: 'Питкий, освежающий эль средней плотности со сбалансированной карамельно-солодовой поддержкой и ярким ароматом хмелей Cascade/Centennial.',
    mashProfilePreset: 'Сбалансированное тело: 66°C (60 мин), 78°C (10 мин).'
  },
  {
    id: 'american_ipa',
    name: 'Американский IPA (India Pale Ale)',
    nameEn: 'American IPA',
    category: 'Эли / Хмелевые',
    fermentationType: 'ale',
    ogRange: [1.056, 1.070],
    fgRange: [1.008, 1.014],
    abvRange: [5.5, 7.5],
    ibuRange: [40, 70],
    ebcRange: [12, 28],
    buGuRatioRange: [0.70, 1.05],
    description: 'Освежающий охмеленный эль с яркими цитрусовыми, хвойными и тропическими нотами Нового Света. Сухой финал и выразительная горечь.',
    mashProfilePreset: 'Однопаузное затирание на сухой финал: 65°C (60 мин), 78°C (мэшаут 10 мин).'
  },
  {
    id: 'double_ipa',
    name: 'Двойной IPA (Double IPA / DIPA)',
    nameEn: 'Double IPA',
    category: 'Эли / Хмелевые',
    fermentationType: 'ale',
    ogRange: [1.065, 1.085],
    fgRange: [1.008, 1.016],
    abvRange: [7.5, 10.0],
    ibuRange: [60, 100],
    ebcRange: [14, 30],
    buGuRatioRange: [0.85, 1.25],
    description: 'Интенсивный, крепкий эль с экстремальным охмелением хмелями Simcoe, Citra, Amarillo, поддерживаемый чистым плотным солодовым телом.',
    mashProfilePreset: '65°C (75 мин), 78°C (10 мин). Мощное сухое охмеление.'
  },
  {
    id: 'neipa_juicy',
    name: 'Новоанглийский сочный IPA (NEIPA / Hazy)',
    nameEn: 'New England / Hazy IPA',
    category: 'Эли / Хмелевые',
    fermentationType: 'ale',
    ogRange: [1.060, 1.075],
    fgRange: [1.010, 1.016],
    abvRange: [6.0, 8.5],
    ibuRange: [25, 45],
    ebcRange: [8, 18],
    buGuRatioRange: [0.40, 0.65],
    description: 'Сочный, мутный эль с шелковистым телом за счет овса и пшеницы. Взрыв ароматов манго, маракуйи и цитрусов без резкой горечи.',
    mashProfilePreset: 'Плотное тело: 67-68°C (60 мин), 78°C (мэшаут 10 мин). Массивный вирпул при 80°C и сухое охмеление.'
  },
  {
    id: 'black_ipa',
    name: 'Черный IPA (Black IPA / Cascadian)',
    nameEn: 'Black IPA',
    category: 'Эли / Хмелевые',
    fermentationType: 'ale',
    ogRange: [1.056, 1.075],
    fgRange: [1.010, 1.016],
    abvRange: [5.5, 7.8],
    ibuRange: [50, 90],
    ebcRange: [50, 85],
    buGuRatioRange: [0.80, 1.20],
    description: 'Черный как смоль, но легкий в питье эль. Яркие хвойно-цитрусовые хмели на фоне сдержанных кофейных и шоколадных солодов без жжености.',
    mashProfilePreset: '65°C (60 мин), дехвостированный солод Carafa задается в конце затирания.'
  },
  {
    id: 'english_esb',
    name: 'Английский биттер (Extra Special Bitter / ESB)',
    nameEn: 'Strong Bitter / ESB',
    category: 'Эли / Хмелевые',
    fermentationType: 'ale',
    ogRange: [1.048, 1.060],
    fgRange: [1.010, 1.016],
    abvRange: [4.6, 6.2],
    ibuRange: [25, 45],
    ebcRange: [16, 35],
    buGuRatioRange: [0.55, 0.75],
    description: 'Классический английский пабный эль с акцентом на карамельный солод Maris Otter и травянисто-пряные хмели East Kent Goldings.',
    mashProfilePreset: '67°C (60 мин), 78°C (10 мин).'
  },
  {
    id: 'irish_red_ale',
    name: 'Ирландский красный эль (Irish Red Ale)',
    nameEn: 'Irish Red Ale',
    category: 'Эли / Хмелевые',
    fermentationType: 'ale',
    ogRange: [1.044, 1.055],
    fgRange: [1.010, 1.014],
    abvRange: [4.0, 5.5],
    ibuRange: [18, 28],
    ebcRange: [20, 38],
    buGuRatioRange: [0.40, 0.55],
    description: 'Пивной стиль с рубиновым отливом благодаря капле жженого ячменя (Roasted Barley). Карамельная сладость тостов и сухой чистый финал.',
    mashProfilePreset: '66°C (60 мин), 78°C (10 мин).'
  },
  {
    id: 'kolsch',
    name: 'Кёльш (Kölsch - Светлый эль)',
    nameEn: 'Kölsch',
    category: 'Эли / Хмелевые',
    fermentationType: 'ale',
    ogRange: [1.044, 1.050],
    fgRange: [1.007, 1.011],
    abvRange: [4.4, 5.2],
    ibuRange: [18, 30],
    ebcRange: [6, 10],
    buGuRatioRange: [0.45, 0.65],
    description: 'Традиционный эль города Кёльн. Бродит при элевых температурах, но созревает на холоде (лагеризация). Тонкие яблочные эфиры и хрусткий финал.',
    mashProfilePreset: '64°C (45 мин), 72°C (20 мин), 78°C (10 мин).'
  },

  // --- ТЕМНЫЕ ЭЛИ И ПОРТЕРЫ (ВЕРХОВОЕ БРОЖЕНИЕ) ---
  {
    id: 'english_porter',
    name: 'Английский коричневый портер (English Porter)',
    nameEn: 'English Porter',
    category: 'Темные эли / Портеры',
    fermentationType: 'ale',
    ogRange: [1.040, 1.052],
    fgRange: [1.008, 1.014],
    abvRange: [4.0, 5.4],
    ibuRange: [18, 35],
    ebcRange: [35, 60],
    buGuRatioRange: [0.45, 0.65],
    description: 'Умеренно темный эль с мягким характером жареных солодов, ореховыми, карамельными и шоколадными оттенками без резкой жжености стаутов.',
    mashProfilePreset: '67°C (60 мин), 78°C (10 мин).'
  },
  {
    id: 'robust_porter',
    name: 'Крепкий крафтовый портер (Robust Porter)',
    nameEn: 'American Robust Porter',
    category: 'Темные эли / Портеры',
    fermentationType: 'ale',
    ogRange: [1.050, 1.065],
    fgRange: [1.012, 1.018],
    abvRange: [5.0, 6.8],
    ibuRange: [25, 45],
    ebcRange: [45, 80],
    buGuRatioRange: [0.50, 0.75],
    description: 'Существенный, богатый темный эль с выраженными нотами жареных зерен, черного шоколада, патоки и отчетливой хмелевой горечью.',
    mashProfilePreset: '67°C (60 мин), 78°C (10 мин).'
  },
  {
    id: 'dry_irish_stout',
    name: 'Сухой ирландский стаут (Irish Stout / Guinness)',
    nameEn: 'Irish Stout',
    category: 'Темные эли / Портеры',
    fermentationType: 'ale',
    ogRange: [1.036, 1.044],
    fgRange: [1.007, 1.011],
    abvRange: [3.8, 4.5],
    ibuRange: [25, 45],
    ebcRange: [50, 80],
    buGuRatioRange: [0.70, 1.05],
    description: 'Черный как кофе, очень питкий эль с сухим финишем, выразительной кофейной горчинкой от жженого ячменя и плотной стойкой белой пеной.',
    mashProfilePreset: '65°C (60 мин), 78°C (10 мин).'
  },
  {
    id: 'oatmeal_stout',
    name: 'Овсяный стаут (Oatmeal Stout)',
    nameEn: 'Oatmeal Stout',
    category: 'Темные эли / Портеры',
    fermentationType: 'ale',
    ogRange: [1.045, 1.065],
    fgRange: [1.010, 1.018],
    abvRange: [4.2, 5.9],
    ibuRange: [25, 40],
    ebcRange: [45, 80],
    buGuRatioRange: [0.50, 0.70],
    description: 'Очень темный, бархатистый эль со сливочным телом за счет добавления овсяных хлопьев, тонами кофе, молочного шоколада и жареного ячменя.',
    mashProfilePreset: 'Полнотелое затирание: 68°C (60 мин) для остаточных декстринов, 78°C мэшаут (10 мин).'
  },
  {
    id: 'sweet_milk_stout',
    name: 'Сладкий / Молочный стаут (Sweet Milk Stout)',
    nameEn: 'Sweet Stout',
    category: 'Темные эли / Портеры',
    fermentationType: 'ale',
    ogRange: [1.044, 1.060],
    fgRange: [1.012, 1.024],
    abvRange: [4.0, 6.0],
    ibuRange: [20, 35],
    ebcRange: [55, 85],
    buGuRatioRange: [0.40, 0.60],
    description: 'Плотный сладковатый стаут со сливочным вкусом за счет добавления несбраживаемой лактозы (молочного сахара) на кипячении.',
    mashProfilePreset: '67°C (60 мин). Добавление лактозы (15-20 г/л) за 15 минут до конца кипячения.'
  },
  {
    id: 'imperial_stout',
    name: 'Русский имперский стаут (RIS)',
    nameEn: 'Russian Imperial Stout',
    category: 'Темные эли / Портеры',
    fermentationType: 'ale',
    ogRange: [1.075, 1.115],
    fgRange: [1.018, 1.030],
    abvRange: [8.0, 12.0],
    ibuRange: [50, 90],
    ebcRange: [60, 100],
    buGuRatioRange: [0.65, 0.95],
    description: 'Мощный, интенсивный черный эль с глубокими оттенками темного шоколада, эспрессо, чернослива и изюма с согревающим алкоголем.',
    mashProfilePreset: 'Длительное затирание: 66-67°C (90 мин), кипячение 90-120 минут для карамелизации сусла.'
  },

  // --- ПШЕНИЧНЫЕ СТИЛИ (ВЕРХОВОЕ БРОЖЕНИЕ) ---
  {
    id: 'weizen',
    name: 'Баварский вайцен (Пшеничное пиво)',
    nameEn: 'Weissbier / Hefeweizen',
    category: 'Пшеничное',
    fermentationType: 'ale',
    ogRange: [1.044, 1.052],
    fgRange: [1.010, 1.014],
    abvRange: [4.3, 5.6],
    ibuRange: [8, 15],
    ebcRange: [6, 16],
    buGuRatioRange: [0.18, 0.32],
    description: 'Освежающее мутное пшеничное пиво с характерным эфирным профилем банана (изоамилацетат) и гвоздики (4-винилгваякол). Пышная стойкая пена.',
    mashProfilePreset: 'Феруловая пауза для гвоздики: 44°C (15 мин), белковая 52°C (15 мин), сахаризация 63°C (40 мин), осахаривание 72°C (20 мин), мэшаут 78°C.'
  },
  {
    id: 'dunkelweizen',
    name: 'Баварский дункельвайцен (Темное пшеничное)',
    nameEn: 'Dunkelweizen',
    category: 'Пшеничное',
    fermentationType: 'ale',
    ogRange: [1.046, 1.056],
    fgRange: [1.010, 1.014],
    abvRange: [4.4, 5.6],
    ibuRange: [10, 18],
    ebcRange: [25, 50],
    buGuRatioRange: [0.20, 0.35],
    description: 'Темное баварское пшеничное пиво. Сочетает банановые эфиры с хлебным, карамельным и шоколадным телом темного мюнхенского солода.',
    mashProfilePreset: '44°C (15 мин), 52°C (15 мин), 64°C (40 мин), 72°C (20 мин), 78°C (10 мин).'
  },
  {
    id: 'witbier',
    name: 'Бланш / Бельгийский витбир (Witbier)',
    nameEn: 'Belgian Witbier',
    category: 'Пшеничное',
    fermentationType: 'ale',
    ogRange: [1.044, 1.052],
    fgRange: [1.008, 1.012],
    abvRange: [4.5, 5.5],
    ibuRange: [10, 20],
    ebcRange: [4, 8],
    buGuRatioRange: [0.22, 0.40],
    description: 'Освежающий элегантный пшеничный эль с несоложеной пшеницей, кориандром и коркой горького померанца (апельсина кюрасао).',
    mashProfilePreset: 'Белковая пауза 50°C (15 мин), осахаривание 65°C (50 мин), 72°C (15 мин), мэшаут 78°C.'
  },

  // --- БЕЛЬГИЙСКИЕ ЭЛИ ---
  {
    id: 'belgian_blond',
    name: 'Бельгийский блонд (Belgian Blond Ale)',
    nameEn: 'Belgian Blond Ale',
    category: 'Бельгийские эли',
    fermentationType: 'ale',
    ogRange: [1.062, 1.075],
    fgRange: [1.008, 1.018],
    abvRange: [6.0, 7.5],
    ibuRange: [15, 30],
    ebcRange: [8, 14],
    buGuRatioRange: [0.25, 0.45],
    description: 'Золотистый, умеренно крепкий бельгийский эль с тонкой солодовой сладостью, деликатными фруктовыми эфирами спелой груши и легким пряным перцем.',
    mashProfilePreset: '64°C (45 мин), 71°C (20 мин), 78°C (10 мин).'
  },
  {
    id: 'belgian_dubbel',
    name: 'Бельгийский дюббель (Belgian Dubbel)',
    nameEn: 'Belgian Dubbel',
    category: 'Бельгийские эли',
    fermentationType: 'ale',
    ogRange: [1.062, 1.075],
    fgRange: [1.008, 1.018],
    abvRange: [6.0, 7.6],
    ibuRange: [15, 25],
    ebcRange: [25, 45],
    buGuRatioRange: [0.25, 0.40],
    description: 'Медно-коричневый траппистский эль с богатым карамельным телом, нотами темных сухофруктов (изюм, финики) и бельгийским леденцовым сахаром.',
    mashProfilePreset: '63°C (45 мин), 68°C (30 мин), 78°C (10 мин). Темный канди-сироп на варке.'
  },
  {
    id: 'belgian_tripel',
    name: 'Бельгийский трипель (Belgian Tripel)',
    nameEn: 'Belgian Tripel',
    category: 'Бельгийские эли',
    fermentationType: 'ale',
    ogRange: [1.075, 1.085],
    fgRange: [1.008, 1.014],
    abvRange: [7.5, 9.5],
    ibuRange: [20, 40],
    ebcRange: [9, 14],
    buGuRatioRange: [0.35, 0.50],
    description: 'Золотистый крепкий траппистский эль с кремовой пеной, пряными фенольными и фруктовыми нотами, с добавлением светлого кандированного сахара.',
    mashProfilePreset: 'Ступенчатое для сухости: 62°C (45 мин), 68°C (30 мин), 78°C мэшаут. Добавление декстрозы/канди-сахара на кипячении.'
  },
  {
    id: 'saison',
    name: 'Сэзон / Фермерский эль (Saison)',
    nameEn: 'Saison / Farmhouse Ale',
    category: 'Бельгийские эли',
    fermentationType: 'ale',
    ogRange: [1.048, 1.065],
    fgRange: [1.002, 1.008],
    abvRange: [5.0, 7.0],
    ibuRange: [20, 35],
    ebcRange: [10, 22],
    buGuRatioRange: [0.40, 0.60],
    description: 'Высокосброженный, сухой и шипучий бельгийский фермерский эль с пряными, перечными и цитрусовыми нотами, сбраживаемый при повышенных температурах.',
    mashProfilePreset: 'Очень низкая пауза 62-63°C (75 мин) для максимального образования мальтозы, 78°C мэшаут.'
  },

  // --- КИСЛЫЕ И ИСТОРИЧЕСКИЕ СТИЛИ ---
  {
    id: 'gose_sour',
    name: 'Гозе с солью и кориандром (Gose)',
    nameEn: 'Gose',
    category: 'Кислые эли',
    fermentationType: 'spontaneous',
    ogRange: [1.036, 1.048],
    fgRange: [1.006, 1.010],
    abvRange: [4.2, 4.8],
    ibuRange: [5, 12],
    ebcRange: [6, 10],
    buGuRatioRange: [0.15, 0.28],
    description: 'Освежающий кислый пшеничный эль исторического немецкого стиля с добавлением морской соли и зерен кориандра. Метод Kettle Sour (лактобактерии).',
    mashProfilePreset: 'Затирание 65°C (60 мин), закисление сусла лактобактериями в котле до pH 3.3-3.6, затем кипячение.'
  },
  {
    id: 'berliner_weisse',
    name: 'Берлинер вайссе (Berliner Weisse)',
    nameEn: 'Berliner Weisse',
    category: 'Кислые эли',
    fermentationType: 'spontaneous',
    ogRange: [1.028, 1.036],
    fgRange: [1.003, 1.006],
    abvRange: [2.8, 3.8],
    ibuRange: [3, 8],
    ebcRange: [4, 7],
    buGuRatioRange: [0.10, 0.25],
    description: 'Очень легкий, сильно закисленный немецкий пшеничный эль («Северное шампанское»). Идеален в жару, пьется чистым или с сиропом.',
    mashProfilePreset: '65°C (45 мин), Kettle Sour закисление до pH 3.2-3.4, короткое кипячение 20 мин.'
  },
  {
    id: 'barleywine',
    name: 'Английский барливайн (Barleywine / Ячменное вино)',
    nameEn: 'English Barleywine',
    category: 'Темные эли / Портеры',
    fermentationType: 'ale',
    ogRange: [1.080, 1.120],
    fgRange: [1.018, 1.030],
    abvRange: [8.5, 12.5],
    ibuRange: [35, 70],
    ebcRange: [22, 60],
    buGuRatioRange: [0.45, 0.75],
    description: 'Величавый плотный эль с согревающим алкоголем, богатыми тонами хлебной корочки, карамели, ириски, патоки и благородной выдержкой.',
    mashProfilePreset: '66°C (90 мин), долгое кипячение 90-120 минут.'
  }
];

/**
 * Проверка, является ли стиль свободным/авторским без жестких рамок BJCP
 */
export function isNonBjcpStyle(styleIdOrName: string): boolean {
  if (!styleIdOrName) return true;
  const lower = styleIdOrName.trim().toLowerCase();
  return (
    lower.includes('без стиля') ||
    lower.includes('свободный') ||
    lower.includes('чистый') ||
    lower.includes('авторск') ||
    lower === 'custom' ||
    lower === 'none'
  );
}

/**
 * Валидация сбалансированности рецепта по выбранному стилю BJCP
 */
export function validateRecipeAgainstStyle(
  calc: CalculatedBrewParams,
  styleIdOrName: string
): StyleValidation {
  if (isNonBjcpStyle(styleIdOrName)) {
    return {
      isCompliant: true,
      ogStatus: 'match',
      fgStatus: 'match',
      abvStatus: 'match',
      ibuStatus: 'match',
      ebcStatus: 'match',
      balanceVerdict: 'Свободный авторский рецепт без ограничений BJCP. Параметры на усмотрение пивовара.',
      recommendations: []
    };
  }

  const style = BJCP_STYLES.find(
    s => s.id === styleIdOrName || s.name.toLowerCase().includes(styleIdOrName.toLowerCase())
  );

  if (!style) {
    return {
      isCompliant: true,
      ogStatus: 'match',
      fgStatus: 'match',
      abvStatus: 'match',
      ibuStatus: 'match',
      ebcStatus: 'match',
      balanceVerdict: 'Свободный авторский рецепт. Стили BJCP не применяются.',
      recommendations: []
    };
  }

  const ogStatus = calc.ogSg < style.ogRange[0] ? 'low' : calc.ogSg > style.ogRange[1] ? 'high' : 'match';
  const fgStatus = calc.fgSg < style.fgRange[0] ? 'low' : calc.fgSg > style.fgRange[1] ? 'high' : 'match';
  const abvStatus = calc.abv < style.abvRange[0] ? 'low' : calc.abv > style.abvRange[1] ? 'high' : 'match';
  const ibuStatus = calc.ibu < style.ibuRange[0] ? 'low' : calc.ibu > style.ibuRange[1] ? 'high' : 'match';
  const ebcStatus = calc.ebc < style.ebcRange[0] ? 'low' : calc.ebc > style.ebcRange[1] ? 'high' : 'match';

  const recommendations: string[] = [];

  if (ogStatus === 'low') {
    recommendations.push(`НП ${calc.ogSg.toFixed(3)} ниже стандарта стиля (${style.ogRange[0].toFixed(3)} - ${style.ogRange[1].toFixed(3)}). Увеличьте базовый солод.`);
  } else if (ogStatus === 'high') {
    recommendations.push(`НП ${calc.ogSg.toFixed(3)} выше стиля (${style.ogRange[0].toFixed(3)} - ${style.ogRange[1].toFixed(3)}). Пиво получится плотнее или крепче.`);
  }

  if (ibuStatus === 'low') {
    recommendations.push(`Горечь ${calc.ibu} IBU недостаточна для стиля (${style.ibuRange[0]} - ${style.ibuRange[1]} IBU). Добавьте хмель на 60 минуте.`);
  } else if (ibuStatus === 'high') {
    recommendations.push(`Горечь ${calc.ibu} IBU превышает стиль (${style.ibuRange[0]} - ${style.ibuRange[1]} IBU). Снизьте дозировку хмеля на горечь.`);
  }

  if (ebcStatus === 'low') {
    recommendations.push(`Цвет ${calc.ebc} EBC бледнее стиля (${style.ebcRange[0]} - ${style.ebcRange[1]} EBC). Добавьте немного карамельного или специального солода.`);
  } else if (ebcStatus === 'high') {
    recommendations.push(`Цвет ${calc.ebc} EBC темнее стиля (${style.ebcRange[0]} - ${style.ebcRange[1]} EBC). Уменьшите долю темных/жженых солодов.`);
  }

  // Оценка баланса BU:GU
  let balanceVerdict = 'Сбалансированный профиль';
  if (calc.buGuRatio < style.buGuRatioRange[0] * 0.8) {
    balanceVerdict = 'Слишком сладкий/солодовый профиль — не хватает хмелевой горечи';
  } else if (calc.buGuRatio > style.buGuRatioRange[1] * 1.2) {
    balanceVerdict = 'Слишком агрессивная горечь относительно плотности тела';
  } else {
    balanceVerdict = 'Идеальный баланс хмеля и солода (BU:GU попадает в диапазон стиля)';
  }

  const isCompliant = ogStatus === 'match' && abvStatus === 'match' && ibuStatus === 'match' && ebcStatus === 'match';

  return {
    isCompliant,
    ogStatus,
    fgStatus,
    abvStatus,
    ibuStatus,
    ebcStatus,
    balanceVerdict,
    recommendations
  };
}

/**
 * Пропорциональное масштабирование рецепта на новый объем варки (Scale Batch)
 */
export function scaleRecipeIngredients(
  grains: GrainItem[],
  hops: HopItem[],
  oldBatchL: number,
  newBatchL: number
): { scaledGrains: GrainItem[]; scaledHops: HopItem[] } {
  if (oldBatchL <= 0 || newBatchL <= 0) return { scaledGrains: grains, scaledHops: hops };
  const ratio = newBatchL / oldBatchL;

  const scaledGrains = grains.map(g => ({
    ...g,
    weightKg: Number((g.weightKg * ratio).toFixed(3))
  }));

  const scaledHops = hops.map(h => ({
    ...h,
    weightG: Number((h.weightG * ratio).toFixed(1))
  }));

  return { scaledGrains, scaledHops };
}

/**
 * Поиск наиболее подходящего стиля BJCP по названию, идентификатору или ключевым словам
 */
export function findMatchingBjcpStyle(styleNameOrId: string): BJCPStyle {
  if (!styleNameOrId) return BJCP_STYLES[0];
  const query = styleNameOrId.trim().toLowerCase();

  // 1. Точное совпадение по id, name или nameEn
  const exact = BJCP_STYLES.find(
    s => s.id.toLowerCase() === query ||
         s.name.toLowerCase() === query ||
         s.nameEn.toLowerCase() === query
  );
  if (exact) return exact;

  // 2. Частичное совпадение
  const partial = BJCP_STYLES.find(
    s => s.name.toLowerCase().includes(query) ||
         query.includes(s.name.toLowerCase()) ||
         s.nameEn.toLowerCase().includes(query) ||
         query.includes(s.nameEn.toLowerCase())
  );
  if (partial) return partial;

  // 3. Эвристический подбор по ключевым словам
  if (query.includes('pils') || query.includes('пилс')) {
    return BJCP_STYLES.find(s => s.id === 'german_pils') || BJCP_STYLES[0];
  }
  if (query.includes('ipa') || query.includes('айпиэй') || query.includes('ипа')) {
    return BJCP_STYLES.find(s => s.id === 'american_ipa') || BJCP_STYLES[0];
  }
  if (query.includes('stout') || query.includes('стаут')) {
    return BJCP_STYLES.find(s => s.id === 'oatmeal_stout') || BJCP_STYLES[0];
  }
  if (query.includes('porter') || query.includes('портер')) {
    return BJCP_STYLES.find(s => s.id === 'english_porter') || BJCP_STYLES[0];
  }
  if (query.includes('weiss') || query.includes('weizen') || query.includes('вайс') || query.includes('пшенич')) {
    return BJCP_STYLES.find(s => s.id === 'weissbier') || BJCP_STYLES[0];
  }
  if (query.includes('dunkel') || query.includes('дункель')) {
    return BJCP_STYLES.find(s => s.id === 'munich_dunkel') || BJCP_STYLES[0];
  }
  if (query.includes('helles') || query.includes('хеллес')) {
    return BJCP_STYLES.find(s => s.id === 'munich_helles') || BJCP_STYLES[0];
  }
  if (query.includes('vienna') || query.includes('венск')) {
    return BJCP_STYLES.find(s => s.id === 'vienna_lager') || BJCP_STYLES[0];
  }
  if (query.includes('lager') || query.includes('лагер')) {
    return BJCP_STYLES.find(s => s.id === 'czech_pilsner') || BJCP_STYLES[0];
  }
  if (query.includes('pale ale') || query.includes('пэйл') || query.includes('apa')) {
    return BJCP_STYLES.find(s => s.id === 'american_pale_ale') || BJCP_STYLES[0];
  }
  if (query.includes('gose') || query.includes('гозе')) {
    return BJCP_STYLES.find(s => s.id === 'historical_gose') || BJCP_STYLES[0];
  }
  if (query.includes('saison') || query.includes('сезон')) {
    return BJCP_STYLES.find(s => s.id === 'saison') || BJCP_STYLES[0];
  }

  return BJCP_STYLES[0];
}

export interface BalanceRecipeOptions {
  balanceGrains?: boolean;
  balanceHops?: boolean;
  balanceYeast?: boolean;
}

/**
 * Автоматическая балансировка и корректировка рецепта под выбранный стиль BJCP в 1 клик
 * Интеллектуально балансирует:
 * - Засыпь солода: вес пересчитывается для достижения эталонной НП (OG);
 * - Цветность (EBC): добавляет/корректирует специальные солода в стиль;
 * - Хмели: регулирует горечь (IBU) и баланс BU:GU под профиль стиля;
 * - Дрожжи: оптимизирует аттенюацию для попадания в КП (FG) и алкоголь (ABV);
 * - Полный перерасчет всех технологических параметров варки.
 */
export function balanceRecipeForStyle(
  recipe: Recipe,
  options: BalanceRecipeOptions = {}
): {
  balancedRecipe: Recipe;
  changesSummary: string[];
} {
  const doGrains = options.balanceGrains !== false;
  const doHops = options.balanceHops !== false;
  const doYeast = options.balanceYeast !== false;

  const targetStyle = findMatchingBjcpStyle(recipe.style);

  // 1. Целевые параметры стиля
  const targetOg = Number(((targetStyle.ogRange[0] + targetStyle.ogRange[1]) / 2).toFixed(3));
  const targetOgPoints = (targetOg - 1.0) * 1000;
  const targetEbc = Number(((targetStyle.ebcRange[0] + targetStyle.ebcRange[1]) / 2).toFixed(1));

  // Идеальный баланс горечи BU:GU
  const avgBuGu = (targetStyle.buGuRatioRange[0] + targetStyle.buGuRatioRange[1]) / 2;
  const calculatedTargetIbu = Math.round(targetOgPoints * avgBuGu);
  const targetIbu = Math.max(targetStyle.ibuRange[0], Math.min(targetStyle.ibuRange[1], calculatedTargetIbu));

  const batchSizeL = Math.max(1, recipe.batchSizeL);
  const batchSizeGal = batchSizeL * 0.264172;
  const effFactor = Math.max(0.4, (recipe.efficiencyPercent || 75) / 100);

  // 2. Дрожжи: аттенюация и попадание в крепость ABV
  const updatedYeast: Yeast = { ...recipe.yeast };
  if (doYeast) {
    const targetAbv = (targetStyle.abvRange[0] + targetStyle.abvRange[1]) / 2;
    // Требуемая разность плотности: ABV = (OG - FG) * 131.25 => OG - FG = ABV / 131.25
    const neededOgFgDelta = targetAbv / 131.25;
    const targetFgSg = targetOg - neededOgFgDelta;
    const targetFgPoints = (targetFgSg - 1.0) * 1000;
    let idealAttenuation = Math.round((1.0 - targetFgPoints / targetOgPoints) * 100);
    idealAttenuation = Math.max(68, Math.min(84, idealAttenuation));
    updatedYeast.attenuationPercent = idealAttenuation;

    if (targetStyle.fermentationType === 'lager' && updatedYeast.type !== 'lager') {
      updatedYeast.type = 'lager';
      updatedYeast.tempRange = [10, 14];
      if (updatedYeast.name.toLowerCase().includes('05') || updatedYeast.name.toLowerCase().includes('ale')) {
        updatedYeast.name = 'Saflager W-34/70';
        updatedYeast.lab = 'Fermentis';
      }
    }
  }

  // 3. Корректировка зерновой засыпи (Grains)
  let adjustedGrains: GrainItem[] = recipe.grains.map(g => ({ ...g }));

  if (doGrains) {
    // Если засыпь пустая — создаем базовый солод из линейки «Курский солод»
    if (adjustedGrains.length === 0) {
      const isWheat = targetStyle.id.includes('weiss') || targetStyle.id.includes('wit');
      const isLager = targetStyle.fermentationType === 'lager';
      if (isWheat) {
        adjustedGrains = [
          { id: `grain_${Date.now()}_1`, name: 'Курский Пшеничный светлый (Wheat Malt)', weightKg: 3.5, potentialSg: 1.038, colorEbc: 4.5, type: 'wheat' },
          { id: `grain_${Date.now()}_2`, name: 'Курский Пилснер (Pilsner Malt)', weightKg: 3.5, potentialSg: 1.037, colorEbc: 3.8, type: 'base' }
        ];
      } else if (isLager) {
        adjustedGrains = [
          { id: `grain_${Date.now()}_1`, name: 'Курский Пилснер (Pilsner Malt)', weightKg: 7.0, potentialSg: 1.037, colorEbc: 3.8, type: 'base' }
        ];
      } else {
        adjustedGrains = [
          { id: `grain_${Date.now()}_1`, name: 'Курский Пэйл Эль (Pale Ale Malt)', weightKg: 7.0, potentialSg: 1.038, colorEbc: 6.0, type: 'base' }
        ];
      }
    }

  // 3a. Сначала масштабируем засыпь для достижения целевой плотности (OG)
  let currentPoints = adjustedGrains.reduce((sum, g) => {
    const ptsPerLb = (g.potentialSg - 1.0) * 1000;
    return sum + (ptsPerLb * (g.weightKg * 2.20462) * effFactor) / batchSizeGal;
  }, 0);

  if (currentPoints <= 0) currentPoints = 1;
  const ogScale = targetOgPoints / currentPoints;

  adjustedGrains = adjustedGrains.map(g => ({
    ...g,
    weightKg: Math.max(0.05, Number((g.weightKg * ogScale).toFixed(2)))
  }));

  // 3b. Оценка и балансировка цветности (EBC)
  const getGristMcu = (grist: GrainItem[]) => grist.reduce((sum, g) => {
    const weightLbs = g.weightKg * 2.20462;
    const lovibond = g.colorEbc / 1.97;
    return sum + (weightLbs * lovibond) / batchSizeGal;
  }, 0);

  const getGristEbc = (grist: GrainItem[]) => {
    const mcu = getGristMcu(grist);
    const srm = mcu > 0 ? 1.4922 * Math.pow(mcu, 0.6859) : 2.0;
    return Number((srm * 1.97).toFixed(1));
  };

  const currentEbc = getGristEbc(adjustedGrains);

  // Если цвет ниже допустимого диапазона стиля
  if (currentEbc < targetStyle.ebcRange[0]) {
    const targetMidEbc = (targetStyle.ebcRange[0] + targetStyle.ebcRange[1]) / 2;
    const targetSrm = targetMidEbc / 1.97;
    const targetMcu = Math.pow(targetSrm / 1.4922, 1 / 0.6859);
    const currentMcu = getGristMcu(adjustedGrains);
    const deltaMcu = Math.max(0, targetMcu - currentMcu);

    const mainBaseGrain = adjustedGrains.reduce((prev, curr) => (curr.weightKg > prev.weightKg ? curr : prev), adjustedGrains[0]);
    const baseColor = mainBaseGrain ? mainBaseGrain.colorEbc : 4.0;

    const existingSpecialty = adjustedGrains.find(g => g.colorEbc >= 25);
    if (existingSpecialty) {
      const specLovibond = existingSpecialty.colorEbc / 1.97;
      const baseLovibond = baseColor / 1.97;
      const diffLovibond = Math.max(1, specLovibond - baseLovibond);
      const addedLbs = (deltaMcu * batchSizeGal) / diffLovibond;
      const addedKg = Math.max(0.05, Number((addedLbs / 2.20462).toFixed(2)));
      existingSpecialty.weightKg = Number((existingSpecialty.weightKg + addedKg).toFixed(2));
      if (mainBaseGrain && mainBaseGrain !== existingSpecialty && mainBaseGrain.weightKg > addedKg + 0.5) {
        mainBaseGrain.weightKg = Number((mainBaseGrain.weightKg - addedKg).toFixed(2));
      }
    } else {
      let specName = 'Курский Мюнхенский темный (Munich Typ 2, 25 EBC)';
      let specColor = 25.0;
      let specType: 'base' | 'caramel' | 'roasted' = 'base';
      let specPotential = 1.035;

      if (targetMidEbc >= 45) {
        specName = 'Курский Шоколадный (Chocolate 900 EBC)';
        specColor = 900.0;
        specType = 'roasted';
        specPotential = 1.028;
      } else if (targetMidEbc >= 18) {
        specName = 'Курский Карамельный 150 (Caramel 150 EBC)';
        specColor = 150.0;
        specType = 'caramel';
        specPotential = 1.033;
      } else {
        specName = 'Курский Карамельный 50 (Caramel 50 EBC)';
        specColor = 50.0;
        specType = 'caramel';
        specPotential = 1.034;
      }

      const specLovibond = specColor / 1.97;
      const baseLovibond = baseColor / 1.97;
      const diffLovibond = Math.max(1, specLovibond - baseLovibond);
      const addedLbs = (deltaMcu * batchSizeGal) / diffLovibond;
      const addedKg = Math.max(0.05, Number((addedLbs / 2.20462).toFixed(2)));

      adjustedGrains.push({
        id: `grain_spec_${Date.now()}`,
        name: specName,
        weightKg: addedKg,
        potentialSg: specPotential,
        colorEbc: specColor,
        type: specType
      });

      if (mainBaseGrain && mainBaseGrain.weightKg > addedKg + 0.5) {
        mainBaseGrain.weightKg = Number((mainBaseGrain.weightKg - addedKg).toFixed(2));
      }
    }
  } else if (currentEbc > targetStyle.ebcRange[1]) {
    // Если цвет слишком темный для стиля
    const excessFactor = (targetStyle.ebcRange[1] * 0.95) / currentEbc;
    adjustedGrains = adjustedGrains.map(g => {
      if (g.colorEbc > 20) {
        return { ...g, weightKg: Math.max(0.05, Number((g.weightKg * excessFactor).toFixed(2))) };
      }
      return g;
    });
  }

  // 3c. Финальная точная доводка плотности (OG) на базовом солоде
  const finalPoints = adjustedGrains.reduce((sum, g) => {
    const ptsPerLb = (g.potentialSg - 1.0) * 1000;
    return sum + (ptsPerLb * (g.weightKg * 2.20462) * effFactor) / batchSizeGal;
  }, 0);

    const mainBase = adjustedGrains.reduce((prev, curr) => (curr.weightKg > prev.weightKg ? curr : prev), adjustedGrains[0]);
    if (mainBase) {
      const diffPoints = targetOgPoints - finalPoints;
      const ptsPerKg = ((mainBase.potentialSg - 1.0) * 1000 * 2.20462 * effFactor) / batchSizeGal;
      if (ptsPerKg > 0) {
        const kgDelta = diffPoints / ptsPerKg;
        mainBase.weightKg = Math.max(0.1, Number((mainBase.weightKg + kgDelta).toFixed(2)));
      }
    }
  }

  // 4. Корректировка хмеля (Hops) под горечь IBU
  let adjustedHops: HopItem[] = recipe.hops.map(h => ({ ...h }));

  if (doHops) {
    const bignessFactor = 1.65 * Math.pow(0.000125, targetOg - 1.0);

    const calcHopIbu = (h: HopItem): number => {
      if (h.use === 'dry_hop') return 0;
      const time = h.use === 'whirlpool' ? 10 : Math.max(0, h.boilTimeMin);
      const boilFactor = (1.0 - Math.exp(-0.04 * time)) / 4.15;
      const util = bignessFactor * boilFactor;
      return (util * (h.alphaAcid / 100) * h.weightG * 1000) / batchSizeL;
    };

    const currentHopIbu = adjustedHops.reduce((sum, h) => sum + calcHopIbu(h), 0);

    // Если хмеля нет или IBU равен 0
    if (adjustedHops.length === 0 || currentHopIbu <= 0) {
      let hopName = 'Magnum';
      let alphaAcid = 12.0;
      if (targetStyle.fermentationType === 'lager' || targetStyle.id.includes('pils')) {
        hopName = 'Saaz (Жатецкий)';
        alphaAcid = 3.8;
      } else if (targetStyle.id.includes('ipa') || targetStyle.category.includes('IPA')) {
        hopName = 'Cascade';
        alphaAcid = 6.5;
      } else if (targetStyle.id.includes('english') || targetStyle.id.includes('porter')) {
        hopName = 'East Kent Goldings';
        alphaAcid = 5.0;
      }

      const time = 60;
      const boilFactor = (1.0 - Math.exp(-0.04 * time)) / 4.15;
      const util = bignessFactor * boilFactor;
      const weightG = Math.max(5, Math.round((targetIbu * batchSizeL) / (util * (alphaAcid / 100) * 1000)));

      adjustedHops = [
        {
          id: `hop_${Date.now()}`,
          name: hopName,
          weightG,
          alphaAcid,
          boilTimeMin: 60,
          use: 'boil'
        }
      ];
    } else {
      // Если хмели есть: масштабируем варочные хмели на горечь (boilTime >= 20 мин)
      const bitteringHops = adjustedHops.filter(h => h.use === 'boil' && h.boilTimeMin >= 20);
      const aromaHops = adjustedHops.filter(h => h.use !== 'boil' || h.boilTimeMin < 20);
      const aromaIbu = aromaHops.reduce((sum, h) => sum + calcHopIbu(h), 0);

      const neededBitteringIbu = Math.max(0, targetIbu - aromaIbu);
      const currentBitteringIbu = bitteringHops.reduce((sum, h) => sum + calcHopIbu(h), 0);

      if (currentBitteringIbu > 0) {
        const hopRatio = neededBitteringIbu / currentBitteringIbu;
        adjustedHops = adjustedHops.map(h => {
          if (h.use === 'boil' && h.boilTimeMin >= 20) {
            return { ...h, weightG: Math.max(1, Math.round(h.weightG * hopRatio)) };
          }
          return h;
        });
      } else {
        // Масштабируем все кипяченые хмели
        const hopRatio = targetIbu / Math.max(1, currentHopIbu);
        adjustedHops = adjustedHops.map(h => {
          if (h.use !== 'dry_hop') {
            return { ...h, weightG: Math.max(1, Math.round(h.weightG * hopRatio)) };
          }
          return h;
        });
      }

      // Тонкая подгонка IBU на основном хмеле
      const newHopIbu = Math.round(adjustedHops.reduce((sum, h) => sum + calcHopIbu(h), 0));
      if (newHopIbu !== targetIbu) {
        const mainHop = adjustedHops.find(h => h.use === 'boil' && h.boilTimeMin >= 30) || adjustedHops[0];
        if (mainHop && mainHop.use !== 'dry_hop') {
          const time = mainHop.use === 'whirlpool' ? 10 : mainHop.boilTimeMin;
          const boilFactor = (1.0 - Math.exp(-0.04 * time)) / 4.15;
          const util = bignessFactor * boilFactor;
          const ibuPerGram = (util * (mainHop.alphaAcid / 100) * 1000) / batchSizeL;
          if (ibuPerGram > 0) {
            const deltaG = Math.round((targetIbu - newHopIbu) / ibuPerGram);
            mainHop.weightG = Math.max(1, mainHop.weightG + deltaG);
          }
        }
      }
    }
  }

  // 5. Пересчет итоговых параметров
  const recalculated = calculateBrewMetrics({
    batchSizeL,
    boilTimeMin: recipe.boilTimeMin,
    efficiencyPercent: recipe.efficiencyPercent,
    grainRatioLPerKg: recipe.grainRatioLPerKg,
    grainTempC: recipe.grainTempC,
    targetCarbonationVol: recipe.targetCarbonationVol,
    beerTempAtBottlingC: recipe.beerTempAtBottlingC,
    grains: adjustedGrains,
    hops: adjustedHops,
    yeast: updatedYeast
  });

  // 6. Формирование списка сделанных изменений
  const changesSummary: string[] = [];
  const oldCalc = recipe.calculated;

  if (Math.abs(oldCalc.ogSg - recalculated.ogSg) >= 0.001) {
    changesSummary.push(
      `НП (OG) скорректирована: ${oldCalc.ogSg.toFixed(3)} ➔ ${recalculated.ogSg.toFixed(3)} SG (${recalculated.ogPlato}°P)`
    );
  }

  if (Math.abs(oldCalc.totalGrainWeightKg - recalculated.totalGrainWeightKg) >= 0.05) {
    changesSummary.push(
      `Засыпь солода сбалансирована: ${oldCalc.totalGrainWeightKg.toFixed(2)} кг ➔ ${recalculated.totalGrainWeightKg.toFixed(2)} кг`
    );
  }

  if (Math.abs(oldCalc.ibu - recalculated.ibu) >= 1) {
    changesSummary.push(
      `Горечь выровнена: ${oldCalc.ibu} ➔ ${recalculated.ibu} IBU (баланс BU:GU: ${recalculated.buGuRatio.toFixed(2)})`
    );
  }

  if (Math.abs(oldCalc.ebc - recalculated.ebc) >= 0.5) {
    changesSummary.push(
      `Цветность оптимизирована: ${oldCalc.ebc} ➔ ${recalculated.ebc} EBC`
    );
  }

  if (Math.abs(oldCalc.abv - recalculated.abv) >= 0.2) {
    changesSummary.push(
      `Крепость приведена к стандарту: ${oldCalc.abv}% ➔ ${recalculated.abv}% ABV`
    );
  }

  if (changesSummary.length === 0) {
    changesSummary.push(`Рецепт гармонично скорректирован под эталонные рамки стиля «${targetStyle.name}».`);
  }

  const balancedRecipe: Recipe = {
    ...recipe,
    grains: adjustedGrains,
    hops: adjustedHops,
    yeast: updatedYeast,
    calculated: recalculated,
    updatedAt: new Date().toISOString()
  };

  return {
    balancedRecipe,
    changesSummary
  };
}
