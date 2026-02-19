# План: Генерация образовательного контента через OpenAI

## Обзор

Реализация системы генерации контента для учебных курсов:
- **Batch-режим**: скрипт для генерации preset-предметов (Linear Algebra)
- **Интерактивный режим**: пользователь вводит текст → получает курс

## Архитектура

```
src/
├── services/
│   ├── openai/
│   │   ├── client.ts           # OpenAI клиент с retry логикой
│   │   ├── config.ts           # Конфиг (модель, температура)
│   │   └── index.ts
│   │
│   ├── generators/
│   │   ├── lessonGenerator.ts      # Генерация TopicLesson
│   │   ├── questionGenerator.ts    # Генерация DiagnosticQuestion
│   │   ├── structureGenerator.ts   # Генерация Subject из текста
│   │   └── index.ts
│   │
│   └── prompts/
│       ├── lessonPrompt.ts         # Промпт для уроков
│       ├── questionPrompt.ts       # Промпт для вопросов
│       ├── structurePrompt.ts      # Промпт для структуры курса
│       └── index.ts
│
├── types/
│   └── index.ts                # + новые типы TopicLesson, Flashcard и т.д.
│
├── data/
│   ├── subjects.ts             # Существующая структура
│   └── generated/
│       └── linear-algebra/
│           ├── lessons.json    # Сгенерированные уроки
│           └── questions.json  # Дополнительные вопросы
│
└── stores/
    └── appStore.ts             # + generatedLessons в state

scripts/
└── generate-content.ts         # Batch-скрипт для генерации
```

## Новые типы (src/types/index.ts)

```typescript
// === GENERATED LESSON CONTENT ===

export interface TopicLesson {
  id: string;
  topicId: string;
  subjectId: string;

  // 1. Теоретический материал
  theory: TheoryBlock;

  // 2. Презентация
  presentation: PresentationBlock;

  // 3. Примеры с решениями
  examples: ExampleBlock[];

  // 4. Тест для закрепления
  quiz: QuizBlock;

  // 5. Anki-карточки
  flashcards: Flashcard[];

  // 6. Инфографика (описание)
  infographic?: InfographicBlock;

  generatedAt: Date;
}

export interface TheoryBlock {
  content: string;              // Markdown
  keyPoints: string[];          // 3-5 ключевых тезисов
  formulas?: FormulaItem[];     // Формулы (LaTeX)
}

export interface FormulaItem {
  latex: string;
  description: string;
}

export interface PresentationBlock {
  slides: PresentationSlide[];  // 5-8 слайдов
}

export interface PresentationSlide {
  id: string;
  title: string;
  content: string;              // Markdown
  type: 'intro' | 'concept' | 'formula' | 'example' | 'summary';
  notes?: string;               // Заметки для преподавателя
}

export interface ExampleBlock {
  id: string;
  problem: string;              // Условие задачи
  solution: SolutionStep[];     // Пошаговое решение
  explanation: string;          // Общее объяснение
  difficulty: DifficultyLevel;
}

export interface SolutionStep {
  step: number;
  action: string;               // Что делаем
  result: string;               // Результат шага
  formula?: string;             // LaTeX если есть
}

export interface QuizBlock {
  questions: QuizQuestion[];    // 3-5 вопросов
}

export interface Flashcard {
  id: string;
  front: string;                // Вопрос/термин
  back: string;                 // Ответ/определение
  tags?: string[];
}

export interface InfographicBlock {
  type: 'process' | 'comparison' | 'hierarchy' | 'timeline';
  title: string;
  data: InfographicData;
}

export type InfographicData =
  | ProcessData
  | ComparisonData
  | HierarchyData;

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
```

## OpenAI Клиент (src/services/openai/client.ts)

```typescript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true  // Для MVP, позже через прокси
});

export interface GenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export async function generateJSON<T>(
  systemPrompt: string,
  userPrompt: string,
  options?: GenerateOptions
): Promise<T> {
  const response = await client.chat.completions.create({
    model: options?.model || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    response_format: { type: 'json_object' },
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 4000
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('Empty response from OpenAI');

  return JSON.parse(content) as T;
}
```

