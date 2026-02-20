import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mountain, Award, Target } from 'lucide-react';
import { useCountUp } from '../../../hooks/useCountUp';
import type { WrappedSlide, WrappedData } from '../../../types';
import styles from '../CourseWrapped.module.css';

interface AchievementSlideProps {
  slide: WrappedSlide;
  data: WrappedData;
}

const iconMap: Record<string, React.ReactNode> = {
  mountain: <Mountain size={48} color="var(--color-mastered)" />,
  award: <Award size={48} color="var(--color-tertiary)" />,
  target: <Target size={48} color="var(--color-accent)" />,
};

interface ConfettiPiece {
  id: number;
  left: string;
  color: string;
  delay: number;
  duration: number;
}

export function AchievementSlide({ slide }: AchievementSlideProps) {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const numericValue = typeof slide.value === 'number' ? slide.value : 0;
  const animatedValue = useCountUp(numericValue, 2000);

  const icon = slide.icon ? iconMap[slide.icon] || iconMap['award'] : null;

  useEffect(() => {
    if (slide.animation === 'confetti') {
      const colors = ['#00d4aa', '#8b5cf6', '#fbbf24', '#3b82f6', '#10b981'];
      const pieces: ConfettiPiece[] = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 2,
      }));
      setConfetti(pieces);
    }
  }, [slide.animation]);

  return (
    <motion.div
      className={styles.slideContent}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Confetti */}
      {confetti.length > 0 && (
        <div className={styles.confetti}>
          {confetti.map((piece) => (
            <motion.div
              key={piece.id}
              className={styles.confettiPiece}
              style={{
                left: piece.left,
                backgroundColor: piece.color,
              }}
              initial={{ y: '-10%', rotate: 0, opacity: 1 }}
              animate={{ y: '110vh', rotate: 720, opacity: 0 }}
              transition={{
                delay: piece.delay,
                duration: piece.duration,
                ease: 'linear',
              }}
            />
          ))}
        </div>
      )}

      {icon && (
        <motion.div
          className={styles.slideIcon}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, duration: 0.6, type: 'spring', bounce: 0.5 }}
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
        <span className={styles.bigNumber}>{animatedValue}</span>
        <span className={styles.bigNumberSuffix}>%</span>
      </motion.div>

      {slide.secondaryValue && (
        <motion.p
          className={styles.slideSubtitle}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          style={{ marginTop: 'var(--space-2)' }}
        >
          {slide.secondaryValue}
        </motion.p>
      )}
    </motion.div>
  );
}

export default AchievementSlide;
