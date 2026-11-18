"use client";

import { motion } from 'framer-motion';
import { NavButton } from '../NavButton';
import { projects } from '../../data/projects';
import { cssVar, usePalette } from '../../styles/palette';
import { BELOW_HERO, blurIn, revealDelay, rt, SectionHeading } from './TextReveal';
import { ProjectCard } from './ProjectCard';

// reveals after the hero (see BELOW_HERO)
const HEADING = BELOW_HERO + 8;
const CARD_STAGGER = 0.12; // seconds between cards

export const FeaturedProjects = () => {
    const c = usePalette();
    return (
    <section style={{ marginTop: '48px' }}>
        <div style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
            marginBottom: '20px'
        }}>
            <SectionHeading marginBottom={0}>{rt('Projects', HEADING)}</SectionHeading>
        </div>

        {/* 2 columns on desktop, 1 on mobile */}
        <div className="projects-grid">
            {projects
                .filter(p => p.id !== 'portfolio')
                .map((project, i) => (
                    // cards follow the heading in, one after another
                    <motion.div
                        key={project.id}
                        className="h-full"
                        {...blurIn(revealDelay(HEADING + 0.5) + i * CARD_STAGGER)}
                    >
                        <ProjectCard project={project} index={i} />
                    </motion.div>
                ))}
        </div>

        <div style={{ marginTop: '16px', textAlign: 'left' }}>
            <NavButton
                href="/projects"
                label="View All Projects"
                pendingLabel="Opening projects…"
                colors={{ fg: cssVar.chipFg, fgHover: c.chipHoverFg, border: cssVar.chipBorder, borderHover: c.chipHoverBorder, bg: cssVar.chipBg, bgHover: c.chipHoverBg }}
                style={{ fontSize: '0.8rem', fontWeight: 500, padding: '7px 16px' }}
            >
                {rt('View All Projects', HEADING + 1.9)}
            </NavButton>
        </div>
    </section>
    );
};
