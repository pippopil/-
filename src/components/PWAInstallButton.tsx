import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { PWAInstallModal } from './PWAInstallModal';
import { Smartphone, Download } from 'lucide-react';

interface Props {
  className?: string;
  showTextOnMobile?: boolean;
  onOpenInstallTab?: () => void;
}

export const PWAInstallButton: React.FC<Props> = () => {
  // Приложение уже установлено у пользователя, скрываем кнопку
  return null;
};
