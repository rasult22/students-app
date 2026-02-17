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

This is a React + TypeScript student learning application built with Vite. The app helps students learn subjects (currently focused on mathematics like Linear Algebra, Calculus, Probability Theory) through diagnostic testing and knowledge tracking.

### Core Structure

- **State Management**: Zustand store (`src/stores/appStore.ts`) with persistence middleware. Handles user profile, knowledge states, and diagnostic sessions.
- **Routing**: React Router v7 with protected routes. Onboarding flow redirects unauthenticated users.
- **Styling**: CSS Modules with a "Constellation" design system defined in `src/styles/design-tokens.css` (dark theme with bioluminescent accents).

### Key Data Models (`src/types/index.ts`)

- `Subject` → `Section` → `Topic` hierarchy for curriculum
- `KnowledgeState` tracks per-topic mastery (unknown/struggling/learning/mastered)
- `DiagnosticSession` and `DiagnosticQuestion` for testing flow

### Component Organization

- `src/components/ui/` - Reusable primitives (Button, Input, Card)
- `src/components/layout/` - Page layouts (MainLayout, DashboardLayout, AppHeader, PageTransition)
- `src/components/` - Feature components (DiagnosticTest, KnowledgeMap, LearningPlan)
- `src/pages/` - Route-level components (Onboarding, Subjects, SubjectWorkspace, GlobalKnowledgeMap)

### Knowledge Visualization

Uses Cytoscape.js (`react-cytoscapejs`) for interactive knowledge graph visualization showing topic relationships and mastery states.

### Fonts

Three custom fonts via @fontsource packages:
- Outfit (geometric sans) for headings/UI
- Crimson Pro (serif) for body text
- JetBrains Mono for code/technical elements
