"use client";

import { sfx } from '../../lib/sfx';

/** the shelf's sounds, now played through the site-wide sound engine (lib/sfx) */
export const shelfSounds = {
    /** plastic brushing past its neighbour */
    tick: () => sfx.tick(),
    /** case sliding out of, or back into, the shelf */
    clack: () => sfx.clack(),
    /** the case hinge clicking open */
    snap: () => sfx.snap(),
};
