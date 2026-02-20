import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fuel, Star, ChevronRight } from 'lucide-react';
import type { MiniGameQuestion } from '../../../../types';
import { Button, MathText } from '../../../ui';
import styles from './TravelGame.module.css';

type GamePhase = 'planning' | 'flying' | 'result';
type FlightResult = 'landed' | 'turbulence' | null;

interface TravelGameProps {
  questions: MiniGameQuestion[];
  onComplete: (result: 'won' | 'lost', stats: { score: number; errors: number }) => void;
  onExit: () => void;
}

// Точки маршрута кругосветного путешествия
const DESTINATIONS = [
  { id: 0, name: 'Москва', emoji: '🛫', x: 10, y: 35 },
  { id: 1, name: 'Париж', emoji: '🗼', x: 25, y: 30 },
  { id: 2, name: 'Каир', emoji: '🏛️', x: 40, y: 50 },
  { id: 3, name: 'Токио', emoji: '🗻', x: 70, y: 35 },
  { id: 4, name: 'Нью-Йорк', emoji: '🗽', x: 90, y: 40 },
];

const ANSWER_LABELS = ['A', 'B', 'C', 'D'];

export function TravelGame({ questions, onComplete }: TravelGameProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0); // Количество достигнутых точек
  const [lives, setLives] = useState(3); // Топливо
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [phase, setPhase] = useState<GamePhase>('planning');
  const [flightResult, setFlightResult] = useState<FlightResult>(null);
  const [planePosition, setPlanePosition] = useState(0); // Индекс текущей позиции самолёта

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
    if (phase !== 'planning') return;
    setSelectedAnswer(index);
  };

  const handleFly = () => {
    if (selectedAnswer === null || !currentQuestion) return;

    const isCorrect = selectedAnswer === currentQuestion.correctIndex;
    setFlightResult(isCorrect ? 'landed' : 'turbulence');
    setPhase('flying');

    // Анимация полёта
    setTimeout(() => {
      if (isCorrect) {
        setScore(prev => prev + 1);
        setPlanePosition(prev => Math.min(prev + 1, 4));
      } else {
        setLives(prev => prev - 1);
      }
      setPhase('result');
    }, 1200);
  };

  const handleNextQuestion = () => {
    if (currentIndex >= questions.length - 1) {
      onComplete(score >= 5 ? 'won' : 'lost', { score, errors });
      return;
    }

    setCurrentIndex(prev => prev + 1);
    setSelectedAnswer(null);
    setPhase('planning');
    setFlightResult(null);
  };

  if (!currentQuestion) return null;

  const currentDestination = DESTINATIONS[planePosition];
  const nextDestination = DESTINATIONS[Math.min(planePosition + 1, 4)];

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.gameTitle}>
          <span className={styles.icon}>✈️</span>
          <span>Кругосветка</span>
        </div>
        <div className={styles.stats}>
          <div className={styles.fuel}>
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={`${styles.fuelCell} ${i >= lives ? styles.empty : ''}`}
              >
                <Fuel size={16} />
              </div>
            ))}
          </div>
          <div className={styles.score}>
            <Star size={20} />
            <span>{score} / 5</span>
          </div>
        </div>
      </div>

      {/* Map Area */}
      <motion.div
        className={styles.mapArea}
        animate={flightResult === 'turbulence' && phase === 'flying' ? { x: [0, -5, 5, -5, 5, 0] } : {}}
        transition={{ duration: 0.4 }}
      >
        {/* World map background */}
        <div className={styles.worldMap} />

        {/* Clouds decoration */}
        <div className={styles.clouds}>
          <motion.span
            className={styles.cloud}
            style={{ left: '15%', top: '20%' }}
            animate={{ x: [0, 20, 0], opacity: [0.6, 0.8, 0.6] }}
            transition={{ duration: 8, repeat: Infinity }}
          >
            ☁️
          </motion.span>
          <motion.span
            className={styles.cloud}
            style={{ left: '55%', top: '15%' }}
            animate={{ x: [0, -15, 0], opacity: [0.5, 0.7, 0.5] }}
            transition={{ duration: 10, repeat: Infinity, delay: 2 }}
          >
            ☁️
          </motion.span>
          <motion.span
            className={styles.cloud}
            style={{ left: '80%', top: '60%' }}
            animate={{ x: [0, 10, 0], opacity: [0.4, 0.6, 0.4] }}
            transition={{ duration: 7, repeat: Infinity, delay: 4 }}
          >
            ☁️
          </motion.span>
        </div>

        {/* Route path - SVG line connecting destinations */}
        <svg className={styles.routeSvg} viewBox="0 0 100 100" preserveAspectRatio="none">
          <path
            d={`M ${DESTINATIONS.map(d => `${d.x} ${d.y}`).join(' L ')}`}
            className={styles.routePath}
            fill="none"
          />
        </svg>

        {/* Destinations */}
        {DESTINATIONS.map((dest, index) => (
          <motion.div
            key={dest.id}
            className={`${styles.destination} ${index < planePosition ? styles.visited : ''} ${index === planePosition ? styles.current : ''} ${index === planePosition + 1 ? styles.next : ''}`}
            style={{ left: `${dest.x}%`, top: `${dest.y}%` }}
            animate={index === planePosition + 1 ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className={styles.destEmoji}>{dest.emoji}</span>
            <span className={styles.destName}>{dest.name}</span>
          </motion.div>
        ))}

        {/* Airplane */}
        <motion.div
          className={styles.airplane}
          animate={{
            left: `${DESTINATIONS[planePosition].x}%`,
            top: `${DESTINATIONS[planePosition].y - 8}%`,
            rotate: flightResult === 'turbulence' ? [0, -10, 10, -10, 10, 0] : 0,
          }}
          transition={
            flightResult === 'turbulence'
              ? { duration: 0.4 }
              : { type: 'spring', stiffness: 50, damping: 15 }
          }
        >
          ✈️
        </motion.div>

        {/* Flight result overlay */}
        <AnimatePresence>
          {flightResult && phase === 'result' && (
            <motion.div
              className={`${styles.resultOverlay} ${styles[flightResult]}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
            >
              {flightResult === 'landed' ? (
                <>
                  <span className={styles.resultIcon}>🛬</span>
                  <span className={styles.resultText}>Приземлились!</span>
                </>
              ) : (
                <>
                  <span className={styles.resultIcon}>⚡</span>
                  <span className={styles.resultText}>Турбулентность!</span>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Progress dots */}
      <div className={styles.progressDots}>
        {DESTINATIONS.map((dest, index) => (
          <div
            key={dest.id}
            className={`${styles.progressDot} ${index < planePosition ? styles.completed : ''} ${index === planePosition ? styles.current : ''}`}
          >
            {index < planePosition ? '✓' : dest.emoji}
          </div>
        ))}
      </div>

      {/* Question Area */}
      <div className={styles.questionArea}>
        <div className={styles.flightInfo}>
          <span className={styles.flightEmoji}>🧭</span>
          <span className={styles.flightText}>
            {currentDestination.name} → {nextDestination.name}
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
                disabled={phase !== 'planning'}
                whileHover={phase === 'planning' ? { scale: 1.02 } : {}}
                whileTap={phase === 'planning' ? { scale: 0.98 } : {}}
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
              className={`${styles.explanation} ${flightResult === 'landed' ? styles.correct : styles.incorrect}`}
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
          {phase === 'planning' ? (
            <Button
              onClick={handleFly}
              disabled={selectedAnswer === null}
              size="lg"
            >
              Взлёт! ✈️
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

export default TravelGame;
