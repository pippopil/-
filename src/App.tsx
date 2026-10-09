/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ActiveTab,
  Navbar
} from './components/Navbar';
import { RecipeBuilder } from './components/RecipeBuilder';
import { IngredientMatcher } from './components/IngredientMatcher';
import { RecipeCatalogue } from './components/RecipeCatalogue';
import { AiStudioLabelGenerator } from './components/AiStudioLabelGenerator';
import { BrewCalendar } from './components/BrewCalendar';
import { BrewLogJournal } from './components/BrewLogJournal';
import { LifehacksGuide } from './components/LifehacksGuide';
import { CommunityFeed } from './components/CommunityFeed';
import { PrintableBrewSheet } from './components/PrintableBrewSheet';
import { CloudSyncModal } from './components/CloudSyncModal';
import { NewRecipeModal } from './components/NewRecipeModal';
import { BrewingHistoryModal } from './components/BrewingHistoryModal';

import {
  BrewLog,
  CommunityPost,
  FermentationBatch,
  InventoryItem,
  Lifehack,
  Recipe
} from './types/brewing';
import {
  INITIAL_INVENTORY,
  INITIAL_LIFEHACKS,
  INITIAL_POSTS,
  INITIAL_RECIPES
} from './data/defaultData';
import { calculateBrewMetrics, scaleRecipeIngredients } from './utils/brewingMath';

