"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { sfx } from "../lib/sfx";
import { runThemeTransition } from "../lib/themeTransition";

interface ThemeContextType {
    isDark: boolean;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [isDark, setIsDark] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);

        // Check if user has a saved preference
        const savedTheme = localStorage.getItem("theme");

        if (savedTheme) {
            // User chose a theme before - use that
            const prefersDark = savedTheme === "dark";
            setIsDark(prefersDark);
            document.documentElement.classList.toggle("dark", prefersDark);
        } else {
            // Default to light mode for everyone on load
            setIsDark(false);
            document.documentElement.classList.remove("dark");
            // Save the preference
            localStorage.setItem("theme", "light");
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = !isDark;
        sfx.theme(newTheme);

        // the grid turns over: the new theme lands tile by tile from where you clicked.
        // everything has to change right away inside the transition, so react
        // commits the new colours (flushSync) before the browser grabs the new page
        const wave = runThemeTransition(() => {
            flushSync(() => setIsDark(newTheme));
            document.documentElement.classList.toggle("dark", newTheme);
        });
        if (wave) sfx.themeWave(newTheme, wave);

        localStorage.setItem("theme", newTheme ? "dark" : "light");
    };

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
