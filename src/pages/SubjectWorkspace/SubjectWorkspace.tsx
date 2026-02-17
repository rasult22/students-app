import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getSubjectById } from '../../data/subjects';
import { useAppStore } from '../../stores/appStore';
import { KnowledgeMap } from '../../components/KnowledgeMap';
import { DiagnosticTest } from '../../components/DiagnosticTest';
import { LearningPlan } from '../../components/LearningPlan';
import { Button, Card } from '../../components/ui';
import { PageTransition } from '../../components/layout';
import styles from './SubjectWorkspace.module.css';

type Tab = 'overview' | 'diagnostic' | 'learning' | 'map';

export function SubjectWorkspace() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const { knowledgeStates, setCurrentSubject } = useAppStore();

  const [activeTab, setActiveTab] = useState<Tab>('overview');

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

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Обзор', icon: '📊' },
    { id: 'diagnostic', label: 'Диагностика', icon: '🔍' },
    { id: 'learning', label: 'Учебный план', icon: '📝' },
    { id: 'map', label: 'Карта знаний', icon: '🗺️' },
  ];

  return (
    <PageTransition>
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <button className={styles.backButton} onClick={() => navigate('/subjects')}>
            <span>←</span>
            <span>Назад к предметам</span>
          </button>

          <div className={styles.headerContent}>
            <motion.div
              className={styles.subjectIcon}
              style={{ '--subject-color': subject.color } as React.CSSProperties}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              {subject.icon}
            </motion.div>

            <div className={styles.headerInfo}>
              <motion.h1
                className={styles.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {subject.name}
              </motion.h1>
              <motion.p
                className={styles.description}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {subject.description}
              </motion.p>
            </div>

            {hasDiagnosticData && (
              <motion.div
                className={styles.progressRing}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <svg viewBox="0 0 100 100" className={styles.progressSvg}>
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="var(--color-overlay)"
                    strokeWidth="8"
                  />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke={subject.color}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
                    animate={{
                      strokeDashoffset:
                        2 * Math.PI * 45 * (1 - studiedTopics / totalTopics),
                    }}
                    transition={{ delay: 0.5, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      filter: `drop-shadow(0 0 8px ${subject.color})`,
                    }}
                  />
                </svg>
                <div className={styles.progressText}>
                  <span className={styles.progressValue}>
                    {Math.round((studiedTopics / totalTopics) * 100)}%
                  </span>
                  <span className={styles.progressLabel}>изучено</span>
                </div>
              </motion.div>
            )}
          </div>
        </header>

        {/* Tabs */}
        <nav className={styles.tabs}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className={styles.tabIcon}>{tab.icon}</span>
              <span className={styles.tabLabel}>{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div
                  className={styles.tabIndicator}
                  layoutId="tabIndicator"
                  style={{ background: subject.color }}
                />
              )}
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
                {/* Quick actions */}
                <Card variant="glow" padding="lg" className={styles.quickActions}>
                  <h3 className={styles.cardTitle}>Начните обучение</h3>
                  <p className={styles.cardDescription}>
                    {hasDiagnosticData
                      ? 'Продолжите изучение по персональному плану или пройдите диагностику заново.'
                      : 'Пройдите диагностику, чтобы мы определили ваш текущий уровень знаний и составили персональный план.'}
                  </p>
                  <div className={styles.actionButtons}>
                    <Button
                      onClick={() => setActiveTab('diagnostic')}
                      icon={<span>🔍</span>}
                    >
                      {hasDiagnosticData ? 'Повторить диагностику' : 'Пройти диагностику'}
                    </Button>
                    {hasDiagnosticData && (
                      <Button
                        variant="secondary"
                        onClick={() => setActiveTab('learning')}
                        icon={<span>📝</span>}
                      >
                        Продолжить обучение
                      </Button>
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
                        <motion.div
                          key={section.id}
                          className={styles.sectionItem}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
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
                        </motion.div>
                      );
                    })}
                  </div>
                </Card>

                {/* Mini knowledge map */}
                {hasDiagnosticData && (
                  <Card padding="none" className={styles.miniMapCard}>
                    <div className={styles.miniMapHeader}>
                      <h3 className={styles.cardTitle}>Карта знаний</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveTab('map')}
                      >
                        Открыть полностью
                      </Button>
                    </div>
                    <div className={styles.miniMapContainer}>
                      <KnowledgeMap subject={subject} mini />
                    </div>
                  </Card>
                )}
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
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  );
}
