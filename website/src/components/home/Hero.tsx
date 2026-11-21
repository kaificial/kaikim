"use client";

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import HeroPhotoStack from '../HeroPhotoStack';
import { useTheme } from '../ThemeContext';
import { rt, revealSequence } from './TextReveal';
import { LiveAge } from './LiveAge';
import { LocationPill } from './LocationPill';
import { POP, mouseOnly } from '../../styles/motion';
import { cssVar } from '../../styles/palette';
import { sfx } from '../../lib/sfx';
import { PixelHover } from '../PixelHover';

const EASE = [0.22, 1, 0.36, 1] as const;

/** touch screens can't hover, so a tap toggles the popover instead */
const onTap = (toggle: () => void) => (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') return;
    sfx.pop({ x: e.clientX });
    toggle();
};

const posterGridClass = 'absolute bottom-full mb-3 z-50 pointer-events-none rounded-[16px] overflow-hidden shadow-2xl border border-black/10 dark:border-white/10 grid gap-0 left-1/2 lg:-translate-x-1/2 lg:origin-bottom w-[85vw] max-w-[320px] h-[28vw] max-h-[120px]';

const MOVIES = ['/assets/interstellar.jpg', '/assets/arrival.jpg', '/assets/eternal.jpg', '/assets/lala.jpg'];
const SHOWS = ['/music/Barry.jpg', '/assets/severance.jpg', '/assets/bb.jpg', '/assets/invincible.jpg'];

// resized copy, the originals are huge
const posterSrc = (src: string) => `/_next/image?url=${encodeURIComponent(src)}&w=256&q=75`;

// load each set once so they show together
const preloaded = new Map<string, Promise<void>>();
const keep: HTMLImageElement[] = [];
const preloadPosters = (posters: string[]) => {
    const key = posters.join('|');
    let p = preloaded.get(key);
    if (!p) {
        p = Promise.all(posters.map((src) => {
            const img = new Image();
            img.src = posterSrc(src);
            keep.push(img);
            return img.decode().catch(() => {});
        })).then(() => {});
        preloaded.set(key, p);
    }
    return p;
};

const Poster = ({ src }: { src: string }) => (
    <div style={{ backgroundImage: `url(${posterSrc(src)})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
);

/** underlined word that shows a strip of posters on hover */
const PosterHover = ({ id, word, slot, posters, shiftClass, originClass, hovered, setHovered }: {
    id: string;
    word: string;
    slot: number;
    posters: string[];
    shiftClass: string;
    /** where the word sits in the shifted popover, so it grows out of the word */
    originClass: string;
    hovered: string | null;
    setHovered: (id: string | null) => void;
}) => {
    // wait until all posters are loaded
    const [ready, setReady] = useState(false);
    const load = () => { if (!ready) preloadPosters(posters).then(() => setReady(true)); };

    return (
    <span
        className="ul-host relative inline-block cursor-pointer"
        onPointerEnter={mouseOnly(() => { load(); setHovered(id); })}
        onPointerLeave={mouseOnly(() => setHovered(null))}
        onPointerUp={onTap(() => { load(); setHovered(hovered === id ? null : id); })}
    >
        {rt(<PixelHover className="ul-link">{word}</PixelHover>, slot)}
        <AnimatePresence>
            {hovered === id && ready && (
                <motion.div {...POP} className={`${posterGridClass} ${shiftClass} ${originClass}`} style={{ gridTemplateColumns: `repeat(${posters.length}, 1fr)` }}>
                    {posters.map((p) => <Poster key={p} src={p} />)}
                </motion.div>
            )}
        </AnimatePresence>
    </span>
    );
};

export const Hero = () => {
    const { isDark } = useTheme();
    const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);

    // preload posters when the page is idle
    useEffect(() => {
        const run = () => { preloadPosters(MOVIES); preloadPosters(SHOWS); };
        if ('requestIdleCallback' in window) {
            const id = requestIdleCallback(run, { timeout: 2000 });
            return () => cancelIdleCallback(id);
        }
        const t = setTimeout(run, 1000);
        return () => clearTimeout(t);
    }, []);
    // about text reveals after the name
    const para = revealSequence(13);

    return (
        <section className="hero-section" style={{ position: 'relative', zIndex: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="hero-layout">

                    {/* name, school and location */}
                    <div className="hero-content" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, minWidth: 0 }}>
                        <motion.h1
                            className="hero-title font-bold text-gray-900 dark:text-white tracking-tight leading-none text-left"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2, duration: 1.6, ease: EASE }}
                            style={{ marginBottom: '4px', marginTop: 0 }}
                        >
                            {rt('Kai Kim', 0, 'text-reveal-hero')}
                        </motion.h1>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.2, duration: 1.4, ease: EASE }}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}
                        >
                            <span className="text-gray-900 dark:text-gray-100 m-0" style={{ fontSize: '1.1rem' }}>
                                {rt("CS @ Queen's University", 1)}
                            </span>
                            <LocationPill />
                        </motion.div>
                    </div>

                    {/* photo */}
                    <motion.div
                        style={{ position: 'relative', flexShrink: 0 }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8, duration: 1.4, ease: EASE }}
                    >
                        <HeroPhotoStack isDark={isDark} />
                    </motion.div>
                </div>

                {/* about */}
                <div
                    className="text-base sm:text-lg text-gray-800 dark:text-gray-300 text-left"
                    style={{ marginTop: '4px', marginBottom: '12px', width: '100%', lineHeight: 1.6 }}
                >
                    {para.rt("I'm a ")}
                    {para.rt(<span style={{ color: cssVar.textSoft, paddingRight: '4px' }}><LiveAge /> y/o</span>)}
                    {para.rt("who loves building reliable software and exploring new technologies. When I'm not building, you can find me watching")}{' '}
                    <PosterHover
                        id="films"
                        word="movies"
                        slot={para.next()}
                        shiftClass="-translate-x-[85%]"
                        originClass="origin-[85%_100%]"
                        posters={MOVIES}
                        hovered={hoveredIcon}
                        setHovered={setHoveredIcon}
                    />
                    {para.rt(',')}{' '}
                    <PosterHover
                        id="shows"
                        word="shows"
                        slot={para.next()}
                        shiftClass="-translate-x-[90%]"
                        originClass="origin-[90%_100%]"
                        posters={SHOWS}
                        hovered={hoveredIcon}
                        setHovered={setHoveredIcon}
                    />
                    {para.rt(', discovering new music, or playing racket sports.')}
                </div>
            </div>
        </section>
    );
};
