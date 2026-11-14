"use client";

import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useScroll, useTransform, useMotionTemplate } from "framer-motion";
import { createPortal } from "react-dom";
import { Play, Pause, SkipBack, SkipForward, Sun, Moon, Github, GitCommitHorizontal, GitPullRequest, GitMerge, Check, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTheme } from "./ThemeContext";
import { useAudio } from "./AudioContext";
import { useUISound } from "../hooks/use-ui-sound";
import { sfx } from "../lib/sfx";
import { EASE_OUT, HOVER_PILL, mouseOnly, PRESS, TOOLTIP } from '../styles/motion';
import { useIslandActivity } from '../lib/island';
import { CommandPalettePanel, isPaletteShortcut, OPEN_PALETTE_EVENT, paletteSize } from './CommandPalette';
import { timeAgo, useLastCommitActivity } from '../hooks/use-last-commit';

// 7 × 6 pixel heart. "#" = outline, "o" = fill (only once liked), "*" = highlight
const HEART_PIXELS = [
    ".##.##.",
    "#o*#oo#",
    "#ooooo#",
    ".#ooo#.",
    "..#o#..",
    "...#...",
];

/** pixel heart: just an outline until liked, then filled with a little highlight */
const PixelHeart = ({ filled, color, size = 16 }: { filled: boolean; color: string; size?: number }) => (
    <svg
        width={size}
        height={(size * 6) / 7}
        viewBox="0 0 7 6"
        shapeRendering="crispEdges"
        aria-hidden="true"
        style={{ display: 'block' }}
    >
        {HEART_PIXELS.flatMap((row, y) =>
            [...row].map((px, x) => {
                if (px === '.' || (!filled && px !== '#')) return null;
                const fill = px === '*' ? 'rgba(255,255,255,0.85)' : color;
                return <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={fill} />;
            })
        )}
    </svg>
);

const navLinks = [
    { href: "/", label: "Home" },
    { href: "/projects", label: "Projects" },
    { href: "/writing", label: "Notes" },
];

const ISLAND_SPRING = { type: "spring", stiffness: 280, damping: 30 } as const;
/*
 * open and close animations. opening bounces a little, closing is quicker and calmer.
 * the contents fade on short tweens since a bouncy fade just looks like flicker
 */
const ISLAND_OPEN = { type: "spring", visualDuration: 0.42, bounce: 0.18 } as const;
const ISLAND_CLOSE = { type: "spring", visualDuration: 0.32, bounce: 0.04 } as const;
const FADE_IN = { duration: 0.22, delay: 0.06, ease: EASE_OUT } as const;
const FADE_OUT = { duration: 0.12, ease: EASE_OUT } as const;
/** how far the floating island sits from the top of the screen */
const FLOAT_TOP = 12;

// github activity in the island: the trailing icon says what kind of thing happened
const GIT_ACTIVITY = {
    push: { Icon: GitCommitHorizontal, verb: 'Pushed to' },
    pr: { Icon: GitPullRequest, verb: 'Opened PR in' },
    merge: { Icon: GitMerge, verb: 'Merged PR in' },
} as const;

