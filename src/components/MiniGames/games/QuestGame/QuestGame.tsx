import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Star, Swords, ChevronRight } from 'lucide-react';
import type { MiniGameQuestion } from '../../../../types';
import { Button, MathText } from '../../../ui';
import styles from './QuestGame.module.css';

type GamePhase = 'idle' | 'attacking' | 'damaged' | 'enemy_defeated' | 'result';
type BattleResult = 'hit' | 'miss' | null;

interface QuestGameProps {
  questions: MiniGameQuestion[];
  onComplete: (result: 'won' | 'lost', stats: { score: number; errors: number }) => void;
  onExit: () => void;
}

// Враги с нарастающей сложностью
const ENEMIES = [
  { id: 1, name: 'Слайм', emoji: '🟢', color: '#22c55e' },
  { id: 2, name: 'Скелет', emoji: '💀', color: '#a1a1aa' },
  { id: 3, name: 'Гоблин', emoji: '👺', color: '#f97316' },
  { id: 4, name: 'Орк', emoji: '👹', color: '#dc2626' },
  { id: 5, name: 'Дракон', emoji: '🐉', color: '#7c3aed' },
];

const ANSWER_LABELS = ['A', 'B', 'C', 'D'];

export function QuestGame({ questions, onComplete }: QuestGameProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0); // Побеждённых врагов
  const [lives, setLives] = useState(3);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [phase, setPhase] = useState<GamePhase>('idle');
  const [battleResult, setBattleResult] = useState<BattleResult>(null);
  const [currentEnemyIndex, setCurrentEnemyIndex] = useState(0);

  const currentQuestion = questions[currentIndex];
  const currentEnemy = ENEMIES[currentEnemyIndex];
  const errors = 3 - lives;

  // Проверка условий завершения игры
  useEffect(() => {
    if (score >= 5) {
      onComplete('won', { score, errors });
    } else if (lives <= 0) {
      onComplete('lost', { score, errors });
    }
  }, [score, lives, errors, onComplete]);

  const handleAnswerSelect = (index: number) => {
    if (phase !== 'idle') return;
    setSelectedAnswer(index);
  };

  const handleAttack = () => {
    if (selectedAnswer === null || !currentQuestion) return;

    const isCorrect = selectedAnswer === currentQuestion.correctIndex;
    setBattleResult(isCorrect ? 'hit' : 'miss');
    setPhase(isCorrect ? 'attacking' : 'damaged');

    // Анимация атаки/урона
    setTimeout(() => {
      if (isCorrect) {
        // Победили врага
        setScore(prev => prev + 1);
        setCurrentEnemyIndex(prev => Math.min(prev + 1, ENEMIES.length - 1));
        setPhase('enemy_defeated');

        setTimeout(() => {
          setPhase('result');
        }, 800);
      } else {
        // Получили урон
        setLives(prev => prev - 1);
        setPhase('result');
      }
    }, 1000);
  };

  const handleNextQuestion = () => {
    if (currentIndex >= questions.length - 1) {
      onComplete(score >= 5 ? 'won' : 'lost', { score, errors });
      return;
    }

    setCurrentIndex(prev => prev + 1);
    setSelectedAnswer(null);
    setPhase('idle');
    setBattleResult(null);
  };

  if (!currentQuestion) return null;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.gameTitle}>
          <span className={styles.icon}>⚔️</span>
          <span>Квест героя</span>
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
            <Swords size={20} />
            <span>{score} / 5</span>
          </div>
        </div>
      </div>

      {/* Battle Arena */}
      <motion.div
        className={styles.arena}
        animate={phase === 'damaged' ? { x: [0, -10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
      >
        {/* Dungeon background effect */}
        <div className={styles.dungeonBg} />

        {/* Hero */}
        <motion.div
          className={styles.hero}
          animate={
            phase === 'attacking'
              ? { x: [0, 60, 0], scale: [1, 1.1, 1] }
              : phase === 'damaged'
              ? { scale: [1, 0.9, 1], filter: ['brightness(1)', 'brightness(2)', 'brightness(1)'] }
              : { y: [0, -5, 0] }
          }
          transition={
            phase === 'idle'
              ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.5 }
          }
        >
          <div className={styles.heroBody}>🧙‍♂️</div>
          {phase === 'attacking' && (
            <motion.div
              className={styles.attackEffect}
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              ⚡
            </motion.div>
          )}
        </motion.div>

        {/* VS indicator */}
        <div className={styles.vsIndicator}>VS</div>

        {/* Enemy */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentEnemy.id}
            className={styles.enemy}
            initial={{ scale: 0, rotate: -180 }}
            animate={
              phase === 'attacking'
                ? { scale: [1, 0.8, 1], x: [0, 20, 0] }
                : phase === 'enemy_defeated'
                ? { scale: 0, rotate: 180, opacity: 0 }
                : { y: [0, -5, 0], scale: 1, rotate: 0, opacity: 1 }
            }
            exit={{ scale: 0, rotate: 180, opacity: 0 }}
            transition={
              phase === 'idle'
                ? { duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }
                : { duration: 0.5 }
            }
          >
            <div
              className={styles.enemyBody}
              style={{ filter: `drop-shadow(0 0 20px ${currentEnemy.color})` }}
            >
              {currentEnemy.emoji}
            </div>
            <div className={styles.enemyName}>{currentEnemy.name}</div>
          </motion.div>
        </AnimatePresence>

        {/* Battle result overlay */}
        <AnimatePresence>
          {battleResult && phase === 'result' && (
            <motion.div
              className={`${styles.battleOverlay} ${styles[battleResult]}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
            >
              {battleResult === 'hit' ? (
                <>
                  <span className={styles.battleIcon}>⚔️</span>
                  <span className={styles.battleText}>Удар!</span>
                </>
              ) : (
                <>
                  <span className={styles.battleIcon}>💔</span>
                  <span className={styles.battleText}>Урон!</span>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Question Area */}
      <div className={styles.questionArea}>
        <div className={styles.enemyDialog}>
          <span className={styles.dialogEmoji}>{currentEnemy.emoji}</span>
          <span className={styles.dialogText}>
            {currentEnemy.name} бросает вызов!
          </span>
        </div>

        <div className={styles.questionNumber}>
          Вопрос {currentIndex + 1} из {questions.length}
        </div>

        <div className={styles.questionText}>
          <MathText>{currentQuestion.question}</MathText>
        </div>

        {/* Answer options */}
        <div className={styles.optionsGrid}>
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const showResult = phase === 'result';
            const isCorrect = index === currentQuestion.correctIndex;

            let buttonClass = styles.optionButton;
            if (showResult && isCorrect) buttonClass += ` ${styles.correct}`;
            else if (showResult && isSelected && !isCorrect) buttonClass += ` ${styles.incorrect}`;
            else if (isSelected) buttonClass += ` ${styles.selected}`;

            return (
              <motion.button
                key={index}
                className={buttonClass}
                onClick={() => handleAnswerSelect(index)}
                disabled={phase !== 'idle'}
                whileHover={phase === 'idle' ? { scale: 1.02 } : {}}
                whileTap={phase === 'idle' ? { scale: 0.98 } : {}}
              >
                <span className={styles.optionLabel}>{ANSWER_LABELS[index]}</span>
                <span className={styles.optionText}>
                  <MathText>{option}</MathText>
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Explanation */}
        <AnimatePresence>
          {phase === 'result' && currentQuestion.explanation && (
            <motion.div
              className={`${styles.explanation} ${battleResult === 'hit' ? styles.correct : styles.incorrect}`}
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
          {phase === 'idle' ? (
            <Button
              onClick={handleAttack}
              disabled={selectedAnswer === null}
              size="lg"
            >
              Атаковать! ⚔️
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

export default QuestGame;
