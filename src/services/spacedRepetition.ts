/**
 * SM-2 Spaced Repetition Algorithm
 *
 * Алгоритм SuperMemo 2, используемый в Anki и других системах интервального повторения.
 *
 * Формулы:
 * - EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
 * - Если q < 3, то repetitions сбрасывается в 0
 * - Интервал: I(1) = 1, I(2) = 6, I(n) = I(n-1) * EF
 */

import type { FlashcardProgress, ReviewQuality, ReviewHistoryEntry } from '../types';

/** Минимальный фактор лёгкости */
const MIN_EASE_FACTOR = 1.3;
/** Начальный фактор лёгкости */
const DEFAULT_EASE_FACTOR = 2.5;

/**
 * Создаёт начальный прогресс для новой карточки
 */
export function createInitialProgress(
  cardId: string,
  topicId: string,
  subjectId: string
): FlashcardProgress {
  return {
    cardId,
    topicId,
    subjectId,
    easeFactor: DEFAULT_EASE_FACTOR,
    interval: 0,
    repetitions: 0,
    nextReviewDate: new Date(), // Готова к повторению сразу
    reviewHistory: [],
  };
}

/**
 * Вычисляет новый интервал и обновляет прогресс после ответа
 *
 * @param progress - Текущий прогресс карточки
 * @param quality - Качество ответа (0-5)
 * @returns Обновлённый прогресс
 */
export function processReview(
  progress: FlashcardProgress,
  quality: ReviewQuality
): FlashcardProgress {
  const now = new Date();

  // Записываем в историю
  const historyEntry: ReviewHistoryEntry = {
    date: now,
    quality,
    interval: progress.interval,
  };

  // Вычисляем новый EF (Ease Factor)
  let newEaseFactor = progress.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  // EF не может быть меньше минимума
  if (newEaseFactor < MIN_EASE_FACTOR) {
    newEaseFactor = MIN_EASE_FACTOR;
  }

  let newRepetitions: number;
  let newInterval: number;

  if (quality === 0) {
    // Не знаю — показать снова через 10 минут (в рамках сессии)
    newRepetitions = 0;
    newInterval = 0;
  } else if (quality === 1) {
    // Не помню — повторить завтра
    newRepetitions = 0;
    newInterval = 1;
  } else {
    // Хорошо (4) или Легко (5)
    newRepetitions = progress.repetitions + 1;

    if (newRepetitions === 1) {
      newInterval = quality === 5 ? 4 : 1;
    } else if (newRepetitions === 2) {
      newInterval = quality === 5 ? 10 : 6;
    } else {
      const baseInterval = Math.round(progress.interval * newEaseFactor);
      newInterval = quality === 5 ? Math.round(baseInterval * 1.5) : baseInterval;
    }
  }

  // Вычисляем дату следующего повторения
  const nextReviewDate = new Date(now);
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

  return {
    ...progress,
    easeFactor: newEaseFactor,
    interval: newInterval,
    repetitions: newRepetitions,
    nextReviewDate,
    lastReviewDate: now,
    reviewHistory: [...progress.reviewHistory, historyEntry],
  };
}

/**
 * Проверяет, нужно ли повторять карточку сегодня
 */
export function isDueForReview(progress: FlashcardProgress): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const reviewDate = new Date(progress.nextReviewDate);
  reviewDate.setHours(0, 0, 0, 0);

  return reviewDate <= today;
}

/**
 * Сортирует карточки по приоритету для повторения
 * Сначала просроченные, потом по фактору сложности (от низкого к высокому)
 */
export function sortByReviewPriority(progressList: FlashcardProgress[]): FlashcardProgress[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return [...progressList].sort((a, b) => {
    const aDate = new Date(a.nextReviewDate);
    const bDate = new Date(b.nextReviewDate);
    aDate.setHours(0, 0, 0, 0);
    bDate.setHours(0, 0, 0, 0);

    const aOverdue = aDate <= today;
    const bOverdue = bDate <= today;

    // Просроченные карточки имеют приоритет
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;

    // Среди просроченных — сначала те, что сложнее (меньший EF)
    if (aOverdue && bOverdue) {
      return a.easeFactor - b.easeFactor;
    }

    // Среди непросроченных — по дате следующего повторения
    return aDate.getTime() - bDate.getTime();
  });
}

