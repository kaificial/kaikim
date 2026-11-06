"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import type { CaseFormat, MediaEntry } from "../../data/media";
import { BLURAY_BLUE, NEUTRAL_SPINE } from "./formats";
import { spineFont } from "./fonts";
import { barcode } from "./barcode";
import { FormatLogo, logoFor } from "./FormatLogo";

const formatRating = (r: number) => (Number.isInteger(r) ? `${r}` : r.toFixed(1));
const formatWatched = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString('en-CA', { day: 'numeric', month: 'short', year: 'numeric' });

/** clamp a block of text to n lines */
const clamp = (lines: number): CSSProperties => ({
    display: '-webkit-box',
    WebkitLineClamp: lines,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
});

/** the blurb: the start of the review, or a plain line from the facts when there isn't one */
const synopsis = (m: MediaEntry) => {
    const sentences = m.review?.split(/(?<=[.!?])\s+/).filter(Boolean) ?? [];
    if (sentences.length) {
        const text = sentences.slice(0, 3).join(' ');
        return text.length > 300 ? `${text.slice(0, 297).trimEnd()}…` : text;
    }
    return `${m.kind === 'tv' ? 'A series' : 'A film'} from ${m.year}, kept on Kai's shelf with a rating of ${formatRating(m.rating)} out of 5.`;
};

/** "special features", all real facts about the entry */
const features = (m: MediaEntry) => [
    m.review ? 'Liner notes by Kai Kim' : null,
    `Kai's rating: ${formatRating(m.rating)} / 5`,
    m.watched ? `Logged on Letterboxd ${formatWatched(m.watched)}` : null,
    m.rewatches ? `${m.rewatches + 1} viewings and counting` : null,
    m.seasons ? `All ${m.seasons} seasons` : null,
    m.tags.length ? m.tags.join(' / ') : null,
].filter((f): f is string => !!f);

/**
 * back of the case, laid out like a real one: tagline, blurb, features, stills, the small print
 * and a barcode strip at the bottom
 */
