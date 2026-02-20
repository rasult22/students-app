# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start Vite dev server with HMR
npm run build    # TypeScript build + Vite production build
npm run lint     # Run ESLint
npm run preview  # Preview production build locally
```

## Architecture

React + TypeScript student learning app built with Vite. Helps students learn subjects through diagnostic testing, knowledge tracking, and AI-generated lessons.

### Core Structure

- **State Management**: Zustand store (`src/stores/appStore.ts`) with persistence to localStorage (`student-app-storage` key). Persisted slices: user, isOnboarded, knowledgeStates, generatedLessons, flashcardProgress, addedToReviewDeck, customSubjects.
- **Routing**: React Router v7 with protected routes via `ProtectedRoute` component.
- **Styling**: CSS Modules with "Constellation" design system (`src/styles/design-tokens.css`) - dark theme with bioluminescent accents.

### Routes (`src/App.tsx`)

- `/` - Onboarding (redirects to /subjects if authenticated)
- `/subjects` - Subject list
- `/subjects/:subjectId` - Subject workspace (tabs: Overview, Diagnostic, Learning Plan, Review, Knowledge Map)
- `/subjects/:subjectId/topic/:topicId` - Topic lesson page
- `/knowledge-map` - Global knowledge graph
- `/create-subject` - Custom subject creation from PDF/URL

### Key Data Models (`src/types/index.ts`)

- `Subject` → `Section` → `Topic` hierarchy (supports `isCustom` flag for user-created subjects)
- `KnowledgeState` tracks per-topic mastery (unknown/struggling/learning/mastered)
- `TopicLesson` with theory, presentation slides, examples, quiz, and flashcards
- `FlashcardProgress` for spaced repetition (SM-2 algorithm)
- `ReviewQuality` (0-5 scale for SM-2)

### AI Content Generation (`src/services/`)

- `openai/client.ts` - OpenAI wrapper: `generateJSON()`, `generateText()`, `analyzeImages()` (for Vision)
- `openai/config.ts` - Default model: `gpt-4o-mini`, Vision uses `gpt-4o`
- `generators/lessonGenerator.ts` - Generates complete topic lessons
- `generators/questionGenerator.ts` - Generates diagnostic questions
- `generators/structureGenerator.ts` - Generates subject curriculum from extracted content
- `contentExtractor.ts` - Extracts text from PDFs (via GPT-4 Vision) and URLs
- `spacedRepetition.ts` - SM-2 algorithm implementation

### Custom Subject Creation Flow

1. User uploads PDF or enters URL → `contentExtractor.ts` extracts text
2. PDF pages rendered to images via pdfjs-dist, sent to GPT-4 Vision
3. Extracted text → `structureGenerator.ts` creates Subject with sections/topics
4. Subject saved to `customSubjects` in store with `isCustom: true`

### Review Deck System

Cards must be explicitly added to review deck via `addCardToReviewDeck()`. Only cards in `addedToReviewDeck` map appear in subject-level review sessions. This allows users to selectively choose which flashcards to study.

### LaTeX Support

- `MathText` - inline/block LaTeX via KaTeX
- `MarkdownMath` - mixed Markdown + LaTeX with auto-detection

### Fonts

- Outfit (geometric sans) - headings/UI
- Crimson Pro (serif) - body text
- JetBrains Mono - code/technical

## Environment Variables

```
VITE_OPENAI_API_KEY=sk-...  # Required for AI content generation
```
