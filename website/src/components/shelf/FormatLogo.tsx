import type { CSSProperties } from "react";
import type { CaseFormat } from "../../data/media";

/**
 * the real format marks (public/assets/logos, from wikimedia commons). drawn as a css mask so one file
 * can be white on a blu-ray band, black on liner notes or a faint emboss in the tray
 */
const LOGOS = {
    dvd: { src: '/assets/logos/dvd-video.svg', ratio: 500 / 300, label: 'DVD Video' },
    bluray: { src: '/assets/logos/blu-ray.svg', ratio: 386 / 207, label: 'Blu-ray Disc' },
} as const;

export type LogoKind = keyof typeof LOGOS;

/** which mark a case carries. box sets are dvd sets, tapes don't get one */
export const logoFor = (format: CaseFormat): LogoKind | null =>
    format === 'bluray' ? 'bluray' : format === 'vhs' ? null : 'dvd';

export const FormatLogo = ({ kind, width, height, color = 'currentColor', label = false, style }: {
    kind: LogoKind;
    /** give one of width or height, the other follows the logo's shape */
    width?: CSSProperties['width'];
    height?: CSSProperties['height'];
    color?: string;
    /** announce it to screen readers (off by default, it's usually decoration next to text) */
    label?: boolean;
    style?: CSSProperties;
}) => {
    const logo = LOGOS[kind];
    const mask = `url(${logo.src}) center / contain no-repeat`;
    return (
        <span
            role={label ? 'img' : undefined}
            aria-label={label ? logo.label : undefined}
            aria-hidden={label ? undefined : true}
            style={{
                display: 'inline-block',
                flexShrink: 0,
                width,
                height,
                aspectRatio: `${logo.ratio}`,
                backgroundColor: color,
                WebkitMask: mask,
                mask,
                ...style,
            }}
        />
    );
};
