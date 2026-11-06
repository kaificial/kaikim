"use client";

import React, { useRef, useEffect } from 'react';
import { useGSAP } from '@/hooks/useGSAP';
import { easings, durations, scrollTriggerDefaults } from '@/lib/animationConfig';
import gsap from 'gsap';

/**
 * scroll reveal component using gsap scrolltrigger
 * reveals children with customizable animations when scrolling into view
 */

interface ScrollRevealProps {
    children: React.ReactNode;
    animation?: 'fadeUp' | 'fadeDown' | 'fadeLeft' | 'fadeRight' | 'scale' | 'fade';
    duration?: number;
    delay?: number;
    stagger?: number;
    className?: string;
    triggerStart?: string;
    once?: boolean;
}

export function ScrollReveal({
    children,
    animation = 'fadeUp',
    duration = durations.slow,
    delay = 0,
    stagger = 0,
    className = '',
    triggerStart = scrollTriggerDefaults.start,
    once = true,
}: ScrollRevealProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        if (!containerRef.current) return;

        // dynamically import scrolltrigger
        import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
            gsap.registerPlugin(ScrollTrigger);

            const elements = containerRef.current!.children;
            if (elements.length === 0) return;

            // animation configurations
            const animations = {
                fadeUp: { y: 24, opacity: 0 },
                fadeDown: { y: -24, opacity: 0 },
                fadeLeft: { x: -24, opacity: 0 },
                fadeRight: { x: 24, opacity: 0 },
                scale: { scale: 0.95, opacity: 0 },
                fade: { opacity: 0 },
            };

            const fromVars = animations[animation];

            gsap.fromTo(
                elements,
                fromVars,
                {
                    y: 0,
                    x: 0,
                    scale: 1,
                    opacity: 1,
                    duration,
                    delay,
                    stagger,
                    ease: easings.gsap.smooth,
                    scrollTrigger: {
                        trigger: containerRef.current,
                        start: triggerStart,
                        toggleActions: once ? 'play none none none' : scrollTriggerDefaults.toggleActions,
                        markers: false,
                    },
                }
            );
        });
    }, { scope: containerRef });

    return (
        <div ref={containerRef} className={className}>
            {children}
        </div>
    );
}
