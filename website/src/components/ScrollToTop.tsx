"use client";

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { getLenis } from './SmoothScroll';

// scrolls to top whenever the route changes
// also tracks the previous path for "back to [page]" buttons
export default function ScrollToTop() {
    const pathname = usePathname();
    const prevPathRef = useRef<string | null>(null);

    useEffect(() => {
        // Store the previous path before updating
        if (prevPathRef.current !== null && prevPathRef.current !== pathname) {
            sessionStorage.setItem('prevPath', prevPathRef.current);
        }
        prevPathRef.current = pathname;

        // go through lenis so the old page's scroll doesn't keep going
        const lenis = getLenis();
        if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
        else window.scrollTo(0, 0);
    }, [pathname]);

    return null;
}