/**
 * Получить карточки, которые нужно повторить сегодня
 */
export function getDueCards(progressList: FlashcardProgress[]): FlashcardProgress[] {
  return progressList.filter(isDueForReview);
}

/**
 * Получить статистику по карточкам
 */
export function getReviewStats(progressList: FlashcardProgress[]): {
  dueToday: number;
  newCards: number;
  learning: number;
  mastered: number;
  averageEaseFactor: number;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let dueToday = 0;
  let newCards = 0;
  let learning = 0;
  let mastered = 0;
  let totalEF = 0;

  progressList.forEach((p) => {
    const reviewDate = new Date(p.nextReviewDate);
    reviewDate.setHours(0, 0, 0, 0);

    if (reviewDate <= today) {
      dueToday++;
    }

    if (p.repetitions === 0) {
      newCards++;
    } else if (p.interval >= 21) {
      // Карточки с интервалом 21+ дней считаются освоенными
      mastered++;
    } else {
      learning++;
    }

    totalEF += p.easeFactor;
  });

  return {
    dueToday,
    newCards,
    learning,
    mastered,
    averageEaseFactor: progressList.length > 0 ? totalEF / progressList.length : DEFAULT_EASE_FACTOR,
  };
}

/**
 * Преобразует качество ответа в читаемую строку
 */
export function getQualityLabel(quality: ReviewQuality): string {
  const labels: Record<ReviewQuality, string> = {
    0: 'Не помню',
    1: 'Почти забыл',
    2: 'Было сложно',
    3: 'С трудом',
    4: 'Хорошо',
    5: 'Отлично',
  };
  return labels[quality];
}

/**
 * Получить цвет для качества ответа
 */
export function getQualityColor(quality: ReviewQuality): string {
  const colors: Record<ReviewQuality, string> = {
    0: 'var(--color-error)',
    1: 'var(--color-error)',
    2: 'var(--color-warning)',
    3: 'var(--color-warning)',
    4: 'var(--color-success)',
    5: 'var(--color-success)',
  };
  return colors[quality];
}

/**
 * Вычисляет предполагаемый интервал для заданного качества (для превью)
 */
export function previewNextInterval(
  progress: FlashcardProgress,
  quality: ReviewQuality
): number {
  // Не знаю (0) — 10 минут (показываем как "10 мин")
  if (quality === 0) return 0;

  // Не помню (1) — 1 день
  if (quality === 1) return 1;

  // Хорошо (4) и Легко (5) — зависит от прогресса
  const newReps = progress.repetitions + 1;

  if (newReps === 1) {
    // Первое повторение: Хорошо = 1 день, Легко = 4 дня
    return quality === 5 ? 4 : 1;
  }

  if (newReps === 2) {
    // Второе повторение: Хорошо = 6 дней, Легко = 10 дней
    return quality === 5 ? 10 : 6;
  }

  // Последующие — умножаем на EF
  let newEF = progress.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (newEF < MIN_EASE_FACTOR) newEF = MIN_EASE_FACTOR;

  const baseInterval = Math.round(progress.interval * newEF);
  // Легко даёт бонус +50% к интервалу
  return quality === 5 ? Math.round(baseInterval * 1.5) : baseInterval;
}

/**
 * Форматирует интервал в читаемую строку
 */
export function formatInterval(days: number): string {
  if (days === 0) return '10 мин';
  if (days === 1) return '1 день';
  if (days < 5) return `${days} дня`;
  if (days < 7) return `${days} дней`;
  if (days < 30) {
    const weeks = Math.round(days / 7);
    return `${weeks} нед.`;
  }
  const months = Math.round(days / 30);
  return `${months} мес.`;
}
