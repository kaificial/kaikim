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
import { DURATION, EASE_OUT, exitFor, HOVER_CARD, PRESS } from '../../styles/motion';

type Category = 'all' | MediaKind;
type ViewMode = 'shelf' | 'list' | 'grid';

const CATEGORIES: { key: Category; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'movie', label: 'Movies' },
    { key: 'tv', label: 'Shows' },
];
const VIEWS: { key: ViewMode; label: string; icon: React.ReactNode }[] = [
    { key: 'shelf', label: 'Shelf view', icon: <path d="M2.5 2v7.5M5 3v6.5M7.5 2.5v7M10 4v5.5M1 10.75h10" /> },
    { key: 'list', label: 'List view', icon: <path d="M2 3h8M2 6h8M2 9h8" /> },
    { key: 'grid', label: 'Poster grid view', icon: <><rect x="1.5" y="1.5" width="3.5" height="3.5" rx="0.5" /><rect x="7" y="1.5" width="3.5" height="3.5" rx="0.5" /><rect x="1.5" y="7" width="3.5" height="3.5" rx="0.5" /><rect x="7" y="7" width="3.5" height="3.5" rx="0.5" /></> },
];
const EASE = [0.22, 1, 0.36, 1] as const;

const formatRating = (r: number) => (Number.isInteger(r) ? `${r}` : r.toFixed(1));
const formatWatched = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString('en-CA', { month: 'short', year: 'numeric' });

