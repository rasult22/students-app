import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Clock, Target, Loader2, Sparkles, ArrowRight, RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { MathText } from '../ui/MathText';
import { useAppStore } from '../../stores/appStore';
import { generateFinalTestQuestions, getRecommendedQuestionCount } from '../../services/generators/finalTestGenerator';
import { useCountUp } from '../../hooks/useCountUp';
import type { Subject, FinalTestQuestion, MasteryLevel } from '../../types';
import styles from './FinalTest.module.css';

interface FinalTestProps {
  subject: Subject;
  onComplete: () => void;
  onShowWrapped: () => void;
}

type Phase = 'intro' | 'generating' | 'testing' | 'results';

export function FinalTest({ subject, onComplete, onShowWrapped }: FinalTestProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [questions, setQuestions] = useState<FinalTestQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [completedSession, setCompletedSession] = useState<{
    score: number;
    sectionScores: Record<string, { correct: number; total: number }>;
  } | null>(null);

  const {
    user,
    startFinalTest,
    answerFinalTestQuestion,
    completeFinalTest,
    getFinalTestHistory,
  } = useAppStore();

  const history = getFinalTestHistory(subject.id);
  const currentQuestion = questions[currentIndex];

  // Получаем имена разделов для отображения
  const sectionNames = useMemo(() => {
    const names: Record<string, string> = {};
    subject.sections.forEach((section) => {
      names[section.id] = section.name;
    });
    return names;
  }, [subject.sections]);

  const handleStartTest = async () => {
    setPhase('generating');
    setGenerationError(null);

    try {
      const questionCount = getRecommendedQuestionCount(subject);
      const generatedQuestions = await generateFinalTestQuestions(
        subject,
        user?.interests || [],
        questionCount
      );

      setQuestions(generatedQuestions);
      startFinalTest(subject.id, generatedQuestions);
      setPhase('testing');
    } catch (error) {
      console.error('Failed to generate questions:', error);
      setGenerationError('Не удалось сгенерировать вопросы. Проверьте подключение к интернету.');
      setPhase('intro');
    }
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

    answerFinalTestQuestion(
      currentQuestion.id,
      selectedAnswer,
      correct,
      currentQuestion.sectionId
    );
  };

  const handleNextQuestion = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      // Завершаем тест
      const session = completeFinalTest();
      if (session) {
        setCompletedSession({
          score: session.score,
          sectionScores: session.sectionScores,
        });
      }
      setPhase('results');
    }
  }, [currentIndex, questions.length, completeFinalTest]);

  const handleRetake = () => {
    setPhase('intro');
    setQuestions([]);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setCompletedSession(null);
  };

  const getMasteryLevel = (score: number): MasteryLevel => {
    if (score >= 80) return 'mastered';
    if (score >= 50) return 'learning';
    return 'struggling';
  };

  const getMasteryLabel = (level: MasteryLevel): string => {
    switch (level) {
      case 'mastered':
        return 'Освоено';
      case 'learning':
        return 'Изучается';
      case 'struggling':
        return 'Требует работы';
      default:
        return 'Не изучено';
    }
  };

  return (
    <div className={styles.container}>
      <AnimatePresence mode="wait">
        {/* Intro Screen */}
        {(phase === 'intro' || phase === 'generating') && (
          <motion.div
            key="intro"
            className={styles.introScreen}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div
              className={styles.introIcon}
              style={{ background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.2))' }}
            >
              {phase === 'generating' ? (
                <Loader2 size={48} className={styles.spin} color="var(--color-tertiary)" />
              ) : (
                <Trophy size={48} color="var(--color-tertiary)" />
              )}
            </div>

            <h2 className={styles.introTitle}>
              {phase === 'generating' ? 'Генерация теста...' : 'Финальный тест'}
            </h2>

            <p className={styles.introDescription}>
              {phase === 'generating' ? (
                'Создаём персонализированные вопросы на основе всего курса'
              ) : (
                <>
                  Проверь свои знания по курсу <strong>{subject.name}</strong>.
                  Тест охватывает все изученные темы.
                </>
              )}
            </p>

            {phase === 'intro' && (
              <>
                <div className={styles.introFeatures}>
                  <div className={styles.feature}>
                    <span className={styles.featureIcon}>📝</span>
                    <span>~{getRecommendedQuestionCount(subject)} вопросов</span>
                  </div>
                  <div className={styles.feature}>
                    <Clock size={16} />
                    <span>~15-20 минут</span>
                  </div>
                  <div className={styles.feature}>
                    <Target size={16} />
                    <span>Все разделы</span>
                  </div>
                </div>

                {history && history.attempts.length > 0 && (
                  <div className={styles.historySection}>
                    <div className={styles.historyTitle}>Предыдущие попытки</div>
                    <div className={styles.historyStats}>
                      <div className={styles.historyStat}>
                        <div className={styles.historyValue}>{history.attempts.length}</div>
                        <div className={styles.historyLabel}>Попыток</div>
                      </div>
                      <div className={styles.historyStat}>
                        <div className={styles.historyValue}>{history.bestScore}%</div>
                        <div className={styles.historyLabel}>Лучший результат</div>
                      </div>
                    </div>
                  </div>
                )}

                {generationError && (
                  <p style={{ color: 'var(--color-error)', marginBottom: 'var(--space-4)' }}>
                    {generationError}
                  </p>
                )}

                <Button onClick={handleStartTest} size="lg">
                  <Sparkles size={20} />
                  Начать тест
                </Button>
              </>
            )}
          </motion.div>
        )}

        {/* Testing Screen */}
        {phase === 'testing' && currentQuestion && (
          <motion.div
            key="testing"
            className={styles.testingScreen}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className={styles.progressHeader}>
              <div className={styles.progressInfo}>
                <span className={styles.questionCount}>
                  Вопрос {currentIndex + 1} из {questions.length}
                </span>
                <span className={styles.sectionLabel}>
                  {sectionNames[currentQuestion.sectionId] || 'Раздел'}
                </span>
              </div>
              <span
                className={styles.difficultyBadge}
                data-difficulty={currentQuestion.difficulty}
              >
                {currentQuestion.difficulty === 'beginner'
                  ? 'Базовый'
                  : currentQuestion.difficulty === 'intermediate'
                  ? 'Средний'
                  : 'Сложный'}
              </span>
            </div>

            <div className={styles.progressBar}>
              <motion.div
                className={styles.progressFill}
                initial={{ width: 0 }}
                animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>

            <Card variant="elevated" padding="lg" className={styles.questionCard}>
              <div className={styles.questionText}>
                <MathText text={currentQuestion.text} />
              </div>

              <div className={styles.optionsGrid}>
                {currentQuestion.options?.map((option, index) => {
                  const letter = String.fromCharCode(65 + index);
                  const isSelected = selectedAnswer === option.id;
                  const isOptionCorrect = option.id === currentQuestion.correctAnswer;

                  let buttonClass = styles.optionButton;
                  if (showFeedback) {
                    if (isOptionCorrect) {
                      buttonClass += ` ${styles.correct}`;
                    } else if (isSelected && !isOptionCorrect) {
                      buttonClass += ` ${styles.incorrect}`;
                    }
                  } else if (isSelected) {
                    buttonClass += ` ${styles.selected}`;
                  }

                  return (
                    <motion.button
                      key={option.id}
                      className={buttonClass}
                      onClick={() => handleAnswerSelect(option.id)}
                      disabled={showFeedback}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <span className={styles.optionLetter}>{letter}</span>
                      <span className={styles.optionText}>
                        <MathText text={option.text} />
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              <AnimatePresence>
                {showFeedback && (
                  <motion.div
                    className={`${styles.feedback} ${
                      isCorrect ? styles.feedbackCorrect : styles.feedbackIncorrect
                    }`}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <div className={styles.feedbackHeader}>
                      <div className={styles.feedbackIcon}>
                        {isCorrect ? '✓' : '✗'}
                      </div>
                      <span className={styles.feedbackTitle}>
                        {isCorrect ? 'Правильно!' : 'Неправильно'}
                      </span>
                    </div>
                    {currentQuestion.explanation && (
                      <p className={styles.feedbackExplanation}>
                        <MathText text={currentQuestion.explanation} />
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

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
                    {currentIndex < questions.length - 1 ? (
                      <>
                        Далее
                        <ArrowRight size={18} />
                      </>
                    ) : (
                      'Завершить тест'
                    )}
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Results Screen */}
        {phase === 'results' && completedSession && (
          <ResultsScreen
            score={completedSession.score}
            sectionScores={completedSession.sectionScores}
            sectionNames={sectionNames}
            history={history}
            onShowWrapped={onShowWrapped}
            onRetake={handleRetake}
            onComplete={onComplete}
            getMasteryLevel={getMasteryLevel}
            getMasteryLabel={getMasteryLabel}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

interface ResultsScreenProps {
  score: number;
  sectionScores: Record<string, { correct: number; total: number }>;
  sectionNames: Record<string, string>;
  history: ReturnType<typeof useAppStore.getState>['getFinalTestHistory'] extends (id: string) => infer R ? R : never;
  onShowWrapped: () => void;
  onRetake: () => void;
  onComplete: () => void;
  getMasteryLevel: (score: number) => MasteryLevel;
  getMasteryLabel: (level: MasteryLevel) => string;
}

function ResultsScreen({
  score,
  sectionScores,
  sectionNames,
  history,
  onShowWrapped,
  onRetake,
  onComplete,
  getMasteryLevel,
  getMasteryLabel,
}: ResultsScreenProps) {
  const animatedScore = useCountUp(score, 2000);

  const getScoreMessage = (s: number): string => {
    if (s >= 90) return 'Превосходный результат!';
    if (s >= 80) return 'Отличная работа!';
    if (s >= 70) return 'Хороший результат!';
    if (s >= 50) return 'Неплохо! Есть куда расти';
    return 'Попробуй ещё раз!';
  };

  const previousBest = history?.bestScore || 0;
  const isNewBest = score >= previousBest && history && history.attempts.length > 1;

  return (
    <motion.div
      key="results"
      className={styles.resultsScreen}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className={styles.resultsHeader}>
        <div className={styles.resultsIcon}>🎉</div>
        <h2 className={styles.resultsTitle}>Тест завершён!</h2>
        <p className={styles.resultsDescription}>{getScoreMessage(score)}</p>
      </div>

      <div className={styles.scoreCircle}>
        <span className={styles.scoreValue}>{animatedScore}</span>
        <span className={styles.scoreLabel}>баллов</span>
      </div>

      {isNewBest && (
        <motion.div
          className={styles.comparison}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className={styles.comparisonItem}>
            <div className={styles.comparisonValue} style={{ color: 'var(--color-text-tertiary)' }}>
              {previousBest}%
            </div>
            <div className={styles.comparisonLabel}>Предыдущий лучший</div>
          </div>
          <ArrowRight className={styles.comparisonArrow} size={24} />
          <div className={styles.comparisonItem}>
            <div className={styles.comparisonValue} style={{ color: 'var(--color-accent)' }}>
              {score}%
            </div>
            <div className={styles.comparisonLabel}>Новый рекорд!</div>
          </div>
        </motion.div>
      )}

      <div className={styles.resultsGrid}>
        {Object.entries(sectionScores).map(([sectionId, scores], index) => {
          const sectionScore = scores.total > 0
            ? Math.round((scores.correct / scores.total) * 100)
            : 0;
          const level = getMasteryLevel(sectionScore);

          return (
            <motion.div
              key={sectionId}
              className={styles.resultCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <div className={styles.resultHeader}>
                <span className={styles.resultNumber}>{index + 1}</span>
                <span className={styles.resultName}>
                  {sectionNames[sectionId] || sectionId}
                </span>
              </div>
              <div className={styles.resultBar}>
                <motion.div
                  className={styles.resultFill}
                  data-level={level}
                  initial={{ width: 0 }}
                  animate={{ width: `${sectionScore}%` }}
                  transition={{ delay: 0.5 + index * 0.1, duration: 0.6 }}
                />
              </div>
              <div className={styles.resultFooter}>
                <span className={styles.resultScore}>
                  {scores.correct}/{scores.total} ({sectionScore}%)
                </span>
                <span className={`${styles.resultLevel} ${styles[level]}`}>
                  {getMasteryLabel(level)}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className={styles.resultsActions}>
        <Button onClick={onShowWrapped} size="lg">
          <Sparkles size={20} />
          Посмотреть итоги курса
        </Button>
        <Button onClick={onRetake} variant="secondary">
          <RotateCcw size={18} />
          Пересдать тест
        </Button>
        <Button onClick={onComplete} variant="ghost">
          Вернуться к курсу
        </Button>
      </div>
    </motion.div>
  );
}

export default FinalTest;
