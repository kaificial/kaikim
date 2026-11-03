"use client";

import Image from 'next/image';
import { motion } from 'framer-motion';
import { useTheme } from '../ThemeContext';
import { cssVar } from '../../styles/palette';
import { rt, SectionHeading } from './TextReveal';

export const Education = () => {
    const { isDark } = useTheme();

    return (
        <motion.section
            style={{ marginTop: '32px' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.2, duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        >
            <SectionHeading marginBottom="8px">{rt('Education', 6)}</SectionHeading>

            <div style={{
                border: `1px solid ${cssVar.chipBorder}`,
                backgroundColor: cssVar.surface,
                borderRadius: '12px',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: isDark
                    ? '0 0 0 4px var(--bg-color), 0 0 0 5px #2a2a2a'
                    : '0 0 0 4px #f5f5f4, 0 0 0 5px #D1D5DB',
                margin: '2px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Image
                        src="/assets/queens.png"
                        alt="Queen's University Logo"
                        width={36}
                        height={36}
                        priority
                        style={{ objectFit: 'contain', width: 'auto', filter: 'none' }}
                    />
                    <div>
                        <h3 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0px', color: cssVar.textStrong }}>
                            {rt("Queen's University", 7.2)}
                        </h3>
                        <p style={{ fontSize: '0.75rem', color: cssVar.textMuted }}>
                            {rt('Bachelor of Computing, Computer Science', 7.4)}
                        </p>
                    </div>
                </div>

                <span style={{ fontSize: '0.75rem', color: cssVar.textMuted, fontWeight: '500' }}>
                    {rt('2028', 7.5)}
                </span>
            </div>
        </motion.section>
    );
};
