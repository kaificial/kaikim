"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import type { CaseFormat, MediaEntry } from "../../data/media";
import { NEUTRAL_SPINE } from "./formats";
import { spineFont } from "./fonts";
import { FormatLogo } from "./FormatLogo";
import { sfx } from "../../lib/sfx";

/*
 * anatomy of a 120 mm disc, as fractions of its 60 mm radius:
 *   spindle hole 7.5 mm · clamping area to 16.5 mm (stacking ring at 17 mm)
 *   mirror band to 23 mm · lead-in from 24 mm · data area to 58 mm · rim at 60 mm.
 * the printable label covers 11.5 mm to 59 mm on the other side
 */
const R = {
    hole: 12.5,
    printStart: 19,
    clamp: 27.5,
    stackRing: 28.3,
    mirror: 38.3,
    leadIn: 40,
    dataEnd: 96.7,
    printEnd: 98,
} as const;

const CALM = { type: 'spring', stiffness: 260, damping: 2 * Math.sqrt(260) } as const;
const HOLE_MASK = `radial-gradient(circle closest-side, transparent ${R.hole}%, #000 ${R.hole + 0.2}%)`;

/** the written spiral goes as far out as the rating: a 5/5 disc is full to the edge */
export const writtenRadius = (rating: number) => R.leadIn + (rating / 5) * (R.dataEnd - R.leadIn);

const ring = (radius: number): React.CSSProperties => ({
    position: 'absolute',
    inset: `${50 - radius / 2}%`,
    borderRadius: '50%',
});

/** the toothed spindle the disc snaps onto, you see it through the hole and when the disc lifts */
export const TrayHub = ({ size }: { size: number }) => (
    <div aria-hidden style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
        borderRadius: '50%',
        background: 'repeating-conic-gradient(#3b3b3b 0 13deg, #121212 13deg 30deg)',
        boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.08), 0 1px 3px rgba(0,0,0,0.7)',
    }}>
        <div style={{ position: 'absolute', inset: '28%', borderRadius: '50%', background: 'radial-gradient(circle at 40% 35%, #2c2c2c, #0b0b0b)' }} />
    </div>
);

/**
 * a disc you can play with: hover lifts it off the hub, click flips it to the data side, drag spins it.
 * the label side is a print of the poster in the spine colour, and the data side's dye stops at the
 * rating's radius
 */
