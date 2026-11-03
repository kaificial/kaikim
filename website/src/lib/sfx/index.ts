import * as cues from './cues';
import { duck, isMuted, setMuted, subscribe } from './engine';

/**
 * `sfx.press()`, `sfx.like(true)`, `sfx.theme(dark)`… the site's sound effects. see
 * docs/sound-design-plan.md for the full list and the rules
 */
export const sfx = { ...cues, duck, isMuted, subscribe, setMuted };

export type { CueOpts } from './cues';
export { note } from './palette';
