export interface Movie {
  rank: number;
  rankInten: string; // e.g. "+1", "-2", "0", "New"
  title: string;
  openDt: string;
  audiCnt: number; // For yesterday
  audiAcc: number; // Cumulative
  director: string;
  actors: string[];
  genre: string;
  showTm: string; // e.g. "120분"
  synopsis: string;
  rating: number; // Custom baseline rating out of 10 or 5
  posterUrl: string;
  trailerId: string; // YouTube video ID or search query parameter
}

export interface Review {
  id: string;
  movieTitle: string;
  author: string;
  rating: number; // 1 to 5 stars
  content: string;
  createdAt: string;
}

export interface Theater {
  id: string;
  name: string;
  brand: 'CGV' | 'Lotte' | 'Megabox';
  address: string;
  lat: number;
  lng: number;
  phone: string;
}
