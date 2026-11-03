"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./ThemeContext";
import { useUISound } from "../hooks/use-ui-sound";
import { mouseOnly } from '../styles/motion';

interface HeadingInfo {
    id: string;
    text: string;
}

interface ReadingProgressPillProps {
    contentSelector?: string;
    projectTitle?: string;
}

export default function ReadingProgressPill({ contentSelector = "article", projectTitle = "Index" }: ReadingProgressPillProps) {
    const { isDark } = useTheme();
    const { playClick } = useUISound();
    const [isExpanded, setIsExpanded] = useState(false);
    const [headings, setHeadings] = useState<HeadingInfo[]>([]);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [progress, setProgress] = useState(0);
    const [isMobile, setIsMobile] = useState(false);
    const widgetRef = useRef<HTMLDivElement | null>(null);

    // mobile for responsive width
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 640);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Headings from rendered project.ts
    useEffect(() => {
        const timer = setTimeout(() => {
            const article = document.querySelector(contentSelector);
            if (!article) return;
            const els = article.querySelectorAll("h2");
            const extracted: HeadingInfo[] = [];
            els.forEach((el, i) => {
                const text = el.textContent?.trim() || "";
                if (!text) return;
                extracted.push({ id: `section-${i}`, text });
            });
            setHeadings(extracted);
        }, 500);
        return () => clearTimeout(timer);
    }, [contentSelector]);

    // Track scroll progress & active heading
    const handleScroll = useCallback(() => {
        const article = document.querySelector(contentSelector);
        if (!article) return;
        const rect = article.getBoundingClientRect();
        const articleTop = rect.top + window.scrollY;
        const end = articleTop + rect.height - window.innerHeight;
        const raw = end > articleTop ? ((window.scrollY - articleTop) / (end - articleTop)) * 100 : 0;
        setProgress(Math.max(0, Math.min(100, raw)));

        if (headings.length === 0) return;

        const liveEls = article.querySelectorAll("h2");
        let current = -1;
        for (let i = liveEls.length - 1; i >= 0; i--) {
            if (liveEls[i].getBoundingClientRect().top <= 140) {
                current = i;
                break;
            }
        }
        setActiveIndex(current);
    }, [headings, contentSelector]);

    useEffect(() => {
        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener("scroll", handleScroll);
    }, [handleScroll]);

    // Close on outside click (same as music widget)
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (isExpanded && widgetRef.current && !widgetRef.current.contains(e.target as Node)) {
                setIsExpanded(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isExpanded]);

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsExpanded(false);
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, []);

    const hasHeadings = headings.length > 0;
    const activeText = activeIndex >= 0 && headings[activeIndex] ? headings[activeIndex].text : projectTitle;
    const progressPercent = Math.round(progress);

    const scrollToHeading = (index: number) => {
        const article = document.querySelector(contentSelector);
        if (!article) return;
        const els = article.querySelectorAll("h2");
        const el = els[index];
        if (el) {
            const y = el.getBoundingClientRect().top + window.scrollY - 100;
            window.scrollTo({ top: y, behavior: "smooth" });
        }
    };

    // Progress ring
    const ringSize = 20;
    const strokeWidth = 2;
    const radius = (ringSize - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference - (progress / 100) * circumference;

    // Colors 
    const widgetBg = isDark ? (isExpanded ? '#171717' : 'rgba(38, 38, 38, 0.8)') : '#E5E7EB';
    const widgetBorderColor = isDark ? '#2a2a2a' : '#D1D5DB';
    const textColor = isDark ? '#e6e6e6' : '#111827';
    const subTextColor = isDark ? '#8f8f8f' : '#4b5563';
    const progressBgColor = isDark ? '#3a3a3a' : '#d1d5db';
    const progressFillColor = isDark ? '#f5f5f5' : '#111827';

    const expandedHeight = 12 + 40 + 8 + (headings.length * 34) + 12;

    return (
        <motion.div
            ref={widgetRef}
            onClick={() => { if (hasHeadings) { playClick(); setIsExpanded(!isExpanded); } }}
            initial={false}
            animate={{
                width: isExpanded ? 320 : (isMobile ? 120 : 180),
                height: isExpanded ? expandedHeight : 36,
                padding: isExpanded ? '12px 16px' : '3px 12px 3px 8px',
                borderRadius: isExpanded ? 24 : 10,
                backgroundColor: widgetBg,
                borderColor: widgetBorderColor,
            }}
            transition={{ type: "spring", stiffness: 450, damping: 40 }}
            style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                borderStyle: 'solid',
                borderWidth: '1px',
                boxShadow: isExpanded
                    ? (isDark ? '0 25px 60px rgba(0,0,0,0.7), 0 10px 20px rgba(0,0,0,0.4)' : '0 25px 60px rgba(0,0,0,0.25), 0 10px 20px rgba(0,0,0,0.1)')
                    : 'none',
                zIndex: 1000,
                overflow: 'hidden',
                cursor: hasHeadings ? 'pointer' : 'default',
                transformOrigin: 'top center',
                backdropFilter: isExpanded ? 'blur(20px)' : 'none',
            }}
        >
            {/* Top row — always visible */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                {/* Left: Ring + active heading text */}
                <div style={{ display: 'flex', alignItems: 'center', gap: isExpanded ? '12px' : '0px', transition: 'gap 0.3s ease', overflow: 'hidden', flex: isExpanded ? 1 : 'none', minWidth: 0 }}>
                    {/* Progress ring */}
                    <div style={{ flexShrink: 0 }}>
                        <motion.div
                            initial={false}
                            animate={{
                                width: isExpanded ? 40 : 28,
                                height: isExpanded ? 40 : 28,
                                borderRadius: isExpanded ? 12 : 8,
                            }}
                            transition={{ type: "spring", stiffness: 450, damping: 40 }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: isExpanded ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)') : 'transparent',
                            }}
                        >
                            <svg width={ringSize} height={ringSize} style={{ transform: "rotate(-90deg)" }}>
                                <circle
                                    cx={ringSize / 2}
                                    cy={ringSize / 2}
                                    r={radius}
                                    fill="none"
                                    stroke={progressBgColor}
                                    strokeWidth={strokeWidth}
                                />
                                <circle
                                    cx={ringSize / 2}
                                    cy={ringSize / 2}
                                    r={radius}
                                    fill="none"
                                    stroke={progressFillColor}
                                    strokeWidth={strokeWidth}
                                    strokeDasharray={circumference}
                                    strokeDashoffset={dashOffset}
                                    strokeLinecap="round"
                                    style={{ transition: "stroke-dashoffset 0.3s ease" }}
                                />
                            </svg>
                        </motion.div>
                    </div>

                    {/* Expanded: Title + subtitle */}
                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                                style={{ display: 'flex', flexDirection: 'column', whiteSpace: 'nowrap' }}
                            >
                                <span style={{ color: textColor, fontWeight: 700, fontSize: '1.25rem', lineHeight: 1.2, letterSpacing: '-0.02em' }}>{projectTitle}</span>
                                <span style={{ color: subTextColor, fontSize: '0.95rem', fontWeight: 500 }}>{progressPercent}% read</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Collapsed: static heading text + percentage */}
                {!isExpanded && (
                    <>
                        <span style={{
                            flex: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            marginLeft: '2px',
                            marginRight: '8px',
                            minWidth: 0,
                            color: textColor,
                            fontSize: '0.7rem',
                            fontWeight: activeIndex >= 0 ? 700 : 500,
                            letterSpacing: '-0.01em',
                            transition: 'font-weight 0.2s ease, color 0.2s ease',
                        }}>
                            {activeText}
                        </span>

                        <span style={{
                            fontSize: '0.625rem',
                            fontWeight: 500,
                            color: subTextColor,
                            marginRight: '4px',
                            flexShrink: 0,
                            fontFamily: 'monospace',
                            opacity: 0.8
                        }}>
                            {progressPercent}%
                        </span>
                    </>
                )}

                {/* Right: chevron indicator */}
                {hasHeadings && (
                    <div style={{ display: 'flex', alignItems: 'center', height: '14px', flexShrink: 0 }}>
                        <motion.svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={isDark ? '#8f8f8f' : '#6b7280'}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            initial={false}
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ type: "spring", stiffness: 450, damping: 40 }}
                            style={{ opacity: 0.6 }}
                        >
                            <polyline points="6 9 12 15 18 9" />
                        </motion.svg>
                    </div>
                )}
            </div>

            {/* Bottom Section (Expanded Only) */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ delay: 0.05, duration: 0.2 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '100%', marginTop: '8px', paddingBottom: '4px' }}
                    >
                        {/* Heading list */}
                        {headings.map((h, i) => {
                            const isActive = i === activeIndex;
                            const isPast = i < activeIndex;
                            return (
                                <button
                                    key={h.id}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        playClick();
                                        scrollToHeading(i);
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 10,
                                        background: isActive ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)') : 'transparent',
                                        border: 'none',
                                        color: 'inherit',
                                        textAlign: 'left',
                                        padding: '7px 10px',
                                        borderRadius: 10,
                                        cursor: 'pointer',
                                        fontSize: '0.8125rem',
                                        fontWeight: isActive ? 600 : 400,
                                        letterSpacing: '-0.01em',
                                        transition: 'background 0.15s ease',
                                    }}
                                    onPointerEnter={mouseOnly((e) => {
                                        if (!isActive)
                                            (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)';
                                    })}
                                    onPointerLeave={mouseOnly((e) => {
                                        if (!isActive)
                                            (e.currentTarget as HTMLElement).style.background = 'transparent';
                                    })}
                                >
                                    {/* Active indicator */}
                                    <div style={{
                                        width: 3,
                                        height: isActive ? 16 : 3,
                                        borderRadius: 2,
                                        background: isActive
                                            ? textColor
                                            : isPast
                                                ? (isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.25)')
                                                : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'),
                                        flexShrink: 0,
                                        transition: 'height 0.2s ease, background 0.2s ease',
                                    }} />
                                    <span style={{
                                        flex: 1,
                                        minWidth: 0,
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        color: isActive
                                            ? textColor
                                            : isPast
                                                ? subTextColor
                                                : (isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)'),
                                    }}>
                                        {h.text}
                                    </span>
                                    {isPast && (
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4, flexShrink: 0 }}>
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    )}
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
