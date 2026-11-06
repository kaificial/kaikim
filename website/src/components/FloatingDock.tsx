"use client";

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Fragment, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from './ThemeContext';
import { sfx } from '../lib/sfx';
import { SpeakerIcon, setSfxMuted, useSfxMuted } from '../lib/sfx/react';
import { HOVER_ICON, mouseOnly, PRESS, TOOLTIP } from '../styles/motion';
import { getLenis } from './SmoothScroll';

// smooth scroll back to the top
const scrollToTop = () => {
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(0, { duration: 1.1 });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
};

interface TooltipProps {
    text: string;
}

// matches the photo captions in the hero
const Tooltip = ({ text }: TooltipProps) => {
    const { isDark } = useTheme();
    const bg = isDark ? '#181818' : 'white';
    const border = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
    return (
        <motion.div
            initial={{ ...TOOLTIP.initial, x: '-50%' }}
            animate={{ ...TOOLTIP.animate, x: '-50%' }}
            exit={{ ...TOOLTIP.exit, x: '-50%' }}
            style={{
                transformOrigin: 'bottom center',
                position: 'absolute',
                bottom: 'calc(100% + 12px)',
                left: '50%',
                backgroundColor: bg,
                color: isDark ? '#f5f5f5' : '#1f2937',
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 600,
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                border: `1px solid ${border}`,
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                zIndex: 1001
            }}
        >
            {text}
            <div style={{
                position: 'absolute',
                bottom: '-5px',
                left: 'calc(50% - 5px)',
                width: '10px',
                height: '10px',
                backgroundColor: bg,
                transform: 'rotate(45deg)',
                borderBottom: `1px solid ${border}`,
                borderRight: `1px solid ${border}`,
            }} />
        </motion.div>
    );
};

const DockDivider = () => {
    const { isDark } = useTheme();
    return (
        <motion.div
            variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }}
            className="mobile-hide"
            style={{ width: '1px', height: '20px', backgroundColor: isDark ? '#3a3a3a' : '#d1d5db', margin: '0 4px', flexShrink: 0 }}
        />
    );
};

