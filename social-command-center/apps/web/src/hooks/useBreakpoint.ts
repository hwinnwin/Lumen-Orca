import { useState, useEffect, useMemo } from 'react';

const BREAKPOINTS = {
  fold: 320,
  mobile: 640,
  tablet: 1024,
} as const;

export interface BreakpointState {
  width: number;
  isFold: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isMobileOrTablet: boolean;
}

export function useBreakpoint(): BreakpointState {
  const [width, setWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1200,
  );

  useEffect(() => {
    let rafId: number;
    const handleResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => setWidth(window.innerWidth));
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return useMemo(
    () => ({
      width,
      isFold: width < BREAKPOINTS.fold,
      isMobile: width < BREAKPOINTS.mobile,
      isTablet: width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet,
      isDesktop: width >= BREAKPOINTS.tablet,
      isMobileOrTablet: width < BREAKPOINTS.tablet,
    }),
    [width],
  );
}
