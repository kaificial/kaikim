"use client";

import { useEffect } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

// shared so other components can scroll with it too
let instance: Lenis | null = null;
export const getLenis = () => instance;

// smooth scrolling for mouse and trackpad. phones keep normal scrolling
export default function SmoothScroll() {
    useEffect(() => {
        const lenis = new Lenis({
            lerp: 0.085,
            wheelMultiplier: 0.95,
            smoothWheel: true,
            allowNestedScroll: true,
            anchors: { offset: -96 },
            stopInertiaOnNavigate: true,
            autoRaf: true,
        });
        instance = lenis;

        // pause it while a modal is open so the page behind doesn't scroll
        const syncLock = () => {
            if (document.body.style.overflow === 'hidden') lenis.stop();
            else lenis.start();
        };
        const observer = new MutationObserver(syncLock);
        observer.observe(document.body, { attributes: true, attributeFilter: ['style'] });

        return () => {
            observer.disconnect();
            lenis.destroy();
            instance = null;
        };
    }, []);

    return null;
}
