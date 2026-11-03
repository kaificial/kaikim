"use client";

import { tuning } from './engine';

/**
 * sound building blocks. everything's made from oscillators and filtered noise so there are no audio
 * files. each play is nudged a bit so repeats never sound exactly the same (±3% pitch, ±1.5 dB, ±5%
 * filter)
 */

type Ctx = BaseAudioContext;

const jitter = (v: number, amount: number) => v * (1 + (Math.random() * 2 - 1) * amount);
export const hPitch = (f: number) => jitter(f, 0.03) * tuning.pitch;
export const hGain = (g: number) => g * Math.pow(10, ((Math.random() * 2 - 1) * 1.5) / 20) * tuning.gain;
export const hCut = (f: number) => jitter(f, 0.05);

const noiseBuffers = new WeakMap<Ctx, AudioBuffer>();
/** one second of white noise per context, shared by every noise sound */
const noiseBuffer = (c: Ctx) => {
    let b = noiseBuffers.get(c);
    if (!b) {
        b = c.createBuffer(1, c.sampleRate, c.sampleRate);
        const d = b.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        noiseBuffers.set(c, b);
    }
    return b;
};

/** fade in/out envelope on a gain node */
const envelope = (c: Ctx, at: number, gain: number, duration: number, attack = 0.002) => {
    const env = c.createGain();
    env.gain.setValueAtTime(0.0001, at);
    env.gain.linearRampToValueAtTime(gain, at + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    return env;
};

export type NoiseOpts = {
    at?: number;
    duration: number;
    freq: number;
    /** sweep the filter to this frequency over the duration */
    to?: number;
    q?: number;
    gain: number;
    type?: BiquadFilterType;
    attack?: number;
};

/** filtered noise burst: clicks, ticks, paper, air */
export const noise = (c: Ctx, out: AudioNode, o: NoiseOpts) => {
    const t = c.currentTime + (o.at ?? 0);
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c);
    const filter = c.createBiquadFilter();
    filter.type = o.type ?? 'bandpass';
    filter.frequency.setValueAtTime(hCut(o.freq), t);
    if (o.to) filter.frequency.exponentialRampToValueAtTime(hCut(o.to), t + o.duration);
    filter.Q.value = o.q ?? 1;
    const env = envelope(c, t, hGain(o.gain), o.duration, o.attack);
    src.connect(filter).connect(env).connect(out);
    src.start(t, Math.random() * 0.5);
    src.stop(t + o.duration + 0.02);
};

export type ToneOpts = {
    at?: number;
    duration: number;
    freq: number;
    /** slide to this frequency over the duration */
    to?: number;
    type?: OscillatorType;
    gain: number;
    attack?: number;
    /** squash the wave into this many levels (a tiny bit-crush for the pixel sounds) */
    crush?: number;
};

const crushers = new WeakMap<Ctx, Map<number, Float32Array<ArrayBuffer>>>();
const crushCurve = (c: Ctx, levels: number) => {
    let m = crushers.get(c);
    if (!m) { m = new Map(); crushers.set(c, m); }
    let curve = m.get(levels);
    if (!curve) {
        curve = new Float32Array(1024);
        for (let i = 0; i < curve.length; i++) {
            const x = (i / (curve.length - 1)) * 2 - 1;
            curve[i] = Math.round(x * levels) / levels;
        }
        m.set(levels, curve);
    }
    return curve;
};

/** one oscillator note, can slide: pops, sweeps, chimes, pixel blips */
export const tone = (c: Ctx, out: AudioNode, o: ToneOpts) => {
    const t = c.currentTime + (o.at ?? 0);
    const osc = c.createOscillator();
    osc.type = o.type ?? 'sine';
    osc.frequency.setValueAtTime(hPitch(o.freq), t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(hPitch(o.to), t + o.duration);
    const env = envelope(c, t, hGain(o.gain), o.duration, o.attack);
    let node: AudioNode = osc;
    if (o.crush) {
        const shaper = c.createWaveShaper();
        shaper.curve = crushCurve(c, o.crush);
        node = node.connect(shaper);
    }
    node.connect(env).connect(out);
    osc.start(t);
    osc.stop(t + o.duration + 0.02);
};

/** low thump that drops in pitch: the body of a plastic case or a stamp */
export const thump = (c: Ctx, out: AudioNode, o: { at?: number; duration: number; freq: number; gain: number }) =>
    tone(c, out, { ...o, to: o.freq * 0.5, type: 'sine' });

/** two-oscillator fm bell: glass, discs, success chimes. odd ratios sound metallic */
export const bell = (c: Ctx, out: AudioNode, o: { at?: number; duration: number; freq: number; ratio?: number; index?: number; gain: number }) => {
    const t = c.currentTime + (o.at ?? 0);
    const f = hPitch(o.freq);
    const carrier = c.createOscillator();
    carrier.frequency.value = f;
    const mod = c.createOscillator();
    mod.frequency.value = f * (o.ratio ?? 3.5);
    const modGain = c.createGain();
    // brightness fades faster than volume, like hitting something
    modGain.gain.setValueAtTime(f * (o.index ?? 2), t);
    modGain.gain.exponentialRampToValueAtTime(f * 0.05, t + o.duration * 0.6);
    mod.connect(modGain).connect(carrier.frequency);
    const env = envelope(c, t, hGain(o.gain), o.duration, 0.003);
    carrier.connect(env).connect(out);
    carrier.start(t);
    mod.start(t);
    carrier.stop(t + o.duration + 0.02);
    mod.stop(t + o.duration + 0.02);
};

/** a few tiny noise grains in a row: paper flutter */
export const grains = (c: Ctx, out: AudioNode, o: { at?: number; count: number; gap: number; freq: number; step?: number; gain: number; duration?: number; q?: number }) => {
    for (let i = 0; i < o.count; i++) {
        noise(c, out, {
            at: (o.at ?? 0) + i * o.gap * (0.8 + Math.random() * 0.4),
            duration: o.duration ?? 0.012,
            freq: o.freq * Math.pow(o.step ?? 1, i),
            q: o.q ?? 0.8,
            gain: o.gain * (1 - i * 0.12),
        });
    }
};

export type Continuous = { set: (amount: number) => void; stop: () => void };

/** looping filtered noise, brightness and volume follow `set(0..1)`: disc spin */
export const continuousNoise = (c: Ctx, out: AudioNode, o: { minFreq: number; maxFreq: number; maxGain: number; q?: number }): Continuous => {
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c);
    src.loop = true;
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = o.q ?? 1.2;
    filter.frequency.value = o.minFreq;
    const env = c.createGain();
    env.gain.value = 0;
    src.connect(filter).connect(env).connect(out);
    src.start();
    let stopped = false;
    return {
        set: (amount) => {
            if (stopped) return;
            const a = Math.max(0, Math.min(1, amount));
            const t = c.currentTime;
            // setTargetAtTime smooths things out so fast pointer events don't crackle
            filter.frequency.setTargetAtTime(o.minFreq + (o.maxFreq - o.minFreq) * a, t, 0.03);
            env.gain.setTargetAtTime(o.maxGain * a * tuning.gain, t, 0.03);
        },
        stop: () => {
            if (stopped) return;
            stopped = true;
            const t = c.currentTime;
            env.gain.setTargetAtTime(0, t, 0.025);
            src.stop(t + 0.15);
        },
    };
};
