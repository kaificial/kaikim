"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { Flame, Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTheme } from "./ThemeContext";
import { useAudio } from "./AudioContext";
import { useUISound } from "../hooks/use-ui-sound";

const navLinks = [
    { href: "/", label: "Home" },
    { href: "/projects", label: "Projects" },
    { href: "/writing", label: "Notes" },
];

const ISLAND_SPRING = { type: "spring", stiffness: 280, damping: 30 } as const;

const MARQUEE_PERIOD_S = 10;
const Marquee = ({ label }: { label: string }) => {
    return (
        <div style={{ flex: 1, overflow: 'hidden', marginLeft: 6, marginRight: 6, minWidth: 0, maskImage: 'linear-gradient(to right, transparent 0%, black 6px, black calc(100% - 6px), transparent 100%)', WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 6px, black calc(100% - 6px), transparent 100%)' }}>
            <div style={{ display: 'flex', whiteSpace: 'nowrap', animation: `marquee-scroll ${MARQUEE_PERIOD_S}s linear infinite`, width: 'fit-content' }}>
                {[0, 1].map((i) => (
                    <span key={i} style={{ color: '#d1d5db', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '-0.01em', paddingRight: '1.5em' }}>
                        {label}
                    </span>
                ))}
            </div>
        </div>
    );
};

const MusicWidget = () => {
    const { isDark } = useTheme();
    const { currentTrack, isPlaying, progress, duration, togglePlay: globalTogglePlay, seek, shuffleTrack } = useAudio();
    const { playClick } = useUISound();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isWidgetHovered, setIsWidgetHovered] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0, widgetLeft: 0, widgetWidth: 150 });
    const [hoverText, setHoverText] = useState<string | null>(null);
    const widgetRef = useRef<HTMLDivElement | null>(null);
    const slotRef = useRef<HTMLDivElement | null>(null);
    const [islandPresent, setIslandPresent] = useState(false);
    const [slotRect, setSlotRect] = useState<{ top: number; left: number } | null>(null);
    const [winW, setWinW] = useState(0);

    useEffect(() => {
        const update = () => setWinW(window.innerWidth);
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            const insideSlot = slotRef.current?.contains(target);
            const insideExpanded = isExpanded && widgetRef.current?.contains(target);
            if (insideSlot || insideExpanded) return;

            if (isExpanded) {
                const r = slotRef.current?.getBoundingClientRect();
                if (r) setSlotRect({ top: r.top, left: r.left });
                requestAnimationFrame(() => setIsExpanded(false));
            }
            // Clear for mobile device touch 
            setIsWidgetHovered(false);
            setHoverText(null);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isExpanded]);

    const togglePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        playClick();
        globalTogglePlay();
    };

    const handleScrub = useCallback((e: React.MouseEvent<HTMLDivElement> | PointerEvent, container: HTMLDivElement) => {
        if (duration > 0) {
            const rect = container.getBoundingClientRect();
            const x = ('clientX' in e ? e.clientX : (e as PointerEvent).clientX) - rect.left;
            seek(Math.max(0, Math.min(1, x / rect.width)) * duration);
        }
    }, [duration, seek]);

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        e.stopPropagation();
        const container = e.currentTarget;
        handleScrub(e as any, container);
        const onMove = (ev: PointerEvent) => handleScrub(ev, container);
        const onUp = () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
        };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
    };

    const formatTime = (t: number) => {
        if (isNaN(t) || !isFinite(t)) return "0:00";
        return `${Math.floor(t / 60)}:${Math.floor(t % 60).toString().padStart(2, '0')}`;
    };

    const bg = '#171717';
    const borderColor = '#2a2a2a';
    const textColor = '#f5f5f5';
    const subTextColor = '#9ca3af';
    const iconColor = '#ffffff';
    const waveInactiveColor = '#8b8b8b';
    const progressBgColor = '#4b5563';
    const expandedShadow = '0 25px 60px rgba(0,0,0,0.55), 0 10px 20px rgba(0,0,0,0.35)';

    const collapsedGeom = {
        top: slotRect?.top ?? 0,
        left: slotRect?.left ?? 0,
        width: 150,
        height: 36,
        borderRadius: 10,
        backgroundColor: bg,
        borderColor,
        boxShadow: '0 0px 0px rgba(0,0,0,0), 0 0px 0px rgba(0,0,0,0)',
    };
    const expandedGeom = {
        top: 12,
        left: Math.max(8, (winW - 340) / 2),
        width: 340,
        height: 200,
        borderRadius: 36,
        backgroundColor: bg,
        borderColor,
        boxShadow: expandedShadow,
    };

    const slotAligned = (slotRect?.top ?? 0) >= 0;
    const scrolledExit = {
        duration: 0.55,
        ease: [0.16, 1, 0.3, 1],
        opacity: { duration: 0.55, ease: [0.4, 0, 1, 1] },
    } as const;
    const boxExit = slotAligned
        ? collapsedGeom
        : {
            top: expandedGeom.top - 96,
            left: expandedGeom.left + (expandedGeom.width - collapsedGeom.width) / 2,
            width: collapsedGeom.width,
            height: collapsedGeom.height,
            borderRadius: collapsedGeom.borderRadius,
            backgroundColor: collapsedGeom.backgroundColor,
            borderColor: collapsedGeom.borderColor,
            boxShadow: collapsedGeom.boxShadow,
            opacity: 0,
            transition: scrolledExit,
        };
    const compactExit = slotAligned ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1, transition: scrolledExit };
    const fullExit = { opacity: 0, scale: 0.45, ...(!slotAligned && { transition: scrolledExit }) };

    const measureSlot = () => {
        const r = slotRef.current?.getBoundingClientRect();
        if (r) setSlotRect({ top: r.top, left: r.left });
    };
    const expand = () => { playClick(); measureSlot(); setIslandPresent(true); setIsExpanded(true); };
    const collapse = () => {
        playClick();
        measureSlot();
        requestAnimationFrame(() => setIsExpanded(false));
    };

    const waveBars = (small: boolean) => (
        [
            { peakSm: '8px', peakLg: '8px', offset: 0.0, duration: 1.0 },
            { peakSm: '12px', peakLg: '14px', offset: 0.2, duration: 0.8 },
            { peakSm: '13px', peakLg: '16px', offset: 0.4, duration: 1.2 },
            { peakSm: '11px', peakLg: '12px', offset: 0.6, duration: 0.9 },
            { peakSm: '8px', peakLg: '8px', offset: 0.8, duration: 1.1 },
        ].map((w, i) => (
            <div
                key={i}
                style={{
                    '--bar-peak': small ? w.peakSm : w.peakLg,
                    width: '3px',
                    height: '4px',
                    backgroundColor: isPlaying ? '#3b82f6' : waveInactiveColor,
                    borderRadius: '4px',
                    animation: isPlaying
                        ? `wave-bar ${w.duration}s ease-in-out -${w.offset}s infinite`
                        : 'none',
                    transition: 'background-color 0.2s ease, height 0.15s ease',
                } as React.CSSProperties}
            />
        ))
    );

    const collapsedContent = (
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', height: '100%' }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, padding: 2, boxSizing: 'border-box', backgroundColor: 'rgba(255,255,255,0.12)' }}>
                <div style={{ width: '100%', height: '100%', borderRadius: 6, backgroundImage: `url(${currentTrack.cover})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
            </div>
            <Marquee label={`${currentTrack.title} • ${currentTrack.artist}`} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, paddingRight: 4, flexShrink: 0 }}>
                {isPlaying ? (
                    <motion.div
                        onClick={togglePlay}
                        onMouseEnter={(e) => { e.stopPropagation(); setHoverText("Pause Song"); }}
                        onMouseLeave={(e) => { e.stopPropagation(); setHoverText("Click to Expand"); }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{ display: 'flex', alignItems: 'center', gap: '2.5px', cursor: 'pointer', position: 'relative' }}
                    >
                        {waveBars(true)}
                    </motion.div>
                ) : (
                    <motion.div
                        onClick={togglePlay}
                        onMouseEnter={(e) => { e.stopPropagation(); setHoverText("Play Song"); }}
                        onMouseLeave={(e) => { e.stopPropagation(); setHoverText("Click to Expand"); }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                    >
                        <Play size={14} color={waveInactiveColor} fill={waveInactiveColor} />
                    </motion.div>
                )}
                <motion.div
                    onClick={(e) => { e.stopPropagation(); playClick(); shuffleTrack(); }}
                    onMouseEnter={(e) => { e.stopPropagation(); setHoverText("Skip Song"); }}
                    onMouseLeave={(e) => { e.stopPropagation(); setHoverText("Click to Expand"); }}
                    aria-label="Skip to next song"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                >
                    <SkipForward size={14} color={waveInactiveColor} fill={waveInactiveColor} />
                </motion.div>
            </div>
        </div>
    );

    const expandedContent = (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <div style={{ width: 64, height: 64, borderRadius: 12, flexShrink: 0, overflow: 'hidden', backgroundImage: `url(${currentTrack.cover})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, maxWidth: '180px' }}>
                        <span style={{ color: textColor, fontWeight: 700, fontSize: '1.25rem', lineHeight: 1.2, letterSpacing: '-0.02em', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', overflowWrap: 'break-word' }}>{currentTrack.title}</span>
                        <span style={{ color: subTextColor, fontSize: '0.95rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentTrack.artist}</span>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2.5px', paddingRight: '4px', flexShrink: 0 }}>
                    {waveBars(false)}
                </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', marginTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.75rem', color: subTextColor, fontWeight: 500, fontFamily: 'monospace' }}>
                    <span style={{ minWidth: '32px' }}>{formatTime(progress)}</span>
                    <div onPointerDown={handlePointerDown} onClick={(e) => e.stopPropagation()} style={{ flex: 1, height: '24px', display: 'flex', alignItems: 'center', cursor: 'pointer', position: 'relative' }}>
                        <div style={{ width: '100%', height: '6px', backgroundColor: progressBgColor, borderRadius: '3px', position: 'relative', overflow: 'hidden' }}>
                            <motion.div initial={false} animate={{ width: `${duration > 0 ? (progress / duration) * 100 : 0}%` }} transition={{ ease: "linear", duration: 0.1 }} style={{ height: '100%', backgroundColor: '#ffffff', borderRadius: '3px' }} />
                        </div>
                    </div>
                    <span style={{ minWidth: '32px', textAlign: 'right' }}>-{formatTime(Math.max(0, duration - progress))}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '0 12px' }}>
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => { e.stopPropagation(); playClick(); seek(0); }}
                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', width: 40, height: 40, borderRadius: '50%' }}
                    >
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileHover={{ opacity: 1 }}
                            style={{ position: 'absolute', inset: 0, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.08)' }}
                        />
                        <SkipBack size={24} color={iconColor} fill={iconColor} style={{ opacity: 0.8 }} />
                    </motion.div>

                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={togglePlay}
                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', width: 52, height: 52, borderRadius: '50%' }}
                    >
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileHover={{ opacity: 1 }}
                            style={{ position: 'absolute', inset: 0, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)' }}
                        />
                        {isPlaying ? <Pause size={32} color={iconColor} fill={iconColor} /> : <Play size={32} color={iconColor} fill={iconColor} />}
                    </motion.div>

                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => { e.stopPropagation(); playClick(); shuffleTrack(); }}
                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', width: 40, height: 40, borderRadius: '50%' }}
                    >
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileHover={{ opacity: 1 }}
                            style={{ position: 'absolute', inset: 0, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.08)' }}
                        />
                        <SkipForward size={24} color={iconColor} fill={iconColor} style={{ opacity: 0.8 }} />
                    </motion.div>
                </div>
            </div>
        </div>
    );

    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    return (
        <div
            ref={slotRef}
            style={{ position: 'relative', width: 150, height: 36 }}
            onMouseEnter={(e) => {
                const rect = slotRef.current?.getBoundingClientRect();
                setIsWidgetHovered(true);
                setHoverText("Click to Expand");
                setMousePos({ x: e.clientX, y: e.clientY, widgetLeft: rect?.left || 0, widgetWidth: rect?.width || 150 });
            }}
            onMouseMove={(e) => {
                const rect = slotRef.current?.getBoundingClientRect();
                setMousePos({ x: e.clientX, y: e.clientY, widgetLeft: rect?.left || 0, widgetWidth: rect?.width || 150 });
            }}
            onMouseLeave={() => { setIsWidgetHovered(false); setHoverText(null); }}
        >
            {!islandPresent && (
                <div
                    onClick={expand}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        boxSizing: 'border-box',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-start',
                        padding: '3px 12px 3px 3px',
                        borderRadius: 10,
                        backgroundColor: bg,
                        border: `1px solid ${borderColor}`,
                        overflow: 'hidden',
                        cursor: 'pointer',
                    }}
                >
                    {collapsedContent}
                </div>
            )}

            {islandPresent && createPortal(
                <AnimatePresence onExitComplete={() => setIslandPresent(false)}>
                    {isExpanded && (
                        <motion.div
                            ref={widgetRef}
                            onClick={collapse}
                            initial={collapsedGeom}
                            animate={expandedGeom}
                            exit={boxExit}
                            transition={ISLAND_SPRING}
                            style={{
                                position: 'fixed',
                                boxSizing: 'border-box',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'flex-start',
                                borderStyle: 'solid',
                                borderWidth: '1px',
                                overflow: 'hidden',
                                cursor: 'pointer',
                                transformOrigin: 'top center',
                                backdropFilter: 'blur(20px)',
                                WebkitBackdropFilter: 'blur(20px)',
                                zIndex: 1100,
                            }}
                        >
                            <motion.div
                                initial={{ opacity: 1, scale: 1 }}
                                animate={{ opacity: isExpanded ? 0 : 1, scale: isExpanded ? 2.2 : 1 }}
                                exit={compactExit}
                                transition={ISLAND_SPRING}
                                style={{
                                    position: 'absolute', top: 0, left: 0,
                                    width: 150, height: 36, padding: '3px 12px 3px 3px',
                                    boxSizing: 'border-box', display: 'flex', alignItems: 'center',
                                    transformOrigin: 'top left',
                                    pointerEvents: isExpanded ? 'none' : 'auto',
                                }}
                            >
                                {collapsedContent}
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.45 }}
                                animate={{ opacity: isExpanded ? 1 : 0, scale: isExpanded ? 1 : 0.45 }}
                                exit={fullExit}
                                transition={ISLAND_SPRING}
                                style={{
                                    position: 'absolute', top: 0, left: 0,
                                    width: 340, height: 200, padding: '16px 20px',
                                    boxSizing: 'border-box', display: 'flex', flexDirection: 'column',
                                    transformOrigin: 'top left',
                                    pointerEvents: isExpanded ? 'auto' : 'none',
                                }}
                            >
                                {expandedContent}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {mounted && createPortal(
                <AnimatePresence>
                    {isWidgetHovered && !isExpanded && hoverText && (() => {
                        const T = hoverText === "Click to Expand" ? 125 : hoverText === "Pause Song" ? 85 : 80;
                        const minLeft = mousePos.widgetLeft;
                        const maxLeft = mousePos.widgetLeft + mousePos.widgetWidth - T;
                        let tooltipLeft = mousePos.x - T / 2;
                        tooltipLeft = Math.max(minLeft, Math.min(maxLeft, tooltipLeft));

                        const arrowLeft = mousePos.x - tooltipLeft;
                        const clampedArrowLeft = Math.max(12, Math.min(T - 12, arrowLeft));

                        return (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.15, ease: "easeOut" }}
                                style={{
                                    position: 'fixed',
                                    top: mousePos.y + 10,
                                    left: tooltipLeft,
                                    width: T,
                                    display: 'flex',
                                    justifyContent: 'center',
                                    backgroundColor: isDark ? '#1f2937' : 'white',
                                    color: isDark ? 'white' : '#1f2937',
                                    padding: '4px 0',
                                    borderRadius: '8px',
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                    zIndex: 1100,
                                    pointerEvents: 'none',
                                    whiteSpace: 'nowrap',
                                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`
                                }}
                            >
                                {hoverText}
                                <div style={{
                                    position: 'absolute',
                                    top: '-5px',
                                    left: clampedArrowLeft,
                                    transform: 'translateX(-50%) rotate(45deg)',
                                    width: '10px',
                                    height: '10px',
                                    backgroundColor: isDark ? '#1f2937' : 'white',
                                    borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
                                    borderLeft: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
                                }} />
                            </motion.div>
                        );
                    })()}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};

export default function Header() {
    const pathname = usePathname();
    const { isDark } = useTheme();
    const { playClick } = useUISound();
    const [count, setCount] = useState(0);
    const [displayCount, setDisplayCount] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [hasLiked, setHasLiked] = useState(false);

    useEffect(() => {
        if (localStorage.getItem("has-liked-site") === "true") setHasLiked(true);

        const fetchGlobalCount = async () => {
            try {
                const res = await fetch('/api/likes');
                const data = await res.json();
                const globalCount = data.count || 0;
                setCount(globalCount);
                setDisplayCount(0);

                const duration = 2400;
                const startTime = performance.now() + 500;
                const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);
                const animate = (now: number) => {
                    if (now < startTime) { requestAnimationFrame(animate); return; }
                    const progress = Math.min((now - startTime) / duration, 1);
                    setDisplayCount(Math.floor(easeOutQuart(progress) * globalCount));
                    if (progress < 1) requestAnimationFrame(animate);
                };
                requestAnimationFrame(animate);
            } catch (error) {
                console.error("Failed to sync global likes:", error);
            }
        };

        fetchGlobalCount();
    }, []);

    const handleLikeClick = async () => {
        if (hasLiked) return;

        let previousCount = 0;
        setCount(prev => { previousCount = prev; return prev + 1; });
        setDisplayCount(prev => prev + 1);
        setHasLiked(true);
        localStorage.setItem("has-liked-site", "true");

        try {
            const res = await fetch('/api/likes', { method: 'POST' });
            const data = await res.json();

            if (!res.ok) {
                if (res.status === 400 && data.error === "already_liked") return;
                setCount(previousCount);
                setDisplayCount(previousCount);
                setHasLiked(false);
                localStorage.removeItem("has-liked-site");
                if (res.status !== 429 && res.status !== 403) throw new Error(data.message || "Failed to like");
                return;
            }

            if (data.count != null) {
                setCount(data.count);
                setDisplayCount(data.count);
            }
        } catch (error) {
            console.error("Try Again", error);
            setCount(previousCount);
            setDisplayCount(previousCount);
            setHasLiked(false);
            localStorage.removeItem("has-liked-site");
        }
    };

    if (pathname?.startsWith('/projects/') && pathname !== '/projects') return null;

    return (
        <header className="header">
            <motion.div
                className="header-container"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1, duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                style={{ position: 'relative' }}
            >
                <div className="mobile-menu-wrapper">
                    <button
                        className="mobile-menu-btn"
                        onClick={() => { playClick(); setIsMobileMenuOpen(!isMobileMenuOpen); }}
                        aria-label="Toggle mobile menu"
                    >
                        {isMobileMenuOpen ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="3" y1="12" x2="21" y2="12"></line>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <line x1="3" y1="18" x2="21" y2="18"></line>
                            </svg>
                        )}
                    </button>
                </div>

                <nav className="nav-pill-container" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className={`header-nav ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`nav-link ${pathname === link.href ? "active" : ""}`}
                                onClick={() => { playClick(); setIsMobileMenuOpen(false); }}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    <div className="vertical-divider" style={{ width: '1px', height: '16px', backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }} />

                    <div style={{ position: 'relative', width: 150, height: 36 }}>
                        <div className="music-widget-wrapper">
                            <MusicWidget />
                        </div>
                    </div>
                </nav>

                <div className="theme-buttons-container" style={{ display: 'flex', gap: '12px', alignItems: 'center', position: 'relative' }}>
                    <motion.div
                        onMouseEnter={() => { setIsHovered(true); }}
                        onMouseLeave={() => setIsHovered(false)}
                        style={{ position: 'relative' }}
                    >
                        <AnimatePresence>
                            {isHovered && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95, x: '-50%' }}
                                    animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95, x: '-50%' }}
                                    style={{
                                        position: 'absolute',
                                        bottom: 'calc(100% + 2px)',
                                        left: '50%',
                                        backgroundColor: isDark ? '#1E293B' : 'white',
                                        color: isDark ? 'white' : '#1E293B',
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        fontSize: '0.8125rem',
                                        fontWeight: '600',
                                        whiteSpace: 'nowrap',
                                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
                                        pointerEvents: 'none',
                                        zIndex: 1100
                                    }}
                                >
                                    Like my site!
                                    <div style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        borderLeft: '6px solid transparent',
                                        borderRight: '6px solid transparent',
                                        borderTop: `6px solid ${isDark ? '#1E293B' : 'white'}`,
                                    }} />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <motion.button
                            onClick={() => { playClick(); handleLikeClick(); }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                minWidth: '40px',
                                height: '40px',
                                padding: '0 12px',
                                backgroundColor: isDark ? '#171717' : '#f9fafb',
                                border: `1px solid ${hasLiked ? (isDark ? 'rgba(37, 99, 235, 0.4)' : 'rgba(37, 99, 235, 0.3)') : (isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)')}`,
                                borderRadius: '10px',
                                color: hasLiked ? '#2563eb' : (isDark ? '#94a3b8' : '#64748b'),
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                boxShadow: hasLiked ? '0 2px 10px rgba(37, 99, 235, 0.15)' : '0 1px 2px rgba(0, 0, 0, 0.04)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <Flame
                                size={16}
                                color={hasLiked ? "#2563eb" : (isDark ? "#94a3b8" : "#64748b")}
                                fill={hasLiked ? "#2563eb" : "none"}
                            />
                            {displayCount}
                        </motion.button>
                    </motion.div>
                </div>
            </motion.div>
        </header>
    );
}
