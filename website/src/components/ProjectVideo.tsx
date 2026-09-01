"use client";

import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUISound } from '../hooks/use-ui-sound';

interface ProjectVideoProps {
    src: string;
    style?: React.CSSProperties;
    className?: string;
    resetTime?: number;
    startTime?: number;
    endTime?: number;
    iconColor?: 'white' | 'black';
}

export const ProjectVideo = ({ src, style, className, resetTime = 0, startTime = 0, endTime, iconColor = 'black' }: ProjectVideoProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [iconState, setIconState] = useState<'play' | 'pause' | null>('play');
    const wasPlayingRef = useRef(false);
    const { playClick } = useUISound();

    // Auto-pause videos 
    useEffect(() => {
        const container = containerRef.current;
        const video = videoRef.current;
        if (!container || !video) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting && !video.paused) {
                    // Video scrolled out of view while playing pause it
                    wasPlayingRef.current = true;
                    video.pause();
                } else if (entry.isIntersecting && wasPlayingRef.current) {
                    // Video scrolled back into view
                    wasPlayingRef.current = false;
                    video.play().catch(() => { });
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(container);
        return () => observer.disconnect();
    }, []);

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        playClick();

        if (!videoRef.current) return;

        if (videoRef.current.paused) {
            wasPlayingRef.current = false;
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch((error) => {
                    console.error("Video play prevented:", error);
                });
            }
            setIconState(null);
        } else {
            videoRef.current.pause();
            videoRef.current.currentTime = resetTime;
            wasPlayingRef.current = false;
            setIconState('play');
        }
    };

    const iconBgClass = iconColor === 'white'
        ? "bg-zinc-900/90 text-white"
        : "bg-white/90 text-black";

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
                loop={!endTime && !startTime}
                muted
                playsInline
                preload="metadata"
                className="w-full h-full object-cover pointer-events-none"
                onTimeUpdate={(endTime || startTime) ? (e) => {
                    const video = e.currentTarget;
                    if (endTime && video.currentTime >= endTime) {
                        video.currentTime = startTime;
                        video.play().catch(() => { });
                    }
                    if (!endTime && startTime && video.duration && video.currentTime >= video.duration - 0.3) {
                        video.currentTime = startTime;
                        video.play().catch(() => { });
                    }
                } : undefined}
            />

            <AnimatePresence>
                {iconState && (
                    <motion.div
                        key={iconState}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
                    >
                        <div className={`${iconBgClass} rounded-full p-5 backdrop-blur-md shadow-xl`}>
                            {iconState === 'pause' ? (
                                <svg
                                    width="48"
                                    height="48"
                                    viewBox="0 0 24 24"
                                    fill={iconColor === 'white' ? 'white' : 'black'}
                                    stroke={iconColor === 'white' ? 'white' : 'black'}
                                    strokeWidth="0"
                                >
                                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                                </svg>
                            ) : (
                                <svg
                                    width="48"
                                    height="48"
                                    viewBox="0 0 24 24"
                                    fill={iconColor === 'white' ? 'white' : 'black'}
                                    stroke={iconColor === 'white' ? 'white' : 'black'}
                                    strokeWidth="0"
                                >
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
