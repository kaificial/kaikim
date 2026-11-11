"use client";

import Image from 'next/image';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { SpotlightCard } from '../SpotlightCard';
import { ProjectVideo } from '../ProjectVideo';
import { useTheme } from '../ThemeContext';
import { cssVar } from '../../styles/palette';
import type { Project } from '../../data/projects';
import { revealDelay, TextReveal } from './TextReveal';
import { HOVER_PILL, mouseOnly, PRESS } from '../../styles/motion';
import { sfx } from '../../lib/sfx';

const STATUS_DOT: Record<string, string> = {
    Live: '#3b82f6',
    Building: '#eab308',
    Archived: '#9ca3af'
};

const MAX_VISIBLE_TAGS = 5;
const HOVER_ACCENT = '#2563eb';

const GITHUB_PATH = "M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z";

export const ProjectCard = ({ project, index }: { project: Project; index: number }) => {
    const { isDark } = useTheme();
    const [showAllTags, setShowAllTags] = useState(false);

    // cards reveal one after another, not all at once
    const base = 8.6 + index * 0.5;
    const slot = (offset: number) => revealDelay(base + offset);

    const visibleTags = showAllTags ? project.tags : project.tags.slice(0, MAX_VISIBLE_TAGS);
    const hiddenTagCount = project.tags.length - visibleTags.length;

    const linkGlow = isDark
        ? '0 0 20px rgba(59, 130, 246, 0.55), 0 0 40px rgba(59, 130, 246, 0.25)'
        : '0 0 20px rgba(37, 99, 235, 0.4), 0 0 40px rgba(37, 99, 235, 0.18)';

    return (
        <SpotlightCard isDark={isDark} noPadding>
            {/* preview reel goes full width so the demo ui is readable */}
            <div style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '2 / 1',
                overflow: 'hidden',
                borderBottom: `1px solid ${cssVar.border}`,
                backgroundColor: project.solidColor || (isDark ? '#080808' : '#f8f9fa')
            }}>
                {project.video ? (
                    <ProjectVideo
                        src={project.video}
                        resetTime={project.resetTime ?? 0}
                        startTime={project.startTime ?? 0}
                        endTime={project.endTime}
                        autoLoop
                        showProgress
                    />
                ) : project.image ? (
                    <Image
                        src={project.image}
                        alt={`${project.title} preview`}
                        fill
                        sizes="(max-width: 768px) 100vw, 700px"
                        style={{ objectFit: 'cover' }}
                    />
                ) : (
                    <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2.5rem',
                        opacity: 0.3
                    }}>{project.icon}</div>
                )}

                {/* status sits on top of the reel so it doesn't fight with the title */}
                <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    zIndex: 25,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(10, 10, 10, 0.62)',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    pointerEvents: 'none'
                }}>
                    <div
                        className="status-dot-pulse"
                        style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: STATUS_DOT[project.status] || '#9ca3af'
                        }}
                    />
                    <span style={{
                        color: '#f3f4f6',
                        fontSize: '0.6875rem',
                        fontWeight: 500,
                        letterSpacing: '0.02em',
                        whiteSpace: 'nowrap'
                    }}>{project.status}</span>
                </div>
            </div>

            {/* details */}
            <div style={{
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                flex: 1
            }}>
                <h3 style={{
                    fontSize: '1.375rem',
                    fontWeight: 'bold',
                    color: cssVar.textStrong,
                    margin: 0,
                    lineHeight: 1.2
                }}>
                    <TextReveal delay={slot(0)}>{project.title}</TextReveal>
                </h3>

                <p style={{
                    fontSize: '0.8125rem',
                    color: cssVar.textMuted,
                    lineHeight: 1.55,
                    margin: 0
                }}>
                    <TextReveal delay={slot(0.1)}>{project.description}</TextReveal>
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                    {visibleTags.map((tech, i) => (
                        <motion.span
                            key={tech}
                            style={{
                                display: 'inline-block',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                backgroundColor: cssVar.tagBg,
                                color: cssVar.tagFg,
                                fontSize: '0.7rem',
                                fontWeight: 500,
                                border: `1px solid ${cssVar.border}`
                            }}
                        >
                            <TextReveal delay={slot(0.2 + i * 0.04)}>{tech}</TextReveal>
                        </motion.span>
                    ))}

                    {/* long stacks stay collapsed so cards stay the same height */}
                    {(hiddenTagCount > 0 || showAllTags) && (
                        <button
                            type="button"
                            onClick={() => { sfx.pop(); setShowAllTags(v => !v); }}
                            aria-expanded={showAllTags}
                            style={{
                                padding: '4px 10px',
                                borderRadius: '6px',
                                backgroundColor: 'transparent',
                                color: cssVar.textMuted,
                                fontSize: '0.7rem',
                                fontWeight: 500,
                                border: `1px dashed ${cssVar.border}`,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                transition: 'color 0.2s var(--ease-out), border-color 0.2s var(--ease-out)'
                            }}
                            onPointerEnter={mouseOnly((e) => { e.currentTarget.style.color = HOVER_ACCENT; e.currentTarget.style.borderColor = HOVER_ACCENT; })}
                            onPointerLeave={mouseOnly((e) => { e.currentTarget.style.color = cssVar.textMuted; e.currentTarget.style.borderColor = cssVar.border; })}
                        >
                            {showAllTags ? 'show less' : `+${hiddenTagCount} more`}
                        </button>
                    )}
                </div>

                {(project.demo || project.github) && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '12px',
                    flexWrap: 'wrap',
                    marginTop: 'auto',
                    paddingTop: '12px',
                    borderTop: `1px solid ${cssVar.border}`
                }}>
                    {/* only show the links a project actually has */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {project.demo && (
                            <motion.a
                                href={project.demo}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`Open the ${project.title} live demo`}
                                whileHover={{ ...HOVER_PILL, boxShadow: linkGlow }}
                                whileTap={PRESS}
                                style={{
                                    padding: '6px 12px',
                                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
                                    color: isDark ? '#e6e6e6' : '#1f2937',
                                    border: `1px solid ${cssVar.chipBorder}`,
                                    borderRadius: '8px',
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    textDecoration: 'none'
                                }}
                            >
                                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                <TextReveal delay={slot(0.5)}>Demo</TextReveal>
                            </motion.a>
                        )}

                        {project.github && (
                            <motion.a
                                href={project.github}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`View the ${project.title} source on GitHub`}
                                whileHover={{ ...HOVER_PILL, boxShadow: linkGlow }}
                                whileTap={PRESS}
                                transition={{ duration: 0.2 }}
                                style={{
                                    padding: '6px 12px',
                                    backgroundColor: isDark ? '#2a2a2a' : '#f3f4f6',
                                    color: isDark ? '#f5f5f5' : '#1f2937',
                                    borderRadius: '8px',
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    textDecoration: 'none',
                                    border: `1px solid ${cssVar.chipBorder}`
                                }}
                            >
                                <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                                    <path d={GITHUB_PATH} />
                                </svg>
                                <TextReveal delay={slot(0.55)}>GitHub</TextReveal>
                            </motion.a>
                        )}
                    </div>
                </div>
                )}
            </div>
        </SpotlightCard>
    );
};
