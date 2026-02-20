import { generateJSON } from '../openai';
import type { Topic, MiniGameQuestion, MiniGameType } from '../../types';
import { getMiniGameTemplate } from '../../data/miniGames';

const MINI_GAME_SYSTEM_PROMPT = `
Ты — эксперт по созданию образовательных мини-игр.
Твоя задача — создать вопросы по теме урока, адаптированные под контекст игры.

ФОРМАТ ОТВЕТА: Строго JSON объект со следующей структурой:

{
  "questions": [
    {
      "question": "Вопрос в игровом контексте",
      "options": ["Вариант 1", "Вариант 2", "Вариант 3", "Вариант 4"],
      "correctIndex": 0,
      "explanation": "Краткое объяснение правильного ответа"
    }
  ]
}

ТРЕБОВАНИЯ:
1. ЯЗЫК: Русский
2. Вопросы должны быть по теме урока, но сформулированы в контексте игры
3. Ровно 4 варианта ответа на каждый вопрос
4. correctIndex — индекс правильного ответа (0-3)
5. Вопросы должны быть разнообразными по сложности
6. Формулировки должны быть краткими и понятными
`;

interface MiniGameGenerationResult {
  questions: Array<{
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }>;
}

function buildMiniGamePrompt(
  topic: Topic,
  sectionName: string,
  subjectName: string,
  gameType: MiniGameType,
  questionCount: number
): string {
  const template = getMiniGameTemplate(gameType);

  const gameContexts: Record<MiniGameType, string> = {
    'football-quiz': 'Футбольный матч. Каждый вопрос — это удар по воротам. Формулируй вопросы энергично, как спортивный комментатор.',
    'game-quest': 'RPG квест. Вопросы задают враги-монстры. Формулируй как вызов от противника, эпично и игрово.',
    'movie-scenes': 'Съёмки фильма. Вопросы — это элементы сцены. Формулируй как указания режиссёра, творчески.',
    'travel-adventure': 'Кругосветное путешествие. Вопросы — препятствия на пути. Формулируй как интересные факты о "местах".',
    'cooking-recipe': 'Кулинарное шоу. Вопросы — выбор ингредиентов. Формулируй как советы шеф-повара, аппетитно.',
  };

  return `
Создай ${questionCount} вопросов для мини-игры "${template?.name || gameType}".

ТЕМА УРОКА: ${topic.name}
ОПИСАНИЕ: ${topic.description}
РАЗДЕЛ: ${sectionName}
ПРЕДМЕТ: ${subjectName}

КОНТЕКСТ ИГРЫ: ${gameContexts[gameType]}

МЕХАНИКА: ${template?.mechanics || ''}

ВАЖНО:
- Вопросы должны проверять знание темы "${topic.name}"
- Формулировки адаптированы под игровой контекст
- Сложность: 40% лёгкие, 40% средние, 20% сложные
- Варианты ответов должны быть правдоподобными

Сгенерируй JSON с массивом questions.
`.trim();
}

/**
 * Генерирует вопросы для мини-игры по конкретной теме
 */
export async function generateMiniGameQuestions(
  topic: Topic,
  sectionName: string,
  subjectName: string,
  gameType: MiniGameType,
  questionCount: number = 8
): Promise<MiniGameQuestion[]> {
  const userPrompt = buildMiniGamePrompt(topic, sectionName, subjectName, gameType, questionCount);

  const result = await generateJSON<MiniGameGenerationResult>(
    MINI_GAME_SYSTEM_PROMPT,
    userPrompt,
    { temperature: 0.8, maxTokens: 3000 }
  );

  const rawQuestions = Array.isArray(result?.questions) ? result.questions : [];

  return rawQuestions.map((q, index) => ({
    id: `mg-${topic.id}-${gameType}-${index + 1}-${Math.random().toString(36).slice(2, 6)}`,
    question: q?.question || 'Вопрос не загружен',
    options: Array.isArray(q?.options) && q.options.length === 4
      ? q.options.map(opt => opt || '')
      : ['Вариант A', 'Вариант B', 'Вариант C', 'Вариант D'],
    correctIndex: typeof q?.correctIndex === 'number' && q.correctIndex >= 0 && q.correctIndex <= 3
      ? q.correctIndex
      : 0,
    explanation: q?.explanation || '',
    topicId: topic.id,
  }));
}

/**
 * Генерирует вопросы для мини-игры по нескольким темам раздела
 */
export async function generateMiniGameForSection(
  topics: Topic[],
  sectionName: string,
  subjectName: string,
  gameType: MiniGameType,
  questionsPerTopic: number = 2
): Promise<MiniGameQuestion[]> {
  const allQuestions: MiniGameQuestion[] = [];

  // Берём первые 4 темы максимум
  const topicsToUse = topics.slice(0, 4);

  for (const topic of topicsToUse) {
    const questions = await generateMiniGameQuestions(
      topic,
      sectionName,
      subjectName,
      gameType,
      questionsPerTopic
    );
    allQuestions.push(...questions);
  }

  // Перемешиваем вопросы
  return allQuestions.sort(() => Math.random() - 0.5);
}
