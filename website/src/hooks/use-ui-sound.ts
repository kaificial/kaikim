"use client";

import { sfx } from '../lib/sfx';

const api = {
    /** a normal button press (panned to the last pointer spot) */
    playClick: () => sfx.press(),
    playOn: () => sfx.toggle(true),
    playOff: () => sfx.toggle(false),
};

/**
 * old entry point, kept so existing code keeps working. for new stuff use `sfx.*` from `lib/sfx`, or
 * `data-sfx="press"` on the element
 */
export const useUISound = () => api;
