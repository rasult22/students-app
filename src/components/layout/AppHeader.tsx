import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppStore } from '../../stores/appStore';
import styles from './AppHeader.module.css';

export function AppHeader() {
  const location = useLocation();
  const { user } = useAppStore();

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <motion.header
      className={styles.header}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className={styles.container}>
        <Link to="/" className={styles.logo}>
          <span className={styles.logoIcon}>✦</span>
          <span className={styles.logoText}>Constellation</span>
        </Link>

        <nav className={styles.nav}>
          <Link
            to="/subjects"
            className={`${styles.navLink} ${isActive('/subjects') ? styles.active : ''}`}
          >
            <span className={styles.navIcon}>📚</span>
            Предметы
          </Link>
          <Link
            to="/knowledge-map"
            className={`${styles.navLink} ${isActive('/knowledge-map') ? styles.active : ''}`}
          >
            <span className={styles.navIcon}>🗺️</span>
            Карта знаний
          </Link>
        </nav>

        {user && (
          <div className={styles.profile}>
            <div className={styles.avatar}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className={styles.userName}>{user.name}</span>
          </div>
        )}
      </div>
    </motion.header>
  );
}
