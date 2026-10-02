import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, Share } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed standalone PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold shadow-sm shadow-amber-500/25 transition-all"
        title="Установить как мобильное приложение на экран телефона или рабочий стол"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span>Установить приложение</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700 hover:bg-amber-500/20 text-xs font-semibold transition-colors"
          title="Инструкция по установке на iPhone / iPad"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Установить на iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-stone-900 p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4">
              <div className="flex justify-between items-center border-b border-stone-100 dark:border-stone-800 pb-3">
                <h3 className="text-base font-bold text-stone-900 dark:text-white flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-amber-600" />
                  <span>Установка на iPhone / iPad</span>
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-stone-600 dark:text-stone-300">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold text-[11px] flex items-center justify-center shrink-0">1</span>
                  <span>Нажмите кнопку <b>«Поделиться»</b> (<Share className="w-3.5 h-3.5 inline mx-0.5" />) в нижней панели Safari.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold text-[11px] flex items-center justify-center shrink-0">2</span>
                  <span>Прокрутите список вниз и выберите <b>«На экран "Домой"»</b> (Add to Home Screen).</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold text-[11px] flex items-center justify-center shrink-0">3</span>
                  <span>Нажмите <b>«Добавить»</b> в правом верхнем углу. Готово! МастерВарка откроется как отдельное полноэкранное приложение без адресной строки.</span>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-bold transition-colors"
              >
                Понятно
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  const [showDesktopGuide, setShowDesktopGuide] = useState(false);

  // Fallback desktop button for easily adding / informing about PWA
  return (
    <>
      <button
        onClick={() => setShowDesktopGuide(true)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-300/80 dark:border-amber-700/80 hover:bg-amber-500/20 text-xs font-semibold transition-colors"
        title="Как установить МастерВарка на телефон или компьютер"
      >
        <Smartphone className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
        <span className="hidden sm:inline">Приложение</span>
      </button>

      {showDesktopGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-stone-900 p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4">
            <div className="flex justify-between items-center border-b border-stone-100 dark:border-stone-800 pb-3">
              <h3 className="text-base font-bold text-stone-900 dark:text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-amber-600" />
                <span>Установка приложения</span>
              </h3>
              <button
                onClick={() => setShowDesktopGuide(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-stone-600 dark:text-stone-300">
              <p><b>МастерВарка</b> — это полноценное PWA-приложение, работающее офлайн без интернета прямо на вашем смартфоне или ПК:</p>
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-stone-800/80 border border-amber-200/60 dark:border-stone-700 space-y-1.5">
                <div className="font-semibold text-amber-900 dark:text-amber-300">📱 На Android (Chrome / Яндекс):</div>
                <div>Нажмите меню <b>⋮</b> в браузере → выберите <b>«Установить приложение»</b> или <b>«Добавить на главный экран»</b>.</div>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-stone-800/80 border border-amber-200/60 dark:border-stone-700 space-y-1.5">
                <div className="font-semibold text-amber-900 dark:text-amber-300">🍎 На iPhone / iPad (Safari):</div>
                <div>Нажмите кнопку <b>«Поделиться»</b> (квадрат со стрелкой вверх) → <b>«На экран "Домой"»</b>.</div>
              </div>
              <div className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 space-y-1.5">
                <div className="font-semibold text-stone-800 dark:text-stone-200">💻 На ПК (Chrome / Edge):</div>
                <div>Нажмите значок установки в правой части адресной строки браузера.</div>
              </div>
            </div>

            <button
              onClick={() => setShowDesktopGuide(false)}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors"
            >
              Отлично, понятно
            </button>
          </div>
        </div>
      )}
    </>
  );
};
