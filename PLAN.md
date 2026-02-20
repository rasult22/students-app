# План реализации: Финальный тест и Персональный итог (Wrapped)

## Обзор

Реализация двух связанных фич:
1. **Финальный тест** — итоговое тестирование по всему предмету (доступен после изучения всех тем)
2. **Персональный итог (Wrapped)** — fullscreen слайды со статистикой в стиле Spotify Wrapped

---

## Часть 1: Финальный тест

### 1.1 Типы данных (`src/types/index.ts`)

Добавить интерфейсы:

```typescript
// Вопрос финального теста
export interface FinalTestQuestion {
  id: string;
  topicId: string;
  sectionId: string;
  text: string;
  type: QuestionType;
  options?: QuestionOption[];
  correctAnswer: string | string[];
  difficulty: DifficultyLevel;
  explanation?: string;
}

// Сессия финального теста
export interface FinalTestSession {
  id: string;
  subjectId: string;
  startedAt: Date;
  completedAt?: Date;
  questions: FinalTestQuestion[];
  answers: { questionId: string; answer: string; isCorrect: boolean }[];
  status: 'in-progress' | 'completed';
  score: number;
  sectionScores: Record<string, { correct: number; total: number }>;
}

// История финальных тестов
export interface FinalTestHistory {
  subjectId: string;
  attempts: FinalTestSession[];
  bestScore: number;
  lastAttemptAt?: Date;
}
```

### 1.2 Store (`src/stores/appStore.ts`)

Добавить в state:
```typescript
finalTestHistory: Record<string, FinalTestHistory>;
```

Добавить в persist:
```typescript
finalTestHistory: state.finalTestHistory,
```

Добавить actions:
```typescript
startFinalTest: (subjectId: string, questions: FinalTestQuestion[]) => void;
answerFinalTestQuestion: (questionId: string, answer: string, isCorrect: boolean) => void;
completeFinalTest: (subjectId: string) => void;
getFinalTestHistory: (subjectId: string) => FinalTestHistory | null;
canTakeFinalTest: (subjectId: string) => boolean; // проверка что все темы изучены
```

### 1.3 Генератор вопросов (`src/services/generators/finalTestGenerator.ts`)

Создать генератор:
- Принимает `Subject` и `userInterests`
- Генерирует 15-25 вопросов по всем разделам (пропорционально количеству тем)
- Распределение сложности: 30% beginner, 50% intermediate, 20% advanced
- Использует `generateJSON<FinalTestQuestion[]>()`

### 1.4 Компонент (`src/components/FinalTest/`)

Структура:
```
FinalTest/
├── FinalTest.tsx
├── FinalTest.module.css
├── FinalTestIntro.tsx      // Intro screen с условиями
├── FinalTestQuestion.tsx   // Карточка вопроса
└── FinalTestResults.tsx    // Экран результатов (ведёт к Wrapped)
```

**FinalTest.tsx:**
- Phases: `'intro' | 'testing' | 'results'`
- Props: `{ subject: Subject; onComplete: () => void; onShowWrapped: () => void }`
- Прогресс-бар сверху (текущий вопрос / всего)
- Timer опционально

**FinalTestIntro.tsx:**
- Иконка Trophy
- "Финальный тест по {subject.name}"
- Информация: количество вопросов, время, проходной балл
- История попыток (если есть)
- Кнопка "Начать тест"

**FinalTestQuestion.tsx:**
- Использует паттерн из DiagnosticTest
- Карточка вопроса с MathText для формул
- Grid опций
- Feedback после ответа (правильно/неправильно + объяснение)
- Кнопка "Далее"

**FinalTestResults.tsx:**
- Общий балл с анимацией (круговой прогресс)
- Breakdown по разделам
- Сравнение с прошлыми попытками (если есть)
- Кнопки: "Посмотреть итоги курса" → Wrapped, "Пересдать тест"

### 1.5 Интеграция в SubjectWorkspace

- Новый таб "Финальный тест" (иконка Trophy)
- Tab disabled если `!canTakeFinalTest(subjectId)`
- Tooltip при hover на disabled: "Изучите все темы"

---

## Часть 2: Персональный итог (Wrapped)

### 2.1 Типы данных (`src/types/index.ts`)

