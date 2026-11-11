"use client";

/**
 * theme switch: the page flips over in little 24px squares, spreading out from wherever
 * you clicked. each square grows from its middle and some start a bit late, so the edge
 * looks pixelated instead of smooth.
 *
 * it uses view transitions, so the browser gives us a picture of the old page and the new
 * one, and we reveal one through a mask. i draw every frame of the wave into one tall image
 * up front and let css step through it, so no js runs while it's playing.
 *
 * the old version drew that image on a canvas and saved it as a png, which was slow on
 * phones. now i just write the pixels into a buffer myself and wrap it as a png with no
 * compression, which takes a few ms.
 * if the browser can't do view transitions (or you have reduced motion on) it just swaps
 */

const CELL = 24; // matches --grid-size
const FRAMES = 28; // if you change this, change steps(28) in globals.scss too
const RAMP = 0.18; // how much of the run each tile takes to grow
const JITTER = 0.12; // random lag per tile, as a fraction of the run
const MAX_PIXELS = 3_000_000; // keeps the image around 12MB once the browser decodes it
const MAX_HEIGHT = 16_000; // gpus don't like images taller than this
export const THEME_WAVE_MS = 1100;

let lastPointer: { x: number; y: number; t: number } | null = null;
if (typeof window !== 'undefined') {
    window.addEventListener('pointerdown', (e) => { lastPointer = { x: e.clientX, y: e.clientY, t: performance.now() }; }, { capture: true, passive: true });
}

const easeOut = (t: number) => 1 - (1 - t) ** 3;

/* ── a tiny png writer. black = see-through, white = solid, so it works as a mask ── */

