import type { Metadata } from 'next'
import type { MediaEntry } from '../../data/media'
import { getMediaEntries } from '../../lib/letterboxd'

export const metadata: Metadata = {
    title: 'Notes',
    description: "kai kim · notes and interests — media reviews, music, technical writing. CS @ Queen's University.",
    alternates: { canonical: 'https://kaikim.ca/writing' },
    openGraph: {
        title: 'Notes | Kai Kim',
        description: "kai kim · notes and interests — media reviews, music, technical writing.",
        url: 'https://kaikim.ca/writing',
        type: 'website',
        siteName: 'Kai Kim',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Notes | Kai Kim',
        description: "kai kim · notes and interests — media reviews, music, technical writing.",
    },
}

const reviewsJsonLd = (media: MediaEntry[]) => ({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Kai Kim · Film & TV ratings',
    itemListElement: media.map((m, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
            '@type': 'Review',
            url: `https://kaikim.ca/writing#${m.id}`,
            author: { '@type': 'Person', name: 'Kai Kim' },
            reviewRating: { '@type': 'Rating', ratingValue: m.rating, bestRating: 5, worstRating: 0.5 },
            ...(m.review && { reviewBody: m.review }),
            itemReviewed: {
                '@type': m.kind === 'movie' ? 'Movie' : 'TVSeries',
                name: m.title,
                sameAs: m.imdbUrl ?? m.letterboxdUrl,
                ...(m.kind === 'movie' ? { dateCreated: String(m.year) } : { startDate: String(m.year) }),
            },
        },
    })),
})

export default async function NotesLayout({ children }: { children: React.ReactNode }) {
    // review text comes from letterboxd, so escape '\u003c' to stop it closing the script tag
    const jsonLd = JSON.stringify(reviewsJsonLd(await getMediaEntries())).replace(/</g, '\\u003c')
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
            {children}
        </>
    )
}
