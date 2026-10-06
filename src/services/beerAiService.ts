import { Recipe } from '../types/brewing';
import { TokenSavingSettings } from '../types/aiSettings';
import { CraftAiGenerationResult, generateOfflineCraftIdentity } from '../utils/craftBrewingAiEngine';

export interface AiGenerationResponse {
  success: boolean;
  names: string[];
  slogan: string;
  story: string;
  themeStyle: CraftAiGenerationResult['themeStyle'];
  palette: CraftAiGenerationResult['palette'];
  artworkType: CraftAiGenerationResult['artworkType'];
  brewerTip: string;
  audit?: CraftAiGenerationResult['audit'];
  imagePromptRu?: string;
  imagePromptEn?: string;
  providerUsed: string;
  isOffline: boolean;
  usage?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
  warning?: string;
}

/**
 * Единый сервис ИИ генерации названий, концепта этикетки и аудита рецепта.
 * Поддерживает:
 * 1. Автономный ИИ МастерВарка (100% без VPN, без интернета, в APK и веб)
 * 2. DeepSeek AI (официально работает в РФ без VPN напрямую)
 * 3. Пользовательский OpenAI-совместимый API (GigaChat / OpenRouter / Ollama)
 * 4. Google Gemini (через прокси с мгновенным автопереключением при блокировке VPN)
 */
