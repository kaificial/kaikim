"use client";

import type { CaseFormat, MediaEntry } from "../../data/media";
import { BLURAY_BLUE, inkOn, NEUTRAL_SPINE, type CaseDims } from "./formats";
import { spineFont } from "./fonts";
import { FormatLogo } from "./FormatLogo";

/** what's printed at the foot of the spine. blu-rays carry their mark in the band up top instead */
const FOOT_LABEL: Record<CaseFormat, (m: MediaEntry, ink: string) => React.ReactNode> = {
    dvd: (_m, ink) => <FormatLogo kind="dvd" width="78%" color={ink} />,
    bluray: () => null,
    vhs: () => 'VHS',
    boxset: (m) => (m.seasons ? `S1–${m.seasons}` : 'SET'),
};

/**
 * the printed spine of a case. every size is in em off a font size of `scale * 10px`, so the shelf copy
 * and the bigger 3d case match pixel for pixel
 */
export const Spine = ({ entry, format, dims, scale = 1 }: { entry: MediaEntry; format: CaseFormat; dims: CaseDims; scale?: number }) => {
    const bg = entry.spineColor ?? NEUTRAL_SPINE;
    const ink = inkOn(entry.spineColor);
    const d = dims.depth / 10; // spine width in em
    // big enough to read, small enough to fit inside the spine with a margin
    const titleSize = Math.min(d * 0.62, 1.7);

    return (
        <div
            className={spineFont.className}
            style={{
                fontSize: `${scale * 10}px`,
                width: `${d}em`,
                height: `${dims.height / 10}em`,
                background: format === 'vhs'
                    ? `linear-gradient(90deg, rgba(0,0,0,0.18), transparent 30%, transparent 70%, rgba(0,0,0,0.25)), ${bg}`
                    : bg,
                color: ink,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                overflow: 'hidden',
                position: 'relative',
                boxSizing: 'border-box',
            }}
        >
            {format === 'bluray' && (
                <div style={{ width: '100%', height: '2.1em', background: BLURAY_BLUE, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FormatLogo kind="bluray" width="80%" color="#fff" />
                </div>
            )}
            <div style={{
                flex: 1,
                minHeight: 0,
                writingMode: 'vertical-rl',
                fontSize: `${titleSize}em`,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                lineHeight: 1,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                padding: '0.7em 0 0.4em',
            }}>
                {entry.title}
            </div>
            <div style={{ writingMode: 'vertical-rl', fontSize: `${Math.min(d * 0.42, 1)}em`, fontWeight: 600, opacity: 0.75, paddingBottom: '0.5em', fontVariantNumeric: 'tabular-nums' }}>
                {entry.year}
            </div>
            {format !== 'bluray' && <div style={{
                width: '100%',
                flexShrink: 0,
                display: 'flex',
                justifyContent: 'center',
                padding: '0.35em 0',
                borderTop: `1px solid ${ink === '#111111' ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.22)'}`,
                textAlign: 'center',
                fontSize: `${Math.min(d * 0.32, 0.8)}em`,
                fontWeight: 800,
                letterSpacing: '0.02em',
                whiteSpace: 'nowrap',
            }}>
                {FOOT_LABEL[format](entry, ink)}
            </div>}
            {/* light catching the curved plastic edge */}
            <div aria-hidden style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                background: format === 'vhs'
                    ? 'none'
                    : 'linear-gradient(90deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.04) 35%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.22) 100%)',
            }} />
        </div>
    );
};
