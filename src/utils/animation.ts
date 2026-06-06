export const motionConfig = {
  entry: {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
  entrySlideLeft: {
    initial: { opacity: 0, x: 16 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
  entrySlideRight: {
    initial: { opacity: 0, x: -16 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
  spring: {
    type: 'spring' as const,
    damping: 25,
    stiffness: 300,
  },
  hover: {
    transition: { duration: 0.15, ease: 'easeInOut' },
  },
  liquid: {
    duration: 0.6,
    ease: [0.4, 0, 0.2, 1],
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
  },
}

export const staggerConfig = {
  animate: { transition: { staggerChildren: 0.08 } },
}

export const typewriterDelay = (index: number) => index * 0.03
