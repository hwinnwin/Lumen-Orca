/**
 * Lumen Motion System
 * Calm, precise animations with easeInOutQuint
 */

export const motion = {
  easeInOutQuint: [0.83, 0, 0.17, 1] as [number, number, number, number],
  pulseMs: 1400,
  transitionMs: 300
} as const;

export const animations = {
  fadeIn: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, ease: motion.easeInOutQuint }
  },
  scaleIn: {
    initial: { scale: 0.95, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { duration: 0.2, ease: motion.easeInOutQuint }
  },
  pulse: {
    animate: {
      opacity: [0.5, 1, 0.5],
      scale: [1, 1.02, 1]
    },
    transition: {
      duration: motion.pulseMs / 1000,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
} as const;
