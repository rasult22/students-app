/**
 * Batch-скрипт для генерации контента курса
 *
 * Запуск:
 *   npx tsx scripts/generate-content.ts
 *
 * Или с конкретным предметом:
 *   npx tsx scripts/generate-content.ts linear-algebra
 */

import OpenAI from 'openai';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Получаем __dirname для ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Конфигурация
const CONFIG = {
  model: 'gpt-4o-mini',
  temperature: 0.7,
  maxTokens: 6000,
  requestDelay: 1500, // ms между запросами
};

// Импортируем данные предметов напрямую
// (не можем использовать Vite imports в Node скрипте)
const subjects = [
  {
    id: 'linear-algebra',
    name: 'Линейная алгебра',
    description: 'Векторы, матрицы, системы линейных уравнений и линейные преобразования',
    sections: [
      {
        id: 'la-section-1',
        name: 'Матрицы и определители',
        topics: [
          { id: 'la-topic-1-1', sectionId: 'la-section-1', name: 'Виды матриц', description: 'Квадратные, прямоугольные, единичные, нулевые матрицы', difficulty: 'beginner', estimatedMinutes: 30 },
          { id: 'la-topic-1-2', sectionId: 'la-section-1', name: 'Операции с матрицами', description: 'Сложение, умножение матриц, умножение на скаляр', difficulty: 'beginner', estimatedMinutes: 45 },
          { id: 'la-topic-1-3', sectionId: 'la-section-1', name: 'Определители', description: 'Вычисление определителей 2x2 и 3x3, свойства', difficulty: 'intermediate', estimatedMinutes: 60 },
          { id: 'la-topic-1-4', sectionId: 'la-section-1', name: 'Обратная матрица', description: 'Нахождение обратной матрицы, условия существования', difficulty: 'intermediate', estimatedMinutes: 45 },
        ],
      },
      {
        id: 'la-section-2',
        name: 'Системы линейных уравнений',
        topics: [
          { id: 'la-topic-2-1', sectionId: 'la-section-2', name: 'Метод Гаусса', description: 'Прямой и обратный ход метода Гаусса', difficulty: 'intermediate', estimatedMinutes: 60 },
          { id: 'la-topic-2-2', sectionId: 'la-section-2', name: 'Метод Крамера', description: 'Решение систем через определители', difficulty: 'intermediate', estimatedMinutes: 45 },
          { id: 'la-topic-2-3', sectionId: 'la-section-2', name: 'Матричный метод', description: 'Решение через обратную матрицу', difficulty: 'intermediate', estimatedMinutes: 45 },
          { id: 'la-topic-2-4', sectionId: 'la-section-2', name: 'Ранг матрицы', description: 'Определение ранга, теорема Кронекера-Капелли', difficulty: 'advanced', estimatedMinutes: 60 },
        ],
      },
      {
        id: 'la-section-3',
        name: 'Векторные пространства',
        topics: [
          { id: 'la-topic-3-1', sectionId: 'la-section-3', name: 'Векторы и операции', description: 'Сложение векторов, скалярное умножение', difficulty: 'beginner', estimatedMinutes: 30 },
          { id: 'la-topic-3-2', sectionId: 'la-section-3', name: 'Линейная зависимость', description: 'Определение, критерии линейной зависимости', difficulty: 'intermediate', estimatedMinutes: 45 },
          { id: 'la-topic-3-3', sectionId: 'la-section-3', name: 'Базис и размерность', description: 'Построение базиса, определение размерности', difficulty: 'intermediate', estimatedMinutes: 60 },
          { id: 'la-topic-3-4', sectionId: 'la-section-3', name: 'Скалярное произведение', description: 'Свойства, геометрический смысл, ортогональность', difficulty: 'intermediate', estimatedMinutes: 45 },
        ],
      },
      {
        id: 'la-section-4',
        name: 'Линейные преобразования',
        topics: [
          { id: 'la-topic-4-1', sectionId: 'la-section-4', name: 'Линейные операторы', description: 'Определение, матрица линейного оператора', difficulty: 'intermediate', estimatedMinutes: 45 },
          { id: 'la-topic-4-2', sectionId: 'la-section-4', name: 'Собственные числа', description: 'Характеристическое уравнение, вычисление', difficulty: 'advanced', estimatedMinutes: 60 },
          { id: 'la-topic-4-3', sectionId: 'la-section-4', name: 'Собственные векторы', description: 'Нахождение собственных векторов', difficulty: 'advanced', estimatedMinutes: 60 },
          { id: 'la-topic-4-4', sectionId: 'la-section-4', name: 'Диагонализация', description: 'Приведение матрицы к диагональному виду', difficulty: 'advanced', estimatedMinutes: 75 },
        ],
      },
    ],
  },
];

