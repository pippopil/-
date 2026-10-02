import React from 'react';
import {
  Beer,
  Calculator,
  Search,
  BookOpen,
  Sparkles,
  Calendar,
  ClipboardList,
  Lightbulb,
  Users,
  Sun,
  Moon,
  Cloud,
  Printer,
  FileCode,
  Wifi,
  WifiOff
} from 'lucide-react';

export type ActiveTab =
  | 'calculator'
  | 'matcher'
  | 'catalogue'
  | 'ai_lab'
  | 'calendar'
  | 'logs'
  | 'lifehacks'
  | 'community';

interface Props {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  onOpenCloudSync: () => void;
  onPrintSheet: () => void;
  onOpenBeerXmlModal: () => void;
  isOffline: boolean;
  activeBatchesCount: number;
}

export const Navbar: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  isDarkMode,
  setIsDarkMode,
  onOpenCloudSync,
  onPrintSheet,
  onOpenBeerXmlModal,
  isOffline,
  activeBatchesCount
}) => {
  const navItems = [
    { id: 'calculator', label: 'Калькулятор', icon: Calculator, desc: 'Расчет и конструктор рецепта' },
    { id: 'matcher', label: 'Подбор по остаткам', icon: Search, desc: 'Что сварить из кладовой' },
    { id: 'catalogue', label: 'База рецептов', icon: BookOpen, desc: 'BJCP каталог и личные' },
    { id: 'ai_lab', label: 'ИИ & Этикетки', icon: Sparkles, desc: 'Генератор названий и дизайн' },
    {
      id: 'calendar',
      label: 'Календарь',
      icon: Calendar,
      badge: activeBatchesCount > 0 ? activeBatchesCount : undefined,
      desc: 'Сроки выдержки и уведомления'
    },
    { id: 'logs', label: 'Журнал варок', icon: ClipboardList, desc: 'Дневник и дегустации' },
    { id: 'lifehacks', label: 'Лайфхаки', icon: Lightbulb, desc: 'Советы и отзывы пивоваров' },
    { id: 'community', label: 'Сообщество', icon: Users, desc: 'Обмен опытом и фото' }
  ];

  return (
    <header className="no-print sticky top-0 z-30 bg-white/95 dark:bg-stone-900/95 backdrop-blur border-b border-amber-200/60 dark:border-stone-800 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            onClick={() => setActiveTab('calculator')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Beer className="w-6 h-6" />
            </div>
            <div>
              <div className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-amber-600 to-amber-800 dark:from-amber-400 dark:to-amber-600 bg-clip-text text-transparent">
                МастерВарка
              </div>
              <div className="text-[11px] text-stone-500 dark:text-stone-400 -mt-1 font-medium hidden sm:block">
                Лаборатория & Калькулятор Пивовара
              </div>
            </div>
          </div>

          {/* Action buttons (Sync, Print, Theme, Offline badge) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Offline status indicator */}
            <div
              title={isOffline ? 'Работает в автономном офлайн-режиме' : 'Связь с сервером активна'}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                isOffline
                  ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                  : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              }`}
            >
              {isOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
              <span className="hidden md:inline">{isOffline ? 'Офлайн режим' : 'Онлайн'}</span>
            </div>

            {/* Cloud Sync */}
            <button
              onClick={onOpenCloudSync}
              title="Облачная синхронизация между устройствами"
              className="p-2 rounded-lg text-stone-700 hover:text-amber-700 hover:bg-amber-50 dark:text-stone-300 dark:hover:text-amber-400 dark:hover:bg-stone-800 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <Cloud className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="hidden sm:inline">Синхронизация</span>
            </button>

            {/* BeerXML / Backup */}
            <button
              onClick={onOpenBeerXmlModal}
              title="Импорт и Экспорт BeerXML / JSON"
              className="p-2 rounded-lg text-stone-700 hover:text-amber-700 hover:bg-amber-50 dark:text-stone-300 dark:hover:text-amber-400 dark:hover:bg-stone-800 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <FileCode className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="hidden sm:inline">BeerXML</span>
            </button>

            {/* Print brew sheet */}
            <button
              onClick={onPrintSheet}
              title="Распечатать варочный лист в PDF"
              className="p-2 rounded-lg text-stone-700 hover:text-amber-700 hover:bg-amber-50 dark:text-stone-300 dark:hover:text-amber-400 dark:hover:bg-stone-800 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <Printer className="w-4 h-4 text-stone-600 dark:text-stone-400" />
              <span className="hidden sm:inline">PDF Печать</span>
            </button>

            {/* Dark mode switch */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              title={isDarkMode ? 'Включить светлую тему' : 'Включить тёмную тему'}
              className="p-2 rounded-lg text-stone-700 hover:text-amber-600 hover:bg-amber-50 dark:text-stone-300 dark:hover:text-amber-400 dark:hover:bg-stone-800 transition-colors"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar border-t border-stone-100 dark:border-stone-800/80">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as ActiveTab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 relative ${
                  isActive
                    ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/25'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-stone-200 dark:hover:bg-stone-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-amber-600 dark:text-amber-400'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