let crcTable: Uint32Array | null = null;
const crc32 = (buf: Uint8Array, start: number, end: number) => {
    if (!crcTable) {
        crcTable = new Uint32Array(256);
        for (let n = 0; n < 256; n++) {
            let c = n;
            for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
            crcTable[n] = c >>> 0;
        }
    }
    let c = 0xffffffff;
    for (let i = start; i < end; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
};

const adler32 = (buf: Uint8Array) => {
    let a = 1, b = 0;
    for (let i = 0; i < buf.length;) {
        const end = Math.min(i + 5552, buf.length);
        for (; i < end; i++) { a += buf[i]; b += a; }
        a %= 65521; b %= 65521;
    }
    return ((b << 16) | a) >>> 0;
};

/** raw is the image rows, each starting with a 0 byte. nothing gets compressed, it's just wrapped */
const encodeMaskPng = (raw: Uint8Array, width: number, height: number) => {
    const idatLen = 2 + raw.length + Math.ceil(raw.length / 65535) * 5 + 4;
    const out = new Uint8Array(8 + 25 + 14 + 12 + idatLen + 12);
    const dv = new DataView(out.buffer);
    out.set([137, 80, 78, 71, 13, 10, 26, 10]);
    let p = 8;
    const chunk = (type: string, len: number, fill: () => void) => {
        dv.setUint32(p, len); p += 4;
        const start = p;
        for (let i = 0; i < 4; i++) out[p++] = type.charCodeAt(i);
        fill();
        dv.setUint32(p, crc32(out, start, p)); p += 4;
    };
    chunk('IHDR', 13, () => { dv.setUint32(p, width); dv.setUint32(p + 4, height); out.set([1, 0, 0, 0, 0], p + 8); p += 13; });
    chunk('tRNS', 2, () => { dv.setUint16(p, 0); p += 2; });
    chunk('IDAT', idatLen, () => {
        out[p++] = 0x78; out[p++] = 0x01;
        for (let off = 0; off < raw.length; off += 65535) {
            const len = Math.min(65535, raw.length - off);
            out[p++] = off + len >= raw.length ? 1 : 0;
            dv.setUint16(p, len, true); dv.setUint16(p + 2, ~len & 0xffff, true); p += 4;
            out.set(raw.subarray(off, off + len), p); p += len;
        }
        dv.setUint32(p, adler32(raw)); p += 4;
    });
    chunk('IEND', 0, () => {});
    return new Blob([out], { type: 'image/png' });
};

/* ── the wave ── */

/** draws every frame of the wave, stacked top to bottom */
const buildWave = (w: number, h: number, ox: number, oy: number) => {
    // the squares are centred across the page like the old background grid was, so start one
    // square early to cover the cut-off column on the left
    const shift = (((w - CELL) / 2) % CELL + CELL) % CELL;
    const left = shift > 0 ? shift - CELL : 0;
    const cols = Math.ceil((w - left) / CELL);
    const rows = Math.ceil(h / CELL);

    // how many image pixels per square. has to be even so squares grow evenly from the middle,
    // and divide into 24 so it scales up cleanly. bigger is sharper, smaller is lighter
    let px = 8;
    while (px > 2 && (cols * rows * px * px * FRAMES > MAX_PIXELS || rows * px * FRAMES > MAX_HEIGHT)) px -= 2;

    // when each square starts: further from the click = later, plus a bit of randomness
    const n = cols * rows;
    const starts = new Float32Array(n);
    let far = 1;
    for (let i = 0; i < n; i++) {
        const d = Math.hypot(left + ((i % cols) + 0.5) * CELL - ox, (((i / cols) | 0) + 0.5) * CELL - oy);
        starts[i] = d;
        if (d > far) far = d;
    }
    for (let i = 0; i < n; i++) starts[i] = (starts[i] / far) * (1 - RAMP - JITTER) + Math.random() * JITTER;

    const width = cols * px;
    const frameH = rows * px;
    const stride = 1 + ((width + 7) >> 3);
    const raw = new Uint8Array(stride * frameH * FRAMES);
    const sizes = new Uint8Array(cols);
    const half = px / 2;

    for (let f = 0; f < FRAMES; f++) {
        const progress = f / (FRAMES - 1);
        for (let r = 0; r < rows; r++) {
            let any = false;
            for (let c = 0; c < cols; c++) {
                const t = (progress - starts[r * cols + c]) / RAMP;
                const s = t <= 0 ? 0 : t >= 1 ? px : 2 * Math.max(1, Math.ceil(half * easeOut(t)));
                sizes[c] = s;
                if (s) any = true;
            }
            if (!any) continue;
            const y0 = f * frameH + r * px;
            for (let c = 0; c < cols; c++) {
                const s = sizes[c];
                if (!s) continue;
                const off = (px - s) >> 1;
                const x0 = c * px + off;
                for (let y = y0 + off; y < y0 + off + s; y++) {
                    const row = y * stride + 1;
                    for (let x = x0; x < x0 + s; x++) raw[row + (x >> 3)] |= 0x80 >> (x & 7);
                }
            }
        }
    }

    return { blob: encodeMaskPng(raw, width, frameH * FRAMES), left, cols, rows };
};

type ViewTransitionLike = { finished: Promise<void> };
type DocWithVT = Document & { startViewTransition?: (cb: () => void) => ViewTransitionLike };

/**
 * runs `apply` (which has to change the page straight away) behind the wave. the dark page is
 * always the one moving: it grows out of your click going dark, and shrinks back going light.
 * returns how long the wave lasts, or 0 if it just switched
 */
export const runThemeTransition = (apply: () => void, toDark: boolean): number => {
    const doc = document as DocWithVT;
    if (!doc.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        apply();
        return 0;
    }

    const root = document.documentElement;
    // width without the scrollbar. on phones the page is taller than the screen while the url
    // bar is showing, so cover a little extra
    const w = root.clientWidth;
    const h = Math.max(window.innerHeight, root.clientHeight) + 160;
    // start from the click, or from the top middle if it came from the keyboard / ⌘K
    const recent = lastPointer && performance.now() - lastPointer.t < 1000;
    const { blob, left, cols, rows } = buildWave(w, h, recent ? lastPointer!.x : w / 2, recent ? lastPointer!.y : 0);
    const url = URL.createObjectURL(blob);

    const vars: Record<string, string> = {
        '--vt-mask': `url("${url}")`,
        '--vt-x': `${left}px`,
        '--vt-size': `${cols * CELL}px ${rows * CELL * FRAMES}px`,
        '--vt-end': `${-(FRAMES - 1) * rows * CELL}px`,
        '--vt-ms': `${THEME_WAVE_MS}ms`,
    };
    for (const k in vars) root.style.setProperty(k, vars[k]);
    // this class also turns off colour fades, otherwise the new page gets captured mid-fade
    root.classList.add('theme-switching', toDark ? 'theme-to-dark' : 'theme-to-light');

    const cleanup = () => {
        root.classList.remove('theme-switching', 'theme-to-dark', 'theme-to-light');
        root.style.removeProperty('--vt-mask');
        URL.revokeObjectURL(url);
    };
    try {
        doc.startViewTransition(apply).finished.then(cleanup, cleanup);
    } catch {
        cleanup();
        apply();
        return 0;
    }
    return THEME_WAVE_MS;
};
