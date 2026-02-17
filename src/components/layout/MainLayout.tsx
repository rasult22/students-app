import { Outlet } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import styles from './MainLayout.module.css';

export function MainLayout() {
  return (
    <div className={`${styles.layout} noise-overlay`}>
      {/* Animated background elements */}
      <div className={styles.backgroundOrbs}>
        <div className={styles.orb1} />
        <div className={styles.orb2} />
        <div className={styles.orb3} />
      </div>

      <main className={styles.main}>
        <AnimatePresence mode="wait">
          <Outlet />
        </AnimatePresence>
      </main>
    </div>
  );
}
