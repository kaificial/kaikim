"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion, useSpring, useTransform } from "framer-motion";
import type { MediaEntry } from "../../data/media";
import { caseDims, FORMAT_LABEL, inkOn, NEUTRAL_SPINE, resolveFormat } from "./formats";
import { CaseStage } from "./CaseStage";
import { spineFont } from "./fonts";
import { sfx } from "../../lib/sfx";

const EASE = [0.22, 1, 0.36, 1] as const;
/** turn spring, soft with no wobble */
const TURN_SPRING = { stiffness: 170, damping: 26, mass: 1 };
/** turn angle, leaves a sliver of spine showing */
const TURN_DEG = 74;
/** space above the row for the lift */
const HEADROOM = 16;
const formatRating = (r: number) => (Number.isInteger(r) ? `${r}` : r.toFixed(1));

/** stable number from an id */
const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

/** spine size, series get thicker per season */
const spineSize = (m: MediaEntry) => {
    const h = hash(m.id);
    const width = 28 + (h % 4) * 3 + (m.kind === 'tv' ? Math.min(m.seasons ?? 1, 5) * 2 : 0);
    const height = 200 + (h % 6) * 9;
    return { width, height, cover: Math.round(height * 0.68) };
};

const mono = 'var(--font-mono), ui-monospace, monospace';

/** a 3d book that turns to show its cover on hover */
const Book = ({ entry, index, turned, isDark }: { entry: MediaEntry; index: number; turned: boolean; isDark: boolean }) => {
    const { width, height, cover } = spineSize(entry);
    const bg = entry.spineColor ?? NEUTRAL_SPINE;
    const ink = inkOn(entry.spineColor);

    // one spring drives everything so it stays in sync
    const angle = useSpring(0, TURN_SPRING);
    useEffect(() => { angle.set(turned ? TURN_DEG : 0); }, [turned, angle]);
    const rad = (a: number) => (a * Math.PI) / 180;
    // width the book takes up as it turns
    const room = useTransform(angle, (a) => width * Math.cos(rad(a)) + cover * Math.sin(rad(a)));
    const rotateY = useTransform(angle, (a) => -a);
    const lift = useTransform(angle, (a) => (-a / TURN_DEG) * 6);
    // shade faces as they turn away
    const spineShade = useTransform(angle, (a) => 0.5 * Math.sin(rad(a)));
    const coverShade = useTransform(angle, (a) => 0.6 * Math.cos(rad(a)));
    const shadowScale = useTransform(angle, (a) => 1 + (a / TURN_DEG) * 0.25);

    return (
        <motion.div style={{ position: 'relative', width: room, height, perspective: 1100, perspectiveOrigin: `${width / 2}px -90px` }}>
            {/* shadow */}
            <motion.div aria-hidden style={{
                position: 'absolute',
                left: -4,
                right: -4,
                bottom: -5,
                height: 10,
                borderRadius: '50%',
                background: `radial-gradient(closest-side, rgba(0,0,0,${isDark ? 0.7 : 0.22}), transparent)`,
                scaleX: shadowScale,
                pointerEvents: 'none',
            }} />
            <motion.div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width,
                height,
                y: lift,
                rotateY,
                transformOrigin: '0 50% 0',
                transformStyle: 'preserve-3d',
                willChange: 'transform',
            }}>
                {/* cover */}
                <div style={{
                    position: 'absolute',
                    left: width,
                    top: 0,
                    width: cover,
                    height,
                    transformOrigin: '0 50%',
                    transform: 'rotateY(90deg)',
                    background: bg,
                    overflow: 'hidden',
                }}>
                    <Image src={entry.poster} alt="" fill sizes={`${cover}px`} style={{ objectFit: 'cover' }} />
                    {/* crease */}
                    <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(0,0,0,0.35), rgba(255,255,255,0.08) 4%, transparent 9%, transparent 88%, rgba(0,0,0,0.12))' }} />
                    <motion.div aria-hidden style={{ position: 'absolute', inset: 0, background: '#000', opacity: coverShade }} />
                </div>

                {/* pages on top */}
                <div aria-hidden style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width,
                    height: cover,
                    transformOrigin: '50% 0',
                    transform: 'rotateX(-90deg)',
                    background: `linear-gradient(90deg, ${bg} 0 3px, transparent 3px calc(100% - 3px), ${bg} calc(100% - 3px)), repeating-linear-gradient(90deg, #f3eee2 0 1px, #e3dccb 1px 2px)`,
                    boxShadow: `inset 0 3px 0 ${bg}`,
                }} />

                {/* spine */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: bg,
                        color: ink,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '10px 0 8px',
                        boxSizing: 'border-box',
                        // rounded spine shading
                        backgroundImage: 'linear-gradient(90deg, rgba(0,0,0,0.22), rgba(255,255,255,0.14) 16%, rgba(255,255,255,0.03) 42%, transparent 60%, rgba(0,0,0,0.28))',
                    }}
                >
                    <span style={{ writingMode: 'vertical-rl', fontFamily: mono, fontSize: 8, letterSpacing: '0.18em', opacity: 0.65 }}>
                        {entry.year}
                    </span>
                    <span
                        className={spineFont.className}
                        style={{
                            flex: 1,
                            minHeight: 0,
                            marginTop: 10,
                            writingMode: 'vertical-rl',
                            fontSize: Math.min(width * 0.45, 15),
                            fontWeight: 800,
                            letterSpacing: '0.03em',
                            lineHeight: 1,
                            textTransform: 'uppercase',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        {entry.title}
                    </span>
                    <span style={{ fontFamily: mono, fontSize: 8, opacity: 0.6, fontVariantNumeric: 'tabular-nums' }}>
                        {String(index + 1).padStart(2, '0')}
                    </span>
                    <motion.div aria-hidden style={{ position: 'absolute', inset: 0, background: '#000', opacity: spineShade }} />
                </div>
            </motion.div>
        </motion.div>
    );
};

