export type MediaKind = 'movie' | 'tv';
export type CaseFormat = 'dvd' | 'bluray' | 'boxset' | 'vhs';

export interface MediaEntry {
    id: string;
    kind: MediaKind;
    title: string;
    year: number;
    poster: string;
    /** 0.5 to 5 in half steps */
    rating: number;
    imdbUrl?: string;
    letterboxdUrl?: string;
    tags: string[];
    /** one line take, shown under the title */
    verdict?: string;
    /** longer thoughts, shown when the entry is opened */
    review?: string;
    /** iso date (YYYY-MM-DD) of the latest watch */
    watched?: string;
    /**
     * which case it sits in on the shelf. defaults: shows → boxset, rewatched → vhs, 5/5 → bluray, else
     * dvd
     */
    format?: CaseFormat;
    /** box set thickness and disc count */
    seasons?: number;
    /** extra watches after the first (from letterboxd) */
    rewatches?: number;
    /** main poster colour, filled in on the server */
    spineColor?: string;
}

export const media: MediaEntry[] = [
    { id: 'drive', kind: 'movie', title: 'Drive', year: 2011, poster: '/music/Drive.jpg', rating: 3.5, imdbUrl: 'https://www.imdb.com/title/tt0780504/', tags: ['Thriller', 'Crime'] },
    { id: 'interstellar', kind: 'movie', title: 'Interstellar', year: 2014, poster: '/music/Interstellar.jpg', rating: 5, imdbUrl: 'https://www.imdb.com/title/tt0816692/', tags: ['Sci-Fi', 'Drama'] },
    { id: 'her', kind: 'movie', title: 'Her', year: 2013, poster: '/music/Her.jpg', rating: 4, imdbUrl: 'https://www.imdb.com/title/tt1798709/', tags: ['Sci-Fi', 'Romance'] },
    { id: 'arrival', kind: 'movie', title: 'Arrival', year: 2016, poster: '/music/Arrival.jpg', rating: 5, imdbUrl: 'https://www.imdb.com/title/tt2543164/', tags: ['Sci-Fi', 'Drama'] },
    { id: 'lalaland', kind: 'movie', title: 'La La Land', year: 2016, poster: '/music/lalaland.jpg', rating: 4.5, imdbUrl: 'https://www.imdb.com/title/tt3783958/', tags: ['Musical', 'Romance'] },
    { id: 'severance', kind: 'tv', title: 'Severance', seasons: 2, year: 2022, poster: '/music/Severance.jpg', rating: 5, imdbUrl: 'https://www.imdb.com/title/tt11280740/', tags: ['Sci-Fi', 'Thriller'] },
    { id: 'barry', kind: 'tv', title: 'Barry', seasons: 4, year: 2018, poster: '/music/Barry.jpg', rating: 5, imdbUrl: 'https://www.imdb.com/title/tt5348176/', tags: ['Comedy', 'Crime'] },
    { id: 'breaking-bad', kind: 'tv', title: 'Breaking Bad', seasons: 5, year: 2008, poster: '/music/Breaking Bad.jpg', rating: 5, imdbUrl: 'https://www.imdb.com/title/tt0903747/', tags: ['Crime', 'Drama'] },
    { id: 'jjk', kind: 'tv', title: 'Jujutsu Kaisen', year: 2020, poster: 'https://image.tmdb.org/t/p/w500/6qQzMJG27XOJsyAEEIisoJB45j2.jpg', rating: 5, imdbUrl: 'https://www.imdb.com/title/tt12343534/', tags: ['Anime', 'Action'] },
    { id: 'aot', kind: 'tv', title: 'Attack on Titan', seasons: 4, year: 2013, poster: 'https://image.tmdb.org/t/p/w500/hTP1DtLGFamjfu8WqjnuQdP1n4i.jpg', rating: 5, imdbUrl: 'https://www.imdb.com/title/tt2560140/', tags: ['Anime', 'Action'] },
    { id: 'mob-psycho', kind: 'tv', title: 'Mob Psycho 100', seasons: 3, year: 2016, poster: 'https://image.tmdb.org/t/p/w500/vR7hwaGQ0ySRoq1WobiNRaPs4WO.jpg', rating: 5, imdbUrl: 'https://www.imdb.com/title/tt5897304/', tags: ['Anime', 'Comedy'] },
];
