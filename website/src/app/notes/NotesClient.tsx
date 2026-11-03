"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useTheme } from "../../components/ThemeContext";
import { useUISound } from "../../hooks/use-ui-sound";
import { sfx } from "../../lib/sfx";
import type { MediaEntry, MediaKind } from "../../data/media";
import { Shelf } from "../../components/shelf/Shelf";
import styles from "./notes.module.scss";
import { DURATION, EASE_OUT, exitFor, PRESS } from '../../styles/motion';

type Category = 'all' | MediaKind;
type SortKey = 'rating' | 'recent' | 'year' | 'title';
type ViewMode = 'shelf' | 'list' | 'grid';

const CATEGORIES: { key: Category; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'movie', label: 'Movies' },
    { key: 'tv', label: 'Shows' },
];
const SORTS: { key: SortKey; label: string }[] = [
    { key: 'rating', label: 'Rating' },
    { key: 'recent', label: 'Recent' },
    { key: 'year', label: 'Year' },
    { key: 'title', label: 'A–Z' },
];
// half-star buckets, 0.5 to 5
const RATING_STEPS = Array.from({ length: 10 }, (_, i) => (i + 1) / 2);
const EASE = [0.22, 1, 0.36, 1] as const;

const formatRating = (r: number) => (Number.isInteger(r) ? `${r}` : r.toFixed(1));
const formatWatched = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString('en-CA', { month: 'short', year: 'numeric' });

const sorters: Record<SortKey, (a: MediaEntry, b: MediaEntry) => number> = {
    rating: (a, b) => b.rating - a.rating || b.year - a.year,
    // stuff without a watch date sinks to the bottom
    recent: (a, b) => (b.watched ?? '').localeCompare(a.watched ?? '') || b.rating - a.rating,
    year: (a, b) => b.year - a.year || b.rating - a.rating,
    title: (a, b) => a.title.localeCompare(b.title),
};

const RatingDots = ({ rating, accent, isDark, size = 8 }: { rating: number; accent: string; isDark: boolean; size?: number }) => (
    <div role="img" aria-label={`Rated ${formatRating(rating)} out of 5`} style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
        {[1, 2, 3, 4, 5].map((n) => {
            const emptyColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
            return (
                <div key={n} style={{
                    width: size, height: size, borderRadius: '2px',
                    background: n <= rating ? accent : n - 0.5 === rating
                        ? `linear-gradient(90deg, ${accent} 50%, ${emptyColor} 50%)` : emptyColor,
                    transition: 'background 0.2s',
                }} />
            );
        })}
    </div>
);

