"use client";

import { audio, outlet, prefersReducedMotion } from './engine';
import { PITCH } from './palette';
import { bell, continuousNoise, noise, thump, tone, type Continuous } from './voices';

/**
 * every sound on the site lives here (full list: docs/sound-design-plan.md). the more often
 * something happens, the quieter it is. hover and page changes are silent, presses are a soft click,
 * only rare moments (like, success) get a note.
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
const tickLimit = limiter(60);
const listLimit = limiter(50);
const keyLimit = limiter(30);

// keep it quiet: soft sines and short clicks, no melodies on stuff you do all the time.
// `degree` still works but presses don't play a scale anymore

/** soft click: a tiny noise tick with a bit of sine under it. most ui sounds use this */
const click = (c: BaseAudioContext, out: AudioNode, { at = 0, gain = 1, freq = 2400 }: { at?: number; gain?: number; freq?: number } = {}) => {
    noise(c, out, { at, duration: 0.012, freq: 5200, q: 0.9, gain: 0.07 * gain });
    tone(c, out, { at, duration: 0.03, freq, to: freq * 0.85, type: 'sine', gain: 0.028 * gain });
};

/* ── plastic: buttons, chips, cases ── */

/** pressing any control */
export const press = ({ x }: CueOpts = {}) => {
    const g = audio(true);
    if (!g || !pressLimit()) return;
    click(g.ctx, outlet(g, x));
};

/** hovering a control: silent on purpose, sound on every hover is noise */
export const hover = (opts: CueOpts = {}) => { void opts; };

/** brushing past a neighbour: shelf spines, case sides, list steps */
export const tick = ({ x }: CueOpts = {}) => {
    const g = audio(false);
    if (!g || !tickLimit()) return;
    noise(g.ctx, outlet(g, x), { duration: 0.008, freq: 5600, q: 1.2, gain: 0.045 });
};

/** case sliding out of, or back into, the shelf */
export const clack = ({ x }: CueOpts = {}) => {
    const g = audio(true);
    if (!g) return;
    click(g.ctx, outlet(g, x), { freq: 1400, gain: 1.1 });
};

/** the case hinge clicking open */
export const snap = ({ x }: CueOpts = {}) => {
    const g = audio(true);
    if (!g) return;
    click(g.ctx, outlet(g, x), { freq: 2000 });
};

/** on/off switch: a click with a short sine nudge up (on) or down (off) */
export const toggle = (on: boolean, { x }: CueOpts = {}) => {
    const g = audio(true);
    if (!g) return;
    const out = outlet(g, x);
    click(g.ctx, out, { gain: 0.8 });
    tone(g.ctx, out, { at: 0.01, duration: 0.08, freq: on ? PITCH.A5 : PITCH.D6, to: on ? PITCH.D6 : PITCH.A5, type: 'sine', gain: 0.022, attack: 0.006 });
};

/** theme switch: just the toggle */
export const theme = (dark: boolean, opts: CueOpts = {}) => toggle(!dark, opts);

/** the tile wave during a theme switch: one quiet airy swell that lasts as long as the wave */
export const themeWave = (dark: boolean, durationMs: number, { x }: CueOpts = {}) => {
    if (prefersReducedMotion()) return;
    const g = audio(true);
    if (!g) return;
    const d = Math.min(0.9, (durationMs / 1000) * 0.7);
    noise(g.ctx, outlet(g, x), { at: 0.03, duration: d, freq: dark ? 3200 : 1200, to: dark ? 1200 : 3200, type: 'bandpass', q: 0.6, gain: 0.018, attack: d * 0.4 });
};

/** something small appearing */
export const pop = ({ x }: CueOpts = {}) => {
    const g = audio(true);
    if (!g) return;
    tone(g.ctx, outlet(g, x), { duration: 0.045, freq: 1100, to: 760, type: 'sine', gain: 0.035 });
};

/** sliding between two halves of something (the mobile notes/disc switch) */
export const slide = ({ x }: CueOpts = {}) => {
    const g = audio(true);
    if (!g) return;
    noise(g.ctx, outlet(g, x), { duration: 0.09, freq: 1600, to: 3600, q: 0.8, gain: 0.022, attack: 0.03 });
};

/* ── paper ── */

/** a card or photo getting flicked */
export const paper = ({ x }: CueOpts = {}) => {
    const g = audio(true);
    if (!g) return;
    noise(g.ctx, outlet(g, x), { duration: 0.02, freq: 4800, q: 0.7, gain: 0.04 });
};

/** a panel opening: a short soft rise */
export const unfold = ({ x }: CueOpts = {}) => {
    const g = audio(true);
    if (!g) return;
    noise(g.ctx, outlet(g, x), { duration: 0.06, freq: 2400, to: 5200, q: 0.8, gain: 0.03, attack: 0.015 });
};
/** a panel closing: the same, falling and quicker */
export const fold = ({ x }: CueOpts = {}) => {
    const g = audio(true);
    if (!g) return;
    noise(g.ctx, outlet(g, x), { duration: 0.04, freq: 5200, to: 2400, q: 0.8, gain: 0.025, attack: 0.008 });
};

