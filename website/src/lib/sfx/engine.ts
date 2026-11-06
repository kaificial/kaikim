"use client";

/**
 * the one audio engine for sound effects (music has its own <audio>).
 *
 *   sounds → [panner] → input → duck → master → compressor → speakers
 *                         └→ room reverb ┘
 *
 * browsers only allow audio after you click or press a key, so it starts on the first one.
 * before that (and while muted) every sound just does nothing
 */

type Graph = { ctx: BaseAudioContext; input: AudioNode };

const STORAGE_KEY = 'sfx';
const MASTER_LEVEL = 1.2;

let ctx: AudioContext | null = null;
let graph: Graph | null = null;
/** set while rendering a sound offline (sfx-lab checks), skips mute and unlock */
let override: Graph | null = null;

let muted = false;
let mutedLoaded = false;
const listeners = new Set<() => void>();

/** global tuning for the dev-only /sfx-lab sliders */
export const tuning = { pitch: 1, gain: 1 };

let lastPointer = { x: -1, t: 0 };

const isBrowser = () => typeof window !== 'undefined';

const loadMuted = () => {
    if (mutedLoaded || !isBrowser()) return;
    mutedLoaded = true;
    try { muted = localStorage.getItem(STORAGE_KEY) === 'off'; } catch { /* private mode */ }
};

/** a tiny fake room so every material sounds like it's in the same space */
const roomImpulse = (c: BaseAudioContext) => {
    const length = Math.floor(c.sampleRate * 0.25);
    const buf = c.createBuffer(2, length, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
        const d = buf.getChannelData(ch);
        for (let i = 0; i < length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3);
    }
    return buf;
};

let duckNode: GainNode | null = null;

const buildGraph = (c: BaseAudioContext, destination: AudioNode): { input: AudioNode; duck: GainNode } => {
    const input = c.createGain();
    const duck = c.createGain();
    const master = c.createGain();
    master.gain.value = MASTER_LEVEL;
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.knee.value = 8;
    comp.ratio.value = 4;
    comp.attack.value = 0.002;
    comp.release.value = 0.12;
    const send = c.createGain();
    // just a touch of room, a dry mix sounds tighter
    send.gain.value = 0.02;
    const room = c.createConvolver();
    room.buffer = roomImpulse(c);

    input.connect(duck).connect(master);
    input.connect(send).connect(room).connect(master);
    master.connect(comp).connect(destination);
    return { input, duck };
};

/**
 * the audio to play into, or null when sound shouldn't play. `unlock` means this came from a click or
 * key press, so it's allowed to start or wake up audio
 */
export const audio = (unlock: boolean): Graph | null => {
    if (override) return override;
    if (!isBrowser()) return null;
    loadMuted();
    if (muted || document.hidden) return null;
    if (!ctx) {
        if (!unlock) return null;
        ctx = new AudioContext();
        const { input, duck } = buildGraph(ctx, ctx.destination);
        duckNode = duck;
        graph = { ctx, input };
    }
    if (ctx.state === 'suspended') {
        if (!unlock) return null;
        void ctx.resume();
    }
    return graph;
};

/** where a sound connects: maybe through a panner placed by screen x */
export const outlet = (g: Graph, x?: number): AudioNode => {
    const px = x ?? recentPointerX();
    if (px === undefined || !('createStereoPanner' in g.ctx)) return g.input;
    const panner = g.ctx.createStereoPanner();
    const width = isBrowser() ? window.innerWidth : 1;
    panner.pan.value = Math.max(-1, Math.min(1, ((px / width) * 2 - 1) * 0.35));
    panner.connect(g.input);
    return panner;
};

const recentPointerX = () => (performance.now() - lastPointer.t < 600 && lastPointer.x >= 0 ? lastPointer.x : undefined);

/** turn effects down under the music */
export const duck = (on: boolean) => {
    if (!ctx || !duckNode) return;
    duckNode.gain.setTargetAtTime(on ? 0.5 : 1, ctx.currentTime, 0.12);
};

export const isMuted = () => { loadMuted(); return muted; };

export const setMuted = (next: boolean) => {
    loadMuted();
    if (next === muted) return;
    muted = next;
    try { localStorage.setItem(STORAGE_KEY, next ? 'off' : 'on'); } catch { /* ignore */ }
    listeners.forEach((l) => l());
};

export const subscribe = (fn: () => void) => {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
};

export const prefersReducedMotion = () =>
    isBrowser() && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** fine pointer = mouse/trackpad, hover sounds are desktop only */
export const canHover = () =>
    isBrowser() && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

let installed = false;

/**
 * global listeners: unlock on the first click, remember the pointer for panning, pause in background
 * tabs
 */
export const install = () => {
    if (installed || !isBrowser()) return () => {};
    installed = true;
    const onPointer = (e: PointerEvent) => { lastPointer = { x: e.clientX, t: performance.now() }; };
    const unlock = () => { audio(true); };
    const onVisibility = () => {
        if (!ctx) return;
        if (document.hidden) void ctx.suspend();
        else if (!muted) void ctx.resume();
    };
    window.addEventListener('pointerdown', onPointer, { capture: true, passive: true });
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
        installed = false;
        window.removeEventListener('pointerdown', onPointer, { capture: true });
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('keydown', unlock);
        document.removeEventListener('visibilitychange', onVisibility);
    };
};

export type RenderReport = { buffer: AudioBuffer; peakDb: number; durationMs: number; dcOffset: number };

/** render a sound offline and measure it (used by /sfx-lab) */
export const renderOffline = async (play: () => void, seconds = 1.5): Promise<RenderReport> => {
    const sampleRate = 44100;
    const off = new OfflineAudioContext(2, Math.ceil(sampleRate * seconds), sampleRate);
    const { input } = buildGraph(off, off.destination);
    override = { ctx: off, input };
    try { play(); } finally { override = null; }
    const buffer = await off.startRendering();
    let peak = 0;
    let lastLoud = 0;
    let sum = 0;
    const channels = Array.from({ length: buffer.numberOfChannels }, (_, ch) => buffer.getChannelData(ch));
    for (const d of channels) for (let i = 0; i < d.length; i++) { peak = Math.max(peak, Math.abs(d[i])); sum += d[i]; }
    // "audible length": until the signal last gets within 30 dB of its own peak, so quiet sounds
    // get measured as fairly as loud ones and the faint reverb tail doesn't count
    const floor = peak * Math.pow(10, -30 / 20);
    for (const d of channels) for (let i = d.length - 1; i > lastLoud; i--) if (Math.abs(d[i]) > floor) { lastLoud = i; break; }
    return {
        buffer,
        peakDb: peak > 0 ? 20 * Math.log10(peak) : -Infinity,
        durationMs: (lastLoud / sampleRate) * 1000,
        dcOffset: sum / (buffer.length * buffer.numberOfChannels),
    };
};
