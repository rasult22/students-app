import { Outlet } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AppHeader } from './AppHeader';
import styles from './DashboardLayout.module.css';

export function DashboardLayout() {
  return (
    <div className={`${styles.layout} noise-overlay`}>
      {/* Animated background elements */}
      <div className={styles.backgroundOrbs}>
        <div className={styles.orb1} />
        <div className={styles.orb2} />
      </div>

      <AppHeader />

      <main className={styles.main}>
        <AnimatePresence mode="wait">
          <Outlet />
        </AnimatePresence>
      </main>
    </div>
  );
}
