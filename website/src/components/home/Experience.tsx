"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useState, type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '../ThemeContext';
import { cssVar, usePalette } from '../../styles/palette';
import { rt, SectionHeading } from './TextReveal';
import { DURATION, EASE_OUT, exitFor, mouseOnly, PRESS } from '../../styles/motion';
import { sfx } from '../../lib/sfx';

type Job = {
    id: string;
    company: string;
    role: string;
    dates: string;
    logo: string;
    /** reveal slots for company, role and dates */
    slots: [number, number, number];
    /** which theme the (monochrome) logo needs inverting in, if any */
    invertIn?: 'light' | 'dark';
    /** let the logo keep its own aspect ratio */
    autoSize?: boolean;
    detailsStyle?: CSSProperties;
};

const JOBS: Job[] = [
    { id: 'cibc', company: 'CIBC', role: 'Intern', dates: 'May 2026 - Aug. 2026', logo: '/assets/cibc.png', slots: [5.8, 5.85, 5.9], invertIn: 'light', autoSize: true },
    { id: 'qmind', company: 'QMIND', role: 'AI Engineer', dates: 'Oct. 2025 - May 2026', logo: '/assets/QMIND_logo.png', slots: [5.8, 5.9, 5.95] },
    { id: 'qbit', company: 'QBiT', role: 'Software Engineer', dates: 'Sept. 2025 - May 2026', logo: '/assets/QBiT_Logo-1.png', slots: [6.2, 6.25, 6.3], invertIn: 'dark', autoSize: true, detailsStyle: { marginLeft: '52px', marginTop: '4px' } },
    { id: 'zeen', company: 'Zeen', role: 'Software Engineer', dates: 'May 2024 - Aug. 2024', logo: '/assets/zeen.jpg', slots: [6.6, 6.65, 6.7] },
];

const DEFAULT_DETAILS: CSSProperties = { marginLeft: '52px', marginTop: '0px', paddingBottom: '12px' };

const ExperienceItem = ({ job, expanded, onToggle }: { job: Job; expanded: boolean; onToggle: () => void }) => {
    const { isDark } = useTheme();
    const c = usePalette();
    const invert = job.invertIn === (isDark ? 'dark' : 'light');

    return (
        <div className="experience-item" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div className="experience-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-start' }}>
                    <div className="experience-logo-container" style={{ width: '48px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                        <Image
                            src={job.logo}
                            alt={`${job.company} Logo`}
                            width={36}
                            height={36}
                            style={{
                                borderRadius: '8px',
                                objectFit: 'cover',
                                ...(job.autoSize && { width: 'auto', height: 'auto' }),
                                ...(job.invertIn && { filter: invert ? 'invert(1)' : 'none' }),
                            }}
                        />
                    </div>

                    <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0px', color: cssVar.textStrong }}>
                            {rt(job.company, job.slots[0])}
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: cssVar.textMuted }}>
                            {rt(job.role, job.slots[1])}
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
                    <span className="experience-date" style={{ fontSize: '0.875rem', color: cssVar.textMuted, whiteSpace: 'nowrap' }}>
                        {rt(job.dates, job.slots[2])}
                    </span>
                    <motion.button
                        className="experience-btn"
                        onClick={(e) => { e.stopPropagation(); onToggle(); }}
                        animate={{
                            backgroundColor: c.chipBg,
                            color: c.chipFg,
                            borderColor: c.chipBorder,
                        }}
                        whileHover={{
                            scale: 1.05,
                            backgroundColor: c.chipHoverBg,
                            color: c.chipHoverFg,
                            borderColor: c.chipHoverBorder
                        }}
                        whileTap={PRESS}
                        style={{
                            border: `1px solid ${c.chipBorder}`,
                            background: c.chipBg,
                            color: c.chipFg,
                            fontSize: '0.7rem',
                            cursor: 'pointer',
                            padding: '3px 8px',
                            borderRadius: '9999px',
                            textAlign: 'left',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: '500',
                            marginTop: '4px'
                        }}
                    >
                        {expanded ? 'Show less' : 'Read more'}
                        <motion.svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" animate={{ rotate: expanded ? 180 : 0 }}>
                            <path d="M2 4l4 4 4-4" />
                        </motion.svg>
                    </motion.button>
                </div>
            </div>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1, transition: { duration: DURATION.panel, ease: EASE_OUT } }}
                        exit={{ height: 0, opacity: 0, transition: { duration: exitFor(DURATION.panel), ease: EASE_OUT } }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div style={job.detailsStyle ?? DEFAULT_DETAILS} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export const Experience = () => {
    const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

    const toggleExpand = (id: string) => {
        if (expandedItems[id]) sfx.fold(); else sfx.unfold();
        setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <motion.section
            style={{ marginTop: '24px' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8, duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        >
            <SectionHeading marginBottom="16px">{rt('Experience', 5)}</SectionHeading>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {JOBS.map((job) => (
                    <ExperienceItem key={job.id} job={job} expanded={!!expandedItems[job.id]} onToggle={() => toggleExpand(job.id)} />
                ))}

                {/* view more on linkedin */}
                <div style={{ marginTop: '0px', display: 'flex', justifyContent: 'flex-start', marginLeft: '8px' }}>
                    <Link href="https://www.linkedin.com/in/newjeans/" target="_blank" rel="noopener noreferrer" style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.7rem',
                        fontWeight: '500',
                        color: cssVar.chipFg,
                        textDecoration: 'none',
                        backgroundColor: cssVar.chipBg,
                        border: `1px solid ${cssVar.chipBorder}`,
                        padding: '4px 10px',
                        borderRadius: '8px',
                        transition: 'opacity 0.2s'
                    }}
                        onPointerEnter={mouseOnly((e) => e.currentTarget.style.opacity = '0.9')}
                        onPointerLeave={mouseOnly((e) => e.currentTarget.style.opacity = '1')}
                    >
                        {rt('View more', 6.95)}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14"></path>
                            <path d="M12 5l7 7-7 7"></path>
                        </svg>
                    </Link>
                </div>
            </div>
        </motion.section>
    );
};
