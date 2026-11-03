"use client";

/**
 * "the grid turns over": switching theme swaps the page tile by tile across the site's 24px grid,
 * in a wave that spreads from where you clicked. tiles grow from the middle with a bit of random
 * lag so the edge looks pixelated.
 *
 * uses the view transitions api: the old and new page are real snapshots, and the new one shows
 * through a mask redrawn every frame. no api or reduced motion = instant switch
 */

const CELL = 24; // matches --grid-size
const MASK_PX = 10; // mask pixels per tile (the mask gets scaled up to the screen)
const RAMP = 0.18; // how much of the run each tile takes to grow
const JITTER = 0.12; // random lag per tile, as a fraction of the run
export const THEME_WAVE_MS = 1100;

let lastPointer: { x: number; y: number; t: number } | null = null;
let listening = false;
const rememberPointer = () => {
    if (listening || typeof window === 'undefined') return;
    listening = true;
    window.addEventListener('pointerdown', (e) => { lastPointer = { x: e.clientX, y: e.clientY, t: performance.now() }; }, { capture: true, passive: true });
};
rememberPointer();

/** where the wave starts: the click that caused it, or top centre for keyboard/⌘K */
const originPoint = () => {
    if (lastPointer && performance.now() - lastPointer.t < 1000) return { x: lastPointer.x, y: lastPointer.y };
    return { x: window.innerWidth / 2, y: 0 };
};

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

type ViewTransitionLike = { ready: Promise<void>; finished: Promise<void> };
type DocWithVT = Document & { startViewTransition?: (cb: () => void) => ViewTransitionLike };

/**
 * run `apply` (has to update the dom right away) as a tile wave. returns how long the wave runs (0 if
 * it switched instantly)
 */
export const runThemeTransition = (apply: () => void): number => {
    const doc = document as DocWithVT;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!doc.startViewTransition || reduce) {
        apply();
        return 0;
    }

    const w = window.innerWidth;
    const h = window.innerHeight;
    const cols = Math.ceil(w / CELL);
    const rows = Math.ceil(h / CELL);
    const canvas = document.createElement('canvas');
    canvas.width = cols * MASK_PX;
    canvas.height = rows * MASK_PX;
    const ctx = canvas.getContext('2d');
    if (!ctx) { apply(); return 0; }

    // each tile's start time: distance from the click plus a little noise
    const o = originPoint();
    const far = Math.max(Math.hypot(o.x, o.y), Math.hypot(w - o.x, o.y), Math.hypot(o.x, h - o.y), Math.hypot(w - o.x, h - o.y));
    const starts = new Float32Array(cols * rows);
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const d = Math.hypot((c + 0.5) * CELL - o.x, (r + 0.5) * CELL - o.y) / far;
            starts[r * cols + c] = d * (1 - RAMP - JITTER) + Math.random() * JITTER;
        }
    }

    const style = document.createElement('style');
    const setMask = (url: string) => {
        style.textContent = `
            ::view-transition-old(root), ::view-transition-new(root) { mix-blend-mode: normal; }
            ::view-transition-old(root) { animation: none; }
            ::view-transition-new(root) {
                animation: theme-wave-hold ${THEME_WAVE_MS}ms linear both;
                -webkit-mask: url(${url}) 0 0 / ${cols * CELL}px ${rows * CELL}px no-repeat;
                mask: url(${url}) 0 0 / ${cols * CELL}px ${rows * CELL}px no-repeat;
            }
            @keyframes theme-wave-hold { from { opacity: 1; } to { opacity: 1; } }
        `;
    };

    const draw = (progress: number) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#000';
        for (let i = 0; i < starts.length; i++) {
            const p = (progress - starts[i]) / RAMP;
            if (p <= 0) continue;
            const s = p >= 1 ? MASK_PX : Math.max(1, Math.round(MASK_PX * easeOut(p)));
            const c = i % cols;
            const r = (i / cols) | 0;
            const off = (MASK_PX - s) / 2;
            ctx.fillRect(c * MASK_PX + off, r * MASK_PX + off, s, s);
        }
        setMask(canvas.toDataURL());
    };

    // start fully masked so the first frame still shows the old theme
    draw(0);
    document.head.appendChild(style);
    // otherwise colour transitions get caught mid-fade in the new snapshot
    document.documentElement.classList.add('theme-switching');

    const transition = doc.startViewTransition(apply);
    let raf = 0;
    transition.ready.then(() => {
        const t0 = performance.now();
        const frame = () => {
            const progress = Math.min(1, (performance.now() - t0) / THEME_WAVE_MS);
            draw(progress);
            if (progress < 1) raf = requestAnimationFrame(frame);
        };
        raf = requestAnimationFrame(frame);
    }).catch(() => { /* transition skipped */ });
    transition.finished.finally(() => {
        cancelAnimationFrame(raf);
        style.remove();
        document.documentElement.classList.remove('theme-switching');
    });
    return THEME_WAVE_MS;
};
