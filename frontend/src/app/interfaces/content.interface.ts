export interface Content {
  id: number;
  tmdbId: string;
  title: string;
  releaseYear: number;
  poster: string;
  type: 'movie' | 'tv';
  imdbRating?: number | null;
  rtRating?: number | null;
  rating?: number;
  genres?: string[];
  overview?: string;
  cast?: CastMember[];
  language?: string;
  providers?: string[];
}

export interface CastMember {
  tmdbId: number;
  name: string;
  character: string;
  profilePathUrl: string;
}