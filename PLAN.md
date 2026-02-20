# План: Загрузка пользовательских материалов для создания курса

## Обзор

Добавить возможность создания курса из пользовательских материалов (PDF, текст, ссылки на веб-страницы) с помощью AI-генерации структуры.

## Выбранные решения
- **PDF парсинг**: Через OpenAI GPT-4 Vision (base64)
- **Веб-страницы**: Fetch + strip HTML
- **UI**: Кнопка на странице Subjects + отдельный route /create-subject
- **Хранение**: Только структура курса (без исходных материалов)

---

## Архитектура изменений

```
src/
├── services/
│   ├── openai/
│   │   └── client.ts           # + analyzeImage() для Vision API
│   │
│   ├── generators/
│   │   └── structureGenerator.ts   # Проверка/обновление
│   │
│   └── contentExtractor.ts     # НОВЫЙ: извлечение текста из PDF/URL
│
├── types/
│   └── index.ts                # + isCustom поле для Subject
│
├── stores/
│   └── appStore.ts             # + customSubjects, actions
│
├── components/
│   └── SubjectUploader/        # НОВЫЙ: компонент загрузки
│       ├── SubjectUploader.tsx
│       ├── SubjectUploader.module.css
│       └── index.ts
│
└── pages/
    ├── CreateSubject/          # НОВАЯ страница
    │   ├── CreateSubject.tsx
    │   ├── CreateSubject.module.css
    │   └── index.ts
    └── Subjects/
        └── SubjectsList.tsx    # + кнопка "Создать курс"
---

## Этапы реализации

### Этап 1: Типы данных и Store

**Файл: `src/types/index.ts`**
- Расширить `Subject` интерфейс полем `isCustom?: boolean` для отличия пользовательских курсов
- Добавить `MaterialSource` type для метаданных источника

**Файл: `src/stores/appStore.ts`**
- Добавить в state: `customSubjects: Subject[]`
- Добавить actions:
  - `addCustomSubject(subject: Subject)`
  - `deleteCustomSubject(subjectId: string)`
  - `updateCustomSubject(subjectId: string, updates: Partial<Subject>)`
- Добавить `subjectCreationProgress` в state для UI индикации
- Включить `customSubjects` в persist middleware

---

### Этап 2: Сервисы извлечения контента

**Новый файл: `src/services/contentExtractor.ts`**
```typescript
// Функции:
extractTextFromPDF(file: File): Promise<string>
  - Конвертировать PDF страницы в base64 images
  - Отправить в OpenAI Vision API
  - Получить распознанный текст

extractTextFromURL(url: string): Promise<string>
  - Fetch страницы через CORS proxy
  - Удалить HTML теги, скрипты, стили
  - Вернуть чистый текст

normalizeText(text: string): string
  - Базовая нормализация (trim, удаление лишних пробелов)
```

**Обновить: `src/services/openai/client.ts`**
- Добавить метод `analyzeImages(base64Images: string[], prompt: string)` для работы с Vision API

---

### Этап 3: Генератор структуры курса

**Проверить/обновить: `src/services/generators/structureGenerator.ts`**
- Убедиться что `generateSubjectStructure()` работает корректно
- Адаптировать промпт для работы с разным контентом
- Добавить параметр для названия курса от пользователя

---

### Этап 4: UI компоненты

**Новый файл: `src/components/SubjectUploader/SubjectUploader.tsx`**
```
Компонент с табами:
1. "Текст" - textarea для вставки текста
2. "PDF" - drag & drop зона для файла (до 20MB)
3. "Ссылка" - input для URL

+ Input для названия курса
+ Input для описания (опционально)
+ Button "Создать курс"
+ Progress indicator
```

**Новый файл: `src/components/SubjectUploader/SubjectUploader.module.css`**
- Стили в соответствии с design-tokens.css (Constellation theme)

---

### Этап 5: Страница создания курса

**Новая папка: `src/pages/CreateSubject/`**
- `CreateSubject.tsx` - страница с SubjectUploader
- `CreateSubject.module.css` - стили
- `index.ts` - экспорт

Функционал:
- Ввод названия курса
- Выбор источника материала (табы)
- Загрузка/ввод контента
- Progress во время генерации
- Redirect на /subjects/:id после успеха

---

### Этап 6: Интеграция в роутинг и навигацию

**Обновить: `src/App.tsx`**
- Добавить route `/create-subject` → CreateSubject

**Обновить: `src/pages/Subjects/SubjectsList.tsx`**
- Добавить кнопку "Создать курс" → navigate('/create-subject')
- Объединить hardcoded subjects с customSubjects из store

**Обновить: `src/data/subjects.ts`**
- `getSubjectById()` должен искать и в hardcoded, и в customSubjects

---

## Порядок файлов для реализации

1. `src/types/index.ts` - типы
2. `src/stores/appStore.ts` - state management
3. `src/services/openai/client.ts` - Vision API метод
4. `src/services/contentExtractor.ts` - новый сервис
5. `src/services/generators/structureGenerator.ts` - проверка
6. `src/components/SubjectUploader/*` - новый компонент
7. `src/pages/CreateSubject/*` - новая страница
8. `src/App.tsx` - роутинг
9. `src/pages/Subjects/SubjectsList.tsx` - кнопка + объединение
10. `src/data/subjects.ts` - обновить getSubjectById

---

## Зависимости

Никаких новых npm пакетов не требуется:
- OpenAI уже установлен
- PDF парсинг через OpenAI Vision (не нужен pdfjs)
- Fetch нативный

---

## UI Flow

```
[Subjects Page]
     |
     v
[+ Создать курс] ──► [/create-subject]
                           |
                           v
                    [Ввод названия]
                    [Табы: Текст | PDF | Ссылка]
                    [Загрузка контента]
                           |
                           v
                    [Кнопка "Создать"]
                           |
                           v
                    [Progress: Извлечение...]
                    [Progress: Генерация...]
                           |
                           v
                    [Redirect → /subjects/:id]
```

---

## Технические детали

### PDF через Vision API
```typescript
// 1. Рендерим PDF страницы в canvas (pdfjs для рендеринга)
// 2. Конвертируем canvas в base64 PNG
// 3. Отправляем массив изображений в GPT-4 Vision
// 4. Получаем распознанный текст
```

### URL Fetching
```typescript
// Используем CORS proxy (allorigins.win или собственный)
// Простой strip HTML через DOMParser
// Извлекаем текстовый контент
```

### Лимиты
- PDF: до 20 страниц (можно обрезать)
- Text: до 100,000 символов
- URL: один URL за раз
