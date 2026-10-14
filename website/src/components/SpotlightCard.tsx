"use client";

import { motion, useMotionValue, useMotionTemplate } from 'framer-motion';
import React from 'react';

interface SpotlightCardProps {
    children: React.ReactNode;
    isDark: boolean;
    noPadding?: boolean;
    /** The blue cursor-tracking glow. Off for cards that carry their own media. */
    spotlight?: boolean;
}

export const SpotlightCard = ({ children, isDark, noPadding = false, spotlight = true }: SpotlightCardProps) => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Hook has to run unconditionally, so build the gradient either way.
    const glow = useMotionTemplate`
        radial-gradient(
            350px circle at ${mouseX}px ${mouseY}px,
            rgba(37, 99, 235, 0.15),
            transparent 80%
        )
    `;

    function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    return (
        <motion.div
            onMouseMove={handleMouseMove}
            className="group relative"
            initial={{ scale: 0.99 }}
            whileInView={{ scale: 0.99 }}
            whileHover={{ scale: 1.01, y: -5 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            style={{
                border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                borderRadius: '8px',
                padding: noPadding ? '0' : '16px',
                backgroundColor: isDark ? '#171717' : 'white',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: isDark
                    ? '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)'
                    : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            {spotlight && (
                <motion.div
                    className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100"
                    style={{ background: glow, transition: 'opacity 0.3s' }}
                />
            )}
            <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', flex: 1 }}>
                {children}
            </div>
        </motion.div>
    );
};
