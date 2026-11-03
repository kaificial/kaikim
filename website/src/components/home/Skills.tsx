"use client";

import { motion } from 'framer-motion';
import { useTheme } from '../ThemeContext';
import { cssVar } from '../../styles/palette';
import { revealDelay, rt, SectionHeading, TextReveal } from './TextReveal';
import { PRESS } from '../../styles/motion';

const SIMPLE_ICON_SLUGS: Record<string, string> = {
    'JavaScript': 'javascript',
    'TypeScript': 'typescript',
    'HTML/CSS': 'html5',
    'Python': 'python',
    'Java': 'java',
    'Arduino': 'arduino',
    'React': 'react',
    'Next.js': 'nextdotjs',
    'Tailwind CSS': 'tailwindcss',
    'Node.js': 'nodedotjs',
    'Express.js': 'express',
    'MongoDB': 'mongodb',
    'Git': 'git',
    'VS Code': 'visualstudiocode',
    'Canva': 'canva',
    'Figma': 'figma',
    'REST APIs': 'fastapi', // close enough
    'Vite': 'vite'
};

const getSkillLogo = (skill: string, isDark: boolean) => {
    const slug = SIMPLE_ICON_SLUGS[skill];
    if (!slug) return null;
    return `https://cdn.simpleicons.org/${slug}/${isDark ? 'E5E7EB' : '111827'}`;
};

const GROUPS = [
    { title: 'Frontend & Frameworks', titleSlot: 7.6, chipSlot: 8.1, skills: ['React', 'Next.js', 'TypeScript', 'JavaScript', 'Tailwind CSS', 'HTML/CSS', 'Framer Motion'] },
    { title: 'Backend & Databases', titleSlot: 7.8, chipSlot: 8.5, skills: ['Node.js', 'Express.js', 'Python', 'Java', 'Spring Boot', 'MongoDB', 'PostgreSQL', 'REST APIs'] },
    { title: 'Tools & Technologies', titleSlot: 8, chipSlot: 8.9, skills: ['Git', 'GitHub', 'VS Code', 'Figma', 'Canva', 'Docker', 'AWS', 'Vercel', 'Vite'] },
];

const SkillGroup = ({ title, titleSlot, chipSlot, skills }: (typeof GROUPS)[number]) => {
    const { isDark } = useTheme();

    return (
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '500', marginBottom: '8px', color: cssVar.textStrong }}>{rt(title, titleSlot)}</h3>
            <motion.div
                style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}
                variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
            >
                {skills.map((skill, index) => {
                    const logoUrl = getSkillLogo(skill, isDark);
                    return (
                        <motion.span
                            key={index}
                            variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } }}
                            whileHover={{ scale: 1.1, y: -2 }}
                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                            whileTap={PRESS}
                            data-sfx="press"
                            data-sfx-degree={index}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                cursor: 'default',
                                padding: '4px 10px',
                                backgroundColor: cssVar.chipBg,
                                color: cssVar.chipFg,
                                borderRadius: '9999px',
                                fontSize: '0.75rem',
                                fontWeight: '500',
                                border: `1px solid ${cssVar.chipBorder}`
                            }}
                        >
                            {logoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={logoUrl} alt="" style={{ width: '13px', height: '13px' }} />
                            ) : (
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="16 18 22 12 16 6"></polyline>
                                    <polyline points="8 6 2 12 8 18"></polyline>
                                </svg>
                            )}
                            <TextReveal delay={revealDelay(chipSlot + index * 0.04)}>{skill}</TextReveal>
                        </motion.span>
                    );
                })}
            </motion.div>
        </motion.div>
    );
};

export const Skills = () => (
    <motion.section
        style={{ marginTop: '48px' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.6, duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
    >
        <SectionHeading marginBottom="16px">{rt('Skills', 7)}</SectionHeading>

        <motion.div
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{ visible: { transition: { staggerChildren: 0.2 } } }}
        >
            {GROUPS.map((g) => <SkillGroup key={g.title} {...g} />)}
        </motion.div>
    </motion.section>
);
