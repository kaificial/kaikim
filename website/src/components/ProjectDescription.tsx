"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import { useTheme } from "./ThemeContext";
import { useUISound } from "../hooks/use-ui-sound";
import SyntaxHighlighter from 'react-syntax-highlighter/dist/esm/prism-async';
import { vscDarkPlus, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { mouseOnly } from '../styles/motion';

interface ProjectDescriptionProps {
    content: string;
}

const ZoomableImage = ({ src, alt, isDark, ...props }: any) => {
    const [isZoomed, setIsZoomed] = useState(false);
    const { playClick } = useUISound();

    return (
        <>
            <div 
                style={{ 
                    margin: '40px 0', 
                    width: '100%', 
                    overflow: 'hidden', 
                    borderRadius: '12px',
                    cursor: 'zoom-in',
                    position: 'relative',
                    backgroundColor: isDark ? '#0c0c0c' : '#ffffff'
                }}
                onClick={() => { playClick(); setIsZoomed(true); }}
            >
                <img
                    src={src}
                    alt={alt}
                    style={{
                        width: '100%',
                        height: 'auto',
                        display: 'block',
                        borderRadius: '8px',
                        transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                    onPointerEnter={mouseOnly((e) => { e.currentTarget.style.transform = 'scale(1.02)'; })}
                    onPointerLeave={mouseOnly((e) => { e.currentTarget.style.transform = 'scale(1)'; })}
                    {...props}
                />
            </div>

            <AnimatePresence>
                {isZoomed && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        onClick={() => { playClick(); setIsZoomed(false); }}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '100vw',
                            height: '100vh',
                            backgroundColor: isDark ? 'rgba(8, 8, 8, 0.88)' : 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(16px)',
                            WebkitBackdropFilter: 'blur(16px)',
                            zIndex: 99999,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'zoom-out',
                            padding: '40px'
                        }}
                    >
                        <motion.img
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            src={src}
                            alt={alt}
                            style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain',
                                borderRadius: '16px',
                                boxShadow: isDark ? '0 25px 50px -12px rgba(0, 0, 0, 1)' : '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export const ProjectDescription: React.FC<ProjectDescriptionProps> = ({ content }) => {
    const { isDark } = useTheme();

    return (
        <div style={{
            fontSize: '0.875rem',
            lineHeight: '1.7',
            color: isDark ? '#c8c8c8' : '#4b5563',
            marginBottom: '16px'
        }}>
            <ReactMarkdown
                remarkPlugins={[remarkMath, remarkGfm]}
                rehypePlugins={[rehypeKatex, rehypeRaw]}
                components={{
                    p: ({ node, ...props }) => <p style={{ marginBottom: '24px' }} {...props} />,
                    h2: ({ node, ...props }) => (
                        <h2 style={{
                            fontSize: '1.5rem',
                            fontWeight: '700',
                            marginTop: '48px',
                            marginBottom: '8px',
                            color: isDark ? '#f5f5f5' : '#1c1917',
                            letterSpacing: '-0.02em'
                        }} {...props} />
                    ),
                    hr: () => (
                        <hr style={{
                            margin: '0 0 20px',
                            border: 'none',
                            borderTop: `1px solid ${isDark ? '#2a2a2a' : '#e5e7eb'}`,
                        }} />
                    ),
                    h3: ({ node, ...props }) => (
                        <h3 style={{
                            fontSize: '1.25rem',
                            fontWeight: '600',
                            marginTop: '32px',
                            marginBottom: '16px',
                            color: isDark ? '#f5f5f5' : '#1c1917',
                            letterSpacing: '-0.02em'
                        }} {...props} />
                    ),
                    strong: ({ node, ...props }) => <strong style={{ fontWeight: '600', color: isDark ? '#f5f5f5' : '#111827' }} {...props} />,
                    ul: ({ node, ...props }) => <ul style={{ marginLeft: '1.5rem', marginBottom: '16px', listStyleType: 'disc' }} {...props} />,
                    li: ({ node, ...props }) => <li style={{ marginBottom: '8px' }} {...props} />,
                    code: ({ node, inline, className, children, ...props }: any) => {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                            <SyntaxHighlighter
                                {...props}
                                children={String(children).replace(/\n$/, '')}
                                style={isDark ? vscDarkPlus : oneLight}
                                language={match[1]}
                                PreTag="div"
                                customStyle={{
                                    borderRadius: '8px',
                                    padding: '16px',
                                    fontSize: '0.8125rem',
                                    margin: '24px 0',
                                    backgroundColor: isDark ? '#101010' : '#f8f8f8',
                                    border: `1px solid ${isDark ? '#2a2a2a' : '#e5e7eb'}`
                                }}
                            />
                        ) : (
                            <code className={className} style={{
                                backgroundColor: isDark ? '#181818' : '#f3f4f6',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontFamily: 'var(--font-mono)',
                                fontSize: '0.8125rem',
                                border: `1px solid ${isDark ? '#2a2a2a' : '#e5e7eb'}`,
                                color: isDark ? '#e6e6e6' : '#1f2937'
                            }} {...props}>
                                {children}
                            </code>
                        );
                    },
                    table: ({ node, ...props }) => (
                        <div style={{ overflowX: 'auto', marginBottom: '32px', borderRadius: '8px', border: `1px solid ${isDark ? '#2a2a2a' : '#e5e7eb'}`, backgroundColor: isDark ? '#0c0c0c' : '#ffffff' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }} {...props} />
                        </div>
                    ),
                    thead: ({ node, ...props }) => <thead style={{ backgroundColor: isDark ? '#181818' : '#f9fafb', borderBottom: `1px solid ${isDark ? '#2a2a2a' : '#e5e7eb'}` }} {...props} />,
                    tbody: ({ node, ...props }) => <tbody {...props} />,
                    tr: ({ node, ...props }) => <tr style={{ borderBottom: `1px solid ${isDark ? '#2a2a2a' : '#e5e7eb'}` }} {...props} />,
                    th: ({ node, ...props }) => <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: isDark ? '#f5f5f5' : '#111827' }} {...props} />,
                    td: ({ node, ...props }) => <td style={{ padding: '12px 16px', verticalAlign: 'top', color: isDark ? '#c8c8c8' : '#4b5563' }} {...props} />,
                    img: ({ node, src, alt, ...props }) => (
                        <ZoomableImage src={src} alt={alt} isDark={isDark} {...props} />
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};
