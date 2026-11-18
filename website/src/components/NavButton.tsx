"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition, type CSSProperties } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { EASE_OUT, PRESS } from '../styles/motion';
import { sfx } from '../lib/sfx';

/**
 * link button between pages. shows a spinner and `pendingLabel` while the next page loads.
 * modifier clicks still open in a new tab
 */

type Colors = { fg: string; fgHover: string; border: string; borderHover: string; bg: string; bgHover?: string };

const Arrow = ({ back }: { back?: boolean }) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {back ? <><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></> : <><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></>}
    </svg>
);

const Spinner = () => (
    <motion.svg
        width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
    >
        <path d="M12 3a9 9 0 1 0 9 9" />
    </motion.svg>
);

const swap = {
    initial: { opacity: 0, y: 4, filter: 'blur(2px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.18, ease: EASE_OUT } },
    exit: { opacity: 0, y: -4, filter: 'blur(2px)', transition: { duration: 0.12, ease: EASE_OUT } },
};

export const NavButton = ({ href, label, pendingLabel, back, colors, style, children }: {
    href: string;
    label: string;
    pendingLabel: string;
    back?: boolean;
    colors: Colors;
    style?: CSSProperties;
    /** custom label content, defaults to `label` */
    children?: React.ReactNode;
}) => {
    const router = useRouter();
    const reduceMotion = useReducedMotion();
    const [hover, setHover] = useState(false);
    const [clicked, setClicked] = useState(false);
    const [pending, startTransition] = useTransition();
    const busy = clicked || pending;

    const nudge = reduceMotion ? 0 : (back ? -3 : 3);

    return (
        <motion.span style={{ display: 'inline-flex' }} whileTap={busy ? undefined : PRESS}>
            <Link
                href={href}
                aria-busy={busy}
                onPointerEnter={(e) => { if (e.pointerType === 'mouse') setHover(true); }}
                onPointerLeave={() => setHover(false)}
                onClick={(e) => {
                    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                    e.preventDefault();
                    if (busy) return;
                    sfx.press({ x: e.clientX });
                    setClicked(true);
                    startTransition(() => router.push(href));
                }}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    border: `1px solid ${hover || busy ? colors.borderHover : colors.border}`,
                    color: hover || busy ? colors.fgHover : colors.fg,
                    backgroundColor: hover && colors.bgHover ? colors.bgHover : colors.bg,
                    transform: hover && !busy && !reduceMotion ? 'translateY(-1px)' : 'none',
                    transition: 'color 0.2s var(--ease-out), border-color 0.2s var(--ease-out), background-color 0.2s var(--ease-out), transform 0.2s var(--ease-out)',
                    cursor: busy ? 'progress' : 'pointer',
                    ...style,
                }}
            >
                {/* back arrow on the left, forward on the right */}
                {back && (
                    <span style={{ display: 'inline-flex', width: 14, height: 14 }}>
                        <AnimatePresence mode="wait" initial={false}>
                            {busy ? (
                                <motion.span key="spin" {...swap} style={{ display: 'inline-flex' }}><Spinner /></motion.span>
                            ) : (
                                <motion.span key="arrow" {...swap} style={{ display: 'inline-flex' }}>
                                    <motion.span animate={{ x: hover ? nudge : 0 }} transition={{ duration: 0.2, ease: EASE_OUT }} style={{ display: 'inline-flex' }}>
                                        <Arrow back />
                                    </motion.span>
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </span>
                )}

                <span style={{ display: 'inline-grid' }}>
                    <AnimatePresence mode="popLayout" initial={false}>
                        <motion.span key={busy ? 'pending' : 'idle'} {...swap} style={{ gridArea: '1 / 1', whiteSpace: 'nowrap' }}>
                            {busy ? pendingLabel : (children ?? label)}
                        </motion.span>
                    </AnimatePresence>
                </span>

                {!back && (
                    <span style={{ display: 'inline-flex', width: 14, height: 14 }}>
                        <AnimatePresence mode="wait" initial={false}>
                            {busy ? (
                                <motion.span key="spin" {...swap} style={{ display: 'inline-flex' }}><Spinner /></motion.span>
                            ) : (
                                <motion.span key="arrow" {...swap} style={{ display: 'inline-flex' }}>
                                    <motion.span animate={{ x: hover ? nudge : 0 }} transition={{ duration: 0.2, ease: EASE_OUT }} style={{ display: 'inline-flex' }}>
                                        <Arrow />
                                    </motion.span>
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </span>
                )}
            </Link>
        </motion.span>
    );
};
