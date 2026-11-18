export type Job = {
    id: string;
    company: string;
    role: string;
    dates: string;
    logo: string;
    /** theme where the logo needs inverting */
    invertIn?: 'light' | 'dark';
    href?: string;
};

/** newest first */
export const JOBS: Job[] = [
    { id: 'qmind', company: 'QMIND', role: 'AI Engineer', dates: '2025 – now', logo: '/assets/QMIND_logo.png', href: 'https://qmind.ca' },
    { id: 'cibc', company: 'CIBC', role: 'Intern', dates: '2026', logo: '/assets/cibc.png', invertIn: 'light', href: 'https://www.cibc.com' },
    { id: 'qbit', company: 'QBiT', role: 'Software Engineer', dates: '2025 – 26', logo: '/assets/QBiT_Logo-1.png', invertIn: 'dark', href: 'https://www.qbitqueensu.ca/' },
    { id: 'zeen', company: 'Zeen', role: 'Software Engineer', dates: '2025', logo: '/assets/zeen.jpg' },
];
