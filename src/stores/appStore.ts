import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  UserProfile,
  Interest,
  KnowledgeState,
  DiagnosticSession,
  DiagnosticAnswer,
  MasteryLevel,
} from '../types';

interface AppState {
  // User
  user: UserProfile | null;
  isOnboarded: boolean;

  // Subjects & Learning
  currentSubjectId: string | null;
  knowledgeStates: Record<string, KnowledgeState>; // keyed by topicId
  diagnosticSession: DiagnosticSession | null;

  // Actions
  setUser: (name: string, interests: Interest[]) => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  clearUser: () => void;

  setCurrentSubject: (subjectId: string | null) => void;

  // Knowledge tracking
  updateKnowledge: (topicId: string, isCorrect: boolean) => void;
  getTopicMastery: (topicId: string) => MasteryLevel;
  getSectionMastery: (topicIds: string[]) => { level: MasteryLevel; score: number };

  // Diagnostic
  startDiagnostic: (subjectId: string) => void;
  submitAnswer: (answer: Omit<DiagnosticAnswer, 'answeredAt'>) => void;
  completeDiagnostic: () => void;
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
      knowledgeStates: {},
      diagnosticSession: null,

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
    }),
    {
      name: 'student-app-storage',
      partialize: (state) => ({
        user: state.user,
        isOnboarded: state.isOnboarded,
        knowledgeStates: state.knowledgeStates,
      }),
    }
  )
);
