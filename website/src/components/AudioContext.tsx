"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";

export interface Track {
    id: string;
    title: string;
    artist: string;
    src: string;
    cover: string;
}

interface AudioContextType {
    currentTrack: Track;
    isPlaying: boolean;
    progress: number;
    duration: number;
    playTrack: (track: Track) => void;
    togglePlay: () => void;
    seek: (time: number) => void;
    shuffleTrack: () => Promise<void>;
}

const DEFAULT_TRACK: Track = {
    id: "eta-newjeans",
    title: "ETA",
    artist: "NewJeans",
    src: "/music/newjean.mp3",
    cover: "/assets/music.jpg",
};

// Pull a random song from API route
async function fetchRandomTrack(): Promise<Track | null> {
    try {
        const res = await fetch("/api/music");
        if (!res.ok) return null;
        const data = await res.json();
        if (!data?.src) return null;
        return {
            id: data.id,
            title: data.title,
            artist: data.artist,
            src: data.src,
            cover: data.cover ?? DEFAULT_TRACK.cover,
        };
    } catch {
        return null;
    }
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [currentTrack, setCurrentTrack] = useState<Track>(DEFAULT_TRACK);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        let cancelled = false;
        const audio = new Audio(DEFAULT_TRACK.src);
        audio.preload = "metadata";
        audioRef.current = audio;

        const onTimeUpdate = () => setProgress(audio.currentTime);
        const onLoadedMetadata = () => {
            if (isFinite(audio.duration)) setDuration(audio.duration);
        };
        const onDurationChange = () => {
            if (audio.duration > 0 && isFinite(audio.duration)) setDuration(audio.duration);
        };
        // When a preview finishes skip to the next random song
        const onEnded = () => {
            fetchRandomTrack().then((track) => {
                if (cancelled || !track || !audioRef.current) {
                    setIsPlaying(false);
                    return;
                }
                const a = audioRef.current;
                setCurrentTrack(track);
                setProgress(0);
                setDuration(0);
                a.src = track.src;
                a.load();
                a.play().catch(() => setIsPlaying(false));
                setIsPlaying(true);
            });
        };

        audio.addEventListener("timeupdate", onTimeUpdate);
        audio.addEventListener("loadedmetadata", onLoadedMetadata);
        audio.addEventListener("durationchange", onDurationChange);
        audio.addEventListener("ended", onEnded);

        return () => {
            cancelled = true;
            audio.removeEventListener("timeupdate", onTimeUpdate);
            audio.removeEventListener("loadedmetadata", onLoadedMetadata);
            audio.removeEventListener("durationchange", onDurationChange);
            audio.removeEventListener("ended", onEnded);
            audio.pause();
            audio.src = "";
        };
    }, []);

    const playTrack = useCallback((track: Track) => {
        const audio = audioRef.current;
        if (!audio) return;

        // If it's the same track, just toggle
        if (track.id === currentTrack.id) {
            if (isPlaying) {
                audio.pause();
                setIsPlaying(false);
            } else {
                audio.play().catch((e) => console.error("Audio play error", e));
                setIsPlaying(true);
            }
            return;
        }

        setCurrentTrack(track);
        setProgress(0);
        setDuration(0);
        audio.src = track.src;
        audio.load();
        audio.play().catch((e) => console.error("Audio play error", e));
        setIsPlaying(true);
    }, [currentTrack.id, isPlaying]);

const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
    } else {
        audio.play().catch((e) => console.error("Audio play error", e));
        setIsPlaying(true);
    }
}, [isPlaying]);

const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setProgress(time);
}, []);

// Jump to a new random song
const shuffleTrack = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    const wasPlaying = isPlaying;
    const track = await fetchRandomTrack();
    if (!track) return;

    setCurrentTrack(track);
    setProgress(0);
    setDuration(0);
    audio.src = track.src;
    audio.load();
    if (wasPlaying) {
        audio.play().catch((e) => console.error("Audio play error", e));
        setIsPlaying(true);
    }
}, [isPlaying]);

return (
    <AudioContext.Provider
        value={{
            currentTrack,
            isPlaying,
            progress,
            duration,
            playTrack,
            togglePlay,
            seek,
            shuffleTrack,
        }}
    >
        {children}
    </AudioContext.Provider>
);
}

export function useAudio() {
    const context = useContext(AudioContext);
    if (context === undefined) {
        throw new Error("useAudio must be used within an AudioProvider");
    }
    return context;
}
