/**
 * motion tokens. use these instead of random values.
 *
 * rules (from emil kowalski's design skill):
 * - stuff you do a lot (hover, press, toggles) stays fast and quiet, save the fun for rare moments
 * - ui motion stays under 300 ms, exits are ~60% of the enter
 * - only animate transform and opacity, never `transition: all`
 * - things come in from scale 0.95 + opacity 0, never scale 0
 */

/** strong ease-out: things coming in and going out */
export const EASE_OUT = [0.23, 1, 0.32, 1] as const;
/** strong ease-in-out: things moving or morphing on screen */
export const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;

/** durations in seconds (framer-motion units) */
export const DURATION = {
    press: 0.12,
    pop: 0.18,
    panel: 0.25,
    modal: 0.4,
} as const;

/** exit duration for a given enter, exits are quicker */
export const exitFor = (enter: number) => Math.round(enter * 0.6 * 1000) / 1000;

/** gap between items in a staggered entrance */
export const STAGGER = 0.04;

/** press feedback for buttons and anything tappable */
export const PRESS = { scale: 0.97 } as const;

/** popover/tooltip in and out, growing from its trigger (set transformOrigin on the element) */
export const POP = {
    initial: { opacity: 0, scale: 0.95, y: 4 },
    animate: { opacity: 1, scale: 1, y: 0, transition: { duration: DURATION.pop, ease: EASE_OUT } },
    exit: { opacity: 0, scale: 0.95, y: 4, transition: { duration: exitFor(DURATION.pop), ease: EASE_OUT } },
} as const;

/** page load entrance: quick fade and small rise */
export const enterAt = (delay: number) => ({
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: DURATION.panel, ease: EASE_OUT },
});

/**
 * only run pointer enter/leave for a real mouse. touch screens fake mouseenter on tap and never leave,
 * so hover styles get stuck
 */
export const mouseOnly = <E extends { pointerType: string }>(fn: (e: E) => void) => (e: E) => {
    if (e.pointerType === 'mouse') fn(e);
};
