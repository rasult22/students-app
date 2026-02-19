import { useState, useMemo, useEffect } from 'react';
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
  Clock,
} from 'lucide-react';
import type { TopicLesson as TopicLessonType, Topic, ReviewQuality, Flashcard } from '../../types';
import { Button, MathText, MarkdownMath } from '../ui';
import { useAppStore } from '../../stores/appStore';
import {
  previewNextInterval,
  formatInterval,
  getReviewStats,
} from '../../services/spacedRepetition';
import styles from './TopicLesson.module.css';

type TabType = 'theory' | 'presentation' | 'examples' | 'quiz' | 'flashcards';

interface TopicLessonProps {
  lesson: TopicLessonType;
  topic: Topic;
  sectionName: string;
  onBack: () => void;
}

export function TopicLesson({ lesson, topic, sectionName, onBack }: TopicLessonProps) {
  const [activeTab, setActiveTab] = useState<TabType>('theory');

  const tabs = useMemo(() => [
    { id: 'theory' as const, label: 'Теория', icon: BookOpen },
    { id: 'presentation' as const, label: 'Презентация', icon: Presentation },
    { id: 'examples' as const, label: 'Примеры', icon: Layers },
    { id: 'quiz' as const, label: 'Тест', icon: HelpCircle },
    { id: 'flashcards' as const, label: 'Карточки', icon: RotateCcw },
  ], []);

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
            <span>{topic.estimatedMinutes} мин</span>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className={styles.tabIcon}>
              <tab.icon size={16} />
            </span>
            <span>{tab.label}</span>
          </button>
        ))}
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
          >
            {activeTab === 'theory' && <TheoryTab lesson={lesson} />}
            {activeTab === 'presentation' && <PresentationTab lesson={lesson} />}
            {activeTab === 'examples' && <ExamplesTab lesson={lesson} />}
            {activeTab === 'quiz' && <QuizTab lesson={lesson} />}
            {activeTab === 'flashcards' && <FlashcardsTab lesson={lesson} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

// Theory Tab Component
function TheoryTab({ lesson }: { lesson: TopicLessonType }) {
  const { theory } = lesson;

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
    </div>
  );
}

