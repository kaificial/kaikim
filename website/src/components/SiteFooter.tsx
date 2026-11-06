"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "./ThemeContext";

// footer with pixel mountains drawn on a canvas. a few layers of ridges in mist,
// dithered so the shading turns into little blue squares

const CELL = 3; // css px per pixel cell
const DOT = 2; // css px of the drawn square inside each cell

const BAYER = [
    0, 8, 2, 10,
    12, 4, 14, 6,
    3, 11, 1, 9,
    15, 7, 13, 5,
].map((v) => (v + 0.5) / 16);

// palettes go from faint (mist) to strong (near ridges)
const LIGHT = ["#cfe0fb", "#93c5fd", "#60a5fa", "#2563eb", "#1e40af", "#172554"];
const DARK = ["#0f1f3d", "#1e3a8a", "#1d4ed8", "#3b82f6", "#60a5fa", "#bfdbfe"];
const SPARK_LIGHT = "#7dd3fc";
const SPARK_DARK = "#7dd3fc";

function hash(n: number) {
    const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s);
}

function hash2(x: number, y: number) {
    const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return s - Math.floor(s);
}

function noise1(x: number, seed: number) {
    const i = Math.floor(x);
    const f = x - i;
    const u = f * f * (3 - 2 * f);
    return hash(i + seed * 101) * (1 - u) + hash(i + 1 + seed * 101) * u;
}

// folding the noise in half gives sharp peaks instead of round hills
function ridged(x: number, seed: number) {
    let v = 0;
    let amp = 0.6;
    let freq = 1;
    let norm = 0;
    for (let o = 0; o < 5; o++) {
        const n = 1 - Math.abs(noise1(x * freq, seed + o * 17) * 2 - 1);
        v += amp * n * n;
        norm += amp;
        amp *= 0.48;
        freq *= 2.03;
    }
    return v / norm; // 0..1
}

type Layer = {
    base: number; // ridge baseline, fraction of height from top
    amp: number; // how tall the peaks get
    freq: number; // peaks per noise unit
    tone: number; // ink strength at the crest
    seed: number;
    tilt: number; // slope across the width, gives the big foreground shoulder
};

// back to front
const LAYERS: Layer[] = [
    { base: 0.62, amp: 0.46, freq: 1.5, tone: 0.32, seed: 1, tilt: 0.05 },
    { base: 0.74, amp: 0.40, freq: 1.9, tone: 0.48, seed: 2, tilt: -0.06 },
    { base: 0.88, amp: 0.36, freq: 2.3, tone: 0.68, seed: 7, tilt: 0.1 },
    { base: 1.12, amp: 0.5, freq: 1.4, tone: 0.98, seed: 4, tilt: -0.5 },
];

// xs: position in fixed-scale units (so peaks keep their size on any screen)
// xw: position as a fraction of the actual width (so the tilt always spans it)
function ridge(layer: Layer, xs: number, xw: number) {
    const n = ridged(xs * layer.freq, layer.seed);
    return layer.base - layer.amp * n + layer.tilt * (xw - 0.5);
}

function draw(canvas: HTMLCanvasElement, isDark: boolean) {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = w * dpr;
    canvas.height = h * dpr;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const palette = isDark ? DARK : LIGHT;
    const spark = isDark ? SPARK_DARK : SPARK_LIGHT;
    const cols = Math.ceil(w / CELL);
    const rows = Math.ceil(h / CELL);

    // bucket dots by colour so we only switch fillStyle a handful of times
    const buckets: number[][] = palette.map(() => []);
    const sparks: number[] = [];

    for (let cx = 0; cx < cols; cx++) {
        const xs = cx / 400;
        const xw = cx / cols;
        const ridges = LAYERS.map((l) => ridge(l, xs, xw));

        for (let cy = 0; cy < rows; cy++) {
            const yn = cy / rows;

            // frontmost layer this cell sits inside
            let density = 0;
            let front = -1;
            for (let li = LAYERS.length - 1; li >= 0; li--) {
                if (yn >= ridges[li]) {
                    front = li;
                    break;
                }
            }

            if (front >= 0) {
                const l = LAYERS[front];
                const depth = yn - ridges[front];
                // darkest on the crest, washing out into the mist below
                const mist = Math.exp(-depth * 9);
                density = l.tone * (0.3 + 0.7 * mist);
                // a soft rim of shadow just under the crest line
                if (depth < 0.02) density = Math.min(1, density + 0.12);
            } else {
                // sky: a thin haze that thickens toward the horizon
                const nearest = Math.min(...ridges);
                density = Math.max(0, 0.16 - (nearest - yn) * 0.6);
            }

            // grain so flat areas don't look mechanical
            density += (hash2(cx, cy) - 0.5) * 0.14;

            // fade everything out at the top so it melts into the page
            const top = Math.min(1, Math.max(0, (yn - 0.02) / 0.3));
            density *= top * top * (3 - 2 * top);

            if (density <= 0) continue;
            const threshold = BAYER[(cy & 3) * 4 + (cx & 3)];
            if (density < threshold) continue;

            const idx = cx * CELL + cy * CELL * 100000;
            // the odd bright fleck in the mist, like light catching the haze
            if (density < 0.55 && hash2(cx + 91, cy + 37) < 0.05) {
                sparks.push(idx);
                continue;
            }
            const ci = Math.min(palette.length - 1, Math.floor(density * palette.length));
            buckets[ci].push(idx);
        }
    }

    const paint = (list: number[]) => {
        for (const idx of list) {
            const y = Math.floor(idx / 100000);
            const x = idx - y * 100000;
            ctx.fillRect(x, y, DOT, DOT);
        }
    };

    buckets.forEach((list, i) => {
        ctx.fillStyle = palette[i];
        paint(list);
    });
    ctx.fillStyle = spark;
    ctx.globalAlpha = isDark ? 0.9 : 0.75;
    paint(sparks);
    ctx.globalAlpha = 1;
}

export default function SiteFooter() {
    const { isDark } = useTheme();
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        let frame = 0;
        const redraw = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => draw(canvas, isDark));
        };
        redraw();
        const ro = new ResizeObserver(redraw);
        ro.observe(canvas);
        return () => {
            cancelAnimationFrame(frame);
            ro.disconnect();
        };
    }, [isDark]);

    return (
        <footer className="site-footer">
            <canvas ref={canvasRef} className="site-footer-canvas" aria-hidden="true" />
            <div className="site-footer-row">
                <span>© {new Date().getFullYear()} Kai Kim</span>
            </div>
        </footer>
    );
}
