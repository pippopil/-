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
  Scale,
  Smartphone
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
  globalBatchSizeL: number;
  onSetGlobalBatchSizeL: (sizeL: number) => void;
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
    { id: 'matcher', label: 'Подбор по остаткам', icon: Search },
    { id: 'catalogue', label: 'База рецептов', icon: BookOpen },
    { id: 'ai_lab', label: 'ИИ & Этикетки', icon: Sparkles },
    {
      id: 'calendar',
      label: 'Календарь',
      icon: Calendar,
      badge: activeBatchesCount > 0 ? activeBatchesCount : undefined
    },
    { id: 'logs', label: 'Журнал варок', icon: ClipboardList },
    { id: 'lifehacks', label: 'Лайфхаки', icon: Lightbulb },
    { id: 'community', label: 'Сообщество', icon: Users }
  ];

  const handleMobileTabSelect = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMobileDrawerOpen(false);
  };

  return (
    <>
      {/* Верхний хедер */}
      <header className="no-print sticky top-0 z-30 bg-white/95 dark:bg-stone-900/95 backdrop-blur border-b border-amber-200/60 dark:border-stone-800 shadow-xs transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
            {/* Logo */}
            <div
              onClick={() => setActiveTab('calculator')}
              className="flex items-center gap-2.5 cursor-pointer group shrink-0"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <Beer className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="font-black text-base sm:text-lg tracking-tight bg-gradient-to-r from-amber-600 to-amber-800 dark:from-amber-400 dark:to-amber-500 bg-clip-text text-transparent">
                  МастерВарка
                </div>
                <div className="text-[10px] text-stone-500 dark:text-stone-400 -mt-1 font-medium hidden md:block">
                  Мобильное приложение пивовара
                </div>
              </div>
            </div>

            {/* Быстрый выбор желаемого объема партии в хедере */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-stone-800 border border-amber-200 dark:border-stone-700 text-xs">
              <span className="text-stone-500 text-[11px]">Объем:</span>
              <input
                type="number"
                min="2"
                max="500"
                value={globalBatchSizeL}
                onChange={(e) => onSetGlobalBatchSizeL(Math.max(1, parseFloat(e.target.value) || 20))}
                className="w-12 text-center font-mono font-black text-amber-700 dark:text-amber-400 bg-transparent focus:outline-none"
              />
              <span className="font-bold text-[10px] text-stone-500">л</span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Кнопка установки PWA */}
              <PWAInstallButton />

              {/* Offline badge */}
              <div
                title={isOffline ? 'Работает в автономном офлайн-режиме' : 'Связь с сервером активна'}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                  isOffline
                    ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                    : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                }`}
              >
                {isOffline ? <WifiOff className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
                <span className="hidden xl:inline">{isOffline ? 'Офлайн' : 'Онлайн'}</span>
              </div>

              {/* Cloud Sync */}
              <button
                onClick={onOpenCloudSync}
                title="Облачная синхронизация между устройствами"
                className="p-2 rounded-xl text-stone-700 hover:text-amber-700 hover:bg-amber-50 dark:text-stone-300 dark:hover:text-amber-400 dark:hover:bg-stone-800 transition-colors flex items-center gap-1 text-xs font-semibold"
              >
                <Cloud className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="hidden lg:inline">Синхронизация</span>
              </button>

              {/* BeerXML / Backup */}
              <button
                onClick={onOpenBeerXmlModal}
                title="Импорт и Экспорт BeerXML / JSON"
                className="hidden md:flex p-2 rounded-xl text-stone-700 hover:text-amber-700 hover:bg-amber-50 dark:text-stone-300 dark:hover:text-amber-400 dark:hover:bg-stone-800 transition-colors items-center gap-1 text-xs font-semibold"
              >
                <FileCode className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="hidden lg:inline">BeerXML</span>
              </button>

              {/* Print PDF */}
              <button
                onClick={onPrintSheet}
                title="Распечатать варочный лист в PDF"
                className="hidden sm:flex p-2 rounded-xl text-stone-700 hover:text-amber-700 hover:bg-amber-50 dark:text-stone-300 dark:hover:text-amber-400 dark:hover:bg-stone-800 transition-colors items-center gap-1 text-xs font-semibold"
              >
                <Printer className="w-4 h-4 text-stone-600 dark:text-stone-400" />
                <span className="hidden lg:inline">PDF</span>
              </button>

              {/* Переключатель световой темы (Светлая / Тёмная) */}
              <button
                type="button"
                onClick={() => setIsDarkMode(!isDarkMode)}
                title={isDarkMode ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'}
                className="p-2 rounded-xl bg-stone-100 hover:bg-amber-100/60 dark:bg-stone-800 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 transition-all shadow-2xs flex items-center gap-1 text-xs font-semibold"
                aria-label="Переключить тему оформления"
              >
                {isDarkMode ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span className="hidden md:inline text-[11px]">Светлая</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-stone-700" />
                    <span className="hidden md:inline text-[11px]">Тёмная</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Десктопная панель табов */}
          <nav className="hidden sm:flex space-x-1 sm:space-x-2 overflow-x-auto py-2 -mx-3 px-3 sm:mx-0 sm:px-0 no-scrollbar border-t border-stone-100 dark:border-stone-800/80">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as ActiveTab)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 relative ${
                    isActive
                      ? 'bg-amber-500 text-white shadow-xs'
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

      {/* Мобильная нижняя навигационная панель (Native Mobile App Tab Bar) */}
      <div className="no-print sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur border-t border-stone-200 dark:border-stone-800 px-2 py-1.5 flex justify-around items-center shadow-lg">
        <button
          onClick={() => setActiveTab('calculator')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-xl transition-colors ${
            activeTab === 'calculator'
              ? 'text-amber-600 dark:text-amber-400 font-bold'
              : 'text-stone-500 dark:text-stone-400'
          }`}
        >
          <Calculator className="w-5 h-5" />
          <span className="text-[10px]">Варка</span>
        </button>

        <button
          onClick={() => setActiveTab('matcher')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-xl transition-colors ${
            activeTab === 'matcher'
              ? 'text-amber-600 dark:text-amber-400 font-bold'
              : 'text-stone-500 dark:text-stone-400'
          }`}
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px]">Остатки</span>
        </button>

        <button
          onClick={() => setActiveTab('catalogue')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-xl transition-colors ${
            activeTab === 'catalogue'
              ? 'text-amber-600 dark:text-amber-400 font-bold'
              : 'text-stone-500 dark:text-stone-400'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px]">Рецепты</span>
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-xl transition-colors relative ${
            activeTab === 'calendar'
              ? 'text-amber-600 dark:text-amber-400 font-bold'
              : 'text-stone-500 dark:text-stone-400'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px]">Календарь</span>
          {activeBatchesCount > 0 && (
            <span className="absolute -top-1 right-2 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center">
              {activeBatchesCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setMobileDrawerOpen(true)}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-xl transition-colors ${
            ['ai_lab', 'logs', 'lifehacks', 'community'].includes(activeTab) || mobileDrawerOpen
              ? 'text-amber-600 dark:text-amber-400 font-bold'
              : 'text-stone-500 dark:text-stone-400'
          }`}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px]">Меню</span>
        </button>
      </div>

      {/* Мобильная панель «Ещё / Меню приложения» (Native Drawer Sheet) */}
      {mobileDrawerOpen && (
        <div className="no-print sm:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-stone-900 rounded-t-3xl p-5 border-t border-stone-200 dark:border-stone-800 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center border-b border-stone-100 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-black">
                  <Beer className="w-4 h-4" />
                </div>
                <div className="font-black text-base text-stone-900 dark:text-white">
                  Меню пивовара
                </div>
              </div>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Выбор объема партии на мобильном */}
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-stone-800 border border-amber-200 dark:border-stone-700 flex items-center justify-between">
              <div className="text-xs">
                <span className="font-bold text-stone-900 dark:text-white block">Объем варки:</span>
                <span className="text-[11px] text-stone-500">Автопересчет рецептов</span>
              </div>
              <div className="flex items-center gap-1">
                {[10, 15, 20, 25, 30].map(v => (
                  <button
                    key={v}
                    onClick={() => onSetGlobalBatchSizeL(v)}
                    className={`px-2 py-1 rounded-lg text-xs font-mono font-bold ${
                      globalBatchSizeL === v
                        ? 'bg-amber-500 text-white'
                        : 'bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    {v}л
                  </button>
                ))}
              </div>
            </div>

            {/* Ссылки на разделы */}
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <button
                onClick={() => handleMobileTabSelect('ai_lab')}
                className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-colors ${
                  activeTab === 'ai_lab'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                    : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span>ИИ & Этикетки</span>
              </button>

              <button
                onClick={() => handleMobileTabSelect('logs')}
                className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-colors ${
                  activeTab === 'logs'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                    : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200'
                }`}
              >
                <ClipboardList className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span>Журнал варок</span>
              </button>

              <button
                onClick={() => handleMobileTabSelect('lifehacks')}
                className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-colors ${
                  activeTab === 'lifehacks'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                    : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200'
                }`}
              >
                <Lightbulb className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span>Лайфхаки</span>
              </button>

              <button
                onClick={() => handleMobileTabSelect('community')}
                className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-colors ${
                  activeTab === 'community'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                    : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200'
                }`}
              >
                <Users className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span>Сообщество</span>
              </button>
            </div>

            {/* Быстрые действия */}
            <div className="pt-2 border-t border-stone-100 dark:border-stone-800 space-y-2">
              <div className="flex items-center justify-between p-2 rounded-xl bg-stone-50 dark:bg-stone-800">
                <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">Тема оформления:</span>
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-stone-700 text-xs font-bold text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-600 flex items-center gap-1.5 shadow-2xs"
                >
                  {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
                  <span>{isDarkMode ? 'Светлая' : 'Тёмная'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setMobileDrawerOpen(false); onOpenCloudSync(); }}
                  className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <Cloud className="w-4 h-4 text-amber-500" />
                  <span>Синхронизация</span>
                </button>

                <button
                  onClick={() => { setMobileDrawerOpen(false); onOpenBeerXmlModal(); }}
                  className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <FileCode className="w-4 h-4 text-amber-500" />
                  <span>BeerXML / JSON</span>
                </button>
              </div>
            </div>

            <button
              onClick={() => setMobileDrawerOpen(false)}
              className="w-full py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 text-xs font-bold"
            >
              Закрыть меню
            </button>
          </div>
        </div>
      )}
    </>
  );
};
