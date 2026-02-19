import { useRef, useMemo, useEffect } from 'react';
import cytoscape from 'cytoscape';
import type { Core, LayoutOptions, ElementDefinition } from 'cytoscape';
import type { Subject } from '../../types';
import { useAppStore } from '../../stores/appStore';
import styles from './KnowledgeMap.module.css';

interface KnowledgeMapProps {
  subject: Subject;
  mini?: boolean;
}

export function KnowledgeMap({ subject, mini = false }: KnowledgeMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const { knowledgeStates } = useAppStore();

  // Build graph elements
  const elements = useMemo<ElementDefinition[]>(() => {
    const nodes: ElementDefinition[] = [];
    const edges: ElementDefinition[] = [];

    // Subject node (center)
    nodes.push({
      data: {
        id: subject.id,
        label: subject.name,
        type: 'subject',
        mastery: 'subject',
      },
    });

    // Section and topic nodes
    subject.sections.forEach((section) => {
      // Calculate section mastery
      let sectionScore = 0;
      let topicsWithData = 0;

      section.topics.forEach((topic) => {
        const state = knowledgeStates[topic.id];
        if (state && state.attempts > 0) {
          sectionScore += state.score;
          topicsWithData++;
        }
      });

      const avgSectionScore = topicsWithData > 0 ? sectionScore / topicsWithData : 0;
      let sectionMastery = 'unknown';
      if (topicsWithData > 0) {
        if (avgSectionScore >= 80) sectionMastery = 'mastered';
        else if (avgSectionScore >= 50) sectionMastery = 'learning';
        else sectionMastery = 'struggling';
      }

      // Section node
      nodes.push({
        data: {
          id: section.id,
          label: section.name,
          type: 'section',
          mastery: sectionMastery,
          score: Math.round(avgSectionScore),
        },
      });

      // Edge: subject -> section
      edges.push({
        data: {
          id: `${subject.id}-${section.id}`,
          source: subject.id,
          target: section.id,
          type: 'contains',
        },
      });

      // Topic nodes
      section.topics.forEach((topic) => {
        const state = knowledgeStates[topic.id];
        let mastery = 'unknown';
        let score = 0;

        if (state && state.attempts > 0) {
          score = state.score;
          if (state.score >= 80) mastery = 'mastered';
          else if (state.score >= 50) mastery = 'learning';
          else mastery = 'struggling';
        }

        nodes.push({
          data: {
            id: topic.id,
            label: topic.name,
            type: 'topic',
            mastery,
            score,
            difficulty: topic.difficulty,
          },
        });

        // Edge: section -> topic
        edges.push({
          data: {
            id: `${section.id}-${topic.id}`,
            source: section.id,
            target: topic.id,
            type: 'contains',
          },
        });
      });
    });

    return [...nodes, ...edges];
  }, [subject, knowledgeStates]);

  // Cytoscape stylesheet
  const stylesheet = [
    // Subject node (center)
    {
      selector: 'node[type="subject"]',
      style: {
        'background-color': subject.color,
        'border-width': 3,
        'border-color': subject.color,
        label: 'data(label)',
        'font-family': 'Outfit, sans-serif',
        'font-size': mini ? 12 : 16,
        'font-weight': 600,
        color: '#e6edf3',
        'text-valign': 'center',
        'text-halign': 'center',
        'text-wrap': 'wrap',
        'text-max-width': mini ? 60 : 100,
        width: mini ? 50 : 80,
        height: mini ? 50 : 80,
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
        'font-size': mini ? 10 : 13,
        'font-weight': 500,
        color: '#8b949e',
        'text-valign': 'bottom',
        'text-halign': 'center',
        'text-margin-y': 8,
        'text-wrap': 'wrap',
        'text-max-width': mini ? 50 : 80,
        width: mini ? 35 : 55,
        height: mini ? 35 : 55,
      },
    },
    // Topic nodes
    {
      selector: 'node[type="topic"]',
      style: {
        'background-color': '#161b22',
        'border-width': 2,
        'border-color': '#242b36',
        label: mini ? '' : 'data(label)',
        'font-family': 'Outfit, sans-serif',
        'font-size': 10,
        color: '#6e7681',
        'text-valign': 'bottom',
        'text-halign': 'center',
        'text-margin-y': 6,
        'text-wrap': 'wrap',
        'text-max-width': 70,
        width: mini ? 18 : 30,
        height: mini ? 18 : 30,
      },
    },
    // Mastery states
    {
      selector: 'node[mastery="mastered"]',
      style: {
        'border-color': '#10b981',
        'background-color': 'rgba(16, 185, 129, 0.2)',
      },
    },
    {
      selector: 'node[mastery="learning"]',
      style: {
        'border-color': '#3b82f6',
        'background-color': 'rgba(59, 130, 246, 0.2)',
      },
    },
    {
      selector: 'node[mastery="struggling"]',
      style: {
        'border-color': '#f59e0b',
        'background-color': 'rgba(245, 158, 11, 0.2)',
      },
    },
    {
      selector: 'node[mastery="unknown"]',
      style: {
        'border-color': '#484f58',
        'background-color': '#161b22',
      },
    },
    // Edges
    {
      selector: 'edge',
      style: {
        width: mini ? 1 : 2,
        'line-color': '#242b36',
        'curve-style': 'bezier',
        'target-arrow-shape': 'none',
        opacity: 0.6,
      },
    },
  ];

  // Layout configuration - use cose without animation to avoid notify error
  const layout: LayoutOptions = {
    name: 'cose',
    animate: false,
    fit: true,
    padding: mini ? 20 : 50,
    nodeRepulsion: () => mini ? 3000 : 8000,
    idealEdgeLength: () => mini ? 40 : 80,
    edgeElasticity: () => mini ? 50 : 100,
    gravity: 0.25,
    numIter: 1000,
    randomize: false,
  };

  // Initialize Cytoscape manually
  useEffect(() => {
    if (!containerRef.current || elements.length === 0) return;

    // Destroy previous instance
    if (cyRef.current) {
      cyRef.current.destroy();
      cyRef.current = null;
    }

    // Create new instance without layout in constructor
    const cy = cytoscape({
      container: containerRef.current,
      elements: elements,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      style: stylesheet as any,
      wheelSensitivity: 0.3,
      boxSelectionEnabled: false,
      autounselectify: true,
      userPanningEnabled: !mini,
      userZoomingEnabled: !mini,
    });

    cyRef.current = cy;

    // Run layout separately
    const layoutInstance = cy.layout(layout);
    layoutInstance.run();

    // Add hover effects
    cy.on('mouseover', 'node', (e) => {
      const node = e.target;
      node.style('transform', 'scale(1.1)');
      node.connectedEdges().style('opacity', 1);
    });

    cy.on('mouseout', 'node', (e) => {
      const node = e.target;
      node.style('transform', 'scale(1)');
      node.connectedEdges().style('opacity', 0.6);
    });

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [elements, stylesheet, layout, mini]);

  return (
    <div className={`${styles.container} ${mini ? styles.mini : ''}`}>
      <div ref={containerRef} className={styles.cytoscape} />

      {/* Legend */}
      {!mini && (
        <div className={styles.legend}>
          <div className={styles.legendTitle}>Уровень освоения</div>
          <div className={styles.legendItems}>
            <div className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.mastered}`} />
              <span>Освоено</span>
            </div>
            <div className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.learning}`} />
              <span>В процессе</span>
            </div>
            <div className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.struggling}`} />
              <span>Требует внимания</span>
            </div>
            <div className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.unknown}`} />
              <span>Не изучено</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
