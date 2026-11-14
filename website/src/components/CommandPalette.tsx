"use client";

import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    Home,
    FolderGit2,
    PenLine,
    Sun,
    Moon,
    Play,
    Pause,
    Mail,
    Github,
    Linkedin,
    FileText,
    Music,
    CornerDownLeft,
    Search,
    Volume2,
    VolumeX,
    Hash,
} from "lucide-react";
import { useTheme } from "./ThemeContext";
import { useAudio } from "./AudioContext";
import { getLenis } from "./SmoothScroll";
import { projects } from "../data/projects";
import { sfx } from "../lib/sfx";
import { setSfxMuted, useSfxMuted } from "../lib/sfx/react";
import { showActivity } from "../lib/island";
import { SPRING_SNAPPY } from "../styles/motion";

/*
 * the command palette. it lives inside the music widget, which grows into it (see Header.tsx)
 */

interface Command {
    id: string;
    label: string;
    group: string;
    icon: ReactNode;
    keywords?: string;
    hint?: string;
    perform: () => void | Promise<void>;
}

const GROUP_ORDER = ["Navigation", "On this page", "Projects", "Actions", "Connect"];

/** size of the open palette */
export const paletteSize = (vw: number, vh: number) => {
    const width = Math.min(600, vw - 24);
    const height = Math.min(472, vh - 24);
    return { width, height, left: (vw - width) / 2 };
};

