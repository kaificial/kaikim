"use client";

import { useEffect, useMemo, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { useTheme } from '../components/ThemeContext';
import { cssVar } from '../styles/palette';
import { sfx } from '../lib/sfx';
import {
    Terminal,
    ROUTES,
    closestRoute,
    winPath,
    help,
    navigationCommands,
    generalCommands,
    type Command,
    type Line,
    type TerminalHandle,
} from '../components/terminal';

/* the 404 is made of dots: they spring back home, your cursor pushes them around, and a click blows them apart */
type Particle = { hx: number; hy: number; x: number; y: number; vx: number; vy: number; accent: boolean };

const ParticleText = ({ isDark, scatterRef }: {
    isDark: boolean;
    scatterRef: React.MutableRefObject<(() => void) | null>;
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const wrapRef = useRef<HTMLDivElement>(null);
    const reduceMotion = useReducedMotion();
    const colorsRef = useRef({ ink: '#1c1917', accent: '#2563eb' });
    const repaintRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        colorsRef.current = isDark ? { ink: '#fafafa', accent: '#3b82f6' } : { ink: '#1c1917', accent: '#2563eb' };
        repaintRef.current?.();
    }, [isDark]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const wrap = wrapRef.current;
        if (!canvas || !wrap) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let particles: Particle[] = [];
        let w = 0, h = 0, dpr = 1, dot = 2, raf = 0;
        const mouse = { x: -9999, y: -9999, active: false };
        
        const build = () => {
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            w = wrap.clientWidth;
            h = Math.round(Math.min(Math.max(w * 0.42, 150), 280));
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            canvas.style.width = `${w}px`;
            canvas.style.height = `${h}px`;

            // draw the text offscreen, then grab the filled pixels on a grid
            const off = document.createElement('canvas');
            off.width = w; off.height = h;
            const o = off.getContext('2d');
            if (!o) return;
            const fontSize = h * 0.95;
            o.font = `800 ${fontSize}px ui-monospace, "JetBrains Mono", monospace`;
            o.textAlign = 'center';
            o.textBaseline = 'middle';
            o.fillText('404', w / 2, h / 2 + fontSize * 0.04);

            const gap = w < 480 ? 4 : 5;
            dot = gap * 0.55;
            const data = o.getImageData(0, 0, w, h).data;
            const next: Particle[] = [];
            for (let y = 0; y < h; y += gap) {
                for (let x = 0; x < w; x += gap) {
                    if (data[(y * w + x) * 4 + 3] > 128) {
                        const start = reduceMotion
                            ? { x, y }
                            : { x: Math.random() * w, y: Math.random() * h };
                        next.push({ hx: x, hy: y, x: start.x, y: start.y, vx: 0, vy: 0, accent: Math.random() < 0.06 });
                    }
                }
            }
            particles = next;
        };

        const draw = () => {
            const { ink, accent } = colorsRef.current;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, w, h);
            for (const p of particles) {
                // dots that wander far get tinted blue so you can see the mess
                const off = Math.abs(p.x - p.hx) + Math.abs(p.y - p.hy);
                ctx.fillStyle = p.accent || off > 18 ? accent : ink;
                ctx.globalAlpha = p.accent ? 0.9 : Math.max(0.35, 1 - off / 260);
                ctx.fillRect(p.x - dot / 2, p.y - dot / 2, dot, dot);
            }
            ctx.globalAlpha = 1;
        };

        // set after a scatter, cleared (with a chime) once everything's back
        let pendingSettle = false;
        const step = () => {
            const R = Math.max(70, w * 0.12);
            let energy = 0;
            for (const p of particles) {
                p.vx += (p.hx - p.x) * 0.045;
                p.vy += (p.hy - p.y) * 0.045;
                if (mouse.active) {
                    const dx = p.x - mouse.x, dy = p.y - mouse.y;
                    const d2 = dx * dx + dy * dy;
                    if (d2 < R * R) {
                        const d = Math.sqrt(d2) || 1;
                        const f = ((R - d) / R) * 5.5;
                        p.vx += (dx / d) * f;
                        p.vy += (dy / d) * f;
                    }
                }
                p.vx *= 0.84;
                p.vy *= 0.84;
                p.x += p.vx;
                p.y += p.vy;
                energy += Math.abs(p.vx) + Math.abs(p.vy);
            }
            draw();
            // little chime once the dots have all found their way home
            if (pendingSettle && energy < particles.length * 0.02) {
                pendingSettle = false;
                sfx.settle();
            }
            // go to sleep once everything's home and the cursor's gone
            const settled = !mouse.active && energy < particles.length * 0.01;
            raf = settled ? 0 : requestAnimationFrame(step);
        };

        const wake = () => { if (!raf && !reduceMotion) raf = requestAnimationFrame(step); };

        const local = (e: PointerEvent) => {
            const r = canvas.getBoundingClientRect();
            return { x: e.clientX - r.left, y: e.clientY - r.top };
        };
        const onMove = (e: PointerEvent) => {
            const { x, y } = local(e);
            mouse.x = x; mouse.y = y; mouse.active = true;
            wake();
        };
        const onLeave = () => { mouse.active = false; mouse.x = mouse.y = -9999; };

        const blast = (cx: number, cy: number, strength: number) => {
            sfx.scatter({ x: canvas.getBoundingClientRect().left + cx });
            pendingSettle = true;
            for (const p of particles) {
                const dx = p.x - cx, dy = p.y - cy;
                const d = Math.sqrt(dx * dx + dy * dy) || 1;
                const f = (strength * (0.4 + Math.random() * 0.6)) / Math.max(1, d / 60);
                p.vx += (dx / d) * f;
                p.vy += (dy / d) * f;
            }
            wake();
        };
        const onDown = (e: PointerEvent) => {
            if (reduceMotion) return;
            const { x, y } = local(e);
            blast(x, y, 26);
        };
        scatterRef.current = () => { if (!reduceMotion) blast(w / 2, h / 2, 40); };

        repaintRef.current = draw;
        build();
        if (reduceMotion) draw(); else wake();

        const ro = new ResizeObserver(() => {
            if (Math.abs(wrap.clientWidth - w) < 2) return;
            build();
            if (reduceMotion) draw(); else wake();
        });
        ro.observe(wrap);
        canvas.addEventListener('pointermove', onMove);
        canvas.addEventListener('pointerleave', onLeave);
        canvas.addEventListener('pointerdown', onDown);

        return () => {
            cancelAnimationFrame(raf);
            ro.disconnect();
            canvas.removeEventListener('pointermove', onMove);
            canvas.removeEventListener('pointerleave', onLeave);
            canvas.removeEventListener('pointerdown', onDown);
            scatterRef.current = null;
            repaintRef.current = null;
        };
    }, [reduceMotion, scatterRef]);

    return (
        <div ref={wrapRef} style={{ width: '100%', touchAction: 'pan-y' }}>
            <canvas ref={canvasRef} role="img" aria-label="404" style={{ display: 'block', width: '100%' }} />
        </div>
    );
};

