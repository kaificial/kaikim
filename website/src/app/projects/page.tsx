"use client";

import { motion, useScroll, useSpring, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../components/ThemeContext';
import { useUISound } from '../../hooks/use-ui-sound';
import Image from 'next/image';
import { projects } from '../../data/projects';
import { SpotlightCard } from '../../components/SpotlightCard';
import Link from 'next/link';
import { useState } from 'react';
import { ProjectDescription } from '../../components/ProjectDescription';
import Webring from '../../components/Webring';
import { ProjectVideo } from '../../components/ProjectVideo';

const ProjectTitle = ({ project, isDark }: { project: any, isDark: boolean }) => (
    <h3 style={{
        fontSize: '1.25rem',
        fontWeight: '700',
        color: isDark ? 'white' : '#1c1917',
        marginBottom: '6px'
    }}>
        {project.title}
    </h3>
);

export default function ProjectsPage() {
    const { isDark } = useTheme();
    const { playClick } = useUISound();
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

    const toggleExpand = (id: string) => {
        playClick();
        setExpandedItems(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    const filteredProjects = projects.filter(project => {
        const query = searchQuery.toLowerCase();
        return (
            project.title.toLowerCase().includes(query) ||
            project.description.toLowerCase().includes(query) ||
            project.tags.some(tag => tag.toLowerCase().includes(query))
        );
    });

    return (
        <div className="w-full">
            {/* Scroll Progress Bar */}
            <motion.div
                style={{
                    scaleX,
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    backgroundColor: '#2563eb',
                    transformOrigin: '0%',
                    zIndex: 9999
                }}
            />

            <div style={{
                width: '96%',
                maxWidth: '1400px',
                margin: '0 auto',
                padding: '0 0 48px 0'
            }}>
                <section>
                    <header style={{ marginBottom: '64px' }}>
                        <motion.h1
                            className="hero-title font-bold text-gray-900 dark:text-white tracking-tight leading-none text-left"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2, duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
                        >
                            Projects
                        </motion.h1>
                        <motion.p
                            className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-xl text-left"
                            style={{ marginTop: '16px', marginBottom: '20px' }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.35, duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                        >
                            Projects ranging from full stack web development, machine learning, and AI to computer vision and more.
                        </motion.p>
                    </header>

                    {/* Search Bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
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
                                color: isDark ? '#9ca3af' : '#6b7280',
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
                                    backgroundColor: isDark ? '#171717' : 'white',
                                    border: `1px solid ${isDark ? '#262626' : '#e5e7eb'}`,
                                    color: isDark ? 'white' : '#1c1917',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    transition: 'all 0.2s ease',
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
                                        color: isDark ? '#9ca3af' : '#6b7280',
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

                    <motion.div
                        className="projects-grid"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.6, duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <AnimatePresence mode="popLayout">
                            {filteredProjects.map((project) => (
                                <motion.div
                                    key={project.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                                    transition={{
                                        duration: 0.4,
                                        ease: [0.22, 1, 0.36, 1]
                                    }}
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
                                                borderBottom: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                                                backgroundColor: project.solidColor || (isDark ? '#171717' : '#f8f9fa'),
                                                aspectRatio: project.id === 'rooke' ? '1512/738' :
                                                    project.id === 'texify' ? '1996/1080' :
                                                        project.id === 'portfolio' ? '1500/742' :
                                                            project.id === 'scribl' ? '2220/1080' :
                                                                project.id === 'clairo' ? '1498/744' :
                                                                    project.id === 'macrodata-refinement' ? 'auto' : '16/10',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                position: 'relative'
                                            }}>
                                                {project.video ? (
                                                    <ProjectVideo
                                                        src={project.video}
                                                        resetTime={project.id === 'portfolio' ? 2 : 0}
                                                        startTime={project.id === 'macrodata-refinement' ? 6 : 0}
                                                        endTime={project.id === 'macrodata-refinement' ? 33 : undefined}
                                                        iconColor={project.id === 'rooke' || project.id === 'macrodata-refinement' ? 'white' : 'black'}
                                                        style={{
                                                            transform: project.id === 'portfolio' ? 'scale(1.15)' : 'none'
                                                        }}
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
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '6px' }}>
                                                        <ProjectTitle project={project} isDark={isDark} />
                                                        <div style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            padding: '4px 10px',
                                                            borderRadius: '9999px',
                                                            backgroundColor: isDark ? 'rgba(38, 38, 38, 0.6)' : '#f3f4f6',
                                                            border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
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
                                                                color: isDark ? '#d1d5db' : '#4b5563',
                                                                fontSize: '0.75rem',
                                                                fontWeight: '500',
                                                                whiteSpace: 'nowrap'
                                                            }}>{project.status}</span>
                                                        </div>
                                                    </div>
                                                    <p style={{
                                                        fontSize: '0.875rem',
                                                        color: isDark ? '#9ca3af' : '#6b7280',
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
                                                            whileHover={{ scale: 1.05 }}
                                                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                                            style={{
                                                                display: 'inline-block',
                                                                padding: '4px 12px',
                                                                borderRadius: '6px',
                                                                backgroundColor: isDark ? 'rgba(55, 65, 81, 0.5)' : '#f3f4f6',
                                                                color: isDark ? '#d1d5db' : '#374151',
                                                                fontSize: '0.75rem',
                                                                fontWeight: '500',
                                                                border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`
                                                            }}
                                                        >
                                                            {tech}
                                                        </motion.span>
                                                    ))}
                                                </div>

                                                {/* Footer: Buttons */}
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginTop: 'auto', flexWrap: 'wrap' }}>
                                                    <Link
                                                        href={`/projects/${project.id}`}
                                                        className="group text-gray-500 dark:text-gray-400 hover:text-[#2563eb] transition-colors"
                                                        style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            fontSize: '0.8125rem',
                                                            fontWeight: '500',
                                                            textDecoration: 'underline',
                                                            textUnderlineOffset: '3px',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s ease'
                                                        }}
                                                    >
                                                        View Details
                                                        <svg className="transition-transform duration-300 ease-out group-hover:-rotate-45" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M5 12h14"></path>
                                                            <path d="M12 5l7 7-7 7"></path>
                                                        </svg>
                                                    </Link>

                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <motion.a
                                                            href={project.demo || '#'}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            whileHover={{
                                                                scale: 1.05,
                                                                boxShadow: isDark
                                                                    ? '0 0 25px rgba(59, 130, 246, 0.8), 0 0 50px rgba(59, 130, 246, 0.4), 0 0 75px rgba(59, 130, 246, 0.2)'
                                                                    : '0 0 25px rgba(37, 99, 235, 0.6), 0 0 50px rgba(37, 99, 235, 0.3), 0 0 75px rgba(37, 99, 235, 0.15)'
                                                            }}
                                                            whileTap={{ scale: 0.98 }}
                                                            transition={{ duration: 0.2 }}
                                                            style={{
                                                                padding: '6px 12px',
                                                                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
                                                                color: isDark ? '#e5e7eb' : '#1f2937',
                                                                border: `1px solid ${isDark ? '#374151' : '#d1d5db'}`,
                                                                borderRadius: '8px',
                                                                fontSize: '0.75rem',
                                                                fontWeight: '500',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                                textDecoration: 'none',
                                                                transition: 'all 0.2s ease'
                                                            }}
                                                        >
                                                            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                            </svg>
                                                            Demo
                                                        </motion.a>
                                                        <motion.a
                                                            href={project.github || '#'}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            whileHover={{
                                                                scale: 1.05,
                                                                boxShadow: isDark
                                                                    ? '0 0 25px rgba(59, 130, 246, 0.8), 0 0 50px rgba(59, 130, 246, 0.4), 0 0 75px rgba(59, 130, 246, 0.2)'
                                                                    : '0 0 25px rgba(37, 99, 235, 0.6), 0 0 50px rgba(37, 99, 235, 0.3), 0 0 75px rgba(37, 99, 235, 0.15)'
                                                            }}
                                                            whileTap={{ scale: 0.98 }}
                                                            transition={{ duration: 0.2 }}
                                                            style={{
                                                                padding: '6px 12px',
                                                                backgroundColor: isDark ? '#374151' : '#f3f4f6',
                                                                color: isDark ? 'white' : '#1f2937',
                                                                borderRadius: '8px',
                                                                fontSize: '0.75rem',
                                                                fontWeight: '500',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                                textDecoration: 'none',
                                                                border: `1px solid ${isDark ? '#374151' : '#d1d5db'}`,
                                                                transition: 'all 0.2s ease'
                                                            }}
                                                        >
                                                            <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                                                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                                            </svg>
                                                            GitHub
                                                        </motion.a>
                                                    </div>
                                                </div>
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
                                    color: isDark ? '#9ca3af' : '#6b7280'
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

                    </motion.div>

                    {/* Back to Home Button - moved outside grid */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.8, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        className="back-to-home-wrapper"
                    >
                        <Link
                            href="/"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                color: isDark ? '#9ca3af' : '#6b7280',
                                fontSize: '0.75rem',
                                fontWeight: '500',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                                backgroundColor: isDark ? '#171717' : 'white',
                                transition: 'all 0.2s ease',
                                textDecoration: 'none'
                            }}
                            onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                                e.currentTarget.style.color = isDark ? 'white' : '#1c1917';
                                e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                                e.currentTarget.style.color = isDark ? '#9ca3af' : '#6b7280';
                                e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="19" y1="12" x2="5" y2="12"></line>
                                <polyline points="12 19 5 12 12 5"></polyline>
                            </svg>
                            Back to Home
                        </Link>
                    </motion.div>
                </section>

                <Webring />
                <div className="footer-spacer compact" />
            </div>
        </div>
    );
}
