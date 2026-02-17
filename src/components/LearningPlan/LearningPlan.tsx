import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Subject, Topic, MasteryLevel } from '../../types';
import { useAppStore } from '../../stores/appStore';
import { Button, Card } from '../ui';
import styles from './LearningPlan.module.css';

interface LearningPlanProps {
  subject: Subject;
}

interface PlanTopic extends Topic {
  sectionName: string;
  mastery: MasteryLevel;
  score: number;
  isSkipped: boolean;
}

export function LearningPlan({ subject }: LearningPlanProps) {
  const { knowledgeStates, user } = useAppStore();

  // Build learning plan based on diagnostic results
  const plan = useMemo(() => {
    const topics: PlanTopic[] = [];

    subject.sections.forEach((section) => {
      section.topics.forEach((topic) => {
        const state = knowledgeStates[topic.id];
        const mastery = state?.masteryLevel || 'unknown';
        const score = state?.score || 0;

        // Skip topics that are already mastered (80%+)
        const isSkipped = mastery === 'mastered';

        topics.push({
          ...topic,
          sectionName: section.name,
          mastery,
          score,
          isSkipped,
        });
      });
    });

    // Sort: struggling first, then learning, then unknown, mastered at the end
    const priorityOrder: Record<MasteryLevel, number> = {
      struggling: 0,
      learning: 1,
      unknown: 2,
      mastered: 3,
    };

    return topics.sort((a, b) => priorityOrder[a.mastery] - priorityOrder[b.mastery]);
  }, [subject, knowledgeStates]);

  const activeTopics = plan.filter((t) => !t.isSkipped);
  const skippedTopics = plan.filter((t) => t.isSkipped);

  const totalTime = activeTopics.reduce((acc, t) => acc + t.estimatedMinutes, 0);
  const hours = Math.floor(totalTime / 60);
  const minutes = totalTime % 60;

  const getMasteryIcon = (mastery: MasteryLevel) => {
    switch (mastery) {
      case 'mastered':
        return '✓';
      case 'learning':
        return '◐';
      case 'struggling':
        return '!';
      default:
        return '○';
    }
  };

  const getMasteryLabel = (mastery: MasteryLevel) => {
    switch (mastery) {
      case 'mastered':
        return 'Освоено';
      case 'learning':
        return 'В процессе';
      case 'struggling':
        return 'Требует внимания';
      default:
        return 'Не изучено';
    }
  };

  return (
    <div className={styles.container}>
      {/* Header stats */}
      <div className={styles.statsGrid}>
        <Card padding="md" className={styles.statCard}>
          <div className={styles.statValue}>{activeTopics.length}</div>
          <div className={styles.statLabel}>Тем к изучению</div>
        </Card>
        <Card padding="md" className={styles.statCard}>
          <div className={styles.statValue}>{skippedTopics.length}</div>
          <div className={styles.statLabel}>Пропущено (уже знаешь)</div>
        </Card>
        <Card padding="md" className={styles.statCard}>
          <div className={styles.statValue}>
            {hours > 0 ? `${hours}ч ` : ''}
            {minutes}м
          </div>
          <div className={styles.statLabel}>Примерное время</div>
        </Card>
      </div>

      {/* Personalization note */}
      {user && user.interests.length > 0 && (
        <motion.div
          className={styles.personalizationNote}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <span className={styles.noteIcon}>✨</span>
          <span>
            Примеры адаптированы под твои интересы:{' '}
            {user.interests.slice(0, 3).map((i) => i.name).join(', ')}
          </span>
        </motion.div>
      )}

      {/* Active topics */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>План обучения</h3>
        <div className={styles.topicsList}>
          {activeTopics.map((topic, index) => (
            <motion.div
              key={topic.id}
              className={styles.topicCard}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className={styles.topicOrder}>{index + 1}</div>

              <div className={styles.topicContent}>
                <div className={styles.topicHeader}>
                  <h4 className={styles.topicName}>{topic.name}</h4>
                  <div
                    className={`${styles.masteryBadge} ${styles[topic.mastery]}`}
                  >
                    <span className={styles.masteryIcon}>
                      {getMasteryIcon(topic.mastery)}
                    </span>
                    <span>{getMasteryLabel(topic.mastery)}</span>
                  </div>
                </div>

                <p className={styles.topicSection}>{topic.sectionName}</p>

                <div className={styles.topicMeta}>
                  <span className={styles.metaItem}>
                    <span className={styles.metaIcon}>⏱️</span>
                    ~{topic.estimatedMinutes} мин
                  </span>
                  <span className={styles.metaItem}>
                    <span className={styles.metaIcon}>
                      {topic.difficulty === 'beginner' && '★'}
                      {topic.difficulty === 'intermediate' && '★★'}
                      {topic.difficulty === 'advanced' && '★★★'}
                    </span>
                    {topic.difficulty === 'beginner' && 'Начальный'}
                    {topic.difficulty === 'intermediate' && 'Средний'}
                    {topic.difficulty === 'advanced' && 'Продвинутый'}
                  </span>
                  {topic.score > 0 && (
                    <span className={styles.metaItem}>
                      <span className={styles.metaIcon}>📊</span>
                      {topic.score}%
                    </span>
                  )}
                </div>
              </div>

              <Button variant="secondary" size="sm" className={styles.topicButton}>
                {topic.mastery === 'unknown' ? 'Начать' : 'Продолжить'}
              </Button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Skipped topics */}
      {skippedTopics.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <span className={styles.skippedIcon}>✓</span>
            Уже освоено ({skippedTopics.length})
          </h3>
          <div className={styles.skippedList}>
            {skippedTopics.map((topic) => (
              <div key={topic.id} className={styles.skippedItem}>
                <span className={styles.skippedCheck}>✓</span>
                <span className={styles.skippedName}>{topic.name}</span>
                <span className={styles.skippedScore}>{topic.score}%</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
