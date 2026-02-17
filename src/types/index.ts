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
