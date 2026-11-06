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
    { id: 'the-lobster', kind: 'movie', title: 'The Lobster', year: 2015, poster: 'https://a.ltrbxd.com/resized/film-poster/1/7/8/1/2/3/178123-the-lobster-0-600-0-900-crop.jpg?v=1de42bb7a6', rating: 4, imdbUrl: 'https://www.imdb.com/title/tt3464902/', tags: ['Comedy', 'Romance'] },
    { id: 'se7en', kind: 'movie', title: 'Se7en', year: 1995, poster: 'https://a.ltrbxd.com/resized/film-poster/5/1/3/4/5/51345-se7en-0-600-0-900-crop.jpg?v=76a14ef6b4', rating: 4, imdbUrl: 'https://www.imdb.com/title/tt0114369/', tags: ['Thriller', 'Crime'] },
    { id: 'gone-girl', kind: 'movie', title: 'Gone Girl', year: 2014, poster: 'https://a.ltrbxd.com/resized/film-poster/1/4/9/8/5/7/149857-gone-girl-0-600-0-900-crop.jpg?v=dfe3c8018b', rating: 4, imdbUrl: 'https://www.imdb.com/title/tt2267998/', tags: ['Thriller', 'Mystery'] },
    { id: 'the-prestige', kind: 'movie', title: 'The Prestige', year: 2006, poster: 'https://a.ltrbxd.com/resized/film-poster/5/1/1/4/7/51147-the-prestige-0-600-0-900-crop.jpg?v=ad7e891177', rating: 4, imdbUrl: 'https://www.imdb.com/title/tt0482571/', tags: ['Mystery', 'Drama'] },
    { id: 'eternal-sunshine', kind: 'movie', title: 'Eternal Sunshine of the Spotless Mind', year: 2004, poster: 'https://a.ltrbxd.com/resized/sm/upload/ay/bp/kl/1y/uBfQ7IGpi0jXSP3GPCzp9Pzm10v-0-600-0-900-crop.jpg?v=116621c401', rating: 4, imdbUrl: 'https://www.imdb.com/title/tt0338013/', tags: ['Romance', 'Sci-Fi'] },
    { id: 'prisoners', kind: 'movie', title: 'Prisoners', year: 2013, poster: 'https://a.ltrbxd.com/resized/sm/upload/iw/eg/4g/nm/3w79tTsv6tmlT8Jww6snyPrgVok-0-600-0-900-crop.jpg?v=778c7ae8b8', rating: 4, imdbUrl: 'https://www.imdb.com/title/tt1392214/', tags: ['Thriller', 'Crime'] },
    { id: 'get-out', kind: 'movie', title: 'Get Out', year: 2017, poster: 'https://a.ltrbxd.com/resized/film-poster/3/5/3/1/1/7/353117-get-out-0-600-0-900-crop.jpg?v=136acec030', rating: 4, imdbUrl: 'https://www.imdb.com/title/tt5052448/', tags: ['Horror', 'Thriller'] },
    { id: 'dune-part-two', kind: 'movie', title: 'Dune: Part Two', year: 2024, poster: 'https://a.ltrbxd.com/resized/film-poster/6/1/7/4/4/3/617443-dune-part-two-0-600-0-900-crop.jpg?v=cc533700f8', rating: 4, imdbUrl: 'https://www.imdb.com/title/tt15239678/', tags: ['Sci-Fi', 'Adventure'] },
    { id: 'the-odyssey', kind: 'movie', title: 'The Odyssey', year: 2026, poster: 'https://a.ltrbxd.com/resized/film-poster/1/2/5/5/3/9/4/1255394-the-odyssey-2026-0-600-0-900-crop.jpg?v=1eed046d0c', rating: 4, imdbUrl: 'https://www.imdb.com/title/tt33764258/', tags: ['Adventure', 'Fantasy'] },
    { id: 'about-time', kind: 'movie', title: 'About Time', year: 2013, poster: 'https://a.ltrbxd.com/resized/sm/upload/uo/th/yf/uz/zSuh8dGwqpsWR7ccvYbfxbSZ37o-0-600-0-900-crop.jpg?v=7276b6e978', rating: 4, imdbUrl: 'https://www.imdb.com/title/tt2194499/', tags: ['Romance', 'Comedy'] },
    { id: 'invincible', kind: 'tv', title: 'Invincible', seasons: 3, year: 2021, poster: '/music/media/Invincible.jpg', rating: 4, imdbUrl: 'https://www.imdb.com/title/tt6741278/', tags: ['Animation', 'Action'] },
    { id: 'severance', kind: 'tv', title: 'Severance', seasons: 2, year: 2022, poster: '/music/Severance.jpg', rating: 5, imdbUrl: 'https://www.imdb.com/title/tt11280740/', tags: ['Sci-Fi', 'Thriller'] },
    { id: 'barry', kind: 'tv', title: 'Barry', seasons: 4, year: 2018, poster: '/music/Barry.jpg', rating: 5, imdbUrl: 'https://www.imdb.com/title/tt5348176/', tags: ['Comedy', 'Crime'] },
    { id: 'breaking-bad', kind: 'tv', title: 'Breaking Bad', seasons: 5, year: 2008, poster: '/music/Breaking Bad.jpg', rating: 5, imdbUrl: 'https://www.imdb.com/title/tt0903747/', tags: ['Crime', 'Drama'] },
    { id: 'jjk', kind: 'tv', title: 'Jujutsu Kaisen', year: 2020, poster: 'https://image.tmdb.org/t/p/w500/6qQzMJG27XOJsyAEEIisoJB45j2.jpg', rating: 5, imdbUrl: 'https://www.imdb.com/title/tt12343534/', tags: ['Anime', 'Action'] },
    { id: 'aot', kind: 'tv', title: 'Attack on Titan', seasons: 4, year: 2013, poster: 'https://image.tmdb.org/t/p/w500/hTP1DtLGFamjfu8WqjnuQdP1n4i.jpg', rating: 5, imdbUrl: 'https://www.imdb.com/title/tt2560140/', tags: ['Anime', 'Action'] },
    { id: 'mob-psycho', kind: 'tv', title: 'Mob Psycho 100', seasons: 3, year: 2016, poster: 'https://image.tmdb.org/t/p/w500/vR7hwaGQ0ySRoq1WobiNRaPs4WO.jpg', rating: 5, imdbUrl: 'https://www.imdb.com/title/tt5897304/', tags: ['Anime', 'Comedy'] },
];
