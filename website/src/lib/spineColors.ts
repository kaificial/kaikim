import { readFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import type { MediaEntry } from "../data/media";

// posters don't change, so one lookup per server instance is plenty
const colorCache = new Map<string, Promise<string | undefined>>();

const loadPoster = async (src: string) => {
    if (src.startsWith('/')) {
        return readFile(path.join(process.cwd(), 'public', decodeURIComponent(src)));
    }
    const res = await fetch(src, { next: { revalidate: 60 * 60 * 24 * 30 } });
    if (!res.ok) throw new Error(`${res.status} ${src}`);
    return Buffer.from(await res.arrayBuffer());
};

const toHex = ({ r, g, b }: { r: number; g: number; b: number }) =>
    `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;

const dominantColor = (src: string) => {
    let pending = colorCache.get(src);
    if (!pending) {
        pending = loadPoster(src)
            .then((buf) => sharp(buf).stats())
            .then(({ dominant }) => toHex(dominant))
            // no colour just falls back to the neutral spine
            .catch(() => undefined);
        colorCache.set(src, pending);
    }
    return pending;
};

export const withSpineColors = (entries: MediaEntry[]) =>
    Promise.all(entries.map(async (m) => (m.spineColor ? m : { ...m, spineColor: await dominantColor(m.poster) })));
