import React, { useState, useEffect } from "react";
import { Movie, Review } from "../types";
import { X, Play, Clock, Milestone, Calendar, ThumbsUp, Star } from "lucide-react";
import { motion } from "motion/react";

interface Props {
  movie: Movie;
  onClose: () => void;
  reviews: Review[];
  onAddReview: (reviewData: { movieTitle: string; author: string; rating: number; content: string }) => Promise<void>;
}

export default function MovieDetailModal({ movie, onClose, reviews, onAddReview }: Props) {
  const [author, setAuthor] = useState("");
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [subSuccess, setSubSuccess] = useState(false);

  // Filter reviews specifically for this movie
  const movieReviews = reviews.filter((r) => r.movieTitle === movie.title);

  // Build bulletproof trailer embed URL
  // If trailerId is a real Youtube ID (usually 11 chars), play directly. Otherwise search query.
  const isYoutubeId = movie.trailerId && movie.trailerId.length === 11 && !movie.trailerId.includes(" ");
  const embedUrl = isYoutubeId
    ? `https://www.youtube.com/embed/${movie.trailerId}?autoplay=1&mute=1`
    : `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(movie.title + " 메인 예고편")}&autoplay=1&mute=1`;

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !content.trim()) return;

    setSubmitting(true);
    try {
      await onAddReview({
        movieTitle: movie.title,
        author,
        rating,
        content,
      });
      setAuthor("");
      setContent("");
      setRating(5);
      setSubSuccess(true);
      setTimeout(() => setSubSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Prevent scroll propagation
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const formattedRank = movie.rank < 10 ? `0${movie.rank}` : `${movie.rank}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/90 backdrop-blur-md overflow-y-auto">
      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 15 }}
        transition={{ type: "tween", duration: 0.4 }}
        className="relative w-full max-w-5xl bg-[#0a0a0a] border border-white/10 rounded-none shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header Block with absolute close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2.5 rounded-none bg-black/80 hover:bg-red-600 hover:text-white transition-all cursor-pointer border border-white/10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Scrollable Container */}
        <div className="overflow-y-auto flex-1 custom-scroller">
          {/* Top banner / Video Trailer preview */}
          <div className="relative w-full aspect-video md:h-[380px] bg-[#050505]">
            <iframe
              src={embedUrl}
              title={`${movie.title} 공식 예고편`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full border-0 absolute inset-0"
              referrerPolicy="no-referrer"
            />
            {/* Top gradient shadow overlay */}
            <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
          </div>

          <div className="p-6 md:p-10">
            {/* Main Header Info Area */}
            <div className="flex flex-col md:flex-row gap-8 pb-8 border-b border-white/10">
              {/* Poster Art reflection */}
              <div className="w-full md:w-56 shrink-0 aspect-[2/3] md:h-80 rounded-none overflow-hidden relative shadow-2xl border border-white/10">
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 left-3 bg-red-600 text-white font-mono font-black italic text-xs px-3 py-1 rounded-none shadow-lg">
                  RANK {formattedRank}
                </div>
              </div>

              {/* Title & Stats description */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <span className="text-[9px] font-black text-red-500 uppercase tracking-widest bg-red-500/10 px-2.5 py-1 rounded-none border border-red-500/20">
                      {movie.genre}
                    </span>
                    <span className="text-[10px] text-white/50 bg-[#111] px-2.5 py-1 rounded-none flex items-center gap-1.5 border border-white/10 font-mono uppercase">
                      <Clock className="w-3.5 h-3.5" />
                      {movie.showTm}
                    </span>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-black italic uppercase text-white tracking-tighter mb-3">
                    {movie.title}
                  </h1>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                    <div className="bg-[#050505] border border-white/10 rounded-none p-3">
                      <span className="text-[9px] uppercase tracking-wider text-white/30 font-mono block">Director</span>
                      <span className="text-xs font-bold text-white/90">{movie.director}</span>
                    </div>

                    <div className="bg-[#050505] border border-white/10 rounded-none p-3 lg:col-span-2">
                      <span className="text-[9px] uppercase tracking-wider text-white/30 font-mono block">Cast members</span>
                      <span className="text-xs font-bold text-white/90 line-clamp-1">
                        {movie.actors.join(", ")}
                      </span>
                    </div>

                    <div className="bg-[#050505] border border-white/10 rounded-none p-3">
                      <span className="text-[9px] uppercase tracking-wider text-white/30 font-mono block">Rating score</span>
                      <span className="text-xs font-bold text-yellow-500 flex items-center gap-1">
                        ★ {movie.rating}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-[10px] font-black uppercase tracking-wider text-[#a3a3a3] mb-1.5 font-mono">Synopsis summary</h3>
                    <p className="text-xs text-white/70 leading-relaxed text-justify">
                      {movie.synopsis}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-4 text-[10px] text-white/40 font-mono">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-red-500" />
                    <span className="uppercase tracking-wider">Release: <strong className="text-white">{movie.openDt}</strong></span>
                  </div>
                  <div className="flex gap-4">
                    <span>YESTERDAY: <strong className="text-red-500">{movie.audiCnt.toLocaleString()}명</strong></span>
                    <span>AGGREGATE: <strong className="text-white">{movie.audiAcc.toLocaleString()}명</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments & Reviews section */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 mt-8">
              {/* Left Side: Live Comments Feed */}
              <div className="lg:col-span-3">
                <h3 className="text-sm font-black uppercase tracking-widest text-white mb-4 flex items-center gap-2">
                  Audience Feed Backs
                  <span className="text-[9px] bg-red-600 text-white px-2 py-0.5 font-mono">
                    {movieReviews.length}
                  </span>
                </h3>

                <div className="space-y-4 max-h-[360px] overflow-y-auto pr-2 custom-scroller">
                  {movieReviews.length === 0 ? (
                    <div className="bg-[#050505] border border-dashed border-white/10 rounded-none py-12 px-6 text-center text-white/40 text-xs font-mono">
                      BE THE FIRST REVIEW SIGNATURE. LEAVE FEEDBACK BELOW.
                    </div>
                  ) : (
                    movieReviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="p-4 bg-[#050505] border border-white/10 rounded-none flex flex-col gap-2"
                      >
                        <div className="flex items-center justify-between">
                          <strong className="text-xs font-extrabold uppercase text-white/90 font-mono">{rev.author}</strong>
                          <div className="flex text-yellow-500">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${
                                  i < rev.rating ? "fill-current" : "text-neutral-800"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-white/80 leading-relaxed">{rev.content}</p>
                        <span className="text-[9px] text-white/30 text-right self-end font-mono">
                          {new Date(rev.createdAt).toLocaleDateString("ko-KR")}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right Side: Post A Feedback Form */}
              <div className="lg:col-span-2 bg-[#050505] border border-white/10 rounded-none p-5 h-fit">
                <h4 className="text-xs font-black uppercase tracking-widest text-[#a3a3a3] mb-3 block font-mono">Cast Your Vote</h4>
                
                {subSuccess && (
                  <div className="mb-4 text-[10px] font-mono uppercase text-emerald-400 bg-emerald-500/10 p-2.5 border border-emerald-500/20">
                    Feedback safely recorded. Thank you.
                  </div>
                )}

                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-white/30 font-mono block mb-1">Author identifier</label>
                    <input
                      type="text"
                      required
                      placeholder="Username / Alias"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      className="w-full text-xs bg-[#0a0a0a] border border-white/10 focus:border-white outline-none p-2.5 rounded-none text-white transition-colors uppercase font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-white/30 font-mono block mb-1">Rating score</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="p-1 hover:scale-110 transition-transform cursor-pointer outline-none"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              star <= rating ? "fill-yellow-500 text-yellow-500" : "text-neutral-800"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-white/30 font-mono block mb-1">Commentary review</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Write your editorial thoughts on this theatrical piece..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full text-xs bg-[#0a0a0a] border border-white/10 focus:border-white outline-none p-2.5 rounded-none text-white transition-colors resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-white hover:bg-red-600 hover:text-white disabled:opacity-50 text-black font-black text-[10px] uppercase tracking-widest p-3 rounded-none transition-colors cursor-pointer border border-white/10"
                  >
                    {submitting ? "RECORDING..." : "COMMIT REVIEW"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
