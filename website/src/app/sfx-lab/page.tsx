import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import SfxLab from './SfxLab';

export const metadata: Metadata = {
    title: 'SFX lab',
    robots: { index: false, follow: false },
};

/** dev only playground for the site's sound effects */
export default function SfxLabPage() {
    if (process.env.NODE_ENV === 'production') notFound();
    return <SfxLab />;
}
