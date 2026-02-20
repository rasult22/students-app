import { motion } from 'framer-motion';
import {
  Trophy,
  BookOpen,
  Layers,
  Calendar,
  TrendingUp,
  Star,
} from 'lucide-react';
import { useCountUp } from '../../../hooks/useCountUp';
import type { WrappedSlide, WrappedData } from '../../../types';
import styles from '../CourseWrapped.module.css';

interface StatSlideProps {
  slide: WrappedSlide;
  data: WrappedData;
}

const iconMap: Record<string, React.ReactNode> = {
  trophy: <Trophy size={48} color="var(--color-tertiary)" />,
  'book-open': <BookOpen size={48} color="var(--color-accent)" />,
  layers: <Layers size={48} color="var(--color-secondary)" />,
  calendar: <Calendar size={48} color="var(--color-learning)" />,
  'trending-up': <TrendingUp size={48} color="var(--color-mastered)" />,
  star: <Star size={48} color="var(--color-tertiary)" />,
};

export function StatSlide({ slide }: StatSlideProps) {
  const numericValue = typeof slide.value === 'number' ? slide.value : 0;
  const animatedValue = useCountUp(numericValue, 2000);

  const icon = slide.icon ? iconMap[slide.icon] || iconMap['star'] : null;

  return (
    <motion.div
      className={styles.slideContent}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {icon && (
        <motion.div
          className={styles.slideIcon}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5, type: 'spring' }}
        >
          {icon}
        </motion.div>
      )}

      <motion.h2
        className={styles.slideTitle}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {slide.title}
      </motion.h2>

      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.6, type: 'spring' }}
      >
        <span className={styles.bigNumber}>
          {slide.animation === 'count-up' ? animatedValue : slide.value}
        </span>
        {slide.secondaryValue && (
          <span className={styles.bigNumberSuffix}>{slide.secondaryValue}</span>
        )}
      </motion.div>

      {slide.subtitle && (
        <motion.p
          className={styles.slideSubtitle}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          {slide.subtitle}
        </motion.p>
      )}
    </motion.div>
  );
}

export default StatSlide;
