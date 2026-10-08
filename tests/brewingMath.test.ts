import { describe, it, expect } from 'vitest';
import {
  sgToPlato,
  platoToSg,
  ebcToHex,
  calculateBrewMetrics,
  validateRecipeAgainstStyle,
  balanceRecipeForStyle
} from '../src/utils/brewingMath';
import { GrainItem, HopItem, Recipe, Yeast } from '../src/types/brewing';

describe('Brewing Math Unit Tests (Калькулятор МастерВарка)', () => {
  describe('Конвертация плотности (Plato / SG)', () => {
    it('sgToPlato корректно переводит 1.048-1.050 SG в ~12 °P', () => {
      const plato = sgToPlato(1.048);
      expect(plato).toBeGreaterThanOrEqual(11.8);
      expect(plato).toBeLessThanOrEqual(12.2);
    });

    it('sgToPlato возвращает 0 при воде (SG <= 1.000)', () => {
      expect(sgToPlato(1.000)).toBe(0);
      expect(sgToPlato(0.999)).toBe(0);
    });

    it('platoToSg корректно переводит 12 °P в ~1.048 SG', () => {
      const sg = platoToSg(12);
      expect(sg).toBeCloseTo(1.048, 2);
    });

    it('platoToSg возвращает 1.000 при 0 °P', () => {
      expect(platoToSg(0)).toBe(1.000);
    });
  });

  describe('Цветность пива (EBC -> HEX)', () => {
    it('возвращает светлый соломенный оттенок для Pilsner (EBC <= 3.9)', () => {
      const hex = ebcToHex(3);
      expect(hex).toBe('#F8F17A');
    });

    it('возвращает янтарный оттенок для Amber Ale (EBC ~15-20)', () => {
      const hex = ebcToHex(18);
      expect(hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(hex).toBe('#B95813');
    });

    it('возвращает почти черный цвет для Stout (EBC > 70)', () => {
      const hex = ebcToHex(80);
      expect(hex).toBe('#120301');
    });
  });

  describe('calculateBrewMetrics (Полный расчет варки)', () => {
    const sampleGrains: GrainItem[] = [
      {
        id: 'g1',
        name: 'Курский Пилснер',
        weightKg: 5.0,
        potentialSg: 1.037,
        colorEbc: 3.8,
        type: 'base'
      }
    ];

    const sampleHops: HopItem[] = [
      {
        id: 'h1',
        name: 'Магнум',
        weightG: 25,
        alphaAcid: 12.0,
        boilTimeMin: 60,
        use: 'boil'
      }
    ];

    const sampleYeast: Yeast = {
      name: 'US-05 SafAle',
      lab: 'Fermentis',
      form: 'dry',
      type: 'ale',
      cellsPerGramOrVial: 20,
      attenuationPercent: 80,
      tempRange: [18, 22]
    };

    it('корректно рассчитывает OG, FG, ABV, IBU и водный баланс партии', () => {
      const result = calculateBrewMetrics({
        batchSizeL: 20,
        boilTimeMin: 60,
        efficiencyPercent: 75,
        grainRatioLPerKg: 3.5,
        grainTempC: 20,
        targetCarbonationVol: 2.4,
        beerTempAtBottlingC: 20,
        grains: sampleGrains,
        hops: sampleHops,
        yeast: sampleYeast
      });

      // Начальная плотность 5 кг солода на 20 л при 75% эффективности ~1.050 - 1.055
      expect(result.ogSg).toBeGreaterThan(1.045);
      expect(result.ogSg).toBeLessThan(1.060);
      expect(result.ogPlato).toBeGreaterThan(11);

      // Конечная плотность при 80% сбраживании ~1.010
      expect(result.fgSg).toBeLessThan(result.ogSg);
      expect(result.fgSg).toBeGreaterThan(1.005);

      // Крепость (ABV) должна быть в диапазоне 4.5% - 6.5%
      expect(result.abv).toBeGreaterThan(4.5);
      expect(result.abv).toBeLessThan(6.5);

      // Горечь от 25г Магнума (12% альфа) на 60 мин в 20 л сусла ~30-45 IBU
      expect(result.ibu).toBeGreaterThan(25);
      expect(result.ibu).toBeLessThan(50);

      // Объемы воды: заторная вода = 5кг * 3.5 = 17.5л
      expect(result.strikeWaterL).toBeCloseTo(17.5, 1);
      // Промывочная вода должна быть положительной
      expect(result.spargeWaterL).toBeGreaterThan(5);
      // Температура заторной воды выше 65°C для попадания в паузу 67°C
      expect(result.strikeTempC).toBeGreaterThan(67);
    });
  });

  describe('balanceRecipeForStyle (Балансировка рецепта под стиль в 1 клик)', () => {
    it('корректирует рецепт с заниженной плотностью и горечью под Чешский Пилснер', () => {
      // Исходный рецепт: плотность всего ~1.025, горечь 4 IBU (явные замечания для Пилснера)
      const weakGrains: GrainItem[] = [
        { id: 'g1', name: 'Pilsner Malt', weightKg: 2.2, potentialSg: 1.037, colorEbc: 3.5, type: 'base' }
      ];
      const weakHops: HopItem[] = [
        { id: 'h1', name: 'Saaz', weightG: 10, alphaAcid: 3.5, boilTimeMin: 15, use: 'boil' }
      ];
      const yeast: Yeast = {
        name: 'Saflager W-34/70',
        lab: 'Fermentis',
        form: 'dry',
        type: 'lager',
        cellsPerGramOrVial: 20,
        attenuationPercent: 78,
        tempRange: [10, 14]
      };

      const initialCalc = calculateBrewMetrics({
        batchSizeL: 20,
        boilTimeMin: 60,
        efficiencyPercent: 75,
        grainRatioLPerKg: 3.5,
        grainTempC: 20,
        targetCarbonationVol: 2.4,
        beerTempAtBottlingC: 12,
        grains: weakGrains,
        hops: weakHops,
        yeast
      });

      const unbalanceRecipe: Recipe = {
        id: 'test_pils',
        name: 'Тестовый слабый пилс',
        style: 'Чешский светлый премиум-лагер (Пилснер)',
        category: 'Лагеры',
        tags: ['Лагер', 'Пилснер'],
        description: 'Слабый рецепт с замечаниями',
        author: 'Тестер',
        batchSizeL: 20,
        boilTimeMin: 60,
        efficiencyPercent: 75,
        grainRatioLPerKg: 3.5,
        grainTempC: 20,
        targetCarbonationVol: 2.4,
        beerTempAtBottlingC: 12,
        grains: weakGrains,
        hops: weakHops,
        mashSchedule: [],
        yeast,
        calculated: initialCalc,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Проверяем, что до балансировки есть замечания
      const beforeValidation = validateRecipeAgainstStyle(unbalanceRecipe.calculated, unbalanceRecipe.style);
      expect(beforeValidation.isCompliant).toBe(false);
      expect(beforeValidation.recommendations.length).toBeGreaterThan(0);

      // Выполняем авто-балансировку в 1 клик
      const { balancedRecipe, changesSummary } = balanceRecipeForStyle(unbalanceRecipe);

      // Проверяем результат
      expect(changesSummary.length).toBeGreaterThan(0);
      const afterValidation = validateRecipeAgainstStyle(balancedRecipe.calculated, balancedRecipe.style);
      expect(afterValidation.isCompliant).toBe(true);
      expect(balancedRecipe.calculated.ogSg).toBeGreaterThanOrEqual(1.044);
      expect(balancedRecipe.calculated.ogSg).toBeLessThanOrEqual(1.060);
      expect(balancedRecipe.calculated.ibu).toBeGreaterThanOrEqual(30);
      expect(balancedRecipe.calculated.ibu).toBeLessThanOrEqual(45);
      expect(balancedRecipe.calculated.ebc).toBeGreaterThanOrEqual(7);
      expect(balancedRecipe.calculated.ebc).toBeLessThanOrEqual(14);
    });

    it('корректирует рецепт овсяного стаута, добавляя цвет и поднимая плотность/горечь', () => {
      // Исходный рецепт: светлый солод, цвет всего ~6 EBC, стиль Овсяный стаут требует от 45 до 80 EBC
      const paleGrains: GrainItem[] = [
        { id: 'g1', name: 'Pale Ale Malt', weightKg: 3.0, potentialSg: 1.038, colorEbc: 5.5, type: 'base' }
      ];
      const hops: HopItem[] = [
        { id: 'h1', name: 'Fuggle', weightG: 15, alphaAcid: 4.5, boilTimeMin: 60, use: 'boil' }
      ];
      const yeast: Yeast = {
        name: 'US-05 SafAle',
        lab: 'Fermentis',
        form: 'dry',
        type: 'ale',
        cellsPerGramOrVial: 20,
        attenuationPercent: 75,
        tempRange: [18, 22]
      };

      const initialCalc = calculateBrewMetrics({
        batchSizeL: 20,
        boilTimeMin: 60,
        efficiencyPercent: 75,
        grainRatioLPerKg: 3.5,
        grainTempC: 20,
        targetCarbonationVol: 2.0,
        beerTempAtBottlingC: 18,
        grains: paleGrains,
        hops,
        yeast
      });

      const unbalanceRecipe: Recipe = {
        id: 'test_stout',
        name: 'Светлый недо-стаут',
        style: 'Овсяный стаут (Oatmeal Stout)',
        category: 'Стауты',
        tags: ['Стаут', 'Овсяный'],
        description: 'Стаут без темных солодов',
        author: 'Тестер',
        batchSizeL: 20,
        boilTimeMin: 60,
        efficiencyPercent: 75,
        grainRatioLPerKg: 3.5,
        grainTempC: 20,
        targetCarbonationVol: 2.0,
        beerTempAtBottlingC: 18,
        grains: paleGrains,
        hops,
        mashSchedule: [],
        yeast,
        calculated: initialCalc,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const beforeValidation = validateRecipeAgainstStyle(unbalanceRecipe.calculated, unbalanceRecipe.style);
      expect(beforeValidation.isCompliant).toBe(false);

      const { balancedRecipe } = balanceRecipeForStyle(unbalanceRecipe);
      const afterValidation = validateRecipeAgainstStyle(balancedRecipe.calculated, balancedRecipe.style);

      expect(afterValidation.isCompliant).toBe(true);
      expect(balancedRecipe.calculated.ebc).toBeGreaterThanOrEqual(45);
      expect(balancedRecipe.calculated.ogSg).toBeGreaterThanOrEqual(1.045);
      expect(balancedRecipe.calculated.ibu).toBeGreaterThanOrEqual(25);
    });

    it('балансирует пустой шаблон рецепта (0 солодов, 0 хмелей) под Немецкий Пилс', () => {
      const emptyRecipe: Recipe = {
        id: 'test_empty',
        name: 'Пустой рецепт',
        style: 'Немецкий пилс (German Pils)',
        category: 'Лагеры',
        tags: ['Лагер', 'Пилс'],
        description: '',
        author: 'Тестер',
        batchSizeL: 20,
        boilTimeMin: 60,
        efficiencyPercent: 75,
        grainRatioLPerKg: 3.5,
        grainTempC: 20,
        targetCarbonationVol: 2.4,
        beerTempAtBottlingC: 12,
        grains: [],
        hops: [],
        mashSchedule: [],
        yeast: {
          name: 'US-05',
          lab: 'Fermentis',
          form: 'dry',
          type: 'ale',
          cellsPerGramOrVial: 20,
          attenuationPercent: 75,
          tempRange: [18, 22]
        },
        calculated: calculateBrewMetrics({
          batchSizeL: 20,
          boilTimeMin: 60,
          efficiencyPercent: 75,
          grainRatioLPerKg: 3.5,
          grainTempC: 20,
          targetCarbonationVol: 2.4,
          beerTempAtBottlingC: 12,
          grains: [],
          hops: [],
          yeast: {
            name: 'US-05',
            lab: 'Fermentis',
            form: 'dry',
            type: 'ale',
            cellsPerGramOrVial: 20,
            attenuationPercent: 75,
            tempRange: [18, 22]
          }
        }),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const { balancedRecipe } = balanceRecipeForStyle(emptyRecipe);
      expect(balancedRecipe.grains.length).toBeGreaterThan(0);
      expect(balancedRecipe.hops.length).toBeGreaterThan(0);
      expect(balancedRecipe.yeast.type).toBe('lager');
      const validation = validateRecipeAgainstStyle(balancedRecipe.calculated, balancedRecipe.style);
      expect(validation.isCompliant).toBe(true);
    });

    it('позволяет авто-балансировать только зерно (плотность) без изменения хмеля', () => {
      const originalHops: HopItem[] = [
        { id: 'h1', name: 'Saaz', weightG: 33, alphaAcid: 3.8, boilTimeMin: 60, use: 'boil' }
      ];
      const undergravityGrains: GrainItem[] = [
        { id: 'g1', name: 'Pilsner', weightKg: 2.0, potentialSg: 1.037, colorEbc: 3.5, type: 'base' }
      ];

      const recipe: Recipe = {
        id: 'r_grains_only',
        name: 'Низкая плотность',
        style: 'Немецкий пилс (German Pils)',
        category: 'Лагеры',
        tags: [],
        description: '',
        author: 'Тестер',
        batchSizeL: 20,
        boilTimeMin: 60,
        efficiencyPercent: 75,
        grainRatioLPerKg: 3.5,
        grainTempC: 20,
        targetCarbonationVol: 2.4,
        beerTempAtBottlingC: 12,
        grains: undergravityGrains,
        hops: originalHops,
        mashSchedule: [],
        yeast: {
          name: 'W-34/70',
          lab: 'Fermentis',
          form: 'dry',
          type: 'lager',
          cellsPerGramOrVial: 20,
          attenuationPercent: 78,
          tempRange: [10, 14]
        },
        calculated: calculateBrewMetrics({
          batchSizeL: 20,
          boilTimeMin: 60,
          efficiencyPercent: 75,
          grainRatioLPerKg: 3.5,
          grainTempC: 20,
          targetCarbonationVol: 2.4,
          beerTempAtBottlingC: 12,
          grains: undergravityGrains,
          hops: originalHops,
          yeast: {
            name: 'W-34/70',
            lab: 'Fermentis',
            form: 'dry',
            type: 'lager',
            cellsPerGramOrVial: 20,
            attenuationPercent: 78,
            tempRange: [10, 14]
          }
        }),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const { balancedRecipe, changesSummary } = balanceRecipeForStyle(recipe, {
        balanceGrains: true,
        balanceHops: false,
        balanceYeast: false
      });

      // Вес зерна увеличился для достижения нужной НП
      expect(balancedRecipe.calculated.ogSg).toBeGreaterThanOrEqual(1.044);
      expect(balancedRecipe.calculated.ogSg).toBeLessThanOrEqual(1.050);
      // Хмель не изменился
      expect(balancedRecipe.hops[0].weightG).toBe(33);
      expect(changesSummary.some(s => s.includes('НП (OG)'))).toBe(true);
    });

    it('позволяет авто-балансировать только хмель (горечь) без изменения засыпи', () => {
      const originalGrains: GrainItem[] = [
        { id: 'g1', name: 'Pilsner', weightKg: 4.8, potentialSg: 1.037, colorEbc: 3.5, type: 'base' }
      ];
      const underbitterHops: HopItem[] = [
        { id: 'h1', name: 'Saaz', weightG: 5, alphaAcid: 3.8, boilTimeMin: 60, use: 'boil' }
      ];

      const recipe: Recipe = {
        id: 'r_hops_only',
        name: 'Низкая горечь',
        style: 'Чешский светлый премиум лагер (Czech Premium Pale Lager)',
        category: 'Лагеры',
        tags: [],
        description: '',
        author: 'Тестер',
        batchSizeL: 20,
        boilTimeMin: 60,
        efficiencyPercent: 75,
        grainRatioLPerKg: 3.5,
        grainTempC: 20,
        targetCarbonationVol: 2.4,
        beerTempAtBottlingC: 12,
        grains: originalGrains,
        hops: underbitterHops,
        mashSchedule: [],
        yeast: {
          name: 'W-34/70',
          lab: 'Fermentis',
          form: 'dry',
          type: 'lager',
          cellsPerGramOrVial: 20,
          attenuationPercent: 78,
          tempRange: [10, 14]
        },
        calculated: calculateBrewMetrics({
          batchSizeL: 20,
          boilTimeMin: 60,
          efficiencyPercent: 75,
          grainRatioLPerKg: 3.5,
          grainTempC: 20,
          targetCarbonationVol: 2.4,
          beerTempAtBottlingC: 12,
          grains: originalGrains,
          hops: underbitterHops,
          yeast: {
            name: 'W-34/70',
            lab: 'Fermentis',
            form: 'dry',
            type: 'lager',
            cellsPerGramOrVial: 20,
            attenuationPercent: 78,
            tempRange: [10, 14]
          }
        }),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const { balancedRecipe, changesSummary } = balanceRecipeForStyle(recipe, {
        balanceGrains: false,
        balanceHops: true,
        balanceYeast: false
      });

      // Хмель скорректирован для попадания в диапазон 30-45 IBU
      expect(balancedRecipe.calculated.ibu).toBeGreaterThanOrEqual(30);
      expect(balancedRecipe.calculated.ibu).toBeLessThanOrEqual(45);
      // Зерно не изменилось
      expect(balancedRecipe.grains[0].weightKg).toBe(4.8);
      expect(changesSummary.some(s => s.includes('Горечь'))).toBe(true);
    });
  });

  describe('Kursk malt substitutions & type corrections', () => {
    it('correctly maps specialty and caramel malts without confusing them with base malts', async () => {
      const { getKurskMaltSubstitute, normalizeGrain, isKurskMalt } = await import('../src/utils/brewingSubstitutions');

      // 1. Carapils / Карапилс must map to caramel/dessert malt, NEVER to base Pilsner
      const carapilsSub = getKurskMaltSubstitute('Carapils / Carafoam (Карапилс для пены)', 'caramel', 4.5);
      expect(carapilsSub).not.toBeNull();
      expect(carapilsSub?.kurskName).toContain('Десертный');
      expect(carapilsSub?.type).toBe('caramel');

      // 2. Caramunich / Карамюнхен must map to Caramel 150, NEVER to base Munich
      const caramunichSub = getKurskMaltSubstitute('Caramunich II (Карамюнхен 120 EBC)', 'caramel', 120);
      expect(caramunichSub).not.toBeNull();
      expect(caramunichSub?.kurskName).toContain('Карамельный 150');
      expect(caramunichSub?.type).toBe('caramel');

      // 3. Base Munich must map to base Munich
      const munichSub = getKurskMaltSubstitute('Munich I (Мюнхенский светлый 15 EBC)', 'base', 15);
      expect(munichSub).not.toBeNull();
      expect(munichSub?.kurskName).toContain('Мюнхенский');
      expect(munichSub?.type).toBe('base');

      // 4. Base Pilsner must map to base Pilsner
      const pilsnerSub = getKurskMaltSubstitute('Pilsner Malt (Пилснер)', 'base', 3.5);
      expect(pilsnerSub).not.toBeNull();
      expect(pilsnerSub?.kurskName).toContain('Пилснер');
      expect(pilsnerSub?.type).toBe('base');

      // 5. Crystal / Chateau Crystal 150 EBC must map to Kurskiy Caramel 150 (no fake "Shato Kristall" in Kursk Malt catalog)
      const crystalSub = getKurskMaltSubstitute('Crystal 150 EBC', 'caramel', 150);
      expect(crystalSub).not.toBeNull();
      expect(crystalSub?.kurskName).toBe('Курский Карамельный 150 (Caramel 150 EBC)');
      expect(crystalSub?.type).toBe('caramel');
      expect(crystalSub?.kurskName).not.toContain('Шато');
      expect(crystalSub?.kurskName).not.toContain('по цветности');

      // 6. Flaked Barley must map to adjunct, not placeholder
      const barleySub = getKurskMaltSubstitute('Flaked Barley (Ячменные хлопья)', 'adjunct', 3.5);
      expect(barleySub).not.toBeNull();
      expect(barleySub?.type).toBe('adjunct');
      expect(barleySub?.kurskName).not.toContain('по цветности');

      // 7. isKurskMalt rejects broken placeholder and fake Shato
      expect(isKurskMalt('Курский солод (по цветности EBC)')).toBe(false);
      expect(isKurskMalt('Курский Шато Кристалл')).toBe(false);
      expect(isKurskMalt('Курский Пилснер (Pilsner Malt)')).toBe(true);
      expect(isKurskMalt('Курский Карамельный 150 (Caramel 150 EBC)')).toBe(true);

      // 8. normalizeGrain auto-heals mismatched types
      const misclassifiedPilsner = normalizeGrain({
        id: 'g1',
        name: 'Курский Пилснер (Pilsner Malt)',
        weightKg: 4.5,
        potentialSg: 1.037,
        colorEbc: 3.8,
        type: 'caramel' as any
      });
      expect(misclassifiedPilsner.type).toBe('base');

      const placeholderGrain = normalizeGrain({
        id: 'g2',
        name: 'Курский солод (по цветности EBC)',
        weightKg: 0.5,
        potentialSg: 1.037,
        colorEbc: 150,
        type: 'caramel'
      });
      expect(placeholderGrain.name).toBe('Курский Карамельный 150 (Caramel 150 EBC)');
      expect(placeholderGrain.type).toBe('caramel');
    });
  });
});
