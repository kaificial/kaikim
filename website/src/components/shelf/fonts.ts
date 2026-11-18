import localFont from "next/font/local";

/** condensed movie-sign font for spines and case art, only loaded by the shelf */
// self-hosted: next/font/google fails the build on this font's google url
export const spineFont = localFont({
    src: "./BigShoulders-latin.woff2",
    weight: "600 800",
    display: "swap",
});
