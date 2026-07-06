import type { Variants, Transition } from "framer-motion";

/** Signature NEXUS easing — used across the app for a consistent feel. */
export const easeNexus: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const springSoft: Transition = {
  type: "spring",
  stiffness: 320,
  damping: 30,
};

/** Fade + rise. Good default for cards and panels. */
export const fadeRise: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeNexus } },
};

/** Stagger container — animates children in sequence. */
export const stagger = (delayChildren = 0, stagger = 0.08): Variants => ({
  hidden: {},
  show: { transition: { delayChildren, staggerChildren: stagger } },
});

/** Overlay fade (boot sequence, command palette backdrop). */
export const overlayFade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.4, ease: easeNexus } },
};

/** Scale-in dialog (command palette). */
export const dialogPop: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: -8 },
  show: { opacity: 1, scale: 1, y: 0, transition: springSoft },
  exit: { opacity: 0, scale: 0.97, transition: { duration: 0.15 } },
};
