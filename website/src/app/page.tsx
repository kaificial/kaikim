"use client";


import Image from 'next/image';
import Link from 'next/link';
import { CSSProperties, ReactNode, useState, useEffect } from 'react';
import { useTheme } from '../components/ThemeContext';
import { useUISound } from '../hooks/use-ui-sound';
import { SpotlightCard } from '../components/SpotlightCard';
import { projects } from '../data/projects';
import { ProjectDescription } from '../components/ProjectDescription';
import Webring from '../components/Webring';
import { motion, AnimatePresence, useScroll, useSpring, useMotionValue, useMotionTemplate } from 'framer-motion';
import { ProjectVideo } from '../components/ProjectVideo';
import HeroPhotoStack from '../components/HeroPhotoStack';
import { GitHubActivity } from '../components/GitHubActivity';

// Helper to get logo URL
const getSkillLogo = (skill: string, isDark: boolean) => {
    const slugMap: Record<string, string> = {
        'JavaScript': 'javascript',
        'TypeScript': 'typescript',
        'HTML/CSS': 'html5',
        'Python': 'python',
        'Java': 'java',
        'Arduino': 'arduino',
        'React': 'react',
        'Next.js': 'nextdotjs',
        'Tailwind CSS': 'tailwindcss',
        'Node.js': 'nodedotjs',
        'Express.js': 'express',
        'MongoDB': 'mongodb',
        'Git': 'git',
        'VS Code': 'visualstudiocode',
        'Canva': 'canva',
        'Figma': 'figma',
        'REST APIs': 'fastapi', // Placeholder/approximate
        'Vite': 'vite'
    };

    const slug = slugMap[skill];
    const color = isDark ? 'E5E7EB' : '111827';

    if (!slug) return null;
    return `https://cdn.simpleicons.org/${slug}/${color}`;
};

const ProjectTitle = ({ project, isDark }: { project: any, isDark: boolean }) => (
    <h3 style={{
        fontSize: '1.375rem',
        fontWeight: 'bold',
        color: isDark ? 'white' : '#1c1917',
        margin: 0
    }}>
        <TextReveal delay={0.22}>{project.title}</TextReveal>
    </h3>
);

type TextRevealProps = {
    children: ReactNode;
    delay?: number;
    as?: keyof typeof motion;
    className?: string;
    style?: CSSProperties;
};

const TextReveal = ({ children, delay = 0, as = 'span', className, style }: TextRevealProps) => {
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

const LiveAge = () => {
    const [age, setAge] = useState<string>('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        //Birthday 
        const birthDate = new Date('2006-12-01T00:00:00').getTime();

        const updateAge = () => {
            const now = new Date().getTime();
            const yearInMs = 31556952000; // 365.2425 days
            const currentAge = (now - birthDate) / yearInMs;
            setAge(currentAge.toFixed(13));
        };

        updateAge();
        const interval = setInterval(updateAge, 50);
        return () => clearInterval(interval);
    }, []);

    return (
        <span style={{ fontVariantNumeric: 'tabular-nums', display: 'inline-block', minWidth: '100px' }}>
            {mounted && age ? age : '19.7...'}
        </span>
    );
};