// Presentation Tab Component
function PresentationTab({ lesson }: { lesson: TopicLessonType }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = lesson.presentation.slides;

  if (slides.length === 0) {
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
function ExamplesTab({ lesson }: { lesson: TopicLessonType }) {
  const { examples } = lesson;

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
    </div>
  );
}

// Quiz Tab Component
function QuizTab({ lesson }: { lesson: TopicLessonType }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const { questions } = lesson.quiz;

  if (questions.length === 0) {
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
  };

  const handleReset = () => {
    setAnswers({});
    setShowResults(false);
  };

  const allAnswered = questions.every((q) => answers[q.id]);

  return (
    <div className={styles.quiz}>
      {questions.map((question, index) => {
        const selectedAnswer = answers[question.id];
        const correctOption = question.options.find((o) => o.isCorrect);

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

      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
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

// Flashcards Tab Component with Spaced Repetition (Anki-style)
function FlashcardsTab({ lesson }: { lesson: TopicLessonType }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  // Очередь карточек для текущей сессии (ID карточек)
  const [queue, setQueue] = useState<string[]>(() => lesson.flashcards.map((c) => c.id));

  const { flashcards, topicId } = lesson;

  const {
    initializeCardProgress,
    reviewCard,
    getCardProgress,
    flashcardProgress,
  } = useAppStore();

  // Инициализируем прогресс для всех карточек при загрузке
  useEffect(() => {
    flashcards.forEach((card) => {
      initializeCardProgress(card.id, topicId);
    });
  }, [flashcards, topicId, initializeCardProgress]);

  // Статистика
  const stats = useMemo(() => {
    const progressList = flashcards
      .map((card) => flashcardProgress[card.id])
      .filter(Boolean);
    return getReviewStats(progressList);
  }, [flashcards, flashcardProgress]);

  if (flashcards.length === 0) {
    return (
      <div className={styles.emptyState}>
        <RotateCcw size={48} className={styles.emptyIcon} />
        <h3 className={styles.emptyTitle}>Нет карточек</h3>
        <p className={styles.emptyDescription}>Карточки для этой темы пока не созданы</p>
      </div>
    );
  }

  // Сессия завершена (очередь пуста)
  if (sessionComplete || queue.length === 0) {
    return (
      <div className={styles.flashcards}>
        <div className={styles.sessionComplete}>
          <CheckCircle2 size={64} className={styles.sessionCompleteIcon} />
          <h3 className={styles.sessionCompleteTitle}>Сессия завершена!</h3>
          <p className={styles.sessionCompleteText}>
            Повторено карточек: {reviewedCount}
          </p>
          <div className={styles.sessionStats}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{stats.mastered}</span>
              <span className={styles.statLabel}>Освоено</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{stats.learning}</span>
              <span className={styles.statLabel}>Изучается</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{stats.newCards}</span>
              <span className={styles.statLabel}>Новые</span>
            </div>
          </div>
          <Button
            onClick={() => {
              setSessionComplete(false);
              setQueue(flashcards.map((c) => c.id));
              setReviewedCount(0);
              setIsFlipped(false);
            }}
          >
            Начать заново
          </Button>
        </div>
      </div>
    );
  }

  // Текущая карточка — первая в очереди
  const currentCardId = queue[0];
  const card = flashcards.find((c) => c.id === currentCardId)!;
  const cardProgress = getCardProgress(card.id);

  const handleReview = (quality: ReviewQuality) => {
    reviewCard(card.id, quality);
    setIsFlipped(false);
    setReviewedCount((prev) => prev + 1);

    setTimeout(() => {
      if (quality === 0) {
        // "Не знаю" — карточка уходит в конец очереди (покажется снова)
        setQueue((prev) => [...prev.slice(1), prev[0]]);
      } else {
        // Любой другой ответ — карточка выходит из очереди (graduated)
        setQueue((prev) => prev.slice(1));
      }
    }, 200);
  };

  // Кнопки оценки: Не знаю, Не помню, Хорошо, Легко
  const reviewButtons: { quality: ReviewQuality; label: string; color: string }[] = [
    { quality: 0, label: 'Не знаю', color: 'var(--color-error)' },
    { quality: 1, label: 'Не помню', color: 'var(--color-struggling)' },
    { quality: 4, label: 'Хорошо', color: 'var(--color-mastered)' },
    { quality: 5, label: 'Легко', color: 'var(--color-accent)' },
  ];

  // Счётчик: сколько осталось в очереди
  const remainingCount = queue.length;

  return (
    <div className={styles.flashcards}>
      {/* Прогресс */}
      <div className={styles.flashcardHeader}>
        <span className={styles.flashcardCounter}>
          Осталось: {remainingCount}
        </span>
        {cardProgress && cardProgress.interval > 0 && (
          <span className={styles.cardInterval}>
            <Clock size={14} />
            {formatInterval(cardProgress.interval)}
          </span>
        )}
      </div>

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
            <span className={styles.flashcardHint}>Нажмите, чтобы перевернуть</span>
          </div>
          <div className={`${styles.flashcardFace} ${styles.flashcardBack}`}>
            <div className={styles.flashcardLabel}>Ответ</div>
            <p className={styles.flashcardText}>
              <MathText>{card.back}</MathText>
            </p>
          </div>
        </div>
      </div>

      {/* Кнопки оценки (показываются после переворота) */}
      {isFlipped && (
        <div className={styles.reviewButtons}>
          {reviewButtons.map(({ quality, label, color }) => (
            <button
              key={quality}
              className={styles.reviewButton}
              style={{ '--button-color': color } as React.CSSProperties}
              onClick={(e) => {
                e.stopPropagation();
                handleReview(quality);
              }}
            >
              <span className={styles.reviewButtonLabel}>{label}</span>
              {cardProgress && (
                <span className={styles.reviewButtonInterval}>
                  {formatInterval(previewNextInterval(cardProgress, quality))}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper functions
function parseMarkdown(text: string): string {
  // Simple markdown parser
  return text
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/^\- (.*$)/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(.+)$/gm, (match) => {
      if (match.startsWith('<')) return match;
      return `<p>${match}</p>`;
    })
    .replace(/<p><\/p>/g, '');
}

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
