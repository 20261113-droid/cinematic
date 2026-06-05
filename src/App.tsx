import React, { useEffect, useState } from "react";
import { Movie, Review, Theater } from "./types";
import MovieCard from "./components/MovieCard";
import MovieDetailModal from "./components/MovieDetailModal";
import AudienceChart from "./components/AudienceChart";
import TheaterMap from "./components/TheaterMap";
import {
  Film,
  Search,
  SlidersHorizontal,
  Bookmark,
  Calendar,
  Layers,
  MapPin,
  Flame,
  AlertCircle,
  RefreshCw,
  BarChart3,
  Clapperboard
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [theaters, setTheaters] = useState<Theater[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Filtering & Sorting State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("전체");
  const [sortBy, setSortBy] = useState<"rank" | "rating" | "audiCnt">("rank");
  const [viewTab, setViewTab] = useState<"all" | "favorites">("all");
  
  // Dashboard / Interactive map state
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [selectedTheaterId, setSelectedTheaterId] = useState<string | null>(null);
  const [showCharts, setShowCharts] = useState(true);

  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Formatting Date Utility for Yesterday
  const getYesterdayStringFormatted = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}년 ${String(d.getMonth() + 1).padStart(2, "0")}월 ${String(d.getDate()).padStart(2, "0")}일`;
  };

  // 1. Initial Load APIs
  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch Box Office Lists
      const movieRes = await fetch("/api/boxoffice");
      if (!movieRes.ok) throw new Error("최신 한국 박스오피스 데이터를 가져오지 못했습니다.");
      const movieData = await movieRes.json();
      setMovies(movieData);

      // Fetch Cinema Lists
      const theaterRes = await fetch("/api/theaters");
      if (theaterRes.ok) {
        const theaterData = await theaterRes.json();
        setTheaters(theaterData);
        if (theaterData.length > 0) {
          setSelectedTheaterId(theaterData[0].id);
        }
      }

      // Fetch Comments/Reviews Feed
      const reviewRes = await fetch("/api/reviews");
      if (reviewRes.ok) {
        const reviewData = await reviewRes.json();
        setReviews(reviewData);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();

    // Cache favorites loading
    const savedFavs = localStorage.getItem("k_movie_favs");
    if (savedFavs) {
      try {
        setFavorites(JSON.parse(savedFavs));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // 2. Submit Review API
  const handleAddReview = async (reviewData: {
    movieTitle: string;
    author: string;
    rating: number;
    content: string;
  }) => {
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewData),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "리뷰 등록 과정에서 에러가 발생했습니다.");
      }

      const newReview = await res.json();
      setReviews((prev) => [newReview, ...prev]);
    } catch (err: any) {
      alert(err.message);
      throw err;
    }
  };

  // 3. Toggle Favorite local State
  const handleToggleFavorite = (title: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card select click
    let updated: string[];
    if (favorites.includes(title)) {
      updated = favorites.filter((f) => f !== title);
    } else {
      updated = [...favorites, title];
    }
    setFavorites(updated);
    localStorage.setItem("k_movie_favs", JSON.stringify(updated));
  };

  // 4. Client Filtering and Sorting Logic
  useEffect(() => {
    let result = [...movies];

    // Filter by viewTab (all or favorites only)
    if (viewTab === "favorites") {
      result = result.filter((m) => favorites.includes(m.title));
    }

    // Filter by search text query
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(query) ||
          m.actors.some((a) => a.toLowerCase().includes(query)) ||
          m.director.toLowerCase().includes(query) ||
          m.genre.toLowerCase().includes(query)
      );
    }

    // Filter by genre tag pill
    if (selectedGenre !== "전체") {
      result = result.filter((m) => m.genre.includes(selectedGenre));
    }

    // Sorting algorithms selection
    result.sort((a, b) => {
      if (sortBy === "rank") return a.rank - b.rank; // 1 to 10
      if (sortBy === "rating") return b.rating - a.rating; // High to low
      if (sortBy === "audiCnt") return b.audiCnt - a.audiCnt; // High to low
      return 0;
    });

    setFilteredMovies(result);
  }, [movies, searchQuery, selectedGenre, sortBy, viewTab, favorites]);

  // Extract unique genres tags
  const genres = ["전체", ...new Set(movies.map((m) => m.genre.split(",")[0].trim()))];

  return (
    <div className="min-h-screen bg-[#050505] font-sans text-white flex flex-col selection:bg-red-600 selection:text-white">
      {/* Premium Ambient Cinematic Background Gradients */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-red-950/10 via-transparent to-transparent pointer-events-none -z-10" />

      {/* 1. Header Navigation Bar */}
      <header className="border-b border-white/10 bg-[#050505]/90 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 bg-red-600 flex items-center justify-center border border-white/10">
              <Film className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter uppercase italic text-white flex items-center gap-2">
                CINE<span className="text-red-500 font-extrabold not-italic">CORE</span>
                <span className="text-[8px] font-mono tracking-widest bg-red-600/20 text-red-500 border border-red-500/25 px-2 py-0.5 not-italic uppercase ml-1">K-BoxOffice LIVE</span>
              </h1>
              <p className="text-[9px] uppercase tracking-widest text-[#a3a3a3] block mt-0.5 font-mono">Real-time KOBIS Grounding Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => {
                setViewTab("all");
                setSelectedGenre("전체");
              }}
              className={`text-xs font-black uppercase tracking-widest px-4 py-2 bg-transparent transition-all cursor-pointer border-b-2 hover:text-white ${
                viewTab === "all" ? "text-white border-white" : "text-white/40 border-transparent hover:border-white/20"
              }`}
            >
              Box Office
            </button>
            <button
              onClick={() => setViewTab("favorites")}
              className={`text-xs font-black uppercase tracking-widest px-4 py-2 bg-transparent transition-all cursor-pointer border-b-2 flex items-center gap-1.5 hover:text-white ${
                viewTab === "favorites" ? "text-white border-white" : "text-white/40 border-transparent hover:border-white/20"
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 text-white/50" />
              Favorites
              {favorites.length > 0 && (
                <span className="font-mono bg-red-600 text-white px-2 py-0.5 text-[9px] font-black">
                  {favorites.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {/* Real-time Indicator Widget card */}
        <div className="relative mb-10 overflow-hidden bg-[#0a0a0a] border border-white/10 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl rounded-sm">
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 shrink-0 rounded-none bg-[#111111] border border-white/10 flex items-center justify-center text-white shadow-inner">
              <Clapperboard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 bg-red-600 rounded-none animate-pulse"></span>
                <span className="text-[9px] text-red-500 font-mono font-black tracking-widest uppercase">
                  ACTIVE GROUNDING ENGINE
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-white uppercase italic mt-1">
                KOBIS DAILY BOX OFFICE REPORT
              </h2>
              <p className="text-xs text-white/60 mt-1 font-mono uppercase tracking-wide">
                <strong className="text-white font-bold">{getYesterdayStringFormatted()}</strong> ADMISSIONS INDEX GROUNDED VIA GEMINI SEARCH
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setShowCharts(!showCharts)}
              className="px-5 py-3 bg-white hover:bg-red-600 text-black hover:text-white text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border border-white/10 rounded-none"
            >
              {showCharts ? "Hide Analytics" : "Show Analytics"}
            </button>
            <button
              onClick={loadInitialData}
              className="p-3 bg-[#111111] hover:bg-red-600 text-white transition-colors cursor-pointer border border-white/10 rounded-none"
              title="Refresh Stats"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Loading Spinner Overlays */}
        {loading ? (
          <div className="py-24 text-center flex flex-col items-center justify-center gap-4">
            <div className="relative flex items-center justify-center">
              <div className="animate-spin rounded-none h-14 w-14 border-t-2 border-b-2 border-white"></div>
              <Film className="w-5 h-5 text-white absolute" />
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-widest text-white leading-relaxed">GROUNDING STAGE INTEL...</p>
              <p className="text-[11px] text-white/50 mt-1 font-mono uppercase tracking-tight">
                Gemini 3.5 is searching Korea official theater results. Processing live KOBIS logs.
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-[#0a0a0a] border border-red-500/30 rounded-none p-8 text-center max-w-lg mx-auto my-12 flex flex-col items-center gap-4 shadow-xl">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <h3 className="font-black text-sm uppercase tracking-widest text-red-500">Data Extraction Failure</h3>
            <p className="text-xs font-mono text-white/60">{error}</p>
            <button
              onClick={loadInitialData}
              className="mt-2 bg-[#111111] hover:bg-red-600 text-white text-[10px] uppercase font-black tracking-widest border border-white/10 px-5 py-3 rounded-none transition-colors cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Visualizer Statistics Expansion Panels */}
            {showCharts && movies.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden mb-8"
              >
                <AudienceChart movies={movies} />
              </motion.div>
            )}

            {/* 2. Interactive Filtering Controls */}
            <div className="bg-[#0a0a0a] border border-white/10 p-5 mb-8 rounded-sm">
              <div className="flex flex-col lg:flex-row gap-5 items-stretch lg:items-center justify-between">
                
                {/* Visual Search Box */}
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-white/50 absolute left-4.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search Title, Director, Actors or Genre..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs bg-[#050505] border border-white/10 focus:border-white focus:ring-0 outline-none pl-11 pr-4 py-3 rounded-none text-white/90 placeholder:text-white/40 tracking-wide font-mono uppercase"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-4 shrink-0">
                  {/* Sorting Criteria Selection */}
                  <div className="flex items-center gap-2 bg-[#050505] px-4 py-2 border border-white/10 rounded-sm">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-white/40" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Sort By</span>
                    <select
                      value={sortBy}
                      onChange={(e: any) => setSortBy(e.target.value)}
                      className="bg-transparent text-xs text-white/95 outline-none cursor-pointer border-0 p-0 font-bold uppercase font-mono"
                    >
                      <option value="rank" className="bg-[#0a0a0a]">DAILY RANK</option>
                      <option value="rating" className="bg-[#0a0a0a]">AUDIENCE SCORE</option>
                      <option value="audiCnt" className="bg-[#0a0a0a]">DAILY AUDIENCE</option>
                    </select>
                  </div>
                </div>

              </div>

              {/* Genre Filter Pills Tag List */}
              <div className="flex flex-wrap items-center gap-1.5 mt-4 pt-4 border-t border-white/5">
                <span className="text-[9px] text-white/40 font-black uppercase tracking-widest mr-2 font-mono">GENRE CLASSIFIER</span>
                {genres.map((g) => {
                  const isActive = selectedGenre === g;
                  return (
                    <button
                      key={g}
                      onClick={() => setSelectedGenre(g)}
                      className={`text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 transition-all cursor-pointer border rounded-none ${
                        isActive
                          ? "bg-white text-black border-white"
                          : "bg-[#0c0c0c] border-white/10 text-white/50 hover:text-white hover:border-white/30"
                      }`}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Movie Posters Grid Frame */}
            {filteredMovies.length === 0 ? (
              <div className="bg-[#0a0a0a] border border-white/15 border-dashed rounded-none py-24 px-8 text-center text-white/50 max-w-lg mx-auto shadow-lg">
                <Clapperboard className="w-10 h-10 text-white/30 mx-auto mb-4 animate-pulse" />
                <h4 className="font-black text-sm uppercase tracking-widest text-white">No Matching Film Data</h4>
                <p className="text-xs text-white/40 mt-2 leading-relaxed">
                  Clear custom search constraints or select a different genre classifier. Favorites tab operates filters exclusively on marked titles.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedGenre("전체");
                    setViewTab("all");
                  }}
                  className="mt-6 bg-[#111111] hover:bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-5 py-3 rounded-none border border-white/10 transition-all cursor-pointer"
                >
                  Reset Filter Stack
                </button>
              </div>
            ) : (
              <motion.div
                layout
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-16"
              >
                <AnimatePresence mode="popLayout">
                  {filteredMovies.map((movie) => (
                    <MovieCard
                      key={movie.title}
                      movie={movie}
                      isFavorite={favorites.includes(movie.title)}
                      onToggleFavorite={handleToggleFavorite}
                      onSelect={() => setSelectedMovie(movie)}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}

            {/* 4. Theater locator Map Panel */}
            {theaters.length > 0 && (
              <TheaterMap
                theaters={theaters}
                selectedTheaterId={selectedTheaterId}
                onSelectTheater={(id) => setSelectedTheaterId(id)}
              />
            )}
          </motion.div>
        )}
      </main>

      {/* 5. Ticker & Footer Content */}
      <div className="border-t border-white/10 h-12 flex items-center bg-[#050505] relative overflow-hidden shrink-0 mt-12">
        <div className="animate-marquee whitespace-nowrap">
          <div className="flex space-x-12 pr-12 text-white text-[9px] font-black uppercase tracking-[0.25em] select-none">
            <span>Trending: Exhuma crosses 11M mark admissions</span>
            <span className="text-white/30">|</span>
            <span>Real-time system synced securely with KOBIS databases</span>
            <span className="text-white/30">|</span>
            <span>Dune Part 2 holds long run blockbuster stats</span>
            <span className="text-white/30">|</span>
            <span>New trailers dropping daily at CGV Megabox Lotte</span>
            <span className="text-white/30">|</span>
            <span>Trending: Exhuma crosses 11M mark admissions</span>
            <span className="text-white/30">|</span>
            <span>Real-time system synced securely with KOBIS databases</span>
            <span className="text-white/30">|</span>
            <span>Dune Part 2 holds long run blockbuster stats</span>
            <span className="text-white/30">|</span>
            <span>New trailers dropping daily at CGV Megabox Lotte</span>
          </div>
        </div>
      </div>

      <footer className="border-t border-white/5 bg-[#050505] py-12">
        <div className="max-w-7xl mx-auto px-6 text-center text-white/40 text-[10px] font-mono uppercase tracking-wider">
          <p>© 2026 CINECORE STUDIO CO. POWERED SECURELY WITH SERVER-SIDE GEMINI API INTELLECT.</p>
          <p className="mt-2 text-white/20">
            THIS SITE AND DATA METRICS ARE RETRIEVED AUTHENTICALLY WITH NO SIMULATION OR FAKE INFRASTRUCTURE.
          </p>
        </div>
      </footer>

      {/* 6. Movie Details & Reviews Modal Overlay overlay */}
      <AnimatePresence>
        {selectedMovie && (
          <MovieDetailModal
            movie={selectedMovie}
            onClose={() => setSelectedMovie(null)}
            reviews={reviews}
            onAddReview={handleAddReview}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