const MediaCollection = ({ media, isDark, startDelay = 0 }: { media: MediaEntry[]; isDark: boolean; startDelay?: number }) => {
    const [category, setCategory] = useState<Category>('all');
    const [sort, setSort] = useState<SortKey>('rating');
    const [view, setView] = useState<ViewMode>('shelf');
    const [tag, setTag] = useState<string | null>(null);
    const [ratingFilter, setRatingFilter] = useState<number | null>(null);
    const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [urlReady, setUrlReady] = useState(false);
    const pendingScroll = useRef<string | null>(null);
    const reduceMotion = useReducedMotion();
    const { playClick } = useUISound();

    const accent = isDark ? '#3b82f6' : '#2563eb';
    const textPrimary = isDark ? '#e6e6e6' : '#18181b';
    const textSecondary = isDark ? '#6e6e6e' : '#6b7280';
    const borderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
    const chipBg = isDark ? 'rgba(28, 28, 28, 0.85)' : '#E5E7EB';
    const chipBorder = isDark ? '#2a2a2a' : '#D1D5DB';
    const chipText = isDark ? '#e6e6e6' : '#111827';

    useEffect(() => {
        const t = window.setTimeout(() => setIsInitialLoad(false), 4000);
        return () => window.clearTimeout(t);
    }, []);

    // read filters from the url and jump to a review linked by #id
    // (has to wait for hydration, the server can't see the query or hash)
    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab');
        if (tab === 'movie' || tab === 'tv') setCategory(tab);
        const s = params.get('sort');
        if (s === 'recent' || s === 'year' || s === 'title') setSort(s);
        const v = params.get('view');
        if (v === 'list' || v === 'grid') setView(v);
        const tg = params.get('tag');
        if (tg && media.some((m) => m.tags.includes(tg))) setTag(tg);
        const r = Number(params.get('rating'));
        if (RATING_STEPS.includes(r)) setRatingFilter(r);

        const hashId = decodeURIComponent(window.location.hash.slice(1));
        if (hashId && media.some((m) => m.id === hashId)) {
            setView('list');
            setExpandedItems({ [hashId]: true });
            pendingScroll.current = hashId;
        }
        setUrlReady(true);
    }, [media]);
    /* eslint-enable react-hooks/set-state-in-effect */

    useEffect(() => {
        if (!urlReady) return;
        const params = new URLSearchParams();
        if (category !== 'all') params.set('tab', category);
        if (sort !== 'rating') params.set('sort', sort);
        if (view !== 'shelf') params.set('view', view);
        if (tag) params.set('tag', tag);
        if (ratingFilter !== null) params.set('rating', String(ratingFilter));
        const qs = params.toString();
        window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`);
    }, [urlReady, category, sort, view, tag, ratingFilter]);

    useEffect(() => {
        const id = pendingScroll.current;
        if (!id || view !== 'list') return;
        pendingScroll.current = null;
        requestAnimationFrame(() => {
            document.getElementById(id)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
        });
    }, [view, expandedItems, reduceMotion]);

    const inCategory = useMemo(
        () => (category === 'all' ? media : media.filter((m) => m.kind === category)),
        [media, category]
    );
    const tags = useMemo(() => Array.from(new Set(inCategory.flatMap((m) => m.tags))).sort(), [inCategory]);
    const items = useMemo(
        () => inCategory
            .filter((m) => (!tag || m.tags.includes(tag)) && (ratingFilter === null || m.rating === ratingFilter))
            .sort(sorters[sort]),
        [inCategory, tag, ratingFilter, sort]
    );

    const stats = useMemo(() => {
        const counts = RATING_STEPS.map((step) => inCategory.filter((m) => m.rating === step).length);
        const avg = inCategory.reduce((sum, m) => sum + m.rating, 0) / Math.max(1, inCategory.length);
        return {
            total: inCategory.length,
            avg,
            perfect: inCategory.filter((m) => m.rating === 5).length,
            counts,
            max: Math.max(1, ...counts),
        };
    }, [inCategory]);

    const hasFilters = tag !== null || ratingFilter !== null;
    const clearFilters = () => { playClick(); setTag(null); setRatingFilter(null); };

    const setHash = (id: string | null) => {
        const { pathname, search } = window.location;
        window.history.replaceState(null, '', `${pathname}${search}${id ? `#${id}` : ''}`);
    };

    const toggle = (id: string) => {
        const opening = !expandedItems[id];
        if (opening) sfx.unfold(); else sfx.fold();
        setExpandedItems((prev) => ({ ...prev, [id]: opening }));
        if (opening) setHash(id);
        else if (window.location.hash === `#${id}`) setHash(null);
    };

    const openFromGrid = (id: string) => {
        sfx.pop();
        setView('list');
        setExpandedItems({ [id]: true });
        setHash(id);
        pendingScroll.current = id;
    };

    const changeCategory = (key: Category) => {
        sfx.press({ degree: CATEGORIES.findIndex((c) => c.key === key) });
        setCategory(key);
        setExpandedItems({});
        setHash(null);
        // drop the tag filter if the new tab doesn't have it
        const next = key === 'all' ? media : media.filter((m) => m.kind === key);
        if (tag && !next.some((m) => m.tags.includes(tag))) setTag(null);
    };

    const chipStyle = (active: boolean): React.CSSProperties => ({
        border: `1px solid ${active ? accent : chipBorder}`,
        background: active ? (isDark ? 'rgba(59, 130, 246, 0.14)' : 'rgba(37,99,235,0.08)') : chipBg,
        color: active ? accent : chipText,
        fontSize: '0.7rem',
        cursor: 'pointer',
        padding: '3px 10px',
        borderRadius: '9999px',
        fontWeight: 500,
        whiteSpace: 'nowrap',
        transition: 'background 0.2s, border-color 0.2s, color 0.2s',
    });

    const segmentStyle = (active: boolean): React.CSSProperties => ({
        background: active ? chipBg : 'transparent',
        border: 'none',
        borderRadius: '6px',
        padding: '3px 8px',
        fontSize: '0.7rem',
        fontWeight: active ? 600 : 400,
        color: active ? textPrimary : textSecondary,
        cursor: 'pointer',
        transition: 'background 0.2s, color 0.2s',
        display: 'inline-flex',
        alignItems: 'center',
    });

    const segmentGroup: React.CSSProperties = {
        display: 'inline-flex',
        gap: '2px',
        padding: '2px',
        borderRadius: '8px',
        border: `1px solid ${borderColor}`,
    };

    const statLabel: React.CSSProperties = { fontSize: '0.7rem', color: textSecondary, letterSpacing: '0.3px', textTransform: 'uppercase' };
    const statValue: React.CSSProperties = { fontSize: '1.5rem', fontWeight: 700, color: textPrimary, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 };

    const enter = (index: number) => ({
        initial: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: {
            delay: reduceMotion ? 0 : isInitialLoad ? startDelay + index * 0.07 : index * 0.04,
            duration: reduceMotion ? 0.15 : 0.35,
            ease: EASE,
        },
    });

    return (
        <div>
            {/* totals + how the ratings are spread out */}
            <div className={styles.summary} style={{
                padding: '16px 0 20px',
                marginBottom: '20px',
                borderBottom: `1px solid ${borderColor}`,
            }}>
                <div className={styles.stats}>
                    <div>
                        <div style={statValue}>{stats.total}</div>
                        <div style={statLabel}>Rated</div>
                    </div>
                    <div>
                        <div style={statValue}>{stats.avg.toFixed(1)}</div>
                        <div style={statLabel}>Average</div>
                    </div>
                    <div>
                        <div style={statValue}>{stats.perfect}</div>
                        <div style={statLabel}>Perfect 5s</div>
                    </div>
                </div>

                <div className={styles.histogram}>
                    <div className={styles.bars}>
                        {RATING_STEPS.map((step, i) => {
                            const count = stats.counts[i];
                            const active = ratingFilter === step;
                            const dimmed = ratingFilter !== null && !active;
                            return (
                                <button
                                    key={step}
                                    type="button"
                                    disabled={count === 0}
                                    onClick={() => { sfx.press({ degree: i }); setRatingFilter(active ? null : step); }}
                                    aria-pressed={active}
                                    aria-label={`${count} rated ${formatRating(step)}${active ? ', filtering' : ''}`}
                                    title={`${formatRating(step)} · ${count}`}
                                    className={styles.bar}
                                    style={{
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'flex-end',
                                        padding: 0,
                                        border: 'none',
                                        background: 'transparent',
                                        cursor: count === 0 ? 'default' : 'pointer',
                                    }}
                                >
                                    <motion.div
                                        initial={false}
                                        animate={{ height: `${count === 0 ? 4 : Math.max(9, (count / stats.max) * 100)}%`, opacity: dimmed ? 0.35 : 1 }}
                                        transition={{ duration: reduceMotion ? 0 : 0.35, ease: EASE }}
                                        style={{
                                            width: '100%',
                                            borderRadius: '2px',
                                            background: count === 0 ? borderColor : accent,
                                        }}
                                    />
                                </button>
                            );
                        })}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: textSecondary, marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
                        <span>0.5</span>
                        <span>5</span>
                    </div>
                </div>
            </div>

            {/* tabs, sort and view */}
            <div className={styles.toolbar} style={{ marginBottom: '14px', borderBottom: `1px solid ${borderColor}` }}>
                <div role="tablist" aria-label="Media type" className={styles.tabs}>
                    {CATEGORIES.map((cat) => {
                        const active = category === cat.key;
                        const count = cat.key === 'all' ? media.length : media.filter((m) => m.kind === cat.key).length;
                        return (
                            <motion.button
                                key={cat.key}
                                role="tab"
                                aria-selected={active}
                                onClick={() => changeCategory(cat.key)}
                                whileTap={PRESS}
                                className={styles.tab}
                                style={{
                                    position: 'relative',
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '0 0 12px',
                                    fontSize: '13px',
                                    fontWeight: active ? '600' : '400',
                                    color: active ? textPrimary : textSecondary,
                                    transition: 'color 0.2s',
                                    letterSpacing: '0.3px',
                                }}
                            >
                                {cat.label}
                                <span style={{ marginLeft: '6px', fontSize: '11px', color: textSecondary, fontVariantNumeric: 'tabular-nums' }}>{count}</span>
                                {active && (
                                    <motion.div
                                        layoutId="notes-tab-underline"
                                        transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                                        style={{ position: 'absolute', left: 0, right: 0, bottom: '-1px', height: '2px', background: accent, borderRadius: '2px' }}
                                    />
                                )}
                            </motion.button>
                        );
                    })}
                </div>

                <div className={styles.controls}>
                    <div role="group" aria-label="Sort by" className={styles.sortSegments} style={segmentGroup}>
                        {SORTS.map((s, i) => (
                            <button key={s.key} type="button" aria-pressed={sort === s.key} onClick={() => { sfx.press({ degree: i }); setSort(s.key); }} className={styles.segment} style={segmentStyle(sort === s.key)}>
                                {s.label}
                            </button>
                        ))}
                    </div>
                    {/* on small phones the sort buttons turn into a dropdown */}
                    <label className={styles.sortSelect} style={{ alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: textSecondary }}>
                        Sort
                        <select
                            value={sort}
                            onChange={(e) => { sfx.press({ degree: SORTS.findIndex((s) => s.key === e.target.value) }); setSort(e.target.value as SortKey); }}
                            className={styles.select}
                            style={{ color: textPrimary, backgroundColor: chipBg, border: `1px solid ${borderColor}` }}
                        >
                            {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                        </select>
                    </label>
                    <div role="group" aria-label="Layout" style={segmentGroup}>
                        <button type="button" aria-pressed={view === 'shelf'} aria-label="Shelf view" onClick={() => { sfx.press({ degree: 4 }); setView('shelf'); }} className={styles.segment} style={segmentStyle(view === 'shelf')}>
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2.5 2v7.5M5 3v6.5M7.5 2.5v7M10 4v5.5M1 10.75h10" /></svg>
                        </button>
                        <button type="button" aria-pressed={view === 'list'} aria-label="List view" onClick={() => { sfx.press({ degree: 5 }); setView('list'); }} className={styles.segment} style={segmentStyle(view === 'list')}>
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 3h8M2 6h8M2 9h8" /></svg>
                        </button>
                        <button type="button" aria-pressed={view === 'grid'} aria-label="Poster grid view" onClick={() => { sfx.press({ degree: 6 }); setView('grid'); }} className={styles.segment} style={segmentStyle(view === 'grid')}>
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1.5" y="1.5" width="3.5" height="3.5" rx="0.5" /><rect x="7" y="1.5" width="3.5" height="3.5" rx="0.5" /><rect x="1.5" y="7" width="3.5" height="3.5" rx="0.5" /><rect x="7" y="7" width="3.5" height="3.5" rx="0.5" /></svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* tag filters */}
            <div className={styles.tags} style={{ marginBottom: '24px' }}>
                {tags.map((t, i) => (
                    <button key={t} type="button" aria-pressed={tag === t} onClick={() => { sfx.press({ degree: i }); setTag(tag === t ? null : t); }} className={styles.chip} style={chipStyle(tag === t)}>
                        {t}
                    </button>
                ))}
                {hasFilters && (
                    <button type="button" onClick={clearFilters} className={styles.chip} style={{ ...chipStyle(false), background: 'transparent', borderColor: 'transparent', color: textSecondary }}>
                        Clear filters ×
                    </button>
                )}
            </div>

            {items.length === 0 ? (
                <p style={{ fontSize: '0.875rem', color: textSecondary, padding: '24px 0' }}>
                    Nothing matches these filters yet.{' '}
                    <button type="button" onClick={clearFilters} style={{ background: 'none', border: 'none', padding: 0, color: accent, cursor: 'pointer', fontSize: 'inherit' }}>
                        Clear filters
                    </button>
                </p>
            ) : view === 'shelf' ? (
                <Shelf
                    key={`shelf-${category}`}
                    media={items}
                    isDark={isDark}
                    entranceDelay={(i) => (isInitialLoad ? startDelay + i * 0.05 : i * 0.03)}
                />
            ) : view === 'grid' ? (
                <motion.div
                    key={`grid-${category}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className={styles.grid}
                >
                    {items.map((item, index) => (
                        <motion.button
                            key={item.id}
                            type="button"
                            layout={!reduceMotion}
                            {...enter(index)}
                            whileHover={reduceMotion ? undefined : { y: -3 }}
                            onClick={() => openFromGrid(item.id)}
                            aria-label={`${item.title}, ${item.year}. Rated ${formatRating(item.rating)} out of 5. Open details`}
                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px' }}
                        >
                            <div style={{
                                width: '100%',
                                aspectRatio: '2 / 3',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                position: 'relative',
                                boxShadow: isDark ? '0 4px 14px rgba(0,0,0,0.5)' : '0 4px 12px rgba(0,0,0,0.12)',
                            }}>
                                <Image src={item.poster} alt="" fill sizes="(max-width: 480px) 46vw, (max-width: 640px) 30vw, 160px" style={{ objectFit: 'cover' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isDark ? '#f5f5f5' : '#1c1917', lineHeight: 1.25 }}>{item.title}</span>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                    <span style={{ fontSize: '0.75rem', color: textSecondary, fontVariantNumeric: 'tabular-nums' }}>{item.year}</span>
                                    <RatingDots rating={item.rating} accent={accent} isDark={isDark} size={6} />
                                </div>
                            </div>
                        </motion.button>
                    ))}
                </motion.div>
            ) : (
                <motion.div
                    key={`list-${category}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
                >
                    {items.map((item, index) => {
                        const isExpanded = !!expandedItems[item.id];
                        const panelId = `notes-panel-${item.id}`;

                        return (
                            <motion.div
                                key={item.id}
                                id={item.id}
                                layout={reduceMotion ? false : 'position'}
                                {...enter(index)}
                                style={{ display: 'flex', flexDirection: 'column', gap: '2px', scrollMarginTop: '96px' }}
                            >
                                <div className={styles.rowHeader}>
                                    <div className={styles.rowMain}>
                                        <div style={{
                                            width: '36px',
                                            height: '50px',
                                            borderRadius: '6px',
                                            overflow: 'hidden',
                                            position: 'relative',
                                            flexShrink: 0,
                                            boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.5)' : '0 2px 6px rgba(0,0,0,0.12)',
                                        }}>
                                            <Image src={item.poster} alt={`${item.title} poster`} fill sizes="36px" style={{ objectFit: 'cover' }} />
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                            <h3 style={{
                                                fontSize: '1rem',
                                                fontWeight: '600',
                                                marginBottom: '0px',
                                                color: isDark ? '#f5f5f5' : '#1c1917',
                                                overflowWrap: 'anywhere',
                                            }}>
                                                {item.title}
                                            </h3>
                                            <p style={{ fontSize: '0.875rem', color: textSecondary, margin: 0, fontVariantNumeric: 'tabular-nums' }}>
                                                {item.year}
                                                {item.kind === 'tv' && category === 'all' && ' · Series'}
                                            </p>
                                            {item.verdict && (
                                                <p style={{ fontSize: '0.85rem', color: isDark ? '#c8c8c8' : '#4b5563', margin: '6px 0 0', lineHeight: 1.5 }}>
                                                    {item.verdict}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span aria-hidden style={{ fontSize: '0.75rem', fontWeight: 600, color: textPrimary, fontVariantNumeric: 'tabular-nums' }}>
                                                {formatRating(item.rating)}
                                            </span>
                                            <RatingDots rating={item.rating} accent={accent} isDark={isDark} />
                                        </div>
                                        <motion.button
                                            onClick={() => toggle(item.id)}
                                            aria-expanded={isExpanded}
                                            aria-controls={panelId}
                                            animate={{
                                                backgroundColor: chipBg,
                                                color: chipText,
                                                borderColor: chipBorder,
                                            }}
                                            whileHover={{
                                                scale: 1.05,
                                                backgroundColor: isDark ? 'rgba(40, 40, 40, 0.95)' : '#d1d5db',
                                            }}
                                            whileTap={PRESS}
                                            className={styles.expandBtn}
                                            style={{
                                                border: `1px solid ${chipBorder}`,
                                                background: chipBg,
                                                color: chipText,
                                                fontSize: '0.7rem',
                                                cursor: 'pointer',
                                                padding: '3px 8px',
                                                borderRadius: '9999px',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                fontWeight: '500',
                                            }}
                                        >
                                            {isExpanded ? 'Show less' : item.review ? 'My thoughts' : 'Details'}
                                            <motion.svg
                                                width="12" height="12" viewBox="0 0 12 12"
                                                fill="none" stroke="currentColor" strokeWidth="1.5"
                                                strokeLinecap="round" strokeLinejoin="round"
                                                animate={{ rotate: isExpanded ? 180 : 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <path d="M2 4l4 4 4-4" />
                                            </motion.svg>
                                        </motion.button>
                                    </div>
                                </div>

                                <AnimatePresence initial={false}>
                                    {isExpanded && (
                                        <motion.div
                                            id={panelId}
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1, transition: { duration: reduceMotion ? 0 : DURATION.panel, ease: EASE_OUT } }}
                                            exit={{ height: 0, opacity: 0, transition: { duration: reduceMotion ? 0 : exitFor(DURATION.panel), ease: EASE_OUT } }}
                                            style={{ overflow: 'hidden' }}
                                        >
                                            <div className={styles.panel} style={{ paddingTop: '10px', paddingBottom: '4px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {item.review && (
                                                    <p style={{
                                                        fontSize: '0.875rem',
                                                        lineHeight: 1.65,
                                                        color: isDark ? '#c8c8c8' : '#4b5563',
                                                        margin: 0,
                                                        maxWidth: '62ch',
                                                        whiteSpace: 'pre-line',
                                                    }}>
                                                        {item.review}
                                                    </p>
                                                )}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px 12px', flexWrap: 'wrap', fontSize: '0.75rem', color: textSecondary }}>
                                                    {item.watched && <span>Watched {formatWatched(item.watched)}</span>}
                                                    <span style={{ display: 'inline-flex', gap: '6px', flexWrap: 'wrap' }}>
                                                        {item.tags.map((t) => (
                                                            <button
                                                                key={t}
                                                                type="button"
                                                                onClick={() => { playClick(); setTag(t); }}
                                                                className={styles.inlineChip}
                                                                style={{ ...chipStyle(tag === t), padding: '1px 8px', fontSize: '0.68rem' }}
                                                            >
                                                                {t}
                                                            </button>
                                                        ))}
                                                    </span>
                                                    {item.letterboxdUrl && (
                                                        <a
                                                            href={item.letterboxdUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={{ color: accent, textDecoration: 'none', fontWeight: 500 }}
                                                        >
                                                            Letterboxd ↗
                                                        </a>
                                                    )}
                                                    {item.imdbUrl && (
                                                        <a
                                                            href={item.imdbUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={{ color: accent, textDecoration: 'none', fontWeight: 500 }}
                                                        >
                                                            IMDb ↗
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {index < items.length - 1 && (
                                    <div style={{ height: '1px', backgroundColor: borderColor, marginTop: '14px' }} />
                                )}
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}
        </div>
    );
};

export default function NotesClient({ media, letterboxdProfile }: { media: MediaEntry[]; letterboxdProfile: string }) {
    const { isDark } = useTheme();

    return (
        <div className="container mx-auto px-4 py-24 max-w-2xl">
            <header style={{ marginBottom: '48px' }}>
                <motion.h1
                    className="hero-title font-bold text-gray-900 dark:text-white tracking-tight leading-none text-left"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
                >
                    Notes
                </motion.h1>
                <motion.p
                    className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-xl text-left"
                    style={{ marginTop: '16px', marginBottom: '0' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.35, duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                >
                    Films and TV are a big part of my personal life. This is a collection of random thoughts & ratings on movies, shows, and other media
                </motion.p>
            </header>

            <motion.section
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                    <a
                        href={letterboxdProfile}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: '0.75rem', fontWeight: 500, color: isDark ? '#6e6e6e' : '#6b7280', textDecoration: 'none' }}
                    >
                        Letterboxd ↗
                    </a>
                </div>
                <MediaCollection media={media} isDark={isDark} startDelay={1.6} />
            </motion.section>

            <div className="footer-spacer" />
        </div>
    );
}
