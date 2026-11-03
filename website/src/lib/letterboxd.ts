import { cache } from "react";
import { media as manualMedia, type MediaEntry } from "../data/media";

export const LETTERBOXD_USER = "kaikim";
export const LETTERBOXD_PROFILE = `https://letterboxd.com/${LETTERBOXD_USER}/`;
const FEED_URL = `${LETTERBOXD_PROFILE}rss/`;
/** seconds between feed refreshes (isr) */
const REVALIDATE_S = 3600;

const tag = (xml: string, name: string) => {
    const m = xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
    return m ? m[1].trim() : undefined;
};

const decodeEntities = (s: string) =>
    s
        .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
        .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
        .replace(/&quot;/g, '"')
        .replace(/&#39;|&apos;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&');

/** the description is cdata html: a poster <img> paragraph, then the review paragraphs */
const parseDescription = (html: string) => {
    const body = html.replace(/^\s*<!\[CDATA\[|\]\]>\s*$/g, '');
    const poster = body.match(/<img[^>]+src="([^"]+)"/)?.[1];
    const paragraphs = Array.from(body.matchAll(/<p>([\s\S]*?)<\/p>/g))
        .map((m) => m[1])
        .filter((p) => !p.includes('<img'))
        .map((p) => decodeEntities(p.replace(/<br\s*\/?>/g, '\n').replace(/<[^>]+>/g, '')).trim())
        .filter((p) => p && !/^Watched on /.test(p) && p !== 'This review may contain spoilers.');
    return { poster: poster && decodeEntities(poster), review: paragraphs.join('\n\n') || undefined };
};

const parseFeed = (xml: string): MediaEntry[] => {
    const bySlug = new Map<string, MediaEntry>();
    const olderWatches = new Map<string, number>();
    // newest items come first, so the first diary entry for a film is the latest watch
    for (const [, item] of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
        const title = tag(item, 'letterboxd:filmTitle');
        const rating = Number(tag(item, 'letterboxd:memberRating'));
        const link = tag(item, 'link');
        // lists and unrated diary entries don't belong on a ratings page
        if (!title || !rating || !link) continue;
        const slug = link.match(/\/film\/([^/]+)\//)?.[1];
        if (!slug) continue;
        const isRewatch = tag(item, 'letterboxd:rewatch') === 'Yes';
        const existing = bySlug.get(slug);
        if (existing) {
            // each older diary entry for the same film is one earlier watch.
            // max() so a latest entry marked as a rewatch doesn't get counted twice.
            olderWatches.set(slug, (olderWatches.get(slug) ?? 0) + 1);
            existing.rewatches = Math.max(existing.rewatches ?? 0, olderWatches.get(slug)!);
            continue;
        }

        const { poster, review } = parseDescription(tag(item, 'description') ?? '');
        if (!poster) continue;
        bySlug.set(slug, {
            id: slug,
            kind: 'movie',
            title: decodeEntities(title),
            year: Number(tag(item, 'letterboxd:filmYear')) || 0,
            poster,
            rating,
            tags: [],
            review,
            watched: tag(item, 'letterboxd:watchedDate'),
            letterboxdUrl: `https://letterboxd.com/film/${slug}/`,
            // older watches might be before the feed window, so trust the rewatch flag too
            rewatches: isRewatch ? 1 : undefined,
        });
    }
    return Array.from(bySlug.values());
};

export const fetchLetterboxd = async (): Promise<MediaEntry[]> => {
    try {
        const res = await fetch(FEED_URL, { next: { revalidate: REVALIDATE_S } });
        if (!res.ok) return [];
        return parseFeed(await res.text());
    } catch {
        // feed's down or unreachable: the page still shows the hand-kept entries
        return [];
    }
};

const matchKey = (m: Pick<MediaEntry, 'title' | 'year'>) =>
    `${m.title.toLowerCase().replace(/[^a-z0-9]/g, '')}-${m.year}`;

/** hand-kept entries merged with letterboxd. letterboxd wins on rating, review and watch date */
export const getMediaEntries = cache(async (): Promise<MediaEntry[]> => {
    const fromLetterboxd = await fetchLetterboxd();
    const byKey = new Map(fromLetterboxd.map((m) => [matchKey(m), m]));

    const merged = manualMedia.map((manual) => {
        const lb = byKey.get(matchKey(manual));
        if (!lb) return manual;
        byKey.delete(matchKey(manual));
        return {
            ...manual,
            rating: lb.rating,
            review: lb.review ?? manual.review,
            watched: lb.watched ?? manual.watched,
            letterboxdUrl: lb.letterboxdUrl,
            rewatches: lb.rewatches ?? manual.rewatches,
        };
    });
    return [...merged, ...byKey.values()];
});
