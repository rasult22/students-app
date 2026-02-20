import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { generateWrappedSlides, getBackgroundClass } from '../../services/generators/wrappedGenerator';
import { IntroSlide } from './slides/IntroSlide';
import { StatSlide } from './slides/StatSlide';
import { HighlightSlide } from './slides/HighlightSlide';
import { AchievementSlide } from './slides/AchievementSlide';
import { SectionBreakdownSlide } from './slides/SectionBreakdownSlide';
import { CertificateSlide } from './slides/CertificateSlide';
import { OutroSlide } from './slides/OutroSlide';
import type { Subject, WrappedSlide, CourseWrapped as CourseWrappedType } from '../../types';
import styles from './CourseWrapped.module.css';

interface CourseWrappedProps {
  subject: Subject;
  finalTestScore: number;
  onClose: () => void;
}

export function CourseWrapped({ subject, finalTestScore, onClose }: CourseWrappedProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState<WrappedSlide[]>([]);
  const [wrapped, setWrapped] = useState<CourseWrappedType | null>(null);

  const { generateWrappedData, saveWrapped, getWrapped } = useAppStore();

  // Инициализация данных Wrapped
  useEffect(() => {
    // Проверяем, есть ли уже сохранённый wrapped
    const existingWrapped = getWrapped(subject.id);

    if (existingWrapped) {
      setWrapped(existingWrapped);
      setSlides(existingWrapped.slides);
    } else {
      // Генерируем новый
      const sections = subject.sections.map((section) => ({
        id: section.id,
        name: section.name,
        topicIds: section.topics.map((t) => t.id),
      }));

      const wrappedData = generateWrappedData(
        subject.id,
        subject.name,
        sections,
        finalTestScore
      );

      const generatedSlides = generateWrappedSlides(wrappedData);

      const newWrapped: CourseWrappedType = {
        id: crypto.randomUUID(),
        subjectId: subject.id,
        data: wrappedData,
        slides: generatedSlides,
        generatedAt: new Date(),
      };

      setWrapped(newWrapped);
      setSlides(generatedSlides);
      saveWrapped(newWrapped);
    }
  }, [subject, finalTestScore, generateWrappedData, getWrapped, saveWrapped]);

  const handlePrevSlide = useCallback(() => {
    setCurrentSlide((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNextSlide = useCallback(() => {
    setCurrentSlide((prev) => Math.min(slides.length - 1, prev + 1));
  }, [slides.length]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrevSlide();
      if (e.key === 'ArrowRight') handleNextSlide();
      if (e.key === 'Escape') onClose();
    },
    [handlePrevSlide, handleNextSlide, onClose]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const currentSlideData = slides[currentSlide];

  if (!currentSlideData || !wrapped) {
    return null;
  }

  const renderSlide = (slide: WrappedSlide) => {
    const props = {
      slide,
      data: wrapped.data,
    };

    switch (slide.type) {
      case 'intro':
        return <IntroSlide {...props} />;
      case 'stat':
        return <StatSlide {...props} />;
      case 'highlight':
        return <HighlightSlide {...props} />;
      case 'achievement':
        return <AchievementSlide {...props} />;
      case 'section-breakdown':
        return <SectionBreakdownSlide {...props} />;
      case 'certificate':
        return <CertificateSlide {...props} onClose={onClose} />;
      case 'outro':
        return <OutroSlide {...props} onClose={onClose} />;
      default:
        return <StatSlide {...props} />;
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        {/* Close button */}
        <button className={styles.closeButton} onClick={onClose} aria-label="Закрыть">
          <X size={24} />
        </button>

        {/* Slides */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            className={`${styles.slideContainer} ${styles[getBackgroundClass(currentSlideData.background)]}`}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {renderSlide(currentSlideData)}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className={styles.navigation}>
          <button
            className={styles.navArrow}
            onClick={handlePrevSlide}
            disabled={currentSlide === 0}
            aria-label="Предыдущий слайд"
          >
            <ChevronLeft size={20} />
          </button>

          <div className={styles.navDots}>
            {slides.map((_, index) => (
              <button
                key={index}
                className={`${styles.navDot} ${index === currentSlide ? styles.active : ''}`}
                onClick={() => setCurrentSlide(index)}
                aria-label={`Слайд ${index + 1}`}
              />
            ))}
          </div>

          <button
            className={styles.navArrow}
            onClick={handleNextSlide}
            disabled={currentSlide === slides.length - 1}
            aria-label="Следующий слайд"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default CourseWrapped;
