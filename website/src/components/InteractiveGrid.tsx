"use client";

import { useEffect, useRef } from "react";

export default function InteractiveGrid() {
    const rippleLayerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onDown = (e: PointerEvent) => {
            if (e.button !== 0) return;
            const layer = rippleLayerRef.current;
            if (!layer) return;
            const ripple = document.createElement("span");
            ripple.className = "cursor-ripple";
            ripple.style.left = `${e.clientX}px`;
            ripple.style.top = `${e.clientY}px`;
            layer.appendChild(ripple);
            window.setTimeout(() => ripple.remove(), 700);
        };

        window.addEventListener("pointerdown", onDown, { passive: true });

        return () => {
            window.removeEventListener("pointerdown", onDown);
        };
    }, []);

    return (
        <>
            <div ref={rippleLayerRef} className="cursor-ripple-layer" aria-hidden="true" />
        </>
    );
}
