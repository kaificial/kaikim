import { Big_Shoulders } from "next/font/google";

/** condensed movie-sign font for spines and case art, only loaded by the shelf */
export const spineFont = Big_Shoulders({
    subsets: ["latin"],
    weight: ["600", "800"],
    display: "swap",
});
