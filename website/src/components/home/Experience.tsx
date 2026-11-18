"use client";

import Image from 'next/image';
import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { BELOW_HERO, blurIn, revealDelay, rt, SectionHeading } from './TextReveal';
import { JOBS, type Job } from './jobs';
import { mouseOnly } from '../../styles/motion';
import { sfx } from '../../lib/sfx';
import m from './minimal.module.scss';

// reveals right after the hero
const HEADING = BELOW_HERO;
const ROW_STAGGER = 0.06; // seconds between rows

const SPRING = { type: 'spring', stiffness: 420, damping: 34, mass: 0.8 } as const;

/** company logo, inverted per theme if needed */
export const Logo = ({ src, invertIn }: { src: string; invertIn?: 'light' | 'dark' }) => (
    <Image
        src={src}
        alt=""
        aria-hidden="true"
        width={32}
        height={32}
        className={`${m.logo} ${invertIn === 'dark' ? m.invertDark : ''} ${invertIn === 'light' ? m.invertLight : ''}`}
    />
);

/** one job row. on hover: sliding highlight, tilted logo, arrow for links, other rows dim */
const Row = ({ job, active, dimmed, onHover }: {
    job: Job;
    active: boolean;
    dimmed: boolean;
    onHover: (id: string | null, x?: number) => void;
}) => {
    const reduce = useReducedMotion();
    const body = (
        <>
            {active && (
                <motion.span
                    layoutId="experience-hover"
                    className={m.highlight}
                    transition={reduce ? { duration: 0 } : SPRING}
                    aria-hidden="true"
                />
            )}
            <span className={m.strong}>
                <motion.span
                    style={{ display: 'inline-block' }}
                    animate={reduce ? undefined : active ? { rotate: -10, scale: 1.18, y: -2 } : { rotate: 0, scale: 1, y: 0 }}
                    transition={SPRING}
                >
                    <Logo src={job.logo} invertIn={job.invertIn} />
                </motion.span>
                <motion.span
                    style={{ display: 'inline-block' }}
                    animate={{ x: active && !reduce ? 3 : 0 }}
                    transition={SPRING}
                >
                    {job.company}
                </motion.span>
            </span>
            <span className={m.role}>{job.role}</span>
            <span className={m.dates}>
                {job.dates}
                <AnimatePresence initial={false}>
                    {active && job.href && (
                        <motion.span
                            className={m.arrow}
                            initial={{ opacity: 0, x: -6, y: 6, width: 0 }}
                            animate={{ opacity: 1, x: 0, y: 0, width: '1.1em' }}
                            exit={{ opacity: 0, x: 6, y: -6, width: 0 }}
                            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                            aria-hidden="true"
                        >
                            ↗
                        </motion.span>
                    )}
                </AnimatePresence>
            </span>
        </>
    );

    const props = {
        className: m.row,
        style: { opacity: dimmed ? 0.45 : 1 },
        onPointerEnter: mouseOnly((e: React.PointerEvent) => onHover(job.id, e.clientX)),
    };

    return job.href
        ? <a {...props} href={job.href} target="_blank" rel="noopener noreferrer">{body}</a>
        : <div {...props}>{body}</div>;
};

/** list of jobs */
export const Experience = () => {
    const [hovered, setHovered] = useState<string | null>(null);

    const onHover = (id: string | null, x?: number) => {
        // tick sound when moving to a new row
        if (id && id !== hovered) sfx.tick({ x });
        setHovered(id);
    };

    return (
        <section style={{ marginTop: '32px' }}>
            <SectionHeading marginBottom="8px">{rt('Experience', HEADING)}</SectionHeading>
            <ul className={`${m.mono} ${m.list}`} onPointerLeave={() => setHovered(null)}>
                {JOBS.map((job, i) => (
                    <motion.li key={job.id} {...blurIn(revealDelay(HEADING + 0.5) + i * ROW_STAGGER)}>
                        <Row job={job} active={hovered === job.id} dimmed={hovered !== null && hovered !== job.id} onHover={onHover} />
                    </motion.li>
                ))}
            </ul>
        </section>
    );
};
