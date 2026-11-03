"use client";

/**
 * "the grid turns over": switching theme swaps the page tile by tile across the site's 24px grid,
 * in a wave that spreads from where you clicked. tiles grow from the middle with a bit of random
 * lag so the edge looks pixelated.
 *
 * uses the view transitions api: the old and new page are real snapshots, and the new one shows
 * through a mask. every frame of the wave is drawn up front into one tall sprite, then a plain css
 * steps() animation flips through it, so nothing runs in js mid-transition (mobile browsers don't
 * reliably pick up style changes on the transition while it's playing). no api or reduced motion =
 * instant switch
 */

const CELL = 24; // matches --grid-size
const FRAMES = 28; // frames in the sprite
const RAMP = 0.18; // how much of the run each tile takes to grow
const JITTER = 0.12; // random lag per tile, as a fraction of the run
const MAX_SPRITE_PX = 3_000_000; // small enough to build fast, well under safari's canvas limit
export const THEME_WAVE_MS = 1100;

let lastPointer: { x: number; y: number; t: number } | null = null;
let listening = false;
const rememberPointer = () => {
    if (listening || typeof window === 'undefined') return;
    listening = true;
    window.addEventListener('pointerdown', (e) => { lastPointer = { x: e.clientX, y: e.clientY, t: performance.now() }; }, { capture: true, passive: true });
};
rememberPointer();

/** where the wave starts: the tap/click that caused it, or top centre for keyboard/⌘K */
const originPoint = () => {
    if (lastPointer && performance.now() - lastPointer.t < 1000) return { x: lastPointer.x, y: lastPointer.y };
    return { x: window.innerWidth / 2, y: 0 };
};

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

type ViewTransitionLike = { ready: Promise<void>; finished: Promise<void> };
type DocWithVT = Document & { startViewTransition?: (cb: () => void) => ViewTransitionLike };

/**
 * run `apply` (has to update the dom right away) as a tile wave. the dark page is always the one
 * that moves: going dark it grows out of the button, going light it shrinks back into it.
 * returns how long the wave runs (0 if it switched instantly)
 */
export const runThemeTransition = (apply: () => void, toDark: boolean): number => {
    const doc = document as DocWithVT;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!doc.startViewTransition || reduce) {
        apply();
        return 0;
    }

    // on phones the snapshot is the full screen height, taller than innerHeight while the url bar
    // shows, so cover a bit extra or the strip behind the url bar pops at the end
    const w = window.innerWidth;
    const h = Math.max(window.innerHeight, document.documentElement.clientHeight) + 160;
    const cols = Math.ceil(w / CELL);
    const rows = Math.ceil(h / CELL);
    // pixels per tile in the sprite: as sharp as the size limit allows
    const px = Math.max(2, Math.min(12, Math.floor(Math.sqrt(MAX_SPRITE_PX / (cols * rows * FRAMES)))));

    const canvas = document.createElement('canvas');
    canvas.width = cols * px;
    canvas.height = rows * px * FRAMES;
    const ctx = canvas.getContext('2d');
    if (!ctx) { apply(); return 0; }

    // each tile's start time: distance from the tap plus a little noise
    const o = originPoint();
    const far = Math.max(Math.hypot(o.x, o.y), Math.hypot(w - o.x, o.y), Math.hypot(o.x, h - o.y), Math.hypot(w - o.x, h - o.y));
    const starts = new Float32Array(cols * rows);
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const d = Math.hypot((c + 0.5) * CELL - o.x, (r + 0.5) * CELL - o.y) / far;
            starts[r * cols + c] = d * (1 - RAMP - JITTER) + Math.random() * JITTER;
        }
    }

    // draw every frame of the wave, stacked top to bottom
    ctx.fillStyle = '#000';
    const frameH = rows * px;
    for (let f = 0; f < FRAMES; f++) {
        const progress = f / (FRAMES - 1);
        const top = f * frameH;
        for (let i = 0; i < starts.length; i++) {
            const p = (progress - starts[i]) / RAMP;
            if (p <= 0) continue;
            const s = p >= 1 ? px : Math.max(1, Math.round(px * easeOut(p)));
            const off = (px - s) / 2;
            ctx.fillRect((i % cols) * px + off, top + ((i / cols) | 0) * px + off, s, s);
        }
    }

    let url: string;
    try { url = canvas.toDataURL(); } catch { apply(); return 0; }

    // the sprite is shown one frame per screen. steps(FRAMES, jump-none) lands on exactly FRAMES
    // positions, first to last, so every step is one whole frame (FRAMES - 1 here drifts off frame).
    // going dark: the new (dark) page shows through the growing tiles.
    // going light: the old (dark) page sits on top and the same wave plays backwards,
    // so the dark tiles pull back in toward the button
    const screenW = cols * CELL;
    const screenH = rows * CELL;
    const lastY = -(FRAMES - 1) * screenH;
    const moving = toDark ? 'new' : 'old';
    const still = toDark ? 'old' : 'new';
    const style = document.createElement('style');
    style.textContent = `
        ::view-transition-old(root), ::view-transition-new(root) { mix-blend-mode: normal; }
        ::view-transition-${still}(root) { animation: none; }
        ::view-transition-old(root) { z-index: ${toDark ? 0 : 1}; }
        ::view-transition-${moving}(root) {
            -webkit-mask-image: url(${url});
            mask-image: url(${url});
            -webkit-mask-size: ${screenW}px ${screenH * FRAMES}px;
            mask-size: ${screenW}px ${screenH * FRAMES}px;
            -webkit-mask-repeat: no-repeat;
            mask-repeat: no-repeat;
            -webkit-mask-position: 0 0;
            mask-position: 0 0;
            animation: theme-wave ${THEME_WAVE_MS}ms steps(${FRAMES}, jump-none) both ${toDark ? 'normal' : 'reverse'};
        }
        @keyframes theme-wave {
            from { -webkit-mask-position: 0 0; mask-position: 0 0; }
            to { -webkit-mask-position: 0 ${lastY}px; mask-position: 0 ${lastY}px; }
        }
    `;
    document.head.appendChild(style);
    // otherwise colour transitions get caught mid-fade in the new snapshot
    document.documentElement.classList.add('theme-switching');

    const cleanup = () => {
        style.remove();
        document.documentElement.classList.remove('theme-switching');
    };
    try {
        const transition = doc.startViewTransition(apply);
        transition.finished.then(cleanup, cleanup);
    } catch {
        cleanup();
        apply();
        return 0;
    }
    return THEME_WAVE_MS;
};
