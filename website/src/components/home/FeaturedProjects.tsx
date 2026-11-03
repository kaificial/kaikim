"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { projects } from '../../data/projects';
import { cssVar } from '../../styles/palette';
import { rt, SectionHeading } from './TextReveal';
import { ProjectCard } from './ProjectCard';
import { mouseOnly } from '../../styles/motion';

export const FeaturedProjects = () => (
    <motion.section
        style={{ marginTop: '48px' }}
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
        <div style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
            marginBottom: '20px'
        }}>
            <SectionHeading marginBottom={0}>{rt('Featured Projects', 8)}</SectionHeading>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
            {projects
                .filter(p => p.id !== 'portfolio')
                .map((project, i) => (
                    <ProjectCard key={project.id} project={project} index={i} />
                ))}
        </div>

        <div style={{ marginTop: '16px', textAlign: 'left' }}>
            <Link href="/projects" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                fontWeight: '500',
                color: cssVar.chipFg,
                textDecoration: 'none',
                backgroundColor: cssVar.chipBg,
                border: `1px solid ${cssVar.chipBorder}`,
                padding: '7px 16px',
                borderRadius: '8px',
                transition: 'opacity 0.2s'
            }}
                onPointerEnter={mouseOnly((e) => e.currentTarget.style.opacity = '0.9')}
                onPointerLeave={mouseOnly((e) => e.currentTarget.style.opacity = '1')}
            >
                {rt('View All Projects', 9.9)}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14"></path>
                    <path d="M12 5l7 7-7 7"></path>
                </svg>
            </Link>
        </div>
    </motion.section>
);
