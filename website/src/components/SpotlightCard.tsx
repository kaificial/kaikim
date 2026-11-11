"use client";

import { motion } from 'framer-motion';
import React from 'react';
import { SPRING } from '../styles/motion';

interface SpotlightCardProps {
    children: React.ReactNode;
    isDark: boolean;
    noPadding?: boolean;
}

// normal and hover shadows. both have two layers so framer can animate between them
const SHADOW = {
    dark: ['0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)', '0 14px 24px -8px rgba(0, 0, 0, 0.7), 0 4px 8px -2px rgba(0, 0, 0, 0.4)'],
    light: ['0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', '0 18px 30px -8px rgba(0, 0, 0, 0.16), 0 6px 10px -4px rgba(0, 0, 0, 0.08)'],
};

export const SpotlightCard = ({ children, isDark, noPadding = false }: SpotlightCardProps) => (
    <motion.div
        className="group relative"
        // on hover it lifts a bit, the shadow gets deeper and the border gets darker. no scaling,
        // that makes the text and video blurry. the normal look is in style (not animate) so a
        // theme switch changes it instantly, otherwise the theme wave catches it halfway
        whileHover={{
            y: -4,
            boxShadow: SHADOW[isDark ? 'dark' : 'light'][1],
            borderColor: isDark ? '#3a3a3a' : '#d1d5db',
        }}
        transition={SPRING}
        style={{
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: isDark ? '#2a2a2a' : '#e5e7eb',
            boxShadow: SHADOW[isDark ? 'dark' : 'light'][0],
            borderRadius: '8px',
            padding: noPadding ? '0' : '16px',
            backgroundColor: isDark ? '#141414' : 'white',
            position: 'relative',
            overflow: 'hidden',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
        }}
    >
        <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', flex: 1 }}>
            {children}
        </div>
    </motion.div>
);
