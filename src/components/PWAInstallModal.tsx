import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  Smartphone,
  X,
  Share,
  Download,
  CheckCircle2,
  Monitor,
  Sparkles,
  Layers,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultPlatform?: 'android' | 'ios' | 'desktop';
}

export const PWAInstallModal: React.FC<Props> = ({
  isOpen,
  onClose,
  defaultPlatform
}) => {
  const { isInstallable, isIOS, isAndroid, install } = usePWAInstall();

  // Автоматический выбор таба по платформе пользователя
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'desktop'>(() => {
    if (defaultPlatform) return defaultPlatform;
    if (isIOS) return 'ios';
    if (isAndroid) return 'android';
    return 'android'; // По умолчанию Android, как самый популярный
  });

  const [installPromptTriggered, setInstallPromptTriggered] = useState(false);
  const [installSuccessNotice, setInstallSuccessNotice] = useState(false);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    setInstallPromptTriggered(true);
    const success = await install();
    if (success) {
      setInstallSuccessNotice(true);
      setTimeout(() => {
        setInstallSuccessNotice(false);
        onClose();
      }, 2000);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto overscroll-contain animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl p-5 sm:p-6 my-auto relative space-y-4"
      >
        {/* Шапка модального окна */}
        <div className="flex items-start justify-between gap-3 border-b border-stone-100 dark:border-stone-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center font-black shadow-md shadow-amber-500/25 shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-stone-900 dark:text-white leading-tight">
                Установка приложения
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                МастерВарка на вашем смартфоне
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Преимущества PWA */}
        <div className="p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-700/80 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-amber-950 dark:text-amber-200">
            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="font-semibold">Работает офлайн без интернета прямо с экрана телефона</span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black uppercase shrink-0">
            PWA
          </span>
        </div>

        {/* Табы выбора платформы */}
        <div className="flex rounded-2xl bg-stone-100 dark:bg-stone-800 p-1 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('android')}
            className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'android'
                ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            <span>🤖 Android</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ios')}
            className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'ios'
                ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            <span>🍎 iPhone / iPad</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('desktop')}
            className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'desktop'
                ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            <span>💻 ПК</span>
          </button>
        </div>

        {/* Уведомление об успешной установке */}
        {installSuccessNotice && (
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Приложение успешно установлено на ваше устройство!</span>
          </div>
        )}

        {/* 1. Инструкция для ANDROID */}
        {activeTab === 'android' && (
          <div className="space-y-3 text-xs">
            {/* Кнопка прямой системной установки, если доступна */}
            {isInstallable && (
              <button
                type="button"
                onClick={handleNativeInstall}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold flex items-center justify-center gap-2 shadow-md shadow-amber-500/25 transition-all text-sm"
              >
                <Download className="w-4 h-4" />
                <span>Нажмите здесь для установки на Android</span>
              </button>
            )}

            <div className="font-bold text-stone-900 dark:text-white flex items-center gap-1.5 pt-1">
              <span>Инструкция по установке в браузере (Chrome / Яндекс / Samsung):</span>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/60">
                <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <div className="text-stone-700 dark:text-stone-300 leading-snug">
                  В правом верхнем углу браузера нажмите кнопку меню <b>три точки</b> (или <b>⋮</b> / значок меню).
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/60">
                <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <div className="text-stone-700 dark:text-stone-300 leading-snug">
                  В открывшемся меню выберите пункт <b className="text-amber-800 dark:text-amber-300">«Установить приложение»</b> или <b className="text-amber-800 dark:text-amber-300">«Добавить на главный экран»</b>.
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/60">
                <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <div className="text-stone-700 dark:text-stone-300 leading-snug">
                  Нажмите <b>«Установить»</b>. Иконка «МастерВарка» появится на рабочем столе телефона и будет открываться на весь экран без адресной строки браузера!
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Инструкция для IOS */}
        {activeTab === 'ios' && (
          <div className="space-y-3 text-xs">
            <div className="font-bold text-stone-900 dark:text-white flex items-center gap-1.5 pt-1">
              <span>Инструкция по установке в Safari на iPhone / iPad:</span>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/60">
                <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <div className="text-stone-700 dark:text-stone-300 leading-snug">
                  В нижней панели Safari нажмите кнопку <b>«Поделиться»</b> (квадрат со стрелкой вверх <Share className="w-3.5 h-3.5 inline mx-0.5" />).
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/60">
                <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <div className="text-stone-700 dark:text-stone-300 leading-snug">
                  Прокрутите список действий вниз и нажмите <b className="text-amber-800 dark:text-amber-300">«На экран "Домой"»</b> (значок с плюсиком).
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/60">
                <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <div className="text-stone-700 dark:text-stone-300 leading-snug">
                  В правом верхнем углу нажмите <b>«Добавить»</b>. Готово! Приложение появится среди ваших иконок на экране.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Инструкция для ДЕСКТОПА */}
        {activeTab === 'desktop' && (
          <div className="space-y-3 text-xs">
            {isInstallable && (
              <button
                type="button"
                onClick={handleNativeInstall}
                className="w-full py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Установить на компьютер</span>
              </button>
            )}

            <div className="font-bold text-stone-900 dark:text-white flex items-center gap-1.5 pt-1">
              <span>Инструкция для Chrome / Edge / Яндекс:</span>
            </div>

            <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/60 space-y-2">
              <div>
                В правой части адресной строки браузера нажмите значок <b>«Установить приложение»</b> (мониторчик со стрелкой вниз или значок плюса).
              </div>
              <div className="text-stone-500">
                Либо в меню браузера (три точки в правом верхнем углу) выберите пункт <b>«Установить приложение МастерВарка»</b>.
              </div>
            </div>
          </div>
        )}

        {/* Нижняя кнопка закрытия */}
        <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors shadow-xs"
          >
            Понятно, спасибо
          </button>
        </div>
      </div>
    </div>
  );
};
