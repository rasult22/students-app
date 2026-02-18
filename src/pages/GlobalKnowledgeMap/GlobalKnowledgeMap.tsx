import { useRef, useMemo, useEffect, useCallback } from 'react';
import cytoscape from 'cytoscape';
import type { Core, LayoutOptions, ElementDefinition } from 'cytoscape';
import { motion } from 'framer-motion';
import { subjects } from '../../data/subjects';
import { useAppStore } from '../../stores/appStore';
import { PageTransition } from '../../components/layout';
import { Card } from '../../components/ui';
import styles from './GlobalKnowledgeMap.module.css';

export function GlobalKnowledgeMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const { knowledgeStates, user } = useAppStore();

  // Build global graph
  const elements = useMemo<ElementDefinition[]>(() => {
    const nodes: ElementDefinition[] = [];
    const edges: ElementDefinition[] = [];

    // Central "knowledge" node
    nodes.push({
      data: {
        id: 'center',
        label: user?.name || 'Знания',
        type: 'center',
      },
    });

    subjects.forEach((subject) => {
      // Calculate subject progress
      let totalTopics = 0;
      let studiedTopics = 0;
      let totalScore = 0;

      subject.sections.forEach((section) => {
        section.topics.forEach((topic) => {
          totalTopics++;
          const state = knowledgeStates[topic.id];
          if (state && state.attempts > 0) {
            studiedTopics++;
            totalScore += state.score;
          }
        });
      });

      const avgScore = studiedTopics > 0 ? totalScore / studiedTopics : 0;
      let mastery = 'unknown';
      if (studiedTopics > 0) {
        if (avgScore >= 80) mastery = 'mastered';
        else if (avgScore >= 50) mastery = 'learning';
        else mastery = 'struggling';
      }

      // Subject node
      nodes.push({
        data: {
          id: subject.id,
          label: subject.name,
          type: 'subject',
          mastery,
          score: Math.round(avgScore),
          progress: totalTopics > 0 ? Math.round((studiedTopics / totalTopics) * 100) : 0,
          color: subject.color,
          icon: subject.icon,
        },
      });

      // Edge from center to subject
      edges.push({
        data: {
          id: `center-${subject.id}`,
          source: 'center',
          target: subject.id,
        },
      });

      // Section nodes for subjects with progress
      if (studiedTopics > 0) {
        subject.sections.forEach((section) => {
          let sectionStudied = 0;
          let sectionScore = 0;

          section.topics.forEach((topic) => {
            const state = knowledgeStates[topic.id];
            if (state && state.attempts > 0) {
              sectionStudied++;
              sectionScore += state.score;
            }
          });

          if (sectionStudied > 0) {
            const avgSectionScore = sectionScore / sectionStudied;
            let sectionMastery = 'unknown';
            if (avgSectionScore >= 80) sectionMastery = 'mastered';
            else if (avgSectionScore >= 50) sectionMastery = 'learning';
            else sectionMastery = 'struggling';

            nodes.push({
              data: {
                id: section.id,
                label: section.name,
                type: 'section',
                mastery: sectionMastery,
                score: Math.round(avgSectionScore),
                parentColor: subject.color,
              },
            });

            edges.push({
              data: {
                id: `${subject.id}-${section.id}`,
                source: subject.id,
                target: section.id,
              },
            });
          }
        });
      }
    });

    return [...nodes, ...edges];
  }, [knowledgeStates, user]);

  // Stats calculations
  const stats = useMemo(() => {
    let totalTopics = 0;
    let studiedTopics = 0;
    let masteredTopics = 0;

    subjects.forEach((subject) => {
      subject.sections.forEach((section) => {
        section.topics.forEach((topic) => {
          totalTopics++;
          const state = knowledgeStates[topic.id];
          if (state && state.attempts > 0) {
            studiedTopics++;
            if (state.score >= 80) masteredTopics++;
          }
        });
      });
    });

    return {
      totalSubjects: subjects.length,
      totalTopics,
      studiedTopics,
      masteredTopics,
      overallProgress: totalTopics > 0 ? Math.round((studiedTopics / totalTopics) * 100) : 0,
    };
  }, [knowledgeStates]);

  const stylesheet = [
    // Center node
    {
      selector: 'node[type="center"]',
      style: {
        'background-color': '#00d4aa',
        'border-width': 4,
        'border-color': '#00ffcc',
        label: 'data(label)',
        'font-family': 'Outfit, sans-serif',
        'font-size': 18,
        'font-weight': 700,
        color: '#e6edf3',
        'text-valign': 'center',
        'text-halign': 'center',
        width: 100,
        height: 100,
      },
    },
    // Subject nodes
    {
      selector: 'node[type="subject"]',
      style: {
        'background-color': 'data(color)',
        'border-width': 3,
        'border-color': 'data(color)',
        label: 'data(label)',
        'font-family': 'Outfit, sans-serif',
        'font-size': 14,
        'font-weight': 600,
        color: '#e6edf3',
        'text-valign': 'bottom',
        'text-halign': 'center',
        'text-margin-y': 10,
        'text-wrap': 'wrap',
        'text-max-width': 100,
        width: 70,
        height: 70,
      },
    },
    // Section nodes
    {
      selector: 'node[type="section"]',
      style: {
        'background-color': '#1c222b',
        'border-width': 2,
        'border-color': '#484f58',
        label: 'data(label)',
        'font-family': 'Outfit, sans-serif',
        'font-size': 11,
        color: '#8b949e',
        'text-valign': 'bottom',
        'text-halign': 'center',
        'text-margin-y': 8,
        'text-wrap': 'wrap',
        'text-max-width': 70,
        width: 40,
        height: 40,
      },
    },
    // Mastery states
    {
      selector: 'node[mastery="mastered"]',
      style: {
        'border-color': '#10b981',
      },
    },
    {
      selector: 'node[mastery="learning"]',
      style: {
        'border-color': '#3b82f6',
      },
    },
    {
      selector: 'node[mastery="struggling"]',
      style: {
        'border-color': '#f59e0b',
      },
    },
    // Edges
    {
      selector: 'edge',
      style: {
        width: 2,
        'line-color': '#242b36',
        'curve-style': 'bezier',
        opacity: 0.5,
      },
    },
  ];

  const layout: LayoutOptions = useMemo(() => ({
    name: 'concentric',
    fit: true,
    padding: 50,
    startAngle: 3 / 2 * Math.PI,
    sweep: undefined,
    clockwise: true,
    equidistant: false,
    minNodeSpacing: 50,
    avoidOverlap: true,
    concentric: (node: cytoscape.NodeSingular) => {
      const type = node.data('type');
      if (type === 'center') return 3;
      if (type === 'subject') return 2;
      return 1;
    },
    levelWidth: () => 1,
  }), []);

  // Initialize Cytoscape manually to avoid react-cytoscapejs issues
  useEffect(() => {
    if (!containerRef.current || elements.length === 0) return;

    // Destroy previous instance if exists
    if (cyRef.current) {
      cyRef.current.destroy();
      cyRef.current = null;
    }

    // Create new Cytoscape instance without layout
    const cy = cytoscape({
      container: containerRef.current,
      elements: elements,
      style: stylesheet as cytoscape.Stylesheet[],
      wheelSensitivity: 0.3,
      boxSelectionEnabled: false,
      autounselectify: true,
    });

    cyRef.current = cy;

    // Run layout after instance is ready
    const layoutInstance = cy.layout(layout);
    layoutInstance.run();

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [elements, stylesheet, layout]);

  return (
    <PageTransition>
      <div className={styles.container}>
        <header className={styles.header}>
          <motion.h1
            className={styles.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Глобальная карта <span className="text-gradient">знаний</span>
          </motion.h1>
          <motion.p
            className={styles.subtitle}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Визуализация всех твоих знаний по всем предметам
          </motion.p>
        </header>

        {/* Stats bar */}
        <motion.div
          className={styles.statsBar}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card padding="sm" className={styles.statItem}>
            <span className={styles.statValue}>{stats.totalSubjects}</span>
            <span className={styles.statLabel}>Предметов</span>
          </Card>
          <Card padding="sm" className={styles.statItem}>
            <span className={styles.statValue}>{stats.studiedTopics}</span>
            <span className={styles.statLabel}>Тем изучено</span>
          </Card>
          <Card padding="sm" className={styles.statItem}>
            <span className={styles.statValue}>{stats.masteredTopics}</span>
            <span className={styles.statLabel}>Освоено</span>
          </Card>
          <Card padding="sm" className={styles.statItem}>
            <span className={styles.statValue}>{stats.overallProgress}%</span>
            <span className={styles.statLabel}>Прогресс</span>
          </Card>
        </motion.div>

        {/* Map */}
        <motion.div
          className={styles.mapContainer}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div ref={containerRef} className={styles.cytoscape} />

          {/* Legend */}
          <div className={styles.legend}>
            <div className={styles.legendTitle}>Уровни освоения</div>
            <div className={styles.legendItems}>
              <div className={styles.legendItem}>
                <span className={`${styles.legendDot} ${styles.mastered}`} />
                <span>Освоено (80%+)</span>
              </div>
              <div className={styles.legendItem}>
                <span className={`${styles.legendDot} ${styles.learning}`} />
                <span>В процессе (50-79%)</span>
              </div>
              <div className={styles.legendItem}>
                <span className={`${styles.legendDot} ${styles.struggling}`} />
                <span>Требует внимания (&lt;50%)</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}
