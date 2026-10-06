import { describe, it, expect } from 'vitest';
import {
  sgToPlato,
  platoToSg,
  ebcToHex,
  calculateBrewMetrics
} from '../src/utils/brewingMath';
import { GrainItem, HopItem, Yeast } from '../src/types/brewing';

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
});
