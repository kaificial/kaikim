"use client";

import Image from 'next/image';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import HeroPhotoStack from '../HeroPhotoStack';
import { useTheme } from '../ThemeContext';
import { cssVar } from '../../styles/palette';
import { rt } from './TextReveal';
import { LiveAge } from './LiveAge';
import { POP, PRESS, mouseOnly } from '../../styles/motion';
import { sfx } from '../../lib/sfx';

const EASE = [0.22, 1, 0.36, 1] as const;

/** touch screens can't hover, so a tap toggles the popover instead */
const onTap = (toggle: () => void) => (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') return;
    sfx.pop({ x: e.clientX });
    toggle();
};

const posterGridClass = 'absolute bottom-full mb-3 z-50 pointer-events-none rounded-[16px] overflow-hidden shadow-2xl border border-black/10 dark:border-white/10 grid grid-cols-4 gap-0 left-1/2 lg:-translate-x-1/2 lg:origin-bottom w-[85vw] max-w-[320px] h-[28vw] max-h-[120px]';

const Poster = ({ src }: { src: string }) => (
    <div style={{ backgroundImage: `url(${src})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
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
}) => (
    <span
        className="relative inline-block cursor-pointer"
        onPointerEnter={mouseOnly(() => setHovered(id))}
        onPointerLeave={mouseOnly(() => setHovered(null))}
        onPointerUp={onTap(() => setHovered(hovered === id ? null : id))}
        style={{ textUnderlineOffset: '4px' }}
    >
        {rt(<span style={{ textDecoration: 'underline' }}>{word}</span>, slot)}
        <AnimatePresence>
            {hovered === id && (
                <motion.div {...POP} className={`${posterGridClass} ${shiftClass} ${originClass}`}>
                    {posters.map((p) => <Poster key={p} src={p} />)}
                </motion.div>
            )}
        </AnimatePresence>
    </span>
);

export const Hero = () => {
    const { isDark } = useTheme();
    const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);
    const [isTorontoHovered, setIsTorontoHovered] = useState(false);

    return (
        <section className="hero-section" style={{ position: 'relative', zIndex: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="hero-layout">

                    {/* text */}
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
                            <span className="text-gray-900 dark:text-gray-100 font-medium m-0" style={{ fontSize: '1.1rem' }}>
                                {rt("CS @ Queen's University", 1)}
                            </span>
                            <motion.div
                                className="location-pill"
                                whileHover={{ scale: 1.05 }}
                                whileTap={PRESS}
                                style={{ position: 'relative', cursor: 'pointer', padding: '2px 8px', fontSize: '0.75rem', opacity: 0.8 }}
                                onPointerEnter={mouseOnly(() => setIsTorontoHovered(true))}
                                onPointerLeave={mouseOnly(() => setIsTorontoHovered(false))}
                                onPointerUp={onTap(() => setIsTorontoHovered((v) => !v))}
                            >
                                <AnimatePresence>
                                    {isTorontoHovered && (
                                        <motion.div
                                            {...POP}
                                            style={{
                                                transformOrigin: '16px 100%',
                                                position: 'absolute',
                                                bottom: '120%',
                                                left: '40px',
                                                transform: 'translateX(-50%)',
                                                width: '180px',
                                                height: '110px',
                                                borderRadius: '12px',
                                                overflow: 'hidden',
                                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                                border: `1px solid ${cssVar.hairline}`,
                                                zIndex: 50,
                                                pointerEvents: 'none',
                                                background: isDark ? '#181818' : 'white'
                                            }}
                                        >
                                            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                                <Image
                                                    src="/assets/toto.png"
                                                    alt="Toronto Skyline"
                                                    fill
                                                    sizes="180px"
                                                    style={{ objectFit: 'cover' }}
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '10px', height: '10px', opacity: 0.8 }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {rt('Toronto, ON', 2)}
                            </motion.div>

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


                {/* paragraph */}
                <div>
                    <motion.div
                        className="text-base sm:text-lg text-gray-800 dark:text-gray-300 text-left"
                        style={{ marginBottom: '12px', width: '100%', lineHeight: 1.6 }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.35, duration: 1.4, ease: EASE }}
                    >
                        {rt("I'm a ", 3)}
                        {rt(<span style={{ color: cssVar.textSoft, paddingRight: '4px' }}><LiveAge /> y/o</span>, 3.1)}
                        {rt("who loves building reliable software and exploring new technologies. When I'm not coding, you can find me watching ", 3.2)}{' '}
                        <PosterHover
                            id="films"
                            word="movies"
                            slot={4.2}
                            shiftClass="-translate-x-[85%]"
                            originClass="origin-[85%_100%]"
                            posters={['/music/Interstellar.jpg', '/music/Drive.jpg', '/music/Arrival.jpg', '/music/lalaland.jpg']}
                            hovered={hoveredIcon}
                            setHovered={setHoveredIcon}
                        />
                        {rt(",", 4.25)}
                        <PosterHover
                            id="shows"
                            word="shows"
                            slot={4.3}
                            shiftClass="-translate-x-[90%]"
                            originClass="origin-[90%_100%]"
                            posters={['/music/Barry.jpg', '/music/Severance.jpg', '/music/Breaking\\ Bad.jpg', '/music/media/Invincible.jpg']}
                            hovered={hoveredIcon}
                            setHovered={setHoveredIcon}
                        />
                        {rt(', discovering new music, or playing racket sports.', 4)}
                    </motion.div>
                </div>
            </div>
        </section>
    );
};
