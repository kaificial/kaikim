"use client";

import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
    ArrowUp,
    ArrowDown,
    Search,
} from "lucide-react";
import { useTheme } from "./ThemeContext";
import { useAudio } from "./AudioContext";
import { projects } from "../data/projects";
import { useUISound } from "../hooks/use-ui-sound";

interface Command {
    id: string;
    label: string;
    group: string;
    icon: ReactNode;
    keywords?: string;
    hint?: string;
    perform: () => void | Promise<void>;
}

const GROUP_ORDER = ["Navigation", "Projects", "Actions", "Connect"];

const XIcon = ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

export default function CommandPalette() {
    const router = useRouter();
    const { isDark, toggleTheme } = useTheme();
    const { isPlaying, togglePlay } = useAudio();
    const { playClick } = useUISound();
    
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState(0);
    const [toast, setToast] = useState<string | null>(null);

    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showToast = useCallback((message: string) => {
        setToast(message);
        if (toastTimer.current) clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToast(null), 2600);
    }, []);

    const close = useCallback(() => {
        setIsOpen(false);
        setQuery("");
    }, []);

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
            showToast(message);
        } catch {
            showToast("Couldn't copy — your browser blocked it");
        }
    }, [showToast]);

    const commands = useMemo<Command[]>(() => {
        const projectCmds: Command[] = projects.map((p) => ({
            id: `project-${p.id}`,
            label: p.title === "Personal Portfolio" ? "This Website" : p.title,
            group: "Projects",
            icon: <FolderGit2 size={16} />,
            keywords: `${p.tags.join(" ")} ${p.description}`,
            hint: p.status,
            // Detail route is gone; send people to the project's own link, falling back to the listing page.
            perform: () => go(p.demo || p.github || '/projects'),
        }));

        return [
            {
                id: "home", label: "Home", group: "Navigation", icon: <Home size={16} />,
                keywords: "start main landing", perform: () => go("/"),
            },
            {
                id: "projects", label: "Projects", group: "Navigation", icon: <FolderGit2 size={16} />,
                keywords: "work build apps", perform: () => go("/projects"),
            },
            {
                id: "writing", label: "Notes", group: "Navigation", icon: <PenLine size={16} />,
                keywords: "notes blog reviews media music", perform: () => go("/writing"),
            },
            ...projectCmds,
            {
                id: "theme", label: isDark ? "Switch to Light Mode" : "Switch to Dark Mode",
                group: "Actions", icon: isDark ? <Sun size={16} /> : <Moon size={16} />,
                keywords: "theme dark light appearance toggle", perform: () => { toggleTheme(); },
            },
            {
                id: "music", label: isPlaying ? "Pause Music" : "Play Music",
                group: "Actions", icon: isPlaying ? <Pause size={16} /> : <Play size={16} />,
                keywords: "song newjeans audio sound play pause", perform: () => { togglePlay(); },
            },
            {
                id: "copy-email", label: "Copy Email", group: "Actions", icon: <Mail size={16} />,
                keywords: "contact reach mail address", hint: "kaikimto@gmail.com",
                perform: () => copy("kaikimto@gmail.com", "Email copied to clipboard ✓"),
            },
            {
                id: "github", label: "GitHub", group: "Connect", icon: <Github size={16} />,
                keywords: "code source repo open source", hint: "@kaificial", perform: () => go("https://github.com/kaificial"),
            },
            {
                id: "x", label: "X / Twitter", group: "Connect", icon: <XIcon size={15} />,
                keywords: "twitter tweet social", hint: "@kaijinju", perform: () => go("https://x.com/kaijinju"),
            },
            {
                id: "linkedin", label: "LinkedIn", group: "Connect", icon: <Linkedin size={16} />,
                keywords: "professional work network", perform: () => go("https://linkedin.com/in/newjeans"),
            },
            {
                id: "resume", label: "Resume", group: "Connect", icon: <FileText size={16} />,
                keywords: "cv experience pdf download", perform: () => go("/resume"),
            },
            {
                id: "spotify", label: "Spotify", group: "Connect", icon: <Music size={16} />,
                keywords: "music playlist listen", perform: () => go("https://spti.fi/kaikim"),
            },
        ];
    }, [isDark, isPlaying, toggleTheme, togglePlay, go, copy]);

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
        playClick();
        close();
        window.setTimeout(() => { cmd.perform(); }, 10);
    }, [close, playClick]);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                setIsOpen((prev) => {
                    if (!prev) { try { } catch { /* noop */ } }
                    return !prev;
                });
            }
        };

        const onOpenEvent = () => {
            setIsOpen(true);
            try { } catch { /* noop */ }
        };

        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("open-command-palette", onOpenEvent);
        return () => {
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("open-command-palette", onOpenEvent);
        };
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            setSelected(0);
            const prevOverflow = document.body.style.overflow;
            document.body.style.overflow = "hidden";
            const t = window.setTimeout(() => inputRef.current?.focus(), 40);
            return () => {
                document.body.style.overflow = prevOverflow;
                window.clearTimeout(t);
            };
        }
    }, [isOpen]);

    useEffect(() => { setSelected(0); }, [query]);

    useEffect(() => {
        const el = itemRefs.current[selected];
        if (el) el.scrollIntoView({ block: "nearest" });
    }, [selected]);

    const onListKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelected((s) => {
                const next = (s + 1) % Math.max(grouped.flat.length, 1);
                try { } catch { /* noop */ }
                return next;
            });
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelected((s) => {
                const next = (s - 1 + grouped.flat.length) % Math.max(grouped.flat.length, 1);
                try { } catch { /* noop */ }
                return next;
            });
        } else if (e.key === "Enter") {
            e.preventDefault();
            runCommand(grouped.flat[selected]);
        } else if (e.key === "Escape") {
            e.preventDefault();
            close();
        }
    };

    const panelBg = isDark ? "#111110" : "#ffffff";
    const border = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)";
    const textColor = isDark ? "#fafafa" : "#1c1917";
    const subText = isDark ? "#9ca3af" : "#6b7280";
    const groupColor = isDark ? "#6b7280" : "#9ca3af";
    const selectedBg = isDark ? "rgba(59,130,246,0.16)" : "rgba(37,99,235,0.10)";
    const accent = "#2563eb";

    let runningIndex = -1;

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="cmdk-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        onMouseDown={close}
                    >
                        <motion.div
                            className="cmdk-panel"
                            initial={{ opacity: 0, scale: 0.96, y: -8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.97, y: -6 }}
                            transition={{ type: "spring", stiffness: 460, damping: 34 }}
                            onMouseDown={(e) => e.stopPropagation()}
                            onKeyDown={onListKeyDown}
                            style={{
                                backgroundColor: panelBg,
                                border: `1px solid ${border}`,
                                color: textColor,
                            }}
                        >
                            <div className="cmdk-search" style={{ borderBottom: `1px solid ${border}` }}>
                                <Search size={17} color={subText} style={{ flexShrink: 0 }} />
                                <input
                                    ref={inputRef}
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Type a command or search…"
                                    spellCheck={false}
                                    autoComplete="off"
                                    style={{ color: textColor }}
                                />
                                <kbd className="cmdk-esc" style={{ borderColor: border, color: subText }}>esc</kbd>
                            </div>

                            <div className="cmdk-list" ref={listRef}>
                                {grouped.flat.length === 0 && (
                                    <div className="cmdk-empty" style={{ color: subText }}>
                                        No results for &ldquo;{query}&rdquo;
                                    </div>
                                )}

                                {grouped.order.map(({ group, items }) => (
                                    <div key={group} className="cmdk-group">
                                        <div className="cmdk-group-label" style={{ color: groupColor }}>
                                            {group}
                                        </div>
                                        {items.map((cmd) => {
                                            runningIndex += 1;
                                            const idx = runningIndex;
                                            const isSel = idx === selected;
                                            return (
                                                <button
                                                    key={cmd.id}
                                                    ref={(el) => { itemRefs.current[idx] = el; }}
                                                    className="cmdk-item"
                                                    onMouseMove={() => setSelected(idx)}
                                                    onClick={() => runCommand(cmd)}
                                                    style={{
                                                        backgroundColor: isSel ? selectedBg : "transparent",
                                                        color: textColor,
                                                    }}
                                                >
                                                    <span
                                                        className="cmdk-item-icon"
                                                        style={{ color: isSel ? accent : subText }}
                                                    >
                                                        {cmd.icon}
                                                    </span>
                                                    <span className="cmdk-item-label">{cmd.label}</span>
                                                    {cmd.hint && (
                                                        <span className="cmdk-item-hint" style={{ color: subText, borderColor: border }}>
                                                            {cmd.hint}
                                                        </span>
                                                    )}
                                                    {isSel && (
                                                        <CornerDownLeft size={14} color={subText} style={{ flexShrink: 0 }} />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>

                            <div className="cmdk-footer" style={{ borderTop: `1px solid ${border}`, color: subText }}>
                                <span className="cmdk-foot-item"><ArrowUp size={12} /><ArrowDown size={12} /> navigate</span>
                                <span className="cmdk-foot-item"><CornerDownLeft size={12} /> select</span>
                                <span className="cmdk-foot-item"><kbd style={{ borderColor: border }}>esc</kbd> close</span>
                                <span className="cmdk-foot-brand">kaikim.ca</span>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {toast && (
                    <motion.div
                        className="cmdk-toast"
                        initial={{ opacity: 0, y: 16, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 28 }}
                        style={{
                            backgroundColor: isDark ? "#171717" : "#1c1917",
                            color: "#fafafa",
                            border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.08)"}`,
                        }}
                    >
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
