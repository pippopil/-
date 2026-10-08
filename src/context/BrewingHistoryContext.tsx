import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { BrewingHistoryMoment } from '../data/brewingHistoryData';
import {
  getStoredHistoryMoments,
  getLastHistorySyncTime,
  isHistorySyncDue,
  getTimeUntilNextSync,
  fetchHistoryFromNetwork,
  HISTORY_SYNC_INTERVAL_DAYS
} from '../services/historySyncService';

interface BrewingHistoryContextType {
  moments: BrewingHistoryMoment[];
  isLoading: boolean;
  lastSyncTime: Date | null;
  syncIntervalDays: number;
  timeUntilNextSync: { days: number; hours: number; isDue: boolean; nextDate: Date };
  syncStatus: 'synced' | 'due' | 'syncing' | 'offline_cached';
  statusMessage: string | null;
  refreshFromNetwork: (force?: boolean) => Promise<boolean>;
  getMomentById: (id: string) => BrewingHistoryMoment | undefined;
  findMomentsForStyle: (styleName?: string) => BrewingHistoryMoment[];
}

const BrewingHistoryContext = createContext<BrewingHistoryContextType | undefined>(undefined);

export const BrewingHistoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [moments, setMoments] = useState<BrewingHistoryMoment[]>(() => getStoredHistoryMoments());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(() => getLastHistorySyncTime());
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [timeUntilNextSync, setTimeUntilNextSync] = useState(() => getTimeUntilNextSync());

  // Обновление таймера до следующей синхронизации
  const updateTimerInfo = useCallback(() => {
    setTimeUntilNextSync(getTimeUntilNextSync());
    setLastSyncTime(getLastHistorySyncTime());
  }, []);

  // Функция загрузки из сети
  const handleSync = useCallback(async (force: boolean = false): Promise<boolean> => {
    setIsLoading(true);
    setStatusMessage(force ? 'Загрузка свежих исторических справок из сети...' : 'Проверка сетевых обновлений (интервал: раз в 3 дня)...');

    try {
      const result = await fetchHistoryFromNetwork(force);
      setMoments(result.moments);
      setLastSyncTime(getLastHistorySyncTime());
      setTimeUntilNextSync(getTimeUntilNextSync());
      setStatusMessage(result.message);

      // Очищаем сообщение через 6 секунд
      setTimeout(() => {
        setStatusMessage(null);
      }, 6000);

      return result.success;
    } catch (err: any) {
      console.error('[BrewingHistoryContext] Sync failed:', err);
      setStatusMessage('Ошибка при обращении к сети. Используются локальные данные.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Автоматическая проверка при старте приложения: если прошло 3 дня — подгружаем из сети
  useEffect(() => {
    if (isHistorySyncDue()) {
      handleSync(false);
    }

    // Фоновая проверка каждые 15 минут, а также при фокусе окна
    const intervalId = setInterval(() => {
      updateTimerInfo();
      if (isHistorySyncDue()) {
        handleSync(false);
      }
    }, 15 * 60 * 1000);

    const handleFocus = () => {
      updateTimerInfo();
      if (isHistorySyncDue()) {
        handleSync(false);
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleFocus);
    };
  }, [handleSync, updateTimerInfo]);

  // Вычисляемый статус
  const syncStatus = useMemo<'synced' | 'due' | 'syncing' | 'offline_cached'>(() => {
    if (isLoading) return 'syncing';
    if (!lastSyncTime) return 'due';
    if (timeUntilNextSync.isDue) return 'due';
    return 'synced';
  }, [isLoading, lastSyncTime, timeUntilNextSync.isDue]);

  const getMomentById = useCallback((id: string) => {
    return moments.find(m => m.id === id);
  }, [moments]);

  const findMomentsForStyle = useCallback((styleName?: string) => {
    if (!styleName) return [];
    const lower = styleName.toLowerCase();
    return moments.filter(m =>
      m.relevantStyles.some(st => lower.includes(st.toLowerCase()) || st.toLowerCase().includes(lower))
    );
  }, [moments]);

  const value = useMemo<BrewingHistoryContextType>(() => ({
    moments,
    isLoading,
    lastSyncTime,
    syncIntervalDays: HISTORY_SYNC_INTERVAL_DAYS,
    timeUntilNextSync,
    syncStatus,
    statusMessage,
    refreshFromNetwork: handleSync,
    getMomentById,
    findMomentsForStyle
  }), [
    moments,
    isLoading,
    lastSyncTime,
    timeUntilNextSync,
    syncStatus,
    statusMessage,
    handleSync,
    getMomentById,
    findMomentsForStyle
  ]);

  return (
    <BrewingHistoryContext.Provider value={value}>
      {children}
    </BrewingHistoryContext.Provider>
  );
};

export const useBrewingHistory = (): BrewingHistoryContextType => {
  const context = useContext(BrewingHistoryContext);
  if (!context) {
    throw new Error('useBrewingHistory must be used within a BrewingHistoryProvider');
  }
  return context;
};
