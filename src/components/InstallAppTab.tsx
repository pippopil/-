import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  Smartphone,
  Apple,
  Monitor,
  Download,
  CheckCircle2,
  Share,
  ArrowRight,
  Sparkles,
  WifiOff,
  Copy,
  Check,
  Zap,
  HardDrive,
  Info,
  QrCode,
  ArrowLeft,
  Github,
  GitBranch,
  Package,
  Terminal,
  FileArchive,
  Layers,
  ExternalLink,
  Code2
} from 'lucide-react';

interface Props {
  onBackToRecipe?: () => void;
}

export const InstallAppTab: React.FC<Props> = ({ onBackToRecipe }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();

  // Основной режим: 'pwa' (на телефон), 'apk' (компиляция в app), 'github' (исходный код и github)
  const [mainSection, setMainSection] = useState<'pwa' | 'apk' | 'github'>('pwa');

  // Платформа для PWA: android | ios | desktop
  const [activePlatform, setActivePlatform] = useState<'android' | 'ios' | 'desktop'>(() => {
    if (isIOS) return 'ios';
    if (isAndroid) return 'android';
    return 'android';
  });

  const [activeBrowser, setActiveBrowser] = useState<'chrome' | 'yandex' | 'samsung' | 'other'>('chrome');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const [installSuccessMessage, setInstallSuccessMessage] = useState<string | null>(null);

  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://masterbrew.app';

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(currentUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCommand(id);
    setTimeout(() => setCopiedCommand(null), 2500);
  };

  const handleDirectInstall = async () => {
    try {
      await install();
      setInstallSuccessMessage('Запрос на установку отправлен в операционную систему вашего устройства!');
      setTimeout(() => setInstallSuccessMessage(null), 5000);
    } catch {
      setInstallSuccessMessage('Следуйте пошаговой инструкции ниже для вашего браузера');
      setTimeout(() => setInstallSuccessMessage(null), 5000);
    }
  };

  const gitCommands = [
    'git init',
    'git add .',
    'git commit -m "Первый релиз МастерВарка"',
    'git branch -M main',
    'git remote add origin https://github.com/ВАШ_ЛОГИН/mastervarka.git',
    'git push -u origin main'
  ].join('\n');

  const capacitorCommands = [
    '# 1. Сборка веб-приложения и генерация Android-проекта',
    'npm run cap:android',
    '',
    '# 2. Открытие готового проекта в Android Studio',
    'npm run cap:open'
  ].join('\n');

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Главный заголовок и навигация назад */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 sm:p-6 shadow-sm border border-stone-200/80 dark:border-stone-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center shadow-md shadow-amber-500/25 shrink-0">
              {mainSection === 'pwa' && <Smartphone className="w-6 h-6" />}
              {mainSection === 'apk' && <Package className="w-6 h-6" />}
              {mainSection === 'github' && <Github className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white tracking-tight">
                  {mainSection === 'pwa' && 'Установка на телефон'}
                  {mainSection === 'apk' && 'Скомпилировать в .APK (Приложение)'}
                  {mainSection === 'github' && 'Скачать исходный код & GitHub'}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300">
                  {mainSection === 'pwa' && 'PWA / Офлайн'}
                  {mainSection === 'apk' && 'Android APK'}
                  {mainSection === 'github' && 'Open Source'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-0.5">
                {mainSection === 'pwa' && 'Установка на рабочий стол телефона за 10 секунд без магазинов'}
                {mainSection === 'apk' && 'Превращение веб-приложения в нативный файл .apk для Android через Capacitor'}
                {mainSection === 'github' && 'Скачивание проекта в ZIP и публикация в репозиторий GitHub'}
              </p>
            </div>
          </div>

          {onBackToRecipe && (
            <button
              type="button"
              onClick={onBackToRecipe}
              className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Вернуться к рецепту</span>
            </button>
          )}
        </div>

        {/* 3 Главные вкладки раздела */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4">
          <button
            type="button"
            onClick={() => setMainSection('pwa')}
            className={`p-3 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mainSection === 'pwa'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                : 'bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-750'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>1. Установка на телефон (PWA)</span>
          </button>

          <button
            type="button"
            onClick={() => setMainSection('apk')}
            className={`p-3 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mainSection === 'apk'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                : 'bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-750'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>2. Сборка в APK (.app)</span>
          </button>

          <button
            type="button"
            onClick={() => setMainSection('github')}
            className={`p-3 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mainSection === 'github'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                : 'bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-750'
            }`}
          >
            <Github className="w-4 h-4" />
            <span>3. Скачать с GitHub (ZIP)</span>
          </button>
        </div>
      </div>

      {/* ======================= РАЗДЕЛ 1: PWA УСТАНОВКА ======================= */}
      {mainSection === 'pwa' && (
        <div className="space-y-6">
          {/* Быстрая кнопка установки в 1 клик (если поддерживается браузером) */}
          {isInstallable && !isInstalled && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-white shadow-md shadow-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-center sm:text-left">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5 text-amber-200" />
                </div>
                <div>
                  <div className="font-extrabold text-sm sm:text-base">
                    Ваш браузер поддерживает установку в 1 клик!
                  </div>
                  <div className="text-xs text-white/90">
                    Нажмите кнопку для мгновенного добавления на экран
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDirectInstall}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white text-amber-950 hover:bg-amber-50 font-black text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <Download className="w-4 h-4 text-amber-600" />
                <span>Установить в 1 клик</span>
              </button>
            </div>
          )}

          {isInstalled && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5 text-xs font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Приложение «МастерВарка» уже установлено и запущено как автономное приложение!</span>
            </div>
          )}

          {installSuccessMessage && (
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-medium flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{installSuccessMessage}</span>
            </div>
          )}

          {/* Карточка выбора устройства для PWA */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 sm:p-6 shadow-sm border border-stone-200/80 dark:border-stone-800 space-y-5">
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setActivePlatform('android')}
                className={`p-3 rounded-xl font-bold text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-2 transition-all cursor-pointer ${
                  activePlatform === 'android'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Android</span>
                {isAndroid && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-white/20 font-black">
                    Ваш телефон
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActivePlatform('ios')}
                className={`p-3 rounded-xl font-bold text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-2 transition-all cursor-pointer ${
                  activePlatform === 'ios'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                }`}
              >
                <Apple className="w-4 h-4" />
                <span>iPhone / iPad</span>
                {isIOS && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-white/20 font-black">
                    Ваш телефон
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActivePlatform('desktop')}
                className={`p-3 rounded-xl font-bold text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-2 transition-all cursor-pointer ${
                  activePlatform === 'desktop'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span>Компьютер / ПК</span>
              </button>
            </div>

            {/* Шаги для Android */}
            {activePlatform === 'android' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
                  <h3 className="font-bold text-sm text-stone-900 dark:text-white">
                    Инструкция для Android (выберите браузер):
                  </h3>
                  <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setActiveBrowser('chrome')}
                      className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                        activeBrowser === 'chrome'
                          ? 'bg-white dark:bg-stone-700 text-amber-700 dark:text-amber-400 font-bold shadow-2xs'
                          : 'text-stone-600 dark:text-stone-400'
                      }`}
                    >
                      Chrome
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveBrowser('yandex')}
                      className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                        activeBrowser === 'yandex'
                          ? 'bg-white dark:bg-stone-700 text-amber-700 dark:text-amber-400 font-bold shadow-2xs'
                          : 'text-stone-600 dark:text-stone-400'
                      }`}
                    >
                      Яндекс
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveBrowser('samsung')}
                      className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                        activeBrowser === 'samsung'
                          ? 'bg-white dark:bg-stone-700 text-amber-700 dark:text-amber-400 font-bold shadow-2xs'
                          : 'text-stone-600 dark:text-stone-400'
                      }`}
                    >
                      Samsung
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-stone-850 border border-amber-200/70 dark:border-stone-750">
                    <div className="w-8 h-8 rounded-full bg-amber-500 text-white font-black text-sm flex items-center justify-center mb-2">1</div>
                    <div className="font-extrabold text-sm text-stone-900 dark:text-white mb-1">Меню браузера</div>
                    <p className="text-xs text-stone-600 dark:text-stone-300">
                      {activeBrowser === 'chrome' && <>Нажмите на <b className="font-mono text-amber-600 text-sm">⋮</b> (три точки) в верхнем правом углу Google Chrome.</>}
                      {activeBrowser === 'yandex' && <>Нажмите на <b className="font-mono text-amber-600 text-sm">☰</b> (три полоски) в нижней панели Яндекс Браузера.</>}
                      {activeBrowser === 'samsung' && <>Нажмите на <b className="font-mono text-amber-600 text-sm">☰</b> в правом нижнем углу Samsung Internet.</>}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-stone-850 border border-amber-200/70 dark:border-stone-750">
                    <div className="w-8 h-8 rounded-full bg-amber-500 text-white font-black text-sm flex items-center justify-center mb-2">2</div>
                    <div className="font-extrabold text-sm text-stone-900 dark:text-white mb-1">«Установить»</div>
                    <p className="text-xs text-stone-600 dark:text-stone-300">
                      {activeBrowser === 'chrome' && <>Выберите пункт <b className="text-amber-700 dark:text-amber-300">«Установить приложение»</b> (или «Добавить на главный экран»).</>}
                      {activeBrowser === 'yandex' && <>Выберите пункт <b className="text-amber-700 dark:text-amber-300">«Добавить на рабочий стол»</b>.</>}
                      {activeBrowser === 'samsung' && <>Выберите <b className="text-amber-700 dark:text-amber-300">«Добавить страницу в»</b> → <b className="text-amber-700 dark:text-amber-300">«Главный экран»</b>.</>}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-stone-850 border border-amber-200/70 dark:border-stone-750">
                    <div className="w-8 h-8 rounded-full bg-amber-500 text-white font-black text-sm flex items-center justify-center mb-2">3</div>
                    <div className="font-extrabold text-sm text-stone-900 dark:text-white mb-1">Готово!</div>
                    <p className="text-xs text-stone-600 dark:text-stone-300">
                      Подтвердите установку. Иконка появится на рабочем столе смартфона и будет работать на 100% офлайн!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Шаги для iOS Safari */}
            {activePlatform === 'ios' && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-stone-850 border border-amber-200/70 dark:border-stone-750">
                  <div className="w-8 h-8 rounded-full bg-amber-500 text-white font-black text-sm flex items-center justify-center mb-2">1</div>
                  <div className="font-extrabold text-sm text-stone-900 dark:text-white mb-1">Открыть в Safari</div>
                  <p className="text-xs text-stone-600 dark:text-stone-300">Убедитесь, что страница открыта в стандартном браузере Safari.</p>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-stone-850 border border-amber-200/70 dark:border-stone-750">
                  <div className="w-8 h-8 rounded-full bg-amber-500 text-white font-black text-sm flex items-center justify-center mb-2">2</div>
                  <div className="font-extrabold text-sm text-stone-900 dark:text-white mb-1">«Поделиться»</div>
                  <p className="text-xs text-stone-600 dark:text-stone-300">В нижней панели нажмите значок «Поделиться» (прямоугольник со стрелкой вверх ↑).</p>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-stone-850 border border-amber-200/70 dark:border-stone-750">
                  <div className="w-8 h-8 rounded-full bg-amber-500 text-white font-black text-sm flex items-center justify-center mb-2">3</div>
                  <div className="font-extrabold text-sm text-stone-900 dark:text-white mb-1">«На экран "Домой"»</div>
                  <p className="text-xs text-stone-600 dark:text-stone-300">Прокрутите список вниз и нажмите на пункт «На экран "Домой"» (+).</p>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-stone-850 border border-amber-200/70 dark:border-stone-750">
                  <div className="w-8 h-8 rounded-full bg-amber-500 text-white font-black text-sm flex items-center justify-center mb-2">4</div>
                  <div className="font-extrabold text-sm text-stone-900 dark:text-white mb-1">«Добавить»</div>
                  <p className="text-xs text-stone-600 dark:text-stone-300">В правом верхнем углу нажмите «Добавить». Иконка появится на экране iPhone!</p>
                </div>
              </div>
            )}

            {/* Шаги для Desktop */}
            {activePlatform === 'desktop' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-stone-850 border border-amber-200/70 dark:border-stone-750">
                  <div className="font-bold text-sm text-stone-900 dark:text-white mb-1">1. Через адресную строку:</div>
                  <p className="text-xs text-stone-600 dark:text-stone-300">В правой части адресной строки браузера (Chrome, Edge, Яндекс) нажмите иконку монитора со стрелочкой или значок «⊕».</p>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-stone-850 border border-amber-200/70 dark:border-stone-750">
                  <div className="font-bold text-sm text-stone-900 dark:text-white mb-1">2. Через меню:</div>
                  <p className="text-xs text-stone-600 dark:text-stone-300">В меню браузера (⋮) нажмите «Установить приложение МастерВарка» — оно запустится в отдельном окне без адресной строки.</p>
                </div>
              </div>
            )}
          </div>

          {/* QR код для открытия на мобильном телефоне */}
          <div className="bg-stone-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold">
                <QrCode className="w-3.5 h-3.5" />
                <span>Быстрый перенос на смартфон</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black">
                Откройте на телефоне прямо сейчас
              </h3>
              <p className="text-xs text-stone-300 max-w-md leading-relaxed">
                Наведите камеру смартфона на QR-код или скопируйте ссылку, чтобы открыть приложение на вашем мобильном и сразу добавить на рабочий стол.
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-950" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'Ссылка скопирована!' : 'Скопировать ссылку'}</span>
                </button>
              </div>
            </div>

            <div className="p-3 bg-white rounded-2xl shadow-xl shrink-0 flex flex-col items-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(currentUrl)}&margin=4`}
                alt="QR-код"
                className="w-32 h-32 rounded-lg"
                loading="lazy"
              />
              <span className="text-[10px] text-stone-700 font-bold mt-1.5">
                Камера смартфона
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ======================= РАЗДЕЛ 2: СБОРКА В APK / APP ======================= */}
      {mainSection === 'apk' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 sm:p-6 shadow-sm border border-stone-200/80 dark:border-stone-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-stone-900 dark:text-white">
                  Как скомпилировать веб-приложение в файл .APK для Android?
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  В репозиторий уже добавлен <b>Capacitor 8</b>, конфиг <code>capacitor.config.json</code> и GitHub Actions для сборки APK.
                </p>
              </div>
            </div>

            {/* 3 способа сборки */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Способ 1: GitHub Actions (Автоматически) */}
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-stone-850 border border-amber-200/80 dark:border-stone-750 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 text-xs font-black uppercase mb-1">
                    <Zap className="w-4 h-4" />
                    <span>Способ 1 (Самый простой)</span>
                  </div>
                  <h3 className="font-extrabold text-sm text-stone-900 dark:text-white mb-2">
                    Авто-сборка APK на GitHub
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                    Вам не нужно устанавливать тяжелый Android Studio. Пайплайн <code>.github/workflows/build-apk.yml</code> уже включен в проект.
                  </p>
                  <ol className="text-xs text-stone-600 dark:text-stone-400 list-decimal list-inside mt-3 space-y-1">
                    <li>Сделайте <code>git push</code> на GitHub</li>
                    <li>Откройте вкладку <b>Actions</b></li>
                    <li>Скачайте готовый <b>app-debug.apk</b></li>
                  </ol>
                </div>
                <div className="mt-4 pt-3 border-t border-amber-200/60 dark:border-stone-700 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Работает полностью бесплатно на серверах GitHub</span>
                </div>
              </div>

              {/* Способ 2: Capacitor + Android Studio */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-750 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-stone-700 dark:text-stone-300 text-xs font-black uppercase mb-1">
                    <Terminal className="w-4 h-4" />
                    <span>Способ 2 (Локально на ПК)</span>
                  </div>
                  <h3 className="font-extrabold text-sm text-stone-900 dark:text-white mb-2">
                    Capacitor + Android Studio
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                    Для сборки на своем компьютере через официальный SDK:
                  </p>
                  <div className="bg-stone-900 text-amber-300 p-2.5 rounded-lg font-mono text-[11px] mt-2 overflow-x-auto">
                    npm run cap:android<br/>
                    npm run cap:open
                  </div>
                  <p className="text-[11px] text-stone-500 mt-2">
                    В Android Studio нажмите <b>Build → Build APK(s)</b>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyCode(capacitorCommands, 'cap-code')}
                  className="mt-4 w-full py-1.5 px-3 rounded-lg bg-stone-200 hover:bg-stone-300 dark:bg-stone-700 dark:hover:bg-stone-600 text-stone-800 dark:text-stone-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedCommand === 'cap-code' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCommand === 'cap-code' ? 'Команды скопированы!' : 'Скопировать команды'}</span>
                </button>
              </div>

              {/* Способ 3: PWABuilder Онлайн */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-750 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-stone-700 dark:text-stone-300 text-xs font-black uppercase mb-1">
                    <ExternalLink className="w-4 h-4" />
                    <span>Способ 3 (Без кода онлайн)</span>
                  </div>
                  <h3 className="font-extrabold text-sm text-stone-900 dark:text-white mb-2">
                    PWABuilder.com
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                    Сервис от Microsoft, который берет адрес вашего развернутого сайта и упаковывает в APK / AAB для RuStore и Google Play.
                  </p>
                  <ol className="text-xs text-stone-600 dark:text-stone-400 list-decimal list-inside mt-3 space-y-1">
                    <li>Откройте <b>pwabuilder.com</b></li>
                    <li>Вставьте URL приложения</li>
                    <li>Нажмите <b>Package for Android</b></li>
                  </ol>
                </div>
                <a
                  href="https://www.pwabuilder.com"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 w-full py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors text-center"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Открыть PWABuilder</span>
                </a>
              </div>
            </div>
          </div>

          {/* Инструкция по установке скомпилированного APK на телефон */}
          <div className="bg-stone-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-stone-800 space-y-3">
            <h3 className="text-base font-black flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-amber-400" />
              <span>Как установить готовый файл .APK на телефон Android?</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-stone-300 pt-1">
              <div className="p-3 rounded-xl bg-stone-800 border border-stone-700">
                <span className="font-bold text-amber-400 block mb-1">Шаг 1. Перенос на телефон</span>
                Отправьте файл <code>app-debug.apk</code> на телефон через Telegram (в «Избранное»), Google Диск, WhatsApp или по USB-кабелю.
              </div>
              <div className="p-3 rounded-xl bg-stone-800 border border-stone-700">
                <span className="font-bold text-amber-400 block mb-1">Шаг 2. Разрешение установки</span>
                Нажмите на скачанный файл. Если телефон спросит: «Разрешить установку из этого источника?», нажмите <b>Разрешить</b>.
              </div>
              <div className="p-3 rounded-xl bg-stone-800 border border-stone-700">
                <span className="font-bold text-amber-400 block mb-1">Шаг 3. Запуск приложения</span>
                Нажмите <b>Установить</b>. Приложение МастерВарка появится в списке ваших установленных программ на смартфоне.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================= РАЗДЕЛ 3: СКАЧАТЬ С GITHUB & ZIP ======================= */}
      {mainSection === 'github' && (
        <div className="space-y-6">
          {/* Быстрое скачивание проекта в ZIP */}
          <div className="bg-gradient-to-br from-stone-900 via-stone-850 to-stone-900 text-white rounded-2xl p-5 sm:p-6 shadow-lg border border-stone-800">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
              <div className="space-y-2 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold">
                  <FileArchive className="w-3.5 h-3.5" />
                  <span>Полный архив проекта</span>
                </div>
                <h3 className="text-xl font-black">
                  Скачать весь исходный код (ZIP)
                </h3>
                <p className="text-xs text-stone-300 max-w-md leading-relaxed">
                  Скачайте чистый архив со всеми компонентами, калькулятором, 34 рецептами BJCP, сервером, стилями и конфигом сборки в APK.
                </p>
              </div>

              <a
                href="/api/project/download-zip"
                download="mastervarka-source.zip"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <Download className="w-5 h-5" />
                <span>Скачать ZIP-архив (~300 КБ)</span>
              </a>
            </div>
          </div>

          {/* Инструкция по созданию репозитория на GitHub */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 sm:p-6 shadow-sm border border-stone-200/80 dark:border-stone-800 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Github className="w-5 h-5 text-stone-900 dark:text-white" />
                <h3 className="font-black text-base text-stone-900 dark:text-white">
                  Как выгрузить проект на свой GitHub:
                </h3>
              </div>
              <button
                type="button"
                onClick={() => handleCopyCode(gitCommands, 'git-full')}
                className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedCommand === 'git-full' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCommand === 'git-full' ? 'Все команды скопированы!' : 'Скопировать все команды'}</span>
              </button>
            </div>

            <ol className="text-xs text-stone-700 dark:text-stone-300 space-y-3">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                <div>
                  Создайте новый пустой репозиторий на <b>github.com/new</b> (например, с названием <code>mastervarka</code>).
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                <div>
                  Разархивируйте скачанный ZIP-архив и откройте терминал в папке проекта.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                <div>
                  Выполните команды в терминале:
                </div>
              </li>
            </ol>

            {/* Команды терминала */}
            <div className="bg-stone-900 text-stone-100 rounded-xl p-4 font-mono text-xs overflow-x-auto relative">
              <pre className="text-amber-300/90 leading-relaxed select-all">
{`git init
git add .
git commit -m "Первый релиз МастерВарка"
git branch -M main
git remote add origin https://github.com/ВАШ_ЛОГИН/mastervarka.git
git push -u origin main`}
              </pre>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
              💡 <b>Совет:</b> Замените <code>ВАШ_ЛОГИН</code> на имя вашего профиля на GitHub. После выполнения команды <code>git push</code> весь код появится в вашем репозитории, и любой желающий сможет клонировать его командой: <code>git clone https://github.com/ВАШ_ЛОГИН/mastervarka.git</code>.
            </div>
          </div>

          {/* Запуск на ПК */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 sm:p-6 shadow-sm border border-stone-200/80 dark:border-stone-800 space-y-3">
            <h3 className="font-extrabold text-sm text-stone-900 dark:text-white flex items-center gap-2">
              <Code2 className="w-4 h-4 text-amber-600" />
              <span>Как запустить скачанный проект на компьютере:</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                <span className="font-bold text-amber-700 dark:text-amber-400 block mb-1">1. Установка Node.js</span>
                Убедитесь, что на компьютере установлен Node.js (версия 18 или 20).
              </div>
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                <span className="font-bold text-amber-700 dark:text-amber-400 block mb-1">2. npm install</span>
                В папке с проектом выполните команду <code>npm install</code> для установки модулей.
              </div>
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                <span className="font-bold text-amber-700 dark:text-amber-400 block mb-1">3. npm run dev</span>
                Запустите проект и откройте в браузере адрес <code>http://localhost:3000</code>.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
