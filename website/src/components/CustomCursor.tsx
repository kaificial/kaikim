"use client";

import { useEffect, useRef } from "react";

const TAU = Math.PI * 2;
const REST_HEADING = -Math.PI * 0.7;

// smallest angle you'd need to turn to go from one direction to another, in radians
function angleDelta(from: number, to: number) {
    let delta = (to - from) % TAU;
    if (delta > Math.PI) delta -= TAU;
    if (delta < -Math.PI) delta += TAU;
    return delta;
}

export default function CustomCursor() {
    const rootRef = useRef<HTMLDivElement>(null);
    const planeRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (!canHover || reduceMotion) return;

        const root = rootRef.current;
        const plane = planeRef.current;
        if (!root || !plane) return;

        document.body.classList.add("custom-cursor-active");

        const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        const target = { ...pos };
        const prevTarget = { ...pos };
        const velocity = { x: 0, y: 0 };

        let heading = REST_HEADING;
        let prevHeading = REST_HEADING;
        let roll = 0;
        let lastTime = performance.now();
        let visible = false;
        let overText = false;
        let overInteractive = false;
        let pressed = false;
        let stateScale = 1; // eases toward hover/press scale
        let lastTarget: EventTarget | null = null;
        let idleTimer = 0;
        let raf = 0;

        const show = () => {
            if (!visible) {
                visible = true;
                root.style.opacity = "1";
            }
        };
        const hide = () => {
            if (visible) {
                visible = false;
                root.style.opacity = "0";
            }
        };

        const INTERACTIVE =
            'a, button, [role="button"], select, summary, label, .cursor-pointer, ' +
            '[style*="cursor: pointer"], [style*="cursor:pointer"], [onclick]';
        const EDITABLE = 'input, textarea, [contenteditable="true"]';

        const classifyTarget = (el: HTMLElement | null) => {
            const editable = !!el?.closest(EDITABLE);
            if (editable !== overText) {
                overText = editable;
                document.body.classList.toggle("custom-cursor-text", overText);
            }

            const interactive = !editable && !!el?.closest(INTERACTIVE);
            if (interactive !== overInteractive) {
                overInteractive = interactive;
                root.classList.toggle("paper-cursor-hover", overInteractive);
            }
        };

        const onMove = (e: PointerEvent) => {
            target.x = e.clientX;
            target.y = e.clientY;
            if (!visible) {
                pos.x = target.x;
                pos.y = target.y;
                prevTarget.x = target.x;
                prevTarget.y = target.y;
                show();
            }

            if (e.target !== lastTarget) {
                lastTarget = e.target;
                classifyTarget(e.target as HTMLElement | null);
            }
        };

        const onDown = (e: PointerEvent) => {
            if (e.button !== 0) return;
            pressed = true;
            root.classList.add("paper-cursor-down");
        };

        const onUp = () => {
            pressed = false;
            root.classList.remove("paper-cursor-down");
        };

        const onLeaveWindow = () => hide();

        window.addEventListener("pointermove", onMove, { passive: true });
        window.addEventListener("pointerdown", onDown, { passive: true });
        window.addEventListener("pointerup", onUp, { passive: true });
        window.addEventListener("blur", onUp);
        document.addEventListener("mouseleave", onLeaveWindow);

        const tick = (now: number) => {
            const dt = Math.min((now - lastTime) / 1000, 0.05) || 0.016;
            lastTime = now;

            pos.x = target.x;
            pos.y = target.y;

            const moveX = target.x - prevTarget.x;
            const moveY = target.y - prevTarget.y;
            prevTarget.x = target.x;
            prevTarget.y = target.y;

            const velFactor = 1 - Math.exp(-dt * 20);
            velocity.x += (moveX - velocity.x) * velFactor;
            velocity.y += (moveY - velocity.y) * velFactor;

            const speed = Math.hypot(velocity.x, velocity.y);

            if (speed > 0.35) {
                idleTimer = 0;
                const desired = Math.atan2(velocity.y, velocity.x);
                const headingFactor = 1 - Math.exp(-dt * 22);
                heading += angleDelta(heading, desired) * headingFactor;
            } else {
                idleTimer += dt;
                if (idleTimer > 0.28 || overInteractive) {
                    const settleSpeed = overInteractive ? 14 : 8;
                    const settleFactor = 1 - Math.exp(-dt * settleSpeed);
                    heading += angleDelta(heading, REST_HEADING) * settleFactor;
                }
            }

            // Tilt/bank into turns
            const turnRate = angleDelta(prevHeading, heading) / dt;
            prevHeading = heading;
            const targetRollDeg = Math.max(-26, Math.min(26, (turnRate * 180) / Math.PI * -0.14));
            const rollFactor = 1 - Math.exp(-dt * 12);
            roll += (targetRollDeg - roll) * rollFactor;

            // Hover expansion and click compression
            const stateTarget = pressed ? 0.86 : overInteractive ? 1.15 : 1;
            stateScale += (stateTarget - stateScale) * (1 - Math.exp(-dt * 20));

            const scale = Math.min(1.18, 1 + speed * 0.008) * stateScale;
            const bank = Math.cos((roll * Math.PI) / 180);

            root.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
            plane.style.transform = `rotate(${(heading * 180) / Math.PI}deg) scale(${scale}) scaleY(${bank})`;

            raf = requestAnimationFrame(tick);
        };

        raf = requestAnimationFrame(tick);

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerdown", onDown);
            window.removeEventListener("pointerup", onUp);
            window.removeEventListener("blur", onUp);
            document.removeEventListener("mouseleave", onLeaveWindow);
            document.body.classList.remove("custom-cursor-active", "custom-cursor-text");
        };
    }, []);

    return (
        <div ref={rootRef} className="paper-cursor-root" aria-hidden="true">
            <div ref={planeRef} className="paper-cursor-plane">
                <svg viewBox="-21 -9 24 18" width="24" height="18">
                    <defs>
                        <linearGradient id="cursor-facet-left-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#0f172a" />
                            <stop offset="100%" stopColor="#020617" />
                        </linearGradient>
                        <linearGradient id="cursor-facet-right-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#1e293b" />
                            <stop offset="100%" stopColor="#0f172a" />
                        </linearGradient>
                    </defs>
                    <g className="paper-cursor-shape">
                        {/* Outer perimeter outline*/}
                        <path
                            className="cursor-rim"
                            d="M 0,0 L -18,-6.5 L -14,-2 L -12.5,0 L -14,2 L -18,6.5 Z"
                        />
                        {/* Port (Upper) Wing Facet */}
                        <polygon
                            className="cursor-facet cursor-facet-top"
                            points="0,0 -18,-6.5 -14,-2 -12.5,0"
                        />
                        {/* Starboard (Lower) Wing Facet */}
                        <polygon
                            className="cursor-facet cursor-facet-bottom"
                            points="0,0 -12.5,0 -14,2 -18,6.5"
                        />
                        {/* Precision Center Spine Line */}
                        <line
                            className="cursor-spine"
                            x1="0"
                            y1="0"
                            x2="-12.5"
                            y2="0"
                        />
                        {/* Micro Accent */}
                        <line
                            className="cursor-core"
                            x1="-13.5"
                            y1="-1.6"
                            x2="-13.5"
                            y2="1.6"
                        />
                    </g>
                </svg>
            </div>
        </div>
    );
}
