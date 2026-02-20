import { useParams, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { TopicLesson } from '../../components/TopicLesson';
import { useAppStore } from '../../stores/appStore';
import { getSubjectById } from '../../data/subjects';
import { generateTopicLesson } from '../../services/generators';
import { Button } from '../../components/ui';
import { BookOpen, Sparkles, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import styles from './TopicLessonPage.module.css';

type GenerationStatus = 'idle' | 'generating' | 'success' | 'error';

export function TopicLessonPage() {
  const { subjectId, topicId } = useParams<{ subjectId: string; topicId: string }>();
  const navigate = useNavigate();
  const { generatedLessons, setGeneratedLesson } = useAppStore();

  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>('idle');
  const [generationStep, setGenerationStep] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Find the topic and its parent section
  const { topic, section, subject } = useMemo(() => {
    if (!subjectId) return { topic: null, section: null, subject: null };

    const subject = getSubjectById(subjectId);
    if (!subject) return { topic: null, section: null, subject: null };

    for (const section of subject.sections) {
      const topic = section.topics.find((t) => t.id === topicId);
      if (topic) {
        return { topic, section, subject };
      }
    }

    return { topic: null, section: null, subject: null };
  }, [subjectId, topicId]);

  // Get generated lesson
  const lesson = topicId ? generatedLessons[topicId] : undefined;

  const handleBack = () => {
    navigate(`/subjects/${subjectId}`);
  };

  const handleGenerate = async () => {
    if (!topic || !section || !subject) return;

    setGenerationStatus('generating');
    setErrorMessage('');

    try {
      // Step 1: Preparing
      setGenerationStep('Подготовка к генерации...');
      await sleep(500);

      // Step 2: Generating theory
      setGenerationStep('Генерация теории и ключевых тезисов...');

      const generatedLesson = await generateTopicLesson(
        topic,
        section.name,
        subject.name,
        subject.id
      );

      // Step 3: Saving
      setGenerationStep('Сохранение урока...');
      await sleep(300);

      // Save to store
      setGeneratedLesson(topic.id, generatedLesson);

      setGenerationStatus('success');
      setGenerationStep('Урок успешно сгенерирован!');

      // Auto-transition to lesson view after short delay
      await sleep(1500);

    } catch (error) {
      console.error('Generation error:', error);
      setGenerationStatus('error');

      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          setErrorMessage('API ключ не настроен. Добавьте VITE_OPENAI_API_KEY в .env файл.');
        } else if (error.message.includes('rate_limit') || error.message.includes('429')) {
          setErrorMessage('Превышен лимит запросов. Попробуйте через минуту.');
        } else if (error.message.includes('insufficient_quota')) {
          setErrorMessage('Закончился лимит API. Проверьте баланс OpenAI.');
        } else {
          setErrorMessage(error.message || 'Произошла ошибка при генерации');
        }
      } else {
        setErrorMessage('Произошла неизвестная ошибка');
      }
    }
  };

  if (!topic || !section || !subject) {
    return (
      <div className={styles.notFound}>
        <h2>Тема не найдена</h2>
        <p>Возможно, она была удалена или URL неверный.</p>
        <Button onClick={() => navigate('/subjects')}>К списку предметов</Button>
      </div>
    );
  }

  // Show lesson if available
  if (lesson && generationStatus !== 'generating') {
    return (
      <TopicLesson
        lesson={lesson}
        topic={topic}
        sectionName={section.name}
        subjectName={subject.name}
        onBack={handleBack}
      />
    );
  }

  // Generation in progress
  if (generationStatus === 'generating') {
    return (
      <div className={styles.noLesson}>
        <div className={styles.noLessonContent}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 size={64} className={styles.loadingIcon} />
          </motion.div>
          <h2 className={styles.noLessonTitle}>Генерация урока...</h2>
          <p className={styles.noLessonDescription}>{generationStep}</p>
          <div className={styles.progressBar}>
            <motion.div
              className={styles.progressFill}
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 30, ease: 'linear' }}
            />
          </div>
          <p className={styles.progressHint}>
            Это может занять 15-30 секунд
          </p>
        </div>
      </div>
    );
  }

  // Success state (brief)
  if (generationStatus === 'success') {
    return (
      <div className={styles.noLesson}>
        <div className={styles.noLessonContent}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <CheckCircle2 size={64} className={styles.successIcon} />
          </motion.div>
          <h2 className={styles.noLessonTitle}>Готово!</h2>
          <p className={styles.noLessonDescription}>{generationStep}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (generationStatus === 'error') {
    return (
      <div className={styles.noLesson}>
        <div className={styles.noLessonContent}>
          <AlertCircle size={64} className={styles.errorIcon} />
          <h2 className={styles.noLessonTitle}>Ошибка генерации</h2>
          <p className={styles.noLessonDescription}>{errorMessage}</p>
          <div className={styles.noLessonActions}>
            <Button onClick={handleBack} variant="secondary">
              Назад
            </Button>
            <Button onClick={handleGenerate}>
              <Sparkles size={18} />
              Попробовать снова
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Initial state - no lesson
  return (
    <div className={styles.noLesson}>
      <div className={styles.noLessonContent}>
        <BookOpen size={64} className={styles.noLessonIcon} />
        <h2 className={styles.noLessonTitle}>Урок ещё не сгенерирован</h2>
        <p className={styles.noLessonDescription}>
          Для темы "{topic.name}" пока нет учебного контента.
          Вы можете сгенерировать его с помощью AI.
        </p>
        <div className={styles.noLessonActions}>
          <Button onClick={handleBack} variant="secondary">
            Назад
          </Button>
          <Button onClick={handleGenerate}>
            <Sparkles size={18} />
            Сгенерировать урок
          </Button>
        </div>
      </div>
    </div>
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
