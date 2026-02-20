import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import type { WrappedSlide, WrappedData } from '../../../types';
import styles from '../CourseWrapped.module.css';

interface IntroSlideProps {
  slide: WrappedSlide;
  data: WrappedData;
}

export function IntroSlide({ slide, data }: IntroSlideProps) {
  return (
    <motion.div
      className={styles.slideContent}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className={styles.slideIcon}
        initial={{ rotate: -10 }}
        animate={{ rotate: 10 }}
        transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
      >
        <Sparkles size={64} color="var(--color-accent)" />
      </motion.div>

      <motion.h1
        className={styles.slideTitle}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {slide.title}
      </motion.h1>

      <motion.p
        className={styles.slideSubtitle}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        {slide.subtitle}
      </motion.p>
    </motion.div>
  );
}

export default IntroSlide;
