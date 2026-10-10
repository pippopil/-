import { OtherIngredientItem, OtherIngredientStage, OtherIngredientType } from '../types/brewing';

export interface PredefinedOtherIngredient {
  name: string;
  category: 'sugar' | 'spice' | 'fruit' | 'fining' | 'water_agent' | 'flavor' | 'wood' | 'herb' | 'flakes' | 'other';
  type: OtherIngredientType;
  defaultUnit: 'g' | 'kg' | 'ml' | 'pcs' | 'drop';
  defaultAmount: number;
  stage: OtherIngredientStage;
  timeMinOrDays?: number;
  colorEbc?: number;
  extractPercent?: number;
  fermentablePercent?: number;
  description: string;
}

/**
 * База сахаросодержащих ингредиентов (из скриншотов мобильного калькулятора)
 * Параметры: Цвет EBC, Экстрактивность %, Сбраживаемость %
 */
export const SUGAR_INGREDIENTS: PredefinedOtherIngredient[] = [
  {
    name: 'Мёд',
    category: 'sugar',
    type: 'sugar',
    defaultUnit: 'kg',
    defaultAmount: 1.0,
    stage: 'boil',
    timeMinOrDays: 5,
    colorEbc: 1.0,
    extractPercent: 82.0,
    fermentablePercent: 100.0,
    description: 'Цветочный или гречишный мёд для брагготов, медовух и крепких сезонных элей. 100% сбраживаемый.'
  },
  {
    name: 'Декстроза',
    category: 'sugar',
    type: 'sugar',
    defaultUnit: 'kg',
    defaultAmount: 0.5,
    stage: 'boil',
    timeMinOrDays: 10,
    colorEbc: 0.1,
    extractPercent: 91.0,
    fermentablePercent: 100.0,
    description: 'Виноградный сахар (D-глюкоза). 100% сбраживание без побочных привкусов. Облегчает тело DIPA и бельгийцев.'
  },
  {
    name: 'Лактоза',
    category: 'sugar',
    type: 'sugar',
    defaultUnit: 'kg',
    defaultAmount: 0.5,
    stage: 'boil',
    timeMinOrDays: 15,
    colorEbc: 0.1,
    extractPercent: 90.0,
    fermentablePercent: 10.0,
    description: 'Молочный сахар. Не сбраживается пивными дрожжами, дает сливочную сладость и плотное тело Milk Stout и Pastry элей.'
  },
  {
    name: 'Сахар-песок',
    category: 'sugar',
    type: 'sugar',
    defaultUnit: 'kg',
    defaultAmount: 0.5,
    stage: 'boil',
    timeMinOrDays: 10,
    colorEbc: 0.1,
    extractPercent: 98.0,
    fermentablePercent: 50.0,
    description: 'Белый свекловичный/тростниковый сахар для повышения плотности и сухого финиша.'
  },
  {
    name: 'Сахар коричневый тростниковый',
    category: 'sugar',
    type: 'sugar',
    defaultUnit: 'kg',
    defaultAmount: 0.5,
    stage: 'boil',
    timeMinOrDays: 10,
    colorEbc: 10.0,
    extractPercent: 97.0,
    fermentablePercent: 10.0,
    description: 'Нерафинированный сахар демерара с карамельно-паточными нотками.'
  },
  {
    name: 'Тростниковый сахар',
    category: 'sugar',
    type: 'sugar',
    defaultUnit: 'kg',
    defaultAmount: 0.5,
    stage: 'boil',
    timeMinOrDays: 10,
    colorEbc: 1.0,
    extractPercent: 92.0,
    fermentablePercent: 50.0,
    description: 'Светлый тростниковый сахар для сухого крепкого финиша.'
  },
  {
    name: 'Бельгийский карамельный сахар',
    category: 'sugar',
    type: 'sugar',
    defaultUnit: 'kg',
    defaultAmount: 0.5,
    stage: 'boil',
    timeMinOrDays: 15,
    colorEbc: 300.0,
    extractPercent: 99.0,
    fermentablePercent: 20.0,
    description: 'Темный бельгийский Candi Sugar (D-180/D-240) для Dubbel, Tripel, Quadrupel.'
  },
  {
    name: 'Жженый сахар',
    category: 'sugar',
    type: 'sugar',
    defaultUnit: 'kg',
    defaultAmount: 0.3,
    stage: 'boil',
    timeMinOrDays: 15,
    colorEbc: 1400.0,
    extractPercent: 50.0,
    fermentablePercent: 10.0,
    description: 'Карамелизованный сахар глубокой обжарки для темного цвета и тоффи-нот.'
  },
  {
    name: 'Глюкоза',
    category: 'sugar',
    type: 'sugar',
    defaultUnit: 'kg',
    defaultAmount: 0.5,
    stage: 'boil',
    timeMinOrDays: 10,
    colorEbc: 0.1,
    extractPercent: 91.0,
    fermentablePercent: 50.0,
    description: 'Глюкоза кристаллическая пищевая.'
  },
  {
    name: 'Фруктоза',
    category: 'sugar',
    type: 'sugar',
    defaultUnit: 'kg',
    defaultAmount: 0.5,
    stage: 'boil',
    timeMinOrDays: 10,
    colorEbc: 0.1,
    extractPercent: 91.0,
    fermentablePercent: 50.0,
    description: 'Фруктовый сахар, быстрая ассимиляция дрожжами.'
  },
  {
    name: 'Мальтодекстрин',
    category: 'sugar',
    type: 'sugar',
    defaultUnit: 'g',
    defaultAmount: 250,
    stage: 'boil',
    timeMinOrDays: 15,
    colorEbc: 0.1,
    extractPercent: 85.0,
    fermentablePercent: 15.0,
    description: 'Несбраживаемый полисахарид, повышает плотность, вязкость и стойкость пены без сладости.'
  },
  {
    name: 'Кленовый сироп',
    category: 'sugar',
    type: 'sugar',
    defaultUnit: 'kg',
    defaultAmount: 0.5,
    stage: 'boil',
    timeMinOrDays: 5,
    colorEbc: 1.0,
    extractPercent: 60.0,
    fermentablePercent: 10.0,
    description: 'Натуральный кленовый сироп с древесно-карамельным ароматом.'
  },
  {
    name: 'Меласса тростниковая',
    category: 'sugar',
    type: 'sugar',
    defaultUnit: 'kg',
    defaultAmount: 0.4,
    stage: 'boil',
    timeMinOrDays: 15,
    colorEbc: 100.0,
    extractPercent: 60.0,
    fermentablePercent: 10.0,
    description: 'Густая черная патока с глубоким смолистым и лакричным вкусом для стаутов.'
  },
  {
    name: 'Концентрат квасного сусла',
    category: 'sugar',
    type: 'sugar',
    defaultUnit: 'kg',
    defaultAmount: 1.0,
    stage: 'boil',
    timeMinOrDays: 30,
    colorEbc: 400.0,
    extractPercent: 70.0,
    fermentablePercent: 100.0,
    description: 'Традиционный ККС из ферментированного ржаного и ячменного солода.'
  },
  {
    name: 'Концентрат ржаного солода тёмный',
    category: 'sugar',
    type: 'sugar',
    defaultUnit: 'kg',
    defaultAmount: 1.0,
    stage: 'boil',
    timeMinOrDays: 30,
    colorEbc: 1100.0,
    extractPercent: 73.0,
    fermentablePercent: 100.0,
    description: 'Насыщенный темно-рубиновый концентрат ржи для ржаных портеров и квасов.'
  },
  {
    name: 'Концентрат солодовый неохмеленный пшеничный',
    category: 'sugar',
    type: 'sugar',
    defaultUnit: 'kg',
    defaultAmount: 1.5,
    stage: 'boil',
    timeMinOrDays: 60,
    colorEbc: 4.0,
    extractPercent: 75.0,
    fermentablePercent: 100.0,
    description: 'Пшенично-ячменный солодовый экстракт для вайсбиров и легких элей.'
  },
  {
    name: 'Концентрат солодовый неохмеленный ячменный',
    category: 'sugar',
    type: 'sugar',
    defaultUnit: 'kg',
    defaultAmount: 1.5,
    stage: 'boil',
    timeMinOrDays: 60,
    colorEbc: 7.0,
    extractPercent: 75.0,
    fermentablePercent: 100.0,
    description: 'Светлый ячменный концентрат для экстрактного и частичного затирания.'
  },
  {
    name: 'Неохмеленный солодовый концентрат Своя Кружка "Пшеничный"',
    category: 'sugar',
    type: 'sugar',
    defaultUnit: 'kg',
    defaultAmount: 1.8,
    stage: 'boil',
    timeMinOrDays: 60,
    colorEbc: 12.0,
    extractPercent: 80.0,
    fermentablePercent: 100.0,
    description: 'Отечественный неохмеленный экстракт высшего качества.'
  },
  {
    name: 'Неохмеленный солодовый концентрат Своя Кружка "Светлый"',
    category: 'sugar',
    type: 'sugar',
    defaultUnit: 'kg',
    defaultAmount: 1.8,
    stage: 'boil',
    timeMinOrDays: 60,
    colorEbc: 12.0,
    extractPercent: 80.0,
    fermentablePercent: 100.0,
    description: 'Чистый ячменный светлый концентрат.'
  },
  {
    name: 'Неохмеленный солодовый концентрат Своя Кружка "Темный"',
    category: 'sugar',
    type: 'sugar',
    defaultUnit: 'kg',
    defaultAmount: 1.8,
    stage: 'boil',
    timeMinOrDays: 60,
    colorEbc: 25.0,
    extractPercent: 80.0,
    fermentablePercent: 100.0,
    description: 'Темный карамельный солодовый концентрат.'
  },
  {
    name: 'Жидкий неохмеленный солодовый экстракт Mangrove Jack\'s "Pure Light"',
    category: 'sugar',
    type: 'sugar',
    defaultUnit: 'kg',
    defaultAmount: 1.5,
    stage: 'boil',
    timeMinOrDays: 60,
    colorEbc: 6.0,
    extractPercent: 80.0,
    fermentablePercent: 100.0,
    description: 'Экстракт премиум-класса из Новой Зеландии.'
  },
  {
    name: 'Жидкий неохмеленный солодовый экстракт Muntons "Amber"',
    category: 'sugar',
    type: 'sugar',
    defaultUnit: 'kg',
    defaultAmount: 1.5,
    stage: 'boil',
    timeMinOrDays: 60,
    colorEbc: 25.0,
    extractPercent: 80.0,
    fermentablePercent: 100.0,
    description: 'Янтарный английский экстракт Muntons.'
  },
  {
    name: 'Жидкий неохмеленный солодовый экстракт Muntons "Dark"',
    category: 'sugar',
    type: 'sugar',
    defaultUnit: 'kg',
    defaultAmount: 1.5,
    stage: 'boil',
    timeMinOrDays: 60,
    colorEbc: 50.0,
    extractPercent: 80.0,
    fermentablePercent: 100.0,
    description: 'Темный английский экстракт Muntons для стаутов и биттеров.'
  },
  {
    name: 'Жидкий неохмеленный солодовый экстракт Muntons "Maris Otter Light"',
    category: 'sugar',
    type: 'sugar',
    defaultUnit: 'kg',
    defaultAmount: 1.5,
    stage: 'boil',
    timeMinOrDays: 60,
    colorEbc: 12.0,
    extractPercent: 80.0,
    fermentablePercent: 100.0,
    description: 'Экстракт из легендарного солода Maris Otter.'
  },
  {
    name: 'Жидкий неохмеленный солодовый экстракт Домашняя Мануфактура "Пшеница и ячмень"',
    category: 'sugar',
    type: 'sugar',
    defaultUnit: 'kg',
    defaultAmount: 1.5,
    stage: 'boil',
    timeMinOrDays: 60,
    colorEbc: 14.0,
    extractPercent: 75.0,
    fermentablePercent: 100.0,
    description: 'Российский концентрат пшеничного и ячменного сусла.'
  },
  {
    name: 'Жидкий неохмеленный солодовый экстракт Домашняя Мануфактура "Ячменный светлый"',
    category: 'sugar',
    type: 'sugar',
    defaultUnit: 'kg',
    defaultAmount: 1.5,
    stage: 'boil',
    timeMinOrDays: 60,
    colorEbc: 14.0,
    extractPercent: 75.0,
    fermentablePercent: 100.0,
    description: 'Российский светлый ячменный концентрат.'
  },
  {
    name: 'Солодовый экстракт Coopers "86 Days Pilsner"',
    category: 'sugar',
    type: 'sugar',
    defaultUnit: 'kg',
    defaultAmount: 1.7,
    stage: 'boil',
    timeMinOrDays: 60,
    colorEbc: 4.0,
    extractPercent: 90.0,
    fermentablePercent: 100.0,
    description: 'Австралийский экстракт для свежих чистых лагеров.'
  },
  {
    name: 'Солодовый экстракт Coopers "Bootmaker Pale Ale"',
    category: 'sugar',
    type: 'sugar',
    defaultUnit: 'kg',
    defaultAmount: 1.7,
    stage: 'boil',
    timeMinOrDays: 60,
    colorEbc: 9.0,
    extractPercent: 90.0,
    fermentablePercent: 100.0,
    description: 'Австралийский экстракт Coopers для классического бледного эля.'
  },
  {
    name: 'Солодовый экстракт Coopers "Devils Half Ruby Porter"',
    category: 'sugar',
    type: 'sugar',
    defaultUnit: 'kg',
    defaultAmount: 1.7,
    stage: 'boil',
    timeMinOrDays: 60,
    colorEbc: 48.0,
    extractPercent: 90.0,
    fermentablePercent: 100.0,
    description: 'Рубиновый портерный солодовый экстракт Coopers.'
  },
  {
    name: 'Солодовый экстракт Coopers "Family Secret Amber Ale"',
    category: 'sugar',
    type: 'sugar',
    defaultUnit: 'kg',
    defaultAmount: 1.7,
    stage: 'boil',
    timeMinOrDays: 60,
    colorEbc: 31.0,
    extractPercent: 90.0,
    fermentablePercent: 100.0,
    description: 'Янтарный эль от семейной пивоварни Coopers.'
  },
  {
    name: 'Солодовый экстракт Mangrove Jack\'s Craft Series "American Pale Ale"',
    category: 'sugar',
    type: 'sugar',
    defaultUnit: 'kg',
    defaultAmount: 1.8,
    stage: 'boil',
    timeMinOrDays: 60,
    colorEbc: 35.0,
    extractPercent: 85.0,
    fermentablePercent: 100.0,
    description: 'Новозеландский солодовый набор Craft Series.'
  },
  {
    name: 'Солодовый экстракт Mangrove Jack\'s Craft Series "Bavarian Wheat Pouch"',
    category: 'sugar',
    type: 'sugar',
    defaultUnit: 'kg',
    defaultAmount: 1.8,
    stage: 'boil',
    timeMinOrDays: 60,
    colorEbc: 40.0,
    extractPercent: 85.0,
    fermentablePercent: 100.0,
    description: 'Пшеничный баварский концентрат в пакете-пауче.'
  },
  {
    name: 'Сухой неохмеленный солодовый экстракт Muntons "Dark"',
    category: 'sugar',
    type: 'sugar',
    defaultUnit: 'kg',
    defaultAmount: 1.0,
    stage: 'boil',
    timeMinOrDays: 60,
    colorEbc: 60.0,
    extractPercent: 95.0,
    fermentablePercent: 100.0,
    description: 'Английский сухой солодовый порошок DME Dark.'
  },
  {
    name: 'Сухой неохмеленный солодовый экстракт Muntons "Extra Light"',
    category: 'sugar',
    type: 'sugar',
    defaultUnit: 'kg',
    defaultAmount: 1.0,
    stage: 'boil',
    timeMinOrDays: 60,
    colorEbc: 10.0,
    extractPercent: 95.0,
    fermentablePercent: 100.0,
    description: 'Светлейший сухой экстракт DME Extra Light.'
  },
  {
    name: 'Сухой неохмеленный солодовый экстракт Muntons "Wheat"',
    category: 'sugar',
    type: 'sugar',
    defaultUnit: 'kg',
    defaultAmount: 1.0,
    stage: 'boil',
    timeMinOrDays: 60,
    colorEbc: 12.0,
    extractPercent: 95.0,
    fermentablePercent: 100.0,
    description: 'Пшеничный сухой экстракт Muntons DME Wheat.'
  },
  {
    name: 'Леденцы Mangrove Jacks',
    category: 'sugar',
    type: 'sugar',
    defaultUnit: 'g',
    defaultAmount: 200,
    stage: 'bottling',
    timeMinOrDays: 0,
    colorEbc: 0.1,
    extractPercent: 100.0,
    fermentablePercent: 1.0,
    description: 'Дропсы карбонизации Mangrove Jack’s Carbonation Drops для розлива в бутылки.'
  },
  // ФРУКТЫ, ЯГОДЫ И СОКИ
  {
    name: 'Вишня',
    category: 'fruit',
    type: 'fruit',
    defaultUnit: 'kg',
    defaultAmount: 2.0,
    stage: 'secondary',
    timeMinOrDays: 7,
    colorEbc: 40.0,
    extractPercent: 15.0,
    fermentablePercent: 20.0,
    description: 'Ягоды вишни или пюре для Криков (Kriek), фрутбиров и сауров.'
  },
  {
    name: 'Малина',
    category: 'fruit',
    type: 'fruit',
    defaultUnit: 'kg',
    defaultAmount: 1.5,
    stage: 'secondary',
    timeMinOrDays: 5,
    colorEbc: 11.0,
    extractPercent: 6.0,
    fermentablePercent: 10.0,
    description: 'Спелая малина для Framboise, берлинер-вайссе и смузи сауров.'
  },
  {
    name: 'Клубника',
    category: 'fruit',
    type: 'fruit',
    defaultUnit: 'kg',
    defaultAmount: 2.0,
    stage: 'secondary',
    timeMinOrDays: 5,
    colorEbc: 14.0,
    extractPercent: 5.0,
    fermentablePercent: 20.0,
    description: 'Клубника для легких летних пшеничных элей.'
  },
  {
    name: 'Клюква',
    category: 'fruit',
    type: 'fruit',
    defaultUnit: 'kg',
    defaultAmount: 1.0,
    stage: 'secondary',
    timeMinOrDays: 7,
    colorEbc: 25.0,
    extractPercent: 3.0,
    fermentablePercent: 20.0,
    description: 'Терпкая кислая клюква для сэзонов и диких элей.'
  },
  {
    name: 'Черника',
    category: 'fruit',
    type: 'fruit',
    defaultUnit: 'kg',
    defaultAmount: 1.5,
    stage: 'secondary',
    timeMinOrDays: 7,
    colorEbc: 39.0,
    extractPercent: 10.0,
    fermentablePercent: 10.0,
    description: 'Лесная черника для ягодных портеров и стаутов.'
  },
  {
    name: 'Черная смородина',
    category: 'fruit',
    type: 'fruit',
    defaultUnit: 'kg',
    defaultAmount: 1.5,
    stage: 'secondary',
    timeMinOrDays: 7,
    colorEbc: 50.0,
    extractPercent: 10.0,
    fermentablePercent: 10.0,
    description: 'Насыщенная смородина с терпким танинным профилем.'
  },
  {
    name: 'Манго',
    category: 'fruit',
    type: 'fruit',
    defaultUnit: 'kg',
    defaultAmount: 2.0,
    stage: 'secondary',
    timeMinOrDays: 5,
    colorEbc: 0.1,
    extractPercent: 10.0,
    fermentablePercent: 10.0,
    description: 'Пюре спелого сочного манго для Mango IPA и сауров.'
  },
  {
    name: 'Маракуйя',
    category: 'fruit',
    type: 'fruit',
    defaultUnit: 'kg',
    defaultAmount: 1.0,
    stage: 'secondary',
    timeMinOrDays: 5,
    colorEbc: 8.0,
    extractPercent: 10.0,
    fermentablePercent: 10.0,
    description: 'Яркая тропическая кислинка маракуйи (passionfruit).'
  },
  {
    name: 'Персик',
    category: 'fruit',
    type: 'fruit',
    defaultUnit: 'kg',
    defaultAmount: 2.0,
    stage: 'secondary',
    timeMinOrDays: 7,
    colorEbc: 0.1,
    extractPercent: 8.0,
    fermentablePercent: 10.0,
    description: 'Персиковое пюре для сэзонов и бельгийских блондов.'
  },
  {
    name: 'Банан',
    category: 'fruit',
    type: 'fruit',
    defaultUnit: 'kg',
    defaultAmount: 1.5,
    stage: 'boil',
    timeMinOrDays: 15,
    colorEbc: 1.0,
    extractPercent: 15.0,
    fermentablePercent: 10.0,
    description: 'Пюре банана для банановых хлебных элей.'
  },
  {
    name: 'Апельсин',
    category: 'fruit',
    type: 'fruit',
    defaultUnit: 'kg',
    defaultAmount: 1.0,
    stage: 'secondary',
    timeMinOrDays: 5,
    colorEbc: 1.0,
    extractPercent: 10.0,
    fermentablePercent: 10.0,
    description: 'Сок и мякоть апельсина.'
  },
  {
    name: 'Абрикос',
    category: 'fruit',
    type: 'fruit',
    defaultUnit: 'kg',
    defaultAmount: 1.5,
    stage: 'secondary',
    timeMinOrDays: 7,
    colorEbc: 1.0,
    extractPercent: 8.0,
    fermentablePercent: 10.0,
    description: 'Абрикосовое пюре для ламбиков и пшеничных элей.'
  },
  {
    name: 'Ананас',
    category: 'fruit',
    type: 'fruit',
    defaultUnit: 'kg',
    defaultAmount: 1.5,
    stage: 'secondary',
    timeMinOrDays: 5,
    colorEbc: 0.1,
    extractPercent: 5.0,
    fermentablePercent: 10.0,
    description: 'Ананасовый сок/кусочки для тропических IPA.'
  },
  {
    name: 'Дыня',
    category: 'fruit',
    type: 'fruit',
    defaultUnit: 'kg',
    defaultAmount: 2.0,
    stage: 'secondary',
    timeMinOrDays: 5,
    colorEbc: 0.1,
    extractPercent: 8.5,
    fermentablePercent: 20.0,
    description: 'Ароматная спелая дыня.'
  },
  {
    name: 'Ежевика',
    category: 'fruit',
    type: 'fruit',
    defaultUnit: 'kg',
    defaultAmount: 1.5,
    stage: 'secondary',
    timeMinOrDays: 7,
    colorEbc: 30.0,
    extractPercent: 4.5,
    fermentablePercent: 10.0,
    description: 'Лесная ежевика глубокого бордового оттенка.'
  },
  {
    name: 'Киви',
    category: 'fruit',
    type: 'fruit',
    defaultUnit: 'kg',
    defaultAmount: 1.5,
    stage: 'secondary',
    timeMinOrDays: 5,
    colorEbc: 0.1,
    extractPercent: 4.0,
    fermentablePercent: 10.0,
    description: 'Освежающий зеленый киви.'
  },
  {
    name: 'Крыжовник',
    category: 'fruit',
    type: 'fruit',
    defaultUnit: 'kg',
    defaultAmount: 1.5,
    stage: 'secondary',
    timeMinOrDays: 7,
    colorEbc: 0.1,
    extractPercent: 9.0,
    fermentablePercent: 20.0,
    description: 'Ягоды крыжовника для гозе и сауров.'
  },
  {
    name: 'Лайм',
    category: 'fruit',
    type: 'fruit',
    defaultUnit: 'g',
    defaultAmount: 500,
    stage: 'secondary',
    timeMinOrDays: 4,
    colorEbc: 5.0,
    extractPercent: 5.0,
    fermentablePercent: 10.0,
    description: 'Сок и дольки лайма для мексиканских лагеров и гозе.'
  },
  {
    name: 'Мандарин',
    category: 'fruit',
    type: 'fruit',
    defaultUnit: 'kg',
    defaultAmount: 1.0,
    stage: 'secondary',
    timeMinOrDays: 5,
    colorEbc: 4.0,
    extractPercent: 8.0,
    fermentablePercent: 10.0,
    description: 'Спелые мандарины для рождественских элей.'
  },
  {
    name: 'Грейпфрут',
    category: 'fruit',
    type: 'fruit',
    defaultUnit: 'kg',
    defaultAmount: 1.0,
    stage: 'secondary',
    timeMinOrDays: 5,
    colorEbc: 4.5,
    extractPercent: 10.0,
    fermentablePercent: 10.0,
    description: 'Грейпфрутовый сок и мякоть для цитрусовых IPA.'
  },
  {
    name: 'Слива',
    category: 'fruit',
    type: 'fruit',
    defaultUnit: 'kg',
    defaultAmount: 2.0,
    stage: 'secondary',
    timeMinOrDays: 7,
    colorEbc: 4.0,
    extractPercent: 10.0,
    fermentablePercent: 10.0,
    description: 'Сливы и чернослив для бельгийских дуббелей.'
  },
  {
    name: 'Тыква',
    category: 'fruit',
    type: 'fruit',
    defaultUnit: 'kg',
    defaultAmount: 3.0,
    stage: 'mash',
    timeMinOrDays: 60,
    colorEbc: 0.1,
    extractPercent: 6.5,
    fermentablePercent: 50.0,
    description: 'Запеченная тыквенная мякоть для Pumpkin Ale.'
  },
  {
    name: 'Яблоко',
    category: 'fruit',
    type: 'fruit',
    defaultUnit: 'kg',
    defaultAmount: 2.0,
    stage: 'secondary',
    timeMinOrDays: 7,
    colorEbc: 0.1,
    extractPercent: 10.0,
    fermentablePercent: 20.0,
    description: 'Свежие яблоки для граффов (Graff — яблочный эль) и сидров.'
  },
  {
    name: 'Виноградный сок концентрированный',
    category: 'fruit',
    type: 'fruit',
    defaultUnit: 'kg',
    defaultAmount: 1.0,
    stage: 'boil',
    timeMinOrDays: 10,
    colorEbc: 5.0,
    extractPercent: 70.0,
    fermentablePercent: 100.0,
    description: 'Концентрированное сусло винограда для Итальянских виноградных элей (IGA).'
  },
  {
    name: 'Яблочный сок концентрированный',
    category: 'fruit',
    type: 'fruit',
    defaultUnit: 'kg',
    defaultAmount: 1.0,
    stage: 'boil',
    timeMinOrDays: 10,
    colorEbc: 5.0,
    extractPercent: 70.0,
    fermentablePercent: 100.0,
    description: 'Осветленный концентрированный яблочный сок.'
  }
];