```typescript
// Слайд Wrapped
export interface WrappedSlide {
  id: string;
  type: 'intro' | 'stat' | 'highlight' | 'achievement' | 'section-breakdown' | 'progress-comparison' | 'certificate' | 'outro';
  title: string;
  subtitle?: string;
  value?: string | number;
  icon?: string;
  animation?: 'count-up' | 'reveal' | 'progress' | 'confetti';
  background?: 'gradient-1' | 'gradient-2' | 'gradient-3'; // разные mesh градиенты
}

// Данные для генерации Wrapped
export interface WrappedData {
  subjectId: string;
  subjectName: string;
  userName: string;
  finalTestScore: number;
  overallMastery: MasteryLevel;
  totalTopics: number;
  masteredTopics: number;
  totalFlashcards: number;
  masteredFlashcards: number;
  studyDays: number; // дней с активностью
  longestStreak: number; // максимальный streak
  bestSection: { name: string; score: number };
  hardestConquered: { name: string; initialScore: number; finalScore: number };
  improvement: number; // процент улучшения от первой диагностики
  totalAttempts: number; // общее количество попыток по всем темам
  completedAt: Date;
}

// Сохранённый Wrapped
export interface CourseWrapped {
  id: string;
  subjectId: string;
  data: WrappedData;
  slides: WrappedSlide[];
  generatedAt: Date;
  certificateId?: string;
}
```

### 2.2 Store (`src/stores/appStore.ts`)

Добавить:
```typescript
courseWrapped: Record<string, CourseWrapped>;
```

Actions:
```typescript
generateWrapped: (subjectId: string) => WrappedData;
saveWrapped: (wrapped: CourseWrapped) => void;
getWrapped: (subjectId: string) => CourseWrapped | null;
```

### 2.3 Генератор слайдов (`src/services/generators/wrappedGenerator.ts`)

```typescript
export function generateWrappedSlides(data: WrappedData): WrappedSlide[]
```

Генерирует 8-12 слайдов:

1. **Intro** — "Твой путь в {subjectName}" с именем пользователя
2. **Stat: Финальный балл** — большой счётчик с анимацией count-up
3. **Stat: Темы** — "{masteredTopics} из {totalTopics} тем освоено"
4. **Highlight: Лучший раздел** — "{bestSection.name} — твоя сила! {score}%"
5. **Highlight: Прогресс** — "С первого теста ты улучшился на {improvement}%"
6. **Achievement: Сложная тема** — "{hardestConquered.name}: было {initial}% → стало {final}%"
7. **Stat: Карточки** — "{masteredFlashcards} карточек в колоде, {mastered} освоено"
8. **Stat: Активность** — "{studyDays} дней обучения, streak {longestStreak} дней"
9. **Section Breakdown** — прогресс по всем разделам (mini-bars)
10. **Certificate** — превью сертификата
11. **Outro** — "Поздравляем! Курс завершён" + кнопки (скачать, поделиться)

### 2.4 Компонент (`src/components/CourseWrapped/`)

Структура:
```
CourseWrapped/
├── CourseWrapped.tsx         // Контейнер со слайдами
├── CourseWrapped.module.css
├── WrappedSlide.tsx          // Базовый слайд
├── WrappedNavigation.tsx     // Точки навигации + стрелки
└── slides/
    ├── IntroSlide.tsx
    ├── StatSlide.tsx
    ├── HighlightSlide.tsx
    ├── AchievementSlide.tsx
    ├── SectionBreakdownSlide.tsx
    ├── CertificateSlide.tsx
    └── OutroSlide.tsx
```

**CourseWrapped.tsx:**
- Fullscreen overlay (position: fixed, z-index: 1000)
- Swipe/keyboard навигация между слайдами
- Точки прогресса внизу
- Кнопка закрытия (X)
- AnimatePresence для переходов

**WrappedSlide.tsx:**
- Принимает `slide: WrappedSlide`
- Рендерит нужный тип слайда
- Mesh gradient backgrounds
- Центрированный контент

**Анимации:**
- `count-up` — числа считаются вверх (от 0 до value)
- `reveal` — текст появляется по буквам
- `progress` — progress bar заполняется
- `confetti` — конфетти при достижениях

**Навигация:**
- Свайп влево/вправо
- Клавиши стрелок
- Клик по точкам внизу
- Auto-advance опционально (5 сек)

### 2.5 CSS и анимации (`CourseWrapped.module.css`)

