"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "./ThemeContext";

// minimal replacement for the native scrollbar on mouse devices.
// a column of dots on the right edge; the dots around your current position stretch
// into bars, like a magnified wave that slides down the page as you scroll.
// clicking or dragging the column scrubs the page.

const SPACING = 10; // px between ticks
const DOT = 1.5; // resting tick size
const PEAK = 16; // longest bar at the current position
const SIGMA = 2.4; // spread of the wave, in ticks
const IDLE_MS = 1200; // fades back after this long without scrolling or hovering
const EASE = 0.18; // how quickly the wave catches up to the scroll position

export default function ScrollRail() {
    const { isDark } = useTheme();
    const [enabled, setEnabled] = useState(false);
    const [count, setCount] = useState(0);
    const railRef = useRef<HTMLDivElement>(null);
    const ticksRef = useRef<(HTMLDivElement | null)[]>([]);
    const dragging = useRef(false);

    // only on mouse/trackpad devices, same gate as the slim scrollbar styles
    useEffect(() => {
        const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
        const update = () => setEnabled(mq.matches);
        update();
        mq.addEventListener("change", update);
        return () => mq.removeEventListener("change", update);
    }, []);

    // hide the native bar on the root while the rail is active
    useEffect(() => {
        if (!enabled) return;
        document.documentElement.classList.add("has-scroll-rail");
        return () => document.documentElement.classList.remove("has-scroll-rail");
    }, [enabled]);

    // number of ticks follows the rail height
    useEffect(() => {
        if (!enabled) return;
        const rail = railRef.current;
        if (!rail) return;
        const ro = new ResizeObserver(() => setCount(Math.max(2, Math.floor(rail.clientHeight / SPACING) + 1)));
        ro.observe(rail);
        return () => ro.disconnect();
    }, [enabled]);

    // animate tick lengths straight on the DOM so scrolling never re-renders react
    useEffect(() => {
        if (!enabled || count === 0) return;
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        let raf = 0;
        let current = -1;
        let awake = false;
        let hovering = false;
        let idleTimer = 0;

        const setRailOpacity = () => {
            const rail = railRef.current;
            if (!rail) return;
            const scrollable = document.documentElement.scrollHeight > window.innerHeight + 1;
            rail.style.opacity = !scrollable ? "0" : awake || hovering ? "1" : "0.4";
        };

        const wake = () => {
            awake = true;
            setRailOpacity();
            clearTimeout(idleTimer);
            idleTimer = window.setTimeout(() => {
                awake = false;
                setRailOpacity();
            }, IDLE_MS);
        };

        const rail = railRef.current;
        const onEnter = () => { hovering = true; setRailOpacity(); };
        const onLeave = () => { hovering = false; setRailOpacity(); };
        rail?.addEventListener("pointerenter", onEnter);
        rail?.addEventListener("pointerleave", onLeave);

        const target = () => {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            const p = max > 0 ? window.scrollY / max : 0;
            return Math.min(1, Math.max(0, p)) * (count - 1);
        };

        const paint = (center: number) => {
            setRailOpacity();
            for (let i = 0; i < count; i++) {
                const el = ticksRef.current[i];
                if (!el) continue;
                const d = i - center;
                const k = Math.exp(-(d * d) / (2 * SIGMA * SIGMA));
                el.style.width = `${DOT + (PEAK - DOT) * k}px`;
                el.style.opacity = `${0.25 + 0.55 * k}`;
            }
        };

        const tick = () => {
            const t = target();
            if (current < 0 || reduceMotion) current = t;
            else current += (t - current) * EASE;
            if (Math.abs(t - current) < 0.001) current = t;
            paint(current);
            raf = current === t ? 0 : requestAnimationFrame(tick);
        };

        const kick = () => {
            if (!raf) raf = requestAnimationFrame(tick);
        };

        const onScroll = () => {
            wake();
            kick();
        };

        tick();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", kick);
        const ro = new ResizeObserver(kick);
        ro.observe(document.body);
        return () => {
            cancelAnimationFrame(raf);
            clearTimeout(idleTimer);
            rail?.removeEventListener("pointerenter", onEnter);
            rail?.removeEventListener("pointerleave", onLeave);
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", kick);
            ro.disconnect();
        };
    }, [enabled, count]);

    if (!enabled) return null;

    const scrubTo = (clientY: number) => {
        const rail = railRef.current;
        if (!rail) return;
        const rect = rail.getBoundingClientRect();
        const frac = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
        const max = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo({ top: frac * max, behavior: "auto" });
    };

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (e.button !== 0) return;
        e.preventDefault();
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        scrubTo(e.clientY);
    };
    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (dragging.current) scrubTo(e.clientY);
    };
    const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        dragging.current = false;
        if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    };

    const color = isDark ? "#e6e6e6" : "#111827";

    return (
        <div
            ref={railRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            aria-hidden="true"
            style={{
                position: "fixed",
                top: "50%",
                right: 10,
                height: "min(60vh, 520px)",
                transform: "translateY(-50%)",
                width: PEAK + 8,
                zIndex: 900,
                cursor: "pointer",
                touchAction: "none",
                userSelect: "none",
                transition: "opacity 0.4s var(--ease-out)",
            }}
        >
            {Array.from({ length: count }, (_, i) => (
                <div
                    key={i}
                    ref={(el) => {
                        ticksRef.current[i] = el;
                    }}
                    style={{
                        position: "absolute",
                        right: 0,
                        top: i * SPACING - DOT / 2,
                        width: DOT,
                        height: DOT,
                        borderRadius: DOT,
                        background: color,
                        opacity: 0.25,
                        pointerEvents: "none",
                    }}
                />
            ))}
        </div>
    );
}