export default function FloatingDock() {
    const pathname = usePathname();
    const router = useRouter();
    const { isDark, toggleTheme } = useTheme();
    const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);
    const soundMuted = useSfxMuted();
    // each dock slot is a note in the scale, so sweeping across the dock plays it
    const DEGREE: Record<string, number> = { command: 0, home: 1, projects: 2, writing: 3, github: 4, x: 5, linkedin: 6, resume: 7, contact: 8, sound: 9, theme: 10 };
    const enter = (id: string) => mouseOnly(() => { setHoveredIcon(id); sfx.hover({ degree: DEGREE[id] }); });

    const handleHomeClick = () => {
        if (pathname === '/') {
            // Already on home page just scroll to top
            scrollToTop();
        } else {
            // Navigate to home and scroll to top
            router.push('/');
            setTimeout(() => {
                scrollToTop();
            }, 100);
        }
    };

    const handleProjectsClick = () => {
        if (pathname === '/projects') {
            // Already on projects page just scroll to top
            scrollToTop();
        } else {
            // Navigate to projects and scroll to top
            router.push('/projects');
            setTimeout(() => {
                scrollToTop();
            }, 100);
        }
    };

    const handleWritingClick = () => {
        if (pathname === '/writing') {
            scrollToTop();
        } else {
            router.push('/writing');
            setTimeout(() => {
                scrollToTop();
            }, 100);
        }
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={{
                hidden: { opacity: 0, x: '-50%' },
                visible: {
                    opacity: 1,
                    x: '-50%',
                    transition: {
                        duration: 1.4,
                        delay: 2.4, // Increased delay to appear after page content
                        ease: [0.22, 1, 0.36, 1],
                        staggerChildren: 0.08,
                        delayChildren: 2.8 // Delay for icons to start popping in
                    }
                }
            }}
            style={{
                position: 'fixed',
                bottom: '24px',
                left: '50%',
                backgroundColor: isDark ? 'rgba(16, 16, 16, 0.82)' : 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(16px)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}`,
                padding: '6px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.25)',
                zIndex: 1000
            }}
            className="floating-dock"
        >
            {/* Command palette trigger (ctrl K) hidden on mobile (no keyboard) */}
            <motion.div
                className="mobile-hide"
                variants={{
                    hidden: { opacity: 0, scale: 0.95, y: 10 },
                    visible: { opacity: 1, scale: 1, y: 0 }
                }}
                onPointerEnter={enter('command')}
                onPointerLeave={mouseOnly(() => setHoveredIcon(null))}
                whileHover={HOVER_ICON}
                whileTap={PRESS}
                style={{ position: 'relative' }}
            >
                <button
                    onClick={() => { window.dispatchEvent(new Event('open-command-palette')); }}
                    aria-label="Open command palette"
                    style={{
                        backgroundColor: hoveredIcon === 'command' ? (isDark ? '#2a2a2a' : '#f3f4f6') : 'transparent',
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: hoveredIcon === 'command' ? (isDark ? '#f5f5f5' : 'black') : (isDark ? '#8f8f8f' : '#6b7280'),
                        transition: 'background-color 0.2s var(--ease-out), border-color 0.2s var(--ease-out), color 0.2s var(--ease-out), box-shadow 0.2s var(--ease-out), opacity 0.2s var(--ease-out)',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0
                    }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"></path>
                    </svg>
                </button>
                <AnimatePresence>
                    {hoveredIcon === 'command' && <Tooltip text="Command  ⌘K" />}
                </AnimatePresence>
            </motion.div>

            <motion.div
                className="mobile-hide"
                variants={{
                    hidden: { opacity: 0, scale: 0.95 },
                    visible: { opacity: 1, scale: 1 }
                }}
                style={{ width: '1px', height: '20px', backgroundColor: isDark ? '#3a3a3a' : '#d1d5db', margin: '0 4px' }}
            />

            {/* Home */}
            <motion.div
                variants={{
                    hidden: { opacity: 0, scale: 0.95, y: 10 },
                    visible: { opacity: 1, scale: 1, y: 0 }
                }}
                onPointerEnter={enter('home')}
                onPointerLeave={mouseOnly(() => setHoveredIcon(null))}
                whileHover={HOVER_ICON}
                whileTap={PRESS}
                style={{ position: 'relative' }}
            >
                <button
                    onClick={() => { sfx.press({ degree: DEGREE.home }); handleHomeClick(); }}
                    style={{
                        backgroundColor: (pathname === "/" || hoveredIcon === "home") ? (isDark ? '#2a2a2a' : '#f3f4f6') : 'transparent',
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: (pathname === "/" && !isDark) ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                        color: (pathname === "/" || hoveredIcon === "home") ? (isDark ? '#f5f5f5' : 'black') : (isDark ? '#8f8f8f' : '#6b7280'),
                        transition: 'background-color 0.2s var(--ease-out), border-color 0.2s var(--ease-out), color 0.2s var(--ease-out), box-shadow 0.2s var(--ease-out), opacity 0.2s var(--ease-out)',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0
                    }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                </button>
                <AnimatePresence>
                    {hoveredIcon === 'home' && <Tooltip text="Home" />}
                </AnimatePresence>
            </motion.div>

            {/* Projects */}
            <motion.div
                variants={{
                    hidden: { opacity: 0, scale: 0.95, y: 10 },
                    visible: { opacity: 1, scale: 1, y: 0 }
                }}
                onPointerEnter={enter('projects')}
                onPointerLeave={mouseOnly(() => setHoveredIcon(null))}
                whileHover={HOVER_ICON}
                whileTap={PRESS}
                style={{ position: 'relative' }}
            >
                <button
                    onClick={() => { sfx.press({ degree: DEGREE.projects }); handleProjectsClick(); }}
                    style={{
                        backgroundColor: (pathname === "/projects" || hoveredIcon === "projects") ? (isDark ? '#2a2a2a' : '#f3f4f6') : 'transparent',
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: (pathname === "/projects" && !isDark) ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                        color: (pathname === "/projects" || hoveredIcon === "projects") ? (isDark ? '#f5f5f5' : 'black') : (isDark ? '#8f8f8f' : '#6b7280'),
                        transition: 'background-color 0.2s var(--ease-out), border-color 0.2s var(--ease-out), color 0.2s var(--ease-out), box-shadow 0.2s var(--ease-out), opacity 0.2s var(--ease-out)',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0
                    }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <polyline points="9 10 11 12 9 14"></polyline>
                        <line x1="13" y1="14" x2="17" y2="14"></line>
                    </svg>
                </button>
                <AnimatePresence>
                    {hoveredIcon === 'projects' && <Tooltip text="Projects" />}
                </AnimatePresence>
            </motion.div>

            {/* Writing */}
            <motion.div
                variants={{
                    hidden: { opacity: 0, scale: 0.95, y: 10 },
                    visible: { opacity: 1, scale: 1, y: 0 }
                }}
                onPointerEnter={enter('writing')}
                onPointerLeave={mouseOnly(() => setHoveredIcon(null))}
                whileHover={HOVER_ICON}
                whileTap={PRESS}
                style={{ position: 'relative' }}
            >
                <button
                    onClick={() => { sfx.press({ degree: DEGREE.writing }); handleWritingClick(); }}
                    style={{
                        backgroundColor: (pathname === "/writing" || hoveredIcon === "writing") ? (isDark ? '#2a2a2a' : '#f3f4f6') : 'transparent',
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: (pathname === "/writing" && !isDark) ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                        color: (pathname === "/writing" || hoveredIcon === "writing") ? (isDark ? '#f5f5f5' : 'black') : (isDark ? '#8f8f8f' : '#6b7280'),
                        transition: 'background-color 0.2s var(--ease-out), border-color 0.2s var(--ease-out), color 0.2s var(--ease-out), box-shadow 0.2s var(--ease-out), opacity 0.2s var(--ease-out)',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0
                    }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </button>
                <AnimatePresence>
                    {hoveredIcon === 'writing' && <Tooltip text="Notes" />}
                </AnimatePresence>
            </motion.div>

            <motion.div
                variants={{
                    hidden: { opacity: 0, scale: 0.95 },
                    visible: { opacity: 1, scale: 1 }
                }}
                className="mobile-hide"
                style={{ width: '1px', height: '20px', backgroundColor: isDark ? '#3a3a3a' : '#d1d5db', margin: '0 4px' }}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {[
                    { id: 'github', href: "https://github.com/kaificial", label: 'GitHub', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg> },
                    { id: 'x', href: "https://x.com/kaikimto", label: 'X', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg> },
                    { id: 'linkedin', href: "https://linkedin.com/in/newjeans", label: 'LinkedIn', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg> },
                    { id: 'resume', href: "/resume", label: 'Resume', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> },
                    { id: 'contact', href: "mailto:kaikimto@gmail.com", label: 'Mail: kaikimto@gmail.com', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg> }
                ].map((social) => (
                    <Fragment key={social.id}>
                    {social.id === 'resume' && <DockDivider />}
                    <motion.a
                        variants={{
                            hidden: { opacity: 0, scale: 0.95, y: 10 },
                            visible: { opacity: 1, scale: 1, y: 0 }
                        }}
                        onPointerEnter={enter(social.id)}
                        onPointerLeave={mouseOnly(() => setHoveredIcon(null))}
                        whileHover={HOVER_ICON}
                        whileTap={PRESS}
                        onClick={() => sfx.press({ degree: DEGREE[social.id] })}
                        href={social.href}
                        target={social.href.startsWith('http') ? "_blank" : undefined}
                        rel={social.href.startsWith('http') ? "noopener noreferrer" : undefined}
                        style={{ position: 'relative', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDark ? '#8f8f8f' : '#6b7280' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                            {social.icon}
                        </div>
                        <AnimatePresence>
                            {hoveredIcon === social.id && <Tooltip text={social.label} />}
                        </AnimatePresence>
                    </motion.a>
                    </Fragment>
                ))}
            </div>

            <DockDivider />

            {/* sound effects on/off (remembered per device) */}
            <motion.button
                variants={{
                    hidden: { opacity: 0, scale: 0.95, y: 10 },
                    visible: { opacity: 1, scale: 1, y: 0 }
                }}
                onPointerEnter={enter('sound')}
                onPointerLeave={mouseOnly(() => setHoveredIcon(null))}
                whileHover={HOVER_ICON}
                whileTap={PRESS}
                onClick={() => setSfxMuted(!soundMuted)}
                aria-label={soundMuted ? 'Turn sound effects on' : 'Turn sound effects off'}
                aria-pressed={!soundMuted}
                style={{
                    position: 'relative',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isDark ? '#8f8f8f' : '#6b7280',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0
                }}
            >
                <SpeakerIcon muted={soundMuted} size={24} filled />
                <AnimatePresence>
                    {hoveredIcon === 'sound' && <Tooltip text={soundMuted ? "Sound On" : "Sound Off"} />}
                </AnimatePresence>
            </motion.button>
            <motion.button
                variants={{
                    hidden: { opacity: 0, scale: 0.95, y: 10 },
                    visible: { opacity: 1, scale: 1, y: 0 }
                }}
                onPointerEnter={enter('theme')}
                onPointerLeave={mouseOnly(() => setHoveredIcon(null))}
                whileHover={HOVER_ICON}
                whileTap={PRESS}
                onClick={() => { toggleTheme(); }}
                style={{
                    position: 'relative',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isDark ? '#8f8f8f' : '#6b7280',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0
                }}
            >
                {isDark ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="5" fill="currentColor"></circle>
                        <line x1="12" y1="1" x2="12" y2="3"></line>
                        <line x1="12" y1="21" x2="12" y2="23"></line>
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                        <line x1="1" y1="12" x2="3" y2="12"></line>
                        <line x1="21" y1="12" x2="23" y2="12"></line>
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                    </svg>
                ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                    </svg>
                )}
                <AnimatePresence>
                    {hoveredIcon === 'theme' && <Tooltip text={isDark ? "Light Mode" : "Dark Mode"} />}
                </AnimatePresence>
            </motion.button>

        </motion.div >
    );
}