export default function Home() {
    const { isDark, toggleTheme } = useTheme();
    const { playClick } = useUISound();
    const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);
    const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
    const [isTorontoHovered, setIsTorontoHovered] = useState(false);

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
    const revealBaseDelay = 0.15;
    const revealStep = 0.08;
    const revealDelay = (slot: number) => revealBaseDelay + slot * revealStep;
    const rt = (text: ReactNode, slot: number, className?: string) => (
        <TextReveal delay={revealDelay(slot)} className={className}>
            {text}
        </TextReveal>
    );

    return (
        <div className="w-full homepage-text-reveal">
            <motion.div
                style={{
                    scaleX,
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    backgroundColor: '#2563eb', // Matches "View All Projects" button
                    transformOrigin: '0%',
                    zIndex: 9999
                }}
            />
            {/* 
                Hero Section
            */}
            <section className="hero-section" style={{ position: 'relative', zIndex: 10 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className="hero-layout">

                        {/* Text Container */}
                        <div className="hero-content" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, minWidth: 0 }}>
                            <motion.h1
                                className="hero-title font-bold text-gray-900 dark:text-white tracking-tight leading-none text-left"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2, duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
                                style={{ marginBottom: '4px', marginTop: 0 }}
                            >
                                {rt('Kai Kim', 0, 'text-reveal-hero')}
                            </motion.h1>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.2, duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}
                            >
                                <span className="text-gray-900 dark:text-gray-100 font-medium m-0" style={{ fontSize: '1.1rem' }}>
                                    {rt("CS @ Queen's University", 1)}
                                </span>
                                <motion.div
                                    className="location-pill"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    style={{ position: 'relative', cursor: 'pointer', padding: '2px 8px', fontSize: '0.75rem', opacity: 0.8 }}
                                    onMouseEnter={() => setIsTorontoHovered(true)}
                                    onMouseLeave={() => setIsTorontoHovered(false)}
                                >
                                    <AnimatePresence>
                                        {isTorontoHovered && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                                transition={{ duration: 0.2 }}
                                                style={{
                                                    position: 'absolute',
                                                    bottom: '120%',
                                                    left: '40px',
                                                    transform: 'translateX(-50%)',
                                                    width: '180px',
                                                    height: '110px',
                                                    borderRadius: '12px',
                                                    overflow: 'hidden',
                                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                                                    zIndex: 50,
                                                    pointerEvents: 'none',
                                                    background: isDark ? '#1f2937' : 'white'
                                                }}
                                            >
                                                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                                    <Image
                                                        src="/assets/toto.png"
                                                        alt="Toronto Skyline"
                                                        fill
                                                        sizes="180px"
                                                        style={{ objectFit: 'cover' }}
                                                    />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '10px', height: '10px', opacity: 0.8 }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    {rt('Toronto, ON', 2)}
                                </motion.div>

                            </motion.div>
                        </div>

                        {/* Image Container */}
                        <motion.div
                            style={{ position: 'relative', flexShrink: 0 }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8, duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <HeroPhotoStack isDark={isDark} />
                        </motion.div>
                    </div>


                    {/* Paragraph and Socials */}
                    <div>
                        <motion.div
                            className="text-base sm:text-lg text-gray-800 dark:text-gray-300 text-left"
                            style={{ marginBottom: '12px', width: '100%', lineHeight: 1.6 }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.35, duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                        >
                            {rt("I'm a ", 3)}
                            {rt(<span style={{ color: isDark ? '#9ca3af' : '#4b5563', paddingRight: '4px' }}><LiveAge /> y/o</span>, 3.1)}
                            {rt("who loves building reliable software and exploring new technologies. When I'm not coding, you can find me watching ", 3.2)}{' '}
                            <span
                                className="relative inline-block cursor-pointer"
                                onMouseEnter={() => setHoveredIcon('films')}
                                onMouseLeave={() => setHoveredIcon(null)}
                                style={{ textUnderlineOffset: '4px' }}
                            >
                                {rt(<span style={{ textDecoration: 'underline' }}>movies</span>, 4.2)}
                                <AnimatePresence>
                                    {hoveredIcon === 'films' && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                            transition={{ duration: 0.2 }}
                                            className="absolute bottom-full mb-3 z-50 pointer-events-none rounded-[16px] overflow-hidden shadow-2xl border border-black/10 dark:border-white/10 grid grid-cols-4 gap-0 left-1/2 -translate-x-[85%] lg:-translate-x-1/2 w-[85vw] max-w-[320px] h-[28vw] max-h-[120px]"
                                        >
                                            <div style={{ backgroundImage: 'url(/music/Interstellar.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
                                            <div style={{ backgroundImage: 'url(/music/Drive.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
                                            <div style={{ backgroundImage: 'url(/music/Arrival.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
                                            <div style={{ backgroundImage: 'url(/music/lalaland.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </span>
                            {rt(', ', 4.25)}
                            <span
                                className="relative inline-block cursor-pointer"
                                onMouseEnter={() => setHoveredIcon('shows')}
                                onMouseLeave={() => setHoveredIcon(null)}
                                style={{ textUnderlineOffset: '4px' }}
                            >
                                {rt(<span style={{ textDecoration: 'underline' }}>shows</span>, 4.3)}
                                <AnimatePresence>
                                    {hoveredIcon === 'shows' && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                            transition={{ duration: 0.2 }}
                                            className="absolute bottom-full mb-3 z-50 pointer-events-none rounded-[16px] overflow-hidden shadow-2xl border border-black/10 dark:border-white/10 grid grid-cols-4 gap-0 left-1/2 -translate-x-[90%] lg:-translate-x-1/2 w-[85vw] max-w-[320px] h-[28vw] max-h-[120px]"
                                        >
                                            <div style={{ backgroundImage: 'url(/music/Barry.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
                                            <div style={{ backgroundImage: 'url(/music/Severance.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
                                            <div style={{ backgroundImage: 'url(/music/Breaking\\ Bad.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
                                            <div style={{ backgroundImage: 'url(/music/media/Invincible.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </span>{rt(', discovering new music, or playing racket sports.', 4)}
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Experience Section */}
            <motion.section
                style={{ marginTop: '24px' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.8, duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            >
                <h2 style={{
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    marginBottom: '16px',
                    color: isDark ? 'white' : '#1c1917'
                }}>
                    {rt('Experience', 5)}
                </h2>

                {/* Experience Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {/* CIBC */}
                    <div className="experience-item" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div className="experience-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-start' }}>
                                {/* CIBC Logo */}
                                <div className="experience-logo-container" style={{ width: '48px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                                    <Image
                                        src="/assets/cibc.png"
                                        alt="CIBC Logo"
                                        width={36}
                                        height={36}
                                        style={{
                                            borderRadius: '8px',
                                            objectFit: 'cover',
                                            width: 'auto',
                                            height: 'auto',
                                            filter: isDark ? 'none' : 'invert(1)'
                                        }}
                                    />
                                </div>

                                <div>
                                    <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0px', color: isDark ? 'white' : '#1c1917' }}>
                                        {rt('CIBC', 5.8)}
                                    </h3>
                                    <p style={{ fontSize: '0.875rem', color: isDark ? '#9ca3af' : '#6b7280' }}>
                                        {rt('Intern', 5.85)}
                                    </p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
                                <span className="experience-date" style={{ fontSize: '0.875rem', color: isDark ? '#9ca3af' : '#6b7280', whiteSpace: 'nowrap' }}>
                                    {rt('May 2026 - Aug. 2026', 5.9)}
                                </span>
                                <motion.button
                                    className="experience-btn"
                                    onClick={(e) => { e.stopPropagation(); toggleExpand('cibc'); }}
                                    animate={{
                                        backgroundColor: isDark ? 'rgba(38, 38, 38, 0.8)' : '#E5E7EB',
                                        color: isDark ? '#E5E7EB' : '#111827',
                                        borderColor: isDark ? '#374151' : '#D1D5DB',
                                    }}
                                    whileHover={{
                                        scale: 1.05,
                                        backgroundColor: isDark ? 'rgba(50, 50, 50, 0.9)' : '#d1d5db',
                                        color: isDark ? '#ffffff' : '#111827',
                                        borderColor: isDark ? '#4b5563' : '#9ca3af'
                                    }}
                                    whileTap={{ scale: 0.95 }}
                                    style={{
                                        border: `1px solid ${isDark ? '#374151' : '#D1D5DB'}`,
                                        background: isDark ? 'rgba(38, 38, 38, 0.8)' : '#E5E7EB',
                                        color: isDark ? '#E5E7EB' : '#111827',
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
                                    {expandedItems['cibc'] ? 'Show less' : 'Read more'}
                                    <motion.svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" animate={{ rotate: expandedItems['cibc'] ? 180 : 0 }}>
                                        <path d="M2 4l4 4 4-4" />
                                    </motion.svg>
                                </motion.button>
                            </div>
                        </div>

                        <AnimatePresence>
                            {expandedItems['cibc'] && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                                    <div style={{ marginLeft: '52px', marginTop: '0px', paddingBottom: '12px' }}>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* QMIND */}
                    <div className="experience-item" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div className="experience-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-start' }}>
                                {/* QMIND Logo */}
                                <div className="experience-logo-container" style={{ width: '48px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                                    <Image
                                        src="/assets/QMIND_logo.png"
                                        alt="QMIND Logo"
                                        width={36}
                                        height={36}
                                        style={{
                                            borderRadius: '8px',
                                            objectFit: 'cover'
                                        }}
                                    />
                                </div>

                                <div>
                                    <h3 style={{
                                        fontSize: '1rem',
                                        fontWeight: '600',
                                        marginBottom: '0px',
                                        color: isDark ? 'white' : '#1c1917'
                                    }}>
                                        {rt('QMIND', 5.8)}
                                    </h3>
                                    <p style={{
                                        fontSize: '0.875rem',
                                        color: isDark ? '#9ca3af' : '#6b7280'
                                    }}>
                                        {rt('AI Engineer', 5.9)}
                                    </p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
                                <span className="experience-date" style={{
                                    fontSize: '0.875rem',
                                    color: isDark ? '#9ca3af' : '#6b7280',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {rt('Oct. 2025 - May 2026', 5.95)}
                                </span>
                                <motion.button
                                    className="experience-btn"
                                    onClick={(e) => { e.stopPropagation(); toggleExpand('qmind'); }}
                                    animate={{
                                        backgroundColor: isDark ? 'rgba(38, 38, 38, 0.8)' : '#E5E7EB',
                                        color: isDark ? '#E5E7EB' : '#111827',
                                        borderColor: isDark ? '#374151' : '#D1D5DB',
                                    }}
                                    whileHover={{
                                        scale: 1.05,
                                        backgroundColor: isDark ? 'rgba(50, 50, 50, 0.9)' : '#d1d5db',
                                        color: isDark ? '#ffffff' : '#111827',
                                        borderColor: isDark ? '#4b5563' : '#9ca3af'
                                    }}
                                    whileTap={{ scale: 0.95 }}
                                    style={{
                                        border: `1px solid ${isDark ? '#374151' : '#D1D5DB'}`,
                                        background: isDark ? 'rgba(38, 38, 38, 0.8)' : '#E5E7EB',
                                        color: isDark ? '#E5E7EB' : '#111827',
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
                                    {expandedItems['qmind'] ? 'Show less' : 'Read more'}
                                    <motion.svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" animate={{ rotate: expandedItems['qmind'] ? 180 : 0 }}>
                                        <path d="M2 4l4 4 4-4" />
                                    </motion.svg>
                                </motion.button>
                            </div>
                        </div>

                        <AnimatePresence>
                            {expandedItems['qmind'] && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    style={{ overflow: 'hidden' }}
                                >
                                    <div style={{ marginLeft: '52px', marginTop: '0px', paddingBottom: '12px' }}>
                                        <p style={{ fontSize: '0.875rem', color: isDark ? '#d1d5db' : '#4b5563', marginBottom: '12px' }}>
                                            Engineered a fairness middleware that audits AI agent reasoning to intercept and correct biased tool-selection in real-time. By implementing an Iterative Validation Cycle using LangGraph and Small Language Models (SLMs), we built a scalable framework to ensure equitable outcomes in autonomous agentic workflows.
                                        </p>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '4px', margin: '-4px' }}>
                                            {['Python', 'LangGraph', 'CrewAI', 'MCP', 'DeepEval', 'Gemini', 'Ollama', 'FastAPI'].map((skill, index) => (
                                                <motion.span
                                                    key={index}
                                                    whileHover={{ scale: 1.1, y: -2 }}
                                                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    style={{
                                                        display: 'inline-block',
                                                        cursor: 'default',
                                                        padding: '4px 12px',
                                                        backgroundColor: isDark ? 'rgba(38, 38, 38, 0.8)' : '#E5E7EB',
                                                        color: isDark ? '#E5E7EB' : '#111827',
                                                        border: `1px solid ${isDark ? '#374151' : '#D1D5DB'}`,
                                                        borderRadius: '6px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: '500'
                                                    }}
                                                >
                                                    {skill}
                                                </motion.span>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>



                    {/* QBiT */}
                    <div className="experience-item" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div className="experience-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-start' }}>
                                {/* QBiT Logo */}
                                <div className="experience-logo-container" style={{ width: '48px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                                    <Image
                                        src="/assets/QBiT_Logo-1.png"
                                        alt="QBiT Logo"
                                        width={36}
                                        height={36}
                                        style={{
                                            borderRadius: '8px',
                                            objectFit: 'cover',
                                            width: 'auto',
                                            height: 'auto',
                                            filter: isDark ? 'invert(1)' : 'none'
                                        }}
                                    />
                                </div>

                                <div>
                                    <h3 style={{
                                        fontSize: '1rem',
                                        fontWeight: '600',
                                        marginBottom: '0px',
                                        color: isDark ? 'white' : '#1c1917'
                                    }}>
                                        {rt("QBiT", 6.2)}
                                    </h3>
                                    <p style={{
                                        fontSize: '0.875rem',
                                        color: isDark ? '#9ca3af' : '#6b7280'
                                    }}>
                                        {rt('Software Engineer', 6.25)}
                                    </p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
                                <span className="experience-date" style={{
                                    fontSize: '0.875rem',
                                    color: isDark ? '#9ca3af' : '#6b7280',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {rt('Sept. 2025 - May 2026', 6.3)}
                                </span>
                                <motion.button
                                    className="experience-btn"
                                    onClick={(e) => { e.stopPropagation(); toggleExpand('qbit'); }}
                                    animate={{
                                        backgroundColor: isDark ? 'rgba(38, 38, 38, 0.8)' : '#E5E7EB',
                                        color: isDark ? '#E5E7EB' : '#111827',
                                        borderColor: isDark ? '#374151' : '#D1D5DB',
                                    }}
                                    whileHover={{
                                        scale: 1.05,
                                        backgroundColor: isDark ? 'rgba(50, 50, 50, 0.9)' : '#d1d5db',
                                        color: isDark ? '#ffffff' : '#111827',
                                        borderColor: isDark ? '#4b5563' : '#9ca3af'
                                    }}
                                    whileTap={{ scale: 0.95 }}
                                    style={{
                                        border: `1px solid ${isDark ? '#374151' : '#D1D5DB'}`,
                                        background: isDark ? 'rgba(38, 38, 38, 0.8)' : '#E5E7EB',
                                        color: isDark ? '#E5E7EB' : '#111827',
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
                                    {expandedItems['qbit'] ? 'Show less' : 'Read more'}
                                    <motion.svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" animate={{ rotate: expandedItems['qbit'] ? 180 : 0 }}>
                                        <path d="M2 4l4 4 4-4" />
                                    </motion.svg>
                                </motion.button>
                            </div>
                        </div>

                        <AnimatePresence>
                            {expandedItems['qbit'] && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    style={{ overflow: 'hidden' }}
                                >
                                    <div style={{ marginLeft: '52px', marginTop: '4px' }}>
                                        <p style={{ fontSize: '0.875rem', color: isDark ? '#d1d5db' : '#4b5563', marginBottom: '12px' }}>
                                            Built Iodetect, an integrated IoT diagnostic platform that automates the detection of iodine deficiency through a combination of embedded firmware and cloud based data visualization. The system uses an ESP32 driven hardware interface to process optical sensor data and synchronize results with a centralized Firebase repo, providing health officials with real time insights using a Next.js dashboard.
                                        </p>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {['Next.js', 'TypeScript', 'Firebase', 'ESP32', 'C/C++', 'Tailwind CSS'].map((skill, index) => (
                                                <motion.span
                                                    key={index}
                                                    whileHover={{ scale: 1.1, y: -2 }}
                                                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    style={{
                                                        display: 'inline-block',
                                                        cursor: 'default',
                                                        padding: '4px 12px',
                                                        backgroundColor: isDark ? 'rgba(38, 38, 38, 0.8)' : '#E5E7EB',
                                                        color: isDark ? '#E5E7EB' : '#111827',
                                                        border: `1px solid ${isDark ? '#374151' : '#D1D5DB'}`,
                                                        borderRadius: '6px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: '500'
                                                    }}
                                                >
                                                    {skill}
                                                </motion.span>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div >
                    {/* Zeen */}
                    <div className="experience-item" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div className="experience-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-start' }}>
                                {/* Zeen Logo */}
                                <div className="experience-logo-container" style={{ width: '48px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                                    <Image
                                        src="/assets/zeen.jpg"
                                        alt="Zeen Logo"
                                        width={36}
                                        height={36}
                                        style={{ borderRadius: '8px', objectFit: 'cover' }}
                                    />
                                </div>

                                <div>
                                    <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0px', color: isDark ? 'white' : '#1c1917' }}>
                                        {rt('Zeen', 6.6)}
                                    </h3>
                                    <p style={{ fontSize: '0.875rem', color: isDark ? '#9ca3af' : '#6b7280' }}>
                                        {rt('Software Engineer', 6.65)}
                                    </p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
                                <span className="experience-date" style={{ fontSize: '0.875rem', color: isDark ? '#9ca3af' : '#6b7280', whiteSpace: 'nowrap' }}>
                                    {rt('May 2025 - Aug. 2025', 6.7)}
                                </span>
                                <motion.button
                                    className="experience-btn"
                                    onClick={(e) => { e.stopPropagation(); toggleExpand('zeen'); }}
                                    animate={{
                                        backgroundColor: isDark ? 'rgba(38, 38, 38, 0.8)' : '#E5E7EB',
                                        color: isDark ? '#E5E7EB' : '#111827',
                                        borderColor: isDark ? '#374151' : '#D1D5DB',
                                    }}
                                    whileHover={{
                                        scale: 1.05,
                                        backgroundColor: isDark ? 'rgba(50, 50, 50, 0.9)' : '#d1d5db',
                                        color: isDark ? '#ffffff' : '#111827',
                                        borderColor: isDark ? '#4b5563' : '#9ca3af'
                                    }}
                                    whileTap={{ scale: 0.95 }}
                                    style={{
                                        border: `1px solid ${isDark ? '#374151' : '#D1D5DB'}`,
                                        background: isDark ? 'rgba(38, 38, 38, 0.8)' : '#E5E7EB',
                                        color: isDark ? '#E5E7EB' : '#111827',
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
                                    {expandedItems['zeen'] ? 'Show less' : 'Read more'}
                                    <motion.svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" animate={{ rotate: expandedItems['zeen'] ? 180 : 0 }}>
                                        <path d="M2 4l4 4 4-4" />
                                    </motion.svg>
                                </motion.button>
                            </div>
                        </div>

                        <AnimatePresence>
                            {expandedItems['zeen'] && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                                    <div style={{ marginLeft: '52px', marginTop: '0px', paddingBottom: '12px' }}>
                                        <p style={{ fontSize: '0.875rem', color: isDark ? '#d1d5db' : '#4b5563', marginBottom: '12px' }}>
                                            Built and shipped features across the full stack for Zeen&apos;s B2B SaaS platform. Owned a redesign of the document parsing pipeline, reducing processing latency by 40%. Contributed to a real-time collaboration layer using WebSockets, and helped migrate a legacy REST API surface to a GraphQL schema shared across web and mobile clients.
                                        </p>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '4px', margin: '-4px' }}>
                                            {['React', 'TypeScript', 'Node.js', 'GraphQL', 'PostgreSQL', 'Redis', 'WebSockets', 'AWS S3', 'Docker', 'REST APIs'].map((skill, index) => (
                                                <motion.span key={index} whileHover={{ scale: 1.1, y: -2 }} transition={{ type: "spring", stiffness: 400, damping: 10 }} whileTap={{ scale: 0.95 }} style={{ display: 'inline-block', cursor: 'default', padding: '4px 12px', backgroundColor: isDark ? 'rgba(38, 38, 38, 0.8)' : '#E5E7EB', color: isDark ? '#E5E7EB' : '#111827', border: `1px solid ${isDark ? '#374151' : '#D1D5DB'}`, borderRadius: '6px', fontSize: '0.75rem', fontWeight: '500' }}>
                                                    {skill}
                                                </motion.span>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* View More LinkedIn Button */}
                    <div style={{ marginTop: '0px', display: 'flex', justifyContent: 'flex-start', marginLeft: '8px' }}>
                        <Link href="https://www.linkedin.com/in/newjeans/" target="_blank" rel="noopener noreferrer" style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.7rem',
                            fontWeight: '500',
                            color: isDark ? '#E5E7EB' : '#111827',
                            textDecoration: 'none',
                            backgroundColor: isDark ? 'rgba(38, 38, 38, 0.8)' : '#E5E7EB',
                            border: `1px solid ${isDark ? '#374151' : '#D1D5DB'}`,
                            padding: '4px 10px',
                            borderRadius: '8px',
                            transition: 'opacity 0.2s'
                        }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
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


            {/* Education Section */}
            <motion.section
                style={{ marginTop: '32px' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.2, duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            >
                <h2 style={{
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    marginBottom: '8px',
                    color: isDark ? 'white' : '#1c1917'
                }}>
                    {rt('Education', 6)}
                </h2>

                <div style={{
                    border: `1px solid ${isDark ? '#374151' : '#D1D5DB'}`,
                    backgroundColor: isDark ? '#111110' : '#ffffff',
                    borderRadius: '12px',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: isDark
                        ? '0 0 0 4px #111110, 0 0 0 5px #374151'
                        : '0 0 0 4px #f5f5f4, 0 0 0 5px #D1D5DB',
                    margin: '2px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Image
                            src="/assets/queens.png"
                            alt="Queen's University Logo"
                            width={36}
                            height={36}
                            priority
                            style={{
                                objectFit: 'contain',
                                width: 'auto',
                                filter: 'none'
                            }}
                        />
                        <div>
                            <h3 style={{
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                marginBottom: '0px',
                                color: isDark ? 'white' : '#1c1917'
                            }}>
                                {rt("Queen's University", 7.2)}
                            </h3>
                            <p style={{
                                fontSize: '0.75rem',
                                color: isDark ? '#9ca3af' : '#6b7280'
                            }}>
                                {rt('Bachelor of Computing', 7.4)}
                            </p>
                        </div>
                    </div>

                    <span style={{
                        fontSize: '0.75rem',
                        color: isDark ? '#9ca3af' : '#6b7280',
                        fontWeight: '500'
                    }}>
                        {rt('2028', 7.5)}
                    </span>
                </div>
            </motion.section>

            {/* Skills Section */}
            <motion.section
                style={{ marginTop: '48px' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.6, duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            >
                <h2 style={{
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    marginBottom: '16px',
                    color: isDark ? 'white' : '#1c1917'
                }}>
                    {rt('Skills', 7)}
                </h2>

                <motion.div
                    style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={{
                        visible: {
                            transition: {
                                staggerChildren: 0.2
                            }
                        }
                    }}
                >
                    {/* Frontend & Frameworks */}
                    <motion.div variants={{
                        hidden: { opacity: 0, y: 10 },
                        visible: { opacity: 1, y: 0 }
                    }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '500', marginBottom: '8px', color: isDark ? 'white' : '#1c1917' }}>{rt('Frontend & Frameworks', 7.6)}</h3>
                        <motion.div
                            style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}
                            variants={{
                                visible: {
                                    transition: {
                                        staggerChildren: 0.05
                                    }
                                }
                            }}
                        >
                            {['React', 'Next.js', 'TypeScript', 'JavaScript', 'Tailwind CSS', 'HTML/CSS', 'Framer Motion'].map((skill, index) => {
                                const logoUrl = getSkillLogo(skill, isDark);
                                return (
                                    <motion.span
                                        key={index}
                                        variants={{
                                            hidden: { opacity: 0, scale: 0.8 },
                                            visible: { opacity: 1, scale: 1 }
                                        }}
                                        whileHover={{ scale: 1.1, y: -2 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                        whileTap={{ scale: 0.95 }}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            cursor: 'default',
                                            padding: '4px 10px',
                                            backgroundColor: isDark ? 'rgba(38, 38, 38, 0.8)' : '#E5E7EB',
                                            color: isDark ? '#E5E7EB' : '#111827',
                                            borderRadius: '9999px',
                                            fontSize: '0.75rem',
                                            fontWeight: '500',
                                            border: `1px solid ${isDark ? '#374151' : '#D1D5DB'}`
                                        }}
                                    >
                                        {logoUrl ? (
                                            <img src={logoUrl} alt="" style={{ width: '13px', height: '13px' }} />
                                        ) : (
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="16 18 22 12 16 6"></polyline>
                                                <polyline points="8 6 2 12 8 18"></polyline>
                                            </svg>
                                        )}
                                        <TextReveal delay={revealDelay(8.1 + index * 0.04)}>{skill}</TextReveal>
                                    </motion.span>
                                )
                            })}
                        </motion.div>
                    </motion.div>

                    {/* Backend & Databases */}
                    <motion.div variants={{
                        hidden: { opacity: 0, y: 10 },
                        visible: { opacity: 1, y: 0 }
                    }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '500', marginBottom: '8px', color: isDark ? 'white' : '#1c1917' }}>{rt('Backend & Databases', 7.8)}</h3>
                        <motion.div
                            style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}
                            variants={{
                                visible: {
                                    transition: {
                                        staggerChildren: 0.05
                                    }
                                }
                            }}
                        >
                            {['Node.js', 'Express.js', 'Python', 'Java', 'Spring Boot', 'MongoDB', 'PostgreSQL', 'REST APIs'].map((skill, index) => {
                                const logoUrl = getSkillLogo(skill, isDark);
                                return (
                                    <motion.span
                                        key={index}
                                        variants={{
                                            hidden: { opacity: 0, scale: 0.8 },
                                            visible: { opacity: 1, scale: 1 }
                                        }}
                                        whileHover={{ scale: 1.1, y: -2 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                        whileTap={{ scale: 0.95 }}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            cursor: 'default',
                                            padding: '4px 10px',
                                            backgroundColor: isDark ? 'rgba(38, 38, 38, 0.8)' : '#E5E7EB',
                                            color: isDark ? '#E5E7EB' : '#111827',
                                            borderRadius: '9999px',
                                            fontSize: '0.75rem',
                                            fontWeight: '500',
                                            border: `1px solid ${isDark ? '#374151' : '#D1D5DB'}`
                                        }}
                                    >
                                        {logoUrl ? (
                                            <img src={logoUrl} alt="" style={{ width: '13px', height: '13px' }} />
                                        ) : (
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="16 18 22 12 16 6"></polyline>
                                                <polyline points="8 6 2 12 8 18"></polyline>
                                            </svg>
                                        )}
                                        <TextReveal delay={revealDelay(8.5 + index * 0.04)}>{skill}</TextReveal>
                                    </motion.span>
                                )
                            })}
                        </motion.div>
                    </motion.div>

                    {/* Tools & Technologies */}
                    <motion.div variants={{
                        hidden: { opacity: 0, y: 10 },
                        visible: { opacity: 1, y: 0 }
                    }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '500', marginBottom: '8px', color: isDark ? 'white' : '#1c1917' }}>{rt('Tools & Technologies', 8)}</h3>
                        <motion.div
                            style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}
                            variants={{
                                visible: {
                                    transition: {
                                        staggerChildren: 0.05
                                    }
                                }
                            }}
                        >
                            {['Git', 'GitHub', 'VS Code', 'Figma', 'Canva', 'Docker', 'AWS', 'Vercel', 'Vite'].map((skill, index) => {
                                const logoUrl = getSkillLogo(skill, isDark);
                                return (
                                    <motion.span
                                        key={index}
                                        variants={{
                                            hidden: { opacity: 0, scale: 0.8 },
                                            visible: { opacity: 1, scale: 1 }
                                        }}
                                        whileHover={{ scale: 1.1, y: -2 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                        whileTap={{ scale: 0.95 }}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            cursor: 'default',
                                            padding: '4px 10px',
                                            backgroundColor: isDark ? 'rgba(38, 38, 38, 0.8)' : '#E5E7EB',
                                            color: isDark ? '#E5E7EB' : '#111827',
                                            borderRadius: '9999px',
                                            fontSize: '0.75rem',
                                            fontWeight: '500',
                                            border: `1px solid ${isDark ? '#374151' : '#D1D5DB'}`
                                        }}
                                    >
                                        {logoUrl ? (
                                            <img src={logoUrl} alt="" style={{ width: '13px', height: '13px' }} />
                                        ) : (
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="16 18 22 12 16 6"></polyline>
                                                <polyline points="8 6 2 12 8 18"></polyline>
                                            </svg>
                                        )}
                                        <TextReveal delay={revealDelay(8.9 + index * 0.04)}>{skill}</TextReveal>
                                    </motion.span>
                                )
                            })}
                        </motion.div>
                    </motion.div>
                </motion.div>
            </motion.section>

            {/* GitHub Activity */}
            <motion.section
                style={{ marginTop: '32px' }}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            >
                <GitHubActivity username="kaificial" />
            </motion.section>

            {/* Featured Projects Section */}
            <motion.section
                style={{ marginTop: '48px' }}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
                <h2 style={{
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    marginBottom: '24px',
                    color: isDark ? 'white' : '#1c1917'
                }}>
                    {rt('Featured Projects', 8)}
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                    {projects.filter(p => p.id !== 'portfolio').map((project) => (
                        <SpotlightCard key={project.id} isDark={isDark}>
                            <div className="grid grid-cols-1 sm:grid-cols-[300px_1fr] gap-[20px]">
                                {/* Left: Preview Image/Video */}
                                <div style={{
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                                    backgroundColor: project.solidColor || (isDark ? '#171717' : '#f8f9fa'),
                                    aspectRatio: project.id === 'rooke' ? '1512/738' :
                                        project.id === 'texify' ? '1996/1080' :
                                            project.id === 'portfolio' ? '1500/742' :
                                                project.id === 'scribl' ? '2220/1080' :
                                                    project.id === 'clairo' ? '1498/744' :
                                                        project.id === 'macrodata-refinement' ? 'auto' : '16/10',
                                    alignSelf: 'start',
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
                                            sizes="(max-width: 640px) 90vw, 420px"
                                            style={{ objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <span style={{ fontSize: '2.5rem', opacity: 0.3 }}>{project.icon}</span>
                                    )}
                                </div>

                                {/* Right: Content */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {/* Header with title and status */}
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '4px' }}>
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
                                                }}><TextReveal delay={revealDelay(9.2)}>{project.status}</TextReveal></span>
                                            </div>
                                        </div>
                                        <p style={{
                                            fontSize: '0.8125rem',
                                            color: isDark ? '#9ca3af' : '#6b7280',
                                            lineHeight: '1.5',
                                            margin: 0
                                        }}>
                                            <TextReveal delay={revealDelay(9.3)}>{project.description}</TextReveal>
                                        </p>
                                    </div>

                                    {/* Tech Stack */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
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
                                                    fontSize: '0.7rem',
                                                    fontWeight: '500',
                                                    border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`
                                                }}
                                            >
                                                <TextReveal delay={revealDelay(9.4 + i * 0.04)}>{tech}</TextReveal>
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
                                            {rt('View Details', 9.6)}
                                            <svg className="transition-transform duration-300 ease-out group-hover:-rotate-45" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M5 12h14"></path>
                                                <path d="M12 5l7 7-7 7"></path>
                                            </svg>
                                        </Link>

                                        <div style={{ display: 'flex', gap: '10px' }}>
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
                                                {rt('Demo', 9.7)}
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
                                                    border: `1px solid ${isDark ? '#374151' : '#d1d5db'}`
                                                }}
                                            >
                                                <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                                </svg>
                                                {rt('GitHub', 9.75)}
                                            </motion.a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </SpotlightCard>
                    ))}
                </div>

                <div style={{ marginTop: '16px', textAlign: 'left' }}>
                    <Link href="/projects" style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        color: isDark ? '#E5E7EB' : '#111827',
                        textDecoration: 'none',
                        backgroundColor: isDark ? 'rgba(38, 38, 38, 0.8)' : '#E5E7EB',
                        border: `1px solid ${isDark ? '#374151' : '#D1D5DB'}`,
                        padding: '7px 16px',
                        borderRadius: '8px',
                        transition: 'opacity 0.2s'
                    }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    >
                        {rt('View All Projects', 9.9)}
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14"></path>
                            <path d="M12 5l7 7-7 7"></path>
                        </svg>
                    </Link>
                </div>
            </motion.section>

            {/* Blank Footer Space */}
            <div style={{ height: '12px' }} />
            <Webring />
            <div className="footer-spacer" />
        </div>
    );
}

