import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { Button, Input } from '../../components/ui';
import { PageTransition } from '../../components/layout';
import styles from './Onboarding.module.css';

type Step = 'welcome' | 'name';

export function Onboarding() {
  const navigate = useNavigate();
  const { setUser } = useAppStore();

  const [step, setStep] = useState<Step>('welcome');
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');

  const handleComplete = () => {
    if (name.trim().length < 2) {
      setNameError('Введите имя (минимум 2 символа)');
      return;
    }
    setNameError('');
    setUser(name.trim(), []);
    navigate('/subjects');
  };

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
                {[...Array(10)].map((_, i) => (
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
                <Sparkles size={64} />
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
                  icon={<ArrowRight size={18} />}
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
                  onKeyDown={(e) => e.key === 'Enter' && handleComplete()}
                  autoFocus
                />
              </div>

              <div className={styles.actions}>
                <Button variant="ghost" onClick={() => setStep('welcome')}>
                  Назад
                </Button>
                <Button onClick={handleComplete} disabled={!name.trim()}>
                  Начать обучение
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
