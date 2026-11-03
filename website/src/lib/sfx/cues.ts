"use client";

import { audio, canHover, outlet, prefersReducedMotion } from './engine';
import { note, PITCH } from './palette';
import { bell, continuousNoise, grains, noise, thump, tone, type Continuous } from './voices';

/**
 * every sound on the site lives here (full list: docs/sound-design-plan.md). the more often
 * something happens, the quieter it is: hover ≈ −38 dB, press ≈ −24 dB, rare stuff up to ≈ −14 dB.
 *
 * `x` pans the sound to where it happened (defaults to the last pointer spot),
 * `degree` picks a note from the site's pentatonic scale
 */
export type CueOpts = { x?: number; degree?: number };

/** drop repeats that come in faster than `ms` apart */
const limiter = (ms: number) => {
    let last = 0;
    return () => {
        const now = performance.now();
        if (now - last < ms) return false;
        last = now;
        return true;
    };
};

const pressLimit = limiter(30);
const hoverLimit = limiter(60);
const tickLimit = limiter(60);
const listLimit = limiter(50);
const keyLimit = limiter(30);

/* ── plastic: buttons, chips, cases ── */

/** pressing any control. with a degree, a soft note plays under the click */
export const press = ({ x, degree }: CueOpts = {}) => {
    const g = audio(true);
    if (!g || !pressLimit()) return;
    const out = outlet(g, x);
    noise(g.ctx, out, { duration: 0.03, freq: 3200, q: 1.8, gain: 0.21 });
    if (degree !== undefined) tone(g.ctx, out, { duration: 0.07, freq: note(degree, 5), type: 'triangle', gain: 0.135 });
    else thump(g.ctx, out, { duration: 0.035, freq: 220, gain: 0.15 });
};

/** hovering a control (desktop only, barely there) */
export const hover = ({ x, degree }: CueOpts = {}) => {
    if (!canHover()) return;
    const g = audio(false);
    if (!g || !hoverLimit()) return;
    const out = outlet(g, x);
    noise(g.ctx, out, { duration: 0.016, freq: 4200, q: 2, gain: 0.026 });
    if (degree !== undefined) tone(g.ctx, out, { duration: 0.04, freq: note(degree, 6), type: 'sine', gain: 0.018 });
};

/** plastic brushing past its neighbour: shelf spines, case sides, list steps */
export const tick = ({ x }: CueOpts = {}) => {
    const g = audio(false);
    if (!g || !tickLimit()) return;
    noise(g.ctx, outlet(g, x), { duration: 0.014, freq: 4200, q: 2, gain: 0.15 });
};

/** case sliding out of, or back into, the shelf */
export const clack = ({ x }: CueOpts = {}) => {
    const g = audio(true);
    if (!g) return;
    const out = outlet(g, x);
    noise(g.ctx, out, { duration: 0.04, freq: 1800, q: 1.5, gain: 0.16 });
    thump(g.ctx, out, { duration: 0.07, freq: 150, gain: 0.22 });
};

/** the case hinge clicking open */
export const snap = ({ x }: CueOpts = {}) => {
    const g = audio(true);
    if (!g) return;
    const out = outlet(g, x);
    noise(g.ctx, out, { duration: 0.018, freq: 2600, q: 3, gain: 0.14 });
    noise(g.ctx, out, { at: 0.05, duration: 0.022, freq: 2100, q: 3, gain: 0.1 });
};

/** on/off switch: goes up when on, down when off */
export const toggle = (on: boolean, { x }: CueOpts = {}) => {
    const g = audio(true);
    if (!g) return;
    const out = outlet(g, x);
    noise(g.ctx, out, { duration: 0.02, freq: 3600, q: 2, gain: 0.06 });
    tone(g.ctx, out, { at: 0.01, duration: 0.12, freq: on ? PITCH.D4 : PITCH.A4, to: on ? PITCH.A4 : PITCH.D4, type: 'triangle', gain: 0.06 });
};

