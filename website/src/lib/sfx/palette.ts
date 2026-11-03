/**
 * every note on the site is in d major pentatonic (D E F♯ A B) so overlapping sounds, or sounds over
 * the music, never clash. rows of buttons map their spot to a note, so running along them plays a scale
 */
const D4 = 293.66;
const SEMITONES = [0, 2, 4, 7, 9];

/** frequency of a scale step. steps past 4 roll into the next octave */
export const note = (degree: number, octave = 4) => {
    const d = Math.round(degree);
    const oct = octave + Math.floor(d / SEMITONES.length);
    const step = SEMITONES[((d % SEMITONES.length) + SEMITONES.length) % SEMITONES.length];
    return D4 * Math.pow(2, oct - 4 + step / 12);
};

/** named notes a few sounds use */
export const PITCH = {
    D4: note(0, 4),
    Fs4: note(2, 4),
    A4: note(3, 4),
    D5: note(0, 5),
    Fs5: note(2, 5),
    A5: note(3, 5),
    D6: note(0, 6),
} as const;
