import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  Presentation,
  HelpCircle,
  Layers,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Trophy,
  ArrowRight,
  Check,
  Gamepad2,
} from 'lucide-react';
import type { TopicLesson as TopicLessonType, Topic } from '../../types';
import { Button, MathText, MarkdownMath } from '../ui';
import { useAppStore } from '../../stores/appStore';
import { TopicMiniGames } from './TopicMiniGames';
import styles from './TopicLesson.module.css';

type TabType = 'theory' | 'presentation' | 'examples' | 'minigames' | 'quiz' | 'flashcards';

// Порядок табов для навигации
const TAB_ORDER: TabType[] = ['theory', 'presentation', 'examples', 'minigames', 'quiz', 'flashcards'];

// Обязательные табы для завершения урока (тест + просмотр карточек)
const REQUIRED_TABS: TabType[] = ['quiz', 'flashcards'];

interface TabProgress {
  viewed: boolean;
  completed: boolean;
}

interface TopicLessonProps {
  lesson: TopicLessonType;
  topic: Topic;
  sectionName: string;
  subjectName?: string;
  onBack: () => void;
}

export function TopicLesson({ lesson, topic, sectionName, subjectName, onBack }: TopicLessonProps) {
  const [activeTab, setActiveTab] = useState<TabType>('theory');
  const [showCompletion, setShowCompletion] = useState(false);

  // Отслеживание прогресса по табам
  const [tabProgress, setTabProgress] = useState<Record<TabType, TabProgress>>({
    theory: { viewed: false, completed: false },
    presentation: { viewed: false, completed: false },
    examples: { viewed: false, completed: false },
    minigames: { viewed: false, completed: false },
    quiz: { viewed: false, completed: false },
    flashcards: { viewed: false, completed: false },
  });

  // Результаты теста для обновления knowledge state
  const [quizResults, setQuizResults] = useState<{ correct: number; total: number } | null>(null);

  const { setTopicScore } = useAppStore();

  // Помечаем таб как просмотренный при переключении
  useEffect(() => {
    setTabProgress(prev => ({
      ...prev,
      [activeTab]: { ...prev[activeTab], viewed: true }
    }));
  }, [activeTab]);

  // Проверяем завершение урока
  const isLessonComplete = useMemo(() => {
    return REQUIRED_TABS.every(tab => tabProgress[tab].completed);
  }, [tabProgress]);

  // Обновляем knowledge state сразу после прохождения теста
  const [knowledgeUpdated, setKnowledgeUpdated] = useState(false);
  useEffect(() => {
    if (quizResults && quizResults.total > 0 && !knowledgeUpdated) {
      // Устанавливаем score напрямую (заменяет предыдущий результат)
      setTopicScore(topic.id, quizResults.correct, quizResults.total);
      setKnowledgeUpdated(true);
    }
  }, [quizResults, knowledgeUpdated, setTopicScore, topic.id]);

  // Показываем экран завершения когда все обязательные табы пройдены
  useEffect(() => {
    if (isLessonComplete && !showCompletion) {
      setShowCompletion(true);
    }
  }, [isLessonComplete, showCompletion]);

  // Функция для пометки таба как завершённого
  const markTabCompleted = useCallback((tab: TabType) => {
    setTabProgress(prev => ({
      ...prev,
      [tab]: { ...prev[tab], completed: true }
    }));
  }, []);

  // Переход к следующему табу
  const goToNextTab = useCallback(() => {
    const currentIndex = TAB_ORDER.indexOf(activeTab);
    if (currentIndex < TAB_ORDER.length - 1) {
      setActiveTab(TAB_ORDER[currentIndex + 1]);
    }
  }, [activeTab]);

  // Проверка есть ли следующий таб
  const hasNextTab = TAB_ORDER.indexOf(activeTab) < TAB_ORDER.length - 1;
  const nextTabName = hasNextTab ? getTabLabel(TAB_ORDER[TAB_ORDER.indexOf(activeTab) + 1]) : '';

  // Подсчёт прогресса
  const completedCount = Object.values(tabProgress).filter(p => p.completed).length;
  const progressPercent = Math.round((completedCount / TAB_ORDER.length) * 100);

  const tabs = useMemo(() => [
    { id: 'theory' as const, label: 'Теория', icon: BookOpen, required: false },
    { id: 'presentation' as const, label: 'Презентация', icon: Presentation, required: false },
    { id: 'examples' as const, label: 'Примеры', icon: Layers, required: false },
    { id: 'minigames' as const, label: 'Мини-игры', icon: Gamepad2, required: false },
    { id: 'quiz' as const, label: 'Тест', icon: HelpCircle, required: true },
    { id: 'flashcards' as const, label: 'Карточки', icon: RotateCcw, required: true },
  ], []);

  // Экран завершения урока
  if (showCompletion) {
    return (
      <div className={styles.container}>
        <div className={styles.completionScreen}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className={styles.completionIcon}
          >
            <Trophy size={64} />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={styles.completionTitle}
          >
            Тема изучена!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={styles.completionSubtitle}
          >
            {topic.name}
          </motion.p>

          {quizResults && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={styles.completionStats}
            >
              <div className={styles.completionStat}>
                <span className={styles.completionStatValue}>
                  {Math.round((quizResults.correct / quizResults.total) * 100)}%
                </span>
                <span className={styles.completionStatLabel}>Результат теста</span>
              </div>
              <div className={styles.completionStat}>
                <span className={styles.completionStatValue}>
                  {quizResults.correct}/{quizResults.total}
                </span>
                <span className={styles.completionStatLabel}>Верных ответов</span>
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className={styles.completionActions}
          >
            <Button onClick={onBack}>
              Вернуться к разделу
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setShowCompletion(false);
                setActiveTab('theory');
              }}
            >
              Повторить урок
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <button className={styles.backButton} onClick={onBack}>
            <ArrowLeft size={18} />
            <span>Назад</span>
          </button>

          <div className={styles.topicInfo}>
            <h1 className={styles.topicName}>{topic.name}</h1>
            <p className={styles.sectionName}>{sectionName}</p>
          </div>

          <div className={styles.progressIndicator}>
            <span className={styles.progressSteps}>
              {completedCount} из {TAB_ORDER.length}
            </span>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className={styles.tabs}>
        {tabs.map((tab) => {
          const progress = tabProgress[tab.id];
          const isRequired = REQUIRED_TABS.includes(tab.id);

          return (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''} ${progress.completed ? styles.completed : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className={styles.tabIcon}>
                {progress.completed ? (
                  <Check size={16} />
                ) : (
                  <tab.icon size={16} />
                )}
              </span>
              <span>{tab.label}</span>
              {isRequired && !progress.completed && (
                <span className={styles.requiredBadge}>!</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Content */}
      <main className={styles.content}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={styles.tabContent}
          >
            {activeTab === 'theory' && (
              <TheoryTab
                lesson={lesson}
                onComplete={() => markTabCompleted('theory')}
                isCompleted={tabProgress.theory.completed}
              />
            )}
            {activeTab === 'presentation' && (
              <PresentationTab
                lesson={lesson}
                onComplete={() => markTabCompleted('presentation')}
                isCompleted={tabProgress.presentation.completed}
              />
            )}
            {activeTab === 'examples' && (
              <ExamplesTab
                lesson={lesson}
                onComplete={() => markTabCompleted('examples')}
                isCompleted={tabProgress.examples.completed}
              />
            )}
            {activeTab === 'minigames' && (
              <TopicMiniGames
                topic={topic}
                sectionName={sectionName}
                subjectName={subjectName || lesson.subjectId}
                onComplete={() => markTabCompleted('minigames')}
                isCompleted={tabProgress.minigames.completed}
              />
            )}
            {activeTab === 'quiz' && (
              <QuizTab
                lesson={lesson}
                onComplete={(results) => {
                  setQuizResults(results);
                  markTabCompleted('quiz');
                }}
                isCompleted={tabProgress.quiz.completed}
              />
            )}
            {activeTab === 'flashcards' && (
              <FlashcardsTab
                lesson={lesson}
                onComplete={() => markTabCompleted('flashcards')}
                isCompleted={tabProgress.flashcards.completed}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Кнопка "Далее" */}
        {hasNextTab && (
          <div className={styles.nextButtonContainer}>
            <Button
              onClick={goToNextTab}
              className={styles.nextButton}
            >
              <span>Далее: {nextTabName}</span>
              <ArrowRight size={18} />
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

function getTabLabel(tab: TabType): string {
  const labels: Record<TabType, string> = {
    theory: 'Теория',
    presentation: 'Презентация',
    examples: 'Примеры',
    minigames: 'Мини-игры',
    quiz: 'Тест',
    flashcards: 'Карточки',
  };
  return labels[tab];
}

// Theory Tab Component
interface TheoryTabProps {
  lesson: TopicLessonType;
  onComplete: () => void;
  isCompleted: boolean;
}

function TheoryTab({ lesson, onComplete, isCompleted }: TheoryTabProps) {
  const { theory } = lesson;

  // Автоматически отмечаем как просмотренное через 5 секунд
  useEffect(() => {
    if (!isCompleted) {
      const timer = setTimeout(() => {
        onComplete();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isCompleted, onComplete]);

  return (
    <div className={styles.theoryContent}>
      <MarkdownMath className={styles.theoryText}>
        {theory.content}
      </MarkdownMath>

      {theory.keyPoints.length > 0 && (
        <div className={styles.keyPoints}>
          <h3 className={styles.keyPointsTitle}>Ключевые тезисы</h3>
          <ul className={styles.keyPointsList}>
            {theory.keyPoints.map((point, index) => (
              <li key={index}>
                <MathText>{point}</MathText>
              </li>
            ))}
          </ul>
        </div>
      )}

      {theory.formulas && theory.formulas.length > 0 && (
        <div className={styles.formulas}>
          <h3 className={styles.formulasTitle}>Формулы</h3>
          {theory.formulas.map((formula, index) => (
            <div key={index} className={styles.formulaCard}>
              <div className={styles.formulaLatex}>
                <MathText>{`$${formula.latex}$`}</MathText>
              </div>
              <p className={styles.formulaDescription}>{formula.description}</p>
            </div>
          ))}
        </div>
      )}

      {!isCompleted && (
        <div className={styles.tabCompleteHint}>
          <Button variant="secondary" onClick={onComplete}>
            <Check size={16} />
            Отметить как прочитано
          </Button>
        </div>
      )}
    </div>
  );
}

// Presentation Tab Component
interface PresentationTabProps {
  lesson: TopicLessonType;
  onComplete: () => void;
  isCompleted: boolean;
}

function PresentationTab({ lesson, onComplete, isCompleted }: PresentationTabProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = lesson.presentation.slides;

  // Отмечаем как завершённое когда дошли до последнего слайда
  useEffect(() => {
    if (!isCompleted && currentSlide === slides.length - 1) {
      onComplete();
    }
  }, [currentSlide, slides.length, isCompleted, onComplete]);

  if (slides.length === 0) {
    // Если нет слайдов, сразу отмечаем как завершённое
    useEffect(() => {
      if (!isCompleted) onComplete();
    }, [isCompleted, onComplete]);

    return (
      <div className={styles.emptyState}>
        <Presentation size={48} className={styles.emptyIcon} />
        <h3 className={styles.emptyTitle}>Нет слайдов</h3>
        <p className={styles.emptyDescription}>Презентация для этой темы пока не создана</p>
      </div>
    );
  }

  const slide = slides[currentSlide];

  return (
    <div className={styles.presentation}>
      <div className={styles.slideContainer}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className={styles.slide}
          >
            <div className={styles.slideHeader}>
              <span className={styles.slideNumber}>
                Слайд {currentSlide + 1} / {slides.length}
              </span>
              <span className={`${styles.slideType} ${styles[slide.type]}`}>
                {getSlideTypeLabel(slide.type)}
              </span>
            </div>

            <h2 className={styles.slideTitle}>{slide.title}</h2>

            <MarkdownMath className={styles.slideContent}>
              {slide.content}
            </MarkdownMath>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className={styles.slideNavigation}>
        <button
          className={styles.slideNavButton}
          onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
          disabled={currentSlide === 0}
        >
          <ChevronLeft size={24} />
        </button>

        <div className={styles.slideDots}>
          {slides.map((_, index) => (
            <button
              key={index}
              className={`${styles.slideDot} ${index === currentSlide ? styles.active : ''}`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>

        <button
          className={styles.slideNavButton}
          onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))}
          disabled={currentSlide === slides.length - 1}
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
}

// Examples Tab Component
interface ExamplesTabProps {
  lesson: TopicLessonType;
  onComplete: () => void;
  isCompleted: boolean;
}

function ExamplesTab({ lesson, onComplete, isCompleted }: ExamplesTabProps) {
  const { examples } = lesson;

  // Автоматически отмечаем как просмотренное через 5 секунд
  useEffect(() => {
    if (!isCompleted && examples.length > 0) {
      const timer = setTimeout(() => {
        onComplete();
      }, 5000);
      return () => clearTimeout(timer);
    } else if (!isCompleted && examples.length === 0) {
      onComplete();
    }
  }, [isCompleted, onComplete, examples.length]);

  if (examples.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Layers size={48} className={styles.emptyIcon} />
        <h3 className={styles.emptyTitle}>Нет примеров</h3>
        <p className={styles.emptyDescription}>Примеры для этой темы пока не добавлены</p>
      </div>
    );
  }

  return (
    <div className={styles.examples}>
      {examples.map((example, index) => (
        <div key={example.id} className={styles.exampleCard}>
          <div className={styles.exampleHeader}>
            <span className={styles.exampleTitle}>Пример {index + 1}</span>
            <span className={`${styles.exampleDifficulty} ${styles[example.difficulty]}`}>
              {getDifficultyLabel(example.difficulty)}
            </span>
          </div>

          <div className={styles.exampleProblem}>
            <div className={styles.problemLabel}>Условие</div>
            <p className={styles.problemText}>
              <MathText>{example.problem}</MathText>
            </p>
          </div>

          <div className={styles.exampleSolution}>
            <div className={styles.solutionLabel}>Решение</div>
            <div className={styles.solutionSteps}>
              {example.solution.map((step) => (
                <div key={step.step} className={styles.solutionStep}>
                  <span className={styles.stepNumber}>{step.step}</span>
                  <div className={styles.stepContent}>
                    <div className={styles.stepAction}>
                      <MathText>{step.action}</MathText>
                    </div>
                    <div className={styles.stepResult}>
                      <MathText>{step.result}</MathText>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.exampleExplanation}>
            <p className={styles.explanationText}>
              <MathText>{example.explanation}</MathText>
            </p>
          </div>
        </div>
      ))}

      {!isCompleted && (
        <div className={styles.tabCompleteHint}>
          <Button variant="secondary" onClick={onComplete}>
            <Check size={16} />
            Отметить как изучено
          </Button>
        </div>
      )}
    </div>
  );
}

// Quiz Tab Component
interface QuizTabProps {
  lesson: TopicLessonType;
  onComplete: (results: { correct: number; total: number }) => void;
  isCompleted: boolean;
}

function QuizTab({ lesson, onComplete, isCompleted }: QuizTabProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const { questions } = lesson.quiz;

  if (questions.length === 0) {
    // Если нет вопросов, отмечаем как завершённое с идеальным результатом
    useEffect(() => {
      if (!isCompleted) {
        onComplete({ correct: 1, total: 1 });
      }
    }, [isCompleted, onComplete]);

    return (
      <div className={styles.emptyState}>
        <HelpCircle size={48} className={styles.emptyIcon} />
        <h3 className={styles.emptyTitle}>Нет вопросов</h3>
        <p className={styles.emptyDescription}>Тест для этой темы пока не создан</p>
      </div>
    );
  }

  const handleAnswer = (questionId: string, optionId: string) => {
    if (showResults) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = () => {
    setShowResults(true);

    // Подсчитываем результаты
    const correctCount = questions.filter((q) => {
      const selectedOptionId = answers[q.id];
      const selectedOption = q.options.find((o) => o.id === selectedOptionId);
      return selectedOption?.isCorrect;
    }).length;

    // Отмечаем как завершённое и передаём результаты
    if (!isCompleted) {
      onComplete({ correct: correctCount, total: questions.length });
    }
  };

  const handleReset = () => {
    setAnswers({});
    setShowResults(false);
  };

  const allAnswered = questions.every((q) => answers[q.id]);

  // Подсчёт для отображения результатов
  const correctCount = showResults
    ? questions.filter((q) => {
        const selectedOptionId = answers[q.id];
        const selectedOption = q.options.find((o) => o.id === selectedOptionId);
        return selectedOption?.isCorrect;
      }).length
    : 0;

  return (
    <div className={styles.quiz}>
      {showResults && (
        <div className={styles.quizResultsBanner}>
          <div className={styles.quizResultsIcon}>
            {correctCount === questions.length ? (
              <Trophy size={32} />
            ) : correctCount >= questions.length / 2 ? (
              <CheckCircle2 size={32} />
            ) : (
              <XCircle size={32} />
            )}
          </div>
          <div className={styles.quizResultsText}>
            <span className={styles.quizResultsScore}>
              {correctCount} из {questions.length}
            </span>
            <span className={styles.quizResultsLabel}>
              {correctCount === questions.length
                ? 'Отлично!'
                : correctCount >= questions.length / 2
                ? 'Хороший результат!'
                : 'Попробуйте ещё раз'}
            </span>
          </div>
        </div>
      )}

      {questions.map((question, index) => {
        const selectedAnswer = answers[question.id];

        return (
          <div key={question.id} className={styles.quizQuestion}>
            <div className={styles.questionNumber}>Вопрос {index + 1}</div>
            <p className={styles.questionText}>{question.text}</p>

            <div className={styles.questionOptions}>
              {question.options.map((option) => {
                let optionClass = styles.optionButton;
                if (selectedAnswer === option.id) {
                  optionClass += ` ${styles.selected}`;
                }
                if (showResults) {
                  if (option.isCorrect) {
                    optionClass += ` ${styles.correct}`;
                  } else if (selectedAnswer === option.id && !option.isCorrect) {
                    optionClass += ` ${styles.incorrect}`;
                  }
                }

                return (
                  <button
                    key={option.id}
                    className={optionClass}
                    onClick={() => handleAnswer(question.id, option.id)}
                    disabled={showResults}
                  >
                    <span className={styles.optionLetter}>
                      {showResults && option.isCorrect ? (
                        <CheckCircle2 size={16} />
                      ) : showResults && selectedAnswer === option.id && !option.isCorrect ? (
                        <XCircle size={16} />
                      ) : (
                        option.id.toUpperCase()
                      )}
                    </span>
                    <span className={styles.optionText}>{option.text}</span>
                  </button>
                );
              })}
            </div>

            {showResults && (
              <div className={styles.questionExplanation}>
                <div className={styles.explanationLabel}>Объяснение</div>
                <p className={styles.explanationText}>{question.explanation}</p>
              </div>
            )}
          </div>
        );
      })}

      <div className={styles.quizActions}>
        {!showResults ? (
          <Button onClick={handleSubmit} disabled={!allAnswered}>
            Проверить ответы
          </Button>
        ) : (
          <Button variant="secondary" onClick={handleReset}>
            Пройти заново
          </Button>
        )}
      </div>
    </div>
  );
}

// Flashcards Tab Component - Preview mode with "Add to deck" functionality
interface FlashcardsTabProps {
  lesson: TopicLessonType;
  onComplete: () => void;
  isCompleted: boolean;
}

function FlashcardsTab({ lesson, onComplete, isCompleted }: FlashcardsTabProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [viewedAll, setViewedAll] = useState(false);

  const { flashcards, topicId, subjectId } = lesson;

  const {
    addCardToReviewDeck,
    removeCardFromReviewDeck,
    isCardInReviewDeck,
  } = useAppStore();

  // Подсчёт добавленных карточек
  const addedCount = useMemo(() => {
    return flashcards.filter((card) => isCardInReviewDeck(card.id)).length;
  }, [flashcards, isCardInReviewDeck]);

  // Отмечаем как просмотренное когда дошли до конца
  useEffect(() => {
    if (currentIndex === flashcards.length - 1 && !viewedAll) {
      setViewedAll(true);
    }
  }, [currentIndex, flashcards.length, viewedAll]);

  // Автоматически отмечаем таб как пройденный когда просмотрели все карточки
  useEffect(() => {
    if (viewedAll && !isCompleted) {
      onComplete();
    }
  }, [viewedAll, isCompleted, onComplete]);

  if (flashcards.length === 0) {
    useEffect(() => {
      if (!isCompleted) onComplete();
    }, [isCompleted, onComplete]);

    return (
      <div className={styles.emptyState}>
        <RotateCcw size={48} className={styles.emptyIcon} />
        <h3 className={styles.emptyTitle}>Нет карточек</h3>
        <p className={styles.emptyDescription}>Карточки для этой темы пока не созданы</p>
      </div>
    );
  }

  const card = flashcards[currentIndex];
  const isInDeck = isCardInReviewDeck(card.id);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const handleToggleDeck = () => {
    if (isInDeck) {
      removeCardFromReviewDeck(card.id);
    } else {
      addCardToReviewDeck(card.id, topicId, subjectId);
      // Автоматически переходим к следующей карточке
      if (currentIndex < flashcards.length - 1) {
        setTimeout(() => {
          setCurrentIndex(currentIndex + 1);
          setIsFlipped(false);
        }, 300);
      }
    }
  };

  const handleAddAllToDeck = () => {
    flashcards.forEach((c) => {
      if (!isCardInReviewDeck(c.id)) {
        addCardToReviewDeck(c.id, topicId, subjectId);
      }
    });
  };

  return (
    <div className={styles.flashcards}>
      {/* Информационный блок */}
      <div className={styles.flashcardInfo}>
        <div className={styles.flashcardInfoIcon}>
          <RotateCcw size={20} />
        </div>
        <div className={styles.flashcardInfoText}>
          <p>Просмотрите карточки и добавьте нужные в колоду для повторения.</p>
          <p className={styles.flashcardInfoHint}>
            Добавленные карточки появятся в разделе «Повторение» предмета.
          </p>
        </div>
      </div>

      {/* Счётчик */}
      <div className={styles.flashcardHeader}>
        <span className={styles.flashcardCounter}>
          {currentIndex + 1} / {flashcards.length}
        </span>
        <span className={styles.addedCounter}>
          <CheckCircle2 size={14} />
          В колоде: {addedCount}
        </span>
      </div>

      {/* Карточка */}
      <div className={styles.flashcardContainer}>
        <div
          className={`${styles.flashcard} ${isFlipped ? styles.flipped : ''}`}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div className={`${styles.flashcardFace} ${styles.flashcardFront}`}>
            <div className={styles.flashcardLabel}>Вопрос</div>
            <p className={styles.flashcardText}>
              <MathText>{card.front}</MathText>
            </p>
            <span className={styles.flashcardHint}>Нажмите, чтобы увидеть ответ</span>
          </div>
          <div className={`${styles.flashcardFace} ${styles.flashcardBack}`}>
            <div className={styles.flashcardLabel}>Ответ</div>
            <p className={styles.flashcardText}>
              <MathText>{card.back}</MathText>
            </p>
          </div>
        </div>
      </div>

      {/* Кнопка добавления в колоду */}
      <div className={styles.deckActions}>
        <button
          className={`${styles.addToDeckButton} ${isInDeck ? styles.inDeck : ''}`}
          onClick={handleToggleDeck}
        >
          {isInDeck ? (
            <>
              <CheckCircle2 size={18} />
              <span>В колоде</span>
            </>
          ) : (
            <>
              <RotateCcw size={18} />
              <span>Добавить в колоду</span>
            </>
          )}
        </button>
      </div>

      {/* Навигация */}
      <div className={styles.slideNavigation}>
        <button
          className={styles.slideNavButton}
          onClick={handlePrev}
          disabled={currentIndex === 0}
        >
          <ChevronLeft size={24} />
        </button>

        <div className={styles.slideDots}>
          {flashcards.map((c, index) => (
            <button
              key={c.id}
              className={`${styles.slideDot} ${index === currentIndex ? styles.active : ''} ${isCardInReviewDeck(c.id) ? styles.inDeck : ''}`}
              onClick={() => {
                setCurrentIndex(index);
                setIsFlipped(false);
              }}
            />
          ))}
        </div>

        <button
          className={styles.slideNavButton}
          onClick={handleNext}
          disabled={currentIndex === flashcards.length - 1}
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Кнопка добавить все */}
      {addedCount < flashcards.length && (
        <div className={styles.addAllAction}>
          <Button variant="secondary" onClick={handleAddAllToDeck}>
            Добавить все карточки в колоду ({flashcards.length - addedCount})
          </Button>
        </div>
      )}
    </div>
  );
}

// Helper functions
function getSlideTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    intro: 'Введение',
    concept: 'Концепция',
    formula: 'Формула',
    example: 'Пример',
    summary: 'Итоги',
  };
  return labels[type] || type;
}

function getDifficultyLabel(difficulty: string): string {
  const labels: Record<string, string> = {
    beginner: 'Начальный',
    intermediate: 'Средний',
    advanced: 'Сложный',
  };
  return labels[difficulty] || difficulty;
}
