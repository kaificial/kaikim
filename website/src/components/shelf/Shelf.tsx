"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { MediaEntry } from "../../data/media";
import { caseDims, FORMAT_LABEL, NEUTRAL_SPINE, resolveFormat, SHADE } from "./formats";
import { Spine } from "./Spine";
import { CaseStage } from "./CaseStage";
import { sfx } from "../../lib/sfx";

const EASE = [0.22, 1, 0.36, 1] as const;
const HEADROOM = 30; // room above the tallest case for the hover lift
/** pulling a case up: quick, with the faintest settle so it feels like it has weight */
const LIFT_SPRING = { type: 'spring', duration: 0.42, bounce: 0.12 } as const;
/** neighbours leaning out of the way: slower and softer than the lift so the lift leads */
const LEAN_SPRING = { type: 'spring', duration: 0.55, bounce: 0 } as const;
/** how far the cases either side of a lifted one tip away from it */
const LEAN_DEG = 1.6;
const formatRating = (r: number) => (Number.isInteger(r) ? `${r}` : r.toFixed(1));

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
    // only keyboard focus leans a case out, focus coming back after a mouse put-back stays still
    const [keyboardFocus, setKeyboardFocus] = useState<number | null>(null);
    const [hovered, setHovered] = useState<number | null>(null);
    // the case that's pulled up: under the mouse, or keyboard focused
    const lifted = reduceMotion ? null : hovered ?? keyboardFocus;
    const scrollRef = useRef<HTMLDivElement>(null);
    const buttons = useRef<(HTMLButtonElement | null)[]>([]);
    const dragMoved = useRef(false);
    const tallest = Math.max(...items.map((m) => caseDims(m).height));
    // which ends have more cases out of view. they fade so you can tell the shelf scrolls,
    // which matters on touch screens where there's no scrollbar or drag cursor
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
        return () => { el.removeEventListener('scroll', measure); ro.disconnect(); };
    }, [items.length]);

    const fade = (on: boolean) => (on ? '28px' : '0px');
    const edgeMask = `linear-gradient(to right, transparent 0, #000 ${fade(overflow.start)}, #000 calc(100% - ${fade(overflow.end)}), transparent 100%)`;

    const textSecondary = isDark ? '#6e6e6e' : '#6b7280';

    // arrow keys walk along the shelf, only one spine is in the tab order
    const onKeyDown = (e: React.KeyboardEvent) => {
        const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        const jump = e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1 : null;
        if (!step && jump === null) return;
        e.preventDefault();
        const next = jump ?? Math.min(items.length - 1, Math.max(0, active + step));
        setActive(next);
        buttons.current[next]?.focus();
    };

    // mouse drag-to-scroll with a bit of momentum, touch keeps normal scrolling
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
        <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: textSecondary }}>
                <span style={{ fontWeight: 600 }}>{label}</span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{items.length}</span>
            </div>

            {/* cubby: back wall, then the plank the cases stand on */}
            <div style={{
                borderRadius: '6px 6px 0 0',
                background: isDark ? 'linear-gradient(#161616, #0e0e0e)' : 'linear-gradient(#ededf0, #e1e1e5)',
                boxShadow: 'inset 0 14px 18px -14px rgba(0,0,0,0.45)',
            }}>
                <div
                    ref={scrollRef}
                    role="group"
                    aria-label={`${label} shelf. Use the arrow keys to browse and Enter to take a case off the shelf.`}
                    onKeyDown={onKeyDown}
                    onPointerDown={onPointerDown}
                    onClickCapture={(e) => {
                        if (dragMoved.current) { e.stopPropagation(); e.preventDefault(); dragMoved.current = false; }
                    }}
                    style={{
                        overflowX: 'auto',
                        overflowY: 'hidden',
                        scrollbarWidth: 'none',
                        paddingTop: HEADROOM,
                        // a sideways swipe scrolls the shelf, not the browser's back/forward gesture
                        overscrollBehaviorX: 'contain',
                        // dragging the shelf shouldn't select the spine titles
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                        maskImage: edgeMask,
                        WebkitMaskImage: edgeMask,
                    }}
                >
                    <div style={{
                        display: 'flex',
                        alignItems: 'flex-end',
                        gap: '2px',
                        padding: '0 14px',
                        width: 'max-content',
                        minHeight: tallest,
                        perspective: '900px',
                        perspectiveOrigin: '50% -60%',
                    }}>
                        {items.map((m, i) => {
                            const format = resolveFormat(m);
                            const dims = caseDims(m, format);
                            const pulled = pulledId === m.id;
                            const isLifted = lifted === i;
                            // the cases right next to it lean away, tipping on their outer bottom corner
                            const side = lifted === null || pulled ? 0 : i === lifted - 1 ? -1 : i === lifted + 1 ? 1 : 0;
                            return (
                                <motion.div
                                    key={m.id}
                                    initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 28 }}
                                    animate={{ opacity: 1, y: 0, rotate: side * LEAN_DEG, x: side * 1.5 }}
                                    transition={{
                                        default: { delay: reduceMotion ? 0 : entranceDelay(i), duration: 0.45, ease: EASE },
                                        rotate: LEAN_SPRING,
                                        x: LEAN_SPRING,
                                    }}
                                    style={{ position: 'relative', transformStyle: 'preserve-3d', flexShrink: 0, transformOrigin: side < 0 ? '0% 100%' : '100% 100%' }}
                                >
                                    {/* contact shadow on the plank: tight and dark when standing, soft and faint when pulled up */}
                                    {!pulled && (
                                        <motion.div
                                            aria-hidden
                                            initial={false}
                                            animate={isLifted ? { opacity: 0.35, scaleX: 1.6, scaleY: 1.4 } : { opacity: 1, scaleX: 1, scaleY: 1 }}
                                            transition={LIFT_SPRING}
                                            style={{
                                                position: 'absolute',
                                                left: -3,
                                                right: -3,
                                                bottom: -3,
                                                height: 6,
                                                borderRadius: '50%',
                                                background: `radial-gradient(closest-side, rgba(0,0,0,${isDark ? 0.75 : 0.32}), transparent)`,
                                                pointerEvents: 'none',
                                            }}
                                        />
                                    )}
                                    <motion.button
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
                                        initial={false}
                                        animate={isLifted ? 'lift' : 'rest'}
                                        variants={{ rest: { y: 0, rotateX: 0 }, lift: { y: -14, rotateX: -9 } }}
                                        transition={LIFT_SPRING}
                                        style={{
                                            display: 'block',
                                            position: 'relative',
                                            padding: 0,
                                            border: 'none',
                                            background: 'none',
                                            cursor: 'pointer',
                                            transformOrigin: '50% 100%',
                                            transformStyle: 'preserve-3d',
                                            visibility: pulled ? 'hidden' : 'visible',
                                            boxShadow: isDark ? '2px 0 3px rgba(0,0,0,0.5)' : '2px 0 3px rgba(0,0,0,0.18)',
                                        }}
                                    >
                                        <Spine entry={m} format={format} dims={dims} />
                                        {/* top edge, going back into the shelf */}
                                        <div aria-hidden style={{
                                            position: 'absolute',
                                            left: 0,
                                            top: 0,
                                            width: dims.depth,
                                            height: dims.width * 0.6,
                                            background: m.spineColor ?? NEUTRAL_SPINE,
                                            filter: SHADE.top,
                                            transformOrigin: '50% 0',
                                            transform: 'rotateX(-90deg)',
                                        }} />
                                    </motion.button>
                                </motion.div>
                            );
                        })}
                        {/* bookend holding the row up */}
                        <div aria-hidden style={{ display: 'flex', alignItems: 'flex-end', marginLeft: '3px', height: tallest * 0.55 }}>
                            <div style={{
                                width: '5px',
                                height: '100%',
                                borderRadius: '2px 2px 0 0',
                                background: isDark ? 'linear-gradient(90deg, #5c5c5c, #2c2c2c)' : 'linear-gradient(90deg, #9a9aa2, #6c6c74)',
                                boxShadow: '2px 0 4px rgba(0,0,0,0.3)',
                            }} />
                            <div style={{ width: '22px', height: '3px', background: isDark ? '#3a3a3a' : '#85858d' }} />
                        </div>
                    </div>
                </div>
            </div>
            <div aria-hidden style={{
                height: '14px',
                borderRadius: '0 0 4px 4px',
                background: isDark
                    ? 'linear-gradient(#34343a 0, #34343a 3px, #232327 3px, #1a1a1d 100%)'
                    : 'linear-gradient(#f7f7f9 0, #f7f7f9 3px, #cfcfd4 3px, #bcbcc2 100%)',
                boxShadow: isDark ? '0 10px 16px -8px rgba(0,0,0,0.7)' : '0 10px 16px -8px rgba(0,0,0,0.25)',
            }} />
        </div>
    );
};

/** the collection as cases on shelves, one shelf per kind. click a spine to take the case down */
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
