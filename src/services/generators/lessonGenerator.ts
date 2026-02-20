import { generateJSON } from '../openai';
import { LESSON_SYSTEM_PROMPT, buildLessonUserPrompt } from '../prompts';
import type {
  Topic,
  TopicLesson,
  TheoryBlock,
  PresentationBlock,
  ExampleBlock,
  QuizBlock,
  Flashcard,
  InfographicBlock,
} from '../../types';

interface LessonGenerationResult {
  theory: TheoryBlock;
  presentation: PresentationBlock;
  examples: ExampleBlock[];
  quiz: QuizBlock;
  flashcards: Flashcard[];
  infographic?: InfographicBlock;
}

/**
 * Генерирует полный урок для топика
 */
export async function generateTopicLesson(
  topic: Topic,
  sectionName: string,
  subjectName: string,
  subjectId: string
): Promise<TopicLesson> {
  const userPrompt = buildLessonUserPrompt(topic, sectionName, subjectName);

  const result = await generateJSON<LessonGenerationResult>(
    LESSON_SYSTEM_PROMPT,
    userPrompt,
    { temperature: 0.7, maxTokens: 6000 }
  );

  // Валидация и нормализация результата
  const lesson: TopicLesson = {
    id: `lesson-${topic.id}`,
    topicId: topic.id,
    subjectId,
    theory: normalizeTheory(result.theory),
    presentation: normalizePresentation(result.presentation),
    examples: normalizeExamples(result.examples),
    quiz: normalizeQuiz(result.quiz),
    flashcards: normalizeFlashcards(result.flashcards, topic.id),
    infographic: result.infographic,
    generatedAt: new Date(),
  };

  return lesson;
}

function normalizeTheory(theory: TheoryBlock): TheoryBlock {
  return {
    content: theory.content || '',
    keyPoints: Array.isArray(theory.keyPoints) ? theory.keyPoints : [],
    formulas: Array.isArray(theory.formulas) ? theory.formulas : undefined,
  };
}

function normalizePresentation(presentation: PresentationBlock): PresentationBlock {
  return {
    slides: Array.isArray(presentation?.slides)
      ? presentation.slides.map((slide, index) => ({
          id: slide.id || `slide-${index + 1}`,
          title: slide.title || `Слайд ${index + 1}`,
          content: slide.content || '',
          type: slide.type || 'concept',
          notes: slide.notes,
        }))
      : [],
  };
}

function normalizeExamples(examples: ExampleBlock[]): ExampleBlock[] {
  if (!Array.isArray(examples)) return [];

  return examples.map((example, index) => ({
    id: example.id || `ex-${index + 1}`,
    problem: example.problem || '',
    solution: Array.isArray(example.solution)
      ? example.solution.map((step, stepIndex) => ({
          step: step.step || stepIndex + 1,
          action: step.action || '',
          result: step.result || '',
          formula: step.formula,
        }))
      : [],
    explanation: example.explanation || '',
    difficulty: example.difficulty || 'beginner',
  }));
}

function normalizeQuiz(quiz: QuizBlock): QuizBlock {
  return {
    questions: Array.isArray(quiz?.questions)
      ? quiz.questions.map((q, index) => ({
          id: q.id || `q-${index + 1}`,
          text: q.text || '',
          options: Array.isArray(q.options)
            ? q.options.map((opt, optIndex) => ({
                id: opt.id || String.fromCharCode(97 + optIndex), // a, b, c, d
                text: opt.text || '',
                isCorrect: Boolean(opt.isCorrect),
              }))
            : [],
          explanation: q.explanation || '',
        }))
      : [],
  };
}

function normalizeFlashcards(flashcards: Flashcard[], topicId: string): Flashcard[] {
  if (!Array.isArray(flashcards)) return [];

  return flashcards.map((fc, index) => ({
    // Всегда генерируем уникальный ID с topicId и случайным суффиксом
    id: `fc-${topicId}-${index + 1}-${Math.random().toString(36).slice(2, 8)}`,
    front: fc.front || '',
    back: fc.back || '',
    tags: Array.isArray(fc.tags) ? fc.tags : undefined,
  }));
}