/** theme switch: a toggle, plus a bright tick going light or a low thump going dark */
export const theme = (dark: boolean, opts: CueOpts = {}) => {
    const g = audio(true);
    if (!g) return;
    toggle(!dark, opts);
    const out = outlet(g, opts.x);
    if (dark) thump(g.ctx, out, { at: 0.06, duration: 0.16, freq: 70, gain: 0.14 });
    else noise(g.ctx, out, { at: 0.06, duration: 0.03, freq: 6000, q: 3, gain: 0.05 });
};

/**
 * the tile wave during a theme switch: quiet pixel blips walking down the scale into dark, or up into
 * light
 */
export const themeWave = (dark: boolean, durationMs: number, { x }: CueOpts = {}) => {
    const g = audio(true);
    if (!g) return;
    const out = outlet(g, x);
    const steps = 7;
    for (let i = 0; i < steps; i++) {
        const degree = dark ? 9 - i : 3 + i;
        // bunched up early like the wave, most tiles flip near the start
        const at = 0.05 + Math.pow(i / steps, 1.4) * (durationMs / 1000) * 0.8;
        tone(g.ctx, out, { at, duration: 0.035, freq: note(degree, 4), type: 'triangle', gain: 0.03 * (1 - i * 0.08), crush: 6 });
    }
};

/** something small popping in: a sine with a pitch drop */
export const pop = ({ x }: CueOpts = {}) => {
    const g = audio(true);
    if (!g) return;
    tone(g.ctx, outlet(g, x), { duration: 0.06, freq: 620, to: 300, type: 'sine', gain: 0.07 });
};

/** sliding between two halves of something (the mobile notes/disc switch) */
export const slide = ({ x }: CueOpts = {}) => {
    const g = audio(true);
    if (!g) return;
    noise(g.ctx, outlet(g, x), { duration: 0.12, freq: 900, to: 2400, q: 1.2, gain: 0.05, attack: 0.03 });
};

/* ── paper ── */

/** a card or photo getting flicked */
export const paper = ({ x }: CueOpts = {}) => {
    const g = audio(true);
    if (!g) return;
    grains(g.ctx, outlet(g, x), { count: 3, gap: 0.008, freq: 4500, gain: 0.07 });
};

/** a panel unfolding (grains going up) or folding away (going down, quicker) */
export const unfold = ({ x }: CueOpts = {}) => {
    const g = audio(true);
    if (!g) return;
    grains(g.ctx, outlet(g, x), { count: 3, gap: 0.03, freq: 2800, step: 1.25, gain: 0.06, duration: 0.02 });
};
export const fold = ({ x }: CueOpts = {}) => {
    const g = audio(true);
    if (!g) return;
    grains(g.ctx, outlet(g, x), { count: 2, gap: 0.02, freq: 4000, step: 0.8, gain: 0.05, duration: 0.016 });
};

/** rubber stamp on paper (the letterboxd stamp in the liner notes) */
export const stamp = ({ x }: CueOpts = {}) => {
    const g = audio(true);
    if (!g) return;
    const out = outlet(g, x);
    thump(g.ctx, out, { duration: 0.09, freq: 90, gain: 0.2 });
    noise(g.ctx, out, { duration: 0.05, freq: 1400, q: 0.7, gain: 0.08 });
};

/* ── air ── */

/** going to another page: an air sweep that ends on a paper flick */
export const nav = () => {
    if (prefersReducedMotion()) return;
    const g = audio(true);
    if (!g) return;
    const out = outlet(g);
    noise(g.ctx, out, { duration: 0.16, freq: 2000, to: 6000, type: 'lowpass', q: 0.7, gain: 0.05, attack: 0.04 });
    grains(g.ctx, out, { at: 0.15, count: 2, gap: 0.008, freq: 5000, gain: 0.04 });
};

