import { useRef, useState, useEffect } from 'react';

/**
 * Pull-to-refresh hook.
 * @param {function} onRefresh - async function to call when pull threshold is met
 * @param {object} options
 * @param {number} options.threshold - pixels to pull before triggering (default 72)
 */
export default function usePullToRefresh(onRefresh, { threshold = 72 } = {}) {
  const containerRef = useRef(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(null);
  const pulling = useRef(false);

  useEffect(() => {
    const el = containerRef.current || window;

    const getScrollTop = () =>
      containerRef.current
        ? containerRef.current.scrollTop
        : window.scrollY || document.documentElement.scrollTop;

    const onTouchStart = (e) => {
      if (getScrollTop() <= 0) {
        startY.current = e.touches[0].clientY;
        pulling.current = true;
      }
    };

    const onTouchMove = (e) => {
      if (!pulling.current || startY.current === null) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta > 0) {
        setPullDistance(Math.min(delta * 0.45, threshold * 1.5));
        if (delta > 8 && getScrollTop() <= 0) {
          // prevent native scroll bounce from interfering
          try { e.preventDefault(); } catch (_) {}
        }
      } else {
        pulling.current = false;
        startY.current = null;
        setPullDistance(0);
      }
    };

    const onTouchEnd = async () => {
      if (!pulling.current) return;
      pulling.current = false;
      startY.current = null;

      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true);
        setPullDistance(0);
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      } else {
        setPullDistance(0);
      }
    };

    const target = containerRef.current || document;
    target.addEventListener('touchstart', onTouchStart, { passive: true });
    target.addEventListener('touchmove', onTouchMove, { passive: false });
    target.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      target.removeEventListener('touchstart', onTouchStart);
      target.removeEventListener('touchmove', onTouchMove);
      target.removeEventListener('touchend', onTouchEnd);
    };
  }, [onRefresh, threshold, pullDistance, isRefreshing]);

  return { containerRef, pullDistance, isRefreshing };
}