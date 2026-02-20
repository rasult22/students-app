import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gamepad2,
  Loader2,
  Trophy,
  Frown,
  RotateCcw,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import type { Topic, MiniGameType, MiniGameQuestion } from '../../types';
import { miniGameTemplates } from '../../data/miniGames';
import { generateMiniGameQuestions } from '../../services/generators';
import { Button, Icon } from '../ui';
import { FootballGame } from '../MiniGames/games/FootballGame';
import { QuestGame } from '../MiniGames/games/QuestGame';
import { MovieGame } from '../MiniGames/games/MovieGame';
import { TravelGame } from '../MiniGames/games/TravelGame';
import { CookingGame } from '../MiniGames/games/CookingGame';
import styles from './TopicMiniGames.module.css';

type Phase = 'selection' | 'loading' | 'playing' | 'finished';

interface TopicMiniGamesProps {
  topic: Topic;
  sectionName: string;
  subjectName: string;
  onComplete: () => void;
  isCompleted: boolean;
}

// Финальные сообщения для каждой игры при победе
const GAME_WIN_MESSAGES: Record<MiniGameType, { title: string; subtitle: string; emoji: string }> = {
  'football-quiz': {
    title: 'Победа!',
    subtitle: 'Отличный матч! Все пенальти забиты.',
    emoji: '⚽🏆',
  },
  'game-quest': {
    title: 'Победа!',
    subtitle: 'Все враги повержены! Ты настоящий герой.',
    emoji: '⚔️🏆',
  },
  'movie-scenes': {
    title: 'Снято!',
    subtitle: 'Фильм готов к премьере. Оскар ждёт!',
    emoji: '🎬🌟',
  },
  'travel-adventure': {
    title: 'Прибытие!',
    subtitle: 'Кругосветка завершена. Добро пожаловать домой!',
    emoji: '✈️🌍',
  },
  'cooking-recipe': {
    title: 'Готово!',
    subtitle: 'Блюдо приготовлено идеально. Bon appétit!',
    emoji: '👨‍🍳⭐',
  },
};

// Финальные сообщения для каждой игры при поражении
const GAME_LOSE_MESSAGES: Record<MiniGameType, { title: string; subtitle: string; emoji: string }> = {
  'football-quiz': {
    title: 'Матч окончен',
    subtitle: 'Вратарь оказался сильнее. Попробуй ещё!',
    emoji: '⚽😔',
  },
  'game-quest': {
    title: 'Поражение',
    subtitle: 'Герой пал в бою. Попробуй снова!',
    emoji: '⚔️💔',
  },
  'movie-scenes': {
    title: 'Съёмки провалены',
    subtitle: 'Режиссёр недоволен. Переснимем!',
    emoji: '🎬😔',
  },
  'travel-adventure': {
    title: 'Топливо закончилось',
    subtitle: 'Самолёт не долетел. Попробуй снова!',
    emoji: '✈️💨',
  },
  'cooking-recipe': {
    title: 'Блюдо испорчено',
    subtitle: 'Что-то пошло не так на кухне. Ещё раз!',
    emoji: '👨‍🍳😅',
  },
};

