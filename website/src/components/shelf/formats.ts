import type { CaseFormat, MediaEntry } from "../../data/media";

export interface CaseDims {
    /** front cover width */
    width: number;
    height: number;
    /** spine thickness */
    depth: number;
}

// real case sizes in mm, drawn at 4/3 px per mm
const PX_PER_MM = 4 / 3;
const mm = (w: number, h: number, d: number): CaseDims => ({ width: w * PX_PER_MM, height: h * PX_PER_MM, depth: d * PX_PER_MM });

export const FORMAT_LABEL: Record<CaseFormat, string> = {
    dvd: 'DVD',
    bluray: 'Blu-ray',
    boxset: 'Box set',
    vhs: 'VHS',
};

export const BLURAY_BLUE = '#0b5cad';

export const resolveFormat = (m: MediaEntry): CaseFormat =>
    m.format ?? (m.kind === 'tv' ? 'boxset' : m.rewatches ? 'vhs' : m.rating === 5 ? 'bluray' : 'dvd');

export const caseDims = (m: MediaEntry, format = resolveFormat(m)): CaseDims => {
    switch (format) {
        case 'bluray': return mm(148, 171, 12);
        case 'vhs': return mm(105, 190, 25);
        // box sets get ~9mm thicker per season, never thinner than a two disc set
        case 'boxset': return mm(140, 196, 9 * Math.max(2, m.seasons ?? 2));
        default: return mm(135, 190, 14);
    }
};

/** readable text colour for a spine of the given colour */
export const inkOn = (hex: string | undefined) => {
    if (!hex) return '#f5f5f5';
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return lum > 0.55 ? '#111111' : '#f5f5f5';
};

export const NEUTRAL_SPINE = '#2a2a2a';

/**
 * one light, from above and a bit to the left, shared by the shelf and the stage. every side is shaded
 * by which way it faces, tops lightest, bottoms darkest
 */
export const SHADE = {
    top: 'brightness(1.28)',
    front: 'none',
    side: 'brightness(0.78)',
    bottom: 'brightness(0.55)',
} as const;
