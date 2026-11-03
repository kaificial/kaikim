"use client";

import Image from "next/image";
import type { CaseFormat, MediaEntry } from "../../data/media";
import { BLURAY_BLUE, FORMAT_LABEL, NEUTRAL_SPINE } from "./formats";
import { spineFont } from "./fonts";
import { barcode } from "./barcode";

const formatRating = (r: number) => (Number.isInteger(r) ? `${r}` : r.toFixed(1));
const formatWatched = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString('en-CA', { day: 'numeric', month: 'short', year: 'numeric' });

/** the back cover quote: the verdict, or the first sentence of the review */
const pullQuote = (m: MediaEntry) => {
    if (m.verdict) return m.verdict;
    const first = m.review?.split(/(?<=[.!?])\s/)[0]?.trim();
    if (!first) return null;
    return first.length > 140 ? `${first.slice(0, 137).trimEnd()}…` : first;
};

/**
 * back insert, laid out like a real store back cover: quote, rating, stills, genres, a specs box and a
 * barcode. everything on it comes from the entry
 */
export const BackCover = ({ entry, format, plastic, width }: { entry: MediaEntry; format: CaseFormat; plastic: string; width: number }) => {
    const framed = format === 'dvd' || format === 'bluray';
    const quote = pullQuote(entry);
    const discs = format === 'boxset' ? entry.seasons : format === 'vhs' ? undefined : 1;
    const specs: [string, string][] = [
        ['Format', FORMAT_LABEL[format]],
        ['Released', String(entry.year)],
        ...(entry.seasons ? [['Seasons', String(entry.seasons)] as [string, string]] : []),
        ...(discs ? [['Discs', String(discs)] as [string, string]] : []),
        ...(entry.watched ? [['Watched', formatWatched(entry.watched)] as [string, string]] : []),
        ...(entry.rewatches ? [['Viewings', String(entry.rewatches + 1)] as [string, string]] : []),
        ['Rated', `${formatRating(entry.rating)} / 5`],
    ];
    const bars = barcode(`${entry.id}${entry.year}`);

    return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: framed ? plastic : entry.spineColor ?? NEUTRAL_SPINE }}>
            {/* from the back the hinge is on the right, so the sleeve's fold margin is too */}
            <div style={{ position: 'absolute', inset: framed ? '0.3em 0.55em 0.3em 0.3em' : 0, overflow: 'hidden', background: entry.spineColor ?? NEUTRAL_SPINE }}>
                <Image src={entry.poster} alt="" fill sizes={`${Math.round(width)}px`} style={{ objectFit: 'cover', filter: 'blur(14px) brightness(0.38) saturate(1.2)', transform: 'scale(1.25)' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,0.55))' }} />

                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', gap: '0.8em', padding: format === 'bluray' ? '2.9em 1.3em 1.1em' : '1.3em 1.3em 1.1em', color: '#f2f2f2' }}>
                    <div>
                        <div className={spineFont.className} style={{ fontSize: '2.2em', fontWeight: 800, lineHeight: 0.95, textTransform: 'uppercase', textWrap: 'balance' }}>{entry.title}</div>
                        <div style={{ fontSize: '0.78em', letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.65, marginTop: '0.4em' }}>
                            {entry.kind === 'tv' ? 'The series' : 'The film'} · {entry.year}
                        </div>
                    </div>

                    {quote && (
                        <p style={{ margin: 0, fontSize: '1em', lineHeight: 1.45 }}>
                            <span style={{ fontSize: '1.4em', lineHeight: 0, verticalAlign: '-0.25em', opacity: 0.6 }}>“</span>
                            {quote}
                            <span style={{ fontSize: '1.4em', lineHeight: 0, verticalAlign: '-0.25em', opacity: 0.6 }}>”</span>
                            <span style={{ display: 'block', marginTop: '0.35em', fontSize: '0.75em', letterSpacing: '0.16em', opacity: 0.6 }}>— KAI KIM</span>
                        </p>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5em' }}>
                        {[1, 2, 3, 4, 5].map((n) => (
                            <span key={n} style={{
                                width: '0.85em', height: '0.85em', borderRadius: '0.15em',
                                background: n <= entry.rating ? '#fff' : n - 0.5 === entry.rating
                                    ? 'linear-gradient(90deg, #fff 50%, rgba(255,255,255,0.18) 50%)' : 'rgba(255,255,255,0.18)',
                            }} />
                        ))}
                        <span style={{ fontSize: '0.9em', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{formatRating(entry.rating)}/5</span>
                    </div>

                    {/* three "stills": crops of the poster, like real back covers */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.35em' }}>
                        {['15% 30%', '50% 55%', '85% 75%'].map((pos) => (
                            <div key={pos} style={{ position: 'relative', aspectRatio: '16 / 9', overflow: 'hidden', boxShadow: '0 0 0 1px rgba(255,255,255,0.25)' }}>
                                <Image src={entry.poster} alt="" fill sizes={`${Math.round(width / 3)}px`} style={{ objectFit: 'cover', objectPosition: pos, transform: 'scale(1.6)' }} />
                            </div>
                        ))}
                    </div>

                    {entry.tags.length > 0 && (
                        <div style={{ fontSize: '0.75em', letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.75 }}>{entry.tags.join(' · ')}</div>
                    )}

                    {/* specs box */}
                    <div style={{ marginTop: 'auto', border: '1px solid rgba(255,255,255,0.3)', display: 'grid', gridTemplateColumns: 'auto 1fr', fontSize: '0.7em', letterSpacing: '0.06em', textTransform: 'uppercase', fontVariantNumeric: 'tabular-nums' }}>
                        {specs.map(([k, v], i) => (
                            <div key={k} style={{ display: 'contents' }}>
                                <span style={{ padding: '0.3em 0.6em', borderTop: i ? '1px solid rgba(255,255,255,0.15)' : 'none', opacity: 0.6 }}>{k}</span>
                                <span style={{ padding: '0.3em 0.6em', borderTop: i ? '1px solid rgba(255,255,255,0.15)' : 'none', borderLeft: '1px solid rgba(255,255,255,0.15)' }}>{v}</span>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '0.8em' }}>
                        <div style={{ background: '#f4f3ef', padding: '0.35em 0.5em 0.2em', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div aria-hidden style={{ display: 'flex', height: '2.2em' }}>
                                {bars.map((w, i) => <span key={i} style={{ width: w * 0.9, background: i % 2 === 0 ? '#111' : 'transparent' }} />)}
                            </div>
                            <span style={{ fontSize: '0.55em', letterSpacing: '0.2em', color: '#222' }}>{entry.id.toUpperCase().slice(0, 14)}</span>
                        </div>
                        <div className={spineFont.className} style={{ textAlign: 'right', fontSize: '0.8em', fontWeight: 800, letterSpacing: '0.12em', opacity: 0.8, lineHeight: 1.2 }}>
                            <div style={{ border: '1.5px solid currentColor', padding: '0.1em 0.4em', display: 'inline-block' }}>{format === 'bluray' ? 'BLU-RAY' : format === 'vhs' ? 'VHS' : 'DVD'}</div>                        </div>
                    </div>
                </div>

                {format === 'bluray' && (
                    <div className={spineFont.className} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2.1em', background: BLURAY_BLUE, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1em', letterSpacing: '0.08em' }}>
                        BLU-RAY DISC
                    </div>
                )}
            </div>
            {framed && <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(245deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.03) 28%, transparent 45%)' }} />}
        </div>
    );
};
