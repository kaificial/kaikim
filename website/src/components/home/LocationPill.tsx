"use client";

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cssVar } from '../../styles/palette';
import { POP, PRESS, mouseOnly } from '../../styles/motion';
import { sfx } from '../../lib/sfx';
import { isMuted } from '../../lib/sfx/engine';
import Image from 'next/image';

/** toronto pill with live local time. hover shows toto.png */

const TIME = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Toronto', hour: 'numeric', minute: '2-digit' });

/** toronto time, updated every minute */
const useTorontoTime = () => {
    const [now, setNow] = useState('');
    useEffect(() => {
        const tick = () => setNow(TIME.format(new Date()));
        tick();
        let id = 0;
        // sync to the start of each minute
        const first = window.setTimeout(() => { tick(); id = window.setInterval(tick, 60_000); }, 60_000 - (Date.now() % 60_000));
        return () => { window.clearTimeout(first); window.clearInterval(id); };
    }, []);
    return now;
};

const DRAKE_VOLUME = 0.18;
const FADE_MS = 250;

/** plays drake.mp3 quietly while the pill is open. silent when muted */
const useDrake = (playing: boolean) => {
    const audio = useRef<HTMLAudioElement | null>(null);
    const fade = useRef(0);

    useEffect(() => {
        if (playing && isMuted()) return;
        if (!audio.current) {
            if (!playing) return;
            audio.current = new Audio('/assets/drake.mp3');
            audio.current.preload = 'auto';
        }
        const el = audio.current;
        cancelAnimationFrame(fade.current);

        if (playing) {
            // restart unless still fading out
            if (el.paused) { el.volume = 0; el.currentTime = 0; }
            el.play().catch(() => {});
        }
        const from = el.volume;
        const to = playing ? DRAKE_VOLUME : 0;
        const start = performance.now();
        const step = (now: number) => {
            const k = Math.min(1, (now - start) / FADE_MS);
            el.volume = from + (to - from) * k;
            if (k < 1) fade.current = requestAnimationFrame(step);
            else if (!playing) el.pause();
        };
        fade.current = requestAnimationFrame(step);
    }, [playing]);

    // stop on unmount
    useEffect(() => () => { cancelAnimationFrame(fade.current); audio.current?.pause(); }, []);
};

export const LocationPill = () => {
    const time = useTorontoTime();
    const [open, setOpen] = useState(false);
    useDrake(open);

    return (
        <motion.button
            type="button"
            aria-expanded={open}
            aria-label={`Toronto, Ontario${time ? `, local time ${time}` : ''}`}
            whileTap={PRESS}
            className="location-pill"
            onPointerEnter={mouseOnly(() => setOpen(true))}
            onPointerLeave={mouseOnly(() => setOpen(false))}
            onClick={(e) => { sfx.pop({ x: e.clientX }); setOpen((v) => !v); }}
            style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'stretch',
                padding: 0,
                borderRadius: '9999px',
                // colors come from .location-pill in globals.scss
                ...(open && { borderColor: cssVar.textMuted }),
                color: cssVar.textStrong,
                font: 'inherit',
                fontSize: '0.8125rem',
                lineHeight: 1,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
            }}
        >
            <AnimatePresence>
                {open && (
                    <motion.span
                        {...POP}
                        style={{ position: 'absolute', bottom: 'calc(100% + 8px)', left: 0, transformOrigin: '20px 100%', zIndex: 50, pointerEvents: 'none' }}
                    >
                        <Image
                            src="/assets/toto.png"
                            alt="Toronto"
                            width={451}
                            height={443}
                            style={{
                                display: 'block',
                                width: '140px',
                                height: 'auto',
                                borderRadius: '12px',
                                border: `1px solid ${cssVar.chipBorder}`,
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)',
                            }}
                        />
                    </motion.span>
                )}
            </AnimatePresence>

            {/* city */}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 11px 7px 10px' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span style={{ fontWeight: 500 }}>Toronto, ON</span>
            </span>

            {/* time */}
            <span
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '7px 12px 7px 11px',
                    borderLeft: '1px dashed var(--pill-divider)',
                    color: cssVar.textMuted,
                    fontVariantNumeric: 'tabular-nums',
                    minWidth: '6.5ch',
                    justifyContent: 'center',
                }}
            >
                {time || ' '}
            </span>
        </motion.button>
    );
};