const MARQUEE_PERIOD_S = 10;
const Marquee = ({ label }: { label: string }) => {
    const trackRef = useRef<HTMLDivElement | null>(null);
    // pin the animation to the document timeline so every copy (header slot + island) stays in sync
    useLayoutEffect(() => {
        trackRef.current?.getAnimations().forEach((a) => { a.startTime = 0; });
    }, []);
    return (
        <div style={{ flex: 1, overflow: 'hidden', marginLeft: 6, marginRight: 6, minWidth: 0, maskImage: 'linear-gradient(to right, transparent 0%, black 6px, black calc(100% - 6px), transparent 100%)', WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 6px, black calc(100% - 6px), transparent 100%)' }}>
            <div ref={trackRef} style={{ display: 'flex', whiteSpace: 'nowrap', animation: `marquee-scroll ${MARQUEE_PERIOD_S}s linear infinite`, width: 'fit-content' }}>
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
    const { currentTrack, isPlaying, progress, duration, togglePlay: globalTogglePlay, seek, shuffleTrack, previousTrack } = useAudio();
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
    // once the header scrolls away, a copy of the pill floats at the top of the screen like a dynamic island
    const floatRef = useRef<HTMLDivElement | null>(null);
    const [docked, setDocked] = useState(true);
    // coming back from the expanded island, the floating pill should just be there, not drop in again
    const [floatInstant, setFloatInstant] = useState(false);
    const activity = useIslandActivity();
    useLastCommitActivity();
    // what the widget expands into
    const [mode, setMode] = useState<'music' | 'palette'>('music');
    const [winH, setWinH] = useState(0);
    // reading progress: a ring round the album art that fills as you scroll the page
    const { scrollYProgress } = useScroll();
    const readPct = useTransform(scrollYProgress, [0, 1], [0, 100]);
    const ringBg = useMotionTemplate`conic-gradient(#3b82f6 ${readPct}%, rgba(255,255,255,0.12) 0)`;

    useEffect(() => {
        const el = slotRef.current;
        if (!el) return;
        const io = new IntersectionObserver(([e]) => { setDocked(e.isIntersecting); setFloatInstant(false); }, { threshold: 0 });
        io.observe(el);
        return () => io.disconnect();
    }, []);

    useEffect(() => {
        const update = () => { setWinW(window.innerWidth); setWinH(window.innerHeight); };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            const insideSlot = slotRef.current?.contains(target) || floatRef.current?.contains(target);
            const insideExpanded = isExpanded && widgetRef.current?.contains(target);
            if (insideSlot || insideExpanded) return;

            if (isExpanded) {
                if (mode === 'palette') sfx.close();
                if (docked) {
                    const r = slotRef.current?.getBoundingClientRect();
                    if (r) setSlotRect({ top: r.top, left: r.left });
                } else {
                    setSlotRect({ top: FLOAT_TOP, left: (document.documentElement.clientWidth - 150) / 2 });
                }
                setFloatInstant(!docked);
                requestAnimationFrame(() => setIsExpanded(false));
            }
            // Clear for mobile device touch 
            setIsWidgetHovered(false);
            setHoverText(null);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isExpanded, docked, mode]);

    const togglePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        sfx.toggle(!isPlaying);
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
    const palette = paletteSize(winW, winH);
    const expandedGeom = mode === 'palette'
        ? {
            top: 12,
            left: palette.left,
            width: palette.width,
            height: palette.height,
            borderRadius: 26,
            backgroundColor: bg,
            borderColor,
            boxShadow: expandedShadow,
        }
        : {
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
        ? { ...collapsedGeom, transition: ISLAND_CLOSE }
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
    const compactExit = slotAligned
        ? { opacity: 1, scale: 1, transition: { ...ISLAND_CLOSE, opacity: { ...FADE_IN, delay: 0.04 } } }
        : { opacity: 0, scale: 1, transition: scrolledExit };
    const fullExit = slotAligned
        ? { opacity: 0, scale: 0.45, transition: { ...ISLAND_CLOSE, opacity: FADE_OUT } }
        : { opacity: 0, scale: 0.45, transition: scrolledExit };

    const measureSlot = () => {
        if (!docked) {
            // header's scrolled away: the pill lives at the top of the screen (same spot as the floating island)
            setSlotRect({ top: FLOAT_TOP, left: (document.documentElement.clientWidth - 150) / 2 });
            return;
        }
        const r = slotRef.current?.getBoundingClientRect();
        if (r) setSlotRect({ top: r.top, left: r.left });
    };
    const expand = () => { sfx.pop(); setMode('music'); measureSlot(); setIslandPresent(true); setIsExpanded(true); };
    const collapse = () => {
        if (mode === 'palette') sfx.close(); else playClick();
        measureSlot();
        setFloatInstant(!docked);
        requestAnimationFrame(() => setIsExpanded(false));
    };

    // ⌘K turns the widget into the palette (even if the player is already open)
    // refs hold the latest functions so the listener doesn't rebind every render
    const toggleRef = useRef<() => void>(() => {});
    const closeRef = useRef<() => void>(() => {});
    useEffect(() => {
        toggleRef.current = () => {
            if (isExpanded && mode === 'palette') { collapse(); return; }
            sfx.open();
            setMode('palette');
            if (!isExpanded) { measureSlot(); setIslandPresent(true); setIsExpanded(true); }
        };
        closeRef.current = () => { if (isExpanded && mode === 'palette') collapse(); };
    });
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (!isPaletteShortcut(e)) return;
            e.preventDefault();
            toggleRef.current();
        };
        const onOpen = () => { if (!(isExpanded && mode === 'palette')) toggleRef.current(); };
        window.addEventListener('keydown', onKey);
        window.addEventListener(OPEN_PALETTE_EVENT, onOpen);
        return () => {
            window.removeEventListener('keydown', onKey);
            window.removeEventListener(OPEN_PALETTE_EVENT, onOpen);
        };
    }, [isExpanded, mode]);
    const closePalette = useCallback(() => closeRef.current(), []);

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
                    transition: 'background-color 0.2s var(--ease-out), height 0.15s var(--ease-out)',
                } as React.CSSProperties}
            />
        ))
    );

    const musicContent = (
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', height: '100%' }}>
            <motion.div aria-hidden style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, padding: 2, boxSizing: 'border-box', background: ringBg }}>
                <div style={{ width: '100%', height: '100%', borderRadius: 6, backgroundImage: `url(${currentTrack.cover})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
            </motion.div>
            <Marquee label={`${currentTrack.title} • ${currentTrack.artist}`} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, paddingRight: 4, flexShrink: 0 }}>
                {isPlaying ? (
                    <motion.div
                        onClick={togglePlay}
                        onPointerEnter={mouseOnly((e) => { e.stopPropagation(); setHoverText("Pause Song"); })}
                        onPointerLeave={mouseOnly((e) => { e.stopPropagation(); setHoverText("Click to Expand"); })}
                        whileHover={{ scale: 1.05 }}
                        whileTap={PRESS}
                        style={{ display: 'flex', alignItems: 'center', gap: '2.5px', cursor: 'pointer', position: 'relative' }}
                    >
                        {waveBars(true)}
                    </motion.div>
                ) : (
                    <motion.div
                        onClick={togglePlay}
                        onPointerEnter={mouseOnly((e) => { e.stopPropagation(); setHoverText("Play Song"); })}
                        onPointerLeave={mouseOnly((e) => { e.stopPropagation(); setHoverText("Click to Expand"); })}
                        whileHover={{ scale: 1.05 }}
                        whileTap={PRESS}
                        style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                    >
                        <Play size={14} color={waveInactiveColor} fill={waveInactiveColor} />
                    </motion.div>
                )}
                <motion.div
                    onClick={(e) => { e.stopPropagation(); playClick(); shuffleTrack(); }}
                    onPointerEnter={mouseOnly((e) => { e.stopPropagation(); setHoverText("Skip Song"); })}
                    onPointerLeave={mouseOnly((e) => { e.stopPropagation(); setHoverText("Click to Expand"); })}
                    aria-label="Skip to next song"
                    whileHover={{ scale: 1.05 }}
                    whileTap={PRESS}
                    style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                >
                    <SkipForward size={14} color={waveInactiveColor} fill={waveInactiveColor} />
                </motion.div>
            </div>
        </div>
    );

    const activityContent = activity?.kind === 'theme' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', height: '100%', paddingLeft: 6 }}>
            {/* sun or moon, rotates in a bit */}
            <motion.span
                initial={{ rotate: activity.dark ? -45 : 45, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 0.35, ease: EASE_OUT }}
                style={{ display: 'flex' }}
            >
                {activity.dark
                    ? <Moon size={14} color="#d1d5db" strokeWidth={1.75} />
                    : <Sun size={14} color="#d1d5db" strokeWidth={1.75} />}
            </motion.span>
            <span style={{ color: '#f5f5f5', fontSize: '0.72rem', fontWeight: 600 }}>{activity.dark ? 'Dark mode' : 'Light mode'}</span>
        </div>
    ) : activity?.kind === 'notice' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', height: '100%', paddingLeft: 3 }}>
            <motion.span
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', duration: 0.4, bounce: 0.35 }}
                style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: activity.tone === 'error' ? '#ef4444' : '#3b82f6' }}
            >
                {activity.tone === 'error'
                    ? <X size={12} color="#fff" strokeWidth={3} />
                    : <Check size={12} color="#fff" strokeWidth={3} />}
            </motion.span>
            <span style={{ flex: 1, minWidth: 0, color: '#f5f5f5', fontSize: '0.72rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activity.text}</span>
        </div>
    ) : activity?.kind === 'commit' ? (
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', height: '100%', paddingLeft: 6 }}>
            <Github size={15} color="#f5f5f5" style={{ flexShrink: 0 }} />
            <Marquee label={`${GIT_ACTIVITY[activity.type].verb} ${activity.repo} · ${timeAgo(activity.at)}${activity.message ? ` · ${activity.message}` : ''}`} />
            {(() => {
                const { Icon } = GIT_ACTIVITY[activity.type];
                return <Icon aria-hidden size={13} strokeWidth={1.75} color="#9ca3af" style={{ flexShrink: 0, marginRight: 3 }} />;
            })()}
        </div>
    ) : null;

    // live activities slide in over the music and hand it back when they're done
    const collapsedContent = (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                    key={activity ? `activity-${activity.key}` : 'music'}
                    initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                    transition={{ duration: 0.3, ease: EASE_OUT }}
                    style={{ width: '100%', height: '100%' }}
                    aria-live="polite"
                >
                    {activity ? activityContent : musicContent}
                </motion.div>
            </AnimatePresence>
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
                        whileTap={PRESS}
                        onClick={(e) => { e.stopPropagation(); playClick(); previousTrack(); }}
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
                        whileTap={PRESS}
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
                        whileTap={PRESS}
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
            onPointerEnter={(e) => {
                // mouse only: touch fakes enter on tap and never leaves. (done inline, not with mouseOnly(),
                // because the react compiler thinks a wrapped ref read happens during render)
                if (e.pointerType !== 'mouse') return;
                const rect = slotRef.current?.getBoundingClientRect();
                setIsWidgetHovered(true);
                setHoverText("Click to Expand");
                setMousePos({ x: e.clientX, y: e.clientY, widgetLeft: rect?.left || 0, widgetWidth: rect?.width || 150 });
            }}
            onMouseMove={(e) => {
                const rect = slotRef.current?.getBoundingClientRect();
                setMousePos({ x: e.clientX, y: e.clientY, widgetLeft: rect?.left || 0, widgetWidth: rect?.width || 150 });
            }}
            onPointerLeave={mouseOnly(() => { setIsWidgetHovered(false); setHoverText(null); })}
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
                <AnimatePresence onExitComplete={() => { setIslandPresent(false); setMode('music'); }}>
                    {isExpanded && mode === 'palette' && (
                        // dark overlay, clicking it closes the palette
                        <motion.div
                            key="palette-backdrop"
                            className={`cmdk-backdrop ${isDark ? '' : 'is-light'}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.22, ease: EASE_OUT }}
                        />
                    )}
                    {isExpanded && (
                        <motion.div
                            key="island"
                            ref={widgetRef}
                            onClick={mode === 'music' ? collapse : undefined}
                            initial={collapsedGeom}
                            animate={expandedGeom}
                            exit={boxExit}
                            transition={ISLAND_OPEN}
                            style={{
                                position: 'fixed',
                                boxSizing: 'border-box',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'flex-start',
                                borderStyle: 'solid',
                                borderWidth: '1px',
                                overflow: 'hidden',
                                cursor: mode === 'music' ? 'pointer' : 'default',
                                transformOrigin: 'top center',
                                // sit above the dock when it's the palette
                                zIndex: mode === 'palette' ? 4001 : 1100,
                            }}
                        >
                            <motion.div
                                initial={{ opacity: 1, scale: 1 }}
                                animate={{ opacity: isExpanded ? 0 : 1, scale: isExpanded ? 2.2 : 1 }}
                                exit={compactExit}
                                transition={{ ...ISLAND_OPEN, opacity: FADE_OUT }}
                                style={{
                                    position: 'absolute', top: 0, left: 0,
                                    width: 150, height: 36, padding: '3px 12px 3px 3px',
                                    boxSizing: 'border-box', display: 'flex', alignItems: 'center',
                                    transformOrigin: 'top left',
                                    willChange: 'transform, opacity',
                                    pointerEvents: isExpanded ? 'none' : 'auto',
                                }}
                            >
                                {collapsedContent}
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.45 }}
                                animate={{ opacity: isExpanded ? 1 : 0, scale: isExpanded ? 1 : 0.45 }}
                                exit={fullExit}
                                transition={{ ...ISLAND_OPEN, opacity: FADE_IN }}
                                style={{
                                    position: 'absolute', top: 0, left: 0,
                                    width: expandedGeom.width, height: expandedGeom.height,
                                    padding: mode === 'palette' ? 0 : '16px 20px',
                                    boxSizing: 'border-box', display: 'flex', flexDirection: 'column',
                                    transformOrigin: 'top left',
                                    willChange: 'transform, opacity',
                                    pointerEvents: isExpanded ? 'auto' : 'none',
                                }}
                            >
                                {mode === 'palette' ? <CommandPalettePanel onClose={closePalette} /> : expandedContent}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {mounted && createPortal(
                <AnimatePresence custom={islandPresent}>
                    {!docked && !islandPresent && (
                        <motion.div
                            ref={floatRef}
                            key="floating-island"
                            onClick={expand}
                            custom={islandPresent}
                            variants={{
                                hidden: { y: -56, opacity: 0, scale: 0.92, x: '-50%' },
                                shown: { y: 0, opacity: 1, scale: 1, x: '-50%', transition: ISLAND_SPRING },
                                // expanding: the big island takes over from exactly here, so vanish at once
                                gone: (expanding: boolean) => expanding
                                    ? { opacity: 0, x: '-50%', transition: { duration: 0 } }
                                    : { y: -56, opacity: 0, scale: 0.92, x: '-50%', transition: { duration: 0.25, ease: EASE_OUT } },
                            }}
                            initial={floatInstant ? false : 'hidden'}
                            animate="shown"
                            exit="gone"
                            style={{
                                position: 'fixed',
                                top: FLOAT_TOP,
                                left: '50%',
                                width: 150,
                                height: 36,
                                boxSizing: 'border-box',
                                padding: '3px 12px 3px 3px',
                                borderRadius: 10,
                                backgroundColor: bg,
                                border: `1px solid ${borderColor}`,
                                boxShadow: '0 8px 24px rgba(0,0,0,0.28), 0 2px 6px rgba(0,0,0,0.2)',
                                overflow: 'hidden',
                                cursor: 'pointer',
                                zIndex: 1050,
                            }}
                        >
                            {collapsedContent}
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
                                initial={{ opacity: 0, scale: 0.96 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.14, ease: EASE_OUT }}
                                style={{
                                    transformOrigin: 'top center',
                                    position: 'fixed',
                                    top: mousePos.y + 10,
                                    left: tooltipLeft,
                                    width: T,
                                    display: 'flex',
                                    justifyContent: 'center',
                                    backgroundColor: isDark ? '#181818' : 'white',
                                    color: isDark ? '#f5f5f5' : '#1f2937',
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
                                    backgroundColor: isDark ? '#181818' : 'white',
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
    const { isDark, toggleTheme } = useTheme();
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
                        onPointerEnter={mouseOnly(() => { setIsHovered(true); })}
                        onPointerLeave={mouseOnly(() => setIsHovered(false))}
                        style={{ position: 'relative' }}
                    >
                        <AnimatePresence>
                            {isHovered && (
                                <motion.div
                                    initial={{ ...TOOLTIP.initial, x: '-50%' }}
                                    animate={{ ...TOOLTIP.animate, x: '-50%' }}
                                    exit={{ ...TOOLTIP.exit, x: '-50%' }}
                                    style={{
                                        transformOrigin: 'bottom center',
                                        position: 'absolute',
                                        bottom: 'calc(100% + 2px)',
                                        left: '50%',
                                        backgroundColor: isDark ? '#1f1f1f' : 'white',
                                        color: isDark ? '#f5f5f5' : '#1E293B',
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
                                        borderTop: `6px solid ${isDark ? '#1f1f1f' : 'white'}`,
                                    }} />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <motion.button
                            onClick={() => { sfx.like(!hasLiked); handleLikeClick(); }}
                            whileHover={HOVER_PILL}
                            whileTap={PRESS}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                minWidth: '40px',
                                height: '40px',
                                padding: '0 12px',
                                backgroundColor: isDark ? '#141414' : '#f9fafb',
                                border: `1px solid ${hasLiked ? (isDark ? 'rgba(37, 99, 235, 0.4)' : 'rgba(37, 99, 235, 0.3)') : (isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)')}`,
                                borderRadius: '10px',
                                color: hasLiked ? '#2563eb' : (isDark ? '#8f8f8f' : '#64748b'),
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                boxShadow: hasLiked ? '0 2px 10px rgba(37, 99, 235, 0.15)' : '0 1px 2px rgba(0, 0, 0, 0.04)',
                                transition: 'background-color 0.2s var(--ease-out), border-color 0.2s var(--ease-out), color 0.2s var(--ease-out), box-shadow 0.2s var(--ease-out), opacity 0.2s var(--ease-out)'
                            }}
                        >
                            <PixelHeart
                                filled={hasLiked}
                                color={hasLiked ? "#2563eb" : (isDark ? "#8f8f8f" : "#64748b")}
                            />
                            {displayCount}
                        </motion.button>
                    </motion.div>
                </div>
            </motion.div>
        </header>
    );
}
