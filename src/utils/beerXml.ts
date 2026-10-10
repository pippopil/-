import { GrainItem, HopItem, MashRest, OtherIngredientItem, Recipe, Yeast } from '../types/brewing';
import { calculateBrewMetrics } from './brewingMath';

/**
 * Экспорт рецепта в стандартный формат BeerXML 1.0
 */
export function exportToBeerXml(recipe: Recipe): string {
  const grainNodes = recipe.grains.map(g => `
    <FERMENTABLE>
      <NAME>${escapeXml(g.name)}</NAME>
      <VERSION>1</VERSION>
      <TYPE>${g.type === 'wheat' ? 'Grain' : g.type === 'adjunct' ? 'Adjunct' : 'Grain'}</TYPE>
      <AMOUNT>${g.weightKg.toFixed(3)}</AMOUNT>
      <YIELD>${((g.potentialSg - 1.0) / 0.046 * 100).toFixed(1)}</YIELD>
      <COLOR>${(g.colorEbc / 1.97).toFixed(1)}</COLOR>
    </FERMENTABLE>`).join('');

  const hopNodes = recipe.hops.map(h => `
    <HOP>
      <NAME>${escapeXml(h.name)}</NAME>
      <VERSION>1</VERSION>
      <ALPHA>${h.alphaAcid.toFixed(1)}</ALPHA>
      <AMOUNT>${(h.weightG / 1000).toFixed(4)}</AMOUNT>
      <USE>${h.use === 'dry_hop' ? 'Dry Hop' : h.use === 'whirlpool' ? 'Aroma' : 'Boil'}</USE>
      <TIME>${h.boilTimeMin}</TIME>
    </HOP>`).join('');

  const mashSteps = recipe.mashSchedule.map((step, idx) => `
      <MASH_STEP>
        <NAME>${escapeXml(step.name)}</NAME>
        <VERSION>1</VERSION>
        <TYPE>Temperature</TYPE>
        <STEP_TEMP>${step.tempC}</STEP_TEMP>
        <STEP_TIME>${step.timeMin}</STEP_TIME>
        <RAMP_TIME>2</RAMP_TIME>
        <END_TEMP>${step.tempC}</END_TEMP>
      </MASH_STEP>`).join('');

  const miscNodes = (recipe.otherIngredients || []).map(m => `
      <MISC>
        <NAME>${escapeXml(m.name)}</NAME>
        <VERSION>1</VERSION>
        <TYPE>${m.type === 'fining' ? 'Fining' : m.type === 'spice' ? 'Spice' : m.type === 'water_agent' ? 'Water Agent' : m.type === 'herb' ? 'Herb' : m.type === 'flavor' ? 'Flavor' : 'Other'}</TYPE>
        <USE>${m.stage === 'mash' ? 'Mash' : m.stage === 'primary' ? 'Primary' : m.stage === 'secondary' ? 'Secondary' : m.stage === 'bottling' ? 'Bottling' : 'Boil'}</USE>
        <TIME>${m.timeMinOrDays || 10}</TIME>
        <AMOUNT>${m.unit === 'g' || m.unit === 'ml' ? (m.amount / 1000).toFixed(4) : m.amount.toFixed(4)}</AMOUNT>
        <AMOUNT_IS_WEIGHT>${m.unit === 'ml' ? 'FALSE' : 'TRUE'}</AMOUNT_IS_WEIGHT>
        <NOTES>${escapeXml(m.notes || '')}</NOTES>
      </MISC>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<RECIPES>
  <RECIPE>
    <NAME>${escapeXml(recipe.name)}</NAME>
    <VERSION>1</VERSION>
    <TYPE>All Grain</TYPE>
    <STYLE>
      <NAME>${escapeXml(recipe.style)}</NAME>
      <CATEGORY>${escapeXml(recipe.category)}</CATEGORY>
      <VERSION>1</VERSION>
      <CATEGORY_NUMBER>1</CATEGORY_NUMBER>
      <STYLE_LETTER>A</STYLE_LETTER>
      <STYLE_GUIDE>BJCP 2021</STYLE_GUIDE>
      <TYPE>Ale</TYPE>
    </STYLE>
    <BREWER>${escapeXml(recipe.author || 'Homebrewer')}</BREWER>
    <BATCH_SIZE>${recipe.batchSizeL.toFixed(1)}</BATCH_SIZE>
    <BOIL_SIZE>${(recipe.batchSizeL * 1.15).toFixed(1)}</BOIL_SIZE>
    <BOIL_TIME>${recipe.boilTimeMin}</BOIL_TIME>
    <EFFICIENCY>${recipe.efficiencyPercent}</EFFICIENCY>
    <EST_OG>${recipe.calculated.ogSg.toFixed(3)}</EST_OG>
    <EST_FG>${recipe.calculated.fgSg.toFixed(3)}</EST_FG>
    <EST_ABV>${recipe.calculated.abv.toFixed(1)}</EST_ABV>
    <IBU>${recipe.calculated.ibu}</IBU>
    <EST_COLOR>${(recipe.calculated.ebc / 1.97).toFixed(1)}</EST_COLOR>
    <FERMENTABLES>${grainNodes}
    </FERMENTABLES>
    <HOPS>${hopNodes}
    </HOPS>
    <MISCS>${miscNodes}
    </MISCS>
    <YEASTS>
      <YEAST>
        <NAME>${escapeXml(recipe.yeast.name)}</NAME>
        <VERSION>1</VERSION>
        <TYPE>${recipe.yeast.type === 'lager' ? 'Lager' : 'Ale'}</TYPE>
        <FORM>${recipe.yeast.form === 'liquid' ? 'Liquid' : 'Dry'}</FORM>
        <LABORATORY>${escapeXml(recipe.yeast.lab)}</LABORATORY>
        <ATTENUATION>${recipe.yeast.attenuationPercent}</ATTENUATION>
      </YEAST>
    </YEASTS>
    <MASH>
      <NAME>Standard Infusion</NAME>
      <VERSION>1</VERSION>
      <GRAIN_TEMP>${recipe.grainTempC}</GRAIN_TEMP>
      <MASH_STEPS>${mashSteps}
      </MASH_STEPS>
    </MASH>
    <NOTES>${escapeXml(recipe.description || '')}</NOTES>
  </RECIPE>
</RECIPES>`;
}

/**
 * Импорт рецепта из файла BeerXML 1.0
 */
export function importFromBeerXml(xmlString: string): Recipe | null {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

    const recipeEl = xmlDoc.querySelector('RECIPE');
    if (!recipeEl) return null;

    const name = recipeEl.querySelector('NAME')?.textContent?.trim() || 'Импортированный рецепт';
    const style = recipeEl.querySelector('STYLE > NAME')?.textContent?.trim() || 'Пользовательский стиль';
    const category = recipeEl.querySelector('STYLE > CATEGORY')?.textContent?.trim() || 'Крафт';
    const batchSizeL = parseFloat(recipeEl.querySelector('BATCH_SIZE')?.textContent || '30.0');
    const boilTimeMin = parseInt(recipeEl.querySelector('BOIL_TIME')?.textContent || '60', 10);
    const efficiencyPercent = parseFloat(recipeEl.querySelector('EFFICIENCY')?.textContent || '72.0');
    const description = recipeEl.querySelector('NOTES')?.textContent?.trim() || '';

    // Парсинг солодов
    const grains: GrainItem[] = [];
    const fermentables = recipeEl.querySelectorAll('FERMENTABLE');
    fermentables.forEach((f, idx) => {
      const gName = f.querySelector('NAME')?.textContent?.trim() || `Солод ${idx + 1}`;
      const amountKg = parseFloat(f.querySelector('AMOUNT')?.textContent || '1.0');
      const colorLovibond = parseFloat(f.querySelector('COLOR')?.textContent || '3.0');
      const yieldPercent = parseFloat(f.querySelector('YIELD')?.textContent || '75.0');
      const potentialSg = 1.0 + (yieldPercent / 100) * 0.046;

      let gType: GrainItem['type'] = 'base';
      const lower = gName.toLowerCase();
      if (lower.includes('cara') || lower.includes('карамель') || lower.includes('crystal')) gType = 'caramel';
      else if (lower.includes('choco') || lower.includes('roast') || lower.includes('жжен') || lower.includes('black')) gType = 'roasted';
      else if (lower.includes('wheat') || lower.includes('пшенич')) gType = 'wheat';
      else if (lower.includes('flake') || lower.includes('хлопь') || lower.includes('oat')) gType = 'adjunct';

      grains.push({
        id: `grain_imp_${idx}_${Date.now()}`,
        name: gName,
        weightKg: Number(amountKg.toFixed(2)),
        potentialSg: Number(potentialSg.toFixed(3)),
        colorEbc: Number((colorLovibond * 1.97).toFixed(1)),
        type: gType
      });
    });

    // Парсинг хмелей
    const hops: HopItem[] = [];
    const hopEls = recipeEl.querySelectorAll('HOP');
    hopEls.forEach((h, idx) => {
      const hName = h.querySelector('NAME')?.textContent?.trim() || `Хмель ${idx + 1}`;
      const amountKg = parseFloat(h.querySelector('AMOUNT')?.textContent || '0.02');
      const alpha = parseFloat(h.querySelector('ALPHA')?.textContent || '8.0');
      const time = parseInt(h.querySelector('TIME')?.textContent || '60', 10);
      const useStr = h.querySelector('USE')?.textContent?.toLowerCase() || 'boil';

      let use: HopItem['use'] = 'boil';
      if (useStr.includes('dry')) use = 'dry_hop';
      else if (useStr.includes('aroma') || time === 0) use = 'whirlpool';

      hops.push({
        id: `hop_imp_${idx}_${Date.now()}`,
        name: hName,
        weightG: Number((amountKg * 1000).toFixed(1)),
        alphaAcid: alpha,
        boilTimeMin: time,
        use
      });
    });

    // Парсинг пауз
    const mashSchedule: MashRest[] = [];
    const mashStepEls = recipeEl.querySelectorAll('MASH_STEP');
    mashStepEls.forEach((step, idx) => {
      const sName = step.querySelector('NAME')?.textContent?.trim() || `Пауза ${idx + 1}`;
      const tempC = parseFloat(step.querySelector('STEP_TEMP')?.textContent || '65.0');
      const timeMin = parseInt(step.querySelector('STEP_TIME')?.textContent || '45', 10);

      mashSchedule.push({
        id: `rest_imp_${idx}_${Date.now()}`,
        name: sName,
        tempC,
        timeMin,
        type: 'custom'
      });
    });

    if (mashSchedule.length === 0) {
      mashSchedule.push(
        { id: 'm1', name: 'Осахаривание (Мальтозная)', tempC: 65, timeMin: 60, type: 'maltose' },
        { id: 'm2', name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout' }
      );
    }

    // Дрожжи
    const yeastName = recipeEl.querySelector('YEAST > NAME')?.textContent?.trim() || 'Fermentis SafAle US-05';
    const yeastLab = recipeEl.querySelector('YEAST > LABORATORY')?.textContent?.trim() || 'Fermentis';
    const yeastAttenuation = parseFloat(recipeEl.querySelector('YEAST > ATTENUATION')?.textContent || '78.0');

    const yeast: Yeast = {
      name: yeastName,
      lab: yeastLab,
      form: 'dry',
      type: yeastName.toLowerCase().includes('lager') ? 'lager' : 'ale',
      cellsPerGramOrVial: 20,
      attenuationPercent: yeastAttenuation,
      tempRange: [18, 22]
    };

    // Парсинг дополнительных ингредиентов (MISC)
    const otherIngredients: OtherIngredientItem[] = [];
    const miscEls = recipeEl.querySelectorAll('MISC');
    miscEls.forEach((mEl, idx) => {
      const mName = mEl.querySelector('NAME')?.textContent?.trim() || `Добавка ${idx + 1}`;
      const mAmountKg = parseFloat(mEl.querySelector('AMOUNT')?.textContent || '0.01');
      const mUse = mEl.querySelector('USE')?.textContent?.trim().toLowerCase() || 'boil';
      const mTime = parseFloat(mEl.querySelector('TIME')?.textContent || '10');
      const mType = mEl.querySelector('TYPE')?.textContent?.trim().toLowerCase() || 'other';

      let stage: OtherIngredientItem['stage'] = 'boil';
      if (mUse.includes('mash')) stage = 'mash';
      else if (mUse.includes('primary')) stage = 'primary';
      else if (mUse.includes('secondary')) stage = 'secondary';
      else if (mUse.includes('bottling')) stage = 'bottling';

      let itype: OtherIngredientItem['type'] = 'other';
      if (mType.includes('fining')) itype = 'fining';
      else if (mType.includes('spice')) itype = 'spice';
      else if (mType.includes('herb')) itype = 'herb';
      else if (mType.includes('water')) itype = 'water_agent';
      else if (mType.includes('flavor')) itype = 'flavor';
      else if (mType.includes('sugar')) itype = 'sugar';

      otherIngredients.push({
        id: `imp_misc_${idx}_${Date.now()}`,
        name: mName,
        amount: mAmountKg < 0.1 ? Math.round(mAmountKg * 1000) : Number(mAmountKg.toFixed(2)),
        unit: mAmountKg < 0.1 ? 'g' : 'kg',
        stage,
        timeMinOrDays: mTime,
        type: itype
      });
    });

    const calculated = calculateBrewMetrics({
      batchSizeL: batchSizeL > 0 ? batchSizeL : 30,
      boilTimeMin: boilTimeMin > 0 ? boilTimeMin : 60,
      efficiencyPercent: efficiencyPercent > 0 ? efficiencyPercent : 72,
      grainRatioLPerKg: 3.5,
      grainTempC: 20,
      targetCarbonationVol: 2.4,
      beerTempAtBottlingC: 20,
      grains: grains.length > 0 ? grains : [
        { id: 'def_pils', name: 'Pilsner Malt', weightKg: 4.5, potentialSg: 1.037, colorEbc: 3.5, type: 'base' }
      ],
      hops: hops.length > 0 ? hops : [
        { id: 'def_hop', name: 'Cascade', weightG: 30, alphaAcid: 6.0, boilTimeMin: 60, use: 'boil' }
      ],
      yeast,
      otherIngredients
    });

    return {
      id: `recipe_imported_${Date.now()}`,
      name,
      style,
      category,
      description,
      author: 'Импортировано',
      batchSizeL: batchSizeL > 0 ? batchSizeL : 30,
      boilTimeMin: boilTimeMin > 0 ? boilTimeMin : 60,
      efficiencyPercent: efficiencyPercent > 0 ? efficiencyPercent : 72,
      grainRatioLPerKg: 3.5,
      grainTempC: 20,
      targetCarbonationVol: 2.4,
      beerTempAtBottlingC: 20,
      grains: grains.length > 0 ? grains : [
        { id: 'def_pils', name: 'Pilsner Malt', weightKg: 4.5, potentialSg: 1.037, colorEbc: 3.5, type: 'base' }
      ],
      hops: hops.length > 0 ? hops : [
        { id: 'def_hop', name: 'Cascade', weightG: 30, alphaAcid: 6.0, boilTimeMin: 60, use: 'boil' }
      ],
      mashSchedule,
      yeast,
      otherIngredients,
      calculated,
      tags: ['BeerXML', 'Импорт'],
      isCustom: true,
      collection: 'my_recipes',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  } catch (err) {
    console.error('Failed to parse BeerXML:', err);
    return null;
  }
}

function escapeXml(unsafe: string): string {
  return (unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
