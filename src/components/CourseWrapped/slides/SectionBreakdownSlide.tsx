import { motion } from 'framer-motion';
import type { WrappedSlide, WrappedData, MasteryLevel } from '../../../types';
import styles from '../CourseWrapped.module.css';

interface SectionBreakdownSlideProps {
  slide: WrappedSlide;
  data: WrappedData;
}

export function SectionBreakdownSlide({ slide, data }: SectionBreakdownSlideProps) {
  const sections = (slide.data?.sections as { id: string; name: string; score: number; level: MasteryLevel }[]) || data.sectionScores;

  return (
    <motion.div
      className={styles.slideContent}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.h2
        className={styles.slideTitle}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        {slide.title}
      </motion.h2>

      <motion.p
        className={styles.slideSubtitle}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {slide.subtitle}
      </motion.p>

      <div className={styles.sectionBreakdown}>
        {sections.map((section, index) => (
          <motion.div
            key={section.id}
            className={styles.sectionItem}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
          >
            <div className={styles.sectionName}>{section.name}</div>
            <div className={styles.sectionBar}>
              <motion.div
                className={styles.sectionFill}
                data-level={section.level}
                initial={{ width: 0 }}
                animate={{ width: `${section.score}%` }}
                transition={{ delay: 0.6 + index * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <div className={styles.sectionScore}>{section.score}%</div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export default SectionBreakdownSlide;
