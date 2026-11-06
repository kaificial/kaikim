"use client";

import { MotionConfig } from 'framer-motion';
import type { ReactNode } from 'react';
import { SPRING_SNAPPY } from '../styles/motion';

// default motion for the whole site: smooth springs with no bounce, and it respects
// reduced motion
export const MotionProvider = ({ children }: { children: ReactNode }) => (
    <MotionConfig reducedMotion="user" transition={SPRING_SNAPPY}>
        {children}
    </MotionConfig>
);
