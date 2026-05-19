import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, BookOpen, Clock, ChevronRight, Sparkles, X, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Video } from '../types';

export default function Home() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  async function fetchVideos() {
    const { data, error } = await supabase.from('videos').select('*').order('added_on', { ascending: true });
    console.log('Home fetchVideos', { data, error });
    setVideos(data ?? []);
    setLoading(false);
  }

  function getYouTubeId(url: string) {
    const match = url.match(/(?:embed\/|v=|youtu\.be\/)([^?&"'>]+)/);
    return match ? match[1] : '';
  }

  function getYouTubeEmbedUrl(url: string) {
    const id = getYouTubeId(url);
    return id ? `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&autoplay=1` : url;
  }

  function getThumbnail(url: string) {
    const id = getYouTubeId(url);
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '';
  }

  return (
    <div className="min-h-screen bg-[#0F172A]">
      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-[#6366F1]/20 via-[#8B5CF6]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#6366F1]/10 border border-[#6366F1]/30 text-[#6366F1] text-xs font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Sanskrit Learning Platform
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-white mb-5 leading-tight">
            Master Sanskrit with{' '}
            <span className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] bg-clip-text text-transparent">
              Sankalpasiddhi
            </span>
          </h1>

          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-4 leading-relaxed">
            Structured lessons, curated video classes, and mock tests designed to deepen your Sanskrit knowledge.
          </p>

          <p className="text-[#8B5CF6] font-semibold text-xl mb-10 tracking-wide">संकल्पसिद्धि</p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/mock-test"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-semibold text-sm shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] transition-all duration-200"
            >
              Take Mock Test <ChevronRight className="w-4 h-4" />
            </Link>
            <a
              href="#videos"
              className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 text-slate-300 font-medium text-sm hover:bg-white/5 hover:border-white/20 transition-all duration-200"
            >
              <BookOpen className="w-4 h-4" /> Browse Lessons
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="relative max-w-3xl mx-auto mt-16 grid grid-cols-3 gap-4">
          {[
            { label: 'Video Lessons', value: String(videos.length || '5') + '+' },
            { label: 'Sanskrit Questions', value: '5+' },
            { label: 'Students Enrolled', value: '100+' },
          ].map((stat) => (
            <div key={stat.label} className="text-center p-4 rounded-2xl bg-[#1E293B]/60 border border-white/5">
              <div className="text-2xl font-bold text-white mb-0.5">{stat.value}</div>
              <div className="text-xs text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Video Library */}
      <section id="videos" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Video Classroom</h2>
            <p className="text-slate-500 text-sm">Watch and learn Sanskrit at your own pace</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1E293B] border border-white/10 text-slate-400 text-xs">
            <Star className="w-3.5 h-3.5 text-amber-400" fill="currentColor" />
            Curated Content
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-[#1E293B] rounded-2xl overflow-hidden border border-white/5 animate-pulse">
                <div className="aspect-video bg-slate-700/50" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-slate-700/50 rounded w-3/4" />
                  <div className="h-3 bg-slate-700/50 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {videos.map((video) => (
              <div
                key={video.id}
                className="group bg-[#1E293B] rounded-2xl overflow-hidden border border-white/5 hover:border-[#6366F1]/40 hover:shadow-lg hover:shadow-[#6366F1]/10 transition-all duration-300 cursor-pointer"
                onClick={() => setSelectedVideo(video)}
              >
                <div className="relative aspect-video bg-slate-900 overflow-hidden">
                  {getThumbnail(video.youtube_url) ? (
                    <img
                      src={getThumbnail(video.youtube_url)}
                      alt={video.topic}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1E293B] to-[#0F172A]">
                      <BookOpen className="w-10 h-10 text-slate-600" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-[#6366F1] group-hover:scale-110 transition-all duration-300 shadow-lg">
                      <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded-md">
                    <Clock className="w-3 h-3 text-slate-300" />
                    <span className="text-slate-300 text-xs">{video.duration}</span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-white text-sm leading-snug mb-1.5 group-hover:text-[#6366F1] transition-colors">
                    {video.topic}
                  </h3>
                  {video.description && (
                    <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">{video.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Video Modal */}
      {selectedVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedVideo(null)}
        >
          <div
            className="relative w-full max-w-3xl bg-[#1E293B] rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div>
                <h3 className="text-white font-semibold">{selectedVideo.topic}</h3>
                <p className="text-slate-500 text-xs mt-0.5">{selectedVideo.duration}</p>
              </div>
              <button
                onClick={() => setSelectedVideo(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video">
              <iframe
                src={getYouTubeEmbedUrl(selectedVideo.youtube_url)}
                className="w-full h-full"
                frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                title={selectedVideo.topic}
              />
            </div>
            {selectedVideo.description && (
              <div className="px-5 py-4 text-slate-400 text-sm">{selectedVideo.description}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