export function TopicMiniGames({
  topic,
  sectionName,
  subjectName,
  onComplete,
  isCompleted,
}: TopicMiniGamesProps) {
  const [phase, setPhase] = useState<Phase>('selection');
  const [selectedGame, setSelectedGame] = useState<MiniGameType | null>(null);
  const [questions, setQuestions] = useState<MiniGameQuestion[]>([]);
  const [gameResult, setGameResult] = useState<'won' | 'lost' | null>(null);
  const [finalStats, setFinalStats] = useState({ score: 0, errors: 0 });

  const handleStartGame = async (gameType: MiniGameType) => {
    setSelectedGame(gameType);
    setPhase('loading');

    try {
      const generatedQuestions = await generateMiniGameQuestions(
        topic,
        sectionName,
        subjectName,
        gameType,
        8
      );

      setQuestions(generatedQuestions);
      setGameResult(null);
      setFinalStats({ score: 0, errors: 0 });
      setPhase('playing');
    } catch (error) {
      console.error('Failed to generate mini-game questions:', error);
      setPhase('selection');
    }
  };

  const handleGameComplete = useCallback((result: 'won' | 'lost', stats: { score: number; errors: number }) => {
    setFinalStats(stats);
    setGameResult(result);
    setPhase('finished');

    // Отмечаем таб как завершённый если выиграли
    if (result === 'won' && !isCompleted) {
      onComplete();
    }
  }, [isCompleted, onComplete]);

  const handlePlayAgain = () => {
    if (selectedGame) {
      handleStartGame(selectedGame);
    }
  };

  const handleChooseAnotherGame = () => {
    setPhase('selection');
    setSelectedGame(null);
    setQuestions([]);
    setGameResult(null);
  };

  const handleFinish = () => {
    setPhase('selection');
    setSelectedGame(null);
    setQuestions([]);
    setGameResult(null);
  };

  const getMessage = () => {
    if (!selectedGame || !gameResult) return null;
    return gameResult === 'won'
      ? GAME_WIN_MESSAGES[selectedGame]
      : GAME_LOSE_MESSAGES[selectedGame];
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
            <div className={styles.header}>
              <div className={styles.headerIcon}>
                <Gamepad2 size={24} />
              </div>
              <div className={styles.headerText}>
                <h3 className={styles.title}>Закрепи знания в игре!</h3>
                <p className={styles.subtitle}>
                  Выбери игру и проверь, насколько хорошо ты усвоил тему
                </p>
              </div>
            </div>

            {isCompleted && (
              <div className={styles.completedBadge}>
                <Sparkles size={16} />
                <span>Ты уже прошёл мини-игру по этой теме</span>
              </div>
            )}

            <div className={styles.gamesGrid}>
              {miniGameTemplates.map((game) => (
                <motion.button
                  key={game.id}
                  className={styles.gameCard}
                  onClick={() => handleStartGame(game.id)}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className={styles.gameIcon}>
                    <Icon name={game.icon} size={28} />
                  </div>
                  <div className={styles.gameInfo}>
                    <h4 className={styles.gameName}>{game.name}</h4>
                    <p className={styles.gameDescription}>{game.description}</p>
                  </div>
                </motion.button>
              ))}
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
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className={styles.loadingIcon}
            >
              <Loader2 size={40} />
            </motion.div>
            <h3 className={styles.loadingTitle}>Готовим игру...</h3>
            <p className={styles.loadingSubtitle}>
              Генерируем вопросы по теме «{topic.name}»
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
              onComplete={handleGameComplete}
              onExit={handleChooseAnotherGame}
            />
          </motion.div>
        )}

        {/* Playing Screen - Quest Game */}
        {phase === 'playing' && selectedGame === 'game-quest' && questions.length > 0 && (
          <motion.div
            key="playing-quest"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <QuestGame
              questions={questions}
              onComplete={handleGameComplete}
              onExit={handleChooseAnotherGame}
            />
          </motion.div>
        )}

        {/* Playing Screen - Movie Game */}
        {phase === 'playing' && selectedGame === 'movie-scenes' && questions.length > 0 && (
          <motion.div
            key="playing-movie"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <MovieGame
              questions={questions}
              onComplete={handleGameComplete}
              onExit={handleChooseAnotherGame}
            />
          </motion.div>
        )}

        {/* Playing Screen - Travel Game */}
        {phase === 'playing' && selectedGame === 'travel-adventure' && questions.length > 0 && (
          <motion.div
            key="playing-travel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <TravelGame
              questions={questions}
              onComplete={handleGameComplete}
              onExit={handleChooseAnotherGame}
            />
          </motion.div>
        )}

        {/* Playing Screen - Cooking Game */}
        {phase === 'playing' && selectedGame === 'cooking-recipe' && questions.length > 0 && (
          <motion.div
            key="playing-cooking"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <CookingGame
              questions={questions}
              onComplete={handleGameComplete}
              onExit={handleChooseAnotherGame}
            />
          </motion.div>
        )}

        {/* Finished Screen */}
        {phase === 'finished' && (
          <motion.div
            key="finished"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className={styles.finishedScreen}
          >
            <motion.div
              className={`${styles.finishedIcon} ${gameResult === 'won' ? styles.won : styles.lost}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
            >
              {gameResult === 'won' ? <Trophy size={48} /> : <Frown size={48} />}
            </motion.div>

            <div className={styles.finishedEmoji}>
              {getMessage()?.emoji}
            </div>

            <h2 className={styles.finishedTitle}>
              {getMessage()?.title}
            </h2>
            <p className={styles.finishedSubtitle}>
              {getMessage()?.subtitle}
            </p>

            <div className={styles.finishedStats}>
              <div className={styles.statItem}>
                <div className={styles.statValue}>{finalStats.score}</div>
                <div className={styles.statLabel}>Правильных</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statValue}>{finalStats.errors}</div>
                <div className={styles.statLabel}>Ошибок</div>
              </div>
            </div>

            <div className={styles.finishedActions}>
              {gameResult === 'lost' && (
                <Button onClick={handlePlayAgain} icon={<RotateCcw size={18} />}>
                  Попробовать снова
                </Button>
              )}
              <Button
                variant={gameResult === 'won' ? 'primary' : 'secondary'}
                onClick={handleFinish}
                icon={<ArrowRight size={18} />}
                iconPosition="right"
              >
                {gameResult === 'won' ? 'Продолжить урок' : 'Выбрать другую игру'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default TopicMiniGames;
