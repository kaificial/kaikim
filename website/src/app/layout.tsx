
import type { Metadata } from "next";

import { Inter, JetBrains_Mono, Source_Serif_4 } from "next/font/google";
import "../styles/globals.scss";
import "katex/dist/katex.min.css";
import Header from "../components/Header";
import { ThemeProvider } from "../components/ThemeContext";
import { AudioProvider } from "../components/AudioContext";
import ScrollToTop from "../components/ScrollToTop";
import SmoothScroll from "../components/SmoothScroll";
import InteractiveGrid from "../components/InteractiveGrid";
import CommandPalette from "../components/CommandPalette";
import FloatingDock from "../components/FloatingDock";
import SiteFooter from "../components/SiteFooter";
import CustomCursor from "../components/CustomCursor";
import { SfxBoot } from "../lib/sfx/react";
import { MotionProvider } from "../components/MotionProvider";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
    weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
    subsets: ["latin"],
    variable: "--font-mono",
    weight: ["400", "500", "600"],
});

const sourceSerif = Source_Serif_4({
    subsets: ["latin"],
    variable: "--font-serif",
    weight: ["400", "600", "700"],
});

// site metadata for SEO and social sharing
// this shows up in browser tabs and when people share links
export const metadata: Metadata = {
    metadataBase: new URL('https://kaikim.ca'),
    title: {
        template: '%s | Kai Kim',
        default: 'Kai Kim',
    },
    description: "what i've been building: Clairo (AI medical assistant), Rooke (chess AI with 3D visualization), Scribe (handwritten LaTeX converter). CS @ Queen's University, Toronto.",
    keywords: [
        "Kai Kim",
        "Kai Kim engineer",
        "Kai Kim software engineer",
        "Kai Kim Queen's University",
        "Kai Kim developer",
        "Kai Kim portfolio",
        "Queen's University computer science",
        "software engineer Toronto",
        "Clairo",
        "Rooke chess",
        "Scribe LaTeX",
    ],
    authors: [{ name: "Kai Kim", url: "https://kaikim.ca" }],
    creator: "Kai Kim",
    publisher: "Kai Kim",
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large' as const,
            'max-snippet': -1,
        },
    },
    alternates: { canonical: 'https://kaikim.ca' },
    icons: {
        icon: [
            { url: '/assets/newjeans.png', sizes: '32x32', type: 'image/png' },
            { url: '/assets/newjeans.png', sizes: '16x16', type: 'image/png' },
        ],
        apple: '/assets/newjeans.png',
    },
    openGraph: {
        title: 'Kai Kim',
        description: "what i've been building: Clairo (AI medical assistant), Rooke (chess AI with 3D visualization), Scribe (handwritten LaTeX converter). CS @ Queen's University, Toronto.",
        type: 'website',
        url: 'https://kaikim.ca',
        siteName: 'Kai Kim',
        locale: 'en_CA',
        images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Kai Kim — Software Engineer' }],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Kai Kim',
        description: "what i've been building: Clairo (AI medical assistant), Rooke (chess AI with 3D visualization), Scribe (handwritten LaTeX converter). CS @ Queen's University, Toronto.",
        creator: '@kaikimto',
        images: ['/og-image.png'],
    },
};

/*
 * Main layout component
 * 
 * The script checks localStorage first, then uses the users system preference
 */
export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://i.scdn.co" crossOrigin="anonymous" />
                <link rel="preconnect" href="https://image.tmdb.org" crossOrigin="anonymous" />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "WebSite",
                            "name": "Kai Kim",
                            "url": "https://kaikim.ca",
                            "description": "what i've been building: Clairo (AI medical assistant), Rooke (chess AI with 3D visualization), Scribe (handwritten LaTeX converter). CS @ Queen's University, Toronto.",
                            "publisher": {
                                "@type": "Person",
                                "name": "Kai Kim"
                            }
                        })
                    }}
                />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "Person",
                            "name": "Kai Kim",
                            "url": "https://kaikim.ca",
                            "image": "https://kaikim.ca/assets/pfp.jpg",
                            "jobTitle": "Software Engineer",
                            "description": "Software engineering student at Queen's University. Builder of Clairo, Rooke, and Scribe.",
                            "alumniOf": {
                                "@type": "CollegeOrUniversity",
                                "name": "Queen's University",
                                "url": "https://www.queensu.ca"
                            },
                            "knowsAbout": ["TypeScript", "React", "Next.js", "Machine Learning", "WebGL", "Three.js"],
                            "sameAs": ["https://github.com/kaificial", "https://kaikim.ca"]
                        })
                    }}
                />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "SiteNavigationElement",
                            "name": ["Projects", "Notes"],
                            "url": ["https://kaikim.ca/projects", "https://kaikim.ca/writing"]
                        })
                    }}
                />
                <script src="/scripts/theme-init.js" />
            </head>
            <body className={`${inter.variable} ${jetbrainsMono.variable} ${sourceSerif.variable}`}>
                <ThemeProvider>
                    <AudioProvider>
                    <MotionProvider>
                        <InteractiveGrid />
                        <SmoothScroll />
                        <ScrollToTop />
                        <Header />
                        <main>
                            {children}
                        </main>
                        <SiteFooter />
                        <CommandPalette />
                        <FloatingDock />
                        <CustomCursor />
                        <SfxBoot />
                    </MotionProvider>
                    </AudioProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
