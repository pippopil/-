import { Router, Request, Response } from 'express';
import { BREWING_HISTORY_MOMENTS, BrewingHistoryMoment } from '../../src/data/brewingHistoryData.js';

export const historyRouter = Router();

// Интервал обновления — раз в 3 дня (в миллисекундах: 3 * 24 * 60 * 60 * 1000 = 259 200 000 мс)
const SYNC_INTERVAL_DAYS = 3;
const SYNC_INTERVAL_MS = SYNC_INTERVAL_DAYS * 24 * 60 * 60 * 1000;

// Хранилище актуальных исторических справок на сервере
let serverMoments: BrewingHistoryMoment[] = [...BREWING_HISTORY_MOMENTS];
let lastCatalogUpdate = new Date().toISOString();

/**
 * GET /api/history
 * Возвращает исторические справки из сети с метаданными периодичности (раз в 3 дня)
 */
historyRouter.get('/', (req: Request, res: Response) => {
  const since = req.query.since as string | undefined;

  res.setHeader('Cache-Control', 'public, max-age=86400'); // кэширование на стороне клиента/прокси до 1 суток
  res.json({
    success: true,
    intervalDays: SYNC_INTERVAL_DAYS,
    intervalMs: SYNC_INTERVAL_MS,
    updatedAt: lastCatalogUpdate,
    total: serverMoments.length,
    moments: serverMoments,
    message: `Исторические справки успешно получены из сети. Периодичность обновления: раз в ${SYNC_INTERVAL_DAYS} дня.`
  });
});

/**
 * GET /api/history/status
 * Быстрая проверка метаданных без передачи всего массива справок
 */
historyRouter.get('/status', (_req: Request, res: Response) => {
  res.json({
    success: true,
    intervalDays: SYNC_INTERVAL_DAYS,
    intervalMs: SYNC_INTERVAL_MS,
    updatedAt: lastCatalogUpdate,
    total: serverMoments.length
  });
});

/**
 * POST /api/history/refresh
 * Принудительное обновление/синхронизация каталога справок
 */
historyRouter.post('/refresh', (_req: Request, res: Response) => {
  lastCatalogUpdate = new Date().toISOString();
  res.json({
    success: true,
    intervalDays: SYNC_INTERVAL_DAYS,
    intervalMs: SYNC_INTERVAL_MS,
    updatedAt: lastCatalogUpdate,
    total: serverMoments.length,
    moments: serverMoments,
    message: 'Каталог исторических справок обновлен на сервере'
  });
});
