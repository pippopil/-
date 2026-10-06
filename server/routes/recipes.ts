import { Router, Request, Response } from 'express';
import { validateExternalUrl } from '../services/security.js';
import { FetchRecipeUrlRequest } from '../types/api.js';

export const recipesRouter = Router();

// Загрузка рецептов по URL из интернета (BeerXML, JSON, Бир.РФ, веб-страницы) с защитой от SSRF
recipesRouter.post('/fetch-url', async (req: Request<{}, {}, FetchRecipeUrlRequest>, res: Response) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ success: false, error: 'URL не указан' });
  }

  // 1. Проверка URL на безопасность (SSRF защита)
  const validation = validateExternalUrl(url);
  if (!validation.isValid || !validation.sanitizedUrl) {
    return res.status(400).json({
      success: false,
      error: validation.error || 'Недопустимый или опасный адрес URL'
    });
  }

  try {
    const targetUrl = validation.sanitizedUrl;

    // 2. Безопасный запрос с таймаутом и контролем размера
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 MasterVarka/1.0',
        'Accept': 'text/xml, application/xml, application/json, text/plain, text/html, */*'
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: `Сервер источника вернул статус ${response.status}: ${response.statusText}`
      });
    }

    // Ограничение размера принимаемого контента (максимум 5MB) для защиты от DoS
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > 5 * 1024 * 1024) {
      return res.status(413).json({
        success: false,
        error: 'Файл рецепта превышает допустимый размер (максимум 5 МБ)'
      });
    }

    const content = await response.text();
    const contentType = response.headers.get('content-type') || 'text/plain';

    res.json({
      success: true,
      content,
      contentType,
      url: targetUrl
    });
  } catch (err: any) {
    console.error('Error fetching recipe URL:', err);
    res.status(500).json({
      success: false,
      error: `Не удалось загрузить данные по ссылке: ${err.message || 'Ошибка сети'}`
    });
  }
});
