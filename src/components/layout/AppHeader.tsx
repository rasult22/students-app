import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, BookOpen, Map } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import styles from './AppHeader.module.css';

export function AppHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAppStore();

  const isActive = (path: string) => location.pathname === path;
  const isSubjectPage = /^\/subjects\/[^/]+$/.test(location.pathname);

  return (
    <motion.header
      className={styles.header}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className={styles.container}>
        {isSubjectPage ? (
          <>
            <button
              onClick={() => navigate('/subjects')}
              className={styles.backButton}
            >
              <ArrowLeft size={18} />
              <span className={styles.backText}>Назад</span>
            </button>
            <div className={styles.spacer} />
          </>
        ) : (
          <>
            <Link to="/" className={styles.logo}>
              <Sparkles size={24} className={styles.logoIcon} />
              <span className={styles.logoText}>Constellation</span>
            </Link>

            <nav className={styles.nav}>
              <Link
                to="/subjects"
                className={`${styles.navLink} ${isActive('/subjects') ? styles.active : ''}`}
              >
                <BookOpen size={18} />
                <span>Предметы</span>
              </Link>
              <Link
                to="/knowledge-map"
                className={`${styles.navLink} ${isActive('/knowledge-map') ? styles.active : ''}`}
              >
                <Map size={18} />
                <span>Карта знаний</span>
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
          </>
        )}
      </div>
    </motion.header>
  );
}
