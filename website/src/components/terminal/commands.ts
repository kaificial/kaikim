import type { Command } from './types';
import { setSfxMuted } from '../../lib/sfx/react';
import { isMuted } from '../../lib/sfx/engine';

/* pages the terminal knows about */
export const ROUTES = [
    { name: 'home', path: '/', blurb: 'where it all starts' },
    { name: 'projects', path: '/projects', blurb: 'things i have built' },
    { name: 'notes', path: '/notes', blurb: 'films, music, writing' },
] as const;

export type Route = (typeof ROUTES)[number];

export const PROMPT = 'PS C:\\Users\\guest\\kaikim>';
export const winPath = (p: string) => `C:\\Users\\guest\\kaikim${p.replace(/\/+$/, '').replace(/\//g, '\\')}`;

const levenshtein = (a: string, b: string) => {
    const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++) dp[0][j] = j;
    for (let i = 1; i <= a.length; i++)
        for (let j = 1; j <= b.length; j++)
            dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return dp[a.length][b.length];
};

/** closest real page to a path that doesn't exist. falls back to home */
export const closestRoute = (path: string): Route => {
    const seg = path.toLowerCase().split('/').filter(Boolean)[0] ?? '';
    if (!seg) return ROUTES[0];
    let best: Route = ROUTES[0];
    let bestScore = Infinity;
    for (const r of ROUTES) {
        if (r.name === 'home') continue;
        const score = r.name.startsWith(seg) || seg.startsWith(r.name) ? 0 : levenshtein(seg, r.name);
        if (score < bestScore) { bestScore = score; best = r; }
    }
    return bestScore <= 4 ? best : ROUTES[0];
};

const openTab = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');

/* commands */
export const help: Command = {
    name: 'help',
    run: ({ print, commands }) => {
        print('available commands:');
        commands.forEach((c) => c.help && print(`  ${c.help}`));
    },
};

export const ls: Command = {
    name: 'ls',
    aliases: ['dir', 'gci', 'get-childitem'],
    complete: ['dir'],
    help: 'ls               list pages',
    run: ({ print }) => ROUTES.forEach((r) => print(`  ${(r.name + '/').padEnd(12)}${r.blurb}`)),
};

export const cd: Command = {
    name: 'cd',
    aliases: ['set-location', 'sl'],
    help: 'cd <page>        go somewhere that exists',
    completeArg: (partial) => ROUTES.filter((r) => r.name.startsWith(partial.toLowerCase())).map((r) => r.name),
    run: ({ arg, print, navigate }) => {
        const target = arg.replace(/^[~.]?\/+/, '').replace(/\/+$/, '').toLowerCase();
        if (!target || target === '~' || target === '..' || target === 'home') return navigate('/');
        const hit = ROUTES.find((r) => r.name === target) ?? (target === 'writing' ? ROUTES[2] : undefined);
        if (hit) return navigate(hit.path);
        print(`Set-Location: Cannot find path '${winPath('/' + target)}' because it does not exist.`, 'err');
        const near = closestRoute('/' + target);
        if (near.name !== 'home') print(`did you mean "cd ${near.name}"?`);
    },
};

export const whoami: Command = {
    name: 'whoami',
    help: 'whoami · pwd · date · echo',
    run: ({ print }) => {
        print('guest. but this is kai\'s corner of the internet.');
        print('cs @ queen\'s, building things in toronto.');
    },
};

export const pwd: Command = {
    name: 'pwd',
    aliases: ['gl', 'get-location'],
    run: ({ print, pathname }) => print(`${pathname}  (which doesn't exist, technically)`),
};

export const date: Command = {
    name: 'date',
    run: ({ print }) => print(new Date().toString()),
};

export const echo: Command = {
    name: 'echo',
    aliases: ['write-output'],
    run: ({ print, arg }) => print(arg),
};

export const x: Command = {
    name: 'x',
    aliases: ['twitter'],
    help: 'x · github · email',
    run: ({ print }) => {
        openTab('https://x.com/kaikimto');
        print('opening x.com/kaikimto', 'ok');
    },
};

export const github: Command = {
    name: 'github',
    run: ({ print }) => {
        openTab('https://github.com/kaificial');
        print('opening github.com/kaificial', 'ok');
    },
};

export const email: Command = {
    name: 'email',
    aliases: ['mail'],
    run: ({ print }) => {
        navigator.clipboard?.writeText('kaikimto@gmail.com').then(
            () => print('copied kaikimto@gmail.com to clipboard', 'ok'),
            () => print('kaikimto@gmail.com'),
        );
    },
};

export const clear: Command = {
    name: 'clear',
    aliases: ['cls', 'clear-host'],
    complete: ['cls'],
    help: 'clear            wipe the screen',
    run: ({ clear }) => clear(),
};

export const sound: Command = {
    name: 'sound',
    help: 'sound on|off     sound effects',
    completeArg: (partial) => ['on', 'off'].filter((o) => o.startsWith(partial.toLowerCase())),
    run: ({ arg, print }) => {
        const want = arg.trim().toLowerCase();
        if (want !== 'on' && want !== 'off') {
            print(`sound effects are ${isMuted() ? 'off' : 'on'}. usage: sound on|off`);
            return;
        }
        setSfxMuted(want === 'off');
        print(`sound effects ${want}`, 'ok');
    },
};

export const sudo: Command = {
    name: 'sudo',
    run: ({ print }) => print('sudo: this is Windows, friend. guest is not an administrator either.', 'err'),
};

export const exit: Command = {
    name: 'exit',
    aliases: ['quit'],
    run: ({ print }) => print('there is no escape. well, there\'s "cd ~".'),
};

export const rm: Command = {
    name: 'rm',
    hidden: true,
    run: ({ print }) => print('nice try.', 'err'),
};

export const vim: Command = {
    name: 'vim',
    aliases: ['nano'],
    hidden: true,
    run: ({ print }) => print('you\'ll never get out. try "cd ~" instead.'),
};

/** getting around the site */
export const navigationCommands = [ls, cd];
/** about kai, contact links, and shell fun */
export const generalCommands = [whoami, pwd, x, github, email, date, echo, sound, clear, sudo, exit, rm, vim];
/** everything, in `help` order. slot page-specific commands in where they fit */
export const coreCommands = [help, ...navigationCommands, ...generalCommands];