/**
 * База специй, трав, добавок, осветлителей, солей и дуба (из скриншотов 1 и 2)
 */
export const OTHER_INGREDIENTS: PredefinedOtherIngredient[] = [
  // Осветлители и стабилизаторы
  {
    name: 'Ирландский мох',
    category: 'fining',
    type: 'fining',
    defaultUnit: 'g',
    defaultAmount: 5,
    stage: 'boil',
    timeMinOrDays: 10,
    description: 'Irish Moss. Натуральный морской осветлитель сусла, связывает белки за 10-15 мин до конца кипячения.'
  },
  {
    name: 'Вирофлок',
    category: 'fining',
    type: 'fining',
    defaultUnit: 'pcs',
    defaultAmount: 1,
    stage: 'boil',
    timeMinOrDays: 10,
    description: 'Whirfloc. Концентрированные таблетки каррагинана для кристальной прозрачности сусла.'
  },
  {
    name: 'Агар-Агар',
    category: 'fining',
    type: 'fining',
    defaultUnit: 'g',
    defaultAmount: 3,
    stage: 'boil',
    timeMinOrDays: 10,
    description: 'Растительный коагулянт белков из морских водорослей.'
  },
  {
    name: 'Пектин',
    category: 'fining',
    type: 'fining',
    defaultUnit: 'g',
    defaultAmount: 10,
    stage: 'secondary',
    timeMinOrDays: 3,
    description: 'Пектин / пектиназа для осветления фруктовых заторов.'
  },

  // Специи и пряности
  {
    name: 'Кориандр молотый',
    category: 'spice',
    type: 'spice',
    defaultUnit: 'g',
    defaultAmount: 15,
    stage: 'boil',
    timeMinOrDays: 5,
    description: 'Классика бельгийских витбиров (Witbier / Blanche) и рождественских элей.'
  },
  {
    name: 'Цедра апельсина',
    category: 'spice',
    type: 'spice',
    defaultUnit: 'g',
    defaultAmount: 20,
    stage: 'boil',
    timeMinOrDays: 5,
    description: 'Сушеная горькая (кюрасао) или сладкая цедра апельсина для бланшей и сэзонов.'
  },
  {
    name: 'Цедра лимона',
    category: 'spice',
    type: 'spice',
    defaultUnit: 'g',
    defaultAmount: 15,
    stage: 'boil',
    timeMinOrDays: 5,
    description: 'Свежая или сушеная лимонная цедра для освежающих элей.'
  },
  {
    name: 'Цедра лайма',
    category: 'spice',
    type: 'spice',
    defaultUnit: 'g',
    defaultAmount: 15,
    stage: 'boil',
    timeMinOrDays: 5,
    description: 'Лаймовая цедра для гозе и легких летних сортов.'
  },
  {
    name: 'Цедра грейпфрута',
    category: 'spice',
    type: 'spice',
    defaultUnit: 'g',
    defaultAmount: 20,
    stage: 'boil',
    timeMinOrDays: 5,
    description: 'Благородная цитрусовая горчинка для IPA и APA.'
  },
  {
    name: 'Цедра мандарина',
    category: 'spice',
    type: 'spice',
    defaultUnit: 'g',
    defaultAmount: 20,
    stage: 'boil',
    timeMinOrDays: 5,
    description: 'Новогодний мягкий цитрусовый аромат.'
  },
  {
    name: 'Гвоздика',
    category: 'spice',
    type: 'spice',
    defaultUnit: 'g',
    defaultAmount: 3,
    stage: 'boil',
    timeMinOrDays: 5,
    description: 'Бутоны пряной гвоздики для витбиров и зимних сортов.'
  },
  {
    name: 'Кардамон',
    category: 'spice',
    type: 'spice',
    defaultUnit: 'g',
    defaultAmount: 4,
    stage: 'boil',
    timeMinOrDays: 5,
    description: 'Изысканный смолисто-камфорный пряный аромат.'
  },
  {
    name: 'Корица',
    category: 'spice',
    type: 'spice',
    defaultUnit: 'g',
    defaultAmount: 5,
    stage: 'boil',
    timeMinOrDays: 5,
    description: 'Палочки или молотая корица для пряных тыквенных и зимних элей.'
  },
  {
    name: 'Мускатный орех',
    category: 'spice',
    type: 'spice',
    defaultUnit: 'g',
    defaultAmount: 2,
    stage: 'boil',
    timeMinOrDays: 5,
    description: 'Теплый ореховый пряный тон.'
  },
  {
    name: 'Имбирь молотый',
    category: 'spice',
    type: 'spice',
    defaultUnit: 'g',
    defaultAmount: 10,
    stage: 'boil',
    timeMinOrDays: 10,
    description: 'Согревающий пряный имбирь для имбирных элей и зимних сортов.'
  },
  {
    name: 'Анис',
    category: 'spice',
    type: 'spice',
    defaultUnit: 'g',
    defaultAmount: 4,
    stage: 'boil',
    timeMinOrDays: 5,
    description: 'Звездчатый или семенной анис с лакричным букетом.'
  },
  {
    name: 'Тмин',
    category: 'spice',
    type: 'spice',
    defaultUnit: 'g',
    defaultAmount: 5,
    stage: 'boil',
    timeMinOrDays: 5,
    description: 'Традиционный тмин для ржаных сортов пива.'
  },
  {
    name: 'Перец черный',
    category: 'spice',
    type: 'spice',
    defaultUnit: 'g',
    defaultAmount: 4,
    stage: 'boil',
    timeMinOrDays: 5,
    description: 'Дробленый черный перец для бельгийских сэзонов.'
  },
  {
    name: 'Перец Чили',
    category: 'spice',
    type: 'spice',
    defaultUnit: 'g',
    defaultAmount: 10,
    stage: 'secondary',
    timeMinOrDays: 3,
    description: 'Острый перец чили/халапеньо для мексиканских стаутов (Mexican Stout).'
  },

  // Шоколад, кофе, кокос и десерты
  {
    name: 'Какао порошок',
    category: 'flavor',
    type: 'flavor',
    defaultUnit: 'g',
    defaultAmount: 150,
    stage: 'boil',
    timeMinOrDays: 10,
    description: 'Обезжиренный натуральный какао-порошок для шоколадных стаутов.'
  },
  {
    name: 'Какао-бобы',
    category: 'flavor',
    type: 'flavor',
    defaultUnit: 'g',
    defaultAmount: 100,
    stage: 'secondary',
    timeMinOrDays: 5,
    description: 'Дробленые обжаренные какао-крупка для благородного шоколадного профиля.'
  },
  {
    name: 'Кофе',
    category: 'flavor',
    type: 'flavor',
    defaultUnit: 'g',
    defaultAmount: 100,
    stage: 'secondary',
    timeMinOrDays: 2,
    description: 'Свежемолотый кофе или колд-брю (cold brew) концентрат на вторичное брожение.'
  },
  {
    name: 'Кокосовая стружка',
    category: 'flavor',
    type: 'flavor',
    defaultUnit: 'g',
    defaultAmount: 200,
    stage: 'secondary',
    timeMinOrDays: 4,
    description: 'Подсушенная в духовке кокосовая стружка для кокосовых пастри-стаутов.'
  },
  {
    name: 'Ванилин',
    category: 'flavor',
    type: 'flavor',
    defaultUnit: 'g',
    defaultAmount: 2,
    stage: 'secondary',
    timeMinOrDays: 2,
    description: 'Кристаллический ванилин.'
  },
  {
    name: 'Ваниль',
    category: 'flavor',
    type: 'flavor',
    defaultUnit: 'pcs',
    defaultAmount: 2,
    stage: 'secondary',
    timeMinOrDays: 5,
    description: 'Натуральные стручки мадагаскарской ванили (Bourbon Vanilla).'
  },
  {
    name: 'Экстракт ванили',
    category: 'flavor',
    type: 'flavor',
    defaultUnit: 'ml',
    defaultAmount: 15,
    stage: 'bottling',
    timeMinOrDays: 0,
    description: 'Жидкий спиртовой экстракт натуральной ванили.'
  },

  // Травы, хвоя и ботаника
  {
    name: 'Мята',
    category: 'herb',
    type: 'herb',
    defaultUnit: 'g',
    defaultAmount: 20,
    stage: 'boil',
    timeMinOrDays: 5,
    description: 'Перечная или полевая мята для освежающих летних сортов.'
  },
  {
    name: 'Мелисса',
    category: 'herb',
    type: 'herb',
    defaultUnit: 'g',
    defaultAmount: 15,
    stage: 'boil',
    timeMinOrDays: 5,
    description: 'Лимонная мелисса с нежным травянисто-цитрусовым букетом.'
  },
  {
    name: 'Лаванда',
    category: 'herb',
    type: 'herb',
    defaultUnit: 'g',
    defaultAmount: 5,
    stage: 'boil',
    timeMinOrDays: 3,
    description: 'Цветки лаванды для цветочных элей и сэзонов.'
  },
  {
    name: 'Ромашка',
    category: 'herb',
    type: 'herb',
    defaultUnit: 'g',
    defaultAmount: 15,
    stage: 'boil',
    timeMinOrDays: 5,
    description: 'Аптечная ромашка для сэзонов и бельгийских сортов.'
  },
  {
    name: 'Розмарин',
    category: 'herb',
    type: 'herb',
    defaultUnit: 'g',
    defaultAmount: 10,
    stage: 'boil',
    timeMinOrDays: 5,
    description: 'Свежие хвойные веточки розмарина.'
  },
  {
    name: 'Гибискус',
    category: 'herb',
    type: 'herb',
    defaultUnit: 'g',
    defaultAmount: 50,
    stage: 'secondary',
    timeMinOrDays: 4,
    description: 'Цветы гибискуса (каркаде) придают яркий рубиновый цвет и фруктовую кислинку.'
  },
  {
    name: 'Еловые побеги',
    category: 'herb',
    type: 'herb',
    defaultUnit: 'g',
    defaultAmount: 50,
    stage: 'boil',
    timeMinOrDays: 10,
    description: 'Молодые весенние еловые побеги для северных хвойных элей (Spruce Ale).'
  },
  {
    name: 'Сосновые побеги',
    category: 'herb',
    type: 'herb',
    defaultUnit: 'g',
    defaultAmount: 50,
    stage: 'boil',
    timeMinOrDays: 10,
    description: 'Свежие сосновые почки для смолистых крепких элей и IPA.'
  },
  {
    name: 'Ягоды можжевельника',
    category: 'herb',
    type: 'herb',
    defaultUnit: 'g',
    defaultAmount: 25,
    stage: 'boil',
    timeMinOrDays: 10,
    description: 'Раздавленные ягоды можжевельника для финского Сахти (Sahti) и джин-элей.'
  },
  {
    name: 'Чай',
    category: 'herb',
    type: 'herb',
    defaultUnit: 'g',
    defaultAmount: 30,
    stage: 'secondary',
    timeMinOrDays: 2,
    description: 'Чай Earl Grey (бергамот), сенча или пуэр для авторских чайных элей.'
  },

  // Водоподготовка, соли и кислоты
  {
    name: 'Молочная кислота',
    category: 'water_agent',
    type: 'water_agent',
    defaultUnit: 'ml',
    defaultAmount: 5,
    stage: 'mash',
    timeMinOrDays: 0,
    description: '80% пищевая молочная кислота для точной регулировки pH затора (5.2 - 5.4).'
  },
  {
    name: 'Лимонная кислота',
    category: 'water_agent',
    type: 'water_agent',
    defaultUnit: 'g',
    defaultAmount: 5,
    stage: 'mash',
    timeMinOrDays: 0,
    description: 'Пищевая кристаллическая лимонная кислота.'
  },
  {
    name: 'Аскорбиновая кислота',
    category: 'water_agent',
    type: 'water_agent',
    defaultUnit: 'g',
    defaultAmount: 2,
    stage: 'bottling',
    timeMinOrDays: 0,
    description: 'Витамин C. Мощный антиоксидант для защиты NEIPA и хмелевых сортов от окисления.'
  },
  {
    name: 'Гипс',
    category: 'water_agent',
    type: 'water_agent',
    defaultUnit: 'g',
    defaultAmount: 8,
    stage: 'mash',
    timeMinOrDays: 0,
    description: 'Сульфат кальция (CaSO4). Повышает сульфаты, подчеркивает хрустящую чистую горечь IPA.'
  },
  {
    name: 'Мел',
    category: 'water_agent',
    type: 'water_agent',
    defaultUnit: 'g',
    defaultAmount: 5,
    stage: 'mash',
    timeMinOrDays: 0,
    description: 'Карбонат кальция (CaCO3). Повышает щелочность для темных кислых солодов.'
  },
  {
    name: 'Соль поваренная',
    category: 'water_agent',
    type: 'water_agent',
    defaultUnit: 'g',
    defaultAmount: 15,
    stage: 'boil',
    timeMinOrDays: 10,
    description: 'Хлорид натрия (NaCl). Необходима для немецкого кисло-соленого стиля Гозе (Gose).'
  },

  // Выдержка на дубе
  {
    name: 'Дубовая щепа',
    category: 'wood',
    type: 'wood',
    defaultUnit: 'g',
    defaultAmount: 40,
    stage: 'secondary',
    timeMinOrDays: 14,
    description: 'Французский или кавказский дуб средней обжарки (Medium Roast) для выдержки.'
  },
  {
    name: 'Дубовые палочки',
    category: 'wood',
    type: 'wood',
    defaultUnit: 'g',
    defaultAmount: 60,
    stage: 'secondary',
    timeMinOrDays: 30,
    description: 'Спирали и палочки дуба с глубоким ванильно-древесным профилем.'
  },
  {
    name: 'Дубовые кубики',
    category: 'wood',
    type: 'wood',
    defaultUnit: 'g',
    defaultAmount: 50,
    stage: 'secondary',
    timeMinOrDays: 30,
    description: 'Дубовые кубики, вымоченные в бурбоне, роме или коньяке.'
  },

  // Натуральные ароматизаторы
  {
    name: 'Ароматизатор Абрикос',
    category: 'flavor',
    type: 'flavor',
    defaultUnit: 'ml',
    defaultAmount: 10,
    stage: 'bottling',
    timeMinOrDays: 0,
    description: 'Натуральный кондитерский экстракт абрикоса.'
  },
  {
    name: 'Ароматизатор Апельсин',
    category: 'flavor',
    type: 'flavor',
    defaultUnit: 'ml',
    defaultAmount: 10,
    stage: 'bottling',
    timeMinOrDays: 0,
    description: 'Цитрусовый апельсиновый экстракт.'
  },
  {
    name: 'Ароматизатор Ваниль',
    category: 'flavor',
    type: 'flavor',
    defaultUnit: 'ml',
    defaultAmount: 10,
    stage: 'bottling',
    timeMinOrDays: 0,
    description: 'Сливочная натуральная ваниль.'
  },
  {
    name: 'Ароматизатор Вишня',
    category: 'flavor',
    type: 'flavor',
    defaultUnit: 'ml',
    defaultAmount: 10,
    stage: 'bottling',
    timeMinOrDays: 0,
    description: 'Ароматизатор спелой вишни.'
  },
  {
    name: 'Ароматизатор Кофе',
    category: 'flavor',
    type: 'flavor',
    defaultUnit: 'ml',
    defaultAmount: 10,
    stage: 'bottling',
    timeMinOrDays: 0,
    description: 'Насыщенный экстракт эспрессо.'
  },
  {
    name: 'Ароматизатор Маракуйя',
    category: 'flavor',
    type: 'flavor',
    defaultUnit: 'ml',
    defaultAmount: 10,
    stage: 'bottling',
    timeMinOrDays: 0,
    description: 'Тропическая маракуйя.'
  },
  {
    name: 'Ароматизатор Миндаль',
    category: 'flavor',
    type: 'flavor',
    defaultUnit: 'ml',
    defaultAmount: 5,
    stage: 'bottling',
    timeMinOrDays: 0,
    description: 'Марципаново-ореховый миндальный экстракт.'
  }
];

/**
 * Объединенный полный каталог всех дополнительных ингредиентов
 */
export const ALL_ADDITIONAL_INGREDIENTS: PredefinedOtherIngredient[] = [
  ...SUGAR_INGREDIENTS,
  ...OTHER_INGREDIENTS
];

/**
 * Поиск и автодополнение дополнительных ингредиентов по префиксу или словам
 */
export function searchAdditionalIngredients(query: string): PredefinedOtherIngredient[] {
  if (!query) return ALL_ADDITIONAL_INGREDIENTS;
  const q = query.toLowerCase().trim();

  return ALL_ADDITIONAL_INGREDIENTS.filter(item => {
    const target = item.name.toLowerCase();
    if (target.startsWith(q)) return true;
    const words = target.split(/[\s\(\)\/\-\,\.]+/).filter(Boolean);
    if (words.some(w => w.startsWith(q))) return true;
    if (q.length >= 3 && target.includes(q)) return true;
    return false;
  }).sort((a, b) => {
    const aStarts = a.name.toLowerCase().startsWith(q);
    const bStarts = b.name.toLowerCase().startsWith(q);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    return a.name.localeCompare(b.name, 'ru');
  });
}
