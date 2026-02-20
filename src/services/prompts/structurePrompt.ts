export const STRUCTURE_SYSTEM_PROMPT = `
Ты — эксперт по разработке учебных программ.
Твоя задача — создать структуру курса из предоставленного учебного материала.

ФОРМАТ ОТВЕТА: Строго JSON объект со следующей структурой:

{
  "subject": {
    "name": "Название предмета",
    "description": "Краткое описание предмета (1-2 предложения)",
    "icon": "одно из: calculator, sigma, dices, book, atom, code, globe, heart",
    "color": "#HEX цвет",
    "estimatedHours": 40,
    "sections": [
      {
        "name": "Название раздела",
        "description": "Описание раздела (1 предложение)",
        "order": 1,
        "topics": [
          {
            "name": "Название темы",
            "description": "Описание темы (1 предложение)",
            "order": 1,
            "difficulty": "beginner",
            "estimatedMinutes": 30
          }
        ]
      }
    ]
  }
}

ТРЕБОВАНИЯ:

1. СТРУКТУРА:
   - 3-6 разделов (sections)
   - 3-5 тем (topics) в каждом разделе
   - Логическая последовательность от простого к сложному

2. СЛОЖНОСТЬ (difficulty):
   - "beginner" — начальные темы, базовые понятия
   - "intermediate" — основной материал, применение
   - "advanced" — сложные концепции, углублённое изучение

3. ВРЕМЯ (estimatedMinutes):
   - beginner: 20-30 минут
   - intermediate: 30-60 минут
   - advanced: 45-90 минут

4. НАЗВАНИЯ:
   - Краткие, информативные
   - Без номеров и буллетов
   - На русском языке

5. ИКОНКИ (icon):
   - calculator — математика, вычисления
   - sigma — анализ, статистика
   - dices — вероятность, случайность
   - book — гуманитарные науки
   - atom — физика, химия
   - code — программирование
   - globe — география, история
   - heart — биология, медицина

6. ЦВЕТА (color):
   - Используй яркие, различимые цвета
   - Примеры: #00d4aa, #a78bfa, #fbbf24, #f472b6, #60a5fa
`;

export interface StructurePromptOptions {
  /** Название курса от пользователя */
  courseName?: string;
  /** Подсказка о типе материала */
  subjectHint?: string;
}

export function buildStructureUserPrompt(
  rawContent: string,
  options?: StructurePromptOptions
): string {
  const { courseName, subjectHint } = options || {};

  return `
Проанализируй следующий учебный материал и создай структуру курса:

${courseName ? `НАЗВАНИЕ КУРСА (используй это название): ${courseName}` : ''}
${subjectHint ? `ПОДСКАЗКА О ПРЕДМЕТЕ: ${subjectHint}` : ''}

УЧЕБНЫЙ МАТЕРИАЛ:
---
${rawContent.slice(0, 15000)}
---

На основе этого материала создай структурированный JSON курса.
${courseName ? `Используй предоставленное название "${courseName}" как имя курса.` : 'Придумай подходящее название курса.'}
Определи основные разделы и темы, распредели их по сложности.
`.trim();
}
