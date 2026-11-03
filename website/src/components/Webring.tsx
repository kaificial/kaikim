"use client";

import { useTheme } from "./ThemeContext";
import Image from "next/image";

export default function Webring() {
    const { isDark } = useTheme();
    const siteUrl = "kaificial.vercel.app";
    const iconSrc = isDark ? "/assets/icon-white.png" : "/assets/icon-black.png";

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '8px 0',
            opacity: 0.8
        }}>
            <a
                href={`https://queensu-webring.ca/#${siteUrl}?nav=prev`}
                style={{
                    color: isDark ? '#f5f5f5' : 'black',
                    textDecoration: 'none',
                    fontSize: '1.2rem',
                    padding: '4px 8px'
                }}
                aria-label="Previous Site in Webring"
            >
                ←
            </a>
            <a
                href={`https://queensu-webring.ca/#${siteUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                    display: 'flex',
                    alignItems: 'center'
                }}
            >
                <Image
                    src={iconSrc}
                    alt="Queen's Computing Webring"
                    width={40}
                    height={40}
                    style={{
                        width: '40px',
                        height: 'auto',
                    }}
                />
            </a>
            <a
                href={`https://queensu-webring.ca/#${siteUrl}?nav=next`}
                style={{
                    color: isDark ? '#f5f5f5' : 'black',
                    textDecoration: 'none',
                    fontSize: '1.2rem',
                    padding: '4px 8px'
                }}
                aria-label="Next Site in Webring"
            >
                →
            </a>
        </div>
    );
}
