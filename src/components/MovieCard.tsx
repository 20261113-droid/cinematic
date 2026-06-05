import React from "react";
import { Movie } from "../types";
import { Star, Eye, Calendar, PlayCircle, Heart } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Props {
  key?: string;
  movie: Movie;
  isFavorite: boolean;
  onToggleFavorite: (movieTitle: string, e: React.MouseEvent) => void;
  onSelect: () => void;
}

export default function MovieCard({ movie, isFavorite, onToggleFavorite, onSelect }: Props) {
  // Format audience size representation
  const formatAudience = (count: number) => {
    if (count >= 10000) {
      return `${(count / 10000).toFixed(1)}만 명`;
    }
    return `${count.toLocaleString()}명`;
  };

  // Determine rank change indicators styling
  const getRankBadge = () => {
    const intensity = movie.rankInten;
    if (intensity === "New") {
      return "bg-amber-500 text-neutral-950 font-black border border-white/10 text-[9px]";
    }
    if (intensity.startsWith("+")) {
      return "bg-white/10 text-white border border-white/20 text-[9px]";
    }
    if (intensity.startsWith("-")) {
      return "bg-red-950/40 text-red-400 border border-red-500/20 text-[9px]";
    }
    return "bg-neutral-900 text-neutral-400 border border-white/5 text-[9px]";
  };

  const formattedRank = movie.rank < 10 ? `0${movie.rank}` : `${movie.rank}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.4 }}
      className="group relative bg-[#0a0a0a] border border-white/10 rounded-sm overflow-hidden h-[460px] cursor-pointer"
      onClick={onSelect}
    >
      {/* 1. Base Poster Artwork with Grayscale option */}
      <div className="w-full h-full relative overflow-hidden">
        <img
          src={movie.posterUrl}
          alt={movie.title}
          className="w-full h-full object-cover opacity-70 grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />

        {/* Dynamic Dark Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent opacity-90 z-10" />

        {/* Top Floating Icons & Indicators */}
        <div className="absolute top-4 inset-x-4 flex items-center justify-between z-20 pointer-events-none">
          {/* Daily Editorial Rank */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <span className="text-3xl font-black italic tracking-tighter text-white drop-shadow-md">
              {formattedRank}
            </span>
            {movie.rankInten !== "0" && (
              <span className={`font-mono uppercase font-black px-1.5 py-0.5 rounded-sm shadow-md ${getRankBadge()}`}>
                {movie.rankInten}
              </span>
            )}
          </div>

          {/* Editorial bookmark heart */}
          <button
            onClick={(e) => onToggleFavorite(movie.title, e)}
            className="w-7 h-7 rounded-none bg-black/80 border border-white/10 flex items-center justify-center pointer-events-auto cursor-pointer transition-colors hover:bg-red-600 hover:border-red-600"
          >
            <Heart
              className={`w-3.5 h-3.5 transition-transform active:scale-125 ${
                isFavorite ? "fill-red-500 text-red-500" : "text-white/60 hover:text-white"
              }`}
            />
          </button>
        </div>

        {/* Base Bottom Static Caption Area (visible default) */}
        <div className="absolute bottom-0 inset-x-0 p-5 bg-gradient-to-t from-[#050505] via-[#050505]/95 to-transparent transition-opacity duration-300 group-hover:opacity-0 z-20">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] uppercase font-bold tracking-widest text-red-500">
              {movie.genre.split(",")[0]}
            </span>
          </div>
          <h3 className="font-extrabold uppercase text-white text-lg tracking-tight line-clamp-1 italic">{movie.title}</h3>
          
          <div className="flex items-center mt-3 justify-between">
            <div className="flex items-center gap-1 text-xs text-yellow-500 font-mono">
              <span className="text-yellow-600">★</span>
              <span className="font-bold">{movie.rating}</span>
            </div>
            <span className="text-[10px] text-white/45 font-mono">
              Admissions: <strong className="text-white font-bold">{formatAudience(movie.audiCnt)}</strong>
            </span>
          </div>
        </div>

        {/* 2. Slide Up Hover overlay panel */}
        <div className="absolute inset-x-0 bottom-0 top-[15%] bg-[#080808]/98 backdrop-blur-md p-5 border-t border-white/10 flex flex-col justify-between translate-y-full transition-transform duration-500 ease-out group-hover:translate-y-0 z-30">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
              <span className="text-[9px] font-black uppercase tracking-widest text-red-500">
                {movie.genre}
              </span>
              <span className="text-[10px] text-white/50 font-mono italic">{movie.showTm}</span>
            </div>

            <h3 className="font-black text-white text-xl uppercase tracking-tighter italic mb-3">{movie.title}</h3>

            <p className="text-xs text-white/60 line-clamp-5 leading-relaxed text-justify mb-4">
              {movie.synopsis}
            </p>

            <div className="space-y-1.5 border-t border-white/5 pt-3.5 text-[11px] font-mono text-white/70">
              <div className="flex justify-between">
                <span className="text-white/30 uppercase tracking-wider text-[9px]">Director</span>
                <span className="font-bold text-white/90">{movie.director}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/30 uppercase tracking-wider text-[9px]">Cast</span>
                <span className="font-bold text-white/90 line-clamp-1">{movie.actors.slice(0, 3).join(", ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/30 uppercase tracking-wider text-[9px]">Total Admissions</span>
                <span className="font-bold text-red-400">{formatAudience(movie.audiAcc)}</span>
              </div>
            </div>
          </div>

          <button className="w-full bg-white hover:bg-red-600 hover:text-white text-black font-black text-[10px] uppercase tracking-widest py-3 rounded-none transition-all duration-300 mt-4 flex items-center justify-center gap-1.5 shadow-lg">
            <PlayCircle className="w-4 h-4 shrink-0" />
            Play Trailer & Details
          </button>
        </div>
      </div>
    </motion.div>
  );
}