/** something flying: the case leaving or coming back to the shelf */
export const whoosh = ({ x, duration = 0.3, rising = true }: CueOpts & { duration?: number; rising?: boolean } = {}) => {
    if (prefersReducedMotion()) return;
    const g = audio(true);
    if (!g) return;
    noise(g.ctx, outlet(g, x), { duration, freq: rising ? 500 : 3000, to: rising ? 3000 : 500, type: 'bandpass', q: 0.9, gain: 0.05, attack: duration * 0.35 });
};

/* ── glass ── */

/** a disc flipping over, the data side rings a bit brighter */
export const flip = (toDataSide: boolean, { x }: CueOpts = {}) => {
    const g = audio(true);
    if (!g) return;
    const out = outlet(g, x);
    noise(g.ctx, out, { duration: 0.02, freq: 5000, q: 2, gain: 0.04 });
    bell(g.ctx, out, { at: 0.01, duration: 0.45, freq: toDataSide ? PITCH.A5 : PITCH.Fs5, ratio: 3.5, index: toDataSide ? 2.4 : 1.6, gain: 0.05 });
};

/** it worked (like email copied) */
export const success = ({ x }: CueOpts = {}) => {
    const g = audio(true);
    if (!g) return;
    bell(g.ctx, outlet(g, x), { duration: 0.4, freq: PITCH.A5, ratio: 2, index: 1.2, gain: 0.07 });
};

/** a disc spinning under your finger: brightness follows the speed */
export const spin = (): Continuous | null => {
    if (prefersReducedMotion()) return null;
    const g = audio(true);
    if (!g) return null;
    return continuousNoise(g.ctx, outlet(g), { minFreq: 800, maxFreq: 4000, maxGain: 0.05 });
};

/* ── pixels and terminals ── */

/** the pixel heart: three notes going up with a little shimmer. already liked: one soft blip */
export const like = (first: boolean, { x }: CueOpts = {}) => {
    const g = audio(true);
    if (!g) return;
    const out = outlet(g, x);
    if (!first) {
        tone(g.ctx, out, { duration: 0.06, freq: PITCH.D4, type: 'square', gain: 0.05, crush: 4 });
        return;
    }
    [PITCH.D5, PITCH.Fs5, PITCH.A5].forEach((f, i) =>
        tone(g.ctx, out, { at: i * 0.045, duration: 0.05, freq: f, type: 'square', gain: 0.035, crush: 4 }));
    bell(g.ctx, out, { at: 0.13, duration: 0.18, freq: PITCH.D6, ratio: 3.5, index: 1, gain: 0.025 });
};

/** command palette opening (two notes up) or closing (down, shorter) */
export const open = () => {
    const g = audio(true);
    if (!g) return;
    const out = outlet(g);
    tone(g.ctx, out, { duration: 0.03, freq: PITCH.D5, type: 'triangle', gain: 0.04, crush: 6 });
    tone(g.ctx, out, { at: 0.032, duration: 0.04, freq: PITCH.A5, type: 'triangle', gain: 0.04, crush: 6 });
};
export const close = () => {
    const g = audio(true);
    if (!g) return;
    const out = outlet(g);
    tone(g.ctx, out, { duration: 0.02, freq: PITCH.A5, type: 'triangle', gain: 0.03, crush: 6 });
    tone(g.ctx, out, { at: 0.02, duration: 0.025, freq: PITCH.D5, type: 'triangle', gain: 0.03, crush: 6 });
};

/** moving through a list (command palette results) */
export const step = ({ degree = 0 }: CueOpts = {}) => {
    const g = audio(false);
    if (!g || !listLimit()) return;
    tone(g.ctx, outlet(g), { duration: 0.02, freq: note(degree, 6), type: 'triangle', gain: 0.06 });
};

/** a command ran: two notes going up */
export const confirm = () => {
    const g = audio(true);
    if (!g) return;
    const out = outlet(g);
    tone(g.ctx, out, { duration: 0.09, freq: PITCH.D5, type: 'triangle', gain: 0.05 });
    tone(g.ctx, out, { at: 0.08, duration: 0.12, freq: PITCH.Fs5, type: 'triangle', gain: 0.05 });
};

