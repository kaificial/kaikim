"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform } from "framer-motion";
import type { CaseFormat, MediaEntry } from "../../data/media";
import { BLURAY_BLUE, FORMAT_LABEL, NEUTRAL_SPINE, SHADE, type CaseDims } from "./formats";
import { Spine } from "./Spine";
import { spineFont } from "./fonts";
import { shelfSounds } from "./sounds";
import { sfx } from "../../lib/sfx";
import { Disc } from "./Disc";
import { BackCover } from "./BackCover";
import { FormatLogo, logoFor } from "./FormatLogo";

const EASE = [0.22, 1, 0.36, 1] as const;
const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;
/** speeds out of the stage and lands softly, so swapping back to the shelf spine is invisible */
const GLIDE = [0.55, 0, 0.1, 1] as const;
/** critically damped: settles without bouncing and stops instead of creeping */
const CALM_SPRING = { type: 'spring', stiffness: 170, damping: 2 * Math.sqrt(170), restDelta: 0.5, restSpeed: 2 } as const;
const COVER_OPEN_DEG = -165;
const PLASTIC: Record<CaseFormat, string> = {
    dvd: '#121212',
    bluray: '#123d73',
    vhs: '#161616',
    boxset: '#1b1b1b',
};
const PAPER_GRAIN = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.09 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`;

const formatWatched = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString('en-CA', { day: 'numeric', month: 'short', year: 'numeric' });
const formatRating = (r: number) => (Number.isInteger(r) ? `${r}` : r.toFixed(1));

// the fixed stage sits inside the viewport minus the scrollbar, so measure that, not innerWidth
const viewport = () => ({ w: document.documentElement.clientWidth, h: document.documentElement.clientHeight });

type StageLayout = {
    scale: number;
    /** 'spread' shows the open case as two pages side by side, 'single' shows one page at a time */
    mode: 'spread' | 'single';
    /** touch first device: no hover, no keyboard hints, bigger controls */
    touch: boolean;
};

/**
 * biggest scale where the open case still fits. if the two-page spread would get too small to read
 * (phones in portrait), show one page at a time instead
 */
const fitLayout = (dims: CaseDims): StageLayout => {
    const { w, h } = viewport();
    const touch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    const compact = w < 640;
    // room for the "Put back" button up top and the controls at the bottom (they wrap on phones)
    const reserve = compact ? 190 : 140;
    const byHeight = (h - reserve) / dims.height;
    const spread = Math.min(1.7, (w - 32) / (dims.width * 2), byHeight);
    const single = Math.min(1.7, (w - 32) / dims.width, byHeight);
    const mode = spread < 1.2 && single > spread * 1.15 ? 'single' : 'spread';
    return { scale: Math.max(0.55, mode === 'single' ? single : spread), mode, touch };
};

/**
 * offset from the stage centre to the spine. once the stage exists, measure it directly, browsers get
 * the viewport width wrong while scrolling is locked
 */
const centreOffset = (rect: DOMRect | null, stage?: HTMLElement | null) => {
    const box = stage?.getBoundingClientRect();
    const { w, h } = box ? { w: box.width, h: box.height } : viewport();
    const left = box?.left ?? 0;
    const top = box?.top ?? 0;
    return rect
        ? { x: rect.left + rect.width / 2 - (left + w / 2), y: rect.top + rect.height / 2 - (top + h / 2) }
        : { x: 0, y: h / 2 };
};

const STAMP_INK = '#c4471f';
// speckled alpha so the stamp looks like ink pressed unevenly into paper
const INK_MASK = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='i'><feTurbulence type='fractalNoise' baseFrequency='1.4' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -3.2 0 0 0 2.5'/></filter><rect width='100%' height='100%' filter='url(%23i)'/></svg>")`;