## Генератор уроков (src/services/generators/lessonGenerator.ts)

```typescript
import { generateJSON } from '../openai/client';
import { LESSON_SYSTEM_PROMPT, buildLessonUserPrompt } from '../prompts/lessonPrompt';
import type { Topic, TopicLesson } from '../../types';

export async function generateTopicLesson(
  topic: Topic,
  sectionName: string,
  subjectName: string
): Promise<TopicLesson> {
  const userPrompt = buildLessonUserPrompt(topic, sectionName, subjectName);

  const result = await generateJSON<Omit<TopicLesson, 'id' | 'generatedAt'>>(
    LESSON_SYSTEM_PROMPT,
    userPrompt,
    { temperature: 0.7, maxTokens: 6000 }
  );

  return {
    id: `lesson-${topic.id}`,
    topicId: topic.id,
    subjectId: topic.sectionId.split('-section')[0],
    ...result,
    generatedAt: new Date()
  };
}
```

## Промпт для урока (src/services/prompts/lessonPrompt.ts)

```typescript
export const LESSON_SYSTEM_PROMPT = `
Ты — эксперт по созданию образовательного контента для студентов.
Генерируй структурированный урок в JSON формате.

ФОРМАТ ОТВЕТА (строго JSON):
{
  "theory": {
    "content": "# Теория\\n\\nОсновной текст в markdown...",
    "keyPoints": ["Пункт 1", "Пункт 2", "Пункт 3"],
    "formulas": [
      { "latex": "A \\\\cdot B = C", "description": "Умножение матриц" }
    ]
  },
  "presentation": {
    "slides": [
      {
        "id": "slide-1",
        "title": "Введение",
        "content": "Текст слайда...",
        "type": "intro"
      }
    ]
  },
  "examples": [
    {
      "id": "ex-1",
      "problem": "Условие задачи",
      "solution": [
        { "step": 1, "action": "Что делаем", "result": "Результат" }
      ],
      "explanation": "Общее объяснение",
      "difficulty": "beginner"
    }
  ],
  "quiz": {
    "questions": [
      {
        "id": "q-1",
        "text": "Вопрос?",
        "options": [
          { "id": "a", "text": "Вариант A", "isCorrect": true },
          { "id": "b", "text": "Вариант B", "isCorrect": false }
        ],
        "explanation": "Объяснение ответа"
      }
    ]
  },
  "flashcards": [
    { "id": "fc-1", "front": "Термин", "back": "Определение" }
  ],
  "infographic": {
    "type": "process",
    "title": "Алгоритм",
    "data": {
      "steps": [
        { "label": "Шаг 1", "description": "Описание" }
      ]
    }
  }
}

ТРЕБОВАНИЯ:
- Язык: русский
- theory.content: 300-500 слов, понятный язык
- keyPoints: 3-5 ключевых тезисов
- slides: 5-8 штук, типы: intro, concept, formula, example, summary
- examples: 2-3 примера разной сложности с пошаговым решением
- quiz: 3-5 вопросов single-choice
- flashcards: 5-8 карточек с терминами/формулами
- Формулы в LaTeX формате
`;

export function buildLessonUserPrompt(
  topic: Topic,
  sectionName: string,
  subjectName: string
): string {
  return `
Создай полный урок для топика:

ПРЕДМЕТ: ${subjectName}
РАЗДЕЛ: ${sectionName}
ТЕМА: ${topic.name}
ОПИСАНИЕ: ${topic.description}
СЛОЖНОСТЬ: ${topic.difficulty}
ВРЕМЯ НА ИЗУЧЕНИЕ: ${topic.estimatedMinutes} минут

Сгенерируй JSON с полным уроком.
`;
}
```

## Batch-скрипт (scripts/generate-content.ts)

