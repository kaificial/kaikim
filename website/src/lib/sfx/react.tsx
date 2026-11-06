"use client";

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import { install, isMuted, setMuted, subscribe } from './engine';
import * as cues from './cues';

type SimpleCue = 'press' | 'pop' | 'paper' | 'unfold' | 'fold' | 'tick' | 'slide' | 'stamp';
const DELEGATED: Record<SimpleCue, (o: cues.CueOpts) => void> = {
    press: cues.press,
    pop: cues.pop,
    paper: cues.paper,
    unfold: cues.unfold,
    fold: cues.fold,
    tick: cues.tick,
    slide: cues.slide,
    stamp: cues.stamp,
};

/**
 * mount once (root layout). unlocks audio on the first click, pans by pointer, pauses in
 * background tabs, plays `nav` when the page changes, and hooks up simple sounds:
 *
 *   <button data-sfx="press" data-sfx-degree="2">…</button>
 *
 * it listens on `click`, after react's own handlers, so the sound comes after the change it confirms
 */
export function SfxBoot() {
    const pathname = usePathname();
    const firstPath = useRef(true);

    useEffect(() => install(), []);

    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            const el = (e.target as Element | null)?.closest<HTMLElement>('[data-sfx]');
            if (!el || (el as HTMLButtonElement).disabled || el.getAttribute('aria-disabled') === 'true') return;
            const cue = DELEGATED[el.dataset.sfx as SimpleCue];
            if (!cue) return;
            const degree = el.dataset.sfxDegree;
            // keyboard clicks have no position (detail 0), so play it centred
            const x = e.detail === 0 ? undefined : e.clientX;
            cue({ x, degree: degree === undefined ? undefined : Number(degree) });
        };
        document.addEventListener('click', onClick);
        return () => document.removeEventListener('click', onClick);
    }, []);

    useEffect(() => {
        if (firstPath.current) { firstPath.current = false; return; }
        cues.nav();
    }, [pathname]);

    return null;
}

/** live mute state for toggles */
export const useSfxMuted = () => useSyncExternalStore(subscribe, isMuted, () => false);

/** mute or unmute, with a little sound either way */
export const setSfxMuted = (next: boolean) => {
    if (next) {
        cues.toggle(false); // play first so you hear it before it mutes
        setMuted(true);
    } else {
        setMuted(false);
        cues.toggle(true);
    }
};

/** speaker icon, crossed out when muted */
export const SpeakerIcon = ({ muted, size = 20, filled = false }: { muted: boolean; size?: number; filled?: boolean }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M11 5 6 9H2v6h4l5 4V5z" />
        {muted ? (
            <>
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
            </>
        ) : (
            <>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" fill="none" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" fill="none" />
            </>
        )}
    </svg>
);
