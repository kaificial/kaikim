"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { sfx } from "../lib/sfx";

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
    previousTrack: () => void;
}

/** music volume, 0 to 1 */
const MUSIC_VOLUME = 0.5;

const DEFAULT_TRACK: Track = {
    id: "eta-newjeans",
    title: "ETA",
    artist: "NewJeans",
    src: "",
    cover: "/assets/music.jpg",
};

async function fetchTrackFromAPI(title?: string, artist?: string): Promise<Track | null> {
    try {
        const params = title && artist
            ? `?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`
            : '';
        const res = await fetch(`/api/music${params}`);
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

async function fetchDefaultTrack(): Promise<Track | null> {
    return fetchTrackFromAPI("ETA", "NewJeans");
}

async function fetchSecondTrack(): Promise<Track | null> {
    return fetchTrackFromAPI("Cool With You", "NewJeans");
}

// get a random song
async function fetchRandomTrack(): Promise<Track | null> {
    return fetchTrackFromAPI();
}

const isEta = (t: Track) =>
    t.title.toLowerCase() === "eta" && t.artist.toLowerCase() === "newjeans";

// after ETA comes Cool With You, otherwise shuffle
async function fetchNextTrack(current: Track): Promise<Track | null> {
    if (isEta(current)) {
        const second = await fetchSecondTrack();
        if (second) return second;
    }
    // don't repeat the same song
    for (let i = 0; i < 3; i++) {
        const t = await fetchRandomTrack();
        if (!t || t.id !== current.id) return t;
    }
    return null;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const historyRef = useRef<Track[]>([]);
    const currentTrackRef = useRef<Track>(DEFAULT_TRACK);
    const isPlayingRef = useRef(false);
    // the next song, fetched ahead so skip is instant
    const nextRef = useRef<{ forId: string; promise: Promise<Track | null> } | null>(null);
    // only the latest skip click counts
    const skipSeq = useRef(0);
    const [currentTrack, setCurrentTrack] = useState<Track>(DEFAULT_TRACK);
    const [isPlaying, setIsPlaying] = useState(false);
    // sound effects drop 6 dB while music plays
    useEffect(() => { sfx.duck(isPlaying); }, [isPlaying]);
    useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);

    // next song after `current`, reusing the prefetched one if there is one
    const getNext = useCallback((current: Track) => {
        if (nextRef.current?.forId === current.id) return nextRef.current.promise;
        const promise = fetchNextTrack(current).then((t) => {
            // forget failures so the next try fetches again
            if (!t && nextRef.current?.promise === promise) nextRef.current = null;
            return t;
        });
        nextRef.current = { forId: current.id, promise };
        return promise;
    }, []);

    const loadTrack = useCallback((track: Track, autoplay: boolean) => {
        const audio = audioRef.current;
        if (!audio) return;
        currentTrackRef.current = track;
        setCurrentTrack(track);
        setProgress(0);
        setDuration(0);
        audio.src = track.src;
        audio.load();
        if (!autoplay) return;
        setIsPlaying(true);
        audio.play().catch((e) => {
            // AbortError just means another skip replaced this song
            if (e?.name !== "AbortError") setIsPlaying(false);
        });
    }, []);

    // fetch the next song in the background once this one is ready
    useEffect(() => {
        if (currentTrack.src) getNext(currentTrack);
    }, [currentTrack, getNext]);

    useEffect(() => {
        let cancelled = false;
        const audio = new Audio();
        audio.preload = "metadata";
        audio.volume = MUSIC_VOLUME;
        audioRef.current = audio;

        const onTimeUpdate = () => setProgress(audio.currentTime);
        const onLoadedMetadata = () => {
            if (isFinite(audio.duration)) setDuration(audio.duration);
        };
        const onDurationChange = () => {
            if (audio.duration > 0 && isFinite(audio.duration)) setDuration(audio.duration);
        };
        // song ended, play the next one
        const onEnded = () => {
            const cur = currentTrackRef.current;
            getNext(cur).then((track) => {
                if (cancelled || currentTrackRef.current.id !== cur.id) return;
                if (!track) { setIsPlaying(false); return; }
                historyRef.current.push(cur);
                loadTrack(track, true);
            });
        };

        audio.addEventListener("timeupdate", onTimeUpdate);
        audio.addEventListener("loadedmetadata", onLoadedMetadata);
        audio.addEventListener("durationchange", onDurationChange);
        audio.addEventListener("ended", onEnded);

        fetchDefaultTrack().then((track) => {
            // don't clobber a song the user already skipped to
            if (cancelled || !track || currentTrackRef.current.src) return;
            loadTrack(track, false);
        });

        return () => {
            cancelled = true;
            audio.removeEventListener("timeupdate", onTimeUpdate);
            audio.removeEventListener("loadedmetadata", onLoadedMetadata);
            audio.removeEventListener("durationchange", onDurationChange);
            audio.removeEventListener("ended", onEnded);
            audio.pause();
            audio.src = "";
        };
    }, [getNext, loadTrack]);

    const playTrack = useCallback((track: Track) => {
        const audio = audioRef.current;
        if (!audio) return;
        const cur = currentTrackRef.current;

        // same track, just toggle
        if (track.id === cur.id) {
            if (isPlayingRef.current) {
                audio.pause();
                setIsPlaying(false);
            } else {
                audio.play().catch((e) => console.error("Audio play error", e));
                setIsPlaying(true);
            }
            return;
        }

        if (cur.src) historyRef.current.push(cur);
        loadTrack(track, true);
    }, [loadTrack]);

    const togglePlay = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlayingRef.current) {
            audio.pause();
            setIsPlaying(false);
        } else {
            if (!audio.src || audio.src === window.location.href) return;
            audio.play().catch((e) => console.error("Audio play error", e));
            setIsPlaying(true);
        }
    }, []);

    const seek = useCallback((time: number) => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.currentTime = time;
        setProgress(time);
    }, []);

    // next song
    const shuffleTrack = useCallback(async () => {
        const seq = ++skipSeq.current;
        const cur = currentTrackRef.current;
        const wasPlaying = isPlayingRef.current;

        // one retry if the lookup failed
        const track = (await getNext(cur)) ?? (await getNext(cur));
        // a newer click or song change took over
        if (seq !== skipSeq.current || currentTrackRef.current.id !== cur.id || !track) return;

        if (cur.src) historyRef.current.push(cur);
        loadTrack(track, wasPlaying);
    }, [getNext, loadTrack]);

    // previous song
    const previousTrack = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;
        skipSeq.current++; // cancel any pending skip

        const prev = historyRef.current.pop();
        if (!prev || !prev.src) {
            // nothing before this one, so restart it
            audio.currentTime = 0;
            setProgress(0);
            return;
        }

        loadTrack(prev, isPlayingRef.current);
    }, [loadTrack]);

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
                previousTrack,
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
