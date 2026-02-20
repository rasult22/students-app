import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gamepad2,
  Heart,
  Trophy,
  Star,
  Loader2,
  Check,
  X,
  ChevronRight,
  RotateCcw,
  Frown,
} from 'lucide-react';
import type { Subject, Topic, MiniGameType, MiniGameQuestion, Section } from '../../types';
import { miniGameTemplates } from '../../data/miniGames';
import { generateMiniGameQuestions } from '../../services/generators';
import { Button, Icon, MathText } from '../ui';
import { FootballGame } from './games/FootballGame';
import styles from './MiniGames.module.css';

type Phase = 'selection' | 'loading' | 'playing' | 'results';

interface MiniGamesProps {
  subject: Subject;
}

export function MiniGames({ subject }: MiniGamesProps) {
  const [phase, setPhase] = useState<Phase>('selection');
  const [selectedGame, setSelectedGame] = useState<MiniGameType | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);

  // Game state
  const [questions, setQuestions] = useState<MiniGameQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [gameResult, setGameResult] = useState<'won' | 'lost' | null>(null);
  const [finalStats, setFinalStats] = useState({ score: 0, errors: 0 });

  // Flatten all topics for selection
  const allTopics = subject.sections.flatMap((section) =>
    section.topics.map((topic) => ({ topic, section }))
  );

  const currentQuestion = questions[currentIndex];
  const gameTemplate = selectedGame ? miniGameTemplates.find((g) => g.id === selectedGame) : null;

  const handleStartGame = async () => {
    if (!selectedGame || !selectedTopic || !selectedSection) return;

    setPhase('loading');

    try {
      const generatedQuestions = await generateMiniGameQuestions(
        selectedTopic,
        selectedSection.name,
        subject.name,
        selectedGame,
        8
      );

      setQuestions(generatedQuestions);
      setCurrentIndex(0);
      setScore(0);
      setLives(3);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setGameResult(null);
      setFinalStats({ score: 0, errors: 0 });
      setPhase('playing');
    } catch (error) {
      console.error('Failed to generate mini-game questions:', error);
      setPhase('selection');
    }
  };

  const handleAnswerSelect = (index: number) => {
    if (showFeedback) return;
    setSelectedAnswer(index);
  };

  const handleSubmitAnswer = useCallback(() => {
    if (selectedAnswer === null || !currentQuestion) return;

    const correct = selectedAnswer === currentQuestion.correctIndex;
    setIsCorrect(correct);
    setShowFeedback(true);

    if (correct) {
      setScore((prev) => prev + 1);
    } else {
      setLives((prev) => prev - 1);
    }
  }, [selectedAnswer, currentQuestion]);

  const handleNextQuestion = useCallback(() => {
    // Вычисляем актуальные значения после последнего ответа
    const newScore = isCorrect ? score + 1 : score;
    const newLives = isCorrect ? lives : lives - 1;
    const newErrors = 3 - newLives;

    // Check win condition - набрали 5 очков
    if (newScore >= 5) {
      setFinalStats({ score: newScore, errors: newErrors });
      setGameResult('won');
      setPhase('results');
      return;
    }

    // Check lose condition - закончились жизни
    if (newLives <= 0) {
      setFinalStats({ score: newScore, errors: newErrors });
      setGameResult('lost');
      setPhase('results');
      return;
    }

    // Check if no more questions
    if (currentIndex >= questions.length - 1) {
      setFinalStats({ score: newScore, errors: newErrors });
      setGameResult(newScore >= 5 ? 'won' : 'lost');
      setPhase('results');
      return;
    }

    setCurrentIndex((prev) => prev + 1);
    setSelectedAnswer(null);
    setShowFeedback(false);
  }, [lives, isCorrect, score, currentIndex, questions.length]);

  const handlePlayAgain = () => {
    setPhase('selection');
    setSelectedGame(null);
    setSelectedTopic(null);
    setSelectedSection(null);
    setQuestions([]);
  };

  const handleRetry = () => {
    handleStartGame();
  };

  return (
    <div className={styles.container}>
      <AnimatePresence mode="wait">
        {/* Selection Screen */}
        {phase === 'selection' && (
          <motion.div
            key="selection"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={styles.selectionScreen}
          >
            <h2 className={styles.selectionTitle}>Мини-игры</h2>
            <p className={styles.selectionSubtitle}>
              Выбери игру и тему для изучения в игровом формате
            </p>

            <div className={styles.gamesGrid}>
              {miniGameTemplates.map((game) => (
                <motion.button
                  key={game.id}
                  className={`${styles.gameCard} ${selectedGame === game.id ? styles.selected : ''}`}
                  onClick={() => setSelectedGame(game.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className={styles.gameIcon}>
                    <Icon name={game.icon} size={24} />
                  </div>
                  <h3 className={styles.gameName}>{game.name}</h3>
                  <p className={styles.gameDescription}>{game.description}</p>
                </motion.button>
              ))}
            </div>

            {selectedGame && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className={styles.topicSelection}
              >
                <h3 className={styles.topicSelectionTitle}>Выбери тему:</h3>
                <div className={styles.topicsList}>
                  {allTopics.map(({ topic, section }) => (
                    <button
                      key={topic.id}
                      className={`${styles.topicChip} ${selectedTopic?.id === topic.id ? styles.selected : ''}`}
                      onClick={() => {
                        setSelectedTopic(topic);
                        setSelectedSection(section);
                      }}
                    >
                      {topic.name}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            <div className={styles.startActions}>
              <Button
                size="lg"
                onClick={handleStartGame}
                disabled={!selectedGame || !selectedTopic}
                icon={<Gamepad2 size={18} />}
              >
                Начать игру
              </Button>
            </div>
          </motion.div>
        )}

        {/* Loading Screen */}
        {phase === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.loadingScreen}
          >
            <div className={styles.loadingIcon}>
              <Loader2 size={40} className={styles.spin} />
            </div>
            <h3 className={styles.loadingTitle}>Готовим игру...</h3>
            <p className={styles.loadingSubtitle}>
              Генерируем вопросы по теме «{selectedTopic?.name}»
            </p>
          </motion.div>
        )}

        {/* Playing Screen - Football Game */}
        {phase === 'playing' && selectedGame === 'football-quiz' && questions.length > 0 && (
          <motion.div
            key="playing-football"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <FootballGame
              questions={questions}
              onComplete={(result, stats) => {
                setFinalStats(stats);
                setGameResult(result);
                setPhase('results');
              }}
              onExit={handlePlayAgain}
            />
          </motion.div>
        )}

        {/* Playing Screen - Generic (for other games) */}
        {phase === 'playing' && selectedGame !== 'football-quiz' && currentQuestion && (
          <motion.div
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.gameScreen}
          >
            <div className={styles.gameHeader}>
              <div className={styles.gameInfo}>
                <div className={styles.gameIcon}>
                  <Icon name={gameTemplate?.icon || 'gamepad-2'} size={20} />
                </div>
                <span className={styles.gameTitle}>{gameTemplate?.name}</span>
              </div>

              <div className={styles.gameStats}>
                <div className={styles.statItem}>
                  <div className={styles.lives}>
                    {[...Array(3)].map((_, i) => (
                      <Heart
                        key={i}
                        size={18}
                        fill={i < lives ? 'currentColor' : 'none'}
                        className={`${styles.heart} ${i >= lives ? styles.lost : ''}`}
                      />
                    ))}
                  </div>
                </div>
                <div className={styles.statItem}>
                  <Star size={18} />
                  <span className={styles.score}>{score} / 5</span>
                </div>
              </div>
            </div>

            <div className={styles.questionArea}>
              <div className={styles.questionNumber}>
                Вопрос {currentIndex + 1} из {questions.length}
              </div>
              <div className={styles.questionText}>
                <MathText>{currentQuestion.question}</MathText>
              </div>

              <div className={styles.optionsGrid}>
                {currentQuestion.options.map((option, index) => {
                  const letter = String.fromCharCode(65 + index);
                  let buttonClass = styles.optionButton;

                  if (showFeedback) {
                    if (index === currentQuestion.correctIndex) {
                      buttonClass += ` ${styles.correct}`;
                    } else if (index === selectedAnswer) {
                      buttonClass += ` ${styles.incorrect}`;
                    }
                  } else if (index === selectedAnswer) {
                    buttonClass += ` ${styles.selected}`;
                  }

                  return (
                    <motion.button
                      key={index}
                      className={buttonClass}
                      onClick={() => handleAnswerSelect(index)}
                      disabled={showFeedback}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <span className={styles.optionLetter}>
                        {showFeedback && index === currentQuestion.correctIndex ? (
                          <Check size={16} />
                        ) : showFeedback && index === selectedAnswer ? (
                          <X size={16} />
                        ) : (
                          letter
                        )}
                      </span>
                      <span className={styles.optionText}>
                        <MathText>{option}</MathText>
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              <AnimatePresence>
                {showFeedback && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`${styles.feedback} ${isCorrect ? styles.correct : styles.incorrect}`}
                  >
                    <div className={styles.feedbackHeader}>
                      {isCorrect ? <Check size={18} /> : <X size={18} />}
                      <span>{isCorrect ? 'Правильно!' : 'Неверно'}</span>
                    </div>
                    {currentQuestion.explanation && (
                      <p className={styles.feedbackExplanation}>
                        {currentQuestion.explanation}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className={styles.nextButton}>
                {!showFeedback ? (
                  <Button
                    onClick={handleSubmitAnswer}
                    disabled={selectedAnswer === null}
                  >
                    Ответить
                  </Button>
                ) : (
                  <Button
                    onClick={handleNextQuestion}
                    icon={<ChevronRight size={18} />}
                    iconPosition="right"
                  >
                    Далее
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Results Screen */}
        {phase === 'results' && (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className={styles.resultsScreen}
          >
            <motion.div
              className={`${styles.resultsIcon} ${gameResult === 'won' ? styles.won : styles.lost}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
            >
              {gameResult === 'won' ? <Trophy size={48} /> : <Frown size={48} />}
            </motion.div>

            <h2 className={styles.resultsTitle}>
              {gameResult === 'won' ? 'Победа!' : 'Попробуй ещё раз'}
            </h2>
            <p className={styles.resultsSubtitle}>
              {gameResult === 'won'
                ? 'Отличная работа! Ты освоил тему через игру.'
                : 'Не сдавайся! Попробуй снова или выбери другую тему.'}
            </p>

            <div className={styles.resultsStats}>
              <div className={styles.resultStat}>
                <div className={styles.resultStatValue}>{finalStats.score}</div>
                <div className={styles.resultStatLabel}>Правильных</div>
              </div>
              <div className={styles.resultStat}>
                <div className={styles.resultStatValue}>{finalStats.errors}</div>
                <div className={styles.resultStatLabel}>Ошибок</div>
              </div>
            </div>

            <div className={styles.resultsActions}>
              <Button variant="secondary" onClick={handlePlayAgain}>
                Другая игра
              </Button>
              <Button onClick={handleRetry} icon={<RotateCcw size={18} />}>
                Играть снова
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default MiniGames;
