"use client";

import { motion, useReducedMotion } from 'framer-motion';

/** small 1-bit map of toronto with a downtown pin */

const W = 140;
const H = 76;

const INK = 'rgba(255,255,255,0.9)';
const FAINT = 'rgba(255,255,255,0.16)';

// shoreline
const SHORE = 'M0,50 C10,51 18,57 28,56 C36,55 42,54 50,53 L82,52 C88,52 92,52 98,49 L112,43 C122,39 132,34 140,31';
const LAND = `${SHORE} L140,0 L0,0 Z`;

// toronto islands
const ISLANDS = 'M56,58 C62,63.5 76,64.5 85,57.5 C78,60.8 66,61 59,56.6 Z';
// leslie street spit
const SPIT = 'M88,52 L93,59 L96,63 M93,59 L96,58.5 M95,61.4 L92.6,62';
// rivers
const HUMBER = 'M27,56 C26,48 29,42 25,34 C22,27 26,20 23,12 C21,7 23,3 22,0';
const DON = 'M84,52 C85,46 82,41 85,35 C88,29 84,24 87,17 C89,12 87,6 88,0 M85,35 C90,31 93,27 97,22 C100,18 99,10 102,0';

// main roads
const ROADS = [
    'M0,40 L140,36', // bloor / danforth
    'M0,25 L140,21', // eglinton
    'M0,13 C40,11 90,8 140,6', // 401
    'M0,47 C14,49 24,52 34,52 L84,50 C92,49 100,45 112,40', // gardiner / lake shore
    'M71,51 L68,0', // yonge
    'M44,54 L41,0', // bathurst-ish
    'M56,53 L53,0', // spadina-ish
    'M14,50 L11,0',
    'M98,48 L95,0',
    'M120,39 L117,0',
];

const PIN = { x: 70, y: 48 };

const TorontoMap = () => {
    const reduceMotion = useReducedMotion();
    return (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" style={{ display: 'block' }}>
            <defs>
                {/* lake */}
                <pattern id="tc-water" width="3" height="3" patternUnits="userSpaceOnUse">
                    <rect width="1" height="1" fill="rgba(255,255,255,0.32)" />
                </pattern>
                <clipPath id="tc-land"><path d={LAND} /></clipPath>
            </defs>

            <rect width={W} height={H} fill="#0a0a0a" />
            <rect width={W} height={H} fill="url(#tc-water)" />
            <path d={LAND} fill="#0a0a0a" />

            <g clipPath="url(#tc-land)" fill="none" stroke={FAINT} strokeWidth="0.75">
                {ROADS.map((d) => <path key={d} d={d} />)}
            </g>
            <g fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1" strokeLinecap="round">
                <path d={HUMBER} />
                <path d={DON} />
            </g>

            <path d={SHORE} fill="none" stroke={INK} strokeWidth="1" />
            <path d={ISLANDS} fill="#0a0a0a" stroke={INK} strokeWidth="0.9" />
            <path d={SPIT} fill="none" stroke={INK} strokeWidth="0.9" strokeLinecap="round" />

            {/* downtown pin */}
            {!reduceMotion && (
                <motion.circle
                    cx={PIN.x}
                    cy={PIN.y}
                    fill="none"
                    stroke="#fff"
                    strokeWidth="0.8"
                    initial={{ r: 2, opacity: 0.8 }}
                    animate={{ r: 7, opacity: 0 }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
                />
            )}
            <circle cx={PIN.x} cy={PIN.y} r="2.2" fill="#fff" />
            <circle cx={PIN.x} cy={PIN.y} r="0.9" fill="#0a0a0a" />
        </svg>
    );
};

export const TorontoCard = () => (
    <div
        role="img"
        aria-label="Map of Toronto, 43°39′ N 79°23′ W"
        style={{
            padding: '4px',
            background: '#0a0a0a',
            border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.08)',
        }}
    >
        <div style={{ border: '1px solid rgba(255,255,255,0.28)', borderRadius: '3px', overflow: 'hidden' }}>
            <TorontoMap />
        </div>
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '6px',
            padding: '4px 1px 0',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
            fontSize: '9px',
            letterSpacing: '0.02em',
            color: '#e5e5e5',
            whiteSpace: 'nowrap',
        }}>
            <span>43°39&apos;11&quot; N</span>
            <span>79°22&apos;59&quot; W</span>
        </div>
    </div>
);
