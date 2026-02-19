import type { Topic, DifficultyLevel } from '../../types';

export const QUESTION_SYSTEM_PROMPT = `
Ты — эксперт по созданию диагностических тестов для студентов.
Твоя задача — создать вопросы для проверки понимания темы.

ФОРМАТ ОТВЕТА: Строго JSON объект со следующей структурой:

{
  "questions": [
    {
      "id": "q-1",
      "text": "Полный текст вопроса?",
      "type": "single-choice",
      "options": [
        { "id": "a", "text": "Вариант ответа A", "isCorrect": true },
        { "id": "b", "text": "Вариант ответа B", "isCorrect": false },
        { "id": "c", "text": "Вариант ответа C", "isCorrect": false },
        { "id": "d", "text": "Вариант ответа D", "isCorrect": false }
      ],
      "correctAnswer": "a",
      "difficulty": "beginner",
      "explanation": "Подробное объяснение почему этот ответ правильный",
      "hints": ["Подсказка 1", "Подсказка 2"]
    }
  ]
}

ТРЕБОВАНИЯ:

1. ЯЗЫК: Русский

2. ТИПЫ ВОПРОСОВ:
   - "single-choice" — один правильный ответ из 4 вариантов
   - Каждый вопрос должен иметь ровно 4 варианта ответа

3. КАЧЕСТВО ВОПРОСОВ:
   - Вопросы должны проверять понимание, а не запоминание
   - Неправильные ответы должны быть правдоподобными (distractor)
   - Избегать очевидно неправильных вариантов
   - Формулировки должны быть чёткими и однозначными

4. СЛОЖНОСТЬ:
   - beginner: базовые понятия, определения
   - intermediate: применение знаний, простые задачи
   - advanced: сложные задачи, анализ, синтез

5. ОБЪЯСНЕНИЯ:
   - Каждый вопрос должен иметь explanation
   - Объяснение должно помочь понять почему ответ правильный
   - 2-3 предложения

6. ПОДСКАЗКИ:
   - 1-2 подсказки на вопрос
   - Подсказки не должны давать прямой ответ
   - Должны направлять мышление студента
`;

export function buildQuestionUserPrompt(
  topic: Topic,
  sectionName: string,
  subjectName: string,
  count: number = 3,
  targetDifficulty?: DifficultyLevel
): string {
  const difficultyText = targetDifficulty
    ? `Все вопросы должны быть уровня: ${targetDifficulty === 'beginner' ? 'Начальный' : targetDifficulty === 'intermediate' ? 'Средний' : 'Продвинутый'}`
    : `Распредели вопросы по сложности: 1 beginner, ${count > 2 ? '1-2 intermediate' : '1 intermediate'}, ${count > 3 ? '1 advanced' : ''}`;

  return `
Создай ${count} диагностических вопросов для проверки знаний по теме:

ПРЕДМЕТ: ${subjectName}
РАЗДЕЛ: ${sectionName}
ТЕМА: ${topic.name}
ОПИСАНИЕ ТЕМЫ: ${topic.description}
СЛОЖНОСТЬ ТЕМЫ: ${topic.difficulty === 'beginner' ? 'Начальный' : topic.difficulty === 'intermediate' ? 'Средний' : 'Продвинутый'}

${difficultyText}

Сгенерируй JSON с массивом questions.
`.trim();
}
