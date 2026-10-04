import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { PWAInstallModal } from './PWAInstallModal';
import { Smartphone, Download } from 'lucide-react';

interface Props {
  className?: string;
  showTextOnMobile?: boolean;
  onOpenInstallTab?: () => void;
}

export const PWAInstallButton: React.FC<Props> = ({
  className = '',
  showTextOnMobile = false,
  onOpenInstallTab
}) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [modalOpen, setModalOpen] = useState(false);

  // Если приложение уже запущено как установленный PWA standalone, скрываем кнопку
  if (isInstalled) {
    return null;
  }

  const handleClick = () => {
    // Если доступен прямой системный диалог браузера, пробуем вызвать его
    if (isInstallable) {
      install().catch(() => {});
    }
    // Если передан переход на отдельную вкладку — открываем её (без вылезающего поверх рецепта модального окна)
    if (onOpenInstallTab) {
      onOpenInstallTab();
    } else {
      setModalOpen(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold shadow-xs shadow-amber-500/20 transition-all cursor-pointer ${className}`}
        title="Установить приложение на телефон (Android / iPhone) или компьютер"
      >
        <Smartphone className="w-3.5 h-3.5 shrink-0" />
        <span className={showTextOnMobile ? 'inline' : 'hidden sm:inline'}>
          {isAndroid ? 'Установить на Android' : isIOS ? 'Установить на iOS' : 'Установить приложение'}
        </span>
        <span className={showTextOnMobile ? 'hidden' : 'inline sm:hidden'}>
          Приложение
        </span>
      </button>

      {modalOpen && !onOpenInstallTab && (
        <PWAInstallModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          defaultPlatform={isIOS ? 'ios' : isAndroid ? 'android' : 'android'}
        />
      )}
    </>
  );
};
