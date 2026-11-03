"use client";

import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { mouseOnly } from '../styles/motion';
import { sfx } from '../lib/sfx';



interface HeroPhoto {
    src: string;
    alt: string;
    caption: string;
    objectPosition?: string;
    brighten?: boolean;
}

const PHOTOS: HeroPhoto[] = [
    { src: "/assets/pfp.jpg", alt: "Kai Kim", caption: "Hello", objectPosition: "25% 50%", brighten: true },
    { src: "/assets/latte (2).jpg", alt: "Latte", caption: "My dawg", objectPosition: "center" },
    { src: "/assets/van_latte.png", alt: "Van and Latte", caption: "Hi", objectPosition: "center" },
];

// per depth resting transform (depth 0 = the active top card)
const STACK = [
    { x: 0, y: 0, rotate: 0, scale: 1 },
    { x: 8, y: 5, rotate: 6, scale: 0.95 },
    { x: -6, y: 8, rotate: -5, scale: 0.9 },
];

export default function HeroPhotoStack({ isDark }: { isDark: boolean }) {
    const [active, setActive] = useState(0);
    const [hovered, setHovered] = useState(false);
    const n = PHOTOS.length;

    const advance = () => {
        setActive((a) => (a + 1) % n);
        sfx.paper();
    };

    const tooltipBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)";

    return (
        <div
            role="button"
            tabIndex={0}
            aria-label="Photo gallery — click to flip through"
            onClick={advance}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    advance();
                }
            }}
            onPointerEnter={mouseOnly(() => setHovered(true))}
            onPointerLeave={mouseOnly(() => setHovered(false))}
            style={{
                position: "relative",
                width: "112px",
                height: "112px",
                flexShrink: 0,
                cursor: "pointer",
                outline: "none",
            }}
        >
            {/* Caption for the active photo */}
            <AnimatePresence mode="wait">
                {hovered && (
                    <motion.div
                        key={active}
                        initial={{ opacity: 0, scale: 0.8, rotate: -25 }}
                        animate={{ opacity: 1, scale: 1, rotate: -12 }}
                        exit={{ opacity: 0, scale: 0.8, rotate: -25 }}
                        transition={{ duration: 0.2, ease: "backOut" }}
                        style={{
                            position: "absolute",
                            top: "-34px",
                            left: "-8px",
                            backgroundColor: isDark ? "#181818" : "white",
                            color: isDark ? "#f5f5f5" : "#1f2937",
                            padding: "4px 10px",
                            borderRadius: "8px",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                            zIndex: 30,
                            pointerEvents: "none",
                            whiteSpace: "nowrap",
                            border: `1px solid ${tooltipBorder}`,
                        }}
                    >
                        {PHOTOS[active].caption}
                        <div
                            style={{
                                position: "absolute",
                                bottom: "-5px",
                                left: "16px",
                                width: "10px",
                                height: "10px",
                                backgroundColor: isDark ? "#181818" : "white",
                                transform: "rotate(45deg)",
                                borderBottom: `1px solid ${tooltipBorder}`,
                                borderRight: `1px solid ${tooltipBorder}`,
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Stacked cards */}
            {PHOTOS.map((photo, i) => {
                const depth = (i - active + n) % n;
                const base = STACK[Math.min(depth, STACK.length - 1)];
                // back cards fan out further on hover; the top card lifts kinda
                const spread = hovered ? 1.7 : 1;
                const target =
                    depth === 0
                        ? { x: 0, y: hovered ? -6 : 0, rotate: 0, scale: 1 }
                        : {
                            x: base.x * spread,
                            y: base.y * spread,
                            rotate: base.rotate * (hovered ? 1.3 : 1),
                            scale: base.scale,
                        };

                return (
                    <motion.div
                        key={photo.src}
                        initial={false}
                        animate={{ ...target, opacity: depth >= STACK.length ? 0 : 1 }}
                        transition={{ type: "spring", stiffness: 320, damping: 26 }}
                        style={{
                            position: "absolute",
                            inset: 0,
                            zIndex: n - depth,
                            borderRadius: "18px",
                            overflow: "hidden",
                            backgroundColor: isDark ? "#181818" : "#ffffff",
                            border: `2px solid ${isDark ? "#2a2a2a" : "#ffffff"}`,
                            boxShadow:
                                depth === 0
                                    ? isDark
                                        ? "0 10px 24px rgba(0,0,0,0.6)"
                                        : "0 10px 24px rgba(0,0,0,0.18)"
                                    : isDark
                                        ? "0 4px 12px rgba(0,0,0,0.45)"
                                        : "0 4px 12px rgba(0,0,0,0.12)",
                            pointerEvents: "none",
                        }}
                    >
                        <Image
                            src={photo.src}
                            alt={photo.alt}
                            fill
                            sizes="112px"
                            priority={i === 0}
                            style={{
                                objectFit: "cover",
                                objectPosition: photo.objectPosition || "center",
                                filter: photo.brighten ? "brightness(1.12)" : "none",
                            }}
                        />
                    </motion.div>
                );
            })}

            {/* Counter badge */}
            <div
                style={{
                    position: "absolute",
                    bottom: "-6px",
                    right: "-6px",
                    zIndex: n + 5,
                    minWidth: "30px",
                    padding: "2px 6px",
                    borderRadius: "9999px",
                    backgroundColor: isDark ? "#141414" : "#1c1917",
                    color: "#fafafa",
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    fontFamily: "var(--font-mono), monospace",
                    textAlign: "center",
                    letterSpacing: "0.02em",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.15)"}`,
                    pointerEvents: "none",
                }}
            >
                {active + 1}/{n}
            </div>
        </div>
    );
}
