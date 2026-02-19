// === USER & PROFILE ===
export interface UserProfile {
  id: string;
  name: string;
  interests: Interest[];
  createdAt: Date;
}

export interface Interest {
  id: string;
  name: string;
  icon: string;
  category: InterestCategory;
}

export type InterestCategory =
  | 'sports'
  | 'music'
  | 'art'
  | 'gaming'
  | 'science'
  | 'technology'
  | 'nature'
  | 'travel'
  | 'food'
  | 'books';

// === SUBJECTS & CURRICULUM ===
export interface Subject {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  sections: Section[];
  estimatedHours: number;
}

export interface Section {
  id: string;
  subjectId: string;
  name: string;
  description: string;
  order: number;
  topics: Topic[];
}

export interface Topic {
  id: string;
  sectionId: string;
  name: string;
  description: string;
  order: number;
  difficulty: DifficultyLevel;
  estimatedMinutes: number;
}

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

// === KNOWLEDGE & PROGRESS ===
export type MasteryLevel =
  | 'unknown'      // Не изучал
  | 'struggling'   // Есть пробелы
  | 'learning'     // В процессе изучения
  | 'mastered';    // Освоил

export interface KnowledgeState {
  topicId: string;
  masteryLevel: MasteryLevel;
  score: number; // 0-100
  attempts: number;
  lastAttemptAt?: Date;
  correctAnswers: number;
  totalAnswers: number;
}

export interface SectionKnowledge {
  sectionId: string;
  averageScore: number;
  masteryLevel: MasteryLevel;
  topicsCount: number;
  masteredCount: number;
}

export interface SubjectKnowledge {
  subjectId: string;
  averageScore: number;
  masteryLevel: MasteryLevel;
  sectionsCount: number;
  masteredSections: number;
  completedAt?: Date;
}

// === DIAGNOSTIC TESTING ===
export interface DiagnosticQuestion {
  id: string;
  topicId: string;
  sectionId: string;
  text: string;
  type: QuestionType;
  options?: QuestionOption[];
  correctAnswer: string | string[];
  difficulty: DifficultyLevel;
  explanation?: string;
  hints?: string[];
}

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export type QuestionType =
  | 'single-choice'
  | 'multiple-choice'
  | 'true-false'
  | 'fill-blank'
  | 'matching';

export interface DiagnosticSession {
  id: string;
  subjectId: string;
  startedAt: Date;
  completedAt?: Date;
  questions: DiagnosticAnswer[];
  currentQuestionIndex: number;
  status: 'in-progress' | 'completed';
}

export interface DiagnosticAnswer {
  questionId: string;
  topicId: string;
  sectionId: string;
  userAnswer: string | string[];
  isCorrect: boolean;
  answeredAt: Date;
  timeSpentSeconds: number;
}

// === LEARNING CONTENT ===
export interface Lesson {
  id: string;
  topicId: string;
  type: LessonType;
  title: string;
  content: LessonContent;
  order: number;
}

export type LessonType =
  | 'presentation'
  | 'infographic'
  | 'quiz'
  | 'mini-game';

export interface LessonContent {
  slides?: Slide[];
  questions?: QuizQuestion[];
  gameConfig?: MiniGameConfig;
}

export interface Slide {
  id: string;
  type: 'text' | 'image' | 'formula' | 'interactive';
  content: string;
  notes?: string;
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: QuestionOption[];
  explanation: string;
}

export interface MiniGameConfig {
  type: 'quiz-football' | 'matching-pairs' | 'sequence-builder';
  theme: string;
  questions: QuizQuestion[];
}

// === KNOWLEDGE MAP (Graph) ===
export interface KnowledgeNode {
  id: string;
  type: 'subject' | 'section' | 'topic';
  label: string;
  data: {
    masteryLevel: MasteryLevel;
    score: number;
    parentId?: string;
  };
}

export interface KnowledgeEdge {
  id: string;
  source: string;
  target: string;
  type: 'contains' | 'requires' | 'related';
}

export interface KnowledgeGraph {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
}

// === COURSE COMPLETION ===
export interface CourseCompletion {
  subjectId: string;
  completedAt: Date;
  totalTimeSpent: number;
  finalScore: number;
  certificateId?: string;
  highlights: CourseHighlight[];
}

export interface CourseHighlight {
  type: 'fastest-topic' | 'most-improved' | 'hardest-conquered' | 'streak';
  title: string;
  description: string;
  value: string | number;
  icon: string;
}

export interface Certificate {
  id: string;
  userId: string;
  subjectId: string;
  subjectName: string;
  userName: string;
  issuedAt: Date;
  score: number;
  grade: 'excellent' | 'good' | 'satisfactory';
}

// === GENERATED LESSON CONTENT ===

