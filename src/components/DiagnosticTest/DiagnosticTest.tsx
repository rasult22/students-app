import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Subject, DiagnosticQuestion } from '../../types';
import { getQuestionsForSubject } from '../../data/subjects';
import { useAppStore } from '../../stores/appStore';
import { Button, Card } from '../ui';
import styles from './DiagnosticTest.module.css';

interface DiagnosticTestProps {
  subject: Subject;
  onComplete: () => void;
}

interface SectionState {
  sectionId: string;
  correctAnswers: number;
  totalAnswers: number;
  confidence: number; // 0-1, how confident we are about this section
}

export function DiagnosticTest({ subject, onComplete }: DiagnosticTestProps) {
  const { startDiagnostic, submitAnswer, completeDiagnostic } = useAppStore();

  const [phase, setPhase] = useState<'intro' | 'testing' | 'results'>('intro');
  const [allQuestions] = useState(() => getQuestionsForSubject(subject.id));
  const [currentQuestion, setCurrentQuestion] = useState<DiagnosticQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);

  // Track knowledge state per section
  const [sectionStates, setSectionStates] = useState<Map<string, SectionState>>(() => {
    const states = new Map<string, SectionState>();
    subject.sections.forEach((section) => {
      states.set(section.id, {
        sectionId: section.id,
        correctAnswers: 0,
        totalAnswers: 0,
        confidence: 0,
      });
    });
    return states;
  });

  // Adaptive algorithm to select next question
  const selectNextQuestion = useCallback((): DiagnosticQuestion | null => {
    // Find sections with lowest confidence
    const sectionsArray = Array.from(sectionStates.values());

    // Sort by confidence (ascending) - prefer sections we're less sure about
    sectionsArray.sort((a, b) => {
      // Prioritize sections with fewer answers
      if (a.totalAnswers !== b.totalAnswers) {
        return a.totalAnswers - b.totalAnswers;
      }
      return a.confidence - b.confidence;
    });

    // Get available questions for the target section
    for (const sectionState of sectionsArray) {
      // Skip if we're confident enough about this section (2+ questions answered correctly or incorrectly)
      if (sectionState.confidence >= 0.7 && sectionState.totalAnswers >= 2) {
        continue;
      }

      const sectionQuestions = allQuestions.filter(
        (q) => q.sectionId === sectionState.sectionId
      );

      // Find unanswered questions in this section
      // For simplicity, we'll use difficulty-based selection
      const recentPerformance =
        sectionState.totalAnswers > 0
          ? sectionState.correctAnswers / sectionState.totalAnswers
          : 0.5;

      let targetDifficulty: 'beginner' | 'intermediate' | 'advanced';
      if (recentPerformance >= 0.7) {
        targetDifficulty = 'advanced';
      } else if (recentPerformance >= 0.4) {
        targetDifficulty = 'intermediate';
      } else {
        targetDifficulty = 'beginner';
      }

      // Try to find a question matching target difficulty
      let candidates = sectionQuestions.filter((q) => q.difficulty === targetDifficulty);

      // Fallback to any question from this section
      if (candidates.length === 0) {
        candidates = sectionQuestions;
      }

      // Pick a random question from candidates
      if (candidates.length > 0) {
        const randomIndex = Math.floor(Math.random() * candidates.length);
        return candidates[randomIndex];
      }
    }

    return null;
  }, [allQuestions, sectionStates]);

  const startTest = () => {
    startDiagnostic(subject.id);
    setPhase('testing');
    setStartTime(Date.now());
    const firstQuestion = selectNextQuestion();
    setCurrentQuestion(firstQuestion);
  };

  const handleAnswerSelect = (answerId: string) => {
    if (showFeedback) return;
    setSelectedAnswer(answerId);
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer || !currentQuestion) return;

    const correct = selectedAnswer === currentQuestion.correctAnswer;
    setIsCorrect(correct);
    setShowFeedback(true);

    // Update section state
    const sectionState = sectionStates.get(currentQuestion.sectionId);
    if (sectionState) {
      const newState: SectionState = {
        ...sectionState,
        correctAnswers: sectionState.correctAnswers + (correct ? 1 : 0),
        totalAnswers: sectionState.totalAnswers + 1,
        confidence: Math.min(1, sectionState.confidence + (correct ? 0.35 : 0.25)),
      };
      setSectionStates(new Map(sectionStates.set(currentQuestion.sectionId, newState)));
    }

    // Submit to store
    submitAnswer({
      questionId: currentQuestion.id,
      topicId: currentQuestion.topicId,
      sectionId: currentQuestion.sectionId,
      userAnswer: selectedAnswer,
      isCorrect: correct,
      timeSpentSeconds: Math.round((Date.now() - startTime) / 1000),
    });

    setQuestionsAnswered((prev) => prev + 1);
  };

  const handleNextQuestion = () => {
    setSelectedAnswer(null);
    setShowFeedback(false);
    setStartTime(Date.now());

    // Check if we should end the test
    const minQuestionsPerSection = 2;
    const allSectionsHaveMinQuestions = Array.from(sectionStates.values()).every(
      (s) => s.totalAnswers >= minQuestionsPerSection
    );

    if (allSectionsHaveMinQuestions || questionsAnswered >= 12) {
      completeDiagnostic();
      setPhase('results');
      return;
    }

    const nextQuestion = selectNextQuestion();
    if (!nextQuestion) {
      completeDiagnostic();
      setPhase('results');
    } else {
      setCurrentQuestion(nextQuestion);
    }
  };

  const getSectionResults = () => {
    return subject.sections.map((section) => {
      const state = sectionStates.get(section.id);
      const score = state && state.totalAnswers > 0
        ? Math.round((state.correctAnswers / state.totalAnswers) * 100)
        : 0;

      let level: 'mastered' | 'learning' | 'struggling' | 'unknown' = 'unknown';
      if (state && state.totalAnswers > 0) {
        if (score >= 80) level = 'mastered';
        else if (score >= 50) level = 'learning';
        else level = 'struggling';
      }

      return { section, state, score, level };
    });
  };

  return (
    <div className={styles.container}>
      <AnimatePresence mode="wait">
        {phase === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={styles.introScreen}
          >
            <div className={styles.introIcon}>🔍</div>
            <h2 className={styles.introTitle}>Диагностика знаний</h2>
            <p className={styles.introDescription}>
              Мы зададим несколько вопросов по разным разделам курса, чтобы
              определить ваш текущий уровень. На основе результатов составим
              персональный план обучения.
            </p>

            <div className={styles.introFeatures}>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>⚡</span>
                <span>Адаптивный алгоритм</span>
              </div>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>📊</span>
                <span>~10-15 вопросов</span>
              </div>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>🎯</span>
                <span>Персональный план</span>
              </div>
            </div>

            <Button size="lg" onClick={startTest}>
              Начать диагностику
            </Button>
          </motion.div>
        )}

        {phase === 'testing' && currentQuestion && (
          <motion.div
            key="testing"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className={styles.testingScreen}
          >
            {/* Progress */}
            <div className={styles.progressHeader}>
              <div className={styles.progressInfo}>
                <span className={styles.questionCount}>
                  Вопрос {questionsAnswered + 1}
                </span>
                <span className={styles.sectionLabel}>
                  {subject.sections.find((s) => s.id === currentQuestion.sectionId)?.name}
                </span>
              </div>
              <div className={styles.difficultyBadge} data-difficulty={currentQuestion.difficulty}>
                {currentQuestion.difficulty === 'beginner' && '★'}
                {currentQuestion.difficulty === 'intermediate' && '★★'}
                {currentQuestion.difficulty === 'advanced' && '★★★'}
              </div>
            </div>

            {/* Question */}
            <Card variant="elevated" padding="lg" className={styles.questionCard}>
              <p className={styles.questionText}>{currentQuestion.text}</p>

              <div className={styles.optionsGrid}>
                {currentQuestion.options?.map((option, index) => (
                  <motion.button
                    key={option.id}
                    className={`${styles.optionButton} ${
                      selectedAnswer === option.id ? styles.selected : ''
                    } ${
                      showFeedback
                        ? option.isCorrect
                          ? styles.correct
                          : selectedAnswer === option.id
                          ? styles.incorrect
                          : ''
                        : ''
                    }`}
                    onClick={() => handleAnswerSelect(option.id)}
                    disabled={showFeedback}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: showFeedback ? 1 : 1.02 }}
                    whileTap={{ scale: showFeedback ? 1 : 0.98 }}
                  >
                    <span className={styles.optionLetter}>
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className={styles.optionText}>{option.text}</span>
                  </motion.button>
                ))}
              </div>

              {/* Feedback */}
              <AnimatePresence>
                {showFeedback && (
                  <motion.div
                    className={`${styles.feedback} ${isCorrect ? styles.feedbackCorrect : styles.feedbackIncorrect}`}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <div className={styles.feedbackHeader}>
                      <span className={styles.feedbackIcon}>
                        {isCorrect ? '✓' : '✗'}
                      </span>
                      <span className={styles.feedbackTitle}>
                        {isCorrect ? 'Правильно!' : 'Неправильно'}
                      </span>
                    </div>
                    {currentQuestion.explanation && (
                      <p className={styles.feedbackExplanation}>
                        {currentQuestion.explanation}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className={styles.questionActions}>
                {!showFeedback ? (
                  <Button
                    onClick={handleSubmitAnswer}
                    disabled={!selectedAnswer}
                    fullWidth
                  >
                    Ответить
                  </Button>
                ) : (
                  <Button onClick={handleNextQuestion} fullWidth>
                    Следующий вопрос
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        )}

        {phase === 'results' && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={styles.resultsScreen}
          >
            <div className={styles.resultsHeader}>
              <div className={styles.resultsIcon}>📊</div>
              <h2 className={styles.resultsTitle}>Результаты диагностики</h2>
              <p className={styles.resultsDescription}>
                На основе ваших ответов мы определили уровень знаний по каждому разделу
              </p>
            </div>

            <div className={styles.resultsGrid}>
              {getSectionResults().map(({ section, score, level }, index) => (
                <motion.div
                  key={section.id}
                  className={styles.resultCard}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className={styles.resultHeader}>
                    <span className={styles.resultNumber}>{index + 1}</span>
                    <h4 className={styles.resultName}>{section.name}</h4>
                  </div>

                  <div className={styles.resultBar}>
                    <motion.div
                      className={styles.resultFill}
                      data-level={level}
                      initial={{ width: 0 }}
                      animate={{ width: `${score}%` }}
                      transition={{ delay: 0.3 + index * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>

                  <div className={styles.resultFooter}>
                    <span className={styles.resultScore}>{score}%</span>
                    <span className={`${styles.resultLevel} ${styles[level]}`}>
                      {level === 'mastered' && 'Освоено'}
                      {level === 'learning' && 'В процессе'}
                      {level === 'struggling' && 'Требует внимания'}
                      {level === 'unknown' && 'Не изучено'}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className={styles.resultsActions}>
              <Button size="lg" onClick={onComplete}>
                Перейти к учебному плану
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
