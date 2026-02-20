# План: Включение диагностики для пользовательских курсов

## Текущая ситуация

1. **Диагностика отключена для пользовательских курсов** (`DiagnosticTest.tsx:201`):
   - Проверка `!hasQuestions && isCustomSubject` показывает заглушку
   - `getQuestionsForSubject()` ищет вопросы только в статическом массиве `diagnosticQuestions`
   - Для пользовательских курсов вопросов нет, поэтому диагностика недоступна

2. **Генератор вопросов уже существует** (`questionGenerator.ts`):
   - `generateDiagnosticQuestions()` генерирует вопросы через OpenAI
   - Принимает topic, sectionName, subjectName и создаёт DiagnosticQuestion[]

3. **Проблема с иконкой** (`DiagnosticTest.tsx:209-210`):
   - AlertCircle внутри div с inline background, но без размеров и border-radius
   - CSS класс `.introIcon` имеет только `font-size` и `margin-bottom`
   - На скриншоте видно квадратный контейнер вместо круглого

---

## План реализации

### Задача 1: Исправить иконку предупреждения

**Файл:** `src/components/DiagnosticTest/DiagnosticTest.module.css`

Добавить стили для контейнера с иконкой, когда у него есть фон:

```css
.introIcon {
  /* существующие стили */
  font-size: 4rem;
  margin-bottom: var(--space-6);
  animation: float 3s ease-in-out infinite;

  /* добавить */
  display: flex;
  align-items: center;
  justify-content: center;
  width: 96px;
  height: 96px;
  border-radius: var(--radius-xl);
}
```

---

### Задача 2: Включить диагностику для пользовательских курсов

**Подход:** Генерировать вопросы "на лету" при запуске диагностики.

#### Шаг 1: Изменить DiagnosticTest.tsx

1. Добавить состояния:
   ```typescript
   const [isGenerating, setIsGenerating] = useState(false);
   const [generatedQuestions, setGeneratedQuestions] = useState<DiagnosticQuestion[]>([]);
   const [generationError, setGenerationError] = useState<string | null>(null);
   ```

2. Создать функцию генерации вопросов:
   ```typescript
   const generateQuestionsForSubject = async () => {
     setIsGenerating(true);
     setGenerationError(null);

     try {
       const allQuestions: DiagnosticQuestion[] = [];

       // Генерируем по 2-3 вопроса на раздел
       for (const section of subject.sections) {
         // Берём первые 2 топика из каждого раздела
         const topicsToUse = section.topics.slice(0, 2);

         for (const topic of topicsToUse) {
           const questions = await generateDiagnosticQuestions(
             topic,
             section.name,
             subject.name,
             2 // 2 вопроса на топик
           );
           allQuestions.push(...questions);
         }
       }

       setGeneratedQuestions(allQuestions);
       return allQuestions;
     } catch (error) {
       setGenerationError('Не удалось сгенерировать вопросы');
       throw error;
     } finally {
       setIsGenerating(false);
     }
   };
   ```

3. Изменить `startTest`:
   ```typescript
   const startTest = async () => {
     if (isCustomSubject && allQuestions.length === 0) {
       // Генерируем вопросы для пользовательского курса
       const questions = await generateQuestionsForSubject();
       // Обновляем allQuestions
     }

     startDiagnostic(subject.id);
     setPhase('testing');
     setStartTime(Date.now());
     const firstQuestion = selectNextQuestion();
     setCurrentQuestion(firstQuestion);
   };
   ```

4. Убрать ранний return для `!hasQuestions && isCustomSubject`

5. Обновить intro-экран для пользовательских курсов:
   - Показать индикатор загрузки при `isGenerating`
   - Показать ошибку при `generationError`
   - Изменить текст на "Для пользовательского курса вопросы будут сгенерированы автоматически"

#### Шаг 2: Адаптировать selectNextQuestion

Изменить `selectNextQuestion` чтобы он использовал либо `allQuestions`, либо `generatedQuestions`:

```typescript
const questionsPool = isCustomSubject ? generatedQuestions : allQuestions;
```

---

## Файлы для изменения

1. `src/components/DiagnosticTest/DiagnosticTest.tsx`
   - Добавить импорт `generateDiagnosticQuestions`
   - Добавить состояния для генерации
   - Изменить логику старта теста
   - Обновить UI для loading/error состояний

2. `src/components/DiagnosticTest/DiagnosticTest.module.css`
   - Добавить стили для `.introIcon` с фоном
   - Добавить стили для loading состояния (`.generating`)

---

## UI States

### Intro Screen (пользовательский курс)

```
[Иконка Search или Sparkles]
"Диагностика знаний"

Для пользовательского курса вопросы будут
сгенерированы автоматически с помощью AI.
Это займёт несколько секунд.

• ~8-12 вопросов
• Адаптивный алгоритм
• Персональный план

[Начать диагностику]
```

### Generating State

```
[Spinner или Pulse иконка]
"Генерация вопросов..."

Создаём персонализированные вопросы
на основе структуры курса.

Раздел 2 из 4...
```

### Error State

```
[AlertCircle - круглая иконка]
"Ошибка генерации"

Не удалось сгенерировать вопросы.
Проверьте подключение к интернету.

[Попробовать снова] [К учебному плану]
```
