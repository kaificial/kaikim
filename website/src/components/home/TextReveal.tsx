"use client";

import { CSSProperties, ReactNode } from 'react';
import { motion } from 'framer-motion';
const REVEAL_BASE = 0.15;
const REVEAL_STEP = 0.08;

/** delay offset so sections below the hero reveal after it */
export const BELOW_HERO = 34;

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
            {...blurIn(delay)}
            style={{
                ...style,
                ['--reveal-delay' as string]: `${delay}s`
            }}
        >
            {children}
        </Component>
    );
};

/** delay between words */
const WORD_STEP = 0.035;
const WORD_SLOT = WORD_STEP / REVEAL_STEP;

const wordCount = (text: ReactNode) => typeof text === 'string' ? text.split(/\s+/).filter(Boolean).length : 1;

/** shared blur-in animation props for motion elements */
export const blurIn = (delay: number) => ({
    initial: { opacity: 0, filter: 'blur(8px)', y: 6 },
    animate: { opacity: 1, filter: 'blur(0px)', y: 0 },
    transition: { delay, duration: 0.9, ease: [0.22, 1, 0.36, 1] as const },
});

/** one animated word */
const Word = ({ children, delay, className }: { children: string; delay: number; className?: string }) => (
    <motion.span
        className={`text-reveal text-reveal-word ${className || ''}`.trim()}
        {...blurIn(delay)}
        style={{ display: 'inline-block' }}
    >
        {children}
    </motion.span>
);

/** reveal text word by word, or other content as one piece */
export const rt = (text: ReactNode, slot: number, className?: string) => {
    if (typeof text !== 'string') {
        return (
            <TextReveal delay={revealDelay(slot)} className={className}>
                {text}
            </TextReveal>
        );
    }
    let i = 0;
    // keep spaces so lines wrap
    return text.split(/(\s+)/).map((part, k) =>
        !part ? null : /^\s+$/.test(part) ? part : (
            <Word key={k} delay={revealDelay(slot) + (i++) * WORD_STEP} className={className}>{part}</Word>
        )
    );
};

/** reveal several pieces in order, each starting after the last */
export const revealSequence = (start: number) => {
    let slot = start;
    return {
        rt: (text: ReactNode, className?: string) => {
            const node = rt(text, slot, className);
            slot += wordCount(text) * WORD_SLOT;
            return node;
        },
        /** reserve a slot for a custom component */
        next: (words = 1) => {
            const s = slot;
            slot += words * WORD_SLOT;
            return s;
        },
        /** blur-in props for a non-text block */
        block: (words = 4) => {
            const props = blurIn(revealDelay(slot));
            slot += words * WORD_SLOT;
            return props;
        },
        /** current delay in seconds */
        at: () => revealDelay(slot),
    };
};

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
