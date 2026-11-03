"use client";

import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type Ref } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTheme } from '../ThemeContext';
import { PROMPT } from './commands';
import { sfx } from '../../lib/sfx';
import type { Command, CommandContext, Line, LineKind, TerminalHandle } from './types';

// windows terminal colours: campbell in dark mode, a light profile otherwise
const SCHEMES = {
    dark: { chrome: '#202020', bg: '#0c0c0c', frame: 'rgba(255,255,255,0.08)', fg: '#cccccc', input: '#f9f1a5', muted: '#9a9a9a', red: '#e74856', green: '#16c60c', chromeFg: '#e6e6e6' },
    light: { chrome: '#e9e9e9', bg: '#ffffff', frame: 'rgba(0,0,0,0.12)', fg: '#1e1e1e', input: '#0037da', muted: '#6b6b6b', red: '#c50f1f', green: '#13a10e', chromeFg: '#1e1e1e' },
} as const;

type TerminalProps = {
    commands: Command[];
    initialLines?: Line[];
    title?: string;
    prompt?: string;
    placeholder?: string;
    /** what hitting enter on an empty line does. default: nothing */
    onEmptySubmit?: (ctx: CommandContext) => void;
    /** minimize button. leave it out and the button is just for looks */
    onMinimize?: () => void;
    minimizeLabel?: string;
    /** close buttons (tab and window). default: runs `exit` */
    onClose?: () => void;
    maxHeight?: number | string;
    style?: CSSProperties;
    ref?: Ref<TerminalHandle>;
};

/**
 * a windows terminal style shell. commands come from a list (see ./commands.ts) so each page can pick
 * its own
 */