/* the page */
export default function NotFoundClient() {
    const { isDark } = useTheme();
    const pathname = usePathname() || '/';
    const scatterRef = useRef<(() => void) | null>(null);
    const terminalRef = useRef<TerminalHandle>(null);

    const suggestion = useMemo(() => closestRoute(pathname), [pathname]);

    const commands = useMemo<Command[]>(() => {
        const scatter: Command = {
            name: 'scatter',
            aliases: ['404'],
            help: 'scatter          shake the 404 apart',
            run: ({ print }) => { scatterRef.current?.(); print('boom.', 'ok'); },
        };
        return [help, ...navigationCommands, scatter, ...generalCommands];
    }, []);

    const initialLines = useMemo<Line[]>(() => [
        { kind: 'out', text: 'Windows PowerShell' },
        { kind: 'out', text: 'Copyright (C) Kai Kim. All rights reserved.' },
        { kind: 'out', text: '' },
        { kind: 'err', text: `Set-Location: Cannot find path '${winPath(pathname)}' because it does not exist.` },
        { kind: 'out', text: `looks like this page flew off the map.` },
        { kind: 'out', text: suggestion.name === 'home'
            ? `press enter to fly home, or type "help" to look around.`
            : `did you mean ${suggestion.path}? press enter to go there, or type "help".` },
    ], [pathname, suggestion]);

    return (
        <section style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '120px 20px 140px',
            color: cssVar.text,
        }}>
            <div style={{ width: '100%', maxWidth: '720px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
                    <ParticleText isDark={isDark} scatterRef={scatterRef} />
                </motion.div>

                <Terminal
                    ref={terminalRef}
                    commands={commands}
                    initialLines={initialLines}
                    onEmptySubmit={({ navigate }) => navigate(suggestion.path)}
                    onMinimize={() => scatterRef.current?.()}
                    minimizeLabel="Minimize (scatters the 404)"
                />

                <motion.nav
                    aria-label="Pages that do exist"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}
                >
                    {ROUTES.map((r) => {
                        const suggested = r.path === suggestion.path;
                        return (
                            <button
                                key={r.path}
                                type="button"
                                onClick={() => terminalRef.current?.run(`cd ${r.name}`)}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '999px',
                                    border: `1px solid ${suggested ? cssVar.link : cssVar.hairline}`,
                                    background: 'transparent',
                                    color: suggested ? cssVar.link : cssVar.text,
                                    font: 'inherit',
                                    fontSize: '0.75rem',
                                    cursor: 'pointer',
                                }}
                            >
                                {suggested ? '↵ ' : ''}{r.path}
                            </button>
                        );
                    })}
                </motion.nav>
            </div>
        </section>
    );
}