export const BackCover = ({ entry, format, plastic, width }: { entry: MediaEntry; format: CaseFormat; plastic: string; width: number }) => {
    const framed = format === 'dvd' || format === 'bluray';
    const logo = logoFor(format);
    const title = entry.title.toUpperCase();
    const kind = entry.kind === 'tv' ? 'series' : 'film';
    const bars = barcode(`${entry.id}${entry.year}`);
    const billing = [
        'KAI KIM PRESENTS',
        `A ${entry.year} ${kind.toUpperCase()}`,
        `“${title}”`,
        `RATED ${formatRating(entry.rating)} OUT OF 5`,
        entry.tags.length ? entry.tags.join(' · ').toUpperCase() : null,
        entry.review ? 'LINER NOTES WRITTEN BY KAI KIM' : null,
        'SHELVED AT KAIKIM.CA',
    ].filter(Boolean).join('   ');
    const badge: CSSProperties = {
        border: '1px solid rgba(255,255,255,0.55)',
        padding: '0.15em 0.35em',
        fontSize: '0.42em',
        fontWeight: 700,
        letterSpacing: '0.08em',
        lineHeight: 1,
        whiteSpace: 'nowrap',
    };

    return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: framed ? plastic : entry.spineColor ?? NEUTRAL_SPINE }}>
            {/* from the back the hinge is on the right, so the sleeve's fold margin is too */}
            <div style={{ position: 'absolute', inset: framed ? '0.3em 0.55em 0.3em 0.3em' : 0, overflow: 'hidden', background: '#0b0b0c' }}>
                {/* the art bleeds faintly through the top, the bottom goes to solid black for the small print */}
                <Image src={entry.poster} alt="" fill sizes={`${Math.round(width)}px`} style={{ objectFit: 'cover', filter: 'blur(10px) brightness(0.5) saturate(1.1)', transform: 'scale(1.2)', opacity: 0.55 }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(rgba(11,11,12,0.2), rgba(11,11,12,0.75) 45%, #0b0b0c 72%)' }} />

                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', gap: '0.65em', padding: format === 'bluray' ? '2.7em 1em 0.9em' : '1.1em 1em 0.9em', color: '#ececec' }}>
                    {/* tagline */}
                    <div className={spineFont.className} style={{ ...clamp(2), fontSize: '1.45em', fontWeight: 800, lineHeight: 0.95, textTransform: 'uppercase', textWrap: 'balance' }}>
                        {entry.verdict ?? entry.title}
                    </div>

                    {/* blurb and features on the left, stills down the right */}
                    <div style={{ flex: '1 1 auto', minHeight: 0, overflow: 'hidden', display: 'flex', gap: '0.7em' }}>
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.6em' }}>
                            <p style={{ ...clamp(7), margin: 0, fontSize: '0.6em', lineHeight: 1.5, color: 'rgba(236,236,236,0.86)' }}>
                                {synopsis(entry)}
                            </p>
                            <div>
                                <div className={spineFont.className} style={{ fontSize: '0.74em', fontWeight: 800, letterSpacing: '0.14em', paddingBottom: '0.2em', marginBottom: '0.35em', borderBottom: '1px solid rgba(255,255,255,0.3)' }}>
                                    SPECIAL FEATURES
                                </div>
                                <ul style={{ margin: 0, padding: 0, listStyle: 'none', fontSize: '0.55em', lineHeight: 1.55, color: 'rgba(236,236,236,0.86)' }}>
                                    {features(entry).map((f) => (
                                        <li key={f} style={{ display: 'flex', gap: '0.5em' }}>
                                            <span aria-hidden style={{ opacity: 0.55 }}>■</span>
                                            <span style={{ minWidth: 0 }}>{f}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        <div style={{ width: '5.2em', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.35em' }}>
                            {['20% 25%', '55% 50%', '80% 80%'].map((pos) => (
                                <div key={pos} style={{ position: 'relative', aspectRatio: '16 / 9', overflow: 'hidden', outline: '1px solid rgba(255,255,255,0.4)', boxShadow: '0 0.15em 0.4em rgba(0,0,0,0.6)' }}>
                                    <Image src={entry.poster} alt="" fill sizes={`${Math.round(width / 3)}px`} style={{ objectFit: 'cover', objectPosition: pos, transform: 'scale(1.7)' }} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* billing block: tall condensed small print */}
                    <div className={spineFont.className} style={{ ...clamp(3), fontSize: '0.5em', fontWeight: 600, lineHeight: 1.05, letterSpacing: '0.01em', textAlign: 'center', color: 'rgba(236,236,236,0.62)', transform: 'scaleY(1.35)', transformOrigin: '50% 100%', margin: '0.3em 0 0.1em', wordSpacing: '0.1em' }}>
                        {billing}
                    </div>

                    {/* rating box, spec badges, format logo, barcode */}
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '0.5em', paddingTop: '0.5em', borderTop: '1px solid rgba(255,255,255,0.18)' }}>
                        <div style={{ display: 'flex', alignItems: 'stretch', border: '1.5px solid #ececec', lineHeight: 1 }}>
                            <span className={spineFont.className} style={{ fontSize: '1.35em', fontWeight: 800, padding: '0.08em 0.2em', background: '#ececec', color: '#0b0b0c', fontVariantNumeric: 'tabular-nums' }}>
                                {formatRating(entry.rating)}
                            </span>
                            <span style={{ fontSize: '0.36em', fontWeight: 700, letterSpacing: '0.1em', padding: '0.35em 0.5em', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.25em' }}>
                                <span>KAI&apos;S</span>
                                <span>RATING</span>
                            </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25em', alignItems: 'flex-start' }}>
                            <span style={badge}>{entry.kind === 'tv' ? 'SERIES' : 'FEATURE FILM'}</span>
                            <span style={badge}>COLOUR · 16:9</span>
                        </div>
                        {logo ? (
                            <FormatLogo kind={logo} height={logo === 'dvd' ? '1.7em' : '1.4em'} color="#ececec" label />
                        ) : (
                            <span className={spineFont.className} style={{ border: '1.5px solid #ececec', padding: '0.1em 0.4em', fontWeight: 800, fontSize: '0.9em', letterSpacing: '0.12em' }}>VHS</span>
                        )}
                        <div style={{ background: '#f4f3ef', padding: '0.3em 0.4em 0.15em', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div aria-hidden style={{ display: 'flex', height: '1.9em' }}>
                                {bars.slice(0, 40).map((w, i) => <span key={i} style={{ width: w * 0.8, background: i % 2 === 0 ? '#111' : 'transparent' }} />)}
                            </div>
                            <span style={{ fontSize: '0.45em', letterSpacing: '0.18em', color: '#222', fontVariantNumeric: 'tabular-nums' }}>{entry.id.toUpperCase().slice(0, 12)}</span>
                        </div>
                    </div>
                </div>

                {format === 'bluray' && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2.1em', background: BLURAY_BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FormatLogo kind="bluray" height="1.35em" color="#fff" />
                    </div>
                )}
            </div>
        </div>
    );
};
