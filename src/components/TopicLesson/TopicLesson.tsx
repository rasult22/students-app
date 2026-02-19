import { useState, useMemo } from 'react';
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
} from 'lucide-react';
import type { TopicLesson as TopicLessonType, Topic } from '../../types';
import { Button } from '../ui';
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
      <div
        className={styles.theoryText}
        dangerouslySetInnerHTML={{ __html: parseMarkdown(theory.content) }}
      />

      {theory.keyPoints.length > 0 && (
        <div className={styles.keyPoints}>
          <h3 className={styles.keyPointsTitle}>Ключевые тезисы</h3>
          <ul className={styles.keyPointsList}>
            {theory.keyPoints.map((point, index) => (
              <li key={index}>{point}</li>
            ))}
          </ul>
        </div>
      )}

      {theory.formulas && theory.formulas.length > 0 && (
        <div className={styles.formulas}>
          <h3 className={styles.formulasTitle}>Формулы</h3>
          {theory.formulas.map((formula, index) => (
            <div key={index} className={styles.formulaCard}>
              <div className={styles.formulaLatex}>{formula.latex}</div>
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

            <div
              className={styles.slideContent}
              dangerouslySetInnerHTML={{ __html: parseMarkdown(slide.content) }}
            />
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
            <p className={styles.problemText}>{example.problem}</p>
          </div>

          <div className={styles.exampleSolution}>
            <div className={styles.solutionLabel}>Решение</div>
            <div className={styles.solutionSteps}>
              {example.solution.map((step) => (
                <div key={step.step} className={styles.solutionStep}>
                  <span className={styles.stepNumber}>{step.step}</span>
                  <div className={styles.stepContent}>
                    <div className={styles.stepAction}>{step.action}</div>
                    <div className={styles.stepResult}>{step.result}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.exampleExplanation}>
            <p className={styles.explanationText}>{example.explanation}</p>
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

// Flashcards Tab Component
function FlashcardsTab({ lesson }: { lesson: TopicLessonType }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const { flashcards } = lesson;

  if (flashcards.length === 0) {
    return (
      <div className={styles.emptyState}>
        <RotateCcw size={48} className={styles.emptyIcon} />
        <h3 className={styles.emptyTitle}>Нет карточек</h3>
        <p className={styles.emptyDescription}>Карточки для этой темы пока не созданы</p>
      </div>
    );
  }

  const card = flashcards[currentIndex];

  const goToPrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : flashcards.length - 1));
    }, 150);
  };

  const goToNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev < flashcards.length - 1 ? prev + 1 : 0));
    }, 150);
  };

  return (
    <div className={styles.flashcards}>
      <div className={styles.flashcardContainer}>
        <div
          className={`${styles.flashcard} ${isFlipped ? styles.flipped : ''}`}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div className={`${styles.flashcardFace} ${styles.flashcardFront}`}>
            <div className={styles.flashcardLabel}>Вопрос</div>
            <p className={styles.flashcardText}>{card.front}</p>
            <span className={styles.flashcardHint}>Нажмите, чтобы перевернуть</span>
          </div>
          <div className={`${styles.flashcardFace} ${styles.flashcardBack}`}>
            <div className={styles.flashcardLabel}>Ответ</div>
            <p className={styles.flashcardText}>{card.back}</p>
          </div>
        </div>
      </div>

      <div className={styles.flashcardNavigation}>
        <button className={styles.slideNavButton} onClick={goToPrev}>
          <ChevronLeft size={24} />
        </button>

        <span className={styles.flashcardCounter}>
          {currentIndex + 1} / {flashcards.length}
        </span>

        <button className={styles.slideNavButton} onClick={goToNext}>
          <ChevronRight size={24} />
        </button>
      </div>
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
