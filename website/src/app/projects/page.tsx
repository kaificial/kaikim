"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../components/ThemeContext';
import { useUISound } from '../../hooks/use-ui-sound';
import Image from 'next/image';
import { projects } from '../../data/projects';
import { SpotlightCard } from '../../components/SpotlightCard';
import { useEffect, useState } from 'react';
import Webring from '../../components/Webring';
import { ProjectVideo } from '../../components/ProjectVideo';
import { NavButton } from '../../components/NavButton';
import { PRESS } from '../../styles/motion';
import { blurIn, revealSequence } from '../../components/home/TextReveal';

const ProjectTitle = ({ project, isDark }: { project: any, isDark: boolean }) => (
    <h3 style={{
        fontSize: '1.25rem',
        fontWeight: '700',
        color: isDark ? '#f5f5f5' : '#1c1917',
        marginBottom: '6px'
    }}>
        {project.title}
    </h3>
);

export default function ProjectsPage() {
    const { isDark } = useTheme();
    const { playClick } = useUISound();
    const [searchQuery, setSearchQuery] = useState('');
    // reveal order: title, intro, search, cards, back button
    const flow = revealSequence(0);
    const CARD_STEP = 0.08; // seconds between cards
    // after first load, search results animate instantly
    const [settled, setSettled] = useState(false);
    useEffect(() => {
        const t = window.setTimeout(() => setSettled(true), 4000);
        return () => window.clearTimeout(t);
    }, []);

    const filteredProjects = projects.filter(project => {
        const query = searchQuery.toLowerCase();
        return (
            project.title.toLowerCase().includes(query) ||
            project.description.toLowerCase().includes(query) ||
            project.tags.some(tag => tag.toLowerCase().includes(query))
        );
    });

    const title = flow.rt('Projects', 'text-reveal-hero');
    const intro = flow.rt('Projects ranging from in-browser AI and developer tools to bias detection, handwriting recognition, and interactive 3D web apps.');
    const searchIn = flow.block(6);
    const cardsAt = flow.at();
    const backAt = blurIn(cardsAt + projects.length * CARD_STEP);

    return (
        <div className="w-full">
            <div style={{
                width: '96%',
                maxWidth: '1400px',
                margin: '0 auto',
                padding: '0 0 48px 0'
            }}>
                <section>
                    <header style={{ marginBottom: '64px' }}>
                        <h1 className="hero-title font-bold text-gray-900 dark:text-white tracking-tight leading-none text-left">
                            {title}
                        </h1>
                        <p
                            className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-xl text-left"
                            style={{ marginTop: '16px', marginBottom: '20px' }}
                        >
                            {intro}
                        </p>
                    </header>

                    {/* Search Bar */}
                    <motion.div
                        {...searchIn}
                        style={{
                            marginBottom: '40px',
                            position: 'relative'
                        }}
                    >
                        <div style={{
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center'
                        }}>
                            <div style={{
                                position: 'absolute',
                                left: '16px',
                                color: isDark ? '#8f8f8f' : '#6b7280',
                                display: 'flex',
                                alignItems: 'center',
                                pointerEvents: 'none'
                            }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Search by name, tech, or description..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '14px 16px 14px 48px',
                                    borderRadius: '12px',
                                    backgroundColor: isDark ? '#141414' : 'white',
                                    border: `1px solid ${isDark ? '#1b1b1b' : '#e5e7eb'}`,
                                    color: isDark ? '#f5f5f5' : '#1c1917',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    transition: 'background-color 0.2s var(--ease-out), border-color 0.2s var(--ease-out), color 0.2s var(--ease-out), box-shadow 0.2s var(--ease-out), opacity 0.2s var(--ease-out)',
                                    boxShadow: isDark ? 'none' : '0 2px 4px rgba(0,0,0,0.02)'
                                }}
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = '#2563eb';
                                    e.currentTarget.style.boxShadow = isDark ? '0 0 0 3px rgba(37, 99, 235, 0.1)' : '0 0 0 3px rgba(37, 99, 235, 0.05)';
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
                                    e.currentTarget.style.boxShadow = isDark ? 'none' : '0 2px 4px rgba(0,0,0,0.02)';
                                }}
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => { playClick(); setSearchQuery(''); }}
                                    style={{
                                        position: 'absolute',
                                        right: '16px',
                                        background: 'transparent',
                                        border: 'none',
                                        color: isDark ? '#8f8f8f' : '#6b7280',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '4px'
                                    }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            )}
                        </div>
                    </motion.div>

                    <div className="projects-grid">
                        <AnimatePresence mode="popLayout">
                            {filteredProjects.map((project, i) => (
                                <motion.div
                                    key={project.id}
                                    layout
                                    {...blurIn(cardsAt + i * CARD_STEP)}
                                    exit={{ opacity: 0, filter: 'blur(8px)', y: -6, transition: { duration: 0.25 } }}
                                    {...(settled && { transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } })}
                                    className="h-full"
                                >
                                    <SpotlightCard isDark={isDark} noPadding={true}>
                                        <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            height: '100%'
                                        }}>
                                            {/* Top: Preview Image/Video */}
                                            <div style={{
                                                width: '100%',
                                                overflow: 'hidden',
                                                borderBottom: `1px solid ${isDark ? '#2a2a2a' : '#e5e7eb'}`,
                                                backgroundColor: project.solidColor || (isDark ? '#141414' : '#f8f9fa'),
                                                aspectRatio: '2 / 1',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                position: 'relative'
                                            }}>
                                                {project.video ? (
                                                    <ProjectVideo
                                                        src={project.video}
                                                        resetTime={project.resetTime ?? 0}
                                                        startTime={project.startTime ?? 0}
                                                        endTime={project.endTime}
                                                        autoLoop
                                                    />
                                                ) : project.image ? (
                                                    <Image
                                                        src={project.image}
                                                        alt={project.title}
                                                        fill
                                                        style={{ objectFit: 'cover' }}
                                                    />
                                                ) : (
                                                    <span style={{ fontSize: '3rem', opacity: 0.3 }}>{project.icon}</span>
                                                )}
                                            </div>

                                            {/* Bottom: Content */}
                                            <div style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '8px',
                                                padding: '20px',
                                                flex: 1
                                            }}>
                                                {/* Header with title and status */}
                                                <div>
                                                    {/* title left, status right */}
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '6px' }}>
                                                        <ProjectTitle project={project} isDark={isDark} />
                                                        <div style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            flexShrink: 0
                                                        }}>
                                                            <div
                                                                className="status-dot-pulse"
                                                                style={{
                                                                    width: '6px',
                                                                    height: '6px',
                                                                    borderRadius: '50%',
                                                                    backgroundColor: project.status === 'Live' ? '#3b82f6' : '#eab308'
                                                                }}
                                                            />
                                                            <span style={{
                                                                color: isDark ? '#8f8f8f' : '#6b7280',
                                                                fontSize: '0.75rem',
                                                                fontWeight: '500',
                                                                whiteSpace: 'nowrap'
                                                            }}>{project.status}</span>
                                                        </div>
                                                    </div>
                                                    <p style={{
                                                        fontSize: '0.875rem',
                                                        color: isDark ? '#8f8f8f' : '#6b7280',
                                                        lineHeight: '1.6',
                                                        margin: 0
                                                    }}>
                                                        {project.description}
                                                    </p>
                                                </div>

                                                {/* Tech Stack */}
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
                                                    {project.tags.map((tech, i) => (
                                                        <motion.span
                                                            key={i}
                                                            style={{
                                                                display: 'inline-block',
                                                                padding: '4px 12px',
                                                                borderRadius: '6px',
                                                                backgroundColor: isDark ? 'rgba(52, 52, 52, 0.55)' : '#f3f4f6',
                                                                color: isDark ? '#c8c8c8' : '#374151',
                                                                fontSize: '0.75rem',
                                                                fontWeight: '500',
                                                                border: `1px solid ${isDark ? '#2a2a2a' : '#e5e7eb'}`
                                                            }}
                                                        >
                                                            {tech}
                                                        </motion.span>
                                                    ))}
                                                </div>

                                                {/* Footer: Buttons */}
                                                {(project.demo || project.github) && (
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', marginTop: 'auto', flexWrap: 'wrap' }}>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        {project.demo && (
                                                            <motion.a
                                                                href={project.demo}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                whileHover={{
                                                                    scale: 1.05,
                                                                    boxShadow: isDark
                                                                        ? '0 0 25px rgba(59, 130, 246, 0.8), 0 0 50px rgba(59, 130, 246, 0.4), 0 0 75px rgba(59, 130, 246, 0.2)'
                                                                        : '0 0 25px rgba(37, 99, 235, 0.6), 0 0 50px rgba(37, 99, 235, 0.3), 0 0 75px rgba(37, 99, 235, 0.15)'
                                                                }}
                                                                whileTap={PRESS}
                                                                transition={{ duration: 0.2 }}
                                                                style={{
                                                                    padding: '6px 12px',
                                                                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
                                                                    color: isDark ? '#e6e6e6' : '#1f2937',
                                                                    border: `1px solid ${isDark ? '#2a2a2a' : '#d1d5db'}`,
                                                                    borderRadius: '8px',
                                                                    fontSize: '0.75rem',
                                                                    fontWeight: '500',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '6px',
                                                                    textDecoration: 'none',
                                                                    transition: 'background-color 0.2s var(--ease-out), border-color 0.2s var(--ease-out), color 0.2s var(--ease-out), box-shadow 0.2s var(--ease-out), opacity 0.2s var(--ease-out)'
                                                                }}
                                                            >
                                                                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                                </svg>
                                                                Demo
                                                            </motion.a>
                                                        )}
                                                        {project.github && (
                                                            <motion.a
                                                                href={project.github}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                whileHover={{
                                                                    scale: 1.05,
                                                                    boxShadow: isDark
                                                                        ? '0 0 25px rgba(59, 130, 246, 0.8), 0 0 50px rgba(59, 130, 246, 0.4), 0 0 75px rgba(59, 130, 246, 0.2)'
                                                                        : '0 0 25px rgba(37, 99, 235, 0.6), 0 0 50px rgba(37, 99, 235, 0.3), 0 0 75px rgba(37, 99, 235, 0.15)'
                                                                }}
                                                                whileTap={PRESS}
                                                                transition={{ duration: 0.2 }}
                                                                style={{
                                                                    padding: '6px 12px',
                                                                    backgroundColor: isDark ? '#2a2a2a' : '#f3f4f6',
                                                                    color: isDark ? '#f5f5f5' : '#1f2937',
                                                                    borderRadius: '8px',
                                                                    fontSize: '0.75rem',
                                                                    fontWeight: '500',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '6px',
                                                                    textDecoration: 'none',
                                                                    border: `1px solid ${isDark ? '#2a2a2a' : '#d1d5db'}`,
                                                                    transition: 'background-color 0.2s var(--ease-out), border-color 0.2s var(--ease-out), color 0.2s var(--ease-out), box-shadow 0.2s var(--ease-out), opacity 0.2s var(--ease-out)'
                                                                }}
                                                            >
                                                                <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                                                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                                                </svg>
                                                                GitHub
                                                            </motion.a>
                                                        )}
                                                    </div>
                                                </div>
                                                )}
                                            </div>
                                        </div>
                                    </SpotlightCard>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {filteredProjects.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                style={{
                                    textAlign: 'center',
                                    padding: '48px 0',
                                    color: isDark ? '#8f8f8f' : '#6b7280'
                                }}
                            >
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px', opacity: 0.5 }}>
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                                <p style={{ fontSize: '1.125rem' }}>No projects found matching "{searchQuery}"</p>
                                <button
                                    onClick={() => { playClick(); setSearchQuery(''); }}
                                    style={{
                                        marginTop: '16px',
                                        background: 'none',
                                        border: 'none',
                                        color: '#2563eb',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        textDecoration: 'underline'
                                    }}
                                >
                                    Clear search
                                </button>
                            </motion.div>
                        )}

                    </div>

                    {/* Back to Home Button - moved outside grid */}
                    <motion.div
                        {...backAt}
                        className="back-to-home-wrapper"
                    >
                        <NavButton
                            href="/"
                            back
                            label="Back to Home"
                            pendingLabel="Heading home…"
                            colors={{
                                fg: isDark ? '#8f8f8f' : '#6b7280',
                                fgHover: isDark ? '#f5f5f5' : '#1c1917',
                                border: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                                borderHover: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                                bg: isDark ? '#141414' : 'white',
                            }}
                            style={{ fontSize: '0.75rem', fontWeight: 500, padding: '6px 12px' }}
                        />
                    </motion.div>
                </section>

                <Webring />
                <div className="footer-spacer compact" />
            </div>
        </div>
    );
}
