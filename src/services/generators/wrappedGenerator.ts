import type { WrappedData, WrappedSlide, WrappedBackground } from '../../types';

/**
 * Генерирует слайды для Course Wrapped на основе данных
 */
export function generateWrappedSlides(data: WrappedData): WrappedSlide[] {
  const slides: WrappedSlide[] = [];

  // 1. Intro slide
  slides.push({
    id: 'intro',
    type: 'intro',
    title: `Твой путь в ${data.subjectName}`,
    subtitle: `${data.userName}, ты прошёл этот курс!`,
    background: 'gradient-1',
    animation: 'reveal',
  });

  // 2. Final test score
  slides.push({
    id: 'final-score',
    type: 'stat',
    title: 'Твой финальный результат',
    subtitle: getScoreMessage(data.finalTestScore),
    value: data.finalTestScore,
    secondaryValue: '%',
    icon: 'trophy',
    background: 'gradient-2',
    animation: 'count-up',
  });

  // 3. Topics mastered
  slides.push({
    id: 'topics',
    type: 'stat',
    title: 'Темы освоены',
    subtitle: `Ты изучил ${data.masteredTopics} из ${data.totalTopics} тем`,
    value: data.masteredTopics,
    secondaryValue: `/ ${data.totalTopics}`,
    icon: 'book-open',
    background: 'gradient-3',
    animation: 'count-up',
  });

  // 4. Best section highlight
  if (data.bestSection && data.bestSection.score > 0) {
    slides.push({
      id: 'best-section',
      type: 'highlight',
      title: 'Твоя сильная сторона',
      subtitle: `${data.bestSection.name} — твоя суперсила!`,
      value: data.bestSection.score,
      secondaryValue: '%',
      icon: 'star',
      background: 'gradient-1',
      animation: 'reveal',
    });
  }

  // 5. Improvement
  if (data.improvement > 0) {
    slides.push({
      id: 'improvement',
      type: 'highlight',
      title: 'Твой прогресс',
      subtitle: 'С начала курса ты вырос',
      value: `+${data.improvement}`,
      secondaryValue: '%',
      icon: 'trending-up',
      background: 'gradient-2',
      animation: 'count-up',
    });
  }

  // 6. Hardest conquered (if available)
  if (data.hardestConquered && data.hardestConquered.finalScore > data.hardestConquered.initialScore) {
    slides.push({
      id: 'hardest-conquered',
      type: 'achievement',
      title: 'Сложная тема покорена',
      subtitle: data.hardestConquered.name,
      value: data.hardestConquered.finalScore,
      secondaryValue: `было ${data.hardestConquered.initialScore}%`,
      icon: 'mountain',
      background: 'gradient-3',
      animation: 'confetti',
    });
  }

  // 7. Flashcards
  if (data.totalFlashcards > 0) {
    slides.push({
      id: 'flashcards',
      type: 'stat',
      title: 'Карточки для запоминания',
      subtitle: `${data.masteredFlashcards} карточек освоено`,
      value: data.totalFlashcards,
      secondaryValue: 'в колоде',
      icon: 'layers',
      background: 'gradient-1',
      animation: 'count-up',
    });
  }

  // 8. Study activity
  slides.push({
    id: 'activity',
    type: 'stat',
    title: 'Твоя активность',
    subtitle: data.longestStreak > 1 ? `Максимальный streak: ${data.longestStreak} дней` : 'Отличная работа!',
    value: data.studyDays,
    secondaryValue: data.studyDays === 1 ? 'день обучения' : getDaysWord(data.studyDays),
    icon: 'calendar',
    background: 'gradient-2',
    animation: 'count-up',
  });

  // 9. Section breakdown
  if (data.sectionScores.length > 0) {
    slides.push({
      id: 'sections',
      type: 'section-breakdown',
      title: 'Результаты по разделам',
      subtitle: 'Твой прогресс в каждом разделе',
      background: 'gradient-3',
      animation: 'progress',
      data: {
        sections: data.sectionScores,
      },
    });
  }

  // 10. Certificate
  slides.push({
    id: 'certificate',
    type: 'certificate',
    title: 'Твой сертификат',
    subtitle: getCertificateGrade(data.finalTestScore),
    value: data.finalTestScore,
    background: 'gradient-1',
    animation: 'reveal',
    data: {
      userName: data.userName,
      subjectName: data.subjectName,
      completedAt: data.completedAt,
      grade: getGrade(data.finalTestScore),
    },
  });

  // 11. Outro
  slides.push({
    id: 'outro',
    type: 'outro',
    title: 'Поздравляем!',
    subtitle: `Курс "${data.subjectName}" завершён`,
    icon: 'party-popper',
    background: 'gradient-2',
    animation: 'confetti',
  });

  return slides;
}

function getScoreMessage(score: number): string {
  if (score >= 90) return 'Превосходный результат!';
  if (score >= 80) return 'Отличная работа!';
  if (score >= 70) return 'Хороший результат!';
  if (score >= 50) return 'Неплохо! Есть куда расти';
  return 'Попробуй ещё раз!';
}

function getCertificateGrade(score: number): string {
  if (score >= 90) return 'С отличием';
  if (score >= 70) return 'Хорошо';
  if (score >= 50) return 'Удовлетворительно';
  return 'Курс завершён';
}

function getGrade(score: number): 'excellent' | 'good' | 'satisfactory' | 'none' {
  if (score >= 90) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'satisfactory';
  return 'none';
}

function getDaysWord(days: number): string {
  const lastDigit = days % 10;
  const lastTwoDigits = days % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return 'дней обучения';
  }

  if (lastDigit === 1) {
    return 'день обучения';
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return 'дня обучения';
  }

  return 'дней обучения';
}

/**
 * Получить цвет градиента по индексу
 */
export function getBackgroundClass(background?: WrappedBackground): string {
  switch (background) {
    case 'gradient-1':
      return 'gradient1';
    case 'gradient-2':
      return 'gradient2';
    case 'gradient-3':
      return 'gradient3';
    case 'gradient-4':
      return 'gradient4';
    default:
      return 'gradient1';
  }
}
