"use client";

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cssVar } from '../../styles/palette';
import { useTheme } from '../ThemeContext';
import { TOOLTIP } from '../../styles/motion';
import { PixelHover } from '../PixelHover';

/** github-style contribution graph for the last year. hover a day to see its count */

type Day = { date: string; count: number; level: number };

const CELL = 10; // square size
const GAP = 3; // px between squares
const PITCH = CELL + GAP;
const LEFT = 30; // space for day labels
const TOP = 18; // space for month labels

// blue shades from no activity (0) to most (4)
const LIGHT = ['#ebedf0', '#bfdbfe', '#60a5fa', '#2563eb', '#1e40af'];
const DARK = ['#161b22', '#0c2d6b', '#1e4fae', '#3b82f6', '#79b0ff'];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const parse = (iso: string) => new Date(`${iso}T00:00:00`);
const fmtDay = (iso: string) => parse(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

const GITHUB_PATH = "M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z";

export const ContributionStrip = ({ username }: { username: string }) => {
    const { isDark } = useTheme();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [days, setDays] = useState<Day[] | null>(null);
    const [total, setTotal] = useState(0);
    const [failed, setFailed] = useState(false);
    const [hover, setHover] = useState<{ day: Day; x: number; y: number } | null>(null);

    useEffect(() => {
        let cancelled = false;
        fetch(`https://github-contributions-api.jogruber.de/v4/${username}?y=last`)
            .then((r) => r.json())
            .then((data: { contributions?: Day[]; total?: { lastYear?: number } }) => {
                if (cancelled) return;
                const list = data.contributions ?? [];
                if (!list.length) { setFailed(true); return; }
                setDays(list);
                setTotal(data.total?.lastYear ?? list.reduce((n, d) => n + d.count, 0));
            })
            .catch(() => { if (!cancelled) setFailed(true); });
        return () => { cancelled = true; };
    }, [username]);

    // scroll to the latest week on small screens
    useEffect(() => {
        const el = scrollRef.current;
        if (el && days) el.scrollLeft = el.scrollWidth;
    }, [days]);

    if (failed) return null;

    const colors = isDark ? DARK : LIGHT;
    // weeks start on sunday
    const offset = days ? parse(days[0].date).getDay() : 0;
    const weeks = days ? Math.ceil((offset + days.length) / 7) : 53;
    const width = LEFT + weeks * PITCH - GAP;
    const height = TOP + 7 * PITCH - GAP;

    // month labels
    const monthLabels: { x: number; label: string }[] = [];
    if (days) {
        let last = -1;
        for (let w = 0; w < weeks; w++) {
            const i = Math.max(0, w * 7 - offset);
            if (i >= days.length) break;
            const m = parse(days[i].date).getMonth();
            if (m !== last) {
                if (w < weeks - 2 || last === -1) monthLabels.push({ x: LEFT + w * PITCH, label: MONTHS[m] });
                last = m;
            }
        }
        // drop the first label if it overlaps the second
        if (monthLabels.length > 1 && monthLabels[1].x - monthLabels[0].x < PITCH * 3) monthLabels.shift();
    }

    const label = { fontSize: 9, fill: 'currentColor' };

    return (
        <motion.section
            initial={{ opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            style={{ marginTop: '48px', color: cssVar.textMuted }}
        >
            <div style={{ fontSize: '0.875rem', color: cssVar.textStrong, marginBottom: '8px', fontVariantNumeric: 'tabular-nums' }}>
                {days ? `${total.toLocaleString()} contributions in the last year` : ' '}
            </div>

            <div style={{
                position: 'relative',
                border: `1px solid ${cssVar.border}`,
                borderRadius: '6px',
                padding: '12px 14px 10px',
            }}>
                <div ref={scrollRef} style={{ overflowX: 'auto', overflowY: 'hidden' }}>
                    <svg
                        width={width}
                        height={height}
                        role="img"
                        aria-label={days ? `${total.toLocaleString()} GitHub contributions in the last year` : 'Loading GitHub contributions'}
                        style={{ display: 'block', margin: '0 auto' }}
                    >
                        {monthLabels.map((m) => (
                            <text key={m.x} x={m.x} y={10} {...label}>{m.label}</text>
                        ))}
                        {[['Mon', 1], ['Wed', 3], ['Fri', 5]].map(([d, row]) => (
                            <text key={d} x={0} y={TOP + (row as number) * PITCH + CELL - 1} {...label}>{d}</text>
                        ))}

                        {Array.from({ length: weeks * 7 }, (_, k) => {
                            const i = k - offset;
                            const day = days?.[i];
                            if (days && !day) return null;
                            const x = LEFT + Math.floor(k / 7) * PITCH;
                            const y = TOP + (k % 7) * PITCH;
                            return (
                                <rect
                                    key={k}
                                    x={x}
                                    y={y}
                                    width={CELL}
                                    height={CELL}
                                    rx={2}
                                    fill={colors[day?.level ?? 0]}
                                    stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(27,31,35,0.06)'}
                                    onPointerEnter={day ? (e) => {
                                        const box = (e.currentTarget.ownerSVGElement?.parentElement?.parentElement as HTMLElement).getBoundingClientRect();
                                        const r = e.currentTarget.getBoundingClientRect();
                                        setHover({ day, x: r.left - box.left + CELL / 2, y: r.top - box.top });
                                    } : undefined}
                                    onPointerLeave={() => setHover(null)}
                                />
                            );
                        })}
                    </svg>
                </div>

                <AnimatePresence>
                    {hover && (
                        <motion.div
                            key={hover.day.date}
                            {...TOOLTIP}
                            style={{
                                position: 'absolute',
                                left: hover.x,
                                top: hover.y - 8,
                                translate: '-50% -100%',
                                background: '#0a0a0a',
                                color: '#f5f5f5',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '6px',
                                padding: '5px 9px',
                                fontSize: '0.7rem',
                                whiteSpace: 'nowrap',
                                pointerEvents: 'none',
                                zIndex: 50,
                            }}
                        >
                            {hover.day.count === 0 ? 'No' : hover.day.count} {hover.day.count === 1 ? 'contribution' : 'contributions'} on {fmtDay(hover.day.date)}.
                        </motion.div>
                    )}
                </AnimatePresence>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginTop: '8px', fontSize: '0.6875rem' }}>
                    <a
                        href={`https://github.com/${username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ul-host"
                        style={{ color: 'inherit', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d={GITHUB_PATH} />
                        </svg>
                        <PixelHover className="ul-link">@{username}</PixelHover>
                    </a>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        Less
                        {colors.map((c) => (
                            <span key={c} style={{ width: CELL, height: CELL, borderRadius: 2, background: c, marginInline: 1 }} />
                        ))}
                        More
                    </span>
                </div>
            </div>
        </motion.section>
    );
};
