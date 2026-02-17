import { motion, type HTMLMotionProps } from 'framer-motion';
import type { ReactNode } from 'react';
import styles from './Card.module.css';

interface CardProps extends HTMLMotionProps<'div'> {
  variant?: 'default' | 'elevated' | 'outline' | 'glow';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: ReactNode;
  interactive?: boolean;
}

export function Card({
  variant = 'default',
  padding = 'md',
  children,
  interactive = false,
  className = '',
  ...props
}: CardProps) {
  return (
    <motion.div
      className={`${styles.card} ${styles[variant]} ${styles[`padding-${padding}`]} ${interactive ? styles.interactive : ''} ${className}`}
      whileHover={interactive ? { y: -4, scale: 1.01 } : undefined}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
