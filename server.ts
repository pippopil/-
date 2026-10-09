import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

import { createAiRouter } from './server/routes/ai.js';
import { syncRouter } from './server/routes/sync.js';
import { communityRouter } from './server/routes/community.js';
import { recipesRouter } from './server/routes/recipes.js';
import { createProjectRouter } from './server/routes/project.js';
import { historyRouter } from './server/routes/history.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const portArgIndex = process.argv.indexOf('--port');
const cliPort = portArgIndex !== -1 ? Number(process.argv[portArgIndex + 1]) : null;
const isProd = process.env.NODE_ENV === 'production';
const PORT = cliPort || (isProd && process.env.PORT ? Number(process.env.PORT) : 3000);

// Безопасный лимит на JSON-пейлоад (5MB для поддержки BeerXML и изображений без риска переполнения памяти)
app.use(express.json({ limit: '5mb' }));

// CORS middleware для поддержки Android APK (Capacitor/localhost) и PWA
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Инициализация Google Gemini API
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  } catch (err) {
    console.error('Failed to init GoogleGenAI:', err);
  }
}

// ======================== API МОДУЛИ ========================
app.use('/api/ai', createAiRouter(() => aiClient));
app.use('/api/sync', syncRouter);
app.use('/api/community', communityRouter);
app.use('/api/recipes', recipesRouter);
app.use('/api/history', historyRouter);
app.use('/api/project', createProjectRouter(__dirname));

// ======================== DEV & PROD SERVING ========================
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`МастерВарка full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
