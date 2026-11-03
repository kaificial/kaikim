import type { Metadata } from 'next';
import NotFoundClient from './NotFoundClient';

export const metadata: Metadata = {
    title: '404',
    description: 'This page flew off the map.',
    robots: { index: false, follow: true },
};

export default function NotFound() {
    return <NotFoundClient />;
}
