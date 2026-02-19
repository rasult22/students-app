import { generateJSON } from '../openai';
import { QUESTION_SYSTEM_PROMPT, buildQuestionUserPrompt } from '../prompts';
import type { Topic, DiagnosticQuestion, DifficultyLevel } from '../../types';

interface QuestionGenerationResult {
  questions: Array<{
    id: string;
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
    hints?: string[];
  }>;
}

/**
 * Генерирует диагностические вопросы для топика
 */
export async function generateDiagnosticQuestions(
  topic: Topic,
  sectionName: string,
  subjectName: string,
  count: number = 3,
  targetDifficulty?: DifficultyLevel
): Promise<DiagnosticQuestion[]> {
  const userPrompt = buildQuestionUserPrompt(
    topic,
    sectionName,
    subjectName,
    count,
    targetDifficulty
  );

  const result = await generateJSON<QuestionGenerationResult>(
    QUESTION_SYSTEM_PROMPT,
    userPrompt,
    { temperature: 0.8, maxTokens: 3000 }
  );

  // Преобразуем и валидируем результат
  const questions: DiagnosticQuestion[] = result.questions.map((q, index) => ({
    id: `${topic.id}-q-${index + 1}`,
    topicId: topic.id,
    sectionId: topic.sectionId,
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
    difficulty: q.difficulty || topic.difficulty,
    explanation: q.explanation || '',
    hints: Array.isArray(q.hints) ? q.hints : undefined,
  }));

  return questions;
}

/**
 * Генерирует вопросы для всех топиков раздела
 */
export async function generateQuestionsForSection(
  topics: Topic[],
  sectionName: string,
  subjectName: string,
  questionsPerTopic: number = 3
): Promise<DiagnosticQuestion[]> {
  const allQuestions: DiagnosticQuestion[] = [];

  for (const topic of topics) {
    const questions = await generateDiagnosticQuestions(
      topic,
      sectionName,
      subjectName,
      questionsPerTopic
    );
    allQuestions.push(...questions);
  }

  return allQuestions;
}
