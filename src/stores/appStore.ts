import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  UserProfile,
  Interest,
  KnowledgeState,
  DiagnosticSession,
  DiagnosticAnswer,
  MasteryLevel,
  TopicLesson,
  GenerationProgress,
  FlashcardProgress,
  ReviewQuality,
  Subject,
  FinalTestQuestion,
  FinalTestSession,
  FinalTestHistory,
  FinalTestAnswer,
  CourseWrapped,
  WrappedData,
} from '../types';
import {
  createInitialProgress,
  processReview,
  getDueCards,
  sortByReviewPriority,
} from '../services/spacedRepetition';

interface AppState {
  // User
  user: UserProfile | null;
  isOnboarded: boolean;

  // Subjects & Learning
  currentSubjectId: string | null;
  currentTopicId: string | null;
  knowledgeStates: Record<string, KnowledgeState>; // keyed by topicId
  diagnosticSession: DiagnosticSession | null;

  // Custom subjects (user-created)
  customSubjects: Subject[];

  // Generated content
  generatedLessons: Record<string, TopicLesson>; // keyed by topicId
  generationProgress: GenerationProgress;

  // Flashcard spaced repetition progress
  flashcardProgress: Record<string, FlashcardProgress>; // keyed by cardId

  // Карточки, добавленные в колоду для повторения (cardId -> true)
  addedToReviewDeck: Record<string, boolean>;

  // Final test
  currentFinalTest: FinalTestSession | null;
  finalTestHistory: Record<string, FinalTestHistory>; // keyed by subjectId

  // Course Wrapped (personal summary)
  courseWrapped: Record<string, CourseWrapped>; // keyed by subjectId

  // Actions
  setUser: (name: string, interests: Interest[]) => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  clearUser: () => void;

  setCurrentSubject: (subjectId: string | null) => void;
  setCurrentTopic: (topicId: string | null) => void;

  // Knowledge tracking
  updateKnowledge: (topicId: string, isCorrect: boolean) => void;
  setTopicScore: (topicId: string, correct: number, total: number) => void;
  getTopicMastery: (topicId: string) => MasteryLevel;
  getSectionMastery: (topicIds: string[]) => { level: MasteryLevel; score: number };

  // Diagnostic
  startDiagnostic: (subjectId: string) => void;
  submitAnswer: (answer: Omit<DiagnosticAnswer, 'answeredAt'>) => void;
  completeDiagnostic: () => void;

  // Generated content
  setGeneratedLesson: (topicId: string, lesson: TopicLesson) => void;
  getGeneratedLesson: (topicId: string) => TopicLesson | undefined;
  loadGeneratedLessons: (lessons: TopicLesson[]) => void;
  setGenerationProgress: (progress: Partial<GenerationProgress>) => void;

  // Flashcard spaced repetition
  initializeCardProgress: (cardId: string, topicId: string, subjectId: string) => FlashcardProgress;
  reviewCard: (cardId: string, quality: ReviewQuality) => void;
  getCardProgress: (cardId: string) => FlashcardProgress | undefined;
  getDueCardsForTopic: (topicId: string) => FlashcardProgress[];
  getDueCardsForSubject: (subjectId: string) => FlashcardProgress[];
  getCardsForSubject: (subjectId: string) => FlashcardProgress[];
  getAllDueCards: () => FlashcardProgress[];

  // Управление колодой карточек для повторения
  addCardToReviewDeck: (cardId: string, topicId: string, subjectId: string) => void;
  removeCardFromReviewDeck: (cardId: string) => void;
  isCardInReviewDeck: (cardId: string) => boolean;
  getReviewDeckCards: (subjectId: string) => FlashcardProgress[];

  // Custom subjects
  addCustomSubject: (subject: Subject) => void;
  deleteCustomSubject: (subjectId: string) => void;
  getCustomSubject: (subjectId: string) => Subject | undefined;

  // Final test
  canTakeFinalTest: (subjectId: string, allTopicIds: string[]) => boolean;
  startFinalTest: (subjectId: string, questions: FinalTestQuestion[]) => void;
  answerFinalTestQuestion: (questionId: string, answer: string, isCorrect: boolean, sectionId: string) => void;
  completeFinalTest: () => FinalTestSession | null;
  getFinalTestHistory: (subjectId: string) => FinalTestHistory | null;
  getCurrentFinalTest: () => FinalTestSession | null;