export const Disc = ({ entry, format, size, discNumber, label }: {
    entry: MediaEntry;
    format: CaseFormat;
    size: number;
    discNumber: number;
    /** overrides "DISC n" on the label, e.g. "S2" */
    label?: string;
}) => {
    const reduceMotion = useReducedMotion();
    const uid = useId().replace(/:/g, '');
    const [flipped, setFlipped] = useState(false);
    const flip = useMotionValue(0);
    const lift = useMotionValue(0);
    const spin = useMotionValue(0);
    const spinVar = useTransform(spin, (v) => `${v}deg`);
    const drag = useRef<{ a0: number; s0: number; moved: number; lastA: number; lastT: number; v: number } | null>(null);
    // spin sound: gets brighter and louder with speed, while dragging and while it coasts
    const spinSound = useRef<ReturnType<typeof sfx.spin>>(null);
    const coast = useRef<number | undefined>(undefined);
    const SPIN_FULL = 1400; // deg/s that counts as full speed
    const stopSpinSound = () => {
        cancelAnimationFrame(coast.current ?? 0);
        spinSound.current?.stop();
        spinSound.current = null;
    };
    useEffect(() => stopSpinSound, []);

    const ink = entry.spineColor ?? NEUTRAL_SPINE;
    const rW = writtenRadius(entry.rating);
    const discName = label ?? `DISC ${discNumber}`;
    const rating = Number.isInteger(entry.rating) ? `${entry.rating}` : entry.rating.toFixed(1);
    const formatMark = format === 'bluray' ? 'BD' : 'DVD';
    const mouldCode = `KK·${entry.id.toUpperCase().replace(/[^A-Z0-9]/g, '')}·${entry.year}·${discName.replace(/\s/g, '')}`;

    const angleAt = (e: React.PointerEvent, el: HTMLElement) => {
        const r = el.getBoundingClientRect();
        return (Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180) / Math.PI;
    };

    const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (e.pointerType === 'mouse') e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        cancelAnimationFrame(coast.current ?? 0); // a new grab takes over from any coasting sound
        const a = angleAt(e, e.currentTarget);
        drag.current = { a0: a, s0: spin.get(), moved: 0, lastA: a, lastT: performance.now(), v: 0 };
    };
    const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
        const d = drag.current;
        if (!d) return;
        const a = angleAt(e, e.currentTarget);
        // unwrap across ±180° so a full turn keeps adding up
        let delta = a - d.lastA;
        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;
        const now = performance.now();
        d.v = (delta / Math.max(1, now - d.lastT)) * 1000;
        d.moved += Math.abs(delta);
        d.lastA = a;
        d.lastT = now;
        if (d.moved >= 4) {
            if (!spinSound.current) spinSound.current = sfx.spin();
            spinSound.current?.set(Math.abs(d.v) / SPIN_FULL);
        }
        spin.set(spin.get() + (flipped ? -delta : delta));
    };
    const onPointerUp = () => {
        const d = drag.current;
        drag.current = null;
        if (!d) return;
        if (d.moved < 4) {
            stopSpinSound();
            toggleFlip();
            return;
        }
        if (reduceMotion) { stopSpinSound(); return; }
        animate(spin, spin.get(), { type: 'inertia', velocity: flipped ? -d.v : d.v, power: 0.6, timeConstant: 650 });
        // let the sound wind down with the disc, then stop it
        const follow = () => {
            const speed = Math.abs(spin.getVelocity());
            spinSound.current?.set(speed / SPIN_FULL);
            if (speed < 30) { stopSpinSound(); return; }
            coast.current = requestAnimationFrame(follow);
        };
        coast.current = requestAnimationFrame(follow);
    };

    const toggleFlip = () => {
        const next = !flipped;
        setFlipped(next);
        sfx.flip(next);
        if (reduceMotion) { flip.set(next ? 180 : 0); return; }
        // lift off the hub, flip, and sit back flush so a closed cover clears it
        animate(lift, [lift.get(), size * 0.18, 0], { duration: 0.7, ease: [0.22, 1, 0.36, 1] });
        animate(flip, next ? 180 : 0, CALM);
    };

    const face: React.CSSProperties = {
        position: 'absolute',
        inset: 0,
        borderRadius: '50%',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        WebkitMaskImage: HOLE_MASK,
        maskImage: HOLE_MASK,
    };

    return (
        <div style={{ position: 'relative', width: size, height: size, flexShrink: 0, transformStyle: 'preserve-3d' }}>
            <TrayHub size={size * 0.27} />
            <motion.button
                type="button"
                aria-pressed={flipped}
                aria-label={`${discName} of ${entry.title}. ${flipped ? 'Showing the data side' : 'Showing the label'}; press to flip it over, or drag to spin it.`}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={() => { drag.current = null; }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); toggleFlip(); }
                }}
                onHoverStart={() => { if (!reduceMotion && !drag.current) animate(lift, size * 0.04, CALM); }}
                onHoverEnd={() => { if (!drag.current) animate(lift, 0, CALM); }}
                style={{
                    position: 'absolute',
                    inset: 0,
                    padding: 0,
                    border: 'none',
                    background: 'none',
                    borderRadius: '50%',
                    cursor: 'grab',
                    touchAction: 'none',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    transformStyle: 'preserve-3d',
                    rotateY: flip,
                    z: lift,
                    ['--spin' as string]: spinVar,
                }}
            >
                <motion.div style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d', rotate: spin, borderRadius: '50%', boxShadow: '0 0.4em 1em rgba(0,0,0,0.55)' }}>
                    {/* ── label side: printed art ── */}
                    <div style={{ ...face, background: 'linear-gradient(135deg, #e6e8eb, #b9bdc3)' }}>
                        {/* clear clamping area around the hole, with its stacking ring */}
                        <div style={{ ...ring(R.printStart), background: 'rgba(225,230,236,0.35)' }} />
                        <div style={{ ...ring(17 / 0.6), boxShadow: '0 0 0 1px rgba(255,255,255,0.45), 0 0 0 2px rgba(0,0,0,0.12)' }} />
                        <div style={{
                            ...ring(R.printEnd),
                            overflow: 'hidden',
                            background: ink,
                            WebkitMaskImage: `radial-gradient(circle closest-side, transparent ${(R.printStart / R.printEnd) * 100}%, #000 ${(R.printStart / R.printEnd) * 100 + 0.3}%)`,
                            maskImage: `radial-gradient(circle closest-side, transparent ${(R.printStart / R.printEnd) * 100}%, #000 ${(R.printStart / R.printEnd) * 100 + 0.3}%)`,
                        }}>
                            <Image
                                src={entry.poster}
                                alt=""
                                fill
                                sizes={`${Math.round(size)}px`}
                                style={{ objectFit: 'cover', filter: 'grayscale(1) contrast(1.25) brightness(1.05)', mixBlendMode: 'luminosity', opacity: 0.92 }}
                            />
                            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle closest-side, transparent 52%, rgba(0,0,0,0.62) 80%, rgba(0,0,0,0.7) 100%)' }} />
                        </div>
                        <svg viewBox="0 0 100 100" aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
                            <defs>
                                <path id={`top-${uid}`} d="M 50 50 m -40 0 a 40 40 0 1 1 80 0" />
                                <path id={`bottom-${uid}`} d="M 9.5 50 a 40.5 40.5 0 0 0 81 0" />
                            </defs>
                            <text className={spineFont.className} fill="#fff" fontSize="8.2" fontWeight={800} letterSpacing="0.6">
                                <textPath href={`#top-${uid}`} startOffset="50%" textAnchor="middle">{entry.title.toUpperCase()}</textPath>
                            </text>
                            <text fill="rgba(255,255,255,0.85)" fontSize="3.6" fontWeight={600} letterSpacing="0.9" style={{ fontFamily: 'var(--font-mono), monospace' }}>
                                <textPath href={`#bottom-${uid}`} startOffset="50%" textAnchor="middle">
                                    {`${discName} · ${entry.year} · ${formatMark} · ${rating}/5`}
                                </textPath>
                            </text>
                        </svg>
                        <div style={{ ...ring(R.printEnd), boxShadow: '0 0 0 1px rgba(255,255,255,0.35)' }} />
                        <FormatLogo kind={format === 'bluray' ? 'bluray' : 'dvd'} width="17%" color="#fff" style={{ position: 'absolute', left: '41.5%', top: '66%', filter: 'drop-shadow(0 0 0.15em rgba(0,0,0,0.6))' }} />
                    </div>

                    {/* ── data side: mirror, dye and the written spiral ── */}
                    <div style={{ ...face, transform: 'rotateY(180deg)' }}>
                        {/* everything inside the clamping area is clear plastic */}
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: '50%',
                            WebkitMaskImage: `radial-gradient(circle closest-side, transparent ${R.clamp}%, #000 ${R.clamp + 0.3}%)`,
                            maskImage: `radial-gradient(circle closest-side, transparent ${R.clamp}%, #000 ${R.clamp + 0.3}%)`,
                        }}>
                            {/* shiny chrome bands that stay still while the disc spins */}
                            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'conic-gradient(from calc(var(--sheen, 0deg) - var(--spin, 0deg)), #8e949c, #f5f7f9 12%, #b4bac1 22%, #6f757d 33%, #d9dde2 45%, #f8f9fa 52%, #9aa0a8 62%, #646a72 74%, #c9ced4 86%, #8e949c)' }} />
                            {/* the pressed data area reads a touch darker, out to the rating's radius */}
                            <div style={{ ...ring(rW), background: 'radial-gradient(circle closest-side, rgba(20,24,30,0.08), rgba(20,24,30,0.16))' }} />
                            <div style={{ ...ring(rW), boxShadow: '0 0 0 1px rgba(20,24,30,0.28)' }} />
                            {/* track lines, way exaggerated so you can see them */}
                            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'repeating-radial-gradient(circle closest-side, rgba(0,0,0,0.035) 0 0.25%, transparent 0.25% 0.6%)' }} />
                            {/* mirror band and lead-in: blank, so a bit brighter */}
                            <div style={{ ...ring(R.leadIn), boxShadow: '0 0 0 1px rgba(0,0,0,0.12)' }} />
                            <div style={{ ...ring(R.mirror), background: 'radial-gradient(circle closest-side, #e9ecef 60%, #aeb3ba)' }} />
                            {/* the one engraved label: the mould code, running round the mirror band */}
                            <svg viewBox="0 0 100 100" aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                                <defs>
                                    <path id={`code-${uid}`} d="M 50 50 m -16.2 0 a 16.2 16.2 0 1 1 32.4 0 a 16.2 16.2 0 1 1 -32.4 0" />
                                </defs>
                                <text fill="rgba(60,64,70,0.55)" fontSize="1.9" letterSpacing="0.35" style={{ fontFamily: 'var(--font-mono), monospace' }}>
                                    <textPath href={`#code-${uid}`}>{mouldCode}</textPath>
                                </text>
                            </svg>
                        </div>
                        <div style={{ ...ring(R.clamp), background: 'rgba(225,230,236,0.22)' }} />
                        <div style={{ ...ring(R.stackRing), boxShadow: '0 0 0 1px rgba(255,255,255,0.5), 0 0 0 2px rgba(0,0,0,0.15)' }} />
                        <div style={{ ...ring(100), boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.6)' }} />
                    </div>
                </motion.div>
            </motion.button>
        </div>
    );
};
