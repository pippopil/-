import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { GenerateLabelRequest, AuditRecipeRequest } from '../types/api.js';
import { buildLabelPrompt, buildAuditPrompt, OFFLINE_THEMES } from '../services/prompts.js';

export function createAiRouter(getAiClient: () => GoogleGenAI | null): Router {
  const router = Router();

  // 1. ИИ Генератор названия, истории и концепта этикетки
  router.post('/generate-name-and-label', async (req: Request<{}, {}, GenerateLabelRequest>, res: Response) => {
    try {
      const data = req.body;
      const mode = data.tokenSettings?.mode || 'eco';
      const aiClient = getAiClient();
      const isOffline = mode === 'offline' || !aiClient;
      const isEco = mode === 'eco';
      const maxTokens = Math.max(120, Math.min(Number(data.tokenSettings?.maxOutputTokens) || (isEco ? 260 : 400), 800));
      const disableThinking = data.tokenSettings?.disableThinking !== false;
      const compressPrompt = data.tokenSettings?.compressPrompt !== false;

      if (isOffline || !aiClient) {
        const pick = OFFLINE_THEMES[Math.floor(Math.random() * OFFLINE_THEMES.length)];
        return res.json({
          success: true,
          names: pick.names.map(n => `${n} ${data.style || ''}`.trim()),
          slogan: pick.slogan,
          story: `${pick.story} Оптимально для плотности ${data.og || 1.050} и горечи ${data.ibu || 25} IBU.`,
          themeStyle: pick.themeStyle,
          palette: pick.palette,
          artworkType: pick.artworkType,
          brewerTip: pick.brewerTip,
          usage: { promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 },
          isOfflineMode: true
        });
      }

      const prompt = buildLabelPrompt(data, compressPrompt);
      const selectedModel = isEco ? 'gemini-3.1-flash-lite' : 'gemini-3.8-flash';

      const response = await aiClient.models.generateContent({
        model: selectedModel,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          maxOutputTokens: maxTokens,
          thinkingConfig: disableThinking ? { thinkingBudget: 0 } : undefined
        }
      });

      const responseText = response.text?.trim() || '{}';
      const parsed = JSON.parse(responseText);
      return res.json({
        success: true,
        ...parsed,
        usage: response.usageMetadata,
        modelUsed: selectedModel
      });
    } catch (error: any) {
      console.error('Gemini generate-label error:', error);
      const fallback = OFFLINE_THEMES[0];
      return res.json({
        success: true,
        names: fallback.names,
        slogan: fallback.slogan,
        story: fallback.story,
        themeStyle: fallback.themeStyle,
        palette: fallback.palette,
        artworkType: fallback.artworkType,
        brewerTip: fallback.brewerTip,
        usage: { promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 },
        isFallback: true
      });
    }
  });

  // 2. ИИ Экспертный аудит рецепта и гастрономические пары
  router.post('/audit-recipe', async (req: Request<{}, {}, AuditRecipeRequest>, res: Response) => {
    try {
      const data = req.body;
      const mode = data.tokenSettings?.mode || 'eco';
      const aiClient = getAiClient();
      const isOffline = mode === 'offline' || !aiClient;
      const isEco = mode === 'eco';
      const maxTokens = Math.max(150, Math.min(Number(data.tokenSettings?.maxOutputTokens) || (isEco ? 280 : 420), 800));
      const disableThinking = data.tokenSettings?.disableThinking !== false;
      const compressPrompt = data.tokenSettings?.compressPrompt !== false;

      if (isOffline || !aiClient) {
        return res.json({
          success: true,
          audit: {
            summary: 'Рецепт составлен сбалансированно. Соотношение солодовой базы и охмеления гармонично.',
            strengths: ['Хорошая плотность сусла', 'Адекватный расчет нормы засева дрожжей'],
            suggestions: ['Контролируйте температуру брожения без резких перепадов'],
            foodPairings: ['Твердые сыры', 'Бургеры на гриле', 'Пряные колбаски'],
            servingTemp: '8-10°C',
            glassType: 'Тюльпан'
          },
          usage: { promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 },
          isOfflineMode: true
        });
      }

      const prompt = buildAuditPrompt(data, compressPrompt);
      const selectedModel = isEco ? 'gemini-3.1-flash-lite' : 'gemini-3.8-flash';

      const response = await aiClient.models.generateContent({
        model: selectedModel,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          maxOutputTokens: maxTokens,
          thinkingConfig: disableThinking ? { thinkingBudget: 0 } : undefined
        }
      });

      const parsed = JSON.parse(response.text?.trim() || '{}');
      return res.json({
        success: true,
        audit: parsed,
        usage: response.usageMetadata,
        modelUsed: selectedModel
      });
    } catch (err: any) {
      console.error('Gemini audit-recipe error:', err);
      return res.json({
        success: true,
        audit: {
          summary: 'Рецепт составлен гармонично и готов к варке.',
          strengths: ['Баланс засыпи и охмеления'],
          suggestions: ['Аэрируйте сусло перед внесением дрожжей'],
          foodPairings: ['Твердые сыры', 'Мясные закуски'],
          servingTemp: '8-10°C',
          glassType: 'Тюльпан'
        },
        usage: { promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 },
        isFallback: true
      });
    }
  });

  return router;
}