/**
 * Полный урок по топику, включающий все форматы подачи материала
 */
export interface TopicLesson {
  id: string;
  topicId: string;
  subjectId: string;

  /** Теоретический материал */
  theory: TheoryBlock;

  /** Презентация (слайды) */
  presentation: PresentationBlock;

  /** Примеры с пошаговым решением */
  examples: ExampleBlock[];

  /** Тест для закрепления */
  quiz: QuizBlock;

  /** Anki-карточки для запоминания */
  flashcards: Flashcard[];

  /** Инфографика (опционально) */
  infographic?: InfographicBlock;

  /** Дата генерации */
  generatedAt: Date;
}

export interface TheoryBlock {
  /** Основной текст в Markdown */
  content: string;
  /** Ключевые тезисы (3-5 штук) */
  keyPoints: string[];
  /** Формулы с описаниями */
  formulas?: FormulaItem[];
}

export interface FormulaItem {
  /** Формула в LaTeX формате */
  latex: string;
  /** Описание формулы */
  description: string;
}

export interface PresentationBlock {
  /** Слайды презентации (5-8 штук) */
  slides: PresentationSlide[];
}

export interface PresentationSlide {
  id: string;
  title: string;
  /** Контент слайда в Markdown */
  content: string;
  type: SlideType;
  /** Заметки для преподавателя */
  notes?: string;
}

export type SlideType = 'intro' | 'concept' | 'formula' | 'example' | 'summary';

export interface ExampleBlock {
  id: string;
  /** Условие задачи */
  problem: string;
  /** Пошаговое решение */
  solution: SolutionStep[];
  /** Общее объяснение решения */
  explanation: string;
  difficulty: DifficultyLevel;
}

export interface SolutionStep {
  step: number;
  /** Описание действия */
  action: string;
  /** Результат шага */
  result: string;
  /** Формула в LaTeX (если применимо) */
  formula?: string;
}

export interface QuizBlock {
  /** Вопросы для закрепления (3-5 штук) */
  questions: QuizQuestion[];
}

export interface Flashcard {
  id: string;
  /** Лицевая сторона (вопрос/термин) */
  front: string;
  /** Обратная сторона (ответ/определение) */
  back: string;
  /** Теги для категоризации */
  tags?: string[];
}

// === SPACED REPETITION (SM-2 ALGORITHM) ===

/** Качество ответа при повторении карточки */
export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;
// 0 - Полный провал, не вспомнил
// 1 - Неправильно, но после подсказки вспомнил
// 2 - Неправильно, но ответ казался знакомым
// 3 - Правильно, но с большим трудом
// 4 - Правильно, с небольшим усилием
// 5 - Идеально, без колебаний

/** Прогресс повторения одной карточки */
export interface FlashcardProgress {
  /** ID карточки (flashcard.id) */
  cardId: string;
  /** ID топика, к которому относится карточка */
  topicId: string;
  /** ID предмета, к которому относится карточка */
  subjectId: string;
  /** Фактор лёгкости (EF) — начинается с 2.5 */
  easeFactor: number;
  /** Текущий интервал повторения в днях */
  interval: number;
  /** Количество успешных повторений подряд */
  repetitions: number;
  /** Дата следующего повторения */
  nextReviewDate: Date;
  /** Дата последнего повторения */
  lastReviewDate?: Date;
  /** История ответов */
  reviewHistory: ReviewHistoryEntry[];
}

export interface ReviewHistoryEntry {
  date: Date;
  quality: ReviewQuality;
  interval: number;
}

/** Сессия повторения карточек */
export interface FlashcardReviewSession {
  id: string;
  topicId: string;
  startedAt: Date;
  completedAt?: Date;
  /** Карточки для текущей сессии */
  cardIds: string[];
  /** Текущий индекс карточки */
  currentIndex: number;
  /** Результаты сессии */
  results: ReviewSessionResult[];
}

export interface ReviewSessionResult {
  cardId: string;
  quality: ReviewQuality;
  reviewedAt: Date;
}

export interface InfographicBlock {
  type: InfographicType;
  title: string;
  data: InfographicData;
}

export type InfographicType = 'process' | 'comparison' | 'hierarchy' | 'timeline';

export type InfographicData = ProcessData | ComparisonData | HierarchyData;

export interface ProcessData {
  steps: { label: string; description: string }[];
}

export interface ComparisonData {
  items: { name: string; pros: string[]; cons: string[] }[];
}

export interface HierarchyData {
  root: string;
  children: { label: string; children?: string[] }[];
}

// === GENERATION STATUS ===

export interface GenerationProgress {
  status: 'idle' | 'generating' | 'completed' | 'error';
  currentStep?: string;
  totalSteps?: number;
  completedSteps?: number;
  error?: string;
}
