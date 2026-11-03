"use client";

import { CSSProperties, ReactNode } from 'react';
import { motion } from 'framer-motion';
const REVEAL_BASE = 0.15;
const REVEAL_STEP = 0.08;

/** turns a reveal "slot" into a delay in seconds so sections show up in order */
export const revealDelay = (slot: number) => REVEAL_BASE + slot * REVEAL_STEP;

type TextRevealProps = {
    children: ReactNode;
    delay?: number;
    as?: keyof typeof motion;
    className?: string;
    style?: CSSProperties;
};

export const TextReveal = ({ children, delay = 0, as = 'span', className, style }: TextRevealProps) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Component = motion[as] as any;
    return (
        <Component
            className={`text-reveal ${className || ''}`.trim()}
            initial={{ opacity: 0, filter: 'blur(12px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            transition={{ delay, duration: 1.15, ease: [0.22, 1, 0.36, 1] }}
            style={{
                ...style,
                ['--reveal-delay' as string]: `${delay}s`
            }}
        >
            {children}
        </Component>
    );
};

/** shorthand: reveal `text` at the given slot */
export const rt = (text: ReactNode, slot: number, className?: string) => (
    <TextReveal delay={revealDelay(slot)} className={className}>
        {text}
    </TextReveal>
);

/** the big bold heading every home section starts with */
export const SectionHeading = ({ children, marginBottom }: { children: ReactNode; marginBottom: string | number }) => (
    <h2 style={{
        fontSize: '2rem',
        fontWeight: 'bold',
        marginBottom,
        color: 'var(--c-text-strong)'
    }}>
        {children}
    </h2>
);
