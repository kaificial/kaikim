"use client";

import { useEffect, useRef, useState } from 'react';
import { CATALOGUE } from '../../lib/sfx/cues';
import { renderOffline, tuning, type RenderReport } from '../../lib/sfx/engine';
import { cssVar } from '../../styles/palette';

/**
 * longest each sound can ring for (ms, until it's 30 dB under its peak). from docs/sound-design-plan.md
 */
const MAX_MS: Record<string, number> = {
    press: 150, hover: 120, tick: 100, clack: 150, snap: 150,
    'toggle on': 250, 'toggle off': 250, 'theme → dark': 320, 'theme → light': 320, 'theme wave → dark': 1100, 'theme wave → light': 1100,
    pop: 120, slide: 220, paper: 100, unfold: 200, fold: 150, stamp: 200,
    nav: 420, 'whoosh out': 500, 'whoosh back': 500,
    'flip → data side': 600, 'flip → label': 600, success: 600,
    like: 420, 'like (again)': 150, open: 150, close: 120, step: 80,
    confirm: 300, error: 400, key: 60, scatter: 480, settle: 700,
};
const PEAK_LIMIT_DB = -6;
const SKIP = new Set(['press · scale run']); // runs on timers, not a single sound

type Result = RenderReport & { pass: boolean; reasons: string[] };
const TUNING_KEY = 'sfx-lab-tuning';

const Waveform = ({ buffer }: { buffer: AudioBuffer }) => {
    const ref = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const c = ref.current;
        const g = c?.getContext('2d');
        if (!c || !g) return;
        const d = buffer.getChannelData(0);
        const w = c.width, h = c.height;
        g.clearRect(0, 0, w, h);
        g.fillStyle = '#3b82f6';
        const per = Math.ceil(d.length / w);
        for (let x = 0; x < w; x++) {
            let peak = 0;
            for (let i = x * per; i < Math.min(d.length, (x + 1) * per); i++) peak = Math.max(peak, Math.abs(d[i]));
            const bar = Math.max(1, peak * h);
            g.fillRect(x, (h - bar) / 2, 1, bar);
        }
    }, [buffer]);
    return <canvas ref={ref} width={180} height={28} style={{ display: 'block', width: 180, height: 28 }} />;
};

export default function SfxLab() {
    const [pitch, setPitch] = useState(1);
    const [gain, setGain] = useState(1);
    const [results, setResults] = useState<Record<string, Result>>({});
    const [running, setRunning] = useState(false);

    // load the saved slider values, these only affect this browser
    // (after mount, the server can't see localStorage)
    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(TUNING_KEY) ?? '{}');
            if (typeof saved.pitch === 'number') setPitch(saved.pitch);
            if (typeof saved.gain === 'number') setGain(saved.gain);
        } catch { /* ignore */ }
    }, []);
    /* eslint-enable react-hooks/set-state-in-effect */
    useEffect(() => {
        tuning.pitch = pitch;
        tuning.gain = gain;
        localStorage.setItem(TUNING_KEY, JSON.stringify({ pitch, gain }));
    }, [pitch, gain]);

    const runChecks = async () => {
        setRunning(true);
        const next: Record<string, Result> = {};
        for (const group of CATALOGUE) {
            for (const cue of group.cues) {
                if (SKIP.has(cue.name)) continue;
                const r = await renderOffline(cue.play);
                const reasons: string[] = [];
                const max = MAX_MS[cue.name];
                if (r.peakDb < -70) reasons.push('silent');
                if (max && r.durationMs > max) reasons.push(`${Math.round(r.durationMs)} ms > ${max} ms`);
                if (r.peakDb > PEAK_LIMIT_DB) reasons.push(`peak ${r.peakDb.toFixed(1)} dB > ${PEAK_LIMIT_DB} dB`);
                if (Math.abs(r.dcOffset) > 0.01) reasons.push('DC offset');
                next[cue.name] = { ...r, pass: reasons.length === 0, reasons };
                setResults({ ...next });
                // give the rate limiters a moment to reset between renders
                await new Promise((res) => setTimeout(res, 70));
            }
        }
        setRunning(false);
    };

    const all = Object.values(results);
    const passed = all.filter((r) => r.pass).length;

    const btn: React.CSSProperties = {
        border: `1px solid ${cssVar.chipBorder}`, background: cssVar.chipBg, color: cssVar.chipFg,
        borderRadius: 8, padding: '6px 12px', font: 'inherit', fontSize: '0.75rem', cursor: 'pointer',
    };

    return (
        <div className="container mx-auto px-4 py-24 max-w-3xl" style={{ color: cssVar.text }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 4 }}>SFX lab</h1>
            <p style={{ fontSize: '0.8rem', color: cssVar.textMuted, marginBottom: 24 }}>
                Development only. Every cue in <code>lib/sfx/cues.ts</code>, grouped by material. Click to hear it
                (the first click unlocks audio). The checks render each cue offline and test length and peak level
                against docs/sound-design-plan.md.
            </p>

            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center', marginBottom: 28, fontSize: '0.75rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    Pitch ×{pitch.toFixed(2)}
                    <input type="range" min={0.5} max={2} step={0.01} value={pitch} onChange={(e) => setPitch(Number(e.target.value))} />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    Gain ×{gain.toFixed(2)}
                    <input type="range" min={0} max={2} step={0.01} value={gain} onChange={(e) => setGain(Number(e.target.value))} />
                </label>
                <button type="button" style={btn} onClick={() => { setPitch(1); setGain(1); }}>Reset</button>
                <button type="button" style={{ ...btn, borderColor: cssVar.link, color: cssVar.link }} onClick={runChecks} disabled={running}>
                    {running ? 'Checking…' : 'Run checks'}
                </button>
                {all.length > 0 && <span data-testid="summary">{passed}/{all.length} pass</span>}
            </div>

            {CATALOGUE.map((group) => (
                <section key={group.material} style={{ marginBottom: 28 }}>
                    <h2 style={{ fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: cssVar.textMuted, marginBottom: 10 }}>
                        {group.material}
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {group.cues.map((cue) => {
                            const r = results[cue.name];
                            return (
                                <div key={cue.name} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.75rem' }}>
                                    <button type="button" style={{ ...btn, minWidth: 150, textAlign: 'left' }} onClick={() => cue.play()}>▶ {cue.name}</button>
                                    {r && <Waveform buffer={r.buffer} />}
                                    {r && (
                                        <span style={{ fontVariantNumeric: 'tabular-nums', color: r.pass ? cssVar.textMuted : '#dc2626' }}>
                                            {Math.round(r.durationMs)} ms · {r.peakDb.toFixed(1)} dB {r.pass ? '✓' : `✗ ${r.reasons.join(', ')}`}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>
            ))}
            <div className="footer-spacer" />
        </div>
    );
}
