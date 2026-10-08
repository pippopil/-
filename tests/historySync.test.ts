import { describe, it, expect, beforeEach, vi } from 'vitest';

// Node.js test environment mock for localStorage and window
const storageStore: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => storageStore[key] || null,
  setItem: (key: string, value: string) => { storageStore[key] = String(value); },
  removeItem: (key: string) => { delete storageStore[key]; },
  clear: () => { Object.keys(storageStore).forEach(k => delete storageStore[k]); }
};

// @ts-ignore
globalThis.localStorage = localStorageMock;
// @ts-ignore
globalThis.window = globalThis;

import {
  HISTORY_SYNC_INTERVAL_DAYS,
  HISTORY_SYNC_INTERVAL_MS,
  HISTORY_LAST_SYNC_STORAGE_KEY,
  HISTORY_SYNC_STORAGE_KEY,
  isHistorySyncDue,
  getTimeUntilNextSync,
  mergeMomentsWithDefaults,
  fetchHistoryFromNetwork,
  getStoredHistoryMoments
} from '../src/services/historySyncService';
import { BREWING_HISTORY_MOMENTS, BrewingHistoryMoment } from '../src/data/brewingHistoryData';

describe('Brewing History 3-Day Sync Service', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.restoreAllMocks();
  });

  it('correctly sets sync interval to 3 days (259 200 000 ms)', () => {
    expect(HISTORY_SYNC_INTERVAL_DAYS).toBe(3);
    expect(HISTORY_SYNC_INTERVAL_MS).toBe(3 * 24 * 60 * 60 * 1000);
  });

  it('marks sync as due when no previous sync timestamp exists', () => {
    expect(isHistorySyncDue()).toBe(true);
    const { isDue, days, hours } = getTimeUntilNextSync();
    expect(isDue).toBe(true);
    expect(days).toBe(0);
    expect(hours).toBe(0);
  });

  it('marks sync as NOT due when less than 3 days have elapsed', () => {
    // 1 день назад (остается ~48 часов: до 2 дней)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    localStorage.setItem(HISTORY_LAST_SYNC_STORAGE_KEY, oneDayAgo);

    expect(isHistorySyncDue()).toBe(false);
    const { isDue, days } = getTimeUntilNextSync();
    expect(isDue).toBe(false);
    expect(days).toBeGreaterThanOrEqual(1);
    expect(days).toBeLessThanOrEqual(2);
  });

  it('marks sync as due when 3 or more days have elapsed', () => {
    // 3.5 дня назад
    const threeAndHalfDaysAgo = new Date(Date.now() - 3.5 * 24 * 60 * 60 * 1000).toISOString();
    localStorage.setItem(HISTORY_LAST_SYNC_STORAGE_KEY, threeAndHalfDaysAgo);

    expect(isHistorySyncDue()).toBe(true);
    const { isDue } = getTimeUntilNextSync();
    expect(isDue).toBe(true);
  });

  it('merges network moments with base moments without losing records', () => {
    const customMoment: BrewingHistoryMoment = {
      id: 'custom-network-moment-1',
      year: '1971 г.',
      numericYear: 1971,
      era: 'modern',
      eraName: 'Крафтовая эра',
      title: 'Основание CAMRA',
      category: 'event',
      categoryName: 'Исторические события',
      iconEmoji: '🍺',
      location: 'Великобритания',
      summary: 'Основание движения за настоящий касковый эль.',
      fullStory: 'История спасения живого пива.',
      brewingTakeaway: 'Традиционное дображивание в каске.',
      relevantStyles: ['Британский эль'],
      historicalLinks: []
    };

    const merged = mergeMomentsWithDefaults([customMoment]);
    expect(merged.length).toBe(BREWING_HISTORY_MOMENTS.length + 1);
    expect(merged.some(m => m.id === 'custom-network-moment-1')).toBe(true);
    expect(merged.some(m => m.id === 'hymn-to-ninkasi')).toBe(true);
  });

  it('fetches from network when due and updates localStorage timestamp', async () => {
    const mockMoments: BrewingHistoryMoment[] = [
      ...BREWING_HISTORY_MOMENTS,
      {
        id: 'test-server-moment',
        year: '1841 г.',
        numericYear: 1841,
        era: 'industrial',
        eraName: 'Пром. революция',
        title: 'Венский лагер Антона Дреера',
        category: 'style',
        categoryName: 'Рождение стилей',
        iconEmoji: '🍺',
        location: 'Австрия, Швехат',
        summary: 'Первый чистый янтарный лагер низового брожения.',
        fullStory: 'История венского лагера.',
        brewingTakeaway: 'Использование венского солода.',
        relevantStyles: ['Венский лагер'],
        historicalLinks: []
      }
    ];

    // Мокаем fetch
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        moments: mockMoments,
        intervalDays: 3,
        updatedAt: new Date().toISOString()
      })
    } as any);

    const result = await fetchHistoryFromNetwork(true);
    expect(result.success).toBe(true);
    expect(result.source).toBe('network');
    expect(result.moments.some(m => m.id === 'test-server-moment')).toBe(true);

    // Проверяем запись в localStorage
    expect(localStorage.getItem(HISTORY_LAST_SYNC_STORAGE_KEY)).toBeTruthy();
    expect(localStorage.getItem(HISTORY_SYNC_STORAGE_KEY)).toBeTruthy();
  });

  it('falls back cleanly to cached moments if fetch fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network offline'));

    const result = await fetchHistoryFromNetwork(true);
    expect(result.success).toBe(false);
    expect(result.source).toBe('cache');
    expect(result.moments.length).toBeGreaterThan(0);
    expect(result.message).toContain('Офлайн-режим');
  });
});
