import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Star, ChevronRight } from 'lucide-react';
import type { MiniGameQuestion } from '../../../../types';
import { Button, MathText } from '../../../ui';
import styles from './CookingGame.module.css';

type GamePhase = 'choosing' | 'cooking' | 'result';
type CookResult = 'tasty' | 'burnt' | null;

interface CookingGameProps {
  questions: MiniGameQuestion[];
  onComplete: (result: 'won' | 'lost', stats: { score: number; errors: number }) => void;
  onExit: () => void;
}

// Ингредиенты для блюда
const INGREDIENTS = [
  { id: 1, name: 'Основа', emoji: '🥩' },
  { id: 2, name: 'Гарнир', emoji: '🍚' },
  { id: 3, name: 'Овощи', emoji: '🥕' },
  { id: 4, name: 'Соус', emoji: '🍅' },
  { id: 5, name: 'Специи', emoji: '🧂' },
];

const ANSWER_LABELS = ['A', 'B', 'C', 'D'];

export function CookingGame({ questions, onComplete }: CookingGameProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0); // Добавленные ингредиенты
  const [lives, setLives] = useState(3);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [phase, setPhase] = useState<GamePhase>('choosing');
  const [cookResult, setCookResult] = useState<CookResult>(null);
  const [showSteam, setShowSteam] = useState(false);
  const [showSmoke, setShowSmoke] = useState(false);

  const currentQuestion = questions[currentIndex];
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
    if (phase !== 'choosing') return;
    setSelectedAnswer(index);
  };

  const handleCook = () => {
    if (selectedAnswer === null || !currentQuestion) return;

    const isCorrect = selectedAnswer === currentQuestion.correctIndex;
    setCookResult(isCorrect ? 'tasty' : 'burnt');
    setPhase('cooking');

    if (isCorrect) {
      setShowSteam(true);
      setTimeout(() => setShowSteam(false), 1500);
    } else {
      setShowSmoke(true);
      setTimeout(() => setShowSmoke(false), 1000);
    }

    // Анимация готовки
    setTimeout(() => {
      if (isCorrect) {
        setScore(prev => prev + 1);
      } else {
        setLives(prev => prev - 1);
      }
      setPhase('result');
    }, 1000);
  };

  const handleNextQuestion = () => {
    if (currentIndex >= questions.length - 1) {
      onComplete(score >= 5 ? 'won' : 'lost', { score, errors });
      return;
    }

    setCurrentIndex(prev => prev + 1);
    setSelectedAnswer(null);
    setPhase('choosing');
    setCookResult(null);
  };

  if (!currentQuestion) return null;

  const currentIngredient = INGREDIENTS[Math.min(score, 4)];

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.gameTitle}>
          <span className={styles.icon}>👨‍🍳</span>
          <span>Шеф-повар</span>
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

      {/* Kitchen Area */}
      <div className={styles.kitchenArea}>
        {/* Kitchen background */}
        <div className={styles.kitchenBg} />

        {/* Chef */}
        <motion.div
          className={styles.chef}
          animate={
            cookResult === 'tasty'
              ? { y: [0, -10, 0], rotate: [0, 5, -5, 0] }
              : cookResult === 'burnt'
              ? { x: [0, -5, 5, -5, 0] }
              : {}
          }
          transition={{ duration: 0.5 }}
        >
          {cookResult === 'tasty' ? '👨‍🍳' : cookResult === 'burnt' ? '😰' : '👨‍🍳'}
        </motion.div>

        {/* Pot/Pan */}
        <motion.div
          className={styles.pot}
          animate={phase === 'cooking' ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          <div className={styles.potBody}>🍳</div>

          {/* Ingredients in pot */}
          <div className={styles.potIngredients}>
            {INGREDIENTS.slice(0, score).map((ingredient, index) => (
              <motion.span
                key={ingredient.id}
                className={styles.potIngredient}
                initial={{ y: -50, opacity: 0, scale: 0.5 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1, type: 'spring' }}
                style={{
                  left: `${20 + (index % 3) * 25}%`,
                  top: `${index < 3 ? 30 : 50}%`,
                }}
              >
                {ingredient.emoji}
              </motion.span>
            ))}
          </div>

          {/* Steam effect */}
          <AnimatePresence>
            {showSteam && (
              <motion.div
                className={styles.steam}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {[...Array(3)].map((_, i) => (
                  <motion.span
                    key={i}
                    className={styles.steamParticle}
                    initial={{ y: 0, opacity: 0.8 }}
                    animate={{ y: -40, opacity: 0 }}
                    transition={{
                      duration: 1,
                      delay: i * 0.2,
                      repeat: 1,
                    }}
                    style={{ left: `${30 + i * 20}%` }}
                  >
                    💨
                  </motion.span>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Smoke effect on error */}
          <AnimatePresence>
            {showSmoke && (
              <motion.div
                className={styles.smoke}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {[...Array(3)].map((_, i) => (
                  <motion.span
                    key={i}
                    className={styles.smokeParticle}
                    initial={{ y: 0, opacity: 0.8, scale: 1 }}
                    animate={{ y: -30, opacity: 0, scale: 1.5 }}
                    transition={{ duration: 0.8, delay: i * 0.15 }}
                    style={{ left: `${25 + i * 25}%` }}
                  >
                    💨
                  </motion.span>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Result overlay */}
        <AnimatePresence>
          {cookResult && phase === 'result' && (
            <motion.div
              className={`${styles.resultOverlay} ${styles[cookResult]}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
            >
              {cookResult === 'tasty' ? (
                <>
                  <span className={styles.resultIcon}>😋</span>
                  <span className={styles.resultText}>Вкусно!</span>
                </>
              ) : (
                <>
                  <span className={styles.resultIcon}>🔥</span>
                  <span className={styles.resultText}>Подгорело!</span>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Recipe progress */}
      <div className={styles.recipeProgress}>
        {INGREDIENTS.map((ingredient, index) => (
          <div
            key={ingredient.id}
            className={`${styles.recipeStep} ${index < score ? styles.completed : ''} ${index === score ? styles.current : ''}`}
          >
            {index < score ? '✓' : ingredient.emoji}
          </div>
        ))}
      </div>

      {/* Question Area */}
      <div className={styles.questionArea}>
        <div className={styles.ingredientPrompt}>
          <span className={styles.promptEmoji}>🥄</span>
          <span className={styles.promptText}>
            Добавляем: {currentIngredient.name} {currentIngredient.emoji}
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
                disabled={phase !== 'choosing'}
                whileHover={phase === 'choosing' ? { scale: 1.02 } : {}}
                whileTap={phase === 'choosing' ? { scale: 0.98 } : {}}
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
              className={`${styles.explanation} ${cookResult === 'tasty' ? styles.correct : styles.incorrect}`}
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
          {phase === 'choosing' ? (
            <Button
              onClick={handleCook}
              disabled={selectedAnswer === null}
              size="lg"
            >
              Готовим! 🍳
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

export default CookingGame;
