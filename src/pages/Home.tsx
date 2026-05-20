import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Play, BookOpen, Clock, ChevronRight, Sparkles, X, Star, 
  TrendingUp, Award, Users, Calendar, CheckCircle, 
  ChevronLeft, Volume2, Shield, Zap, Infinity, Target,
  FileQuestion, Monitor, Bell, AlertCircle, ImageOff
} from 'lucide-react';
import { ref, get } from 'firebase/database';
import { db } from '../lib/firebase';
import toast from 'react-hot-toast';

interface Video {
  id: string;
  topic: string;
  youtube_url: string;
  description: string;
  duration: string;
  thumbnail?: string;
  added_on: string;
}

interface LiveClass {
  id: string;
  title: string;
  youtube_stream_url: string;
  scheduled_at: string;
  duration: string;
  description: string;
  is_live: boolean;
  created_at: string;
  viewers: number;
}

interface Testimonial {
  id: number;
  name: string;
  role: string;
  content: string;
  image: string;
}

export default function Home() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [selectedLiveClass, setSelectedLiveClass] = useState<LiveClass | null>(null);
  const [countdowns, setCountdowns] = useState<{ [key: string]: string }>({});
  const [thumbnailErrors, setThumbnailErrors] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchVideos();
    fetchLiveClasses();
  }, []);

  // Countdown timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      const newCountdowns: { [key: string]: string } = {};
      
      liveClasses.forEach(liveClass => {
        if (!liveClass.is_live && new Date(liveClass.scheduled_at) > new Date()) {
          const timeLeft = getTimeRemaining(liveClass.scheduled_at);
          newCountdowns[liveClass.id] = timeLeft;
        }
      });
      
      setCountdowns(newCountdowns);
    }, 1000);

    return () => clearInterval(interval);
  }, [liveClasses]);

  async function fetchVideos() {
    try {
      const videosRef = ref(db, 'videos');
      const videosSnapshot = await get(videosRef);
      
      if (videosSnapshot.exists()) {
        const videosData = videosSnapshot.val();
        const videosList = Object.entries(videosData).map(([id, data]: [string, any]) => ({
          id,
          ...data
        })).sort((a, b) => new Date(b.added_on).getTime() - new Date(a.added_on).getTime());
        
        setVideos(videosList);
      } else {
        // Demo videos if no data in Firebase
        const demoVideos: Video[] = [
          {
            id: '1',
            topic: 'Introduction to Sanskrit',
            youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            description: 'Learn the basics of Sanskrit language, its history, and importance.',
            duration: '15 min',
            added_on: new Date().toISOString()
          },
          {
            id: '2',
            topic: 'Sanskrit Grammar Basics',
            youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            description: 'Understanding basic grammar rules and sentence structure.',
            duration: '20 min',
            added_on: new Date().toISOString()
          },
          {
            id: '3',
            topic: 'Common Sanskrit Words',
            youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            description: 'Learn frequently used Sanskrit words and their meanings.',
            duration: '18 min',
            added_on: new Date().toISOString()
          },
          {
            id: '4',
            topic: 'Pronunciation Guide',
            youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            description: 'Master correct Sanskrit pronunciation with examples.',
            duration: '22 min',
            added_on: new Date().toISOString()
          }
        ];
        setVideos(demoVideos);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast.error('Failed to load videos');
    } finally {
      setLoading(false);
    }
  }

  async function fetchLiveClasses() {
    try {
      const liveRef = ref(db, 'live_classes');
      const liveSnapshot = await get(liveRef);
      
      if (liveSnapshot.exists()) {
        const liveData = liveSnapshot.val();
        const liveList = Object.entries(liveData).map(([id, data]: [string, any]) => ({
          id,
          ...data
        })).sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
        
        setLiveClasses(liveList);
      }
    } catch (error) {
      console.error('Error fetching live classes:', error);
    }
  }

  function getTimeRemaining(scheduledTime: string): string {
    const now = new Date().getTime();
    const scheduled = new Date(scheduledTime).getTime();
    const diff = scheduled - now;

    if (diff <= 0) return 'Starting soon...';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  function getYouTubeId(url: string): string | null {
    if (!url) return null;
    
    // Handle different YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/live\/)([^?&"'>]+)/,
      /youtube\.com\/watch\?.*v=([^&]+)/,
      /youtube\.com\/live\/([^?]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  }

  function getYouTubeEmbedUrl(url: string, autoplay: boolean = false): string {
    const videoId = getYouTubeId(url);
    if (!videoId) return '';
    
    // Check if it's a live stream URL
    const isLive = url.includes('/live/') || url.includes('live');
    
    // For live streams, use different parameters
    if (isLive) {
      return `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&mute=${autoplay ? 1 : 0}&controls=1&rel=0&modestbranding=1`;
    }
    
    return `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&rel=0&modestbranding=1&controls=1&showinfo=0&iv_load_policy=3`;
  }

  function getThumbnail(url: string): string {
    const videoId = getYouTubeId(url);
    if (!videoId) return '';
    
    // Try different thumbnail qualities
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }

  function handleThumbnailError(videoId: string) {
    setThumbnailErrors(prev => ({ ...prev, [videoId]: true }));
  }

  const testimonials: Testimonial[] = [
    {
      id: 1,
      name: 'Priya Sharma',
      role: 'Student',
      content: 'The structured lessons and mock tests helped me understand Sanskrit grammar deeply. Highly recommended!',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
    },
    {
      id: 2,
      name: 'Rahul Verma',
      role: 'Language Enthusiast',
      content: 'Amazing platform! The video quality and teaching methodology is exceptional.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
    },
    {
      id: 3,
      name: 'Dr. Anjali Desai',
      role: 'Sanskrit Scholar',
      content: 'A wonderful initiative to learn Sanskrit online. The content is authentic and well-structured.',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150'
    }
  ];

  const features = [
    { icon: <Play className="w-5 h-5" />, title: 'Expert Video Lessons', description: 'High-quality video lectures by experienced teachers' },
    { icon: <Target className="w-5 h-5" />, title: 'Mock Tests', description: 'Test your knowledge with Sanskrit-specific questions' },
    { icon: <Users className="w-5 h-5" />, title: 'Learn at Your Pace', description: 'Access content anytime, anywhere' },
    { icon: <Award className="w-5 h-5" />, title: 'Certificate Ready', description: 'Track your progress and achievements' },
    { icon: <Monitor className="w-5 h-5" />, title: 'Live Classes', description: 'Interactive sessions with expert teachers' },
    { icon: <Calendar className="w-5 h-5" />, title: 'Scheduled Learning', description: 'Structured curriculum with proper scheduling' }
  ];

  const stats = [
    { icon: <Users className="w-4 h-4" />, value: '500+', label: 'Active Students', color: 'from-blue-500 to-cyan-500' },
    { icon: <Play className="w-4 h-4" />, value: '20+', label: 'Video Lessons', color: 'from-red-500 to-orange-500' },
    { icon: <FileQuestion className="w-4 h-4" />, value: '50+', label: 'Practice Questions', color: 'from-purple-500 to-pink-500' },
    { icon: <Award className="w-4 h-4" />, value: '95%', label: 'Success Rate', color: 'from-emerald-500 to-teal-500' }
  ];

  const activeLiveClasses = liveClasses.filter(l => l.is_live);
  const upcomingLiveClasses = liveClasses.filter(l => !l.is_live && new Date(l.scheduled_at) > new Date());

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#0F172A]">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#6366F1] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#8B5CF6] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-[#6366F1]/20 via-[#8B5CF6]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#6366F1]/20 to-[#8B5CF6]/20 border border-[#6366F1]/30 backdrop-blur-sm text-[#6366F1] text-xs font-medium mb-6 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            Sanskrit Learning Platform
          </div>

          <h1 className="text-4xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Master Sanskrit with{' '}
            <span className="bg-gradient-to-r from-[#6366F1] via-[#8B5CF6] to-[#A855F7] bg-clip-text text-transparent animate-gradient">
              Sankalpasiddhi
            </span>
          </h1>

          <p className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto mb-6 leading-relaxed">
            Transform your Sanskrit learning journey with structured lessons, 
            expert video classes, and comprehensive mock tests.
          </p>

          <div className="max-w-2xl mx-auto mb-10 px-6 py-4 rounded-2xl bg-[#1E293B]/40 backdrop-blur-sm border border-white/5">
            <p className="text-[#8B5CF6] text-xl md:text-2xl font-semibold mb-2 font-sanskrit">
              वदतु संस्कृतम्, पठतु संस्कृतम्
            </p>
            <p className="text-slate-500 text-sm">"Speak Sanskrit, Read Sanskrit"</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/mock-test"
              className="group relative flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-semibold text-sm shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] transition-all duration-300 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                Take Mock Test <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
            <a
              href="#videos"
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl border border-white/10 bg-white/5 text-slate-300 font-medium text-sm hover:bg-white/10 hover:border-white/20 hover:scale-[1.02] transition-all duration-300"
            >
              <BookOpen className="w-4 h-4" /> Browse Lessons
            </a>
          </div>
        </div>

        <div className="relative max-w-5xl mx-auto mt-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, idx) => (
              <div key={idx} className="group relative text-center p-5 rounded-2xl bg-gradient-to-br from-[#1E293B]/60 to-[#1E293B]/30 backdrop-blur-sm border border-white/5 hover:border-white/10 transition-all duration-300 hover:scale-105">
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`}></div>
                <div className="flex items-center justify-center mb-2">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#6366F1]">
                    {stat.icon}
                  </div>
                </div>
                <div className="text-2xl font-bold text-white mb-0.5">{stat.value}</div>
                <div className="text-xs text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Classes Section */}
      {(activeLiveClasses.length > 0 || upcomingLiveClasses.length > 0) && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
                <Monitor className="w-8 h-8 text-red-500 animate-pulse" />
                Live Classes
              </h2>
              <p className="text-slate-400">Join interactive sessions with expert teachers</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20">
              <Bell className="w-4 h-4 text-red-400 animate-pulse" />
              <span className="text-red-400 text-sm font-medium">Get notified for upcoming classes</span>
            </div>
          </div>

          {/* Active Live Classes */}
          {activeLiveClasses.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-gradient-to-b from-red-500 to-orange-500 rounded-full"></div>
                <h3 className="text-white font-semibold">🔴 LIVE NOW</h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {activeLiveClasses.map((liveClass) => (
                  <div
                    key={liveClass.id}
                    className="group relative bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-2xl overflow-hidden border border-red-500/30 hover:border-red-500/50 transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                    onClick={() => setSelectedLiveClass(liveClass)}
                  >
                    <div className="relative aspect-video bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden">
                      {getThumbnail(liveClass.youtube_stream_url) && !thumbnailErrors[liveClass.id] ? (
                        <img
                          src={getThumbnail(liveClass.youtube_stream_url)}
                          alt={liveClass.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={() => handleThumbnailError(liveClass.id)}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#1E293B] to-[#0F172A]">
                          <Monitor className="w-16 h-16 text-slate-600 mb-2" />
                          <p className="text-slate-500 text-sm">Live Stream</p>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      
                      {/* Live Badge */}
                      <div className="absolute top-4 left-4 flex items-center gap-2">
                        <div className="flex items-center gap-1.5 bg-red-500 px-3 py-1.5 rounded-full shadow-lg">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          <span className="text-white text-xs font-bold">LIVE</span>
                        </div>
                      </div>

                      {/* Viewers Count */}
                      <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
                        <Users className="w-3 h-3 text-white" />
                        <span className="text-white text-xs font-medium">{liveClass.viewers || 0} watching</span>
                      </div>

                      {/* Join Button Overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-2xl">
                          <Play className="w-8 h-8 text-white ml-1" fill="white" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-5">
                      <h3 className="font-bold text-white text-lg mb-2 group-hover:text-red-400 transition-colors">
                        {liveClass.title}
                      </h3>
                      <p className="text-slate-400 text-sm mb-3">{liveClass.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                          <Clock className="w-4 h-4" />
                          <span>Started at {new Date(liveClass.scheduled_at).toLocaleTimeString()}</span>
                        </div>
                        <button
                          onClick={() => setSelectedLiveClass(liveClass)}
                          className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
                        >
                          Join Now
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Live Classes */}
          {upcomingLiveClasses.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-gradient-to-b from-[#6366F1] to-[#8B5CF6] rounded-full"></div>
                <h3 className="text-white font-semibold">📅 Upcoming Classes</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {upcomingLiveClasses.map((liveClass) => {
                  const timeLeft = countdowns[liveClass.id] || getTimeRemaining(liveClass.scheduled_at);
                  return (
                    <div
                      key={liveClass.id}
                      className="group bg-[#1E293B]/50 backdrop-blur-sm rounded-xl border border-white/10 hover:border-[#6366F1]/30 transition-all duration-300 cursor-pointer overflow-hidden"
                      onClick={() => setSelectedLiveClass(liveClass)}
                    >
                      <div className="relative aspect-video bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden">
                        {getThumbnail(liveClass.youtube_stream_url) && !thumbnailErrors[`upcoming_${liveClass.id}`] ? (
                          <img
                            src={getThumbnail(liveClass.youtube_stream_url)}
                            alt={liveClass.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={() => handleThumbnailError(`upcoming_${liveClass.id}`)}
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center">
                            <Calendar className="w-12 h-12 text-slate-600 mb-2" />
                            <p className="text-slate-500 text-xs">Upcoming Stream</p>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        
                        {/* Countdown Timer */}
                        <div className="absolute bottom-4 left-4 right-4">
                          <div className="bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 text-center">
                            <p className="text-slate-400 text-xs mb-1">Starts in</p>
                            <p className="text-white font-mono font-bold text-lg tracking-wider">{timeLeft}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4">
                        <h3 className="font-semibold text-white text-sm mb-2 line-clamp-2 group-hover:text-[#6366F1] transition-colors">
                          {liveClass.title}
                        </h3>
                        <div className="flex items-center gap-2 text-slate-500 text-xs mb-3">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(liveClass.scheduled_at).toLocaleDateString()}</span>
                          <Clock className="w-3 h-3 ml-2" />
                          <span>{new Date(liveClass.scheduled_at).toLocaleTimeString()}</span>
                        </div>
                        <button
                          onClick={() => setSelectedLiveClass(liveClass)}
                          className="w-full py-2 rounded-lg bg-[#0F172A] text-slate-400 text-xs font-medium hover:bg-[#6366F1] hover:text-white transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">Why Choose Sankalpasiddhi?</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            We provide a comprehensive learning experience with modern tools and authentic Sanskrit content
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <div key={idx} className="group bg-[#1E293B]/50 backdrop-blur-sm rounded-2xl p-6 border border-white/5 hover:border-[#6366F1]/30 hover:shadow-lg hover:shadow-[#6366F1]/10 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6366F1]/20 to-[#8B5CF6]/20 flex items-center justify-center mb-4 text-[#6366F1] group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Video Library Section */}
      <section id="videos" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Video Classroom</h2>
            <p className="text-slate-400">Watch and learn Sanskrit at your own pace</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20">
            <Star className="w-4 h-4 text-amber-400" fill="currentColor" />
            <span className="text-amber-400 text-sm font-medium">Curated Content</span>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-[#1E293B] rounded-2xl overflow-hidden border border-white/5 animate-pulse">
                <div className="aspect-video bg-slate-700/50" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-slate-700/50 rounded w-3/4" />
                  <div className="h-3 bg-slate-700/50 rounded w-1/2" />
                  <div className="h-3 bg-slate-700/50 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-20 bg-[#1E293B]/30 rounded-2xl border border-white/5">
            <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No videos available yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {videos.map((video, index) => (
              <div
                key={video.id}
                className="group relative bg-[#1E293B] rounded-2xl overflow-hidden border border-white/5 hover:border-[#6366F1]/40 hover:shadow-2xl hover:shadow-[#6366F1]/10 transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                onClick={() => setSelectedVideo(video)}
              >
                <div className="relative aspect-video bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden">
                  {getThumbnail(video.youtube_url) && !thumbnailErrors[video.id] ? (
                    <>
                      <img
                        src={getThumbnail(video.youtube_url)}
                        alt={video.topic}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                        onError={() => handleThumbnailError(video.id)}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#1E293B] to-[#0F172A]">
                      <Play className="w-12 h-12 text-slate-600 mb-2" />
                      <p className="text-slate-500 text-xs">Video Thumbnail</p>
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-[#6366F1] group-hover:scale-110 transition-all duration-300 shadow-lg">
                      <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
                    </div>
                  </div>
                  
                  <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-md">
                    <Clock className="w-3 h-3 text-slate-300" />
                    <span className="text-slate-300 text-xs font-medium">{video.duration}</span>
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-white text-sm leading-snug mb-2 line-clamp-2 group-hover:text-[#6366F1] transition-colors">
                    {video.topic}
                  </h3>
                  {video.description && (
                    <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                      {video.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Testimonials Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">What Our Students Say</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Join hundreds of successful learners who have mastered Sanskrit with us
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="bg-[#1E293B]/50 backdrop-blur-sm rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-[#6366F1]/30"
                />
                <div>
                  <h4 className="text-white font-semibold text-sm">{testimonial.name}</h4>
                  <p className="text-slate-500 text-xs">{testimonial.role}</p>
                </div>
              </div>
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-amber-400" fill="currentColor" />
                ))}
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">"{testimonial.content}"</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative max-w-5xl mx-auto px-4 mb-24">
        <div className="relative bg-gradient-to-r from-[#6366F1]/20 to-[#8B5CF6]/20 rounded-3xl p-8 md:p-12 text-center border border-white/10 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#6366F1] rounded-full filter blur-3xl opacity-10"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#8B5CF6] rounded-full filter blur-3xl opacity-10"></div>
          <div className="relative z-10">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Ready to Start Your Sanskrit Journey?
            </h3>
            <p className="text-slate-300 mb-6 max-w-md mx-auto">
              Get access to all video lessons, mock tests, and study materials
            </p>
            <Link
              to="/mock-test"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-semibold text-sm shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] transition-all duration-300"
            >
              Get Started <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Video Modal */}
      {selectedVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn"
          onClick={() => setSelectedVideo(null)}
        >
          <div
            className="relative w-full max-w-4xl bg-[#1E293B] rounded-2xl overflow-hidden shadow-2xl border border-white/20 animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-[#1E293B] to-[#0F172A]">
              <div>
                <h3 className="text-white font-semibold text-lg">{selectedVideo.topic}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <p className="text-slate-500 text-xs">{selectedVideo.duration}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedVideo(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="aspect-video bg-black">
              <iframe
                src={getYouTubeEmbedUrl(selectedVideo.youtube_url, true)}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                title={selectedVideo.topic}
              />
            </div>
            
            {selectedVideo.description && (
              <div className="px-6 py-4 bg-[#0F172A]/50">
                <p className="text-slate-400 text-sm leading-relaxed">{selectedVideo.description}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Live Class Modal */}
      {selectedLiveClass && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn"
          onClick={() => setSelectedLiveClass(null)}
        >
          <div
            className="relative w-full max-w-4xl bg-[#1E293B] rounded-2xl overflow-hidden shadow-2xl border border-white/20 animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-[#1E293B] to-[#0F172A]">
              <div className="flex items-center gap-3">
                {selectedLiveClass.is_live ? (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-red-500 text-xs font-bold">LIVE</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#6366F1]" />
                    <span className="text-[#6366F1] text-xs font-bold">UPCOMING</span>
                  </div>
                )}
                <div>
                  <h3 className="text-white font-semibold text-lg">{selectedLiveClass.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <p className="text-slate-500 text-xs">
                      {selectedLiveClass.is_live 
                        ? `Started at ${new Date(selectedLiveClass.scheduled_at).toLocaleTimeString()}`
                        : `Scheduled for ${new Date(selectedLiveClass.scheduled_at).toLocaleString()}`
                      }
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedLiveClass(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="aspect-video bg-black">
              {getYouTubeEmbedUrl(selectedLiveClass.youtube_stream_url) ? (
                <iframe
                  src={getYouTubeEmbedUrl(selectedLiveClass.youtube_stream_url, selectedLiveClass.is_live)}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                  title={selectedLiveClass.title}
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                  <AlertCircle className="w-16 h-16 text-slate-600 mb-4" />
                  <p className="text-slate-400">Unable to load video stream</p>
                  <p className="text-slate-500 text-sm mt-2">Please check the video URL</p>
                </div>
              )}
            </div>
            
            {selectedLiveClass.description && (
              <div className="px-6 py-4 bg-[#0F172A]/50">
                <p className="text-slate-400 text-sm leading-relaxed">{selectedLiveClass.description}</p>
                {!selectedLiveClass.is_live && (
                  <div className="mt-3 flex items-center gap-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <AlertCircle className="w-4 h-4 text-blue-400" />
                    <p className="text-blue-400 text-xs">This class hasn't started yet. The stream will begin at the scheduled time.</p>
                  </div>
                )}
                {selectedLiveClass.is_live && (
                  <div className="mt-3 flex items-center gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <p className="text-green-400 text-xs">This class is currently live! The stream should start playing automatically.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 3s linear infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .font-sanskrit {
          font-family: 'Noto Serif Devanagari', 'Noto Sans Devanagari', serif;
        }
      `}</style>
    </div>
  );
}