import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Clock } from 'lucide-react';
import { subjects } from '../../data/subjects';
import { useAppStore } from '../../stores/appStore';
import { Card, Button, Icon } from '../../components/ui';
import { PageTransition } from '../../components/layout';
import styles from './SubjectsList.module.css';

export function SubjectsList() {
  const navigate = useNavigate();
  const { user, knowledgeStates } = useAppStore();

  const getSubjectProgress = (subjectId: string) => {
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) return { score: 0, topicsStudied: 0, totalTopics: 0 };

    let totalTopics = 0;
    let topicsStudied = 0;
    let totalScore = 0;

    subject.sections.forEach((section) => {
      section.topics.forEach((topic) => {
        totalTopics++;
        const state = knowledgeStates[topic.id];
        if (state && state.attempts > 0) {
          topicsStudied++;
          totalScore += state.score;
        }
      });
    });

    return {
      score: topicsStudied > 0 ? Math.round(totalScore / topicsStudied) : 0,
      topicsStudied,
      totalTopics,
    };
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <PageTransition>
      <div className={styles.container}>
        <header className={styles.header}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className={styles.title}>
              Добро пожаловать, <span className="text-gradient">{user?.name}</span>
            </h1>
            <p className={styles.subtitle}>
              Выбери предмет для изучения. Мы определим твой уровень и составим
              персональный план обучения.
            </p>
          </motion.div>
        </header>

        <motion.div
          className={styles.grid}
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {subjects.map((subject) => {
            const progress = getSubjectProgress(subject.id);
            const hasProgress = progress.topicsStudied > 0;

            return (
              <motion.div key={subject.id} variants={itemVariants}>
                <Card
                  variant={hasProgress ? 'glow' : 'default'}
                  padding="none"
                  interactive
                  className={styles.subjectCard}
                  onClick={() => navigate(`/subjects/${subject.id}`)}
                  style={{ '--subject-color': subject.color } as React.CSSProperties}
                >
                  <div className={styles.cardContent}>
                    <div className={styles.iconWrapper}>
                      <span className={styles.icon}>
                        <Icon name={subject.icon} size={32} />
                      </span>
                      <div
                        className={styles.iconGlow}
                        style={{ background: subject.color }}
                      />
                    </div>

                    <div className={styles.info}>
                      <h3 className={styles.subjectName}>{subject.name}</h3>
                      <p className={styles.subjectDescription}>
                        {subject.description}
                      </p>

                      <div className={styles.meta}>
                        <span className={styles.metaItem}>
                          <BookOpen size={14} className={styles.metaIcon} />
                          {subject.sections.length} разделов
                        </span>
                        <span className={styles.metaItem}>
                          <Clock size={14} className={styles.metaIcon} />
                          ~{subject.estimatedHours} часов
                        </span>
                      </div>
                    </div>

                    {hasProgress && (
                      <div className={styles.progressSection}>
                        <div className={styles.progressBar}>
                          <motion.div
                            className={styles.progressFill}
                            initial={{ width: 0 }}
                            animate={{
                              width: `${(progress.topicsStudied / progress.totalTopics) * 100}%`,
                            }}
                            transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            style={{ background: subject.color }}
                          />
                        </div>
                        <div className={styles.progressText}>
                          <span>
                            {progress.topicsStudied} / {progress.totalTopics} тем
                          </span>
                          <span className={styles.scoreLabel}>
                            {progress.score}%
                          </span>
                        </div>
                      </div>
                    )}

                    <Button
                      variant={hasProgress ? 'primary' : 'secondary'}
                      fullWidth
                      className={styles.cardButton}
                    >
                      {hasProgress ? 'Продолжить' : 'Начать изучение'}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </PageTransition>
  );
}
