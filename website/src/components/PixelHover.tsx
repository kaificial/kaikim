"use client";

import { useEffect, useRef, type ReactNode } from 'react';

const DURATION = 220; // ms for a full fill or clear
const FRAME = 40;     // ms per step, keeps the fill choppy like old pixel art

/**
 * text that fills with a block of random pixels on hover and dissolves back out on leave.
 * hover is picked up from the nearest `.ul-host` so icons next to the text trigger it too
 */
export const PixelHover = ({ children, className = '' }: { children: ReactNode; className?: string }) => {
    const wrapRef = useRef<HTMLSpanElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const wrap = wrapRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!wrap || !canvas || !ctx) return;

        const host = (wrap.closest('.ul-host') as HTMLElement | null) ?? wrap;
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

        let cell = 4, cols = 0, rows = 0, w = 0, h = 0;
        let order = new Float32Array(0); // random threshold per cell
        let progress = 0, target = 0, last = 0, raf = 0;

        const layout = () => {
            const dpr = window.devicePixelRatio || 1;
            w = wrap.offsetWidth;
            h = wrap.offsetHeight;
            cell = Math.max(3, Math.round(h / 3.5));
            cols = Math.ceil(w / cell);
            rows = Math.ceil(h / cell);
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            order = new Float32Array(cols * rows).map(() => Math.random());
            draw();
        };

        const draw = () => {
            ctx.clearRect(0, 0, w, h);
            // read the colour each draw so it follows theme changes
            ctx.fillStyle = getComputedStyle(wrap).getPropertyValue('--c-text-strong').trim() || '#1c1917';
            if (progress >= 1) {
                // finished: one solid block so there are no seams between cells
                ctx.fillRect(0, 0, w, h);
            } else {
                for (let i = 0; i < order.length; i++) {
                    if (order[i] < progress) {
                        // overlap by a hair so antialiasing never leaves gaps
                        const x = (i % cols) * cell, y = Math.floor(i / cols) * cell;
                        ctx.fillRect(x - 0.25, y - 0.25, Math.min(cell, w - x) + 0.5, Math.min(cell, h - y) + 0.5);
                    }
                }
            }
            wrap.classList.toggle('pixel-active', progress > 0);
            wrap.classList.toggle('pixel-on', progress >= 0.5);
        };

        const tick = (now: number) => {
            if (now - last >= FRAME) {
                const step = (now - last) / DURATION;
                last = now;
                progress = target > progress ? Math.min(target, progress + step) : Math.max(target, progress - step);
                draw();
            }
            raf = progress === target ? 0 : requestAnimationFrame(tick);
        };

        const go = (to: number) => {
            target = to;
            if (reduce.matches) { progress = to; draw(); return; }
            if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
        };

        const enter = (e: PointerEvent) => { if (e.pointerType === 'mouse') go(1); };
        const leave = () => go(0);
        const focus = () => go(1);

        layout();
        const ro = new ResizeObserver(layout);
        ro.observe(wrap);
        host.addEventListener('pointerenter', enter);
        host.addEventListener('pointerleave', leave);
        host.addEventListener('focusin', focus);
        host.addEventListener('focusout', leave);
        return () => {
            cancelAnimationFrame(raf);
            ro.disconnect();
            host.removeEventListener('pointerenter', enter);
            host.removeEventListener('pointerleave', leave);
            host.removeEventListener('focusin', focus);
            host.removeEventListener('focusout', leave);
        };
    }, []);

    return (
        <span ref={wrapRef} className={`pixel-link ${className}`}>
            <canvas ref={canvasRef} className="pixel-link-canvas" aria-hidden="true" />
            {children}
        </span>
    );
};
