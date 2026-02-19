export const OPENAI_CONFIG = {
  model: 'gpt-4o-mini',
  temperature: 0.7,
  maxTokens: 4000,
} as const;

export const GENERATION_CONFIG = {
  // Задержка между запросами (ms) для избежания rate limit
  requestDelay: 1000,
  // Максимальное количество повторов при ошибке
  maxRetries: 3,
  // Задержка перед повтором (ms)
  retryDelay: 2000,
} as const;