const Cassette = ({ width, title }: { width: number; title: string }) => {
    // a vhs tape is 187 × 103 mm
    const height = width * (103 / 187);
    const reel = height * 0.42;
    return (
        <div style={{ width, height, borderRadius: '0.5em', background: 'linear-gradient(#1c1c1c, #101010)', boxShadow: '0 0.4em 1em rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.06)', position: 'relative' }}>
            <div className={spineFont.className} style={{ position: 'absolute', left: '8%', right: '8%', top: '8%', height: '24%', background: '#f1f0ec', borderRadius: '0.2em', display: 'flex', alignItems: 'center', padding: '0 0.6em', color: '#1a1a1a', fontWeight: 600, fontSize: '1.3em', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {title}
            </div>
            <div style={{ position: 'absolute', left: '22%', right: '22%', top: '42%', height: reel, borderRadius: '0.3em', background: 'rgba(40,40,40,0.9)', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.9)' }} />
            {[0.3, 0.7].map((x) => (
                <div key={x} aria-hidden style={{ position: 'absolute', left: `calc(${x * 100}% - ${reel / 2}px)`, top: '42%', width: reel, height: reel, borderRadius: '50%', background: 'repeating-conic-gradient(#e9e9e9 0 20deg, #bdbdbd 20deg 60deg)', boxShadow: 'inset 0 0 0 0.35em #3a2a1a' }} />
            ))}
        </div>
    );
};

const CoverArt = ({ entry, format, width }: { entry: MediaEntry; format: CaseFormat; width: number }) => {
    const framed = format === 'dvd' || format === 'bluray';
    return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: framed ? PLASTIC[format] : entry.spineColor ?? NEUTRAL_SPINE }}>
        <div style={{ position: 'absolute', inset: framed ? '0.3em 0.3em 0.3em 0.55em' : 0, overflow: 'hidden', borderRadius: framed ? '0.1em' : 0 }}>
        <Image src={entry.poster} alt="" fill sizes={`${Math.round(width)}px`} style={{ objectFit: 'cover' }} priority />
        {format === 'bluray' && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2.1em', background: BLURAY_BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FormatLogo kind="bluray" height="1.35em" color="#fff" label />
            </div>
        )}
        {format === 'dvd' && (
            <FormatLogo kind="dvd" height="2.2em" color="#fff" label style={{ position: 'absolute', right: '0.9em', bottom: '0.9em', filter: 'drop-shadow(0 0.1em 0.3em rgba(0,0,0,0.6))' }} />
        )}
        {format === 'boxset' && (
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '0.55em 1em', background: 'rgba(0,0,0,0.72)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1em' }}>
                <span className={spineFont.className} style={{ fontWeight: 800, fontSize: '1.2em', letterSpacing: '0.12em' }}>{entry.seasons ? `SEASONS 1–${entry.seasons}` : 'BOX SET'}</span>
                <FormatLogo kind="dvd" height="1.6em" color="#fff" label />
            </div>
        )}
        {format === 'vhs' && (
            <>
                <div className={spineFont.className} style={{ position: 'absolute', left: '0.8em', top: '0.8em', padding: '0.1em 0.4em', border: '2px solid #fff', color: '#fff', fontWeight: 800, fontSize: '1.2em', letterSpacing: '0.1em', mixBlendMode: 'difference' }}>
                    VHS
                </div>
                <div className={spineFont.className} style={{ position: 'absolute', right: '0.8em', bottom: '1.2em', transform: 'rotate(-7deg)', padding: '0.35em 0.6em', background: '#f4d21f', color: '#111', fontWeight: 800, fontSize: '1.05em', lineHeight: 1, textAlign: 'center', borderRadius: '0.25em', boxShadow: '0 2px 6px rgba(0,0,0,0.35)' }}>
                    BE KIND<br />REWIND
                </div>
            </>
        )}
        </div>
        {/* clear plastic sleeve over the art, with the ridge where it folds round the spine. vhs sleeves are plain card */}
        {format !== 'vhs' && (
            <>
                <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(115deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.04) 28%, transparent 45%, transparent 75%, rgba(255,255,255,0.08) 100%)' }} />
                <div aria-hidden style={{ position: 'absolute', top: 0, bottom: 0, left: '0.2em', width: '1px', background: 'rgba(255,255,255,0.28)' }} />
            </>
        )}
    </div>
    );
};

