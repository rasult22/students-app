import { generateJSON } from '../openai';
import type { Subject, FinalTestQuestion, DifficultyLevel, Interest } from '../../types';

const FINAL_TEST_SYSTEM_PROMPT = `
Ты — эксперт по созданию финальных тестов для студентов.
Твоя задача — создать комплексный тест для проверки знаний по всему курсу.

ФОРМАТ ОТВЕТА: Строго JSON объект со следующей структурой:

{
  "questions": [
    {
      "id": "ft-1",
      "topicId": "topic-id",
      "sectionId": "section-id",
      "text": "Полный текст вопроса?",
      "type": "single-choice",
      "options": [
        { "id": "a", "text": "Вариант ответа A", "isCorrect": true },
        { "id": "b", "text": "Вариант ответа B", "isCorrect": false },
        { "id": "c", "text": "Вариант ответа C", "isCorrect": false },
        { "id": "d", "text": "Вариант ответа D", "isCorrect": false }
      ],
      "correctAnswer": "a",
      "difficulty": "intermediate",
      "explanation": "Подробное объяснение правильного ответа"
    }
  ]
}

ТРЕБОВАНИЯ:

1. ЯЗЫК: Русский

2. ТИПЫ ВОПРОСОВ:
   - "single-choice" — один правильный ответ из 4 вариантов
   - Каждый вопрос должен иметь ровно 4 варианта ответа

3. РАСПРЕДЕЛЕНИЕ ПО РАЗДЕЛАМ:
   - Вопросы должны покрывать все разделы курса
   - Количество вопросов пропорционально количеству тем в разделе

4. РАСПРЕДЕЛЕНИЕ СЛОЖНОСТИ:
   - 30% beginner — базовые понятия
   - 50% intermediate — применение знаний
   - 20% advanced — сложные задачи

5. КАЧЕСТВО:
   - Вопросы проверяют понимание, не запоминание
   - Неправильные ответы правдоподобны
   - Формулировки чёткие и однозначные
   - Каждый вопрос имеет объяснение

6. ПЕРСОНАЛИЗАЦИЯ:
   - Если указаны интересы студента, используй примеры из этих областей
`;

interface FinalTestGenerationResult {
  questions: Array<{
    id: string;
    topicId: string;
    sectionId: string;
    text: string;
    type: string;
    options: Array<{
      id: string;
      text: string;
      isCorrect: boolean;
    }>;
    correctAnswer: string;
    difficulty: DifficultyLevel;
    explanation: string;
  }>;
}

function buildFinalTestUserPrompt(
  subject: Subject,
  userInterests: Interest[],
  questionCount: number
): string {
  const sectionsInfo = subject.sections
    .map((section) => {
      const topicsInfo = section.topics
        .map((topic) => `      - ${topic.name} (${topic.id}): ${topic.description}`)
        .join('\n');
      return `  ${section.name} (${section.id}):\n${topicsInfo}`;
    })
    .join('\n\n');

  const interestsText =
    userInterests.length > 0
      ? `\nИНТЕРЕСЫ СТУДЕНТА: ${userInterests.map((i) => i.name).join(', ')}`
      : '';

  // Распределяем вопросы по разделам пропорционально
  const totalTopics = subject.sections.reduce((acc, s) => acc + s.topics.length, 0);
  const questionsPerTopic = Math.max(1, Math.round(questionCount / totalTopics));

  const distribution = subject.sections
    .map((section) => {
      const count = Math.round((section.topics.length / totalTopics) * questionCount);
      return `  - ${section.name}: ${Math.max(1, count)} вопросов`;
    })
    .join('\n');

  return `
Создай финальный тест из ${questionCount} вопросов для курса:

ПРЕДМЕТ: ${subject.name}
ОПИСАНИЕ: ${subject.description}
${interestsText}

СТРУКТУРА КУРСА:
${sectionsInfo}

РАСПРЕДЕЛЕНИЕ ВОПРОСОВ:
${distribution}

ВАЖНО:
- Для каждого вопроса укажи точный topicId и sectionId из структуры курса
- Покрой все ключевые темы курса
- Распределение сложности: 30% beginner, 50% intermediate, 20% advanced

Сгенерируй JSON с массивом questions.
`.trim();
}

/**
 * Генерирует вопросы для финального теста
 */
export async function generateFinalTestQuestions(
  subject: Subject,
  userInterests: Interest[] = [],
  questionCount: number = 20
): Promise<FinalTestQuestion[]> {
  const userPrompt = buildFinalTestUserPrompt(subject, userInterests, questionCount);

  const result = await generateJSON<FinalTestGenerationResult>(
    FINAL_TEST_SYSTEM_PROMPT,
    userPrompt,
    { temperature: 0.7, maxTokens: 6000 }
  );

  // Преобразуем и валидируем результат
  const questions: FinalTestQuestion[] = result.questions.map((q, index) => ({
    id: `ft-${subject.id}-${index + 1}`,
    topicId: q.topicId || '',
    sectionId: q.sectionId || '',
    text: q.text || '',
    type: 'single-choice' as const,
    options: Array.isArray(q.options)
      ? q.options.map((opt, optIndex) => ({
          id: opt.id || String.fromCharCode(97 + optIndex),
          text: opt.text || '',
          isCorrect: Boolean(opt.isCorrect),
        }))
      : [],
    correctAnswer: q.correctAnswer || 'a',
    difficulty: q.difficulty || 'intermediate',
    explanation: q.explanation || '',
  }));

  return questions;
}

/**
 * Вычисляет рекомендуемое количество вопросов на основе структуры курса
 */
export function getRecommendedQuestionCount(subject: Subject): number {
  const totalTopics = subject.sections.reduce((acc, s) => acc + s.topics.length, 0);
  // 2-3 вопроса на тему, минимум 15, максимум 30
  return Math.min(30, Math.max(15, Math.round(totalTopics * 2.5)));
}
