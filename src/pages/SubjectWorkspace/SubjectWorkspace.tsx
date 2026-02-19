import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Search,
  ClipboardList,
  Map,
  RotateCcw,
} from 'lucide-react';
import { getSubjectById } from '../../data/subjects';
import { useAppStore } from '../../stores/appStore';
import { KnowledgeMap } from '../../components/KnowledgeMap';
import { DiagnosticTest } from '../../components/DiagnosticTest';
import { LearningPlan } from '../../components/LearningPlan';
import { ReviewSession } from '../../components/ReviewSession';
import { Button, Card, Icon } from '../../components/ui';
import { PageTransition } from '../../components/layout';
import styles from './SubjectWorkspace.module.css';

type Tab = 'overview' | 'diagnostic' | 'learning' | 'review' | 'map';

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

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Обзор', icon: <LayoutDashboard size={18} /> },
    { id: 'diagnostic', label: 'Диагностика', icon: <Search size={18} /> },
    { id: 'learning', label: 'Учебный план', icon: <ClipboardList size={18} /> },
    { id: 'review', label: 'Повторение', icon: <RotateCcw size={18} /> },
    { id: 'map', label: 'Карта знаний', icon: <Map size={18} /> },
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
              className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
              onClick={() => setActiveTab(tab.id)}
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
                    </div>
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
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  );
}
