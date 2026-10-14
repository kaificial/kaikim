"use client";

import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUISound } from '../hooks/use-ui-sound';

interface ProjectVideoProps {
    src: string;
    style?: React.CSSProperties;
    className?: string;
    resetTime?: number;
    startTime?: number;
    endTime?: number;
    iconColor?: 'white' | 'black' | 'glass';
    /** Loop the reel automatically whenever it is on screen. */
    autoLoop?: boolean;
    /** Thin progress line along the bottom edge. */
    showProgress?: boolean;
}

export const ProjectVideo = ({
    src,
    style,
    className,
    resetTime = 0,
    startTime = 0,
    endTime,
    iconColor = 'glass',
    autoLoop = false,
    showProgress = false,
}: ProjectVideoProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    // Set when the viewer clicks to pause, so auto-loop won't restart it.
    const pausedByUserRef = useRef(false);
    const wasPlayingRef = useRef(false);
    const { playClick } = useUISound();

    const play = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;
        video.play().then(() => setIsPlaying(true)).catch(() => { });
    }, []);

    // Only play while on screen: keeps the reels looping without pulling
    // every video down at once.
    useEffect(() => {
        const container = containerRef.current;
        const video = videoRef.current;
        if (!container || !video) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    if (autoLoop) {
                        if (!pausedByUserRef.current) play();
                    } else if (wasPlayingRef.current) {
                        wasPlayingRef.current = false;
                        play();
                    }
                } else if (!video.paused) {
                    wasPlayingRef.current = true;
                    video.pause();
                    setIsPlaying(false);
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(container);
        return () => observer.disconnect();
    }, [autoLoop, play]);

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        playClick();

        const video = videoRef.current;
        if (!video) return;

        if (video.paused) {
            pausedByUserRef.current = false;
            wasPlayingRef.current = false;
            play();
        } else {
            pausedByUserRef.current = true;
            wasPlayingRef.current = false;
            video.pause();
            if (!autoLoop) video.currentTime = startTime || resetTime;
            setIsPlaying(false);
        }
    };

    const iconFill = iconColor === 'black' ? 'black' : 'white';

    return (
        <div
            ref={containerRef}
            className={`relative w-full h-full cursor-pointer overflow-hidden bg-black flex items-center justify-center ${className || ''}`}
            onClick={handleClick}
            style={style}
        >
            <video
                ref={videoRef}
                src={src + (startTime ? `#t=${startTime}` : '')}
                loop={!endTime}
                muted
                playsInline
                preload="metadata"
                className="w-full h-full object-cover pointer-events-none"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={(e) => {
                    const video = e.currentTarget;

                    if (showProgress && video.duration) {
                        const from = startTime;
                        const to = endTime ?? video.duration;
                        setProgress(Math.min(100, Math.max(0, ((video.currentTime - from) / (to - from)) * 100)));
                    }

                    // Native loop restarts at 0, so trimmed reels rewind by hand.
                    if (endTime && video.currentTime >= endTime) {
                        video.currentTime = startTime;
                        play();
                    } else if (startTime && video.duration && video.currentTime >= video.duration - 0.3) {
                        video.currentTime = startTime;
                        play();
                    }
                }}
            />

            {/* Bare play glyph — no badge behind it */}
            <AnimatePresence>
                {!isPlaying && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                        transition={{ duration: 0.18 }}
                        className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
                    >
                        <svg
                            width="54"
                            height="54"
                            viewBox="0 0 24 24"
                            fill={iconFill}
                            strokeWidth="0"
                            style={{ filter: 'drop-shadow(0 2px 10px rgba(0, 0, 0, 0.65))' }}
                        >
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </motion.div>
                )}
            </AnimatePresence>

            {showProgress && (
                <div className="absolute bottom-0 left-0 right-0 z-20 h-[3px] bg-white/10 pointer-events-none">
                    <div
                        className="h-full bg-[#2563eb]"
                        style={{ width: `${progress}%`, transition: 'width 0.15s linear' }}
                    />
                </div>
            )}
        </div>
    );
};