export async function generateRecipeBeerIdentity(
  recipe: Recipe,
  settings: TokenSavingSettings
): Promise<AiGenerationResponse> {
  const provider = settings.provider || 'offline';

  // 1. Автономный ИИ (Работает 100% без VPN, без интернета, 0 задержка)
  if (provider === 'offline' || settings.mode === 'offline') {
    const offlineResult = generateOfflineCraftIdentity(recipe);
    return {
      success: true,
      ...offlineResult,
      usage: { promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 }
    };
  }

  // 2. DeepSeek AI (Работает в РФ без VPN напрямую)
  if (provider === 'deepseek') {
    try {
      const apiKey = settings.deepseekApiKey?.trim();
      if (!apiKey) {
        // Если ключ не введен, используем автономный генератор с подсказкой
        const fallback = generateOfflineCraftIdentity(recipe);
        return {
          success: true,
          ...fallback,
          warning: 'Ключ DeepSeek не указан. Использован автономный ИИ (без VPN). Чтобы подключить DeepSeek, укажите API-ключ в настройках.',
          providerUsed: 'МастерВарка AI (Без VPN)'
        };
      }

      const hopList = (recipe.hops || []).map(h => h.name).filter(Boolean).slice(0, 4).join(', ') || 'Крафтовые';
      const grainList = (recipe.grains || []).map(g => g.name).filter(Boolean).slice(0, 4).join(', ') || 'Ячменные';

      const prompt = `Ты — креативный шеф-пивовар и дизайнер этикеток крафтовой пивоварни.
Параметры пива:
- Стиль: ${recipe.style}
- Начальная плотность: ${recipe.calculated?.ogSg || 1.050}, Крепость: ${recipe.calculated?.abv || 5.0}%, Горечь: ${recipe.calculated?.ibu || 30} IBU, Цвет: ${recipe.calculated?.ebc || 12} EBC
- Хмели: ${hopList}
- Солода: ${grainList}
${recipe.name ? `- Текущее имя: "${recipe.name}"` : ''}

Ответь ИСКЛЮЧИТЕЛЬНО валидным JSON без markdown обертки:
{
  "names": ["Название 1", "Название 2", "Название 3"],
  "slogan": "Звучный слоган до 7 слов",
  "story": "Описание вкуса и легенда 2 предложения на русском",
  "themeStyle": "craft_modern",
  "palette": { "background": "#1c1917", "text": "#fef08a", "accent": "#eab308", "border": "#ca8a04" },
  "artworkType": "hop",
  "brewerTip": "Совет пивовара по варке этого стиля",
  "audit": {
    "summary": "Краткая оценка рецепта",
    "strengths": ["Плюс 1", "Плюс 2"],
    "suggestions": ["Рекомендация по улучшению"],
    "foodPairings": ["Пара 1", "Пара 2"],
    "servingTemp": "8-10°C",
    "glassType": "Бокал Тюльпан"
  }
}`;

      const res = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'Ты отвечаешь строго валидным JSON.' },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' },
          max_tokens: 600,
          temperature: 0.8
        })
      });

      if (!res.ok) {
        throw new Error(`DeepSeek API error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);

      const offlineBaseline = generateOfflineCraftIdentity(recipe);

      return {
        success: true,
        names: parsed.names || offlineBaseline.names,
        slogan: parsed.slogan || offlineBaseline.slogan,
        story: parsed.story || offlineBaseline.story,
        themeStyle: parsed.themeStyle || offlineBaseline.themeStyle,
        palette: parsed.palette || offlineBaseline.palette,
        artworkType: parsed.artworkType || offlineBaseline.artworkType,
        brewerTip: parsed.brewerTip || offlineBaseline.brewerTip,
        audit: parsed.audit || offlineBaseline.audit,
        imagePromptRu: offlineBaseline.imagePromptRu,
        imagePromptEn: offlineBaseline.imagePromptEn,
        providerUsed: 'DeepSeek AI (Без VPN)',
        isOffline: false,
        usage: {
          promptTokenCount: data.usage?.prompt_tokens,
          candidatesTokenCount: data.usage?.completion_tokens,
          totalTokenCount: data.usage?.total_tokens
        }
      };
    } catch (err: any) {
      console.warn('DeepSeek request failed, falling back to offline AI:', err);
      const fallback = generateOfflineCraftIdentity(recipe);
      return {
        success: true,
        ...fallback,
        warning: `Не удалось связаться с DeepSeek (${err.message || 'ошибка сети'}). Автоматически применен автономный ИИ.`,
        providerUsed: 'МастерВарка AI (Без VPN)'
      };
    }
  }

  // 3. Пользовательский OpenAI-совместимый API (GigaChat / OpenRouter / Ollama / Local)
  if (provider === 'custom_openai') {
    try {
      const endpoint = settings.customEndpoint?.trim() || 'https://openrouter.ai/api/v1/chat/completions';
      const apiKey = settings.customApiKey?.trim() || '';
      const model = settings.customModel?.trim() || 'mistralai/mistral-7b-instruct';

      const prompt = `Сгенерируй для крафтового пива ${recipe.style} (ABV: ${recipe.calculated?.abv}%, IBU: ${recipe.calculated?.ibu}) JSON:
{"names":["Название 1","Название 2","Название 3"],"slogan":"Слоган","story":"Легенда вкуса","themeStyle":"craft_modern","palette":{"background":"#1c1917","text":"#fef08a","accent":"#eab308","border":"#ca8a04"},"artworkType":"hop","brewerTip":"Совет пивовара"}`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 400
        })
      });

      if (!res.ok) throw new Error(`Custom API status: ${res.status}`);
      const data = await res.json();
      const rawText = data.choices?.[0]?.message?.content || '{}';
      const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      const baseline = generateOfflineCraftIdentity(recipe);
      return {
        success: true,
        names: parsed.names || baseline.names,
        slogan: parsed.slogan || baseline.slogan,
        story: parsed.story || baseline.story,
        themeStyle: parsed.themeStyle || baseline.themeStyle,
        palette: parsed.palette || baseline.palette,
        artworkType: parsed.artworkType || baseline.artworkType,
        brewerTip: parsed.brewerTip || baseline.brewerTip,
        audit: baseline.audit,
        imagePromptRu: baseline.imagePromptRu,
        imagePromptEn: baseline.imagePromptEn,
        providerUsed: `Пользовательский ИИ (${model})`,
        isOffline: false
      };
    } catch (err: any) {
      console.warn('Custom API failed, fallback to offline:', err);
      const fallback = generateOfflineCraftIdentity(recipe);
      return {
        success: true,
        ...fallback,
        warning: `Сбой пользовательского ИИ (${err.message}). Применен автономный ИИ без VPN.`,
        providerUsed: 'МастерВарка AI (Без VPN)'
      };
    }
  }

  // 4. Google Gemini (через прокси /api/ai/...)
  try {
    const res = await fetch('/api/ai/generate-name-and-label', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        style: recipe.style,
        og: recipe.calculated?.ogSg,
        abv: recipe.calculated?.abv,
        ibu: recipe.calculated?.ibu,
        colorEbc: recipe.calculated?.ebc,
        hops: recipe.hops,
        grains: recipe.grains,
        currentName: recipe.name,
        tokenSettings: settings
      })
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    const data = await res.json();
    if (!data.names || data.names.length === 0) {
      throw new Error('Пустой ответ от Gemini API');
    }

    // Запрос аудита
    let auditData = null;
    try {
      const auditRes = await fetch('/api/ai/audit-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipe, tokenSettings: settings })
      });
      if (auditRes.ok) {
        const aJson = await auditRes.json();
        auditData = aJson.audit;
      }
    } catch {
      // ignore audit failure
    }

    const baseline = generateOfflineCraftIdentity(recipe);

    return {
      success: true,
      names: data.names,
      slogan: data.slogan || baseline.slogan,
      story: data.story || baseline.story,
      themeStyle: data.themeStyle || baseline.themeStyle,
      palette: data.palette || baseline.palette,
      artworkType: data.artworkType || baseline.artworkType,
      brewerTip: data.brewerTip || baseline.brewerTip,
      audit: auditData || baseline.audit,
      imagePromptRu: baseline.imagePromptRu,
      imagePromptEn: baseline.imagePromptEn,
      providerUsed: data.isFallback ? 'МастерВарка AI (Без VPN)' : 'Google Gemini (Облачный ИИ)',
      isOffline: Boolean(data.isOfflineMode || data.isFallback),
      usage: data.usage
    };
  } catch (err: any) {
    console.warn('Gemini / network request failed (likely VPN or offline), auto-switching to offline engine:', err);
    // МГНОВЕННЫЙ БЕЗОШИБОЧНЫЙ ПЕРЕХОД НА АВТОНОМНЫЙ ИИ
    const fallback = generateOfflineCraftIdentity(recipe);
    return {
      success: true,
      ...fallback,
      warning: 'Связь с Gemini заблокирована или недоступна без VPN. Автоматически включен автономный ИИ МастерВарка.',
      providerUsed: 'МастерВарка AI (Без VPN, 100% надёжно)'
    };
  }
}
