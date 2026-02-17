import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../stores/appStore';
import { availableInterests, interestCategories } from '../../data/interests';
import { Button, Input } from '../../components/ui';
import { PageTransition } from '../../components/layout';
import type { Interest } from '../../types';
import styles from './Onboarding.module.css';

type Step = 'welcome' | 'name' | 'interests';

export function Onboarding() {
  const navigate = useNavigate();
  const { setUser } = useAppStore();

  const [step, setStep] = useState<Step>('welcome');
  const [name, setName] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<Interest[]>([]);
  const [nameError, setNameError] = useState('');

  const handleNameSubmit = () => {
    if (name.trim().length < 2) {
      setNameError('Введите имя (минимум 2 символа)');
      return;
    }
    setNameError('');
    setStep('interests');
  };

  const toggleInterest = (interest: Interest) => {
    setSelectedInterests((prev) => {
      const exists = prev.find((i) => i.id === interest.id);
      if (exists) {
        return prev.filter((i) => i.id !== interest.id);
      }
      if (prev.length >= 5) {
        return prev;
      }
      return [...prev, interest];
    });
  };

  const handleComplete = () => {
    setUser(name.trim(), selectedInterests);
    navigate('/subjects');
  };

  const categories = Object.entries(interestCategories);

  return (
    <PageTransition>
      <div className={styles.container}>
        <AnimatePresence mode="wait">
          {step === 'welcome' && (
            <motion.div
              key="welcome"
              className={styles.welcomeStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className={styles.starField}>
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className={styles.star}
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: [0.3, 1, 0.3], scale: 1 }}
                    transition={{
                      opacity: { duration: 2 + Math.random() * 2, repeat: Infinity },
                      scale: { delay: i * 0.05, duration: 0.4 },
                    }}
                  />
                ))}
              </div>

              <motion.div
                className={styles.logoLarge}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                ✦
              </motion.div>

              <motion.h1
                className={styles.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <span className="text-gradient">Constellation</span>
              </motion.h1>

              <motion.p
                className={styles.subtitle}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                Твоя персональная карта знаний
              </motion.p>

              <motion.p
                className={styles.description}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                Изучай предметы в своём темпе. Система адаптируется под твои
                знания и интересы, создавая уникальный путь обучения.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                <Button
                  size="lg"
                  onClick={() => setStep('name')}
                  icon={<span>→</span>}
                  iconPosition="right"
                >
                  Начать путь
                </Button>
              </motion.div>
            </motion.div>
          )}

          {step === 'name' && (
            <motion.div
              key="name"
              className={styles.nameStep}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className={styles.stepIndicator}>
                <span className={styles.stepNumber}>01</span>
                <span className={styles.stepLabel}>Знакомство</span>
              </div>

              <h2 className={styles.stepTitle}>Как тебя зовут?</h2>

              <p className={styles.stepDescription}>
                Мы будем обращаться к тебе по имени, чтобы сделать обучение более
                персональным.
              </p>

              <div className={styles.nameInput}>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Введи своё имя"
                  error={nameError}
                  onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
                  autoFocus
                />
              </div>

              <div className={styles.actions}>
                <Button variant="ghost" onClick={() => setStep('welcome')}>
                  Назад
                </Button>
                <Button onClick={handleNameSubmit} disabled={!name.trim()}>
                  Продолжить
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'interests' && (
            <motion.div
              key="interests"
              className={styles.interestsStep}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className={styles.stepIndicator}>
                <span className={styles.stepNumber}>02</span>
                <span className={styles.stepLabel}>Интересы</span>
              </div>

              <h2 className={styles.stepTitle}>
                Привет, <span className="text-gradient">{name}</span>!
              </h2>

              <p className={styles.stepDescription}>
                Выбери до 5 интересов. Мы используем их для подбора примеров и
                создания увлекательных мини-игр.
              </p>

              <div className={styles.selectedCount}>
                <span className={styles.count}>{selectedInterests.length}</span>
                <span className={styles.countMax}>/ 5</span>
              </div>

              <div className={styles.interestsGrid}>
                {categories.map(([categoryKey, categoryName], catIndex) => {
                  const categoryInterests = availableInterests.filter(
                    (i) => i.category === categoryKey
                  );

                  return (
                    <motion.div
                      key={categoryKey}
                      className={styles.categorySection}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: catIndex * 0.05, duration: 0.4 }}
                    >
                      <h3 className={styles.categoryTitle}>{categoryName}</h3>
                      <div className={styles.interestsList}>
                        {categoryInterests.map((interest) => {
                          const isSelected = selectedInterests.some(
                            (i) => i.id === interest.id
                          );
                          const isDisabled =
                            !isSelected && selectedInterests.length >= 5;

                          return (
                            <motion.button
                              key={interest.id}
                              className={`${styles.interestChip} ${isSelected ? styles.selected : ''} ${isDisabled ? styles.disabled : ''}`}
                              onClick={() => !isDisabled && toggleInterest(interest)}
                              whileHover={{ scale: isDisabled ? 1 : 1.05 }}
                              whileTap={{ scale: isDisabled ? 1 : 0.95 }}
                            >
                              <span className={styles.interestIcon}>
                                {interest.icon}
                              </span>
                              <span className={styles.interestName}>
                                {interest.name}
                              </span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className={styles.actions}>
                <Button variant="ghost" onClick={() => setStep('name')}>
                  Назад
                </Button>
                <Button onClick={handleComplete}>
                  {selectedInterests.length > 0
                    ? 'Начать обучение'
                    : 'Пропустить'}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
