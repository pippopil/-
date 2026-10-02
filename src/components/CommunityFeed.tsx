import React, { useState } from 'react';
import { CommunityPost, Recipe } from '../types/brewing';
import {
  Users,
  Heart,
  MessageCircle,
  Plus,
  Send,
  Beer,
  Award,
  Calendar,
  Image as ImageIcon
} from 'lucide-react';

interface Props {
  posts: CommunityPost[];
  recipes: Recipe[];
  onUpdatePosts: (posts: CommunityPost[]) => void;
}

export const CommunityFeed: React.FC<Props> = ({ posts, recipes, onUpdatePosts }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [newCommentText, setNewCommentText] = useState<{ [postId: string]: string }>({});

  // Форма нового поста
  const [authorName, setAuthorName] = useState('Домашний Мастер');
  const [selectedRecipeName, setSelectedRecipeName] = useState(recipes[0]?.name || 'Citra Wave IPA');
  const [styleName, setStyleName] = useState(recipes[0]?.style || 'American IPA');
  const [postAbv, setPostAbv] = useState<number>(recipes[0]?.calculated.abv || 6.2);
  const [postIbu, setPostIbu] = useState<number>(recipes[0]?.calculated.ibu || 55);
  const [postStory, setPostStory] = useState('');
  const [postScore, setPostScore] = useState<number>(47);
  const [postImageUrl, setPostImageUrl] = useState(
    'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=800&auto=format&fit=crop&q=80'
  );

  const samplePhotos = [
    { label: 'Золотистый эль', url: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=800&auto=format&fit=crop&q=80' },
    { label: 'Пшеничный вайцен', url: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=800&auto=format&fit=crop&q=80' },
    { label: 'Темный стаут', url: 'https://images.unsplash.com/photo-1575037614876-c38a4d44f5b8?w=800&auto=format&fit=crop&q=80' },
    { label: 'Чешский лагер', url: 'https://images.unsplash.com/photo-1567696911980-2eed69a46042?w=800&auto=format&fit=crop&q=80' }
  ];

  const handleLike = (postId: string) => {
    onUpdatePosts(
      posts.map(p => {
        if (p.id !== postId) return p;
        const liked = !p.likedByMe;
        return {
          ...p,
          likedByMe: liked,
          likesCount: liked ? p.likesCount + 1 : p.likesCount - 1
        };
      })
    );
  };

  const handleAddComment = (postId: string) => {
    const text = newCommentText[postId];
    if (!text || !text.trim()) return;

    onUpdatePosts(
      posts.map(p => {
        if (p.id !== postId) return p;
        return {
          ...p,
          comments: [
            ...p.comments,
            {
              id: `c_${Date.now()}`,
              author: 'Вы',
              text: text.trim(),
              date: 'Только что'
            }
          ]
        };
      })
    );

    setNewCommentText(prev => ({ ...prev, [postId]: '' }));
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postStory.trim()) return;

    const newPost: CommunityPost = {
      id: `post_${Date.now()}`,
      author: authorName.trim() || 'Пивовар',
      authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      recipeName: selectedRecipeName,
      style: styleName,
      abv: postAbv,
      ibu: postIbu,
      brewDate: new Date().toISOString().split('T')[0],
      imageUrl: postImageUrl,
      story: postStory.trim(),
      tastingScore: postScore,
      likesCount: 0,
      likedByMe: false,
      comments: [],
      createdAt: new Date().toISOString()
    };

    onUpdatePosts([newPost, ...posts]);
    setPostStory('');
    setModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Шапка сообщества */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 sm:p-6 shadow-sm border border-stone-200/80 dark:border-stone-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-amber-500" />
              <span>Социальная лента домашних пивоваров</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Обмен опытом, фотографии готового пива в бокале, обсуждение карбонизации и дегустационные отчеты
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-amber-500/20 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Опубликовать свою варку</span>
          </button>
        </div>
      </div>

      {/* Лента публикаций */}
      <div className="max-w-2xl mx-auto space-y-6">
        {posts.map(post => (
          <article
            key={post.id}
            className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/90 dark:border-stone-800 shadow-sm overflow-hidden space-y-4"
          >
            {/* Автор и рецепт */}
            <div className="p-5 pb-0 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={post.authorAvatar}
                  alt={post.author}
                  className="w-10 h-10 rounded-full object-cover border border-amber-300 dark:border-amber-700"
                />
                <div>
                  <h4 className="font-bold text-sm text-stone-900 dark:text-white">{post.author}</h4>
                  <div className="text-[11px] text-stone-500 flex items-center gap-2">
                    <span>{post.style}</span>
                    <span>•</span>
                    <span>{post.recipeName}</span>
                  </div>
                </div>
              </div>

              {/* Баллы BJCP */}
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold">
                <Award className="w-3.5 h-3.5 text-amber-600" />
                <span>{post.tastingScore} / 50</span>
              </div>
            </div>

            {/* Фотография готового пива */}
            {post.imageUrl && (
              <div className="relative w-full aspect-4/3 bg-stone-950 overflow-hidden">
                <img
                  src={post.imageUrl}
                  alt={post.recipeName}
                  className="w-full h-full object-cover hover:scale-102 transition-transform duration-500"
                />
                {/* Бейдж характеристик поверх фото */}
                <div className="absolute bottom-3 left-3 flex gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-xs text-white text-xs font-mono font-bold">
                    {post.abv}% ABV
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-xs text-amber-400 text-xs font-mono font-bold">
                    {post.ibu} IBU
                  </span>
                </div>
              </div>
            )}

            {/* Текст и впечатление */}
            <div className="px-5 space-y-3">
              <p className="text-xs sm:text-sm text-stone-800 dark:text-stone-200 leading-relaxed">
                {post.story}
              </p>

              {/* Кнопки лайков и комментов */}
              <div className="flex items-center gap-4 pt-2 border-t border-stone-100 dark:border-stone-800 text-xs font-semibold">
                <button
                  onClick={() => handleLike(post.id)}
                  className={`flex items-center gap-1.5 transition-colors ${
                    post.likedByMe
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-stone-500 hover:text-rose-600'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${post.likedByMe ? 'fill-rose-500' : ''}`} />
                  <span>{post.likesCount} оценили</span>
                </button>

                <div className="flex items-center gap-1.5 text-stone-500">
                  <MessageCircle className="w-4 h-4" />
                  <span>{post.comments.length} комментариев</span>
                </div>
              </div>

              {/* Список комментариев */}
              {post.comments.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-800/80">
                  {post.comments.map(c => (
                    <div key={c.id} className="text-xs bg-stone-50 dark:bg-stone-800/50 p-2.5 rounded-xl space-y-0.5">
                      <div className="flex justify-between items-center text-stone-500 text-[10px]">
                        <span className="font-bold text-stone-800 dark:text-stone-200">{c.author}</span>
                        <span>{c.date}</span>
                      </div>
                      <p className="text-stone-700 dark:text-stone-300">{c.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Поле добавления комментария */}
              <div className="pt-2 pb-5 flex gap-2">
                <input
                  type="text"
                  placeholder="Написать комментарий или задать вопрос по варке..."
                  value={newCommentText[post.id] || ''}
                  onChange={(e) => setNewCommentText({ ...newCommentText, [post.id]: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddComment(post.id);
                  }}
                  className="flex-1 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <button
                  onClick={() => handleAddComment(post.id)}
                  className="p-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Модальное окно создания публикации */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreatePost}
            className="bg-white dark:bg-stone-900 rounded-2xl p-6 max-w-lg w-full shadow-xl border border-stone-200 dark:border-stone-800 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center border-b border-stone-100 dark:border-stone-800 pb-3">
              <h3 className="font-bold text-base text-stone-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-500" />
                <span>Опубликовать отзыв о готовом пиве</span>
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
                <label className="text-stone-500 block mb-1 font-semibold">Ваше имя / Пивоварня:</label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-stone-500 block mb-1 font-semibold">Рецепт:</label>
                  <select
                    value={selectedRecipeName}
                    onChange={(e) => {
                      setSelectedRecipeName(e.target.value);
                      const found = recipes.find(r => r.name === e.target.value);
                      if (found) {
                        setStyleName(found.style);
                        setPostAbv(found.calculated.abv);
                        setPostIbu(found.calculated.ibu);
                      }
                    }}
                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 font-semibold"
                  >
                    {recipes.map(r => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-stone-500 block mb-1 font-semibold">Стиль пива:</label>
                  <input
                    type="text"
                    value={styleName}
                    onChange={(e) => setStyleName(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-stone-500 block mb-1">Крепость ABV %:</label>
                  <input
                    type="number"
                    step="0.1"
                    value={postAbv}
                    onChange={(e) => setPostAbv(parseFloat(e.target.value) || 5.0)}
                    className="w-full bg-stone-50 dark:bg-stone-800 border rounded-xl px-2.5 py-1.5 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-stone-500 block mb-1">Горечь IBU:</label>
                  <input
                    type="number"
                    value={postIbu}
                    onChange={(e) => setPostIbu(parseInt(e.target.value, 10) || 30)}
                    className="w-full bg-stone-50 dark:bg-stone-800 border rounded-xl px-2.5 py-1.5 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-stone-500 block mb-1">Оценка (из 50):</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={postScore}
                    onChange={(e) => setPostScore(parseInt(e.target.value, 10) || 45)}
                    className="w-full bg-stone-50 dark:bg-stone-800 border rounded-xl px-2.5 py-1.5 font-mono font-bold text-amber-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-stone-500 block mb-1 font-semibold">Выберите фотографию готового пива:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                  {samplePhotos.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPostImageUrl(p.url)}
                      className={`p-1 rounded-xl border overflow-hidden transition-all ${
                        postImageUrl === p.url ? 'border-amber-500 ring-2 ring-amber-500/30' : 'border-stone-200 dark:border-stone-700'
                      }`}
                    >
                      <img src={p.url} alt={p.label} className="w-full h-16 object-cover rounded-lg" />
                      <span className="text-[10px] text-stone-500 block text-center mt-1 truncate">{p.label}</span>
                    </button>
                  ))}
                </div>
                <input
                  type="url"
                  placeholder="Или вставьте прямую ссылку на фото..."
                  value={postImageUrl}
                  onChange={(e) => setPostImageUrl(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-1.5 text-xs"
                />
              </div>

              <div>
                <label className="text-stone-500 block mb-1 font-semibold">Впечатления, дегустация и советы:</label>
                <textarea
                  rows={4}
                  placeholder="Расскажите о пене, аромате, сколько дней карбонизировали и что порадовало..."
                  value={postStory}
                  onChange={(e) => setPostStory(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs"
                  required
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
                Опубликовать в ленту
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