const LinerNotes = ({ entry, format, titleId }: { entry: MediaEntry; format: CaseFormat; titleId: string }) => {
    const ink = '#1c1c1c';
    const muted = '#6b6b66';
    const accent = '#2563eb';
    const logo = logoFor(format);
    const meta = [entry.kind === 'tv' ? 'Series' : 'Film', entry.year, entry.seasons && `${entry.seasons} seasons`].filter(Boolean).join(' · ');
    return (
        <div style={{
            position: 'absolute',
            inset: 0,
            background: `${PAPER_GRAIN}, #f7f6f2`,
            color: ink,
            padding: '1.9em 1.8em 1.6em',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85em',
            boxSizing: 'border-box',
            boxShadow: 'inset -0.4em 0 0.8em -0.5em rgba(0,0,0,0.18)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1em', paddingBottom: '0.7em', borderBottom: `1px solid rgba(0,0,0,0.12)` }}>
                <span style={{ fontSize: '0.85em', letterSpacing: '0.14em', textTransform: 'uppercase', color: muted }}>{meta}</span>
                {logo ? <FormatLogo kind={logo} height="1.5em" color={ink} label /> : <span className={spineFont.className} style={{ fontWeight: 800, letterSpacing: '0.12em', fontSize: '0.95em' }}>{FORMAT_LABEL[format]}</span>}
            </div>
            <h2 id={titleId} className={spineFont.className} style={{ fontSize: '3em', fontWeight: 800, lineHeight: 0.95, textTransform: 'uppercase', margin: 0, textWrap: 'balance' }}>
                {entry.title}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6em' }} aria-label={`Rated ${formatRating(entry.rating)} out of 5`} role="img">
                <div style={{ display: 'flex', gap: '0.25em' }}>
                    {[1, 2, 3, 4, 5].map((n) => (
                        <span key={n} style={{
                            width: '0.75em', height: '0.75em', borderRadius: '0.15em',
                            background: n <= entry.rating ? accent : n - 0.5 === entry.rating
                                ? `linear-gradient(90deg, ${accent} 50%, rgba(0,0,0,0.12) 50%)` : 'rgba(0,0,0,0.12)',
                        }} />
                    ))}
                </div>
                <span style={{ fontSize: '1.05em', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{formatRating(entry.rating)} / 5</span>
            </div>
            {entry.verdict && <p style={{ margin: 0, fontSize: '1.15em', fontWeight: 600, lineHeight: 1.4 }}>{entry.verdict}</p>}
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', fontSize: '1.08em', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                {entry.review ?? <span style={{ color: muted }}>No liner notes yet.</span>}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.4em 1.1em', paddingTop: '0.9em', borderTop: '1px solid rgba(0,0,0,0.12)', fontSize: '0.92em', color: muted }}>
                {entry.watched && !entry.letterboxdUrl && <span>Watched {formatWatched(entry.watched)}</span>}
                {!!entry.rewatches && <span>{entry.rewatches + 1} watches</span>}
                {entry.imdbUrl && <a href={entry.imdbUrl} target="_blank" rel="noopener noreferrer" style={{ color: muted, fontWeight: 600 }}>IMDb ↗</a>}
            </div>
            {entry.letterboxdUrl && (
                <motion.a
                    href={entry.letterboxdUrl}
                    data-sfx="stamp"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${entry.title} on Letterboxd (opens in a new tab)`}
                    className={spineFont.className}
                    initial={false}
                    whileHover={{ rotate: -3, scale: 1.05 }}
                    whileFocus={{ rotate: -3, scale: 1.05 }}
                    whileTap={{ scale: 0.93 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 2 * Math.sqrt(500) }}
                    style={{
                        rotate: -6,
                        position: 'absolute',
                        right: '1.4em',
                        bottom: '3.6em',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '0.35em 0.7em 0.3em',
                        border: `0.2em solid ${STAMP_INK}`,
                        borderRadius: '0.3em',
                        color: STAMP_INK,
                        textDecoration: 'none',
                        lineHeight: 1,
                        textTransform: 'uppercase',
                        mixBlendMode: 'multiply',
                        WebkitMaskImage: INK_MASK,
                        maskImage: INK_MASK,
                    }}
                >
                    <span style={{ fontSize: '0.8em', fontWeight: 600, letterSpacing: '0.18em' }}>Logged on</span>
                    <span style={{ fontSize: '1.55em', fontWeight: 800, letterSpacing: '0.04em' }}>Letterboxd</span>
                    {entry.watched && (
                        <span style={{ fontSize: '0.8em', fontWeight: 600, letterSpacing: '0.12em', fontVariantNumeric: 'tabular-nums' }}>
                            {entry.watched.replaceAll('-', '.')}
                        </span>
                    )}
                </motion.a>
            )}
            {/* the inside cover gets its own clear sleeve over the notes */}
            <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(245deg, rgba(255,255,255,0.35) 0%, transparent 30%, transparent 80%, rgba(0,0,0,0.04) 100%)' }} />
        </div>
    );
};

const Tray = ({ entry, format, width, height }: { entry: MediaEntry; format: CaseFormat; width: number; height: number }) => {
    const discs = format === 'boxset' ? Math.min(Math.max(entry.seasons ?? 1, 1), 4) : 1;
    const logo = logoFor(format);
    const discSize = Math.min(width * 0.86, height * 0.62);
    const plastic = PLASTIC[format];
    return (
        <div style={{
            position: 'absolute',
            inset: 0,
            // matte moulded plastic: one soft falloff from the top, nothing else
            background: `linear-gradient(rgba(255,255,255,0.045), rgba(0,0,0,0.18)), ${plastic}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transformStyle: 'preserve-3d',
        }}>
            {/* the raised rim around the edge of the tray */}
            <div aria-hidden style={{ position: 'absolute', inset: '0.4em', borderRadius: '0.35em', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05), inset 0 0.15em 0.3em rgba(0,0,0,0.35)' }} />
            {/* booklet clips on the hinge side */}
            {format !== 'vhs' && [0.16, 0.84].map((y) => (
                <div key={y} aria-hidden style={{ position: 'absolute', left: '0.4em', top: `calc(${y * 100}% - 0.8em)`, width: '0.45em', height: '1.6em', borderRadius: '0 0.25em 0.25em 0', background: `linear-gradient(90deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02)), ${plastic}`, boxShadow: '0.08em 0 0.15em rgba(0,0,0,0.5)' }} />
            ))}
            {format !== 'vhs' && discs === 1 && (
                <>
                    {/* the round well the disc sits in, and the two finger notches either side of it */}
                    <div aria-hidden style={{ position: 'absolute', left: '50%', top: '50%', width: discSize * 1.04, height: discSize * 1.04, marginLeft: -discSize * 0.52, marginTop: -discSize * 0.52, borderRadius: '50%', boxShadow: 'inset 0 0.2em 0.5em rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.04)' }} />
                    {[-1, 1].map((side) => (
                        <div key={side} aria-hidden style={{ position: 'absolute', left: `calc(50% + ${side * discSize * 0.5}px - 1.3em)`, top: 'calc(50% - 1.3em)', width: '2.6em', height: '2.6em', borderRadius: '50%', background: 'rgba(0,0,0,0.35)', boxShadow: 'inset 0 0.2em 0.4em rgba(0,0,0,0.6)' }} />
                    ))}
                </>
            )}
            {/* moulded format mark, pressed into the plastic */}
            <div aria-hidden style={{ position: 'absolute', bottom: '0.9em', left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
                {logo ? (
                    <FormatLogo kind={logo} height="1.4em" color="rgba(255,255,255,0.08)" style={{ filter: 'drop-shadow(0 1px 0 rgba(0,0,0,0.7))' }} />
                ) : (
                    <span className={spineFont.className} style={{ fontSize: '0.8em', fontWeight: 800, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.09)', textShadow: '0 1px 0 rgba(0,0,0,0.6)' }}>VIDEO CASSETTE</span>
                )}
            </div>
            {format === 'vhs' ? (
                <Cassette width={width * 0.84} title={entry.title} />
            ) : discs === 1 ? (
                <Disc entry={entry} format={format} size={discSize} discNumber={1} />
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, auto)', gap: width * 0.04, transformStyle: 'preserve-3d' }}>
                    {Array.from({ length: discs }, (_, i) => (
                        <div key={i} style={{ position: 'relative', borderRadius: '50%', boxShadow: 'inset 0 0.15em 0.4em rgba(0,0,0,0.55)', transformStyle: 'preserve-3d' }}>
                            <Disc
                                entry={entry}
                                format={format}
                                size={width * 0.42}
                                discNumber={i + 1}
                                label={i === discs - 1 && (entry.seasons ?? 0) > discs ? `S${i + 1}–${entry.seasons}` : `S${i + 1}`}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

type Phase = 'arriving' | 'inspect' | 'opening' | 'open' | 'shutting' | 'leaving';

/** which side faces you for a given turn of the case */
const FACES = ['Front cover', 'Spine', 'Back cover', 'Opening edge'] as const;
const facingOf = (deg: number) => FACES[((Math.round(deg / 90) % 4) + 4) % 4];
const TURN = { type: 'spring', stiffness: 220, damping: 2 * Math.sqrt(220), restDelta: 0.3, restSpeed: 2 } as const;

/**
 * full screen stage for a case pulled off the shelf. it flies out from the spine and turns to face you,
 * slowly sways while you look, and you can drag or arrow it round to see the spine, back and edge.
 * opening swings the cover to show the liner notes and disc, putting it back plays the whole trip in
 * reverse
 */
export const CaseStage = ({ entry, format, dims, getOrigin, onClosed }: {
    entry: MediaEntry;
    format: CaseFormat;
    dims: CaseDims;
    /** where the spine this case came from is on screen right now */
    getOrigin: () => DOMRect | null;
    onClosed: () => void;
}) => {
    const reduceMotion = useReducedMotion();
    const overlayRef = useRef<HTMLDivElement>(null);
    const backdropRef = useRef<HTMLDivElement>(null);
    const caseRef = useRef<HTMLDivElement>(null);
    const coverRef = useRef<HTMLDivElement>(null);
    const primaryRef = useRef<HTMLButtonElement>(null);
    const closing = useRef(false);
    const [layout] = useState(() => fitLayout(dims));
    const { scale, mode, touch } = layout;
    // in single page mode, which half of the open case is centred
    const [page, setPage] = useState<'notes' | 'disc'>('notes');
    const [from] = useState(() => centreOffset(getOrigin()));
    const [phase, setPhaseState] = useState<Phase>(reduceMotion ? 'inspect' : 'arriving');
    const phaseRef = useRef<Phase>(phase);
    const setPhase = (p: Phase) => { phaseRef.current = p; setPhaseState(p); };
    // read through a function so typescript doesn't narrow it across awaits (it can change)
    const currentPhase = (): Phase => phaseRef.current;

    // the case's own spin while you look at it, separate from the flight
    const orbitY = useMotionValue(0);
    const orbitX = useMotionValue(0);
    // the front cover's hinge angle: 0 shut, COVER_OPEN_DEG fully open
    const coverRot = useMotionValue(0);

    // light comes from the top left, same as the shelf
    // the cover throws a shadow on the tray as it lifts off, gone once it's laid flat
    const trayShade = useTransform(coverRot, [COVER_OPEN_DEG, -110, -25, 0], [0, 0.12, 0.6, 0.6]);
    // the inside of the cover faces away from the light until it's swung right round
    const notesShade = useTransform(coverRot, [COVER_OPEN_DEG, -120, -40, 0], [0, 0.06, 0.4, 0.4]);
    const facingRef = useRef<string>(FACES[0]);
    useMotionValueEvent(orbitY, 'change', (v) => {
        const next = facingOf(v);
        if (next === facingRef.current) return;
        facingRef.current = next;
        shelfSounds.tick();
    });

    const W = dims.width * scale;
    const H = dims.height * scale;
    const D = dims.depth * scale;
    // where the open case sits: centred on the spread, or on one page
    const openX = (p: 'notes' | 'disc') => (mode === 'spread' ? W / 2 : p === 'notes' ? W : 0);
    // turned spine-on, the spine sits half a cover-width closer to you. pushing the case
    // back by that much stops perspective from making it bigger than the shelf copy.
    // css scale() is 2d and never shrinks depth, so this is the full half-width on stage
    const spineZ = -W / 2;
    const titleId = `case-title-${entry.id}`;
    const footprint = useTransform(orbitY, (v) => {
        const r = (v * Math.PI) / 180;
        return Math.abs(Math.cos(r)) * W + Math.abs(Math.sin(r)) * D;
    });
    const caseColor = PLASTIC[format];
    const edgeColor = format === 'boxset' || format === 'vhs' ? entry.spineColor ?? NEUTRAL_SPINE : caseColor;

    // ── idle sway: stops when you touch the case and comes back after ──
    const tour = useRef<{ stop: () => void }[]>([]);
    const resumeTimer = useRef<number | undefined>(undefined);
    const stopTour = () => {
        tour.current.forEach((t) => t.stop());
        tour.current = [];
        window.clearTimeout(resumeTimer.current);
    };
    const startTour = () => {
        if (reduceMotion || phaseRef.current !== 'inspect' || tour.current.length) return;
        const y = orbitY.get();
        tour.current = [
            animate(orbitY, [y, y + 24, y - 24, y], { duration: 10, ease: 'easeInOut', repeat: Infinity }),
            animate(orbitX, [orbitX.get(), -5, 5, 0], { duration: 10, ease: 'easeInOut', repeat: Infinity }),
        ];
    };
    const scheduleTour = () => {
        window.clearTimeout(resumeTimer.current);
        resumeTimer.current = window.setTimeout(startTour, 2600);
    };

    useEffect(() => {
        // block scrolling by eating scroll input instead of hiding overflow. hiding the
        // scrollbar shifts the page and the spine wouldn't be where the case lands.
        // long liner notes can still scroll
        const insideScroller = (target: EventTarget | null) => {
            for (let el = target as HTMLElement | null; el && el !== overlayRef.current; el = el.parentElement) {
                if (el.scrollHeight > el.clientHeight && getComputedStyle(el).overflowY === 'auto') return true;
            }
            return false;
        };
        const block = (e: Event) => { if (!insideScroller(e.target)) e.preventDefault(); };
        const SCROLL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ']);
        const blockKeys = (e: KeyboardEvent) => {
            const onControl = (e.target as HTMLElement | null)?.closest?.('a, button');
            if (SCROLL_KEYS.has(e.key) && !(e.key === ' ' && onControl) && !insideScroller(e.target)) e.preventDefault();
        };
        window.addEventListener('wheel', block, { passive: false });
        window.addEventListener('touchmove', block, { passive: false });
        window.addEventListener('keydown', blockKeys);
        return () => {
            window.removeEventListener('wheel', block);
            window.removeEventListener('touchmove', block);
            window.removeEventListener('keydown', blockKeys);
        };
    }, []);

    useEffect(() => {
        primaryRef.current?.focus({ preventScroll: true });
        if (reduceMotion) return;
        const el = caseRef.current;
        const backdrop = backdropRef.current;
        if (!el || !backdrop) return;
        let cancelled = false;
        (async () => {
            shelfSounds.clack();
            sfx.whoosh({ duration: 0.45, rising: true });
            animate(backdrop, { opacity: [0, 1] }, { duration: 0.35 });
            // measure again now the stage is mounted and scrolling is locked
            const start = centreOffset(getOrigin(), overlayRef.current);
            animate(el, { x: [start.x, 0], y: [start.y, 0], z: [spineZ, 0], scale: [1 / scale, 1], rotateY: [90, 0] }, CALM_SPRING);
            await new Promise((r) => setTimeout(r, 700));
            if (cancelled || closing.current) return;
            setPhase('inspect');
            scheduleTour();
        })();
        return () => { cancelled = true; stopTour(); };
        // runs once per pull, from/scale are locked in at mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const turnBy = (deg: number) => {
        if (phaseRef.current !== 'inspect') return;
        stopTour();
        animate(orbitY, Math.round(orbitY.get() / 90) * 90 + deg, reduceMotion ? { duration: 0 } : TURN);
        scheduleTour();
    };
    const tiltBy = (deg: number) => {
        if (phaseRef.current !== 'inspect') return;
        stopTour();
        animate(orbitX, Math.max(-35, Math.min(35, orbitX.get() + deg)), reduceMotion ? { duration: 0 } : TURN);
        scheduleTour();
    };

    const openCase = async () => {
        const el = caseRef.current;
        const cover = coverRef.current;
        if (phaseRef.current !== 'inspect' || !el || !cover) return;
        stopTour();
        setPhase('opening');
        // square up to the front cover first, the short way round
        const home = Math.round(orbitY.get() / 360) * 360;
        const square = reduceMotion ? { duration: 0 } : TURN;
        await Promise.all([animate(orbitY, home, square), animate(orbitX, 0, square)]);
        if (currentPhase() !== 'opening') return;
        shelfSounds.snap();
        const swing = reduceMotion ? { duration: 0 } : { duration: 0.6, ease: EASE };
        animate(el, { x: openX(page) }, swing);
        await animate(coverRot, COVER_OPEN_DEG, swing);
        if (currentPhase() === 'opening') setPhase('open');
    };

    const showPage = (p: 'notes' | 'disc') => {
        const el = caseRef.current;
        if (phaseRef.current !== 'open' || !el || p === page) return;
        setPage(p);
        sfx.slide();
        animate(el, { x: openX(p) }, reduceMotion ? { duration: 0 } : { duration: 0.45, ease: EASE_IN_OUT });
    };

    const shutCase = async () => {
        const el = caseRef.current;
        const cover = coverRef.current;
        if (phaseRef.current !== 'open' || !el || !cover) return;
        setPhase('shutting');
        const swing = reduceMotion ? { duration: 0 } : { duration: 0.45, ease: EASE_IN_OUT };
        animate(el, { x: 0 }, swing);
        await animate(coverRot, 0, swing);
        if (currentPhase() !== 'shutting') return;
        shelfSounds.clack();
        setPhase('inspect');
        scheduleTour();
    };

    const close = useCallback(async () => {
        if (closing.current) return;
        closing.current = true;
        stopTour();
        phaseRef.current = 'leaving';
        setPhaseState('leaving');
        const el = caseRef.current;
        const cover = coverRef.current;
        const backdrop = backdropRef.current;
        if (reduceMotion || !el || !cover || !backdrop) {
            onClosed();
            return;
        }
        // one smooth glide home: the cover shuts and the case straightens while it's
        // already moving, and the turn to spine-on overlaps the flight
        const to = centreOffset(getOrigin(), overlayRef.current);
        sfx.whoosh({ duration: 0.6, rising: false, x: to.x + window.innerWidth / 2 });
        animate(orbitY, Math.round(orbitY.get() / 360) * 360, { duration: 0.4, ease: EASE_IN_OUT });
        animate(orbitX, 0, { duration: 0.4, ease: EASE_IN_OUT });
        animate(coverRot, 0, { duration: 0.34, ease: EASE_IN_OUT });
        animate(backdrop, { opacity: 0 }, { duration: 0.5, delay: 0.18, ease: 'easeOut' });
        await animate(el, { x: to.x, y: to.y, z: spineZ, scale: 1 / scale, rotateY: 90 }, {
            duration: 0.74,
            ease: GLIDE,
            rotateY: { delay: 0.2, duration: 0.54, ease: GLIDE },
            z: { delay: 0.2, duration: 0.54, ease: GLIDE },
            scale: { delay: 0.1, duration: 0.64, ease: GLIDE },
        });
        shelfSounds.clack();
        onClosed();
        // stopTour only touches refs, everything else stays the same for the life of the stage
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [coverRot, getOrigin, onClosed, reduceMotion, scale, spineZ]);

    // ── turning the case by hand: drag with inertia that settles on a side ──
    const drag = useRef<{ x: number; y: number; ry: number; rx: number; lastX: number; lastT: number; v: number; moved: number } | null>(null);
    const onCasePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (phaseRef.current !== 'inspect' || e.button !== 0) return;
        // don't select text while dragging
        if (e.pointerType === 'mouse') e.preventDefault();
        stopTour();
        e.currentTarget.setPointerCapture(e.pointerId);
        drag.current = { x: e.clientX, y: e.clientY, ry: orbitY.get(), rx: orbitX.get(), lastX: e.clientX, lastT: performance.now(), v: 0, moved: 0 };
    };
    const onCasePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const d = drag.current;
        if (!d) return;
        const dx = e.clientX - d.x;
        const dy = e.clientY - d.y;
        d.moved = Math.max(d.moved, Math.hypot(dx, dy));
        orbitY.set(d.ry + dx * 0.45);
        orbitX.set(Math.max(-35, Math.min(35, d.rx - dy * 0.3)));
        const now = performance.now();
        d.v = ((e.clientX - d.lastX) / Math.max(1, now - d.lastT)) * 1000 * 0.45;
        d.lastX = e.clientX;
        d.lastT = now;
    };
    const onCasePointerUp = () => {
        const d = drag.current;
        drag.current = null;
        if (!d) return;
        if (d.moved < 5) {
            void openCase();
            return;
        }
        if (reduceMotion) {
            orbitY.set(Math.round(orbitY.get() / 90) * 90);
        } else {
            animate(orbitY, orbitY.get(), {
                type: 'inertia',
                velocity: d.v,
                power: 0.35,
                timeConstant: 320,
                modifyTarget: (t) => Math.round(t / 90) * 90,
            });
            animate(orbitX, 0, TURN);
        }
        scheduleTour();
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            void close();
            return;
        }
        if (phaseRef.current === 'inspect') {
            const turns: Record<string, () => void> = {
                ArrowLeft: () => turnBy(-90),
                ArrowRight: () => turnBy(90),
                ArrowUp: () => tiltBy(-15),
                ArrowDown: () => tiltBy(15),
            };
            if (turns[e.key]) {
                e.preventDefault();
                turns[e.key]();
                return;
            }
        }
        if (e.key !== 'Tab' || !overlayRef.current) return;
        // keep focus inside the dialog
        const focusables = Array.from(overlayRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'));
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };

    // the rainbow shine on the disc follows the pointer like light on a real disc
    const onPointerMove = (e: React.PointerEvent) => {
        const el = caseRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const deg = (Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width * 0.75)) * 180) / Math.PI;
        el.style.setProperty('--sheen', `${deg}deg`);
    };

    const restingCase = reduceMotion
        ? 'none'
        : `translateX(${from.x}px) translateY(${from.y}px) translateZ(${spineZ}px) scale(${1 / scale}) rotateY(90deg)`;
    const face: React.CSSProperties = { position: 'absolute', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' };
    const isOpen = phase === 'open' || phase === 'opening';
    const busy = phase === 'arriving' || phase === 'opening' || phase === 'shutting' || phase === 'leaving';
    const pill: React.CSSProperties = {
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.18)',
        color: '#f5f5f5',
        borderRadius: 9999,
        padding: touch ? '10px 16px' : '6px 14px',
        fontSize: touch ? '0.8rem' : '0.75rem',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
    };
    const segment = (active: boolean): React.CSSProperties => ({
        ...pill,
        border: 'none',
        padding: touch ? '8px 14px' : '4px 12px',
        background: active ? 'rgba(255,255,255,0.2)' : 'transparent',
        fontWeight: active ? 600 : 400,
    });

    return createPortal(
        <div
            ref={overlayRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onKeyDown={onKeyDown}
            onPointerMove={onPointerMove}
            style={{ position: 'fixed', inset: 0, zIndex: 1200, perspective: '2000px' }}
        >
            <div
                ref={backdropRef}
                onClick={() => void close()}
                style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 45%, rgba(20,20,22,0.72), rgba(0,0,0,0.92))', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', opacity: reduceMotion ? 1 : 0 }}
            />

            <button type="button" onClick={() => void close()} style={{ ...pill, position: 'absolute', top: 'max(20px, env(safe-area-inset-top))', right: 'max(20px, env(safe-area-inset-right))', zIndex: 1 }}>
                Put back {!touch && <span style={{ opacity: 0.55, marginLeft: 6 }}>Esc</span>}
            </button>

            {/* soft shadow on the "floor" under the floating case, only while it hangs there to be looked at */}
            <motion.div
                aria-hidden
                initial={false}
                animate={{ opacity: phase === 'inspect' ? 1 : 0 }}
                transition={{ duration: phase === 'inspect' ? 0.5 : 0.15, ease: EASE }}
                style={{
                    position: 'absolute',
                    left: '50%',
                    top: `calc(50% + ${H / 2 + Math.max(18, H * 0.08)}px)`,
                    width: footprint,
                    height: Math.max(14, H * 0.06),
                    x: '-50%',
                    borderRadius: '50%',
                    background: 'radial-gradient(closest-side, rgba(0,0,0,0.55), rgba(0,0,0,0.25) 55%, transparent)',
                    filter: 'blur(6px)',
                    pointerEvents: 'none',
                }}
            />

            <div
                ref={caseRef}
                onPointerDown={onCasePointerDown}
                onPointerMove={onCasePointerMove}
                onPointerUp={onCasePointerUp}
                onPointerCancel={() => { drag.current = null; scheduleTour(); }}
                onPointerEnter={() => { if (phaseRef.current === 'inspect' && !drag.current) stopTour(); }}
                onPointerLeave={() => { if (phaseRef.current === 'inspect' && !drag.current) scheduleTour(); }}
                style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: W,
                    height: H,
                    marginLeft: -W / 2,
                    marginTop: -H / 2,
                    transformStyle: 'preserve-3d',
                    transform: restingCase,
                    fontSize: `${10 * scale}px`,
                    cursor: phase === 'inspect' ? 'grab' : 'default',
                    touchAction: phase === 'inspect' ? 'none' : 'auto',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                }}
            >
                <motion.div style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d', rotateX: orbitX, rotateY: orbitY }}>
                    {/* back cover */}
                    <div style={{ ...face, inset: 0, transform: `rotateY(180deg) translateZ(${D / 2}px)` }}>
                        <BackCover entry={entry} format={format} plastic={caseColor} width={W} />
                    </div>
                    {/* spine (left side, the hinge) */}
                    <div style={{ ...face, top: 0, left: (W - D) / 2, width: D, height: H, transform: `rotateY(-90deg) translateZ(${W / 2}px)` }}>
                        <Spine entry={entry} format={format} dims={dims} scale={scale} />
                    </div>
                    {/* opening edge, top and bottom */}
                    <div style={{ ...face, top: 0, left: (W - D) / 2, width: D, height: H, background: edgeColor, filter: SHADE.side, transform: `rotateY(90deg) translateZ(${W / 2}px)` }} />
                    <div style={{ ...face, left: 0, top: (H - D) / 2, width: W, height: D, background: edgeColor, filter: SHADE.top, transform: `rotateX(90deg) translateZ(${H / 2}px)` }} />
                    <div style={{ ...face, left: 0, top: (H - D) / 2, width: W, height: D, background: edgeColor, filter: SHADE.bottom, transform: `rotateX(-90deg) translateZ(${H / 2}px)` }} />
                    {/* inside tray, just under the cover */}
                    <div style={{ ...face, inset: 0, transformStyle: 'preserve-3d', transform: `translateZ(${D / 2 - 1}px)` }}>
                        <Tray entry={entry} format={format} width={W} height={H} />
                        <motion.div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: trayShade, background: 'linear-gradient(90deg, rgba(0,0,0,0.7), rgba(0,0,0,0.35) 45%, rgba(0,0,0,0.05) 85%, transparent)' }} />
                    </div>
                    {/* front cover, hinged on the spine edge. the hinge wrappers are invisible boxes over the whole tray, so only the cover's own faces should get the pointer */}
                    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', transformStyle: 'preserve-3d', transform: `translateZ(${D / 2 + 0.5}px)` }}>
                        <motion.div ref={coverRef} style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transformOrigin: 'left center', rotateY: coverRot }}>
                            <div style={{ ...face, inset: 0, pointerEvents: 'auto' }}>
                                <CoverArt entry={entry} format={format} width={W} />
                            </div>
                            <div style={{ ...face, inset: 0, pointerEvents: 'auto', transform: 'rotateY(180deg)' }}>
                                <LinerNotes entry={entry} format={format} titleId={titleId} />
                                <motion.div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: notesShade, background: 'linear-gradient(270deg, rgba(0,0,0,0.55), rgba(0,0,0,0.15) 70%)' }} />
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </div>

            {/* controls, plus a live readout of what you're looking at */}
            <div style={{
                position: 'absolute',
                left: 16,
                right: 16,
                bottom: 'max(24px, env(safe-area-inset-bottom))',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                zIndex: 1,
                pointerEvents: 'none',
            }}>
                {isOpen && mode === 'single' && (
                    <div role="group" aria-label="Show" style={{ display: 'inline-flex', padding: 3, gap: 2, borderRadius: 9999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', pointerEvents: 'auto' }}>
                        <button type="button" aria-pressed={page === 'notes'} onClick={() => showPage('notes')} style={segment(page === 'notes')}>Notes</button>
                        <button type="button" aria-pressed={page === 'disc'} onClick={() => showPage('disc')} style={segment(page === 'disc')}>Disc</button>
                    </div>
                )}
                {!isOpen && (
                    <button type="button" onClick={() => turnBy(180)} aria-disabled={phase !== 'inspect'} style={{ ...pill, opacity: phase === 'inspect' ? 1 : 0.5, pointerEvents: 'auto' }}>
                        Turn over
                    </button>
                )}
                <button
                    ref={primaryRef}
                    type="button"
                    aria-disabled={busy}
                    onClick={() => void (phase === 'open' ? shutCase() : openCase())}
                    style={{ ...pill, background: 'rgba(255,255,255,0.92)', color: '#111', fontWeight: 600, opacity: busy ? 0.6 : 1, pointerEvents: 'auto' }}
                >
                    {isOpen ? 'Close case' : 'Open case'}
                </button>
            </div>
        </div>,
        document.body
    );
};