/** rubber stamp on paper (the letterboxd stamp in the liner notes) */
export const stamp = ({ x }: CueOpts = {}) => {
    const g = audio(true);
    if (!g) return;
    const out = outlet(g, x);
    thump(g.ctx, out, { duration: 0.06, freq: 110, gain: 0.08 });
    noise(g.ctx, out, { duration: 0.025, freq: 2400, q: 0.7, gain: 0.03 });
};

/* ── air ── */

/** going to another page: silent, the page change is feedback enough */
export const nav = () => {};

/** something flying: the case leaving or coming back to the shelf */
export const whoosh = ({ x, duration = 0.3, rising = true }: CueOpts & { duration?: number; rising?: boolean } = {}) => {
    if (prefersReducedMotion()) return;
    const g = audio(true);
    if (!g) return;
    noise(g.ctx, outlet(g, x), { duration, freq: rising ? 900 : 3200, to: rising ? 3200 : 900, type: 'bandpass', q: 0.6, gain: 0.022, attack: duration * 0.4 });
};

/* ── glass ── */

/** a disc flipping over */
export const flip = (toDataSide: boolean, { x }: CueOpts = {}) => {
    const g = audio(true);
    if (!g) return;
    bell(g.ctx, outlet(g, x), { duration: 0.3, freq: toDataSide ? PITCH.A5 : PITCH.Fs5, ratio: 2, index: 0.5, gain: 0.03 });
};

/** it worked (like email copied): one clean sine chime */
export const success = ({ x }: CueOpts = {}) => {
    const g = audio(true);
    if (!g) return;
    bell(g.ctx, outlet(g, x), { duration: 0.35, freq: PITCH.A5, ratio: 2, index: 0.4, gain: 0.04 });
};

/** a disc spinning under your finger: brightness follows the speed */
export const spin = (): Continuous | null => {
    if (prefersReducedMotion()) return null;
    const g = audio(true);
    if (!g) return null;
    return continuousNoise(g.ctx, outlet(g), { minFreq: 1200, maxFreq: 4200, maxGain: 0.025, q: 0.8 });
};

// chimes

/** liking the site: two soft sine notes going up. already liked: just a click */
export const like = (first: boolean, { x }: CueOpts = {}) => {
    const g = audio(true);
    if (!g) return;
    const out = outlet(g, x);
    if (!first) { click(g.ctx, out, { gain: 0.8 }); return; }
    tone(g.ctx, out, { duration: 0.09, freq: PITCH.D5, type: 'sine', gain: 0.04, attack: 0.004 });
    tone(g.ctx, out, { at: 0.06, duration: 0.16, freq: PITCH.A5, type: 'sine', gain: 0.035, attack: 0.004 });
};

/** command palette opening: a soft high blip. closing: a quieter, lower one */
export const open = () => {
    const g = audio(true);
    if (!g) return;
    tone(g.ctx, outlet(g), { duration: 0.06, freq: PITCH.A5, to: PITCH.D6, type: 'sine', gain: 0.03, attack: 0.004 });
};
export const close = () => {
    const g = audio(true);
    if (!g) return;
    tone(g.ctx, outlet(g), { duration: 0.05, freq: PITCH.D6, to: PITCH.A5, type: 'sine', gain: 0.022, attack: 0.004 });
};

/** moving through a list (command palette results): the faintest tick */
export const step = (opts: CueOpts = {}) => {
    void opts;
    const g = audio(false);
    if (!g || !listLimit()) return;
    noise(g.ctx, outlet(g), { duration: 0.008, freq: 5000, q: 1.2, gain: 0.035 });
};

/** a command ran: one clean note */
export const confirm = () => {
    const g = audio(true);
    if (!g) return;
    tone(g.ctx, outlet(g), { duration: 0.12, freq: PITCH.D6, type: 'sine', gain: 0.035, attack: 0.004 });
};

/** something didn't work: two low soft sines, no buzz */
export const error = () => {
    const g = audio(true);
    if (!g) return;
    const out = outlet(g);
    tone(g.ctx, out, { duration: 0.07, freq: PITCH.Fs4, type: 'sine', gain: 0.05, attack: 0.004 });
    tone(g.ctx, out, { at: 0.09, duration: 0.1, freq: PITCH.D4, type: 'sine', gain: 0.05, attack: 0.004 });
};

/** a terminal keystroke: tiny, slightly different per key */
export const key = (char = '') => {
    const g = audio(true);
    if (!g || !keyLimit()) return;
    const code = char.charCodeAt(0) || 0;
    noise(g.ctx, outlet(g), { duration: 0.008, freq: 4200 + (code % 7) * 200, q: 1.4, gain: 0.04 });
};

/** the 404 dots blown apart: one soft falling air sweep */
export const scatter = ({ x }: CueOpts = {}) => {
    if (prefersReducedMotion()) return;
    const g = audio(true);
    if (!g) return;
    noise(g.ctx, outlet(g, x), { duration: 0.3, freq: 3600, to: 700, type: 'lowpass', q: 0.5, gain: 0.035, attack: 0.01 });
};

/** the 404 dots are all back together */
export const settle = () => {
    const g = audio(false);
    if (!g) return;
    bell(g.ctx, outlet(g), { duration: 0.4, freq: PITCH.A5, ratio: 2, index: 0.3, gain: 0.02 });
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
