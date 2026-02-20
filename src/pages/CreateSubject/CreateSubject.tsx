import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { SubjectUploader, type UploadedContent } from '../../components/SubjectUploader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { PageTransition } from '../../components/layout/PageTransition';
import { useAppStore } from '../../stores/appStore';
import { generateSubjectStructure } from '../../services/generators/structureGenerator';
import {
  extractTextFromPDF,
  extractTextFromURL,
  normalizeText,
} from '../../services/contentExtractor';
import styles from './CreateSubject.module.css';

export function CreateSubject() {
  const navigate = useNavigate();
  const addCustomSubject = useAppStore((state) => state.addCustomSubject);

  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = useCallback(
    async (courseName: string, content: UploadedContent) => {
      setIsLoading(true);
      setError('');
      setProgress('');

      try {
        let rawText: string;

        // Извлекаем текст из источника
        switch (content.type) {
          case 'text':
            setProgress('Подготовка текста...');
            rawText = normalizeText(content.content as string);
            break;

          case 'pdf':
            setProgress('Извлечение текста из PDF...');
            rawText = await extractTextFromPDF(content.content as File, (current, total) => {
              setProgress(`Обработка страницы ${current} из ${total}...`);
            });
            break;

          case 'url':
            setProgress('Загрузка страницы...');
            rawText = await extractTextFromURL(content.content as string);
            break;
        }

        // Генерируем структуру курса
        setProgress('Анализ материала с помощью AI...');
        const subject = await generateSubjectStructure(rawText, {
          courseName,
          onProgress: setProgress,
        });

        // Добавляем курс в store
        addCustomSubject(subject);

        // Переходим на страницу курса
        navigate(`/subjects/${subject.id}`);
      } catch (err) {
        console.error('Failed to create subject:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Произошла ошибка при создании курса. Попробуйте ещё раз.'
        );
      } finally {
        setIsLoading(false);
        setProgress('');
      }
    },
    [addCustomSubject, navigate]
  );

  return (
    <PageTransition>
      <div className={styles.page}>
        <div className={styles.container}>
          {/* Header */}
          <div className={styles.header}>
            <Button
              variant="ghost"
              size="sm"
              icon={<ArrowLeft size={18} />}
              onClick={() => navigate('/subjects')}
            >
              Назад
            </Button>
          </div>

          {/* Main content */}
          <motion.div
            className={styles.content}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className={styles.titleSection}>
              <div className={styles.iconWrapper}>
                <Sparkles size={32} />
              </div>
              <h1 className={styles.title}>Создать курс</h1>
              <p className={styles.subtitle}>
                Загрузите учебные материалы, и AI создаст структурированный курс для изучения
              </p>
            </div>

            <Card variant="elevated" padding="lg" className={styles.uploaderCard}>
              <SubjectUploader
                onSubmit={handleSubmit}
                isLoading={isLoading}
                progress={progress}
                error={error}
              />
            </Card>

            {/* Info section */}
            <div className={styles.infoSection}>
              <h3 className={styles.infoTitle}>Как это работает?</h3>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoNumber}>1</span>
                  <div>
                    <strong>Загрузите материал</strong>
                    <p>Текст, PDF файл или ссылку на веб-страницу с учебным контентом</p>
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoNumber}>2</span>
                  <div>
                    <strong>AI анализирует</strong>
                    <p>Искусственный интеллект выделит ключевые темы и создаст структуру</p>
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoNumber}>3</span>
                  <div>
                    <strong>Начните обучение</strong>
                    <p>Получите готовый курс с разделами, темами и оценкой сложности</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
