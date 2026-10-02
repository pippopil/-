import {
  BJCPStyle,
  CalculatedBrewParams,
  GrainItem,
  HopItem,
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
  {
    id: 'czech_pilsner',
    name: 'Чешский светлый премиум-лагер (Пилснер)',
    nameEn: 'Czech Premium Pale Lager',
    category: 'Лагеры',
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
    id: 'american_ipa',
    name: 'Американский IPA (India Pale Ale)',
    nameEn: 'American IPA',
    category: 'Эли / Хмелевые',
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
    id: 'neipa_juicy',
    name: 'Новоанглийский IPA (NEIPA / Hazy IPA)',
    nameEn: 'New England / Hazy IPA',
    category: 'Эли / Хмелевые',
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
    id: 'american_pale_ale',
    name: 'Американский бледный эль (APA)',
    nameEn: 'American Pale Ale',
    category: 'Эли / Хмелевые',
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
    id: 'weizen',
    name: 'Баварский вайцен (Пшеничное пиво)',
    nameEn: 'Weissbier / Hefeweizen',
    category: 'Пшеничное',
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
    id: 'oatmeal_stout',
    name: 'Овсяный стаут (Oatmeal Stout)',
    nameEn: 'Oatmeal Stout',
    category: 'Темные эли / Портеры',
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
    id: 'imperial_stout',
    name: 'Русский имперский стаут (RIS)',
    nameEn: 'Russian Imperial Stout',
    category: 'Темные эли / Крепкие',
    ogRange: [1.075, 1.115],
    fgRange: [1.018, 1.030],
    abvRange: [8.0, 12.0],
    ibuRange: [50, 90],
    ebcRange: [60, 100],
    buGuRatioRange: [0.65, 0.95],
    description: 'Мощный, интенсивный черный эль с глубокими оттенками темного шоколада, эспрессо, чернослива и изюма с согревающим алкоголем.',
    mashProfilePreset: 'Длительное затирание: 66-67°C (90 мин), кипячение 90-120 минут для карамелизации сусла.'
  },
  {
    id: 'belgian_tripel',
    name: 'Бельгийский трипель (Belgian Tripel)',
    nameEn: 'Belgian Tripel',
    category: 'Бельгийские эли',
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
    id: 'english_porter',
    name: 'Английский портер (Brown Porter)',
    nameEn: 'English Porter',
    category: 'Темные эли / Портеры',
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
    id: 'witbier',
    name: 'Бланш / Бельгийский витбир (Witbier)',
    nameEn: 'Belgian Witbier',
    category: 'Пшеничное',
    ogRange: [1.044, 1.052],
    fgRange: [1.008, 1.012],
    abvRange: [4.5, 5.5],
    ibuRange: [10, 20],
    ebcRange: [4, 8],
    buGuRatioRange: [0.22, 0.40],
    description: 'Освежающий элегантный пшеничный эль с несоложеной пшеницей, кориандром и коркой горького померанца (апельсина кюрасао).',
    mashProfilePreset: 'Белковая пауза 50°C (15 мин), осахаривание 65°C (50 мин), 72°C (15 мин), мэшаут 78°C.'
  },
  {
    id: 'munich_helles',
    name: 'Мюнхенский хеллес (Munich Helles)',
    nameEn: 'Munich Helles',
    category: 'Лагеры',
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
    id: 'saison',
    name: 'Сэзон / Фермерский эль (Saison)',
    nameEn: 'Saison / Farmhouse Ale',
    category: 'Бельгийские эли',
    ogRange: [1.048, 1.065],
    fgRange: [1.002, 1.008],
    abvRange: [5.0, 7.0],
    ibuRange: [20, 35],
    ebcRange: [10, 22],
    buGuRatioRange: [0.40, 0.60],
    description: 'Высокосброженный, сухой и шипучий бельгийский фермерский эль с пряными, перечными и цитрусовыми нотами, сбраживаемый при повышенных температурах.',
    mashProfilePreset: 'Очень низкая пауза 62-63°C (75 мин) для максимального образования мальтозы, 78°C мэшаут.'
  },
  {
    id: 'gose_sour',
    name: 'Гозе с солью и кориандром (Gose)',
    nameEn: 'Gose',
    category: 'Кислые эли',
    ogRange: [1.036, 1.048],
    fgRange: [1.006, 1.010],
    abvRange: [4.2, 4.8],
    ibuRange: [5, 12],
    ebcRange: [6, 10],
    buGuRatioRange: [0.15, 0.28],
    description: 'Освежающий кислый пшеничный эль исторического немецкого стиля с добавлением морской соли и зерен кориандра. Метод Kettle Sour (лактобактерии).',
    mashProfilePreset: 'Затирание 65°C (60 мин), закисление сусла лактобактериями в котле до pH 3.3-3.6, затем кипячение.'
  }
];

/**
 * Валидация сбалансированности рецепта по выбранному стилю BJCP
 */
export function validateRecipeAgainstStyle(
  calc: CalculatedBrewParams,
  styleIdOrName: string
): StyleValidation {
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
      balanceVerdict: 'Свободный крафтовый стиль. Параметры гармоничны.',
      recommendations: ['Рецепт не привязан к жесткому стилю BJCP. Ограничений нет.']
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
