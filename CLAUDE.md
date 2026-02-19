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

This is a React + TypeScript student learning application built with Vite. The app helps students learn subjects (currently focused on mathematics like Linear Algebra, Calculus, Probability Theory) through diagnostic testing, knowledge tracking, and AI-generated lessons.

### Core Structure

- **State Management**: Zustand store (`src/stores/appStore.ts`) with persistence middleware. Handles user profile, knowledge states, diagnostic sessions, and flashcard progress.
- **Routing**: React Router v7 with protected routes. Onboarding flow redirects unauthenticated users.
- **Styling**: CSS Modules with a "Constellation" design system defined in `src/styles/design-tokens.css` (dark theme with bioluminescent accents).
- **AI Content Generation**: OpenAI integration (`src/services/openai/`, `src/services/generators/`) for generating lessons, questions, and subject structures.

### Key Data Models (`src/types/index.ts`)

- `Subject` → `Section` → `Topic` hierarchy for curriculum
- `KnowledgeState` tracks per-topic mastery (unknown/struggling/learning/mastered)
- `DiagnosticSession` and `DiagnosticQuestion` for testing flow
- `TopicLesson` with theory, presentation slides, examples, quiz, and flashcards
- `FlashcardProgress` for spaced repetition (SM-2 algorithm)

### Component Organization

- `src/components/ui/` - Reusable primitives (Button, Input, Card, MathText, MarkdownMath)
- `src/components/layout/` - Page layouts (MainLayout, DashboardLayout, AppHeader, PageTransition)
- `src/components/` - Feature components (DiagnosticTest, KnowledgeMap, LearningPlan, TopicLesson)
- `src/pages/` - Route-level components (Onboarding, Subjects, SubjectWorkspace, GlobalKnowledgeMap, TopicLessonPage)
- `src/services/` - Business logic (OpenAI client, generators, prompts, spacedRepetition)

### AI Content Generation (`src/services/`)

- `openai/client.ts` - OpenAI API wrapper with `generateJSON()` and `generateText()`
- `generators/lessonGenerator.ts` - Generates complete topic lessons
- `generators/questionGenerator.ts` - Generates diagnostic questions
- `generators/structureGenerator.ts` - Generates subject curriculum structure
- `prompts/` - Prompt templates for each generator
- `spacedRepetition.ts` - SM-2 algorithm for flashcard scheduling

### Knowledge Visualization

Uses Cytoscape.js for interactive knowledge graph visualization showing topic relationships and mastery states.

### LaTeX Support

- `MathText` component for inline/block LaTeX rendering via KaTeX
- `MarkdownMath` component for mixed Markdown + LaTeX content with auto-detection

### Fonts

Three custom fonts via @fontsource packages:
- Outfit (geometric sans) for headings/UI
- Crimson Pro (serif) for body text
- JetBrains Mono for code/technical elements

## Environment Variables

```
VITE_OPENAI_API_KEY=sk-...  # Required for AI content generation
```
