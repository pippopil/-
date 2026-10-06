import { Router, Request, Response } from 'express';
import { SyncSaveRequest } from '../types/api.js';

export const syncRouter = Router();

// Хранилище облачной синхронизации между устройствами (в памяти процесса)
const cloudSyncStore = new Map<string, { data: any; updatedAt: string }>();

// Сохранение данных
syncRouter.post('/save', (req: Request<{}, {}, SyncSaveRequest>, res: Response) => {
  const { syncCode, payload } = req.body;
  if (!syncCode || !payload) {
    return res.status(400).json({ error: 'syncCode and payload are required' });
  }
  const cleanCode = String(syncCode).trim().toUpperCase();
  cloudSyncStore.set(cleanCode, {
    data: payload,
    updatedAt: new Date().toISOString()
  });
  return res.json({ success: true, syncCode: cleanCode, message: 'Данные успешно сохранены в облаке' });
});

// Загрузка данных по коду
syncRouter.get('/load/:code', (req: Request<{ code: string }>, res: Response) => {
  const cleanCode = String(req.params.code).trim().toUpperCase();
  const entry = cloudSyncStore.get(cleanCode);
  if (!entry) {
    return res.status(404).json({ error: 'Синхронизационный код не найден или устарел' });
  }
  return res.json({ success: true, syncCode: cleanCode, data: entry.data, updatedAt: entry.updatedAt });
});
