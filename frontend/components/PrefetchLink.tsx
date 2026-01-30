import React, { useEffect, useRef } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { prefetchRouteWithOptions } from '../utils/routePrefetch';

type PrefetchMode = 'hover' | 'visible' | 'both' | 'none';

export type PrefetchLinkProps = LinkProps & {
  prefetch?: PrefetchMode;
};

export const PrefetchLink: React.FC<PrefetchLinkProps> = ({
  prefetch = 'both',
  onMouseEnter,
  onFocus,
  to,
  ...props
}) => {
  const elementRef = useRef<HTMLAnchorElement | null>(null);
  const hasPrefetchedRef = useRef(false);

  useEffect(() => {
    if (prefetch === 'none' || prefetch === 'hover') return;
    if (hasPrefetchedRef.current) return;

    const el = elementRef.current;
    if (!el) return;

    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
      // Fallback: pas d'observer, on ne force pas le préchargement.
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        const isVisible = entries.some((e) => e.isIntersecting);
        if (!isVisible) return;

        if (!hasPrefetchedRef.current) {
          hasPrefetchedRef.current = true;
          prefetchRouteWithOptions(String(to), { reason: 'visible' });
        }
        obs.disconnect();
      },
      { rootMargin: '200px' },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [prefetch, to]);

  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (prefetch === 'hover' || prefetch === 'both') {
      prefetchRouteWithOptions(String(to), { reason: 'hover' });
    }
    onMouseEnter?.(e);
  };

  const handleFocus = (e: React.FocusEvent<HTMLAnchorElement>) => {
    if (prefetch === 'hover' || prefetch === 'both') {
      prefetchRouteWithOptions(String(to), { reason: 'focus' });
    }
    onFocus?.(e);
  };

  return (
    <Link
      {...props}
      to={to}
      ref={elementRef}
      onMouseEnter={handleMouseEnter}
      onFocus={handleFocus}
    />
  );
};
