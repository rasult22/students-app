import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Star, ChevronRight } from 'lucide-react';
import type { MiniGameQuestion } from '../../../../types';
import { Button, MathText } from '../../../ui';
import styles from './FootballGame.module.css';

type KickDirection = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
type GamePhase = 'aiming' | 'kicking' | 'result';
type KickResult = 'goal' | 'saved' | null;

interface FootballGameProps {
  questions: MiniGameQuestion[];
  onComplete: (result: 'won' | 'lost', stats: { score: number; errors: number }) => void;
  onExit: () => void;
}

const DIRECTIONS: KickDirection[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
const DIRECTION_LABELS = ['A', 'B', 'C', 'D'];

export function FootballGame({ questions, onComplete }: FootballGameProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [phase, setPhase] = useState<GamePhase>('aiming');
  const [kickResult, setKickResult] = useState<KickResult>(null);
  const [goalkeeperDirection, setGoalkeeperDirection] = useState<KickDirection | null>(null);

  const currentQuestion = questions[currentIndex];
  const errors = 3 - lives;

  // Check game end conditions
  useEffect(() => {
    if (score >= 5) {
      onComplete('won', { score, errors });
    } else if (lives <= 0) {
      onComplete('lost', { score, errors });
    }
  }, [score, lives, errors, onComplete]);

  const handleDirectionSelect = (index: number) => {
    if (phase !== 'aiming') return;
    setSelectedAnswer(index);
  };

  const handleKick = () => {
    if (selectedAnswer === null || !currentQuestion) return;

    const isCorrect = selectedAnswer === currentQuestion.correctIndex;
    const kickDir = DIRECTIONS[selectedAnswer];

    // Goalkeeper jumps to random direction (but catches if wrong answer)
    let gkDir: KickDirection;
    if (isCorrect) {
      // Goal! Goalkeeper jumps wrong way
      const wrongDirs = DIRECTIONS.filter(d => d !== kickDir);
      gkDir = wrongDirs[Math.floor(Math.random() * wrongDirs.length)];
    } else {
      // Saved! Goalkeeper catches the ball
      gkDir = kickDir;
    }

    setGoalkeeperDirection(gkDir);
    setPhase('kicking');
    setKickResult(isCorrect ? 'goal' : 'saved');

    // Update score/lives after animation
    setTimeout(() => {
      if (isCorrect) {
        setScore(prev => prev + 1);
      } else {
        setLives(prev => prev - 1);
      }
      setPhase('result');
    }, 1200);
  };

  const handleNextQuestion = () => {
    if (currentIndex >= questions.length - 1) {
      onComplete(score >= 5 ? 'won' : 'lost', { score: score, errors });
      return;
    }

    setCurrentIndex(prev => prev + 1);
    setSelectedAnswer(null);
    setPhase('aiming');
    setKickResult(null);
    setGoalkeeperDirection(null);
  };

  if (!currentQuestion) return null;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.gameTitle}>
          <span className={styles.icon}>⚽</span>
          <span>Пенальти</span>
        </div>
        <div className={styles.stats}>
          <div className={styles.lives}>
            {[...Array(3)].map((_, i) => (
              <Heart
                key={i}
                size={20}
                fill={i < lives ? 'currentColor' : 'none'}
                className={`${styles.heart} ${i >= lives ? styles.lost : ''}`}
              />
            ))}
          </div>
          <div className={styles.score}>
            <Star size={20} />
            <span>{score} / 5</span>
          </div>
        </div>
      </div>

      {/* Football Field */}
      <div className={styles.field}>
        {/* Goal Post */}
        <div className={styles.goalArea}>
          <div className={styles.goalPost}>
            <div className={styles.goalNet} />

            {/* Goal zones for visual feedback */}
            <div className={styles.goalZones}>
              {DIRECTIONS.map((dir, i) => (
                <div
                  key={dir}
                  className={`${styles.goalZone} ${styles[dir]} ${selectedAnswer === i ? styles.targeted : ''}`}
                />
              ))}
            </div>

            {/* Goalkeeper */}
            <motion.div
              className={styles.goalkeeper}
              animate={
                goalkeeperDirection
                  ? {
                      x: goalkeeperDirection.includes('left') ? -60 : 60,
                      y: goalkeeperDirection.includes('top') ? -30 : 30,
                      rotate: goalkeeperDirection.includes('left') ? -20 : 20,
                    }
                  : { x: 0, y: 0, rotate: 0 }
              }
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <div className={styles.goalkeeperBody}>
                🧤
              </div>
            </motion.div>
          </div>
        </div>

        {/* Ball */}
        <AnimatePresence>
          {phase === 'aiming' && (
            <motion.div
              className={styles.ball}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
            >
              ⚽
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ball animation during kick */}
        <AnimatePresence>
          {phase !== 'aiming' && selectedAnswer !== null && (
            <motion.div
              className={styles.ballKicking}
              initial={{
                bottom: '10%',
                left: '50%',
                x: '-50%',
                scale: 1
              }}
              animate={{
                bottom: DIRECTIONS[selectedAnswer].includes('top') ? '75%' : '55%',
                left: DIRECTIONS[selectedAnswer].includes('left') ? '25%' : '75%',
                scale: 0.6,
              }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              ⚽
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result overlay */}
        <AnimatePresence>
          {kickResult && phase === 'result' && (
            <motion.div
              className={`${styles.resultOverlay} ${styles[kickResult]}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
            >
              {kickResult === 'goal' ? (
                <>
                  <span className={styles.resultIcon}>🎉</span>
                  <span className={styles.resultText}>ГОЛ!</span>
                </>
              ) : (
                <>
                  <span className={styles.resultIcon}>😔</span>
                  <span className={styles.resultText}>Мимо!</span>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Question */}
      <div className={styles.questionArea}>
        <div className={styles.questionNumber}>
          Вопрос {currentIndex + 1} из {questions.length}
        </div>
        <div className={styles.questionText}>
          <MathText>{currentQuestion.question}</MathText>
        </div>

        {/* Direction buttons as answer options */}
        <div className={styles.directionsGrid}>
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const showResult = phase === 'result';
            const isCorrect = index === currentQuestion.correctIndex;

            let buttonClass = styles.directionButton;
            if (showResult && isCorrect) buttonClass += ` ${styles.correct}`;
            else if (showResult && isSelected && !isCorrect) buttonClass += ` ${styles.incorrect}`;
            else if (isSelected) buttonClass += ` ${styles.selected}`;

            return (
              <motion.button
                key={index}
                className={buttonClass}
                onClick={() => handleDirectionSelect(index)}
                disabled={phase !== 'aiming'}
                whileHover={phase === 'aiming' ? { scale: 1.03 } : {}}
                whileTap={phase === 'aiming' ? { scale: 0.97 } : {}}
              >
                <span className={styles.directionLabel}>{DIRECTION_LABELS[index]}</span>
                <span className={styles.optionText}>
                  <MathText>{option}</MathText>
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Explanation after answer */}
        <AnimatePresence>
          {phase === 'result' && currentQuestion.explanation && (
            <motion.div
              className={`${styles.explanation} ${kickResult === 'goal' ? styles.correct : styles.incorrect}`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              {currentQuestion.explanation}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action button */}
        <div className={styles.actionButton}>
          {phase === 'aiming' ? (
            <Button
              onClick={handleKick}
              disabled={selectedAnswer === null}
              size="lg"
            >
              Бить! ⚽
            </Button>
          ) : phase === 'result' ? (
            <Button
              onClick={handleNextQuestion}
              size="lg"
              icon={<ChevronRight size={18} />}
              iconPosition="right"
            >
              Далее
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default FootballGame;