export default function App() {
  // Тема (светлая / тёмная)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('masterbrew_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      localStorage.setItem('masterbrew_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      localStorage.setItem('masterbrew_theme', 'light');
    }
  }, [isDarkMode]);

  // Офлайн статус
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Активная вкладка
  const [activeTab, setActiveTab] = useState<ActiveTab>('calculator');

  // Переключение вкладки с мгновенным сбросом позиции скролла
  const handleTabChange = useCallback((tab: ActiveTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }
    if (document.body) {
      document.body.scrollTop = 0;
    }
  }, []);

  // Плавный мобильный свайп между основными вкладками (Варка <-> Рецепты <-> Склад <-> Брожение)
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) {
      touchStartRef.current = null;
      return;
    }
    const target = e.target as HTMLElement | null;
    // Если жест начался на интерактивном элементе (поле ввода, кнопка, выпадающий список)
    // или внутри таблицы/контейнера со скроллом — отменяем перехват таба, чтобы не подвешивать приложение
    if (
      target &&
      target.closest(
        'input, textarea, select, button, [role="button"], table, tr, td, th, [class*="overflow-x"], .swipe-scroll-x, [data-no-swipe]'
      )
    ) {
      touchStartRef.current = null;
      return;
    }
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || e.changedTouches.length !== 1) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const dt = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;

    // Игнорируем длинные удержания (> 450 мс) или выраженные вертикальные движения
    // Для переключения таба нужен четкий горизонтальный жест (минимум 75px и в 2.2 раза больше вертикального)
    if (dt > 450 || Math.abs(dx) < 75 || Math.abs(dx) < Math.abs(dy) * 2.2) {
      return;
    }

    const mainTabs: ActiveTab[] = ['calculator', 'catalogue', 'matcher', 'calendar'];
    const currentIndex = mainTabs.indexOf(activeTab);
    if (currentIndex === -1) return;

    if (dx < -75 && currentIndex < mainTabs.length - 1) {
      // Свайп влево: переход к следующей вкладке
      handleTabChange(mainTabs[currentIndex + 1]);
    } else if (dx > 75 && currentIndex > 0) {
      // Свайп вправо: переход к предыдущей вкладке
      handleTabChange(mainTabs[currentIndex - 1]);
    }
  };

  // При открытии любой вкладки страница всегда начинается сначала (с самого верха)
  useEffect(() => {
    const scrollToPageTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      if (document.documentElement) {
        document.documentElement.scrollTop = 0;
      }
      if (document.body) {
        document.body.scrollTop = 0;
      }
      const rootEl = document.getElementById('root');
      if (rootEl) {
        rootEl.scrollTop = 0;
      }
    };

    // Мгновенный сброс скролла
    scrollToPageTop();

    // Запуск в следующем кадре для надежности при монтировании нового содержимого DOM
    const frameId = requestAnimationFrame(scrollToPageTop);
    const timeoutId = setTimeout(scrollToPageTop, 50);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(timeoutId);
    };
  }, [activeTab]);

  // Рецепты (с сохранением в LocalStorage для работы офлайн)
  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    const saved = localStorage.getItem('masterbrew_recipes');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Если рецепты в хранилище были на старые 20 л, масштабируем их до 30 л
          const migrated = parsed.map((r: Recipe) => {
            if (r.batchSizeL === 20) {
              const { scaledGrains, scaledHops } = scaleRecipeIngredients(r.grains, r.hops, 20, 30);
              return {
                ...r,
                batchSizeL: 30,
                grains: scaledGrains,
                hops: scaledHops,
                calculated: calculateBrewMetrics({
                  ...r,
                  batchSizeL: 30,
                  grains: scaledGrains,
                  hops: scaledHops
                })
              };
            }
            return r;
          });
          // Объединяем с новыми 34 эталонными рецептами, если их не было в кэше
          const existingIds = new Set(migrated.map((r: any) => r.id));
          const missingNew = INITIAL_RECIPES.filter(r => !existingIds.has(r.id));
          return [...migrated, ...missingNew];
        }
      } catch (e) {
        console.error('Failed to parse recipes from storage', e);
      }
    }
    return INITIAL_RECIPES;
  });

  // Текущий редактируемый рецепт
  const [currentRecipe, setCurrentRecipe] = useState<Recipe>(() => {
    return recipes[0] || INITIAL_RECIPES[0];
  });

  // Кладовая (Запасы)
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('masterbrew_inventory');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_INVENTORY;
  });

  // Партии в календаре
  const [batches, setBatches] = useState<FermentationBatch[]>(() => {
    const saved = localStorage.getItem('masterbrew_batches');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    // Пример начальной активной партии
    const initRecipe = INITIAL_RECIPES[0];
    return [
      {
        id: 'batch_demo_1',
        recipeId: initRecipe.id,
        recipeName: initRecipe.name,
        batchNumber: 'Варка #1',
        startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        stages: [
          {
            id: 'st_1',
            name: 'День варки (Brew Day)',
            description: 'Затирание, охмеление, охлаждение',
            dayOffset: 0,
            durationDays: 1,
            targetTempC: 67,
            isCompleted: true,
            actionRequired: 'Внесены дрожжи US-05'
          },
          {
            id: 'st_2',
            name: 'Главное брожение',
            description: 'Интенсивное брожение при 19°C',
            dayOffset: 1,
            durationDays: 7,
            targetTempC: 19,
            isCompleted: true,
            actionRequired: 'Температура 19-20°C выдержана'
          },
          {
            id: 'st_3',
            name: 'Сухое охмеление (Dry Hopping)',
            description: 'Внесение 50г Mosaic без доступа воздуха',
            dayOffset: 8,
            durationDays: 3,
            targetTempC: 18,
            isCompleted: true,
            actionRequired: 'Хмель внесен в мешочке'
          },
          {
            id: 'st_4',
            name: 'Розлив и внесение декстрозы',
            description: 'Розлив по бутылкам + 140г декстрозы',
            dayOffset: 11,
            durationDays: 1,
            targetTempC: 20,
            isCompleted: false,
            actionRequired: 'Продезинфицировать 40 бутылок'
          },
          {
            id: 'st_5',
            name: 'Карбонизация в тепле',
            description: '14 дней в темноте при 21°C',
            dayOffset: 12,
            durationDays: 14,
            targetTempC: 21,
            isCompleted: false,
            actionRequired: 'Контроль надутости контрольной ПЭТ бутылки'
          },
          {
            id: 'st_6',
            name: 'Холодное созревание',
            description: 'Выдержка в холодильнике при 4°C',
            dayOffset: 26,
            durationDays: 14,
            targetTempC: 4,
            isCompleted: false,
            actionRequired: 'Охлаждение'
          },
          {
            id: 'st_7',
            name: 'Готово к дегустации!',
            description: 'Пиво созрело и осветлилось',
            dayOffset: 40,
            durationDays: 0,
            targetTempC: 8,
            isCompleted: false,
            actionRequired: 'Дегустация'
          }
        ],
        notes: 'Отличный аромат хмеля Citra на вирпуле!',
        isFinished: false
      }
    ];
  });

  // Журнал варок
  const [logs, setLogs] = useState<BrewLog[]>(() => {
    const saved = localStorage.getItem('masterbrew_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    const r = INITIAL_RECIPES[0];
    return [
      {
        id: 'log_init_1',
        recipeId: r.id,
        recipeName: r.name,
        batchNumber: 'Варка #1 (Citra IPA)',
        brewDate: '2026-03-01',
        targetOg: r.calculated.ogSg,
        targetFg: r.calculated.fgSg,
        targetAbv: r.calculated.abv,
        actualOg: 1.054,
        actualFg: 1.011,
        actualAbv: 5.6,
        actualEfficiency: 73,
        mashPh: 5.35,
        fermentTempC: 19.5,
        bjcpScore: 47,
        tastingNotes: {
          aroma: 'Взрывной тропический аромат манго, грейпфрута и свежей сосны.',
          appearance: 'Красивый глубокий золотистый цвет (14 EBC), стойкая пенная шапка.',
          flavor: 'Чистая солодовая подложка с мягкой сочной хмелевой горчинкой.',
          mouthfeel: 'Освежающее среднее тело, правильная карбонизация.',
          overall: 'Превосходный крафтовый IPA уровня победителя конкурса.'
        },
        notes: 'Промывочную воду держал строго 76°C, вирпул сделал при 82°C. Никаких танинов.',
        status: 'ready'
      }
    ];
  });

  // Лайфхаки
  const [lifehacks, setLifehacks] = useState<Lifehack[]>(() => {
    const saved = localStorage.getItem('masterbrew_lifehacks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_LIFEHACKS;
  });

  // Посты сообщества
  const [posts, setPosts] = useState<CommunityPost[]>(() => {
    const saved = localStorage.getItem('masterbrew_posts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_POSTS;
  });

  // Облачный код синхронизации
  const [syncCode, setSyncCode] = useState<string>(() => {
    return localStorage.getItem('masterbrew_sync_code') || 'BREW-94X';
  });
  useEffect(() => {
    localStorage.setItem('masterbrew_sync_code', syncCode);
  }, [syncCode]);

  // Глобальный целевой объем партии (в литрах)
  const [globalBatchSizeL, setGlobalBatchSizeL] = useState<number>(() => {
    const saved = localStorage.getItem('masterbrew_batch_size');
    return saved ? parseFloat(saved) || 30 : 30;
  });
  useEffect(() => {
    localStorage.setItem('masterbrew_batch_size', String(globalBatchSizeL));
  }, [globalBatchSizeL]);

  const [cloudModalOpen, setCloudModalOpen] = useState(false);
  const [newRecipeModalOpen, setNewRecipeModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyInitialMomentId, setHistoryInitialMomentId] = useState<string | undefined>(undefined);

  const handleOpenHistory = (momentId?: string) => {
    setHistoryInitialMomentId(momentId);
    setHistoryModalOpen(true);
  };

  // Автосохранение всех сущностей в LocalStorage (Offline-First)
  useEffect(() => {
    localStorage.setItem('masterbrew_recipes', JSON.stringify(recipes));
  }, [recipes]);
  useEffect(() => {
    localStorage.setItem('masterbrew_inventory', JSON.stringify(inventory));
  }, [inventory]);
  useEffect(() => {
    localStorage.setItem('masterbrew_batches', JSON.stringify(batches));
  }, [batches]);
  useEffect(() => {
    localStorage.setItem('masterbrew_logs', JSON.stringify(logs));
  }, [logs]);
  useEffect(() => {
    localStorage.setItem('masterbrew_lifehacks', JSON.stringify(lifehacks));
  }, [lifehacks]);
  useEffect(() => {
    localStorage.setItem('masterbrew_posts', JSON.stringify(posts));
  }, [posts]);

  // Сохранение рецепта в базу
  const handleSaveRecipe = (recipeToSave: Recipe) => {
    const exists = recipes.some(r => r.id === recipeToSave.id);
    if (exists) {
      setRecipes(recipes.map(r => (r.id === recipeToSave.id ? recipeToSave : r)));
    } else {
      setRecipes([recipeToSave, ...recipes]);
    }
  };

  // Создание нового кастомного рецепта
  const handleCreateNewRecipe = () => {
    const blankRecipe: Recipe = {
      id: `recipe_custom_${Date.now()}`,
      name: 'Новый авторский рецепт',
      style: 'American Pale Ale',
      category: 'Эли / Хмелевые',
      description: 'Авторский крафтовый рецепт с чистой солодовой засыпью и сбалансированным охмелением.',
      author: 'Вы',
      batchSizeL: 30,
      boilTimeMin: 60,
      efficiencyPercent: 72,
      grainRatioLPerKg: 3.5,
      grainTempC: 20,
      targetCarbonationVol: 2.4,
      beerTempAtBottlingC: 19,
      grains: [
        { id: `g_${Date.now()}_1`, name: 'Курский Пэйл Эль (Pale Ale Malt)', weightKg: 6.2, potentialSg: 1.038, colorEbc: 6.0, type: 'base' },
        { id: `g_${Date.now()}_2`, name: 'Курский Десертный (Карамельный 20 EBC)', weightKg: 0.5, potentialSg: 1.033, colorEbc: 20.0, type: 'caramel' }
      ],
      hops: [
        { id: `h_${Date.now()}_1`, name: 'Magnum', weightG: 25, alphaAcid: 14.0, boilTimeMin: 60, use: 'boil' },
        { id: `h_${Date.now()}_2`, name: 'Cascade', weightG: 45, alphaAcid: 6.0, boilTimeMin: 15, use: 'boil' }
      ],
      mashSchedule: [
        { id: 'm1', name: 'Белковая пауза (Курский солод)', tempC: 53, timeMin: 15, type: 'protein' },
        { id: 'm2', name: 'Мальтозная пауза', tempC: 65, timeMin: 50, type: 'maltose' },
        { id: 'm3', name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout' }
      ],
      yeast: {
        name: 'SafAle US-05',
        lab: 'Fermentis',
        form: 'dry',
        type: 'ale',
        cellsPerGramOrVial: 20,
        attenuationPercent: 81,
        tempRange: [18, 26]
      },
      calculated: {} as any,
      tags: ['Авторский', 'Крафт'],
      isCustom: true,
      collection: 'my_recipes',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    blankRecipe.calculated = calculateBrewMetrics({
      batchSizeL: blankRecipe.batchSizeL,
      boilTimeMin: blankRecipe.boilTimeMin,
      efficiencyPercent: blankRecipe.efficiencyPercent,
      grainRatioLPerKg: blankRecipe.grainRatioLPerKg,
      grainTempC: blankRecipe.grainTempC,
      targetCarbonationVol: blankRecipe.targetCarbonationVol,
      beerTempAtBottlingC: blankRecipe.beerTempAtBottlingC,
      grains: blankRecipe.grains,
      hops: blankRecipe.hops,
      yeast: blankRecipe.yeast
    });

    setRecipes([blankRecipe, ...recipes]);
    setCurrentRecipe(blankRecipe);
    setActiveTab('calculator');
  };

  const handleSelectRecipe = (r: Recipe) => {
    setCurrentRecipe(r);
    setActiveTab('calculator');
  };

  const handleToggleFavorite = (recipeId: string) => {
    setRecipes(
      recipes.map(r => {
        if (r.id !== recipeId) return r;
        const isFav = r.collection === 'favorites';
        return { ...r, collection: isFav ? undefined : 'favorites' };
      })
    );
  };

  const handleSetCollection = (recipeId: string, col: Recipe['collection']) => {
    setRecipes(
      recipes.map(r => (r.id === recipeId ? { ...r, collection: col } : r))
    );
  };

  const handleDeleteRecipe = (recipeId: string) => {
    setRecipes(recipes.filter(r => r.id !== recipeId));
    if (currentRecipe.id === recipeId && recipes.length > 1) {
      setCurrentRecipe(recipes.find(r => r.id !== recipeId) || INITIAL_RECIPES[0]);
    }
  };

  const handleStartBrewBatch = (r: Recipe) => {
    setCurrentRecipe(r);
    setActiveTab('calendar');
  };

  const handleSendToAiStudio = (r: Recipe) => {
    setCurrentRecipe(r);
    setActiveTab('ai_lab');
  };

  // Создание авторского рецепта на основе остатков из кладовой
  const handleCreateCustomFromPantry = () => {
    const pantryGrains = inventory.filter(i => i.category === 'grain' && i.amount > 0);
    const pantryHops = inventory.filter(i => i.category === 'hop' && i.amount > 0);
    const pantryYeast = inventory.find(i => i.category === 'yeast' && i.amount > 0);

    const grains = pantryGrains.slice(0, 3).map((g, idx) => ({
      id: `g_cust_${Date.now()}_${idx}`,
      name: g.name,
      weightKg: Math.min(g.amount, idx === 0 ? 4.5 : 0.5),
      potentialSg: g.potentialSgOrAlpha || 1.037,
      colorEbc: g.colorEbc || 5.0,
      type: (idx === 0 ? 'base' : 'caramel') as any
    }));

    const hops = pantryHops.slice(0, 2).map((h, idx) => ({
      id: `h_cust_${Date.now()}_${idx}`,
      name: h.name,
      weightG: Math.min(h.amount, idx === 0 ? 20 : 30),
      alphaAcid: h.potentialSgOrAlpha || 10.0,
      boilTimeMin: idx === 0 ? 60 : 15,
      use: 'boil' as const
    }));

    const newRecipe: Recipe = {
      id: `recipe_custom_pantry_${Date.now()}`,
      name: 'Авторский эль из запасов',
      style: 'American Pale Ale',
      category: 'Эли / Хмелевые',
      description: 'Сварен из ингредиентов, имеющихся в домашней кладовой пивовара.',
      author: 'Вы',
      batchSizeL: globalBatchSizeL,
      boilTimeMin: 60,
      efficiencyPercent: 72,
      grainRatioLPerKg: 3.5,
      grainTempC: 20,
      targetCarbonationVol: 2.4,
      beerTempAtBottlingC: 19,
      grains: grains.length > 0 ? grains : [
        { id: `g_1`, name: 'Pilsner Malt', weightKg: 4.5, potentialSg: 1.037, colorEbc: 3.5, type: 'base' }
      ],
      hops: hops.length > 0 ? hops : [
        { id: `h_1`, name: 'Magnum', weightG: 20, alphaAcid: 14.0, boilTimeMin: 60, use: 'boil' }
      ],
      mashSchedule: [
        { id: 'm1', name: 'Осахаривание', tempC: 66, timeMin: 60, type: 'maltose' },
        { id: 'm2', name: 'Мэшаут', tempC: 78, timeMin: 10, type: 'mashout' }
      ],
      yeast: pantryYeast ? {
        name: pantryYeast.name,
        lab: 'Fermentis',
        form: 'dry',
        type: 'ale',
        cellsPerGramOrVial: 20,
        attenuationPercent: 80,
        tempRange: [18, 24]
      } : INITIAL_RECIPES[1].yeast,
      calculated: {} as any,
      tags: ['Из кладовой', 'Авторский'],
      isCustom: true,
      collection: 'my_recipes',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    newRecipe.calculated = calculateBrewMetrics({
      batchSizeL: newRecipe.batchSizeL,
      boilTimeMin: newRecipe.boilTimeMin,
      efficiencyPercent: newRecipe.efficiencyPercent,
      grainRatioLPerKg: newRecipe.grainRatioLPerKg,
      grainTempC: newRecipe.grainTempC,
      targetCarbonationVol: newRecipe.targetCarbonationVol,
      beerTempAtBottlingC: newRecipe.beerTempAtBottlingC,
      grains: newRecipe.grains,
      hops: newRecipe.hops,
      yeast: newRecipe.yeast
    });

    setRecipes([newRecipe, ...recipes]);
    setCurrentRecipe(newRecipe);
    setActiveTab('calculator');
  };

  // Печать варочного листа в PDF
  const handlePrintSheet = () => {
    window.print();
  };

  // Полный снимок данных для облачной синхронизации
  const fullDataPayload = {
    recipes,
    inventory,
    batches,
    logs,
    lifehacks,
    version: '1.0'
  };

  const handleRestoreFullData = (data: any) => {
    if (data.recipes && Array.isArray(data.recipes)) setRecipes(data.recipes);
    if (data.inventory && Array.isArray(data.inventory)) setInventory(data.inventory);
    if (data.batches && Array.isArray(data.batches)) setBatches(data.batches);
    if (data.logs && Array.isArray(data.logs)) setLogs(data.logs);
    if (data.lifehacks && Array.isArray(data.lifehacks)) setLifehacks(data.lifehacks);
  };

  const handleAddRecipeToList = (recipe: Recipe, openInCalculator?: boolean) => {
    setRecipes(prev => {
      const idx = prev.findIndex(r => r.id === recipe.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = recipe;
        return copy;
      }
      return [recipe, ...prev];
    });
    if (openInCalculator) {
      setCurrentRecipe(recipe);
      setActiveTab('calculator');
    }
  };

  const activeBatchesCount = batches.filter(b => !b.isFinished).length;

  return (
    <div className="min-h-screen bg-stone-100/60 dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-sans transition-colors">
      {/* Навигационная панель */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        onOpenCloudSync={() => setCloudModalOpen(true)}
        onPrintSheet={handlePrintSheet}
        onOpenBeerXmlModal={() => setCloudModalOpen(true)}
        isOffline={isOffline}
        activeBatchesCount={activeBatchesCount}
        globalBatchSizeL={globalBatchSizeL}
        onSetGlobalBatchSizeL={setGlobalBatchSizeL}
        onOpenHistory={() => handleOpenHistory()}
      />

      {/* Основной контент */}
      <main
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="no-print w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-36 sm:pb-16 pl-[max(0.75rem,env(safe-area-inset-left,0px))] pr-[max(0.75rem,env(safe-area-inset-right,0px))]"
      >
        {activeTab === 'calculator' && (
          <RecipeBuilder
            recipe={currentRecipe}
            onUpdateRecipe={(updated) => {
              setCurrentRecipe(updated);
              setRecipes(recipes.map(r => (r.id === updated.id ? updated : r)));
            }}
            onSaveRecipe={handleSaveRecipe}
            onSendToAiStudio={handleSendToAiStudio}
            onStartBrewBatch={handleStartBrewBatch}
            onPrintSheet={handlePrintSheet}
            onOpenNewRecipeModal={() => setNewRecipeModalOpen(true)}
            onOpenHistory={handleOpenHistory}
          />
        )}

        {activeTab === 'matcher' && (
          <IngredientMatcher
            inventory={inventory}
            recipes={recipes}
            onUpdateInventory={setInventory}
            onSelectRecipe={handleSelectRecipe}
            globalBatchSizeL={globalBatchSizeL}
            onSetGlobalBatchSizeL={setGlobalBatchSizeL}
            onCreateCustomRecipeFromPantry={handleCreateCustomFromPantry}
          />
        )}

        {activeTab === 'catalogue' && (
          <RecipeCatalogue
            recipes={recipes}
            onSelectRecipe={handleSelectRecipe}
            onCreateNewRecipe={() => setNewRecipeModalOpen(true)}
            onAddRecipeToList={handleAddRecipeToList}
            onToggleFavorite={handleToggleFavorite}
            onSetCollection={handleSetCollection}
            onDeleteRecipe={handleDeleteRecipe}
            onExportBeerXml={(r) => {
              setCurrentRecipe(r);
              setCloudModalOpen(true);
            }}
            onPrintRecipe={(r) => {
              setCurrentRecipe(r);
              setTimeout(() => window.print(), 100);
            }}
            onStartBrewBatch={handleStartBrewBatch}
            onOpenHistory={handleOpenHistory}
          />
        )}

        {activeTab === 'ai_lab' && (
          <AiStudioLabelGenerator
            recipe={currentRecipe}
            onUpdateRecipe={(updated) => {
              setCurrentRecipe(updated);
              setRecipes(recipes.map(r => (r.id === updated.id ? updated : r)));
            }}
          />
        )}

        {activeTab === 'calendar' && (
          <BrewCalendar
            batches={batches}
            recipes={recipes}
            onUpdateBatches={setBatches}
            onOpenRecipe={handleSelectRecipe}
          />
        )}

        {activeTab === 'logs' && (
          <BrewLogJournal
            logs={logs}
            recipes={recipes}
            onUpdateLogs={setLogs}
          />
        )}

        {activeTab === 'lifehacks' && (
          <LifehacksGuide
            lifehacks={lifehacks}
            onUpdateLifehacks={setLifehacks}
            onOpenHistory={handleOpenHistory}
          />
        )}

        {activeTab === 'community' && (
          <CommunityFeed
            posts={posts}
            recipes={recipes}
            onUpdatePosts={setPosts}
          />
        )}
      </main>

      {/* Выделенный лист для печати варочного листа в PDF через браузер */}
      <PrintableBrewSheet recipe={currentRecipe} />

      {/* Модальное окно синхронизации, BeerXML и бэкапов */}
      <CloudSyncModal
        isOpen={cloudModalOpen}
        onClose={() => setCloudModalOpen(false)}
        currentRecipe={currentRecipe}
        onImportRecipe={(imported) => {
          setRecipes([imported, ...recipes]);
          setCurrentRecipe(imported);
          setActiveTab('calculator');
        }}
        fullDataPayload={fullDataPayload}
        onRestoreFullData={handleRestoreFullData}
        syncCode={syncCode}
        setSyncCode={setSyncCode}
      />

      {/* Модальное окно создания рецепта (чистый шаблон с нуля или стиль BJCP) */}
      <NewRecipeModal
        isOpen={newRecipeModalOpen}
        onClose={() => setNewRecipeModalOpen(false)}
        onCreateRecipe={(newRecipe) => {
          setRecipes([newRecipe, ...recipes]);
          setCurrentRecipe(newRecipe);
          setActiveTab('calculator');
        }}
        defaultBatchSizeL={globalBatchSizeL}
      />

      {/* Модальное окно истории пивоварения и первоисточников */}
      <BrewingHistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        initialMomentId={historyInitialMomentId}
      />
    </div>
  );
}
