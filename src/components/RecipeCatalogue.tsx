import React, { useState, useMemo } from 'react';
import { Recipe } from '../types/brewing';
import { ebcToHex } from '../utils/brewingMath';
import {
  Search,
  Plus,
  Star,
  Bookmark,
  Beer,
  Trash2,
  FileCode,
  Printer,
  ArrowRight,
  Filter,
  CheckCircle2,
  Calendar
} from 'lucide-react';

interface Props {
  recipes: Recipe[];
  onSelectRecipe: (recipe: Recipe) => void;
  onCreateNewRecipe: () => void;
  onToggleFavorite: (recipeId: string) => void;
  onSetCollection: (recipeId: string, col: Recipe['collection']) => void;
  onDeleteRecipe: (recipeId: string) => void;
  onExportBeerXml: (recipe: Recipe) => void;
  onPrintRecipe: (recipe: Recipe) => void;
  onStartBrewBatch: (recipe: Recipe) => void;
}

export const RecipeCatalogue: React.FC<Props> = ({
  recipes,
  onSelectRecipe,
  onCreateNewRecipe,
  onToggleFavorite,
  onSetCollection,
  onDeleteRecipe,
  onExportBeerXml,
  onPrintRecipe,
  onStartBrewBatch
}) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [collectionFilter, setCollectionFilter] = useState<'all' | 'favorites' | 'planned' | 'my_recipes'>('all');

  const categories = useMemo(() => {
    return Array.from(new Set(recipes.map(r => r.category)));
  }, [recipes]);

  const filteredRecipes = useMemo(() => {
    return recipes.filter(r => {
      const matchSearch =
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.style.toLowerCase().includes(search.toLowerCase()) ||
        r.description.toLowerCase().includes(search.toLowerCase()) ||
        r.grains.some(g => g.name.toLowerCase().includes(search.toLowerCase())) ||
        r.hops.some(h => h.name.toLowerCase().includes(search.toLowerCase())) ||
        r.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));

      if (!matchSearch) return false;

      if (activeCategory !== 'all' && r.category !== activeCategory) return false;

      if (collectionFilter === 'favorites' && r.collection !== 'favorites') return false;
      if (collectionFilter === 'planned' && r.collection !== 'planned') return false;
      if (collectionFilter === 'my_recipes' && !r.isCustom) return false;

      return true;
    });
  }, [recipes, search, activeCategory, collectionFilter]);

  return (
    <div className="space-y-6 pb-12">
      {/* Шапка каталога и фильтры */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 sm:p-6 shadow-sm border border-stone-200/80 dark:border-stone-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white flex items-center gap-2">
              <Beer className="w-6 h-6 text-amber-500" />
              <span>База рецептов пивоварения ({filteredRecipes.length})</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Проверенные эталонные стили BJCP и ваши авторские крафтовые варки
            </p>
          </div>

          <button
            onClick={onCreateNewRecipe}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-amber-500/20 transition-all self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Создать новый рецепт</span>
          </button>
        </div>

        {/* Табы подборок */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: 'Все рецепты' },
            { id: 'favorites', label: 'Избранное ⭐' },
            { id: 'planned', label: 'Планирую сварить 📌' },
            { id: 'my_recipes', label: 'Мои авторские 🛠️' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setCollectionFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                collectionFilter === tab.id
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Поиск и категории */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Поиск по названию, стилю, сорту хмеля (напр. Citra, Пилснер)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <select
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value)}
            className="bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-semibold text-stone-800 dark:text-stone-200 focus:outline-none"
          >
            <option value="all">Все категории BJCP</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Сетка рецептов */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredRecipes.map((recipe) => {
          const hex = ebcToHex(recipe.calculated.ebc);
          const isFav = recipe.collection === 'favorites';
          const isPlanned = recipe.collection === 'planned';

          return (
            <div
              key={recipe.id}
              className="bg-white dark:bg-stone-900 rounded-2xl p-5 border border-stone-200/90 dark:border-stone-800 shadow-xs hover:border-amber-400 dark:hover:border-amber-600 transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Верхняя плашка карточки */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Визуальный маркер цвета пива */}
                    <div
                      className="w-11 h-11 rounded-xl shadow-xs border border-white/50 flex items-center justify-center shrink-0"
                      style={{ backgroundColor: hex }}
                      title={`Цвет: ${recipe.calculated.ebc} EBC (${recipe.calculated.srm} SRM)`}
                    >
                      <Beer className="w-5 h-5 text-white/90 drop-shadow" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-stone-900 dark:text-white leading-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {recipe.name}
                      </h3>
                      <div className="text-[11px] text-stone-500 font-medium mt-0.5">
                        {recipe.style}
                      </div>
                    </div>
                  </div>

                  {/* Кнопки коллекций */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onToggleFavorite(recipe.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isFav ? 'text-amber-500 bg-amber-50 dark:bg-amber-950' : 'text-stone-300 hover:text-amber-500'
                      }`}
                      title={isFav ? 'В избранном' : 'Добавить в избранное'}
                    >
                      <Star className={`w-4 h-4 ${isFav ? 'fill-amber-500' : ''}`} />
                    </button>

                    <button
                      onClick={() => onSetCollection(recipe.id, isPlanned ? undefined : 'planned')}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isPlanned ? 'text-blue-500 bg-blue-50 dark:bg-blue-950' : 'text-stone-300 hover:text-blue-500'
                      }`}
                      title={isPlanned ? 'В плане варки' : 'Запланировать варку'}
                    >
                      <Bookmark className={`w-4 h-4 ${isPlanned ? 'fill-blue-500' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Описание */}
                <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2 mt-3">
                  {recipe.description}
                </p>

                {/* Параметры партии */}
                <div className="grid grid-cols-4 gap-1.5 my-3 p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 text-center font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-stone-400 font-sans block">НП</span>
                    <b>{recipe.calculated.ogSg.toFixed(3)}</b>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 font-sans block">ABV</span>
                    <b className="text-amber-600 dark:text-amber-400">{recipe.calculated.abv}%</b>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 font-sans block">IBU</span>
                    <b>{recipe.calculated.ibu}</b>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 font-sans block">EBC</span>
                    <b>{recipe.calculated.ebc}</b>
                  </div>
                </div>

                {/* Теги хмелей и засыпи */}
                <div className="space-y-1 text-[11px]">
                  <div className="flex items-center gap-1 text-stone-500">
                    <span className="font-semibold text-stone-700 dark:text-stone-300">Хмели:</span>
                    <span className="line-clamp-1">
                      {recipe.hops.map(h => `${h.name} (${h.weightG}г)`).join(', ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-stone-500">
                    <span className="font-semibold text-stone-700 dark:text-stone-300">Дрожжи:</span>
                    <span className="line-clamp-1">{recipe.yeast.name}</span>
                  </div>
                </div>
              </div>

              {/* Нижняя панель действий */}
              <div className="pt-4 border-t border-stone-100 dark:border-stone-800/80 mt-4 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onExportBeerXml(recipe)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-amber-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                    title="Экспорт в BeerXML"
                  >
                    <FileCode className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onPrintRecipe(recipe)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-amber-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                    title="Печать варочного листа"
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onStartBrewBatch(recipe)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-emerald-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                    title="Запустить партию в календарь"
                  >
                    <Calendar className="w-4 h-4" />
                  </button>

                  {recipe.isCustom && (
                    <button
                      onClick={() => onDeleteRecipe(recipe.id)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                      title="Удалить авторский рецепт"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => onSelectRecipe(recipe)}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1 transition-colors shadow-xs"
                >
                  <span>В калькулятор</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
