import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RotateCcw,
  Clock,
  CheckCircle2,
  Coffee,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import type { Subject, ReviewQuality, Flashcard } from '../../types';
import { Button, MathText } from '../ui';
import { useAppStore } from '../../stores/appStore';
import {
  previewNextInterval,
  formatInterval,
  getReviewStats,
} from '../../services/spacedRepetition';
import styles from './ReviewSession.module.css';

interface ReviewSessionProps {
  subject: Subject;
}

export function ReviewSession({ subject }: ReviewSessionProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [queue, setQueue] = useState<string[]>([]);

  const {
    getDueCardsForSubject,
    getCardsForSubject,
    generatedLessons,
    reviewCard,
    getCardProgress,
    flashcardProgress,
  } = useAppStore();

  // Собираем все карточки из всех уроков предмета
  const allFlashcards = useMemo(() => {
    const cards: (Flashcard & { topicId: string; topicName: string; sectionName: string })[] = [];

    subject.sections.forEach((section) => {
      section.topics.forEach((topic) => {
        const lesson = generatedLessons[topic.id];
        if (lesson?.flashcards) {
          lesson.flashcards.forEach((card) => {
            cards.push({
              ...card,
              topicId: topic.id,
              topicName: topic.name,
              sectionName: section.name,
            });
          });
        }
      });
    });

    return cards;
  }, [subject, generatedLessons]);

  // Карточки, готовые к повторению
  const dueCards = useMemo(() => {
    return getDueCardsForSubject(subject.id);
  }, [subject.id, getDueCardsForSubject, flashcardProgress]);

  // Статистика по всем карточкам предмета
  const stats = useMemo(() => {
    const allProgress = getCardsForSubject(subject.id);
    return getReviewStats(allProgress);
  }, [subject.id, getCardsForSubject, flashcardProgress]);

  // Инициализируем очередь при старте или изменении due cards
  useEffect(() => {
    if (queue.length === 0 && dueCards.length > 0 && !sessionComplete) {
      setQueue(dueCards.map((p) => p.cardId));
    }
  }, [dueCards, sessionComplete]);

  // Нет карточек вообще
  if (allFlashcards.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>
          <BookOpen size={48} />
        </div>
        <h3 className={styles.emptyTitle}>Нет карточек для повторения</h3>
        <p className={styles.emptyDescription}>
          Изучайте темы в учебном плане — карточки появятся автоматически
        </p>
      </div>
    );
  }

  // Нет карточек к повторению — режим "чилл"
  if (dueCards.length === 0 && !sessionComplete && queue.length === 0) {
    const nextReview = getCardsForSubject(subject.id)
      .filter((p) => p.interval > 0)
      .sort((a, b) => new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime())[0];

    return (
      <div className={styles.chillState}>
        <div className={styles.chillIcon}>
          <Coffee size={64} />
        </div>
        <h3 className={styles.chillTitle}>Всё повторено!</h3>
        <p className={styles.chillDescription}>
          Пока можешь отдохнуть. Карточки ждут тебя позже.
        </p>

        {nextReview && (
          <div className={styles.nextReviewInfo}>
            <Clock size={16} />
            <span>
              Следующее повторение: {formatNextReviewDate(new Date(nextReview.nextReviewDate))}
            </span>
          </div>
        )}

        <div className={styles.chillStats}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{stats.mastered}</span>
            <span className={styles.statLabel}>Освоено</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{stats.learning}</span>
            <span className={styles.statLabel}>Изучается</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{allFlashcards.length}</span>
            <span className={styles.statLabel}>Всего</span>
          </div>
        </div>

        <div className={styles.chillTips}>
          <Sparkles size={16} />
          <span>Совет: регулярные короткие сессии эффективнее длинных марафонов</span>
        </div>
      </div>
    );
  }

  // Сессия завершена
  if (sessionComplete || queue.length === 0) {
    return (
      <div className={styles.sessionComplete}>
        <div className={styles.completeIcon}>
          <CheckCircle2 size={64} />
        </div>
        <h3 className={styles.completeTitle}>Сессия завершена!</h3>
        <p className={styles.completeText}>
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
            setReviewedCount(0);
            setIsFlipped(false);
            // Переинициализируем очередь из актуальных due cards
            const newDue = getDueCardsForSubject(subject.id);
            setQueue(newDue.map((p) => p.cardId));
          }}
          icon={<RotateCcw size={18} />}
        >
          Начать заново
        </Button>
      </div>
    );
  }

  // Активная сессия повторения
  const currentCardId = queue[0];
  const cardData = allFlashcards.find((c) => c.id === currentCardId);
  const cardProgress = getCardProgress(currentCardId);

  if (!cardData) {
    // Карточка не найдена — пропускаем
    setQueue((prev) => prev.slice(1));
    return null;
  }

  const handleReview = (quality: ReviewQuality) => {
    reviewCard(currentCardId, quality);
    setIsFlipped(false);
    setReviewedCount((prev) => prev + 1);

    setTimeout(() => {
      if (quality === 0) {
        // "Не знаю" — карточка уходит в конец очереди
        setQueue((prev) => [...prev.slice(1), prev[0]]);
      } else {
        // Любой другой ответ — карточка выходит из очереди
        setQueue((prev) => prev.slice(1));
      }
    }, 200);
  };

  const reviewButtons: { quality: ReviewQuality; label: string; color: string }[] = [
    { quality: 0, label: 'Не знаю', color: 'var(--color-error)' },
    { quality: 1, label: 'Не помню', color: 'var(--color-struggling)' },
    { quality: 4, label: 'Хорошо', color: 'var(--color-mastered)' },
    { quality: 5, label: 'Легко', color: 'var(--color-accent)' },
  ];

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.progress}>
          <span className={styles.counter}>
            Осталось: {queue.length}
          </span>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{
                width: `${((reviewedCount) / (reviewedCount + queue.length)) * 100}%`
              }}
            />
          </div>
        </div>
        {cardProgress && cardProgress.interval > 0 && (
          <span className={styles.cardInterval}>
            <Clock size={14} />
            {formatInterval(cardProgress.interval)}
          </span>
        )}
      </div>

      {/* Topic info */}
      <div className={styles.topicBadge}>
        <span className={styles.topicSection}>{cardData.sectionName}</span>
        <span className={styles.topicSeparator}>›</span>
        <span className={styles.topicName}>{cardData.topicName}</span>
      </div>

      {/* Card */}
      <div className={styles.cardContainer}>
        <div
          className={`${styles.card} ${isFlipped ? styles.flipped : ''}`}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div className={`${styles.cardFace} ${styles.cardFront}`}>
            <div className={styles.cardLabel}>Вопрос</div>
            <p className={styles.cardText}>
              <MathText>{cardData.front}</MathText>
            </p>
            <span className={styles.cardHint}>Нажмите, чтобы перевернуть</span>
          </div>
          <div className={`${styles.cardFace} ${styles.cardBack}`}>
            <div className={styles.cardLabel}>Ответ</div>
            <p className={styles.cardText}>
              <MathText>{cardData.back}</MathText>
            </p>
          </div>
        </div>
      </div>

      {/* Review buttons */}
      <AnimatePresence>
        {isFlipped && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={styles.reviewButtons}
          >
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function formatNextReviewDate(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return 'менее часа';
  if (diffHours < 24) return `через ${diffHours} ч.`;
  if (diffDays === 1) return 'завтра';
  if (diffDays < 7) return `через ${diffDays} дн.`;
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

export default ReviewSession;