```css
.container {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: var(--color-void);
  overflow: hidden;
}

.slideContainer {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-8);
  text-align: center;
}

.gradient1 {
  background: radial-gradient(ellipse at 30% 20%, rgba(0, 212, 170, 0.3), transparent 50%),
              radial-gradient(ellipse at 70% 80%, rgba(139, 92, 246, 0.2), transparent 50%),
              var(--color-void);
}

.gradient2 {
  background: radial-gradient(ellipse at 50% 0%, rgba(251, 191, 36, 0.25), transparent 60%),
              var(--color-void);
}

.bigNumber {
  font-size: clamp(4rem, 15vw, 10rem);
  font-weight: 800;
  background: linear-gradient(135deg, var(--color-accent), var(--color-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.navigation {
  position: absolute;
  bottom: var(--space-8);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: var(--space-2);
}

.navDot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-muted);
  transition: all 0.3s;
}

.navDot.active {
  width: 24px;
  border-radius: var(--radius-full);
  background: var(--color-accent);
}
```

### 2.6 Хук useCountUp (`src/hooks/useCountUp.ts`)

```typescript
export function useCountUp(target: number, duration: number = 2000): number
```

Анимация счёта от 0 до target за duration мс.

### 2.7 Интеграция

1. FinalTestResults → кнопка "Посмотреть итоги" → открывает CourseWrapped
2. SubjectWorkspace Overview → если есть completed wrapped → кнопка "Посмотреть итоги курса"
3. Wrapped можно посмотреть повторно из истории

---

## Часть 3: Сертификат (бонус)

### 3.1 Компонент сертификата (`src/components/Certificate/`)

```
Certificate/
├── Certificate.tsx
├── Certificate.module.css
└── CertificatePreview.tsx
```

- SVG-based сертификат
- Данные: имя, предмет, дата, балл, grade (excellent/good/satisfactory)
- Возможность скачать как PNG (html2canvas)
- Возможность поделиться

### 3.2 Генерация сертификата

```typescript
export function generateCertificate(
  userName: string,
  subjectName: string,
  score: number,
  completedAt: Date
): Certificate
```

Grade:
- 90%+ → excellent
- 70-89% → good
- 50-69% → satisfactory
- <50% → no certificate (не пройден)

---

## Файловая структура новых файлов

```
src/
├── components/
│   ├── FinalTest/
│   │   ├── FinalTest.tsx
│   │   ├── FinalTest.module.css
│   │   ├── FinalTestIntro.tsx
│   │   ├── FinalTestQuestion.tsx
│   │   └── FinalTestResults.tsx
│   ├── CourseWrapped/
│   │   ├── CourseWrapped.tsx
│   │   ├── CourseWrapped.module.css
│   │   ├── WrappedSlide.tsx
│   │   ├── WrappedNavigation.tsx
│   │   └── slides/
│   │       ├── IntroSlide.tsx
│   │       ├── StatSlide.tsx
│   │       ├── HighlightSlide.tsx
│   │       ├── AchievementSlide.tsx
│   │       ├── SectionBreakdownSlide.tsx
│   │       ├── CertificateSlide.tsx
│   │       └── OutroSlide.tsx
│   └── Certificate/
│       ├── Certificate.tsx
│       ├── Certificate.module.css
│       └── CertificatePreview.tsx
├── services/generators/
│   ├── finalTestGenerator.ts
│   └── wrappedGenerator.ts
└── hooks/
    └── useCountUp.ts
```

---

## Порядок реализации

### Этап 1: Финальный тест
1. Типы данных в `types/index.ts`
2. Store slice + actions
3. `finalTestGenerator.ts`
4. Компоненты FinalTest
5. Интеграция в SubjectWorkspace (новый таб)

### Этап 2: Wrapped
1. Типы данных для Wrapped
2. Store slice + actions
3. `wrappedGenerator.ts`
4. `useCountUp` hook
5. Компоненты CourseWrapped
6. Интеграция с FinalTestResults

### Этап 3: Сертификат
1. Компонент Certificate
2. Интеграция в Wrapped (CertificateSlide)
3. Функция скачивания

---

## Примечания

- Финальный тест доступен только когда все темы изучены (`attempts > 0` для каждой)
- Можно пересдавать неограниченно, сохраняется история всех попыток
- Wrapped показывает данные последней успешной попытки (или лучшей)
- Highlights "расширенные": балл, лучшая тема, прогресс, карточки, streak, сравнение
- Формат слайдов как Spotify Wrapped: fullscreen, свайп, анимации
