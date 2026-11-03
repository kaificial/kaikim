"use client";

import { motion, useScroll, useSpring } from 'framer-motion';

/** thin progress bar stuck to the top of the screen */
export const ScrollProgress = () => {
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

    return (
        <motion.div
            style={{
                scaleX,
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                backgroundColor: '#2563eb', // matches the "View All Projects" button
                transformOrigin: '0%',
                zIndex: 9999
            }}
        />
    );
};