/** something didn't work: a buzzy note going down */
export const error = () => {
    const g = audio(true);
    if (!g) return;
    tone(g.ctx, outlet(g), { duration: 0.18, freq: PITCH.Fs4, to: PITCH.D4, type: 'square', gain: 0.06, crush: 3 });
};

/** a terminal keystroke: tiny, slightly different per key */
export const key = (char = '') => {
    const g = audio(true);
    if (!g || !keyLimit()) return;
    const code = char.charCodeAt(0) || 0;
    noise(g.ctx, outlet(g), { duration: 0.012, freq: 2500 + (code % 9) * 250, q: 2.2, gain: 0.09 });
};

/** the 404 dots blown apart: a whoosh plus pixel blips falling like the dots */
export const scatter = ({ x }: CueOpts = {}) => {
    const g = audio(true);
    if (!g) return;
    const out = outlet(g, x);
    if (!prefersReducedMotion()) noise(g.ctx, out, { duration: 0.35, freq: 3000, to: 400, type: 'lowpass', q: 0.6, gain: 0.07, attack: 0.005 });
    for (let i = 0; i < 6; i++) {
        const f = note(4 - i + Math.round(Math.random() * 2), 5);
        tone(g.ctx, out, { at: 0.02 + i * 0.035 + Math.random() * 0.015, duration: 0.04, freq: f, to: f * 0.7, type: 'square', gain: 0.018, crush: 4 });
    }
};

/** the 404 dots are all back together */
export const settle = () => {
    const g = audio(false);
    if (!g) return;
    bell(g.ctx, outlet(g), { duration: 0.5, freq: PITCH.A5, ratio: 2, index: 0.6, gain: 0.025 });
};

/** every sound, grouped by material, for /sfx-lab */
export const CATALOGUE: { material: string; cues: { name: string; play: () => void }[] }[] = [
    { material: 'Plastic', cues: [
        { name: 'press', play: () => press() },
        { name: 'press · scale run', play: () => [0, 1, 2, 3, 4, 5].forEach((d, i) => setTimeout(() => press({ degree: d }), i * 90)) },
        { name: 'hover', play: () => hover({ degree: 2 }) },
        { name: 'tick', play: () => tick() },
        { name: 'clack', play: () => clack() },
        { name: 'snap', play: () => snap() },
        { name: 'toggle on', play: () => toggle(true) },
        { name: 'toggle off', play: () => toggle(false) },
        { name: 'theme → dark', play: () => theme(true) },
        { name: 'theme → light', play: () => theme(false) },
        { name: 'theme wave → dark', play: () => themeWave(true, 1100) },
        { name: 'theme wave → light', play: () => themeWave(false, 1100) },
        { name: 'pop', play: () => pop() },
        { name: 'slide', play: () => slide() },
    ] },
    { material: 'Paper', cues: [
        { name: 'paper', play: () => paper() },
        { name: 'unfold', play: () => unfold() },
        { name: 'fold', play: () => fold() },
        { name: 'stamp', play: () => stamp() },
    ] },
    { material: 'Air', cues: [
        { name: 'nav', play: () => nav() },
        { name: 'whoosh out', play: () => whoosh() },
        { name: 'whoosh back', play: () => whoosh({ rising: false }) },
    ] },
    { material: 'Glass', cues: [
        { name: 'flip → data side', play: () => flip(true) },
        { name: 'flip → label', play: () => flip(false) },
        { name: 'success', play: () => success() },
    ] },
    { material: 'Phosphor', cues: [
        { name: 'like', play: () => like(true) },
        { name: 'like (again)', play: () => like(false) },
        { name: 'open', play: () => open() },
        { name: 'close', play: () => close() },
        { name: 'step', play: () => step({ degree: 3 }) },
        { name: 'confirm', play: () => confirm() },
        { name: 'error', play: () => error() },
        { name: 'key', play: () => key('k') },
        { name: 'scatter', play: () => scatter() },
        { name: 'settle', play: () => settle() },
    ] },
];
