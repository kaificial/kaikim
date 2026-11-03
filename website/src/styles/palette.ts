import { useTheme } from '../components/ThemeContext';

/**
 * shared colours.
 *
 * normal styles should use `cssVar.*` (css variables in globals.scss), they follow the `.dark`
 * class without a re-render. only use `usePalette()` when you need an actual colour value, like
 * framer-motion `animate`/`whileHover` or canvas drawing. keep both files in sync
 */
export const palette = {
    light: {
        textStrong: '#1c1917',
        textMuted: '#6b7280',
        textSoft: '#4b5563',
        border: '#e5e7eb',
        hairline: 'rgba(0, 0, 0, 0.1)',
        surface: '#ffffff',
        chipBg: '#E5E7EB',
        chipFg: '#111827',
        chipBorder: '#D1D5DB',
        chipHoverBg: '#d1d5db',
        chipHoverFg: '#111827',
        chipHoverBorder: '#9ca3af',
        tagBg: '#f3f4f6',
        tagFg: '#374151',
        link: '#2563eb',
    },
    // "graphite": neutral blacks and greys, no tint, surfaces get a step lighter each layer
    dark: {
        textStrong: '#f5f5f5',
        textMuted: '#8f8f8f',
        textSoft: '#a3a3a3',
        border: '#2a2a2a',
        hairline: 'rgba(255, 255, 255, 0.1)',
        surface: '#141414',
        chipBg: 'rgba(28, 28, 28, 0.85)',
        chipFg: '#e6e6e6',
        chipBorder: '#2a2a2a',
        chipHoverBg: 'rgba(40, 40, 40, 0.95)',
        chipHoverFg: '#f5f5f5',
        chipHoverBorder: '#3a3a3a',
        tagBg: 'rgba(52, 52, 52, 0.55)',
        tagFg: '#c8c8c8',
        link: '#3b82f6',
    },
} as const;

export type Palette = { [K in keyof typeof palette.light]: string };

export const usePalette = (): Palette => {
    const { isDark } = useTheme();
    return isDark ? palette.dark : palette.light;
};

/** css variables for the colours defined in globals.scss */
export const cssVar = {
    textStrong: 'var(--c-text-strong)',
    textMuted: 'var(--c-text-muted)',
    textSoft: 'var(--c-text-soft)',
    border: 'var(--c-border)',
    hairline: 'var(--c-hairline)',
    surface: 'var(--c-surface)',
    chipBg: 'var(--c-chip-bg)',
    chipFg: 'var(--c-chip-fg)',
    chipBorder: 'var(--c-chip-border)',
    tagBg: 'var(--c-tag-bg)',
    tagFg: 'var(--c-tag-fg)',
    link: 'var(--c-link)',
    text: 'var(--text-color)',
    bg: 'var(--bg-color)',
} as const;
