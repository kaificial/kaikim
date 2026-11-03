"use client";

import { useEffect, useState } from 'react';

const BIRTH_DATE = new Date('2006-12-01T00:00:00').getTime();
const YEAR_MS = 31556952000; // 365.2425 days

export const LiveAge = () => {
    // empty until mounted so server and client show the same placeholder
    const [age, setAge] = useState<string>('');

    useEffect(() => {
        const interval = setInterval(() => setAge(((Date.now() - BIRTH_DATE) / YEAR_MS).toFixed(13)), 50);
        return () => clearInterval(interval);
    }, []);

    return (
        <span style={{ fontVariantNumeric: 'tabular-nums', display: 'inline-block', minWidth: '100px' }}>
            {age || '19.7...'}
        </span>
    );
};
