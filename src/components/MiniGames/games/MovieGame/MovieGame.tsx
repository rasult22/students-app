import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Star, ChevronRight } from 'lucide-react';
import type { MiniGameQuestion } from '../../../../types';
import { Button, MathText } from '../../../ui';
import styles from './MovieGame.module.css';

type GamePhase = 'directing' | 'filming' | 'result';
type FilmResult = 'success' | 'blooper' | null;

interface MovieGameProps {
  questions: MiniGameQuestion[];
  onComplete: (result: 'won' | 'lost', stats: { score: number; errors: number }) => void;
  onExit: () => void;
}

// Элементы сцены, которые собираются по мере правильных ответов
const SCENE_ELEMENTS = [
  { id: 1, name: 'Локация', emoji: '🏙️', position: 'background' },
  { id: 2, name: 'Персонаж', emoji: '🦸', position: 'center' },
  { id: 3, name: 'Действие', emoji: '💥', position: 'action' },
  { id: 4, name: 'Диалог', emoji: '💬', position: 'dialog' },
  { id: 5, name: 'Финал', emoji: '🎬', position: 'finale' },
];

const ANSWER_LABELS = ['A', 'B', 'C', 'D'];

export function MovieGame({ questions, onComplete }: MovieGameProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [phase, setPhase] = useState<GamePhase>('directing');
  const [filmResult, setFilmResult] = useState<FilmResult>(null);
  const [showStatic, setShowStatic] = useState(false);

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
    if (phase !== 'directing') return;
    setSelectedAnswer(index);
  };

  const handleFilm = () => {
    if (selectedAnswer === null || !currentQuestion) return;

    const isCorrect = selectedAnswer === currentQuestion.correctIndex;
    setFilmResult(isCorrect ? 'success' : 'blooper');
    setPhase('filming');

    if (!isCorrect) {
      setShowStatic(true);
      setTimeout(() => setShowStatic(false), 600);
    }

    // Анимация съёмки
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
    setPhase('directing');
    setFilmResult(null);
  };

  if (!currentQuestion) return null;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.gameTitle}>
          <span className={styles.icon}>🎬</span>
          <span>Режиссёр</span>
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

      {/* Film Frame - кинематографическая рамка */}
      <div className={styles.filmFrame}>
        {/* Film strip left */}
        <div className={`${styles.filmStrip} ${styles.left}`}>
          {[...Array(8)].map((_, i) => (
            <div key={i} className={styles.perforation} />
          ))}
        </div>

        {/* Scene area */}
        <div className={styles.sceneArea}>
          {/* Spotlight effect */}
          <div className={styles.spotlight} />

          {/* Static noise on error */}
          <AnimatePresence>
            {showStatic && (
              <motion.div
                className={styles.staticNoise}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            )}
          </AnimatePresence>

          {/* Scene elements that appear with correct answers */}
          <div className={styles.sceneElements}>
            {SCENE_ELEMENTS.slice(0, score).map((element, index) => (
              <motion.div
                key={element.id}
                className={`${styles.sceneElement} ${styles[element.position]}`}
                initial={{ scale: 0, opacity: 0, rotate: -180 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{
                  type: 'spring',
                  delay: index * 0.1,
                  stiffness: 200
                }}
              >
                {element.emoji}
              </motion.div>
            ))}

            {/* Placeholder for next element */}
            {score < 5 && (
              <motion.div
                className={`${styles.sceneElement} ${styles.placeholder} ${styles[SCENE_ELEMENTS[score].position]}`}
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span className={styles.placeholderIcon}>?</span>
                <span className={styles.placeholderName}>{SCENE_ELEMENTS[score].name}</span>
              </motion.div>
            )}
          </div>

          {/* Clapperboard animation */}
          <motion.div
            className={styles.clapperboard}
            animate={phase === 'filming' ? { rotateX: [0, -30, 0] } : {}}
            transition={{ duration: 0.3 }}
          >
            <div className={styles.clapperTop}>🎬</div>
          </motion.div>

          {/* Result overlay */}
          <AnimatePresence>
            {filmResult && phase === 'result' && (
              <motion.div
                className={`${styles.resultOverlay} ${styles[filmResult]}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
              >
                {filmResult === 'success' ? (
                  <>
                    <span className={styles.resultIcon}>🎥</span>
                    <span className={styles.resultText}>Снято!</span>
                  </>
                ) : (
                  <>
                    <span className={styles.resultIcon}>🎞️</span>
                    <span className={styles.resultText}>Дубль!</span>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Film strip right */}
        <div className={`${styles.filmStrip} ${styles.right}`}>
          {[...Array(8)].map((_, i) => (
            <div key={i} className={styles.perforation} />
          ))}
        </div>
      </div>

      {/* Progress track - film strip style */}
      <div className={styles.progressTrack}>
        {SCENE_ELEMENTS.map((element, index) => (
          <div
            key={element.id}
            className={`${styles.progressFrame} ${index < score ? styles.filled : ''}`}
          >
            {index < score ? element.emoji : '🎞️'}
          </div>
        ))}
      </div>

      {/* Question Area */}
      <div className={styles.questionArea}>
        <div className={styles.directorCall}>
          <span className={styles.callEmoji}>📣</span>
          <span className={styles.callText}>
            Сцена {score + 1}: {SCENE_ELEMENTS[Math.min(score, 4)].name}
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
                disabled={phase !== 'directing'}
                whileHover={phase === 'directing' ? { scale: 1.02 } : {}}
                whileTap={phase === 'directing' ? { scale: 0.98 } : {}}
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
              className={`${styles.explanation} ${filmResult === 'success' ? styles.correct : styles.incorrect}`}
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
          {phase === 'directing' ? (
            <Button
              onClick={handleFilm}
              disabled={selectedAnswer === null}
              size="lg"
            >
              Мотор! 🎬
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

export default MovieGame;
