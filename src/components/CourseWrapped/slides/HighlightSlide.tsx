import { motion } from 'framer-motion';
import { Star, TrendingUp, Zap } from 'lucide-react';
import { useCountUp } from '../../../hooks/useCountUp';
import type { WrappedSlide, WrappedData } from '../../../types';
import styles from '../CourseWrapped.module.css';

interface HighlightSlideProps {
  slide: WrappedSlide;
  data: WrappedData;
}

const iconMap: Record<string, React.ReactNode> = {
  star: <Star size={48} color="var(--color-tertiary)" />,
  'trending-up': <TrendingUp size={48} color="var(--color-mastered)" />,
  zap: <Zap size={48} color="var(--color-accent)" />,
};

export function HighlightSlide({ slide }: HighlightSlideProps) {
  const numericValue = typeof slide.value === 'number'
    ? slide.value
    : typeof slide.value === 'string' && slide.value.startsWith('+')
    ? parseInt(slide.value.slice(1), 10)
    : 0;

  const animatedValue = useCountUp(Math.abs(numericValue), 2000);
  const displayValue = typeof slide.value === 'string' && slide.value.startsWith('+')
    ? `+${animatedValue}`
    : animatedValue;

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
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.1, duration: 0.6, type: 'spring' }}
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

      <motion.p
        className={styles.slideSubtitle}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        style={{ marginBottom: 'var(--space-6)' }}
      >
        {slide.subtitle}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.6, type: 'spring' }}
      >
        <span className={styles.bigNumber}>
          {slide.animation === 'count-up' ? displayValue : slide.value}
        </span>
        {slide.secondaryValue && (
          <span className={styles.bigNumberSuffix}>{slide.secondaryValue}</span>
        )}
      </motion.div>
    </motion.div>
  );
}

export default HighlightSlide;