/** ⌘K or ctrl+K opens it, and so does firing this event */
export const OPEN_PALETTE_EVENT = "open-command-palette";
export const isPaletteShortcut = (e: KeyboardEvent) => (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";

/* page sections you can jump to (mark them with data-page-section) */
const pageSections = () =>
    Array.from(document.querySelectorAll<HTMLElement>("[data-page-section]")).map((el) => ({
        label: el.dataset.pageSection ?? "",
        el,
    }));

const scrollToSection = (el: HTMLElement) => {
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(el, { offset: -96, duration: 1.1, force: true });
    else el.scrollIntoView({ behavior: "smooth", block: "start" });
};

const XIcon = ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

const WAVE = [
    { peak: "7px", offset: 0.0, duration: 1.0 },
    { peak: "10px", offset: 0.2, duration: 0.8 },
    { peak: "11px", offset: 0.4, duration: 1.2 },
    { peak: "8px", offset: 0.6, duration: 0.9 },
];

export function CommandPalettePanel({ onClose }: { onClose: () => void }) {
    const router = useRouter();
    const { isDark, toggleTheme } = useTheme();
    const { isPlaying, togglePlay, currentTrack } = useAudio();
    const soundMuted = useSfxMuted();

    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState(0);
    // grabbed once when it opens
    const [sections] = useState(() => (typeof document === "undefined" ? [] : pageSections().map((s) => s.label)));

    const inputRef = useRef<HTMLInputElement>(null);
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
    // only scroll the list for keyboard moves, not the mouse
    const selectedBy = useRef<"key" | "mouse">("key");

    const go = useCallback((href: string) => {
        if (href.startsWith("http") || href.startsWith("mailto")) {
            window.open(href, href.startsWith("http") ? "_blank" : "_self");
        } else {
            router.push(href);
        }
    }, [router]);

    const copy = useCallback(async (text: string, message: string) => {
        try {
            await navigator.clipboard.writeText(text);
            sfx.success();
            showActivity({ kind: "notice", text: message }, 2200);
        } catch {
            showActivity({ kind: "notice", text: "Copy blocked", tone: "error" }, 2200);
        }
    }, []);

    const commands = useMemo<Command[]>(() => {
        const projectCmds: Command[] = projects.map((p) => ({
            id: `project-${p.id}`,
            label: p.title === "Personal Portfolio" ? "This Website" : p.title,
            group: "Projects",
            icon: <FolderGit2 size={15} />,
            keywords: `${p.tags.join(" ")} ${p.description}`,
            hint: p.status,
            // Detail route is gone; send people to the project's own link, falling back to the listing page.
            perform: () => go(p.demo || p.github || '/projects'),
        }));

        const sectionCmds: Command[] = sections.map((label) => ({
            id: `section-${label}`,
            label,
            group: "On this page",
            icon: <Hash size={15} />,
            keywords: "section jump scroll",
            perform: () => {
                const target = pageSections().find((s) => s.label === label);
                if (target) scrollToSection(target.el);
            },
        }));

        return [
            {
                id: "home", label: "Home", group: "Navigation", icon: <Home size={15} />,
                keywords: "start main landing", perform: () => go("/"),
            },
            {
                id: "projects", label: "Projects", group: "Navigation", icon: <FolderGit2 size={15} />,
                keywords: "work build apps", perform: () => go("/projects"),
            },
            {
                id: "writing", label: "Notes", group: "Navigation", icon: <PenLine size={15} />,
                keywords: "notes blog reviews media music", perform: () => go("/writing"),
            },
            ...sectionCmds,
            ...projectCmds,
            {
                id: "theme", label: isDark ? "Switch to Light Mode" : "Switch to Dark Mode",
                group: "Actions", icon: isDark ? <Sun size={15} /> : <Moon size={15} />,
                keywords: "theme dark light appearance toggle", perform: () => { toggleTheme(); },
            },
            {
                id: "music", label: isPlaying ? "Pause Music" : "Play Music",
                group: "Actions", icon: isPlaying ? <Pause size={15} /> : <Play size={15} />,
                keywords: "song newjeans audio sound play pause", perform: () => { togglePlay(); },
            },
            {
                id: "copy-email", label: "Copy Email", group: "Actions", icon: <Mail size={15} />,
                keywords: "contact reach mail address", hint: "kaikimto@gmail.com",
                perform: () => copy("kaikimto@gmail.com", "Email copied"),
            },
            {
                id: "sound", label: soundMuted ? "Turn Sound Effects On" : "Turn Sound Effects Off",
                group: "Actions", icon: soundMuted ? <Volume2 size={15} /> : <VolumeX size={15} />,
                keywords: "sound sfx audio mute unmute quiet volume effects",
                perform: () => setSfxMuted(!soundMuted),
            },
            {
                id: "github", label: "GitHub", group: "Connect", icon: <Github size={15} />,
                keywords: "code source repo open source", hint: "@kaificial", perform: () => go("https://github.com/kaificial"),
            },
            {
                id: "x", label: "X / Twitter", group: "Connect", icon: <XIcon size={14} />,
                keywords: "twitter tweet social", hint: "@kaikimto", perform: () => go("https://x.com/kaikimto"),
            },
            {
                id: "linkedin", label: "LinkedIn", group: "Connect", icon: <Linkedin size={15} />,
                keywords: "professional work network", perform: () => go("https://linkedin.com/in/newjeans"),
            },
            {
                id: "resume", label: "Resume", group: "Connect", icon: <FileText size={15} />,
                keywords: "cv experience pdf download", perform: () => go("/resume"),
            },
            {
                id: "spotify", label: "Spotify", group: "Connect", icon: <Music size={15} />,
                keywords: "music playlist listen", perform: () => go("https://spti.fi/kaikim"),
            },
        ];
    }, [isDark, isPlaying, toggleTheme, togglePlay, go, copy, soundMuted, sections]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return commands;
        const tokens = q.split(/\s+/);
        return commands.filter((c) => {
            const haystack = `${c.label} ${c.group} ${c.keywords ?? ""}`.toLowerCase();
            return tokens.every((t) => haystack.includes(t));
        });
    }, [query, commands]);

    const grouped = useMemo(() => {
        const map = new Map<string, Command[]>();
        for (const c of filtered) {
            if (!map.has(c.group)) map.set(c.group, []);
            map.get(c.group)!.push(c);
        }
        const flat: Command[] = [];
        const order: { group: string; items: Command[] }[] = [];
        for (const g of GROUP_ORDER) {
            const items = map.get(g);
            if (items && items.length) {
                order.push({ group: g, items });
                flat.push(...items);
            }
        }
        return { order, flat };
    }, [filtered]);

    const runCommand = useCallback((cmd: Command | undefined) => {
        if (!cmd) return;
        // commands with their own sound (theme, sound toggle, copy) skip the generic confirm
        if (!['theme', 'sound', 'copy-email'].includes(cmd.id)) sfx.confirm();
        onClose();
        // small delay so the page can scroll again first
        window.setTimeout(() => { cmd.perform(); }, 40);
    }, [onClose]);

    // while open: lock page scroll, focus the search box, close on back/forward
    useEffect(() => {
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const t = window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 80);
        window.addEventListener("popstate", onClose);
        return () => {
            document.body.style.overflow = prevOverflow;
            window.clearTimeout(t);
            window.removeEventListener("popstate", onClose);
        };
    }, [onClose]);

    useEffect(() => {
        if (selectedBy.current !== "key") return;
        itemRefs.current[selected]?.scrollIntoView({ block: "nearest" });
    }, [selected]);

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            const n = Math.max(grouped.flat.length, 1);
            const next = (selected + (e.key === "ArrowDown" ? 1 : -1) + n) % n;
            selectedBy.current = "key";
            setSelected(next);
            // each result is a step up the scale, so arrowing through the list plays it
            sfx.step({ degree: next });
        } else if (e.key === "Enter") {
            e.preventDefault();
            runCommand(grouped.flat[selected]);
        } else if (e.key === "Escape") {
            e.preventDefault();
            onClose();
        }
    };

    const activeId = grouped.flat[selected] ? `cmdk-opt-${grouped.flat[selected].id}` : undefined;

    return (
        <div
            className="cmdk-body"
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            onKeyDown={onKeyDown}
            // don't let clicks bubble up and close the widget
            onClick={(e) => e.stopPropagation()}
        >
            <div className="cmdk-search">
                <Search size={18} strokeWidth={2.25} className="cmdk-search-icon" />
                <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); selectedBy.current = "key"; setSelected(0); }}
                    placeholder="Search or jump to…"
                    spellCheck={false}
                    autoComplete="off"
                    role="combobox"
                    aria-expanded="true"
                    aria-controls="cmdk-listbox"
                    aria-activedescendant={activeId}
                />
                <kbd className="cmdk-key">esc</kbd>
            </div>

            <motion.div className="cmdk-list" id="cmdk-listbox" role="listbox" layoutScroll data-lenis-prevent>
                {grouped.flat.length === 0 && (
                    <div className="cmdk-empty">
                        <Search size={22} strokeWidth={1.75} />
                        <span>No results for &ldquo;{query}&rdquo;</span>
                    </div>
                )}

                {grouped.order.map(({ group, items }) => (
                    <div key={group} className="cmdk-group" role="group" aria-label={group}>
                        <div className="cmdk-group-label">{group}</div>
                        {items.map((cmd) => {
                            const idx = grouped.flat.indexOf(cmd);
                            const isSel = idx === selected;
                            return (
                                <button
                                    key={cmd.id}
                                    id={`cmdk-opt-${cmd.id}`}
                                    ref={(el) => { itemRefs.current[idx] = el; }}
                                    className={`cmdk-item ${isSel ? "is-selected" : ""}`}
                                    role="option"
                                    aria-selected={isSel}
                                    tabIndex={-1}
                                    onMouseMove={() => { if (idx !== selected) { selectedBy.current = "mouse"; setSelected(idx); } }}
                                    onClick={() => runCommand(cmd)}
                                >
                                    {/* blue highlight that slides between rows */}
                                    {isSel && (
                                        <motion.span layoutId="cmdk-highlight" className="cmdk-highlight" transition={SPRING_SNAPPY} />
                                    )}
                                    <span className="cmdk-tile">{cmd.icon}</span>
                                    <span className="cmdk-item-label">{cmd.label}</span>
                                    {cmd.hint && <span className="cmdk-item-hint">{cmd.hint}</span>}
                                    <CornerDownLeft size={14} className="cmdk-item-enter" aria-hidden />
                                </button>
                            );
                        })}
                    </div>
                ))}
            </motion.div>

            <div className="cmdk-footer">
                {/* current song, so the music is still there */}
                <button
                    className="cmdk-now-playing"
                    onClick={() => { sfx.toggle(!isPlaying); togglePlay(); }}
                    aria-label={isPlaying ? "Pause music" : "Play music"}
                >
                    <span className="cmdk-np-art" style={{ backgroundImage: `url(${currentTrack.cover})` }} />
                    <span className="cmdk-np-wave" aria-hidden>
                        {isPlaying
                            ? WAVE.map((w, i) => (
                                <span
                                    key={i}
                                    style={{
                                        "--bar-peak": w.peak,
                                        animation: `wave-bar ${w.duration}s ease-in-out -${w.offset}s infinite`,
                                    } as React.CSSProperties}
                                />
                            ))
                            : <Play size={10} fill="currentColor" />}
                    </span>
                    <span className="cmdk-np-text">
                        {currentTrack.title} <span>· {currentTrack.artist}</span>
                    </span>
                </button>
                <span className="cmdk-keys">
                    <span><kbd className="cmdk-key">↑</kbd><kbd className="cmdk-key">↓</kbd> move</span>
                    <span><kbd className="cmdk-key">↵</kbd> open</span>
                </span>
            </div>
        </div>
    );
}
