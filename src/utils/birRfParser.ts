import { GrainItem, HopItem, MashRest, Recipe, Yeast } from '../types/brewing';
import { calculateBrewMetrics } from './brewingMath';

/**
 * Парсер рецептов с портала Бир.РФ (https://xn--90aoy.xn--p1ai / https://беер.рф)
 * Извлекает все ингредиенты, засыпь, паузы затирания, хмель и параметры варки.
 */
export function parseBirRfRecipe(html: string, sourceUrl?: string): Recipe | null {
  try {
    // 1. Название рецепта
    let name = 'Рецепт с Бир.РФ';
    const titleMatch = html.match(/<title>([^|<]+)/i);
    if (titleMatch && titleMatch[1]) {
      name = titleMatch[1].replace(/Рецепт напитка от.*$/i, '').trim();
    }

    // 2. Стиль пива
    let style = 'Крафтовый стиль';
    let category = 'Крафт';
    const styleMatch = html.match(/Стиль:.*?<[^>]*>([^<]+)</s) || html.match(/Стиль:\s*([^\n<]+)/);
    if (styleMatch && styleMatch[1]) {
      style = styleMatch[1].trim();
    }
    const catMatch = html.match(/Категория:.*?<[^>]*>([^<]+)</s) || html.match(/Категория:\s*([^\n<]+)/);
    if (catMatch && catMatch[1]) {
      category = catMatch[1].trim();
    }

    // 3. Автор рецепта
    let author = 'Пивовар с Бир.РФ';
    const authorMatch = html.match(/Добавил\(а\):<\/b>\s*<a[^>]*>([^<]+)<\/a>/i);
    if (authorMatch && authorMatch[1]) {
      author = authorMatch[1].trim();
    }

    // 4. Описание / примечание
    let description = '';
    const descMatch = html.match(/<b>Примечание:<\/b>\s*<br \/>(.*?)<br \/><br \/>\s*<b>Ингредиенты<\/b>/s);
    if (descMatch && descMatch[1]) {
      description = descMatch[1]
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, ' ')
        .trim();
    } else {
      description = `Импортировано с портала Бир.РФ (${sourceUrl || 'https://xn--90aoy.xn--p1ai'})`;
    }

    // 5. Параметры варки: объем, кипячение, эффективность
    let batchSizeL = 30.0;
    const sizeMatch = html.match(/Размер:[^0-9]*([0-9.]+)\s*л/i) || html.match(/Размер партии после кипячения:[^0-9]*([0-9.]+)\s*л/i);
    if (sizeMatch && sizeMatch[1]) {
      batchSizeL = parseFloat(sizeMatch[1]) || 30.0;
    }

    let boilTimeMin = 60;
    const boilMatch = html.match(/Время кипячения:\s*<b>([0-9]+)\s*мин/i);
    if (boilMatch && boilMatch[1]) {
      boilTimeMin = parseInt(boilMatch[1], 10) || 60;
    }

    let efficiencyPercent = 75.0;
    const effMatch = html.match(/Эффективность варки:\s*<b>([0-9.]+)\s*%/i);
    if (effMatch && effMatch[1]) {
      efficiencyPercent = parseFloat(effMatch[1]) || 75.0;
    }

    // 6. Парсинг зерновых (солодов)
    const grains: GrainItem[] = [];
    const grainBlockMatch = html.match(/Зерновые:<\/i><\/span>.*?<br \/>(.*?)(?:<span style=["']color:green["']|Всего:)/s);
    if (grainBlockMatch && grainBlockMatch[1]) {
      const grainLines = grainBlockMatch[1].split('<li>');
      grainLines.forEach((line, idx) => {
        const weightMatch = line.match(/<b>([0-9.]+)\s*кг<\/b>/i);
        const nameMatch = line.match(/<a[^>]*>([^<]+)<\/a>/);
        if (weightMatch && nameMatch) {
          const weightKg = parseFloat(weightMatch[1]);
          const grainName = nameMatch[1].trim();

          // Цветность в Lovibond или EBC
          let colorEbc = 4.0;
          const colorMatch = line.match(/цвет\s*=\s*([0-9.]+)\s*L°/i);
          if (colorMatch && colorMatch[1]) {
            colorEbc = Number((parseFloat(colorMatch[1]) * 1.97).toFixed(1));
          }

          // Определение типа солода
          let type: GrainItem['type'] = 'base';
          const lower = grainName.toLowerCase();
          if (lower.includes('cara') || lower.includes('кара') || lower.includes('crystal') || lower.includes('мелано')) {
            type = 'caramel';
          } else if (lower.includes('roasted') || lower.includes('жжен') || lower.includes('black') || lower.includes('шоколад') || lower.includes('кофе')) {
            type = 'roasted';
          } else if (lower.includes('wheat') || lower.includes('пшенич')) {
            type = 'wheat';
          } else if (lower.includes('хлопья') || lower.includes('flake') || lower.includes('овсян') || lower.includes('ячменные')) {
            type = 'adjunct';
          } else if (lower.includes('кислый') || lower.includes('acid')) {
            type = 'acid';
          }

          grains.push({
            id: `bir_grain_${idx}_${Date.now()}`,
            name: grainName,
            weightKg,
            potentialSg: type === 'roasted' ? 1.025 : 1.037,
            colorEbc,
            type
          });
        }
      });
    }

    // Если зерновые не найдены, создаем базовый пилснер
    if (grains.length === 0) {
      grains.push({
        id: `g_fallback_${Date.now()}`,
        name: 'Pilsner Malt (Пилснер)',
        weightKg: Math.round(batchSizeL * 0.22 * 10) / 10,
        potentialSg: 1.037,
        colorEbc: 3.5,
        type: 'base'
      });
    }

    // 7. Парсинг хмеля
    const hops: HopItem[] = [];
    const hopBlockMatch = html.match(/Хмель:<\/i><\/span>.*?<br \/>(.*?)(?:<span style=["']color:green["']|Всего:)/s);
    if (hopBlockMatch && hopBlockMatch[1]) {
      const hopLines = hopBlockMatch[1].split('<li>');
      hopLines.forEach((line, idx) => {
        const weightMatch = line.match(/<b>([0-9.]+)\s*гр<\/b>/i);
        const nameMatch = line.match(/<a[^>]*>([^<]+)<\/a>/);
        if (weightMatch && nameMatch) {
          const weightG = parseFloat(weightMatch[1]);
          const hopName = nameMatch[1].trim();

          let alphaAcid = 5.0;
          const alphaMatch = line.match(/a-к\.=([0-9.]+)/i) || line.match(/альфа=([0-9.]+)/i);
          if (alphaMatch && alphaMatch[1]) {
            alphaAcid = parseFloat(alphaMatch[1]);
          }

          let boilTimeMinHop = 60;
          let use: HopItem['use'] = 'boil';
          const timeMatch = line.match(/кипятить\s*([0-9]+)\s*мин/i);
          if (timeMatch && timeMatch[1]) {
            boilTimeMinHop = parseInt(timeMatch[1], 10);
          } else if (line.toLowerCase().includes('сухое') || line.toLowerCase().includes('брожение')) {
            use = 'dry_hop';
            boilTimeMinHop = 0;
          } else if (line.toLowerCase().includes('вирпул') || line.toLowerCase().includes('аромат')) {
            use = 'whirlpool';
            boilTimeMinHop = 0;
          }

          hops.push({
            id: `bir_hop_${idx}_${Date.now()}`,
            name: hopName,
            weightG,
            alphaAcid,
            boilTimeMin: boilTimeMinHop,
            use
          });
        }
      });
    }

    if (hops.length === 0) {
      hops.push({
        id: `h_fallback_${Date.now()}`,
        name: 'Saaz (Жатецкий)',
        weightG: 30,
        alphaAcid: 3.8,
        boilTimeMin: 60,
        use: 'boil'
      });
    }

    // 8. Парсинг пауз затирания
    const mashSchedule: MashRest[] = [];
    const mashBlockMatch = html.match(/Температурные паузы:<\/i><\/span>.*?<br \/>(.*?)(?:<span style=["']color:green["']|Потребность)/s);
    if (mashBlockMatch && mashBlockMatch[1]) {
      const pauseLines = mashBlockMatch[1].split('<li>');
      pauseLines.forEach((line, idx) => {
        const pauseMatch = line.match(/([^:]+):\s*([0-9]+)\s*°С\s*-\s*([0-9]+)\s*мин/i);
        if (pauseMatch) {
          const pauseName = pauseMatch[1].trim();
          const tempC = parseFloat(pauseMatch[2]);
          const timeMin = parseInt(pauseMatch[3], 10);

          let pType: MashRest['type'] = 'custom';
          const lower = pauseName.toLowerCase();
          if (lower.includes('белк') || lower.includes('протеин')) pType = 'protein';
          else if (lower.includes('осахарив') || lower.includes('мальтоз')) pType = 'maltose';
          else if (lower.includes('декстрин')) pType = 'dextrin';
          else if (lower.includes('мэш') || lower.includes('аут')) pType = 'mashout';
          else if (lower.includes('кислот')) pType = 'acid';

          mashSchedule.push({
            id: `bir_pause_${idx}_${Date.now()}`,
            name: pauseName,
            tempC,
            timeMin,
            type: pType
          });
        }
      });
    }

    if (mashSchedule.length === 0) {
      mashSchedule.push(
        { id: 'm1', name: 'Осахаривание (Мальтозная)', tempC: 66, timeMin: 60, type: 'maltose' },
        { id: 'm2', name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout' }
      );
    }

    // 9. Дрожжи
    let yeastName = 'Fermentis SafAle US-05';
    let yeastLab = 'Fermentis';
    const yeastMatch = html.match(/Дрожжи:<\/i><\/span>.*?<a[^>]*>([^<]+)<\/a>/s);
    if (yeastMatch && yeastMatch[1]) {
      yeastName = yeastMatch[1].trim();
      if (yeastName.includes('-')) {
        yeastLab = yeastName.split('-')[0].trim();
      }
    }

    const yeast: Yeast = {
      name: yeastName,
      lab: yeastLab,
      form: 'dry',
      type: yeastName.toLowerCase().includes('лагер') || yeastName.toLowerCase().includes('lager') ? 'lager' : 'ale',
      cellsPerGramOrVial: 20,
      attenuationPercent: 78,
      tempRange: [18, 22]
    };

    // 10. Расчет характеристик
    const calculated = calculateBrewMetrics({
      batchSizeL,
      boilTimeMin,
      efficiencyPercent,
      grainRatioLPerKg: 3.5,
      grainTempC: 20,
      targetCarbonationVol: 2.4,
      beerTempAtBottlingC: 20,
      grains,
      hops,
      yeast
    });

    return {
      id: `recipe_bir_rf_${Date.now()}`,
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
      targetCarbonationVol: 2.4,
      beerTempAtBottlingC: 20,
      grains,
      hops,
      mashSchedule,
      yeast,
      calculated,
      tags: ['Бир.РФ', style, category].filter(Boolean),
      isCustom: true,
      collection: 'my_recipes',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  } catch (err) {
    console.error('Failed to parse Бир.РФ recipe:', err);
    return null;
  }
}
