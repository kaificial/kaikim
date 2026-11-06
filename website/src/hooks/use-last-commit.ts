"use client";

import { useEffect } from 'react';
import { showActivity } from '../lib/island';

const USER = 'kaificial';
// v2: entries now carry the activity type (push / pr / merge)
const CACHE_KEY = 'island:last-commit:v2';
const CACHE_MS = 10 * 60 * 1000;
const FIRST_SHOW_MS = 5000;
const REPEAT_MS = 2 * 60 * 1000;
const SHOW_FOR_MS = 5200;

export type GitActivityType = 'push' | 'pr' | 'merge';
type Commit = { type: GitActivityType; repo: string; message?: string; at: string };

type GhEvent = {
    type: string;
    created_at: string;
    repo: { name: string };
    payload?: {
        action?: string;
        commits?: { message: string }[];
        pull_request?: { title?: string; merged?: boolean };
    };
};

/** turns a github event into an island activity, or null for events we don't show */
const toActivity = (e: GhEvent): Commit | null => {
    const repo = e.repo.name.split('/').pop() ?? e.repo.name;
    if (e.type === 'PushEvent') {
        // first line of the newest commit in the push, when github includes it
        return { type: 'push', repo, message: e.payload?.commits?.at(-1)?.message.split('\n')[0], at: e.created_at };
    }
    if (e.type === 'PullRequestEvent') {
        const pr = e.payload?.pull_request;
        const action = e.payload?.action;
        if (action === 'closed' && pr?.merged) return { type: 'merge', repo, message: pr.title, at: e.created_at };
        if (action === 'opened' || action === 'reopened') return { type: 'pr', repo, message: pr?.title, at: e.created_at };
    }
    return null;
};

/** latest public push / pull request from github's events api, cached for the tab so reloads don't spend the rate limit */
const fetchLastCommit = async (signal: AbortSignal): Promise<Commit | null> => {
    try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
            const { t, commit } = JSON.parse(cached) as { t: number; commit: Commit | null };
            if (Date.now() - t < CACHE_MS) return commit;
        }
    } catch { /* bad cache, refetch */ }

    const res = await fetch(`https://api.github.com/users/${USER}/events/public?per_page=30`, { signal });
    if (!res.ok) return null;
    const events = (await res.json()) as GhEvent[];
    // events come newest first, so the first one we can show wins
    let commit: Commit | null = null;
    for (const e of events) {
        commit = toActivity(e);
        if (commit) break;
    }
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), commit })); } catch { /* storage full or blocked */ }
    return commit;
};

/** shows the latest commit in the island a few seconds after load, then every couple of minutes */
export const useLastCommitActivity = () => {
    useEffect(() => {
        const ctrl = new AbortController();
        let commit: Commit | null = null;
        let repeat: number | undefined;
        const show = () => { if (commit && !document.hidden) showActivity({ kind: 'commit', ...commit }, SHOW_FOR_MS); };
        const first = window.setTimeout(async () => {
            commit = await fetchLastCommit(ctrl.signal).catch(() => null);
            show();
            repeat = window.setInterval(show, REPEAT_MS);
        }, FIRST_SHOW_MS);
        return () => { ctrl.abort(); window.clearTimeout(first); window.clearInterval(repeat); };
    }, []);
};

/** "just now", "5m ago", "3h ago", "2d ago" */
export const timeAgo = (iso: string) => {
    const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
};
