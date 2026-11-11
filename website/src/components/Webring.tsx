"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { useTheme } from "./ThemeContext";
import { sfx } from "../lib/sfx";
import { SPRING } from "../styles/motion";

const SITE = "kaificial.vercel.app";
const RING = "https://queensu-webring.ca/";
const BLUE = "#3b82f6"; // same blue as the links

// the ring around the logo, measured on the 1024px png. it starts on the left and goes along
// the bottom first, so the first half of the lap is in front of the crest and the rest is behind
const ORBIT = "M127 487 A410 150 0 0 0 947 487 A410 150 0 0 0 127 487";
const ORBIT_S = 4.2; // seconds for one lap

/** little blue comet that goes around the ring and fades when it goes behind the crest */
const Comet = ({ bright }: { bright: boolean }) => (
    <svg
        viewBox="0 0 1024 1024"
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}
    >
        <defs>
            <radialGradient id="webring-glow">
                <stop offset="0%" stopColor={BLUE} stopOpacity="0.9" />
                <stop offset="100%" stopColor={BLUE} stopOpacity="0" />
            </radialGradient>
        </defs>
        <g transform="rotate(-20 537 487)" style={{ opacity: bright ? 1 : 0.85, transition: 'opacity 0.3s var(--ease-out)' }}>
            {[0, 0.09, 0.18, 0.27].map((lag, i) => (
                <g key={i} opacity={1 - i * 0.24}>
                    {/* bright in front, fades going behind, comes back on the way round */}
                    <animate attributeName="opacity" dur={`${ORBIT_S}s`} begin={`-${ORBIT_S - lag}s`} repeatCount="indefinite"
                        values="1;1;0.12;0.12;1" keyTimes="0;0.46;0.56;0.94;1" />
                    <animateMotion dur={`${ORBIT_S}s`} begin={`-${ORBIT_S - lag}s`} repeatCount="indefinite" path={ORBIT} />
                    {i === 0 && <circle r={bright ? 120 : 90} fill="url(#webring-glow)" />}
                    <circle r={i === 0 ? 30 : 26 - i * 5} fill={BLUE} />
                </g>
            ))}
        </g>
    </svg>
);

export default function Webring() {
    const { isDark } = useTheme();
    const reduce = useReducedMotion();
    // -1 = leaning left, 1 = leaning right
    const [lean, setLean] = useState<-1 | 0 | 1>(0);
    const [hovered, setHovered] = useState(false);
    const iconSrc = isDark ? "/assets/icon-white.png" : "/assets/icon-black.png";

    const arrow = (dir: -1 | 1) => (
        <motion.a
            href={`${RING}#${SITE}?nav=${dir < 0 ? 'prev' : 'next'}`}
            aria-label={`${dir < 0 ? 'Previous' : 'Next'} site in the webring`}
            onPointerEnter={(e) => { if (e.pointerType === 'mouse') setLean(dir); }}
            onPointerLeave={() => setLean(0)}
            onClick={() => sfx.press()}
            animate={{ x: !reduce && lean === dir ? dir * 3 : 0 }}
            transition={SPRING}
            style={{ color: isDark ? '#f5f5f5' : 'black', textDecoration: 'none', fontSize: '1.2rem', padding: '4px 8px' }}
        >
            {dir < 0 ? '←' : '→'}
        </motion.a>
    );

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '8px 0', opacity: 0.8 }}>
            {arrow(-1)}
            <motion.a
                href={`${RING}#${SITE}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Queen's Computing Webring"
                onPointerEnter={(e) => { if (e.pointerType === 'mouse') setHovered(true); }}
                onPointerLeave={() => setHovered(false)}
                onClick={() => sfx.press()}
                animate={reduce ? undefined : { rotate: lean * 12, x: lean * 2, y: hovered ? -2 : 0, scale: hovered ? 1.08 : 1 }}
                transition={SPRING}
                style={{ position: 'relative', display: 'flex', alignItems: 'center', width: 40, height: 40 }}
            >
                <Image src={iconSrc} alt="" width={40} height={40} style={{ width: '40px', height: '40px' }} />
                {!reduce && <Comet bright={hovered || lean !== 0} />}
            </motion.a>
            {arrow(1)}
        </div>
    );
}
