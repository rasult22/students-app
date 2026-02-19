import OpenAI from 'openai';
import { OPENAI_CONFIG, GENERATION_CONFIG } from './config';

// Создаем клиент OpenAI
// ВАЖНО: dangerouslyAllowBrowser используется только для MVP
// В продакшене нужно использовать прокси-сервер
const createClient = () => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    console.warn('VITE_OPENAI_API_KEY not set. Content generation will not work.');
    return null;
  }

  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
  });
};

let client: OpenAI | null = null;

const getClient = (): OpenAI => {
  if (!client) {
    client = createClient();
  }
  if (!client) {
    throw new Error('OpenAI client not initialized. Check VITE_OPENAI_API_KEY.');
  }
  return client;
};

export interface GenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Генерирует JSON ответ от OpenAI с автоматическим retry
 */
export async function generateJSON<T>(
  systemPrompt: string,
  userPrompt: string,
  options?: GenerateOptions
): Promise<T> {
  const openai = getClient();

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < GENERATION_CONFIG.maxRetries; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: options?.model || OPENAI_CONFIG.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: options?.temperature ?? OPENAI_CONFIG.temperature,
        max_tokens: options?.maxTokens ?? OPENAI_CONFIG.maxTokens,
      });

      const content = response.choices[0]?.message?.content;

      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      return JSON.parse(content) as T;
    } catch (error) {
      lastError = error as Error;

      // Если это rate limit или временная ошибка — повторяем
      if (
        error instanceof Error &&
        (error.message.includes('rate_limit') ||
         error.message.includes('429') ||
         error.message.includes('timeout'))
      ) {
        console.warn(`Attempt ${attempt + 1} failed, retrying...`);
        await sleep(GENERATION_CONFIG.retryDelay * (attempt + 1));
        continue;
      }

      // Другие ошибки — прокидываем сразу
      throw error;
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

/**
 * Генерирует текстовый ответ от OpenAI (без JSON mode)
 */
export async function generateText(
  systemPrompt: string,
  userPrompt: string,
  options?: GenerateOptions
): Promise<string> {
  const openai = getClient();

  const response = await openai.chat.completions.create({
    model: options?.model || OPENAI_CONFIG.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: options?.temperature ?? OPENAI_CONFIG.temperature,
    max_tokens: options?.maxTokens ?? OPENAI_CONFIG.maxTokens,
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error('Empty response from OpenAI');
  }

  return content;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export { sleep };