const byRating = (a: MediaEntry, b: MediaEntry) => b.rating - a.rating || b.year - a.year;

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
    const [view, setView] = useState<ViewMode>('shelf');
    const [query, setQuery] = useState('');
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
    const fieldBg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
    const activeBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

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
        const v = params.get('view');
        if (v === 'list' || v === 'grid') setView(v);

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
        if (view !== 'shelf') params.set('view', view);
        const qs = params.toString();
        window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`);
    }, [urlReady, category, view]);

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
    const items = useMemo(() => {
        const q = query.trim().toLowerCase();
        return inCategory
            .filter((m) => !q || m.title.toLowerCase().includes(q))
            .sort(byRating);
    }, [inCategory, query]);

    const hasFilters = query.trim() !== '';
    const clearFilters = () => { playClick(); setQuery(''); };

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
    };

    const fieldStyle: React.CSSProperties = {
        color: textPrimary,
        backgroundColor: fieldBg,
        border: `1px solid ${borderColor}`,
    };

    const linkBtn: React.CSSProperties = {
        background: 'none', border: 'none', padding: 0, color: accent, cursor: 'pointer', fontSize: 'inherit', fontFamily: 'inherit',
    };

    const viewBtn = (active: boolean): React.CSSProperties => ({
        background: active ? activeBg : 'transparent',
        border: 'none',
        borderRadius: '6px',
        width: '28px',
        height: '28px',
        color: active ? textPrimary : textSecondary,
        cursor: 'pointer',
        transition: 'background 0.2s var(--ease-out), color 0.2s var(--ease-out), transform 0.16s var(--ease-out)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
    });

    const enter = (index: number) => ({
        initial: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        transition: {
            delay: reduceMotion ? 0 : isInitialLoad ? startDelay + index * 0.05 : index * 0.03,
            duration: reduceMotion ? 0.15 : 0.3,
            ease: EASE,
        },
    });

    return (
        <div>
            {/* type tabs on the left, layout on the right */}
            <div className={styles.toolbar} style={{ marginBottom: '16px' }}>
                <div role="tablist" aria-label="Media type" className={styles.tabs}>
                    {CATEGORIES.map((cat) => {
                        const active = category === cat.key;
                        const count = cat.key === 'all' ? media.length : media.filter((m) => m.kind === cat.key).length;
                        return (
                            <button
                                key={cat.key}
                                role="tab"
                                type="button"
                                aria-selected={active}
                                onClick={() => changeCategory(cat.key)}
                                className={`${styles.tab} press`}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: 0,
                                    fontSize: '0.875rem',
                                    fontWeight: active ? 600 : 400,
                                    color: active ? textPrimary : textSecondary,
                                    transition: 'color 0.2s var(--ease-out), transform 0.16s var(--ease-out)',
                                }}
                            >
                                {cat.label}
                                <span style={{ marginLeft: '5px', fontSize: '0.75rem', color: textSecondary, fontVariantNumeric: 'tabular-nums' }}>{count}</span>
                            </button>
                        );
                    })}
                </div>

                <div role="group" aria-label="Layout" style={{ display: 'inline-flex', gap: '2px' }}>
                    {VIEWS.map((v, i) => (
                        <button
                            key={v.key}
                            type="button"
                            aria-pressed={view === v.key}
                            aria-label={v.label}
                            title={v.label}
                            onClick={() => { sfx.press({ degree: 4 + i }); setView(v.key); }}
                            className={`${styles.viewBtn} press`}
                            style={viewBtn(view === v.key)}
                        >
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">{v.icon}</svg>
                        </button>
                    ))}
                </div>
            </div>

            {/* search */}
            <div className={styles.filters} style={{ marginBottom: '28px' }}>
                <label className={styles.search} style={{ ...fieldStyle, display: 'flex', alignItems: 'center', gap: '8px', padding: '0 10px', borderRadius: '8px' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={textSecondary} strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
                    <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search titles"
                        aria-label="Search titles"
                        style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', color: textPrimary, font: 'inherit', fontSize: '0.8125rem', minHeight: '32px' }}
                    />
                </label>
            </div>

            {hasFilters && items.length > 0 && (
                <p style={{ fontSize: '0.75rem', color: textSecondary, margin: '-16px 0 20px' }}>
                    {items.length} {items.length === 1 ? 'result' : 'results'} ·{' '}
                    <button type="button" onClick={clearFilters} style={linkBtn}>Clear</button>
                </p>
            )}

            {items.length === 0 ? (
                <p style={{ fontSize: '0.875rem', color: textSecondary, padding: '24px 0' }}>
                    Nothing matches.{' '}
                    <button type="button" onClick={clearFilters} style={linkBtn}>Clear filters</button>
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
                            whileHover={reduceMotion ? undefined : HOVER_CARD}
                            whileTap={PRESS}
                            onClick={() => openFromGrid(item.id)}
                            aria-label={`${item.title}, ${item.year}. Rated ${formatRating(item.rating)} out of 5. Open details`}
                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px' }}
                        >
                            <div style={{
                                width: '100%',
                                aspectRatio: '2 / 3',
                                borderRadius: '6px',
                                overflow: 'hidden',
                                position: 'relative',
                                border: `1px solid ${borderColor}`,
                            }}>
                                <Image src={item.poster} alt="" fill sizes="(max-width: 480px) 46vw, (max-width: 640px) 30vw, 160px" style={{ objectFit: 'cover' }} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px' }}>
                                <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: textPrimary, lineHeight: 1.3 }}>{item.title}</span>
                                <span style={{ fontSize: '0.75rem', color: textSecondary, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{formatRating(item.rating)}</span>
                            </div>
                        </motion.button>
                    ))}
                </motion.div>
            ) : (
                <motion.ul
                    key={`list-${category}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    style={{ listStyle: 'none', margin: 0, padding: 0, borderTop: `1px solid ${borderColor}` }}
                >
                    {items.map((item, index) => {
                        const isExpanded = !!expandedItems[item.id];
                        const panelId = `notes-panel-${item.id}`;

                        return (
                            <motion.li
                                key={item.id}
                                id={item.id}
                                layout={reduceMotion ? false : 'position'}
                                {...enter(index)}
                                style={{ borderBottom: `1px solid ${borderColor}`, scrollMarginTop: '96px' }}
                            >
                                {/* the whole row opens the note */}
                                <button
                                    type="button"
                                    onClick={() => toggle(item.id)}
                                    aria-expanded={isExpanded}
                                    aria-controls={panelId}
                                    className={`${styles.row} press-soft`}
                                    style={{
                                        // 8px past the list edges so the hover tint has some room
                                        width: 'calc(100% + 16px)',
                                        margin: '0 -8px',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '12px 8px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        font: 'inherit',
                                        color: 'inherit',
                                    }}
                                >
                                    <div style={{ width: '28px', height: '40px', borderRadius: '4px', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                                        <Image src={item.poster} alt="" fill sizes="28px" style={{ objectFit: 'cover' }} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '0.9375rem', fontWeight: 500, color: textPrimary, overflowWrap: 'anywhere' }}>{item.title}</div>
                                        <div style={{ fontSize: '0.75rem', color: textSecondary, fontVariantNumeric: 'tabular-nums' }}>
                                            {item.year}
                                            {item.kind === 'tv' && category === 'all' && ' · Series'}
                                        </div>
                                    </div>
                                    <RatingDots rating={item.rating} accent={accent} isDark={isDark} size={7} />
                                    <motion.svg
                                        width="12" height="12" viewBox="0 0 12 12"
                                        fill="none" stroke={textSecondary} strokeWidth="1.5"
                                        strokeLinecap="round" strokeLinejoin="round"
                                        animate={{ rotate: isExpanded ? 180 : 0 }}
                                        transition={{ duration: 0.2 }}
                                        aria-hidden="true"
                                        style={{ flexShrink: 0 }}
                                    >
                                        <path d="M2 4l4 4 4-4" />
                                    </motion.svg>
                                </button>

                                <AnimatePresence initial={false}>
                                    {isExpanded && (
                                        <motion.div
                                            id={panelId}
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1, transition: { duration: reduceMotion ? 0 : DURATION.panel, ease: EASE_OUT } }}
                                            exit={{ height: 0, opacity: 0, transition: { duration: reduceMotion ? 0 : exitFor(DURATION.panel), ease: EASE_OUT } }}
                                            style={{ overflow: 'hidden' }}
                                        >
                                            <div className={styles.panel} style={{ paddingBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {item.verdict && (
                                                    <p style={{ fontSize: '0.875rem', fontWeight: 500, color: textPrimary, margin: 0, lineHeight: 1.5 }}>
                                                        {item.verdict}
                                                    </p>
                                                )}
                                                {item.review && (
                                                    <p style={{ fontSize: '0.875rem', lineHeight: 1.65, color: isDark ? '#c8c8c8' : '#4b5563', margin: 0, maxWidth: '62ch', whiteSpace: 'pre-line' }}>
                                                        {item.review}
                                                    </p>
                                                )}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px 12px', flexWrap: 'wrap', fontSize: '0.75rem', color: textSecondary }}>
                                                    <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatRating(item.rating)} / 5</span>
                                                    {item.watched && <span>Watched {formatWatched(item.watched)}</span>}
                                                    {item.letterboxdUrl && (
                                                        <a href={item.letterboxdUrl} target="_blank" rel="noopener noreferrer" style={{ color: accent, textDecoration: 'none' }}>
                                                            Letterboxd ↗
                                                        </a>
                                                    )}
                                                    {item.imdbUrl && (
                                                        <a href={item.imdbUrl} target="_blank" rel="noopener noreferrer" style={{ color: accent, textDecoration: 'none' }}>
                                                            IMDb ↗
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.li>
                        );
                    })}
                </motion.ul>
            )}
        </div>
    );
};

export default function NotesClient({ media, letterboxdProfile }: { media: MediaEntry[]; letterboxdProfile: string }) {
    const { isDark } = useTheme();

    return (
        <div className="container mx-auto px-4 py-24 max-w-2xl">
            <header style={{ marginBottom: '40px' }}>
                <motion.h1
                    className="hero-title font-bold text-gray-900 dark:text-white tracking-tight leading-none text-left"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
                >
                    Notes
                </motion.h1>
                <motion.p
                    className="text-base text-gray-600 dark:text-gray-400 max-w-xl text-left"
                    style={{ marginTop: '16px', marginBottom: '0' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.35, duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                >
                    Thoughts and ratings on films and shows.{' '}
                    <a
                        href={letterboxdProfile}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: isDark ? '#8f8f8f' : '#6b7280', textDecoration: 'underline', textUnderlineOffset: '3px' }}
                    >
                        Letterboxd ↗
                    </a>
                </motion.p>
            </header>

            <motion.section
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
                <MediaCollection media={media} isDark={isDark} startDelay={1.6} />
            </motion.section>

            <div className="footer-spacer" />
        </div>
    );
}
