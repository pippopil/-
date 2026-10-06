export type GrainType = 'base' | 'caramel' | 'roasted' | 'wheat' | 'adjunct' | 'acid';

export interface GrainItem {
  id: string;
  name: string;
  weightKg: number;
  potentialSg: number; // e.g. 1.037
  colorEbc: number;    // e.g. 4 for Pilsner, 120 for Caramunich, 1000 for Carafa
  type: GrainType;
  notes?: string;
}

export type HopUse = 'boil' | 'aroma' | 'whirlpool' | 'dry_hop';

export interface HopItem {
  id: string;
  name: string;
  weightG: number;
  alphaAcid: number;  // e.g. 12.5%
  boilTimeMin: number; // e.g. 60, 15, 0
  use: HopUse;
  notes?: string;
}

export type RestType = 'strike' | 'acid' | 'protein' | 'maltose' | 'dextrin' | 'mashout' | 'custom';

export interface MashRest {
  id: string;
  name: string;
  tempC: number;
  timeMin: number;
  type: RestType;
  description?: string;
}

export type YeastForm = 'dry' | 'liquid';
export type YeastType = 'ale' | 'lager' | 'wheat' | 'belgian' | 'kveik' | 'sour';

export interface Yeast {
  name: string;
  lab: string;
  form: YeastForm;
  type: YeastType;
  cellsPerGramOrVial: number; // млрд клеток (напр. 20 млрд/г для сухих)
  attenuationPercent: number; // напр. 75%
  tempRange: [number, number]; // [minC, maxC]
  styleDescription?: string;
}

export interface BJCPStyle {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  ogRange: [number, number];  // SG e.g. [1.045, 1.060]
  fgRange: [number, number];  // SG e.g. [1.010, 1.015]
  abvRange: [number, number]; // % e.g. [4.5, 6.2]
  ibuRange: [number, number]; // e.g. [30, 50]
  ebcRange: [number, number]; // e.g. [12, 28]
  buGuRatioRange: [number, number]; // e.g. [0.6, 0.9]
  description: string;
  mashProfilePreset: string;
}

export interface CalculatedBrewParams {
  ogSg: number;
  ogPlato: number;
  fgSg: number;
  fgPlato: number;
  abv: number;
  ibu: number;
  srm: number;
  ebc: number;
  buGuRatio: number;
  totalGrainWeightKg: number;
  strikeWaterL: number;
  spargeWaterL: number;
  totalWaterL: number;
  strikeTempC: number;
  dryYeastGramsNeeded: number;
  yeastPacksNeeded: number;
  dextroseGrams: number;
  sucroseGrams: number;
  dmeGrams: number;
  speiseMl: number;
  caloriesPer500ml: number;
}

export interface StyleValidation {
  isCompliant: boolean;
  ogStatus: 'low' | 'match' | 'high';
  fgStatus: 'low' | 'match' | 'high';
  abvStatus: 'low' | 'match' | 'high';
  ibuStatus: 'low' | 'match' | 'high';
  ebcStatus: 'low' | 'match' | 'high';
  balanceVerdict: string;
  recommendations: string[];
}

export interface LabelDesign {
  title: string;
  subtitle: string;
  style: string;
  breweryName: string;
  abv: number;
  ibu: number;
  volumeText: string;
  bottledDate: string;
  themeStyle: 'craft_modern' | 'vintage_monastery' | 'minimal_nordic' | 'retro_arcade' | 'botanical' | 'slavic_craft';
  palette: {
    background: string;
    text: string;
    accent: string;
    border: string;
  };
  artworkType: 'hop' | 'grain' | 'barrel' | 'crown' | 'mountain' | 'shield' | 'bear' | 'wolf' | 'kettle' | 'mug' | 'custom';
  storyDescription?: string;
  generatedImageBase64?: string;
  customImageUrl?: string;
}

export interface Recipe {
  id: string;
  name: string;
  style: string;
  category: string;
  description: string;
  author: string;
  batchSizeL: number;
  boilTimeMin: number;
  efficiencyPercent: number;
  grainRatioLPerKg: number; // гидромодуль (по умолч. 3.5)
  grainTempC: number;       // темп зерна (по умолч. 20)
  targetCarbonationVol: number; // объемы CO2 (по умолч. 2.4)
  beerTempAtBottlingC: number;  // темп пива при розливе (по умолч. 18-20)
  grains: GrainItem[];
  hops: HopItem[];
  mashSchedule: MashRest[];
  yeast: Yeast;
  calculated: CalculatedBrewParams;
  labelDesign?: LabelDesign;
  tags: string[];
  isCustom?: boolean;
  collection?: 'favorites' | 'planned' | 'brewed' | 'my_recipes';
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'grain' | 'hop' | 'yeast' | 'misc';
  amount: number; // кг для солода, г для хмеля, шт/пачек для дрожжей
  unit: 'kg' | 'g' | 'pack' | 'ml';
  potentialSgOrAlpha?: number;
  colorEbc?: number;
  notes?: string;
}

export interface RecipeMatchResult {
  recipe: Recipe;
  matchPercentage: number;
  isFullyMatch: boolean;
  availableIngredients: string[];
  missingIngredients: Array<{
    name: string;
    category: 'grain' | 'hop' | 'yeast';
    requiredAmount: number;
    unit: string;
    inventoryAmount: number;
    differenceToBuy: number;
    substituteSuggestion?: string;
    substituteAvailableInStock?: boolean;
    substituteName?: string;
  }>;
}

export interface BrewLog {
  id: string;
  recipeId: string;
  recipeName: string;
  batchNumber: string;
  brewDate: string;
  targetOg: number;
  targetFg: number;
  targetAbv: number;
  actualOg: number;
  actualFg: number;
  actualAbv: number;
  actualEfficiency: number;
  mashPh?: number;
  fermentTempC: number;
  bottlingDate?: string;
  tastingDate?: string;
  bjcpScore?: number; // 0 - 50
  tastingNotes: {
    aroma: string;
    appearance: string;
    flavor: string;
    mouthfeel: string;
    overall: string;
  };
  notes: string;
  photoUrl?: string;
  status: 'mashing' | 'boiling' | 'fermenting' | 'conditioning' | 'ready' | 'archived';
}

export interface FermentTimelineStage {
  id: string;
  name: string;
  description: string;
  dayOffset: number; // день от даты варки
  durationDays: number;
  targetTempC: number;
  isCompleted: boolean;
  actionRequired: string;
}

export interface FermentationBatch {
  id: string;
  recipeId: string;
  recipeName: string;
  batchNumber: string;
  startDate: string; // YYYY-MM-DD
  stages: FermentTimelineStage[];
  notes: string;
  isFinished: boolean;
}

export interface CommunityPost {
  id: string;
  author: string;
  authorAvatar: string;
  recipeName: string;
  style: string;
  abv: number;
  ibu: number;
  brewDate: string;
  imageUrl?: string;
  story: string;
  tastingScore: number;
  likesCount: number;
  likedByMe?: boolean;
  comments: Array<{
    id: string;
    author: string;
    text: string;
    date: string;
  }>;
  createdAt: string;
}

export interface Lifehack {
  id: string;
  title: string;
  category: 'mashing' | 'boiling' | 'fermentation' | 'sanitation' | 'bottling' | 'ingredients';
  summary: string;
  content: string;
  author: string;
  rating: number; // голосов полезности
  upvoted?: boolean;
  proTip: string;
}
