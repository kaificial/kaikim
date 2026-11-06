"use client";

import { useSyncExternalStore } from 'react';

/**
 * the music island's "live activities": short moments that take over the pill for a few seconds and
 * then hand it back to the music. anything on the site can push one, the newest wins
 */
export type IslandActivity =
    | { kind: 'theme'; dark: boolean }
    | { kind: 'commit'; type: 'push' | 'pr' | 'merge'; repo: string; message?: string; at: string };

type Current = (IslandActivity & { key: number }) | null;

let current: Current = null;
let timer: number | undefined;
let nextKey = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** show an activity in the island for `ms`, replacing whatever is there */
export const showActivity = (activity: IslandActivity, ms = 2400) => {
    if (typeof window === 'undefined') return;
    window.clearTimeout(timer);
    current = { ...activity, key: nextKey++ };
    emit();
    timer = window.setTimeout(() => { current = null; emit(); }, ms);
};

const subscribe = (fn: () => void) => {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
};

export const useIslandActivity = () => useSyncExternalStore(subscribe, () => current, () => null);
