import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PartyPopper, Share2, ArrowRight } from 'lucide-react';
import { Button } from '../../ui/Button';
import type { WrappedSlide, WrappedData } from '../../../types';
import styles from '../CourseWrapped.module.css';

interface OutroSlideProps {
  slide: WrappedSlide;
  data: WrappedData;
  onClose: () => void;
}

interface ConfettiPiece {
  id: number;
  left: string;
  color: string;
  delay: number;
  duration: number;
}

export function OutroSlide({ slide, onClose }: OutroSlideProps) {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    const colors = ['#00d4aa', '#8b5cf6', '#fbbf24', '#3b82f6', '#10b981', '#f43f5e'];
    const pieces: ConfettiPiece[] = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 1,
      duration: 2 + Math.random() * 3,
    }));
    setConfetti(pieces);
  }, []);

  return (
    <motion.div
      className={styles.slideContent}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Confetti */}
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

      <motion.div
        className={styles.slideIcon}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, duration: 0.6, type: 'spring', bounce: 0.5 }}
      >
        <PartyPopper size={64} color="var(--color-tertiary)" />
      </motion.div>

      <motion.h2
        className={styles.slideTitle}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        style={{ fontSize: 'clamp(var(--text-3xl), 8vw, var(--text-5xl))' }}
      >
        {slide.title}
      </motion.h2>

      <motion.p
        className={styles.slideSubtitle}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        {slide.subtitle}
      </motion.p>

      <motion.div
        className={styles.outroButtons}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <Button variant="secondary" disabled>
          <Share2 size={18} />
          Поделиться (скоро)
        </Button>
        <Button onClick={onClose}>
          Продолжить
          <ArrowRight size={18} />
        </Button>
      </motion.div>
    </motion.div>
  );
}

export default OutroSlide;