```typescript
// Запуск: npx tsx scripts/generate-content.ts

import { subjects } from '../src/data/subjects';
import { generateTopicLesson } from '../src/services/generators/lessonGenerator';
import { generateDiagnosticQuestions } from '../src/services/generators/questionGenerator';
import * as fs from 'fs/promises';
import * as path from 'path';

const OUTPUT_DIR = './src/data/generated';

async function generateForSubject(subjectId: string) {
  const subject = subjects.find(s => s.id === subjectId);
  if (!subject) throw new Error(`Subject not found: ${subjectId}`);

  const lessons: TopicLesson[] = [];
  const questions: DiagnosticQuestion[] = [];

  for (const section of subject.sections) {
    console.log(`\n📚 Section: ${section.name}`);

    for (const topic of section.topics) {
      console.log(`  📖 Generating lesson for: ${topic.name}`);

      // Генерируем урок
      const lesson = await generateTopicLesson(topic, section.name, subject.name);
      lessons.push(lesson);

      // Генерируем дополнительные вопросы
      console.log(`  ❓ Generating questions for: ${topic.name}`);
      const topicQuestions = await generateDiagnosticQuestions(topic, 3);
      questions.push(...topicQuestions);

      // Пауза чтобы не превысить rate limit
      await sleep(1000);
    }
  }

  // Сохраняем результаты
  const outputPath = path.join(OUTPUT_DIR, subjectId);
  await fs.mkdir(outputPath, { recursive: true });

  await fs.writeFile(
    path.join(outputPath, 'lessons.json'),
    JSON.stringify(lessons, null, 2)
  );

  await fs.writeFile(
    path.join(outputPath, 'questions.json'),
    JSON.stringify(questions, null, 2)
  );

  console.log(`\n✅ Generated ${lessons.length} lessons, ${questions.length} questions`);
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Запуск
generateForSubject('linear-algebra');
```

## Расширение Store (src/stores/appStore.ts)

Добавить:
```typescript
interface AppState {
  // ... существующие поля

  // Generated content
  generatedLessons: Record<string, TopicLesson>;  // keyed by topicId

  // Actions
  setGeneratedLesson: (topicId: string, lesson: TopicLesson) => void;
  getGeneratedLesson: (topicId: string) => TopicLesson | undefined;
  loadGeneratedLessons: (lessons: TopicLesson[]) => void;
}
```

## Порядок реализации

### Фаза 1: Инфраструктура
1. [ ] Установить `openai` пакет
2. [ ] Создать `.env` с `VITE_OPENAI_API_KEY`
3. [ ] Создать `src/services/openai/client.ts`
4. [ ] Создать `src/services/openai/config.ts`

### Фаза 2: Типы
5. [ ] Добавить типы `TopicLesson`, `Flashcard` и др. в `types/index.ts`

### Фаза 3: Промпты и генераторы
6. [ ] Создать `src/services/prompts/lessonPrompt.ts`
7. [ ] Создать `src/services/prompts/questionPrompt.ts`
8. [ ] Создать `src/services/generators/lessonGenerator.ts`
9. [ ] Создать `src/services/generators/questionGenerator.ts`

### Фаза 4: Batch-генерация
10. [ ] Создать `scripts/generate-content.ts`
11. [ ] Запустить генерацию для Linear Algebra
12. [ ] Сохранить результаты в `src/data/generated/`

### Фаза 5: Store и интеграция
13. [ ] Расширить `appStore.ts` для хранения уроков
14. [ ] Загрузить сгенерированный контент при старте

### Фаза 6: UI компонент TopicLesson
15. [ ] Создать `src/components/TopicLesson/TopicLesson.tsx`
16. [ ] Интегрировать с LearningPlan (кнопка "Начать" → урок)

### Фаза 7: Интерактивная генерация (позже)
17. [ ] UI для ввода текста пользователем
18. [ ] Генерация структуры курса из текста
19. [ ] Прогресс-индикатор генерации

## Зависимости

```bash
npm install openai
npm install -D tsx  # для запуска скриптов
```

## Переменные окружения

```env
VITE_OPENAI_API_KEY=sk-...
```

## Оценка затрат OpenAI

Для Linear Algebra (16 топиков):
- ~16 запросов на уроки × ~4K токенов = ~64K токенов
- ~16 запросов на вопросы × ~2K токенов = ~32K токенов
- Итого: ~96K токенов ≈ $0.15-0.30 (gpt-4o-mini)
