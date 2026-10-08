import { BREWING_HISTORY_MOMENTS, BrewingHistoryMoment } from '../data/brewingHistoryData';

export const HISTORY_SYNC_STORAGE_KEY = 'mastervarka_brewing_history_moments_v1';
export const HISTORY_LAST_SYNC_STORAGE_KEY = 'mastervarka_brewing_history_last_sync_v1';
export const HISTORY_SYNC_INTERVAL_DAYS = 3;
export const HISTORY_SYNC_INTERVAL_MS = HISTORY_SYNC_INTERVAL_DAYS * 24 * 60 * 60 * 1000; // 3 дня = 259 200 000 мс

export interface HistorySyncResult {
  success: boolean;
  moments: BrewingHistoryMoment[];
  updatedAt: string;
  source: 'network' | 'cache' | 'bundled';
  message: string;
  isNewBatch?: boolean;
}

/**
 * Получить сохраненные исторические справки из localStorage или вернуть встроенные
 */
export function getStoredHistoryMoments(): BrewingHistoryMoment[] {
  if (typeof window === 'undefined') return BREWING_HISTORY_MOMENTS;
  try {
    const raw = localStorage.getItem(HISTORY_SYNC_STORAGE_KEY);
    if (!raw) return BREWING_HISTORY_MOMENTS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Объединяем с базовыми, чтобы не потерять новые встроенные поля
      return mergeMomentsWithDefaults(parsed);
    }
  } catch (err) {
    console.warn('[HistorySync] Failed to read cached moments from localStorage:', err);
  }
  return BREWING_HISTORY_MOMENTS;
}

/**
 * Получить временную метку последней синхронизации из сети
 */
export function getLastHistorySyncTime(): Date | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(HISTORY_LAST_SYNC_STORAGE_KEY);
    if (!raw) return null;
    const date = new Date(raw);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/**
 * Проверить, истек ли 3-дневный интервал и пора ли подгружать данные из сети
 */
export function isHistorySyncDue(): boolean {
  const lastSync = getLastHistorySyncTime();
  if (!lastSync) return true; // Никогда не синхронизировалось
  const elapsed = Date.now() - lastSync.getTime();
  return elapsed >= HISTORY_SYNC_INTERVAL_MS;
}

/**
 * Рассчитать оставшееся время до следующего автоматического обновления (в часах и днях)
 */
export function getTimeUntilNextSync(): { days: number; hours: number; isDue: boolean; nextDate: Date } {
  const lastSync = getLastHistorySyncTime();
  if (!lastSync) {
    return { days: 0, hours: 0, isDue: true, nextDate: new Date() };
  }
  const nextDate = new Date(lastSync.getTime() + HISTORY_SYNC_INTERVAL_MS);
  const diffMs = nextDate.getTime() - Date.now();
  if (diffMs <= 0) {
    return { days: 0, hours: 0, isDue: true, nextDate };
  }
  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  return { days, hours, isDue: false, nextDate };
}

/**
 * Объединить полученные из сети справки с дефолтными (защита от потери уникальных записей)
 */
export function mergeMomentsWithDefaults(networkMoments: BrewingHistoryMoment[]): BrewingHistoryMoment[] {
  const map = new Map<string, BrewingHistoryMoment>();

  // Сначала базовые справки
  for (const m of BREWING_HISTORY_MOMENTS) {
    map.set(m.id, m);
  }

  // Накладываем обновленные/новые из сети
  for (const m of networkMoments) {
    if (m && m.id) {
      map.set(m.id, {
        ...(map.get(m.id) || {}),
        ...m
      });
    }
  }

  return Array.from(map.values());
}

/**
 * Загрузить исторические справки из сети
 * @param force - Принудительно загрузить, даже если 3 дня еще не прошли
 */
export async function fetchHistoryFromNetwork(force: boolean = false): Promise<HistorySyncResult> {
  const isDue = isHistorySyncDue();

  // Если обновление еще не требуется и нет принудительного вызова — возвращаем кэш
  if (!force && !isDue) {
    const cached = getStoredHistoryMoments();
    const lastSync = getLastHistorySyncTime();
    return {
      success: true,
      moments: cached,
      updatedAt: lastSync?.toISOString() || new Date().toISOString(),
      source: 'cache',
      message: 'Используются кэшированные исторические справки (период обновления: раз в 3 дня)'
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 секунд таймаут

    const response = await fetch('/api/history', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': force ? 'no-cache' : 'default'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Сетевой сервер вернул статус ${response.status}`);
    }

    const data = await response.json();
    if (!data.success || !Array.isArray(data.moments)) {
      throw new Error(data.message || 'Неверный формат данных от сервера');
    }

    const merged = mergeMomentsWithDefaults(data.moments);
    const nowIso = new Date().toISOString();

    // Сохраняем в localStorage
    try {
      localStorage.setItem(HISTORY_SYNC_STORAGE_KEY, JSON.stringify(merged));
      localStorage.setItem(HISTORY_LAST_SYNC_STORAGE_KEY, nowIso);
    } catch (storageErr) {
      console.warn('[HistorySync] LocalStorage write failed (quota?):', storageErr);
    }

    return {
      success: true,
      moments: merged,
      updatedAt: nowIso,
      source: 'network',
      message: `Исторические справки успешно подгружены из сети (${merged.length} вех). Следующее автообновление через 3 дня.`,
      isNewBatch: true
    };
  } catch (error: any) {
    console.warn('[HistorySync] Network fetch failed, falling back to cache/bundled:', error.message);
    const cached = getStoredHistoryMoments();
    return {
      success: false,
      moments: cached,
      updatedAt: getLastHistorySyncTime()?.toISOString() || new Date().toISOString(),
      source: 'cache',
      message: `Офлайн-режим: не удалось подключиться к сети (${error.message}). Используются сохраненные данные.`
    };
  }
}
