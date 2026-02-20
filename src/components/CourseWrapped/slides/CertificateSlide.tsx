import { motion } from 'framer-motion';
import { Award, Download } from 'lucide-react';
import { Button } from '../../ui/Button';
import type { WrappedSlide, WrappedData } from '../../../types';
import styles from '../CourseWrapped.module.css';

interface CertificateSlideProps {
  slide: WrappedSlide;
  data: WrappedData;
  onClose: () => void;
}

export function CertificateSlide({ slide, data }: CertificateSlideProps) {
  const certData = slide.data as {
    userName: string;
    subjectName: string;
    completedAt: Date;
    grade: 'excellent' | 'good' | 'satisfactory' | 'none';
  } | undefined;

  const userName = certData?.userName || data.userName;
  const subjectName = certData?.subjectName || data.subjectName;
  const grade = certData?.grade || 'good';

  const gradeLabels: Record<string, string> = {
    excellent: 'С отличием',
    good: 'Хорошо',
    satisfactory: 'Удовлетворительно',
    none: '',
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

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

      <motion.div
        className={styles.certificatePreview}
        initial={{ opacity: 0, scale: 0.8, rotateY: -30 }}
        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
        transition={{ delay: 0.4, duration: 0.8, type: 'spring' }}
      >
        <div className={styles.certificateBadge}>
          <Award size={32} color="var(--color-void)" />
        </div>

        <div className={styles.certificateTitle}>Сертификат</div>
        <div className={styles.certificateSubject}>{subjectName}</div>
        <div className={styles.certificateName}>{userName}</div>

        {grade !== 'none' && (
          <div className={`${styles.certificateGrade} ${styles[grade]}`}>
            {gradeLabels[grade]}
          </div>
        )}

        <div
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-tertiary)',
            marginTop: 'var(--space-4)',
          }}
        >
          {formatDate(certData?.completedAt || data.completedAt)}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        style={{ marginTop: 'var(--space-6)' }}
      >
        <Button variant="secondary" size="sm" disabled>
          <Download size={16} />
          Скачать (скоро)
        </Button>
      </motion.div>
    </motion.div>
  );
}

export default CertificateSlide;
