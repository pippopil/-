import React, { useState } from 'react';
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
  WifiOff,
  Menu,
  X,
  Smartphone,
  Minus,
  Plus
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

export type ActiveTab =
  | 'calculator'
  | 'matcher'
  | 'catalogue'
  | 'ai_lab'
  | 'calendar'
  | 'logs'
  | 'lifehacks'
  | 'community'
  | 'install';

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
  globalBatchSizeL: number;
  onSetGlobalBatchSizeL: (sizeL: number) => void;
  onOpenInstallModal?: () => void;
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
  activeBatchesCount,
  globalBatchSizeL,
  onSetGlobalBatchSizeL
}) => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const navItems = [
    { id: 'calculator', label: 'Калькулятор', icon: Calculator },
    { id: 'catalogue', label: 'Рецепты (34)', icon: BookOpen },
    { id: 'matcher', label: 'Кладовая', icon: Search },
    {
      id: 'calendar',
      label: 'Календарь',
      icon: Calendar,
      badge: activeBatchesCount > 0 ? activeBatchesCount : undefined
    },
    { id: 'logs', label: 'Журнал варок', icon: ClipboardList },
    { id: 'ai_lab', label: 'ИИ Этикетки', icon: Sparkles },
    { id: 'lifehacks', label: 'Лайфхаки', icon: Lightbulb },
    { id: 'community', label: 'Клуб', icon: Users },
    { id: 'install', label: 'Установка', icon: Smartphone }
  ];

  const handleMobileTabSelect = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMobileDrawerOpen(false);
  };

  return (
    <>
      {/* Верхний хедер */}
      <header className="no-print sticky top-0 z-30 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-3">
            {/* Logo & Brand */}
            <button
              type="button"
              onClick={() => setActiveTab('calculator')}
              className="flex items-center gap-2.5 cursor-pointer text-left focus:outline-none"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white shadow-sm shadow-amber-500/30 shrink-0">
                <Beer className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <div className="font-extrabold text-base sm:text-lg tracking-tight text-stone-900 dark:text-white leading-tight">
                  Мастер<span className="text-amber-600 dark:text-amber-400">Варка</span>
                </div>
                <div className="text-[11px] text-stone-500 dark:text-stone-400 hidden md:block leading-none mt-0.5">
                  Калькулятор и рецепты крафтового пива
                </div>
              </div>
            </button>

            {/* Быстрый регулятор объема партии (Desktop) */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs">
              <span className="text-stone-500 dark:text-stone-400 font-medium">Объем варки:</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onSetGlobalBatchSizeL(Math.max(5, globalBatchSizeL - 5))}
                  className="w-5 h-5 rounded flex items-center justify-center bg-white dark:bg-stone-700 hover:bg-amber-100 text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
                  title="Уменьшить на 5 л"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <input
                  type="number"
                  min="2"
                  max="500"
                  value={globalBatchSizeL}
                  onChange={(e) => onSetGlobalBatchSizeL(Math.max(1, parseFloat(e.target.value) || 20))}
                  className="w-12 text-center font-mono font-bold text-amber-700 dark:text-amber-400 bg-transparent focus:outline-none"
                />
                <span className="font-bold text-stone-500 dark:text-stone-400">л</span>
                <button
                  type="button"
                  onClick={() => onSetGlobalBatchSizeL(Math.min(500, globalBatchSizeL + 5))}
                  className="w-5 h-5 rounded flex items-center justify-center bg-white dark:bg-stone-700 hover:bg-amber-100 text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
                  title="Увеличить на 5 л"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Кнопка установки приложения */}
              <button
                type="button"
                onClick={() => setActiveTab('install')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'install'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700'
                }`}
                title="Установить приложение на телефон или скачать APK"
              >
                <Smartphone className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span className="hidden sm:inline">Установить</span>
              </button>

              {/* Offline indicator */}
              <div
                title={isOffline ? 'Работает в автономном офлайн-режиме' : 'Связь с сервером активна'}
                className={`hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border ${
                  isOffline
                    ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                    : 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                }`}
              >
                {isOffline ? <WifiOff className="w-3 h-3 text-amber-600" /> : <Wifi className="w-3 h-3 text-emerald-600" />}
                <span>{isOffline ? 'Офлайн' : 'Онлайн'}</span>
              </div>

              {/* Cloud Sync */}
              <button
                type="button"
                onClick={onOpenCloudSync}
                title="Облачная синхронизация между телефоном и ПК"
                className="p-2 rounded-xl text-stone-700 hover:text-amber-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:text-amber-400 dark:hover:bg-stone-800 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              >
                <Cloud className="w-4 h-4 text-stone-600 dark:text-stone-400" />
                <span className="hidden xl:inline">Синхронизация</span>
              </button>

              {/* BeerXML / Backup */}
              <button
                type="button"
                onClick={onOpenBeerXmlModal}
                title="Импорт и Экспорт BeerXML / JSON"
                className="hidden md:flex p-2 rounded-xl text-stone-700 hover:text-amber-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:text-amber-400 dark:hover:bg-stone-800 transition-colors items-center gap-1.5 text-xs font-semibold cursor-pointer"
              >
                <FileCode className="w-4 h-4 text-stone-600 dark:text-stone-400" />
                <span className="hidden xl:inline">BeerXML</span>
              </button>

              {/* Print PDF */}
              <button
                type="button"
                onClick={onPrintSheet}
                title="Распечатать варочный лист в PDF"
                className="hidden sm:flex p-2 rounded-xl text-stone-700 hover:text-amber-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:text-amber-400 dark:hover:bg-stone-800 transition-colors items-center gap-1.5 text-xs font-semibold cursor-pointer"
              >
                <Printer className="w-4 h-4 text-stone-600 dark:text-stone-400" />
                <span className="hidden xl:inline">PDF</span>
              </button>

              {/* Переключатель световой темы */}
              <button
                type="button"
                onClick={() => setIsDarkMode(!isDarkMode)}
                title={isDarkMode ? 'Включить светлую тему' : 'Включить тёмную тему'}
                className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 transition-colors cursor-pointer"
                aria-label="Переключить тему"
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-stone-700" />}
              </button>
            </div>
          </div>

          {/* Десктопная панель табов */}
          <nav className="hidden sm:flex items-center gap-1 overflow-x-auto py-2 border-t border-stone-200/70 dark:border-stone-800 no-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id as ActiveTab)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-stone-500 dark:text-stone-400'}`} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300'
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

      {/* Мобильная нижняя навигационная панель */}
      <div className="no-print sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 px-2 py-1 flex justify-around items-center shadow-lg pb-[max(0.375rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={() => setActiveTab('calculator')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'calculator'
              ? 'text-amber-600 dark:text-amber-400 font-bold'
              : 'text-stone-500 dark:text-stone-400'
          }`}
        >
          <Calculator className="w-5 h-5" />
          <span className="text-[10px]">Варка</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('catalogue')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'catalogue'
              ? 'text-amber-600 dark:text-amber-400 font-bold'
              : 'text-stone-500 dark:text-stone-400'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px]">Рецепты</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('matcher')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'matcher'
              ? 'text-amber-600 dark:text-amber-400 font-bold'
              : 'text-stone-500 dark:text-stone-400'
          }`}
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px]">Остатки</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('calendar')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-xl transition-colors cursor-pointer relative ${
            activeTab === 'calendar'
              ? 'text-amber-600 dark:text-amber-400 font-bold'
              : 'text-stone-500 dark:text-stone-400'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px]">Брожение</span>
          {activeBatchesCount > 0 && (
            <span className="absolute -top-1 right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center">
              {activeBatchesCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setMobileDrawerOpen(true)}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-xl transition-colors cursor-pointer ${
            ['ai_lab', 'logs', 'lifehacks', 'community', 'install'].includes(activeTab) || mobileDrawerOpen
              ? 'text-amber-600 dark:text-amber-400 font-bold'
              : 'text-stone-500 dark:text-stone-400'
          }`}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px]">Ещё</span>
        </button>
      </div>

      {/* Мобильное всплывающее меню (Drawer) */}
      {mobileDrawerOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setMobileDrawerOpen(false);
          }}
          className="no-print sm:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs overscroll-contain animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-stone-900 rounded-t-3xl p-5 border-t border-stone-200 dark:border-stone-800 space-y-4 max-h-[85dvh] overflow-y-auto shadow-2xl relative"
          >
            <div className="flex justify-between items-center border-b border-stone-100 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold">
                  <Beer className="w-4 h-4" />
                </div>
                <div className="font-extrabold text-base text-stone-900 dark:text-white">
                  Разделы и Инструменты
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Выбор объема партии на мобильном */}
            <div className="p-3 rounded-2xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-between">
              <div className="text-xs">
                <span className="font-bold text-stone-900 dark:text-white block">Объем варки:</span>
                <span className="text-[11px] text-stone-500">Автопересчет ингредиентов</span>
              </div>
              <div className="flex items-center gap-1">
                {[10, 15, 20, 25, 30].map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => onSetGlobalBatchSizeL(v)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer ${
                      globalBatchSizeL === v
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    {v}л
                  </button>
                ))}
              </div>
            </div>

            {/* Дополнительные разделы */}
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => handleMobileTabSelect('logs')}
                className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-colors cursor-pointer ${
                  activeTab === 'logs'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                    : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200'
                }`}
              >
                <ClipboardList className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span>Журнал варок</span>
              </button>

              <button
                type="button"
                onClick={() => handleMobileTabSelect('ai_lab')}
                className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-colors cursor-pointer ${
                  activeTab === 'ai_lab'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                    : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span>ИИ Этикетки</span>
              </button>

              <button
                type="button"
                onClick={() => handleMobileTabSelect('lifehacks')}
                className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-colors cursor-pointer ${
                  activeTab === 'lifehacks'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                    : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200'
                }`}
              >
                <Lightbulb className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span>Лайфхаки</span>
              </button>

              <button
                type="button"
                onClick={() => handleMobileTabSelect('community')}
                className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-colors cursor-pointer ${
                  activeTab === 'community'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                    : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200'
                }`}
              >
                <Users className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span>Сообщество</span>
              </button>

              <button
                type="button"
                onClick={() => handleMobileTabSelect('install')}
                className={`col-span-2 p-3 rounded-2xl border flex items-center justify-between transition-colors cursor-pointer ${
                  activeTab === 'install'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                    : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Установка на телефон и сборка APK</span>
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100">
                  Android / iOS
                </span>
              </button>
            </div>

            {/* Быстрые действия */}
            <div className="pt-2 border-t border-stone-100 dark:border-stone-800 space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800">
                <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">Тема оформления:</span>
                <button
                  type="button"
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-stone-700 text-xs font-bold text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-600 flex items-center gap-1.5 shadow-2xs"
                >
                  {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
                  <span>{isDarkMode ? 'Светлая' : 'Тёмная'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setMobileDrawerOpen(false); onOpenCloudSync(); }}
                  className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <Cloud className="w-4 h-4 text-amber-500" />
                  <span>Синхронизация</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setMobileDrawerOpen(false); onOpenBeerXmlModal(); }}
                  className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <FileCode className="w-4 h-4 text-amber-500" />
                  <span>BeerXML</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMobileDrawerOpen(false)}
              className="w-full py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 text-xs font-bold cursor-pointer"
            >
              Закрыть меню
            </button>
          </div>
        </div>
      )}
    </>
  );
};
