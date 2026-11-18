import { NextResponse } from 'next/server';
import { playlist } from '../../../data/playlist';


interface iTunesResult {
    trackId: number;
    trackName: string;
    artistName: string;
    previewUrl?: string;
    artworkUrl100?: string;
}

function normalize(s: string): string {
    return s
        .toLowerCase()
        .normalize('NFD').replace(/\p{Diacritic}/gu, '')
        .replace(/\(.*?\)|\[.*?\]/g, ' ')
        .replace(/\b(feat|ft|featuring|remaster(ed)?|demo|deluxe)\b.*$/, ' ')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

type Resolved = { id: string; title: string; artist: string; src: string };
// songs already looked up, so repeats skip itunes and its rate limit
const cache = new Map<string, Resolved | null>();

async function resolve(song: { title: string; artist: string }) {
    const key = `${song.artist}|${song.title}`;
    if (cache.has(key)) return cache.get(key)!;
    const track = await lookup(song);
    cache.set(key, track);
    return track;
}

async function lookup(song: { title: string; artist: string }): Promise<Resolved | null> {
    const term = encodeURIComponent(`${song.artist} ${song.title}`);
    const res = await fetch(
        `https://itunes.apple.com/search?term=${term}&entity=song&limit=25`,
        // don't let one slow lookup hang the skip
        { cache: 'no-store', signal: AbortSignal.timeout(4000) }
    );
    // rate limited or down: throw so it isn't cached as missing
    if (!res.ok) throw new Error(`itunes ${res.status}`);
    const data = await res.json();
    const results: iTunesResult[] = data.results ?? [];

    const wantArtist = normalize(song.artist);
    const wantTitle = normalize(song.title);

    const hit = results
        .filter((r) => r.previewUrl)
        .map((r) => {
            const a = normalize(r.artistName);
            const t = normalize(r.trackName);
            const artistMatch = a === wantArtist || a.includes(wantArtist) || wantArtist.includes(a);
            let score = 0;
            if (t === wantTitle) score += 3;
            else if (t.includes(wantTitle) || wantTitle.includes(t)) score += 1;
            if (a === wantArtist) score += 1;
            return { r, artistMatch, score };
        })
        .filter((x) => x.artistMatch)
        .sort((a, b) => b.score - a.score)[0]?.r;

    if (!hit?.previewUrl) return null;

    return {
        id: String(hit.trackId),
        title: song.title,
        artist: song.artist,
        src: hit.previewUrl,
    };
}

export async function GET(request: Request) {
    if (!playlist.length) {
        return NextResponse.json({ error: 'Playlist is empty' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const reqTitle = searchParams.get('title');
    const reqArtist = searchParams.get('artist');

    // look up a specific song if one was asked for
    if (reqTitle && reqArtist) {
        const match = playlist.find(
            (s) => s.title.toLowerCase() === reqTitle.toLowerCase() &&
                   s.artist.toLowerCase() === reqArtist.toLowerCase()
        );
        if (!match) {
            return NextResponse.json({ error: 'Song not in playlist' }, { status: 404 });
        }
        try {
            const track = await resolve(match);
            if (track) return NextResponse.json(track);
        } catch { /* fall through */ }
        return NextResponse.json({ error: 'No preview found for requested song' }, { status: 404 });
    }

    // Try a few random songs in case some have no iTunes preview 
    const tried = new Set<number>();
    const maxAttempts = Math.min(6, playlist.length);

    for (let i = 0; i < maxAttempts; i++) {
        let idx = Math.floor(Math.random() * playlist.length);
        while (tried.has(idx) && tried.size < playlist.length) {
            idx = Math.floor(Math.random() * playlist.length);
        }
        tried.add(idx);

        try {
            const track = await resolve(playlist[idx]);
            if (track) return NextResponse.json(track);
        } catch {
            // try the next random song
        }
    }

    return NextResponse.json({ error: 'No previewable track found' }, { status: 404 });
}
