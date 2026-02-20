import { useState, useEffect, useRef } from 'react';

/**
 * Хук для анимации счёта от 0 до target
 * @param target - Конечное значение
 * @param duration - Длительность анимации в мс (по умолчанию 2000)
 * @param startOnMount - Запустить анимацию при монтировании (по умолчанию true)
 * @returns Текущее анимированное значение
 */
export function useCountUp(
  target: number,
  duration: number = 2000,
  startOnMount: boolean = true
): number {
  const [value, setValue] = useState(startOnMount ? 0 : target);
  const startTimeRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!startOnMount) {
      setValue(target);
      return;
    }

    // Easing function (ease-out cubic)
    const easeOutCubic = (t: number): number => {
      return 1 - Math.pow(1 - t, 3);
    };

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);

      setValue(Math.round(target * easedProgress));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [target, duration, startOnMount]);

  return value;
}

/**
 * Хук для анимации счёта с возможностью запуска вручную
 */
export function useCountUpTrigger(
  target: number,
  duration: number = 2000
): { value: number; start: () => void; reset: () => void } {
  const [value, setValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);

  const start = () => {
    setValue(0);
    startTimeRef.current = null;
    setIsAnimating(true);
  };

  const reset = () => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
    }
    setValue(0);
    setIsAnimating(false);
  };

  useEffect(() => {
    if (!isAnimating) return;

    const easeOutCubic = (t: number): number => {
      return 1 - Math.pow(1 - t, 3);
    };

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);

      setValue(Math.round(target * easedProgress));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isAnimating, target, duration]);

  return { value, start, reset };
}

export default useCountUp;