const ShelfRow = ({ label, items, isDark, pulledId, entranceDelay, registerSpine, onPull }: {
    label: string;
    items: MediaEntry[];
    isDark: boolean;
    pulledId: string | null;
    entranceDelay: (index: number) => number;
    registerSpine: (id: string, el: HTMLButtonElement | null) => void;
    onPull: (entry: MediaEntry) => void;
}) => {
    const reduceMotion = useReducedMotion();
    const [active, setActive] = useState(0);
    // only keyboard focus turns a book
    const [keyboardFocus, setKeyboardFocus] = useState<number | null>(null);
    const [hovered, setHovered] = useState<number | null>(null);
    // hovered or focused book
    const turned = reduceMotion ? null : hovered ?? keyboardFocus;
    const scrollRef = useRef<HTMLDivElement>(null);
    const buttons = useRef<(HTMLButtonElement | null)[]>([]);
    const dragMoved = useRef(false);
    const tallest = Math.max(...items.map((m) => spineSize(m).height));
    // fade the edges when there's more to scroll
    const [overflow, setOverflow] = useState({ start: false, end: false });

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const measure = () => {
            const start = el.scrollLeft > 4;
            const end = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
            setOverflow((o) => (o.start === start && o.end === end ? o : { start, end }));
        };
        measure();
        el.addEventListener('scroll', measure, { passive: true });
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        ro.observe(el.firstElementChild as Element);
        return () => { el.removeEventListener('scroll', measure); ro.disconnect(); };
    }, [items.length]);

    const fade = (on: boolean) => (on ? '28px' : '0px');
    const edgeMask = `linear-gradient(to right, transparent 0, #000 ${fade(overflow.start)}, #000 calc(100% - ${fade(overflow.end)}), transparent 100%)`;

    const textStrong = isDark ? '#e5e5e5' : '#111827';
    const textMuted = isDark ? '#6e6e6e' : '#9ca3af';

    // arrow keys move along the row
    const onKeyDown = (e: React.KeyboardEvent) => {
        const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        const jump = e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1 : null;
        if (!step && jump === null) return;
        e.preventDefault();
        const next = jump ?? Math.min(items.length - 1, Math.max(0, active + step));
        setActive(next);
        buttons.current[next]?.focus();
    };

    // drag to scroll with momentum
    const onPointerDown = (e: React.PointerEvent) => {
        const el = scrollRef.current;
        if (!el || e.pointerType !== 'mouse' || e.button !== 0 || el.scrollWidth <= el.clientWidth) return;
        const startX = e.clientX;
        const startLeft = el.scrollLeft;
        let lastX = e.clientX;
        let lastT = performance.now();
        let velocity = 0;
        dragMoved.current = false;
        const move = (ev: PointerEvent) => {
            const dx = ev.clientX - startX;
            if (Math.abs(dx) > 5) dragMoved.current = true;
            el.scrollLeft = startLeft - dx;
            const now = performance.now();
            velocity = (ev.clientX - lastX) / Math.max(1, now - lastT);
            lastX = ev.clientX;
            lastT = now;
        };
        const up = () => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
            if (reduceMotion) return;
            const glide = () => {
                if (Math.abs(velocity) < 0.02) return;
                el.scrollLeft -= velocity * 16;
                velocity *= 0.93;
                requestAnimationFrame(glide);
            };
            requestAnimationFrame(glide);
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
    };

    return (
        <div style={{ marginBottom: '36px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '14px', fontFamily: mono, fontSize: '0.68rem', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                <span style={{ color: textStrong, fontWeight: 600 }}>{label}</span>
                <span style={{ color: textMuted, fontVariantNumeric: 'tabular-nums' }}>{items.length} {items.length === 1 ? 'title' : 'titles'}</span>
            </div>

            <div
                ref={scrollRef}
                role="group"
                aria-label={`${label}. Use the arrow keys to browse and Enter to open one.`}
                onKeyDown={onKeyDown}
                onPointerDown={onPointerDown}
                onClickCapture={(e) => {
                    if (dragMoved.current) { e.stopPropagation(); e.preventDefault(); dragMoved.current = false; }
                }}
                style={{
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    scrollbarWidth: 'none',
                    // don't trigger back/forward swipe
                    overscrollBehaviorX: 'contain',
                    // no text selection while dragging
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    maskImage: edgeMask,
                    WebkitMaskImage: edgeMask,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', width: 'max-content', height: tallest + HEADROOM + 8, paddingBottom: 8, boxSizing: 'border-box' }}>
                    {items.map((m, i) => {
                        const format = resolveFormat(m);
                        const pulled = pulledId === m.id;
                        return (
                            <motion.button
                                key={m.id}
                                ref={(el) => { buttons.current[i] = el; registerSpine(m.id, el); }}
                                type="button"
                                tabIndex={i === active ? 0 : -1}
                                aria-label={`${m.title}, ${m.year}, ${FORMAT_LABEL[format]}, rated ${formatRating(m.rating)} out of 5`}
                                aria-haspopup="dialog"
                                onFocus={(e) => { setActive(i); setKeyboardFocus(e.currentTarget.matches(':focus-visible') ? i : null); }}
                                onBlur={() => setKeyboardFocus(null)}
                                onHoverStart={(e) => { setHovered(i); sfx.tick({ x: e.clientX }); }}
                                onHoverEnd={() => setHovered((h) => (h === i ? null : h))}
                                onClick={() => { setHovered(null); onPull(m); }}
                                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: reduceMotion ? 0 : entranceDelay(i), duration: 0.45, ease: EASE }}
                                style={{
                                    display: 'block',
                                    flexShrink: 0,
                                    padding: 0,
                                    border: 'none',
                                    background: 'none',
                                    cursor: 'pointer',
                                    visibility: pulled ? 'hidden' : 'visible',
                                }}
                            >
                                <Book entry={m} index={i} turned={turned === i} isDark={isDark} />
                            </motion.button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

/** rows of books, one per kind */
export const Shelf = ({ media, isDark, entranceDelay }: {
    media: MediaEntry[];
    isDark: boolean;
    entranceDelay: (index: number) => number;
}) => {
    const [pulled, setPulled] = useState<MediaEntry | null>(null);
    const spines = useRef(new Map<string, HTMLButtonElement>());

    const registerSpine = useCallback((id: string, el: HTMLButtonElement | null) => {
        if (el) spines.current.set(id, el);
        else spines.current.delete(id);
    }, []);

    const pulledId = pulled?.id ?? null;
    const getOrigin = useCallback(
        () => (pulledId ? spines.current.get(pulledId)?.getBoundingClientRect() ?? null : null),
        [pulledId]
    );
    const onClosed = useCallback(() => {
        setPulled(null);
        if (pulledId) requestAnimationFrame(() => spines.current.get(pulledId)?.focus({ preventScroll: true }));
    }, [pulledId]);

    const shelves = [
        { label: 'Movies', items: media.filter((m) => m.kind === 'movie') },
        { label: 'Series', items: media.filter((m) => m.kind === 'tv') },
    ].filter((s) => s.items.length > 0);

    return (
        <div>
            {shelves.map((s, si) => (
                <ShelfRow
                    key={s.label}
                    label={s.label}
                    items={s.items}
                    isDark={isDark}
                    pulledId={pulledId}
                    entranceDelay={(i) => entranceDelay(i + si * 4)}
                    registerSpine={registerSpine}
                    onPull={setPulled}
                />
            ))}
            {pulled && (
                <CaseStage
                    key={pulled.id}
                    entry={pulled}
                    format={resolveFormat(pulled)}
                    dims={caseDims(pulled)}
                    getOrigin={getOrigin}
                    onClosed={onClosed}
                />
            )}
        </div>
    );
};
