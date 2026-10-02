import React, { useState } from 'react';
import { Lifehack } from '../types/brewing';
import {
  Lightbulb,
  ThumbsUp,
  Plus,
  Filter,
  Search,
  CheckCircle2,
  Flame,
  Droplets,
  ShieldCheck,
  Package
} from 'lucide-react';

interface Props {
  lifehacks: Lifehack[];
  onUpdateLifehacks: (lhs: Lifehack[]) => void;
}

export const LifehacksGuide: React.FC<Props> = ({ lifehacks, onUpdateLifehacks }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  // Форма добавления нового лайфхака
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Lifehack['category']>('fermentation');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [proTip, setProTip] = useState('');
  const [author, setAuthor] = useState('');

  const handleVote = (id: string) => {
    onUpdateLifehacks(
      lifehacks.map(lh => {
        if (lh.id !== id) return lh;
        const up = !lh.upvoted;
        return {
          ...lh,
          rating: up ? lh.rating + 1 : lh.rating - 1,
          upvoted: up
        };
      })
    );
  };

  const handleAddLifehack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const newLh: Lifehack = {
      id: `lh_${Date.now()}`,
      title: title.trim(),
      category,
      summary: summary.trim() || title.trim(),
      content: content.trim(),
      author: author.trim() || 'Домашний пивовар',
      rating: 1,
      upvoted: true,
      proTip: proTip.trim() || 'Проверяйте чистоту оборудования перед каждым шагом!'
    };

    onUpdateLifehacks([newLh, ...lifehacks]);
    setTitle('');
    setContent('');
    setSummary('');
    setProTip('');
    setAuthor('');
    setModalOpen(false);
  };

  const categories = [
    { id: 'all', label: 'Все лайфхаки' },
    { id: 'mashing', label: 'Затирание' },
    { id: 'boiling', label: 'Кипячение & Хмель' },
    { id: 'fermentation', label: 'Брожение & Дрожжи' },
    { id: 'bottling', label: 'Розлив & Карбонизация' },
    { id: 'sanitation', label: 'Санитария' }
  ];

  const filtered = lifehacks.filter(lh => {
    const matchCat = activeCategory === 'all' || lh.category === activeCategory;
    const matchText =
      lh.title.toLowerCase().includes(search.toLowerCase()) ||
      lh.content.toLowerCase().includes(search.toLowerCase()) ||
      lh.proTip.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchText;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Шапка лайфхаков */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 sm:p-6 shadow-sm border border-stone-200/80 dark:border-stone-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white flex items-center gap-2">
              <Lightbulb className="w-6 h-6 text-amber-500" />
              <span>Лайфхаки пивоварения на основе отзывов</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Проверенные секреты домашних мастеров: прозрачность, вирпул, защита от окисления и карбонизация
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-amber-500/20 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Поделиться лайфхаком</span>
          </button>
        </div>

        {/* Категории и поиск */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Поиск по теме (напр. мох, чиллер, диацетил, кислород)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-amber-500 text-white'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Сетка карточек лайфхаков */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map(lh => (
          <div
            key={lh.id}
            className="bg-white dark:bg-stone-900 rounded-2xl p-5 border border-stone-200/90 dark:border-stone-800 shadow-xs space-y-4 hover:border-amber-400 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                  {lh.category === 'mashing' ? 'Затирание' : lh.category === 'boiling' ? 'Кипячение' : lh.category === 'fermentation' ? 'Брожение' : lh.category === 'bottling' ? 'Розлив' : 'Санитария'}
                </span>

                <button
                  onClick={() => handleVote(lh.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${
                    lh.upvoted
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-amber-100'
                  }`}
                  title="Отметить как полезный совет"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{lh.rating}</span>
                </button>
              </div>

              <h3 className="font-extrabold text-base text-stone-900 dark:text-white mt-2 leading-tight">
                {lh.title}
              </h3>

              <p className="text-xs text-stone-600 dark:text-stone-300 mt-2 leading-relaxed">
                {lh.content}
              </p>

              {/* Pro-Tip блок */}
              {lh.proTip && (
                <div className="mt-3 p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200">
                  <span className="font-bold flex items-center gap-1 mb-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    Совет от профи:
                  </span>
                  <span>{lh.proTip}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-stone-100 dark:border-stone-800 text-[11px] text-stone-400">
              Автор: <b className="text-stone-600 dark:text-stone-300">{lh.author}</b>
            </div>
          </div>
        ))}
      </div>

      {/* Модальное окно добавления лайфхака */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAddLifehack}
            className="bg-white dark:bg-stone-900 rounded-2xl p-6 max-w-md w-full shadow-xl border border-stone-200 dark:border-stone-800 space-y-4"
          >
            <div className="flex justify-between items-center border-b border-stone-100 dark:border-stone-800 pb-3">
              <h3 className="font-bold text-base text-stone-900 dark:text-white flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-600" />
                <span>Поделиться своим лайфхаком</span>
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-stone-500 block mb-1 font-semibold">Заголовок совета:</label>
                <input
                  type="text"
                  placeholder="напр. Быстрое осаждение дрожжей желатином"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-stone-500 block mb-1 font-semibold">Категория:</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 font-semibold"
                >
                  <option value="mashing">Затирание солода</option>
                  <option value="boiling">Кипячение и хмель</option>
                  <option value="fermentation">Брожение и дрожжи</option>
                  <option value="bottling">Розлив и карбонизация</option>
                  <option value="sanitation">Санитария и дезинфекция</option>
                </select>
              </div>

              <div>
                <label className="text-stone-500 block mb-1 font-semibold">Описание секрета / метода:</label>
                <textarea
                  rows={4}
                  placeholder="Подробно опишите, как и когда применять этот метод..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="text-stone-500 block mb-1 font-semibold">Главный совет (Pro-Tip):</label>
                <input
                  type="text"
                  placeholder="напр. Растворяйте желатин в воде не горячее 65°C"
                  value={proTip}
                  onChange={(e) => setProTip(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="text-stone-500 block mb-1 font-semibold">Ваше имя или псевдоним:</label>
                <input
                  type="text"
                  placeholder="напр. Иван, домашний пивовар"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-semibold"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm"
              >
                Опубликовать совет
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
