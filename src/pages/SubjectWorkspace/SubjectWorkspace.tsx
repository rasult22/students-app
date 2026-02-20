import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Search,
  ClipboardList,
  Map,
  RotateCcw,
  Trophy,
  Sparkles,
} from 'lucide-react';
import { getSubjectById } from '../../data/subjects';
import { useAppStore } from '../../stores/appStore';
import { KnowledgeMap } from '../../components/KnowledgeMap';
import { DiagnosticTest } from '../../components/DiagnosticTest';
import { LearningPlan } from '../../components/LearningPlan';
import { ReviewSession } from '../../components/ReviewSession';
import { FinalTest } from '../../components/FinalTest';
import { CourseWrapped } from '../../components/CourseWrapped';
import { Button, Card, Icon } from '../../components/ui';
import { PageTransition } from '../../components/layout';
import styles from './SubjectWorkspace.module.css';

type Tab = 'overview' | 'diagnostic' | 'learning' | 'review' | 'map' | 'final-test';

export function SubjectWorkspace() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const { knowledgeStates, setCurrentSubject, canTakeFinalTest, getFinalTestHistory, getWrapped } = useAppStore();

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [showWrapped, setShowWrapped] = useState(false);
  const [lastFinalTestScore, setLastFinalTestScore] = useState<number>(0);

  const subject = subjectId ? getSubjectById(subjectId) : null;

  useEffect(() => {
    if (subjectId) {
      setCurrentSubject(subjectId);
    }
    return () => setCurrentSubject(null);
  }, [subjectId, setCurrentSubject]);

  if (!subject) {
    return (
      <PageTransition>
        <div className={styles.notFound}>
          <h2>Предмет не найден</h2>
          <Button onClick={() => navigate('/subjects')}>К списку предметов</Button>
        </div>
      </PageTransition>
    );
  }

  // Calculate overall progress
  const totalTopics = subject.sections.reduce(
    (acc, section) => acc + section.topics.length,
    0
  );
  const studiedTopics = subject.sections.reduce((acc, section) => {
    return (
      acc +
      section.topics.filter((topic) => {
        const state = knowledgeStates[topic.id];
        return state && state.attempts > 0;
      }).length
    );
  }, 0);

  const hasDiagnosticData = studiedTopics > 0;

  // Проверяем доступность финального теста
  const allTopicIds = useMemo(
    () => subject.sections.flatMap((section) => section.topics.map((t) => t.id)),
    [subject.sections]
  );
  const canTakeFinal = canTakeFinalTest(subject.id, allTopicIds);
  const finalTestHistory = getFinalTestHistory(subject.id);
  const existingWrapped = getWrapped(subject.id);

  const tabs: { id: Tab; label: string; icon: React.ReactNode; disabled?: boolean; tooltip?: string }[] = [
    { id: 'overview', label: 'Обзор', icon: <LayoutDashboard size={18} /> },
    { id: 'diagnostic', label: 'Диагностика', icon: <Search size={18} /> },
    { id: 'learning', label: 'Учебный план', icon: <ClipboardList size={18} /> },
    { id: 'review', label: 'Повторение', icon: <RotateCcw size={18} /> },
    { id: 'map', label: 'Карта знаний', icon: <Map size={18} /> },
    {
      id: 'final-test',
      label: 'Финальный тест',
      icon: <Trophy size={18} />,
      disabled: !canTakeFinal,
      tooltip: !canTakeFinal ? 'Изучите все темы' : undefined,
    },
  ];

  const progressPercent = Math.round((studiedTopics / totalTopics) * 100);

  return (
    <PageTransition>
      <div className={styles.container}>
        {/* Header - только название курса и прогресс */}
        <header className={styles.header}>
          <h1 className={styles.title}>{subject.name}</h1>
          {hasDiagnosticData && (
            <div className={styles.headerProgress}>
              <span className={styles.headerProgressValue}>{progressPercent}%</span>
              <span className={styles.headerProgressLabel}>изучено</span>
            </div>
          )}
        </header>

        {/* Tabs */}
        <nav className={styles.tabs}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''} ${tab.disabled ? styles.disabledTab : ''}`}
              onClick={() => !tab.disabled && setActiveTab(tab.id)}
              disabled={tab.disabled}
              title={tab.tooltip}
            >
              <span className={styles.tabIcon}>{tab.icon}</span>
              <span className={styles.tabLabel}>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className={styles.content}>
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={styles.overviewGrid}
              >
                {/* Subject info card */}
                <Card padding="lg" className={styles.subjectInfoCard}>
                  <div className={styles.subjectHeader}>
                    <div
                      className={styles.subjectIcon}
                      style={{ '--subject-color': subject.color } as React.CSSProperties}
                    >
                      <Icon name={subject.icon} size={32} />
                    </div>
                    <div className={styles.subjectInfo}>
                      <p className={styles.subjectDescription}>{subject.description}</p>
                    </div>
                  </div>

                  <div className={styles.actionSection}>
                    <p className={styles.actionDescription}>
                      {hasDiagnosticData
                        ? 'Продолжите изучение по персональному плану или пройдите диагностику заново.'
                        : 'Пройдите диагностику, чтобы мы определили ваш текущий уровень знаний и составили персональный план.'}
                    </p>
                    <div className={styles.actionButtons}>
                      <Button
                        onClick={() => setActiveTab('diagnostic')}
                        icon={<Search size={18} />}
                      >
                        {hasDiagnosticData ? 'Повторить диагностику' : 'Пройти диагностику'}
                      </Button>
                      {hasDiagnosticData && (
                        <Button
                          variant="secondary"
                          onClick={() => setActiveTab('learning')}
                          icon={<ClipboardList size={18} />}
                        >
                          Продолжить обучение
                        </Button>
                      )}
                      {canTakeFinal && (
                        <Button
                          variant="secondary"
                          onClick={() => setActiveTab('final-test')}
                          icon={<Trophy size={18} />}
                        >
                          Финальный тест
                        </Button>
                      )}
                    </div>
                    {existingWrapped && (
                      <div style={{ marginTop: 'var(--space-4)' }}>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setLastFinalTestScore(existingWrapped.data.finalTestScore);
                            setShowWrapped(true);
                          }}
                          icon={<Sparkles size={18} />}
                        >
                          Посмотреть итоги курса
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Sections overview */}
                <Card padding="lg" className={styles.sectionsCard}>
                  <h3 className={styles.cardTitle}>Разделы курса</h3>
                  <div className={styles.sectionsList}>
                    {subject.sections.map((section, index) => {
                      const sectionTopics = section.topics.length;
                      const studiedSectionTopics = section.topics.filter((t) => {
                        const state = knowledgeStates[t.id];
                        return state && state.attempts > 0;
                      }).length;

                      return (
                        <div key={section.id} className={styles.sectionItem}>
                          <div className={styles.sectionNumber}>{index + 1}</div>
                          <div className={styles.sectionInfo}>
                            <h4 className={styles.sectionName}>{section.name}</h4>
                            <p className={styles.sectionMeta}>
                              {sectionTopics} тем
                              {studiedSectionTopics > 0 &&
                                ` · ${studiedSectionTopics} изучено`}
                            </p>
                          </div>
                          {studiedSectionTopics > 0 && (
                            <div className={styles.sectionProgress}>
                              <div
                                className={styles.sectionProgressBar}
                                style={{
                                  width: `${(studiedSectionTopics / sectionTopics) * 100}%`,
                                  background: subject.color,
                                }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>

              </motion.div>
            )}

            {activeTab === 'diagnostic' && (
              <motion.div
                key="diagnostic"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <DiagnosticTest
                  subject={subject}
                  onComplete={() => setActiveTab('learning')}
                />
              </motion.div>
            )}

            {activeTab === 'learning' && (
              <motion.div
                key="learning"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <LearningPlan subject={subject} />
              </motion.div>
            )}

            {activeTab === 'review' && (
              <motion.div
                key="review"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <ReviewSession subject={subject} />
              </motion.div>
            )}

            {activeTab === 'map' && (
              <motion.div
                key="map"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={styles.fullMapContainer}
              >
                <KnowledgeMap subject={subject} />
              </motion.div>
            )}

            {activeTab === 'final-test' && (
              <motion.div
                key="final-test"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <FinalTest
                  subject={subject}
                  onComplete={() => setActiveTab('overview')}
                  onShowWrapped={() => {
                    // Получаем последний результат теста
                    const history = getFinalTestHistory(subject.id);
                    const lastAttempt = history?.attempts[history.attempts.length - 1];
                    setLastFinalTestScore(lastAttempt?.score || 0);
                    setShowWrapped(true);
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Course Wrapped overlay */}
        {showWrapped && (
          <CourseWrapped
            subject={subject}
            finalTestScore={lastFinalTestScore}
            onClose={() => setShowWrapped(false)}
          />
        )}
      </div>
    </PageTransition>
  );
}