// Промпты
const LESSON_SYSTEM_PROMPT = `
Ты — эксперт по созданию образовательного контента для студентов университета.
Твоя задача — создать полный, структурированный урок по заданной теме.

ФОРМАТ ОТВЕТА: Строго JSON объект со следующей структурой:

{
  "theory": {
    "content": "Основной текст теории в Markdown (300-500 слов). Используй заголовки ##, списки, выделение **жирным** для важного.",
    "keyPoints": ["Ключевой тезис 1", "Ключевой тезис 2", "Ключевой тезис 3"],
    "formulas": [
      { "latex": "A \\\\times B = C", "description": "Описание формулы" }
    ]
  },
  "presentation": {
    "slides": [
      {
        "id": "slide-1",
        "title": "Заголовок слайда",
        "content": "Краткий контент слайда в Markdown",
        "type": "intro",
        "notes": "Заметки для преподавателя"
      }
    ]
  },
  "examples": [
    {
      "id": "ex-1",
      "problem": "Условие задачи",
      "solution": [
        { "step": 1, "action": "Что делаем на этом шаге", "result": "Результат", "formula": "LaTeX формула если есть" }
      ],
      "explanation": "Общее объяснение подхода к решению",
      "difficulty": "beginner"
    }
  ],
  "quiz": {
    "questions": [
      {
        "id": "q-1",
        "text": "Текст вопроса?",
        "options": [
          { "id": "a", "text": "Вариант A", "isCorrect": true },
          { "id": "b", "text": "Вариант B", "isCorrect": false },
          { "id": "c", "text": "Вариант C", "isCorrect": false },
          { "id": "d", "text": "Вариант D", "isCorrect": false }
        ],
        "explanation": "Объяснение правильного ответа"
      }
    ]
  },
  "flashcards": [
    { "id": "fc-1", "front": "Термин или вопрос", "back": "Определение или ответ", "tags": ["тег1", "тег2"] }
  ],
  "infographic": {
    "type": "process",
    "title": "Название инфографики",
    "data": {
      "steps": [
        { "label": "Шаг 1", "description": "Описание шага" }
      ]
    }
  }
}

ТРЕБОВАНИЯ К КОНТЕНТУ:

1. ЯЗЫК: Русский, академический но понятный стиль

2. THEORY: 300-500 слов, структурированный текст

3. PRESENTATION: 5-8 слайдов (intro, concept, formula, example, summary)

4. EXAMPLES: 2-3 примера с пошаговым решением

5. QUIZ: 3-5 вопросов single-choice с 4 вариантами

6. FLASHCARDS: 5-8 карточек

7. FORMULAS: LaTeX синтаксис с экранированием: \\\\frac, \\\\cdot
`;

const QUESTION_SYSTEM_PROMPT = `
Ты — эксперт по созданию диагностических тестов для студентов.
Создай вопросы для проверки понимания темы.

ФОРМАТ ОТВЕТА: JSON с массивом questions

{
  "questions": [
    {
      "id": "q-1",
      "text": "Полный текст вопроса?",
      "type": "single-choice",
      "options": [
        { "id": "a", "text": "Вариант A", "isCorrect": true },
        { "id": "b", "text": "Вариант B", "isCorrect": false },
        { "id": "c", "text": "Вариант C", "isCorrect": false },
        { "id": "d", "text": "Вариант D", "isCorrect": false }
      ],
      "correctAnswer": "a",
      "difficulty": "beginner",
      "explanation": "Объяснение правильного ответа",
      "hints": ["Подсказка 1", "Подсказка 2"]
    }
  ]
}

ТРЕБОВАНИЯ:
- Русский язык
- 4 варианта ответа, один правильный
- Правдоподобные неправильные ответы (distractors)
- Объяснение к каждому вопросу
`;

// OpenAI клиент
const openai = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
});

