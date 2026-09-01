"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from './ThemeContext';

interface GitHubActivityProps {
    username: string;
    shouldStart?: boolean;
}

interface ContributionDay {
    date: string;
    count: number;
    level: number;
}

interface UserStats {
    publicRepos: number;
    followers: number;
    following: number;
}

export function GitHubActivity({ username, shouldStart = true }: GitHubActivityProps) {
    const { isDark } = useTheme();
    const [contributions, setContributions] = useState<ContributionDay[]>([]);
    const [totalContributions, setTotalContributions] = useState(0);
    const [currentStreak, setCurrentStreak] = useState(0);
    const [longestStreak, setLongestStreak] = useState(0);
    const [userStats, setUserStats] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [animationComplete, setAnimationComplete] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);

    useEffect(() => {
        if (!shouldStart || hasStarted) return;

        const fetchData = async () => {
            try {
                setLoading(true);
                setHasStarted(true);

                const contribResponse = await fetch(
                    `https://github-contributions-api.jogruber.de/v4/${username}?y=last`
                );
                const contribData = await contribResponse.json();

                const userResponse = await fetch(`https://api.github.com/users/${username}`);
                const userData = await userResponse.json();

                if (userData.public_repos !== undefined) {
                    setUserStats({
                        publicRepos: userData.public_repos,
                        followers: userData.followers,
                        following: userData.following,
                    });
                }

                const allContributions: ContributionDay[] = [];
                let total = 0;

                if (contribData.contributions) {
                    contribData.contributions.forEach((day: { date: string; count: number; level: number }) => {
                        allContributions.push({
                            date: day.date,
                            count: day.count,
                            level: day.level,
                        });
                        total += day.count;
                    });
                }

                setContributions(allContributions);
                setTotalContributions(contribData.total?.lastYear || total);

                const reversedDays = [...allContributions].reverse();
                let streak = 0;
                let maxStreak = 0;
                let tempStreak = 0;

                const today = new Date().toISOString().split('T')[0];
                let startIdx = 0;
                if (reversedDays[0]?.date === today && reversedDays[0]?.count === 0) {
                    startIdx = 1;
                }

                for (let i = startIdx; i < reversedDays.length; i++) {
                    if (reversedDays[i].count > 0) {
                        streak++;
                    } else {
                        break;
                    }
                }
                setCurrentStreak(streak);

                for (const day of allContributions) {
                    if (day.count > 0) {
                        tempStreak++;
                        maxStreak = Math.max(maxStreak, tempStreak);
                    } else {
                        tempStreak = 0;
                    }
                }
                setLongestStreak(maxStreak);

                setLoading(false);

                // mark animation complete after the wave finishes
                setTimeout(() => setAnimationComplete(true), 4000);
            } catch (err) {
                console.error('Error fetching GitHub data:', err);
                setLoading(false);
            }
        };

        fetchData();
    }, [username, shouldStart, hasStarted]);

    const getContributionColor = (level: number) => {
        if (isDark) {
            const colors = [
                '#1c1c1a',
                '#1e3a5f',
                '#2d5a8e',
                '#3b78c4',
                '#4b96f5',
            ];
            return colors[level] || colors[0];
        } else {
            const colors = [
                '#ebebea',
                '#bfdbfe',
                '#60a5fa',
                '#3b82f6',
                '#1d4ed8',
            ];
            return colors[level] || colors[0];
        }
    };

    // organize into weeks
    const weeks: ContributionDay[][] = [];
    for (let i = 0; i < contributions.length; i += 7) {
        weeks.push(contributions.slice(i, i + 7));
    }

    if (!shouldStart || !hasStarted || loading) {
        return (
            <div
                style={{
                    width: '100%',
                    padding: '24px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                }}
            >
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{
                        width: '14px',
                        height: '14px',
                        border: `2px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                        borderTopColor: isDark ? '#6b7280' : '#9ca3af',
                        borderRadius: '50%',
                    }}
                />
                <span style={{ color: isDark ? '#6b7280' : '#9ca3af', fontSize: '0.8125rem' }}>
                    Loading...
                </span>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{ width: '100%' }}
        >
            {/* Header row */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
                flexWrap: 'wrap',
                gap: '12px',
            }}>
                <motion.a
                    href={`https://github.com/${username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        textDecoration: 'none',
                        color: isDark ? '#e5e7eb' : '#1c1917',
                        position: 'relative',
                    }}
                    whileHover="hover"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    <span style={{ fontWeight: 500, fontSize: '0.9375rem', position: 'relative' }}>
                        @{username}
                        <motion.span
                            style={{
                                position: 'absolute',
                                bottom: '-2px',
                                left: 0,
                                width: '100%',
                                height: '2px',
                                backgroundColor: isDark ? '#93c5fd' : '#2563eb',
                                transformOrigin: 'left',
                            }}
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 0 }}
                            whileHover={{ scaleX: 1 }}
                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        />
                    </span>
                </motion.a>

                {/* Stats with staggered count-up animation */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '20px',
                        fontSize: '0.8125rem',
                        color: isDark ? '#9ca3af' : '#6b7280',
                    }}
                >
                    <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                    >
                        <strong style={{ color: isDark ? '#e5e7eb' : '#1c1917' }}>
                            {totalContributions.toLocaleString()}
                        </strong> contributions
                    </motion.span>
                    <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                    >
                        <strong style={{ color: isDark ? '#e5e7eb' : '#1c1917' }}>
                            {currentStreak}
                        </strong> day streak
                    </motion.span>
                    <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.0 }}
                    >
                        <strong style={{ color: isDark ? '#e5e7eb' : '#1c1917' }}>
                            {longestStreak}
                        </strong> best
                    </motion.span>
                    {userStats && (
                        <>
                            <motion.span
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.2 }}
                            >
                                <strong style={{ color: isDark ? '#e5e7eb' : '#1c1917' }}>
                                    {userStats.publicRepos}
                                </strong> repos
                            </motion.span>
                            <motion.span
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.4 }}
                            >
                                <strong style={{ color: isDark ? '#e5e7eb' : '#1c1917' }}>
                                    {userStats.followers}
                                </strong> followers
                            </motion.span>
                        </>
                    )}
                </motion.div>
            </div>

            <div style={{
                width: '100%',
                overflowX: 'auto',
                paddingBottom: '8px',
            }}>
                <div style={{
                    display: 'flex',
                    gap: '2px',
                    minWidth: 'max-content',
                }}>
                    {weeks.map((week, weekIdx) => (
                        <div key={weekIdx} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {week.map((day, dayIdx) => {
                                const baseDelay = weekIdx * 0.05;
                                const waveOffset = Math.sin(dayIdx * 0.8) * 0.03;
                                const totalDelay = baseDelay + waveOffset;
                                const color = getContributionColor(day.level);

                                if (animationComplete) {
                                    // After animation: plain div with CSS hover
                                    return (
                                        <div
                                            key={day.date}
                                            title={`${day.date}: ${day.count} contributions`}
                                            className="contrib-cell"
                                            style={{
                                                width: '10px',
                                                height: '10px',
                                                borderRadius: '2px',
                                                backgroundColor: color,
                                                cursor: 'pointer',
                                                '--cell-color': color,
                                            } as React.CSSProperties}
                                        />
                                    );
                                }

                                // During animation: motion.div for the wave entrance
                                return (
                                    <motion.div
                                        key={day.date}
                                        initial={{
                                            scale: 0,
                                            opacity: 0,
                                            backgroundColor: '#3b82f6',
                                        }}
                                        animate={{
                                            scale: [0, 1.3, 1],
                                            opacity: 1,
                                            backgroundColor: color,
                                        }}
                                        transition={{
                                            delay: totalDelay,
                                            duration: 0.4,
                                            ease: [0.34, 1.56, 0.64, 1],
                                            backgroundColor: {
                                                delay: totalDelay + 0.3,
                                                duration: 0.5,
                                            }
                                        }}
                                        title={`${day.date}: ${day.count} contributions`}
                                        style={{
                                            width: '10px',
                                            height: '10px',
                                            borderRadius: '2px',
                                            cursor: 'pointer',
                                        }}
                                    />
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Legend with fade in */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3.5, duration: 0.5 }}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '4px',
                    marginTop: '8px',
                    fontSize: '0.6875rem',
                    color: isDark ? '#6b7280' : '#9ca3af',
                }}
            >
                <span style={{ marginRight: '4px' }}>Less</span>
                {[0, 1, 2, 3, 4].map((level, i) => (
                    <motion.div
                        key={level}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 3.6 + i * 0.1, type: 'spring', stiffness: 400 }}
                        style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '2px',
                            backgroundColor: getContributionColor(level),
                        }}
                    />
                ))}
                <span style={{ marginLeft: '4px' }}>More</span>
            </motion.div>
        </motion.div>
    );
}