export function Terminal({
    commands,
    initialLines = [],
    title = 'Windows PowerShell',
    prompt = PROMPT,
    placeholder = 'try "help"',
    onEmptySubmit,
    onMinimize,
    minimizeLabel = 'Minimize',
    onClose,
    maxHeight = 260,
    style,
    ref,
}: TerminalProps) {
    const { isDark } = useTheme();
    const pathname = usePathname() || '/';
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [lines, setLines] = useState<Line[]>(initialLines);
    const [input, setInput] = useState('');
    const [history, setHistory] = useState<string[]>([]);
    const [histIdx, setHistIdx] = useState(-1);

    const term = isDark ? SCHEMES.dark : SCHEMES.light;
    const chromeBtn: CSSProperties = {
        display: 'grid', placeItems: 'center', background: 'transparent', border: 'none',
        color: term.chromeFg, cursor: 'pointer', padding: 0, font: 'inherit', opacity: 0.85,
    };

    const lookup = useMemo(() => {
        const map = new Map<string, Command>();
        for (const c of commands) {
            map.set(c.name.toLowerCase(), c);
            c.aliases?.forEach((a) => map.set(a.toLowerCase(), c));
        }
        return map;
    }, [commands]);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    }, [lines]);

    const append = useCallback((text: string, kind: LineKind = 'out') => {
        setLines((l) => [...l, { kind, text }]);
    }, []);

    const navigateNow = useCallback((path: string) => {
        append(`taking off for ${path} ✈`, 'ok');
        setTimeout(() => router.push(path), 350);
    }, [append, router]);

    const run = useCallback((raw: string) => {
        const cmdLine = raw.trim();
        // output printed right away gets batched so it lands after the typed line,
        // anything printed later (like after a clipboard promise) just gets appended
        const out: Line[] = [{ kind: 'in', text: cmdLine }];
        let batching = true;
        let cleared = false;
        const print = (text: string, kind: LineKind = 'out') => {
            if (batching) out.push({ kind, text });
            else append(text, kind);
        };
        const [cmd = '', ...args] = cmdLine.split(/\s+/);
        const ctx: CommandContext = {
            cmd,
            arg: args.join(' '),
            args,
            pathname,
            print,
            clear: () => { cleared = true; },
            navigate: (path) => {
                print(`taking off for ${path} ✈`, 'ok');
                setTimeout(() => router.push(path), 350);
            },
            commands,
        };

        let known = false;
        if (!cmdLine) onEmptySubmit?.(ctx);
        else {
            const command = lookup.get(cmd.toLowerCase());
            if (command) { known = true; command.run(ctx); }
            else print(`${cmd}: The term '${cmd}' is not recognized as a name of a cmdlet, function, script file, or executable program. Try "help".`, 'err');
        }

        batching = false;
        // a command that printed an error buzzes, one that ran fine confirms
        if (out.some((l) => l.kind === 'err')) sfx.error();
        else if (known && !cleared) sfx.confirm();
        setLines((l) => (cleared ? [] : [...l, ...out]));
    }, [append, commands, lookup, onEmptySubmit, pathname, router]);

    useImperativeHandle(ref, () => ({ run, print: append, navigate: navigateNow }), [run, append, navigateNow]);

    const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if ((e.key.length === 1 || e.key === 'Backspace') && !e.ctrlKey && !e.metaKey) sfx.key(e.key);
        if (e.key === 'Enter') {
            e.preventDefault();
            run(input);
            if (input.trim()) setHistory((h) => [input, ...h].slice(0, 50));
            setInput('');
            setHistIdx(-1);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const i = Math.min(histIdx + 1, history.length - 1);
            if (i >= 0) { setHistIdx(i); setInput(history[i]); }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            const i = histIdx - 1;
            setHistIdx(Math.max(i, -1));
            setInput(i >= 0 ? history[i] : '');
        } else if (e.key === 'Tab') {
            e.preventDefault();
            const parts = input.split(/\s+/);
            if (parts.length === 1) {
                const words = commands.filter((c) => !c.hidden).flatMap((c) => [c.name, ...(c.complete ?? [])]);
                const m = words.filter((w) => w.startsWith(parts[0].toLowerCase()));
                if (m.length === 1) setInput(m[0] + ' ');
                else if (m.length > 1) append(m.join('  '));
            } else {
                const command = lookup.get(parts[0].toLowerCase());
                const m = command?.completeArg?.(parts[1] ?? '') ?? [];
                if (m.length === 1) setInput(`${parts[0]} ${m[0]}`);
                else if (m.length > 1) append(m.join('  '));
            }
        } else if (e.key === 'l' && e.ctrlKey) {
            e.preventDefault();
            setLines([]);
        }
    };

    const close = (e: MouseEvent) => {
        e.stopPropagation();
        if (onClose) onClose();
        else run('exit');
    };

    const lineColor = (k: LineKind) => (k === 'err' ? term.red : k === 'ok' ? term.green : k === 'in' ? term.input : term.muted);

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.15 }}
            onClick={() => inputRef.current?.focus()}
            style={{
                border: `1px solid ${term.frame}`,
                borderRadius: '8px',
                background: term.bg,
                overflow: 'hidden',
                fontSize: '0.8125rem',
                fontFamily: '"Cascadia Mono", "Cascadia Code", Consolas, var(--font-mono), monospace',
                boxShadow: isDark ? '0 16px 40px rgba(0,0,0,0.55)' : '0 16px 40px rgba(0,0,0,0.14)',
                ...style,
            }}
        >
            {/* title bar: tabs on the left, window buttons on the right */}
            <div style={{ display: 'flex', alignItems: 'stretch', height: '36px', background: term.chrome, fontFamily: '"Segoe UI Variable", "Segoe UI", system-ui, sans-serif' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', paddingLeft: '8px', minWidth: 0 }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        height: '30px', padding: '0 6px 0 10px', minWidth: 0, maxWidth: '240px',
                        background: term.bg, borderRadius: '6px 6px 0 0',
                        color: term.fg, fontSize: '0.75rem',
                    }}>
                        <span aria-hidden style={{
                            flexShrink: 0, width: 16, height: 16, borderRadius: '3px',
                            background: 'linear-gradient(135deg, #2c7cd8, #1a4fa3)',
                            color: '#fff', fontSize: '9px', fontWeight: 700,
                            display: 'grid', placeItems: 'center', fontFamily: 'Consolas, monospace',
                        }}>&gt;_</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
                        <button
                            type="button"
                            aria-label="Close tab"
                            onClick={close}
                            style={{ ...chromeBtn, width: 22, height: 22, borderRadius: '4px', marginLeft: '6px' }}
                        >
                            <svg width="8" height="8" viewBox="0 0 10 10" aria-hidden><path d="M0 0l10 10M10 0L0 10" stroke="currentColor" strokeWidth="1.2" /></svg>
                        </button>
                    </div>
                    <span aria-hidden style={{ ...chromeBtn, width: 32, height: 30, fontSize: '1rem', cursor: 'default' }}>+</span>
                    <span aria-hidden style={{ ...chromeBtn, width: 22, height: 30, cursor: 'default' }}>
                        <svg width="9" height="9" viewBox="0 0 10 10"><path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg>
                    </span>
                </div>
                <div style={{ flex: 1 }} />
                <div style={{ display: 'flex' }}>
                    {onMinimize ? (
                        <button type="button" aria-label={minimizeLabel} onClick={(e) => { e.stopPropagation(); onMinimize(); }} style={{ ...chromeBtn, width: 46 }}>
                            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden><path d="M0 5h10" stroke="currentColor" strokeWidth="1" /></svg>
                        </button>
                    ) : (
                        <span aria-hidden style={{ ...chromeBtn, width: 46, cursor: 'default' }}>
                            <svg width="10" height="10" viewBox="0 0 10 10"><path d="M0 5h10" stroke="currentColor" strokeWidth="1" /></svg>
                        </span>
                    )}
                    <span aria-hidden style={{ ...chromeBtn, width: 46, cursor: 'default' }}>
                        <svg width="10" height="10" viewBox="0 0 10 10"><rect x="0.5" y="0.5" width="9" height="9" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1" /></svg>
                    </span>
                    <button type="button" aria-label="Close window" onClick={close} style={{ ...chromeBtn, width: 46 }} className="wt-close">
                        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden><path d="M0 0l10 10M10 0L0 10" stroke="currentColor" strokeWidth="1" /></svg>
                    </button>
                </div>
            </div>
            <div
                ref={scrollRef}
                role="log"
                aria-live="polite"
                style={{ padding: '12px 14px 2px', maxHeight, overflowY: 'auto', lineHeight: 1.55, color: term.fg }}
            >
                {lines.map((l, i) => (
                    <div key={i} style={{ color: lineColor(l.kind), whiteSpace: 'pre-wrap', wordBreak: 'break-word', minHeight: '1.55em' }}>
                        {l.kind === 'in' && <span style={{ color: term.fg }}>{prompt} </span>}
                        {l.text}
                    </div>
                ))}
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6ch', padding: '0 14px 12px', cursor: 'text', color: term.fg }}>
                <span aria-hidden style={{ whiteSpace: 'nowrap' }}>{prompt}</span>
                <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={onKeyDown}
                    aria-label="Terminal input. Type help for commands."
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    placeholder={placeholder}
                    style={{
                        flex: 1,
                        minWidth: 0,
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: term.input,
                        font: 'inherit',
                        caretColor: term.fg,
                    }}
                />
            </label>
        </motion.div>
    );
}