async function generateJSON<T>(systemPrompt: string, userPrompt: string): Promise<T> {
  const response = await openai.chat.completions.create({
    model: CONFIG.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: CONFIG.temperature,
    max_tokens: CONFIG.maxTokens,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('Empty response from OpenAI');

  return JSON.parse(content) as T;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface Topic {
  id: string;
  sectionId: string;
  name: string;
  description: string;
  difficulty: string;
  estimatedMinutes: number;
}

interface Section {
  id: string;
  name: string;
  topics: Topic[];
}

interface Subject {
  id: string;
  name: string;
  sections: Section[];
}

async function generateLessonForTopic(
  topic: Topic,
  sectionName: string,
  subjectName: string,
  subjectId: string
) {
  const userPrompt = `
Создай полный урок для следующей темы:

ПРЕДМЕТ: ${subjectName}
РАЗДЕЛ: ${sectionName}
ТЕМА: ${topic.name}
ОПИСАНИЕ ТЕМЫ: ${topic.description}
УРОВЕНЬ СЛОЖНОСТИ: ${topic.difficulty === 'beginner' ? 'Начальный' : topic.difficulty === 'intermediate' ? 'Средний' : 'Продвинутый'}
ВРЕМЯ НА ИЗУЧЕНИЕ: ${topic.estimatedMinutes} минут

Сгенерируй полный JSON урока согласно заданной структуре.
`.trim();

  const result = await generateJSON<any>(LESSON_SYSTEM_PROMPT, userPrompt);

  return {
    id: `lesson-${topic.id}`,
    topicId: topic.id,
    subjectId,
    ...result,
    generatedAt: new Date().toISOString(),
  };
}

async function generateQuestionsForTopic(
  topic: Topic,
  sectionName: string,
  subjectName: string,
  count: number = 3
) {
  const userPrompt = `
Создай ${count} диагностических вопросов для проверки знаний по теме:

ПРЕДМЕТ: ${subjectName}
РАЗДЕЛ: ${sectionName}
ТЕМА: ${topic.name}
ОПИСАНИЕ ТЕМЫ: ${topic.description}
СЛОЖНОСТЬ ТЕМЫ: ${topic.difficulty === 'beginner' ? 'Начальный' : topic.difficulty === 'intermediate' ? 'Средний' : 'Продвинутый'}

Сгенерируй JSON с массивом questions.
`.trim();

  const result = await generateJSON<{ questions: any[] }>(QUESTION_SYSTEM_PROMPT, userPrompt);

  return result.questions.map((q, index) => ({
    id: `${topic.id}-gen-q-${index + 1}`,
    topicId: topic.id,
    sectionId: topic.sectionId,
    ...q,
  }));
}

async function generateForSubject(subjectId: string) {
  const subject = subjects.find(s => s.id === subjectId);
  if (!subject) {
    console.error(`❌ Subject not found: ${subjectId}`);
    console.log('Available subjects:', subjects.map(s => s.id).join(', '));
    process.exit(1);
  }

  console.log(`\n🎓 Generating content for: ${subject.name}`);
  console.log('='.repeat(50));

  const lessons: any[] = [];
  const questions: any[] = [];

  let totalTopics = 0;
  subject.sections.forEach(s => totalTopics += s.topics.length);

  let completedTopics = 0;

  for (const section of subject.sections) {
    console.log(`\n📚 Section: ${section.name}`);

    for (const topic of section.topics) {
      completedTopics++;
      const progress = `[${completedTopics}/${totalTopics}]`;

      // Генерируем урок
      console.log(`  ${progress} 📖 Generating lesson: ${topic.name}...`);
      try {
        const lesson = await generateLessonForTopic(
          topic,
          section.name,
          subject.name,
          subject.id
        );
        lessons.push(lesson);
        console.log(`  ${progress} ✅ Lesson generated`);
      } catch (error) {
        console.error(`  ${progress} ❌ Failed to generate lesson:`, (error as Error).message);
      }

      await sleep(CONFIG.requestDelay);

      // Генерируем вопросы
      console.log(`  ${progress} ❓ Generating questions: ${topic.name}...`);
      try {
        const topicQuestions = await generateQuestionsForTopic(
          topic,
          section.name,
          subject.name,
          3
        );
        questions.push(...topicQuestions);
        console.log(`  ${progress} ✅ ${topicQuestions.length} questions generated`);
      } catch (error) {
        console.error(`  ${progress} ❌ Failed to generate questions:`, (error as Error).message);
      }

      await sleep(CONFIG.requestDelay);
    }
  }

  // Сохраняем результаты
  const outputDir = path.join(__dirname, '..', 'src', 'data', 'generated', subjectId);
  await fs.mkdir(outputDir, { recursive: true });

  await fs.writeFile(
    path.join(outputDir, 'lessons.json'),
    JSON.stringify(lessons, null, 2),
    'utf-8'
  );

  await fs.writeFile(
    path.join(outputDir, 'questions.json'),
    JSON.stringify(questions, null, 2),
    'utf-8'
  );

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Generation complete!`);
  console.log(`   📖 Lessons: ${lessons.length}`);
  console.log(`   ❓ Questions: ${questions.length}`);
  console.log(`   📁 Output: ${outputDir}`);
}

// Точка входа
const subjectId = process.argv[2] || 'linear-algebra';

if (!process.env.VITE_OPENAI_API_KEY && !process.env.OPENAI_API_KEY) {
  console.error('❌ Error: OPENAI_API_KEY or VITE_OPENAI_API_KEY environment variable is required');
  console.log('\nUsage:');
  console.log('  OPENAI_API_KEY=sk-... npx tsx scripts/generate-content.ts');
  console.log('  or');
  console.log('  Set VITE_OPENAI_API_KEY in .env file');
  process.exit(1);
}

generateForSubject(subjectId).catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