  // Course Wrapped
  saveWrapped: (wrapped: CourseWrapped) => void;
  getWrapped: (subjectId: string) => CourseWrapped | null;
  generateWrappedData: (subjectId: string, subjectName: string, sections: { id: string; name: string; topicIds: string[] }[], finalTestScore: number) => WrappedData;
}

const calculateMasteryLevel = (score: number, attempts: number): MasteryLevel => {
  if (attempts === 0) return 'unknown';
  if (score >= 80) return 'mastered';
  if (score >= 50) return 'learning';
  return 'struggling';
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      isOnboarded: false,
      currentSubjectId: null,
      currentTopicId: null,
      knowledgeStates: {},
      diagnosticSession: null,
      customSubjects: [],
      generatedLessons: {},
      generationProgress: { status: 'idle' },
      flashcardProgress: {},
      addedToReviewDeck: {},
      currentFinalTest: null,
      finalTestHistory: {},
      courseWrapped: {},

      setUser: (name, interests) => {
        const user: UserProfile = {
          id: crypto.randomUUID(),
          name,
          interests,
          createdAt: new Date(),
        };
        set({ user, isOnboarded: true });
      },

      updateUser: (updates) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...updates } });
        }
      },

      clearUser: () => {
        set({
          user: null,
          isOnboarded: false,
          knowledgeStates: {},
          diagnosticSession: null,
        });
      },

      setCurrentSubject: (subjectId) => {
        set({ currentSubjectId: subjectId });
      },

      setCurrentTopic: (topicId) => {
        set({ currentTopicId: topicId });
      },

      updateKnowledge: (topicId, isCorrect) => {
        const { knowledgeStates } = get();
        const current = knowledgeStates[topicId] || {
          topicId,
          masteryLevel: 'unknown' as MasteryLevel,
          score: 0,
          attempts: 0,
          correctAnswers: 0,
          totalAnswers: 0,
        };

        const newCorrect = current.correctAnswers + (isCorrect ? 1 : 0);
        const newTotal = current.totalAnswers + 1;
        const newScore = Math.round((newCorrect / newTotal) * 100);

        const updated: KnowledgeState = {
          ...current,
          score: newScore,
          attempts: current.attempts + 1,
          correctAnswers: newCorrect,
          totalAnswers: newTotal,
          masteryLevel: calculateMasteryLevel(newScore, current.attempts + 1),
          lastAttemptAt: new Date(),
        };

        set({
          knowledgeStates: {
            ...knowledgeStates,
            [topicId]: updated,
          },
        });
      },

      // Установить score темы напрямую (заменяет предыдущий результат)
      setTopicScore: (topicId, correct, total) => {
        const { knowledgeStates } = get();
        const newScore = total > 0 ? Math.round((correct / total) * 100) : 0;

        const updated: KnowledgeState = {
          topicId,
          score: newScore,
          attempts: 1,
          correctAnswers: correct,
          totalAnswers: total,
          masteryLevel: calculateMasteryLevel(newScore, 1),
          lastAttemptAt: new Date(),
        };

        set({
          knowledgeStates: {
            ...knowledgeStates,
            [topicId]: updated,
          },
        });
      },

      getTopicMastery: (topicId) => {
        const { knowledgeStates } = get();
        return knowledgeStates[topicId]?.masteryLevel || 'unknown';
      },

      getSectionMastery: (topicIds) => {
        const { knowledgeStates } = get();
        if (topicIds.length === 0) {
          return { level: 'unknown' as MasteryLevel, score: 0 };
        }

        let totalScore = 0;
        let knownTopics = 0;

        topicIds.forEach((id) => {
          const state = knowledgeStates[id];
          if (state && state.attempts > 0) {
            totalScore += state.score;
            knownTopics++;
          }
        });

        if (knownTopics === 0) {
          return { level: 'unknown' as MasteryLevel, score: 0 };
        }

        const avgScore = Math.round(totalScore / knownTopics);
        return {
          level: calculateMasteryLevel(avgScore, knownTopics),
          score: avgScore,
        };
      },

      startDiagnostic: (subjectId) => {
        const session: DiagnosticSession = {
          id: crypto.randomUUID(),
          subjectId,
          startedAt: new Date(),
          questions: [],
          currentQuestionIndex: 0,
          status: 'in-progress',
        };
        set({ diagnosticSession: session });
      },

      submitAnswer: (answer) => {
        const { diagnosticSession, updateKnowledge } = get();
        if (!diagnosticSession) return;

        const fullAnswer: DiagnosticAnswer = {
          ...answer,
          answeredAt: new Date(),
        };

        // Update knowledge state
        updateKnowledge(answer.topicId, answer.isCorrect);

        set({
          diagnosticSession: {
            ...diagnosticSession,
            questions: [...diagnosticSession.questions, fullAnswer],
            currentQuestionIndex: diagnosticSession.currentQuestionIndex + 1,
          },
        });
      },

      completeDiagnostic: () => {
        const { diagnosticSession } = get();
        if (!diagnosticSession) return;

        set({
          diagnosticSession: {
            ...diagnosticSession,
            status: 'completed',
            completedAt: new Date(),
          },
        });
      },

      // Generated content actions
      setGeneratedLesson: (topicId, lesson) => {
        const { generatedLessons } = get();
        set({
          generatedLessons: {
            ...generatedLessons,
            [topicId]: lesson,
          },
        });
      },

      getGeneratedLesson: (topicId) => {
        const { generatedLessons } = get();
        return generatedLessons[topicId];
      },

      loadGeneratedLessons: (lessons) => {
        const lessonsMap: Record<string, TopicLesson> = {};
        lessons.forEach((lesson) => {
          lessonsMap[lesson.topicId] = lesson;
        });
        set({ generatedLessons: lessonsMap });
      },

      setGenerationProgress: (progress) => {
        const { generationProgress } = get();
        set({
          generationProgress: {
            ...generationProgress,
            ...progress,
          },
        });
      },

      // Flashcard spaced repetition actions
      initializeCardProgress: (cardId, topicId, subjectId) => {
        const { flashcardProgress } = get();

        // Если прогресс уже существует, возвращаем его
        if (flashcardProgress[cardId]) {
          return flashcardProgress[cardId];
        }

        const newProgress = createInitialProgress(cardId, topicId, subjectId);
        set({
          flashcardProgress: {
            ...flashcardProgress,
            [cardId]: newProgress,
          },
        });
        return newProgress;
      },

      reviewCard: (cardId, quality) => {
        const { flashcardProgress } = get();
        const current = flashcardProgress[cardId];

        if (!current) {
          console.warn(`No progress found for card ${cardId}`);
          return;
        }

        const updated = processReview(current, quality);
        set({
          flashcardProgress: {
            ...flashcardProgress,
            [cardId]: updated,
          },
        });
      },

      getCardProgress: (cardId) => {
        const { flashcardProgress } = get();
        return flashcardProgress[cardId];
      },

      getDueCardsForTopic: (topicId) => {
        const { flashcardProgress } = get();
        const topicCards = Object.values(flashcardProgress).filter(
          (p) => p.topicId === topicId
        );
        return sortByReviewPriority(getDueCards(topicCards));
      },

      getDueCardsForSubject: (subjectId) => {
        const { flashcardProgress, addedToReviewDeck } = get();
        // Только карточки, добавленные в колоду
        const subjectCards = Object.values(flashcardProgress).filter(
          (p) => p.subjectId === subjectId && addedToReviewDeck[p.cardId]
        );
        return sortByReviewPriority(getDueCards(subjectCards));
      },

      getCardsForSubject: (subjectId) => {
        const { flashcardProgress } = get();
        return Object.values(flashcardProgress).filter(
          (p) => p.subjectId === subjectId
        );
      },

      getAllDueCards: () => {
        const { flashcardProgress, addedToReviewDeck } = get();
        // Возвращаем только карточки, добавленные в колоду
        const addedCards = Object.values(flashcardProgress).filter(
          (p) => addedToReviewDeck[p.cardId]
        );
        return sortByReviewPriority(getDueCards(addedCards));
      },

      // Добавить карточку в колоду для повторения
      addCardToReviewDeck: (cardId, topicId, subjectId) => {
        const { addedToReviewDeck, flashcardProgress } = get();

        // Инициализируем прогресс если его ещё нет
        let progress = flashcardProgress[cardId];
        if (!progress) {
          progress = createInitialProgress(cardId, topicId, subjectId);
          set({
            flashcardProgress: {
              ...flashcardProgress,
              [cardId]: progress,
            },
          });
        }

        set({
          addedToReviewDeck: {
            ...addedToReviewDeck,
            [cardId]: true,
          },
        });
      },

      // Убрать карточку из колоды
      removeCardFromReviewDeck: (cardId) => {
        const { addedToReviewDeck } = get();
        const updated = { ...addedToReviewDeck };
        delete updated[cardId];
        set({ addedToReviewDeck: updated });
      },

      // Проверить, добавлена ли карточка в колоду
      isCardInReviewDeck: (cardId) => {
        const { addedToReviewDeck } = get();
        return !!addedToReviewDeck[cardId];
      },

      // Получить карточки из колоды для предмета
      getReviewDeckCards: (subjectId) => {
        const { flashcardProgress, addedToReviewDeck } = get();
        return Object.values(flashcardProgress).filter(
          (p) => p.subjectId === subjectId && addedToReviewDeck[p.cardId]
        );
      },

      // Custom subjects actions
      addCustomSubject: (subject) => {
        const { customSubjects } = get();
        // Помечаем как пользовательский курс
        const customSubject: Subject = {
          ...subject,
          isCustom: true,
          createdAt: new Date(),
        };
        set({ customSubjects: [...customSubjects, customSubject] });
      },

      deleteCustomSubject: (subjectId) => {
        const { customSubjects } = get();
        set({
          customSubjects: customSubjects.filter((s) => s.id !== subjectId),
        });
      },

      getCustomSubject: (subjectId) => {
        const { customSubjects } = get();
        return customSubjects.find((s) => s.id === subjectId);
      },

      // Final test actions
      canTakeFinalTest: (subjectId, allTopicIds) => {
        const { knowledgeStates } = get();
        // Все темы должны быть изучены (attempts > 0)
        return allTopicIds.every((topicId) => {
          const state = knowledgeStates[topicId];
          return state && state.attempts > 0;
        });
      },

      startFinalTest: (subjectId, questions) => {
        const session: FinalTestSession = {
          id: crypto.randomUUID(),
          subjectId,
          startedAt: new Date(),
          questions,
          answers: [],
          status: 'in-progress',
          score: 0,
          sectionScores: {},
        };
        set({ currentFinalTest: session });
      },

      answerFinalTestQuestion: (questionId, answer, isCorrect, sectionId) => {
        const { currentFinalTest } = get();
        if (!currentFinalTest) return;

        const newAnswer: FinalTestAnswer = {
          questionId,
          answer,
          isCorrect,
          answeredAt: new Date(),
        };

        // Обновляем sectionScores
        const sectionScores = { ...currentFinalTest.sectionScores };
        if (!sectionScores[sectionId]) {
          sectionScores[sectionId] = { correct: 0, total: 0 };
        }
        sectionScores[sectionId].total += 1;
        if (isCorrect) {
          sectionScores[sectionId].correct += 1;
        }

        set({
          currentFinalTest: {
            ...currentFinalTest,
            answers: [...currentFinalTest.answers, newAnswer],
            sectionScores,
          },
        });
      },

      completeFinalTest: () => {
        const { currentFinalTest, finalTestHistory } = get();
        if (!currentFinalTest) return null;

        // Вычисляем финальный score
        const totalQuestions = currentFinalTest.questions.length;
        const correctAnswers = currentFinalTest.answers.filter((a) => a.isCorrect).length;
        const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

        const completedSession: FinalTestSession = {
          ...currentFinalTest,
          status: 'completed',
          completedAt: new Date(),
          score,
        };

        // Обновляем историю
        const subjectId = currentFinalTest.subjectId;
        const history = finalTestHistory[subjectId] || {
          subjectId,
          attempts: [],
          bestScore: 0,
          lastAttemptAt: undefined,
        };

        const updatedHistory: FinalTestHistory = {
          ...history,
          attempts: [...history.attempts, completedSession],
          bestScore: Math.max(history.bestScore, score),
          lastAttemptAt: new Date(),
        };

        set({
          currentFinalTest: null,
          finalTestHistory: {
            ...finalTestHistory,
            [subjectId]: updatedHistory,
          },
        });

        return completedSession;
      },

      getFinalTestHistory: (subjectId) => {
        const { finalTestHistory } = get();
        return finalTestHistory[subjectId] || null;
      },

      getCurrentFinalTest: () => {
        return get().currentFinalTest;
      },

      // Course Wrapped actions
      saveWrapped: (wrapped) => {
        const { courseWrapped } = get();
        set({
          courseWrapped: {
            ...courseWrapped,
            [wrapped.subjectId]: wrapped,
          },
        });
      },

      getWrapped: (subjectId) => {
        const { courseWrapped } = get();
        return courseWrapped[subjectId] || null;
      },

      generateWrappedData: (subjectId, subjectName, sections, finalTestScore) => {
        const { user, knowledgeStates, flashcardProgress, addedToReviewDeck } = get();

        // Считаем статистику по темам
        let totalTopics = 0;
        let masteredTopics = 0;
        let learningTopics = 0;
        let strugglingTopics = 0;
        let totalAttempts = 0;

        const sectionScores: { id: string; name: string; score: number; level: MasteryLevel }[] = [];
        let bestSection: { id: string; name: string; score: number } = { id: '', name: '', score: 0 };

        sections.forEach((section) => {
          let sectionTotal = 0;
          let sectionScore = 0;
          let sectionKnown = 0;

          section.topicIds.forEach((topicId) => {
            totalTopics++;
            const state = knowledgeStates[topicId];
            if (state) {
              totalAttempts += state.attempts;
              if (state.masteryLevel === 'mastered') masteredTopics++;
              else if (state.masteryLevel === 'learning') learningTopics++;
              else if (state.masteryLevel === 'struggling') strugglingTopics++;

              if (state.attempts > 0) {
                sectionTotal++;
                sectionScore += state.score;
                sectionKnown++;
              }
            }
          });

          const avgScore = sectionKnown > 0 ? Math.round(sectionScore / sectionKnown) : 0;
          const level = calculateMasteryLevel(avgScore, sectionKnown);

          sectionScores.push({ id: section.id, name: section.name, score: avgScore, level });

          if (avgScore > bestSection.score) {
            bestSection = { id: section.id, name: section.name, score: avgScore };
          }
        });

        // Карточки
        const subjectCards = Object.values(flashcardProgress).filter(
          (p) => p.subjectId === subjectId && addedToReviewDeck[p.cardId]
        );
        const totalFlashcards = subjectCards.length;
        const masteredFlashcards = subjectCards.filter((p) => p.repetitions >= 3 && p.easeFactor >= 2.5).length;

        // Overall mastery
        const overallScore = totalTopics > 0 ? Math.round((masteredTopics / totalTopics) * 100) : 0;
        const overallMastery = calculateMasteryLevel(overallScore, totalTopics);

        // Improvement (примерно - от среднего начального до текущего)
        const improvement = Math.max(0, finalTestScore - 50); // Примерная оценка улучшения

        const wrappedData: WrappedData = {
          subjectId,
          subjectName,
          userName: user?.name || 'Студент',
          finalTestScore,
          overallMastery,
          totalTopics,
          masteredTopics,
          learningTopics,
          strugglingTopics,
          totalFlashcards,
          masteredFlashcards,
          studyDays: Math.ceil(totalAttempts / 5), // Примерная оценка дней
          longestStreak: Math.min(7, Math.ceil(totalAttempts / 3)), // Примерная оценка
          bestSection,
          improvement,
          totalAttempts,
          sectionScores,
          completedAt: new Date(),
        };

        return wrappedData;
      },
    }),
    {
      name: 'student-app-storage',
      partialize: (state) => ({
        user: state.user,
        isOnboarded: state.isOnboarded,
        knowledgeStates: state.knowledgeStates,
        generatedLessons: state.generatedLessons,
        flashcardProgress: state.flashcardProgress,
        addedToReviewDeck: state.addedToReviewDeck,
        customSubjects: state.customSubjects,
        finalTestHistory: state.finalTestHistory,
        courseWrapped: state.courseWrapped,
      }),
    }
  )
);
