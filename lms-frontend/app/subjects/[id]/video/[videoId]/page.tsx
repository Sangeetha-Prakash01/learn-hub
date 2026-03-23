'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../../../../../lib/apiClient';
import { useSidebarStore } from '../../../../../store/sidebarStore';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, Lock, Loader2, CheckCircle2, Trophy, Home, Play, ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { OrbBackground } from '../../../../components/Design';

interface VideoData {
  id: number; title: string; description: string | null;
  youtubeUrl: string | null; durationSeconds: number | null;
  sectionTitle: string; subjectId: number; subjectTitle: string;
  previousVideoId: number | null; nextVideoId: number | null;
  locked: boolean; unlockReason: string | null; isFree: boolean;
}

function YouTubePlayer({
  youtubeUrl, startAt, onProgress, onCompleted,
}: {
  youtubeUrl: string; startAt: number;
  onProgress: (t: number) => void; onCompleted: () => void;
}) {
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Extract video ID from URL
  const videoId = youtubeUrl.split('/embed/')[1]?.split('?')[0];

  useEffect(() => {
    // Load YouTube IFrame API
    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }

    const initPlayer = () => {
      playerRef.current = new (window as any).YT.Player('yt-player', {
        videoId,
        playerVars: { start: Math.floor(startAt), rel: 0, modestbranding: 1 },
        events: {
          onStateChange: (e: any) => {
            const YT = (window as any).YT.PlayerState;
            if (e.data === YT.PLAYING) {
              intervalRef.current = setInterval(() => {
                if (playerRef.current?.getCurrentTime) {
                  onProgress(playerRef.current.getCurrentTime());
                }
              }, 5000);
            } else {
              if (intervalRef.current) clearInterval(intervalRef.current);
              if (playerRef.current?.getCurrentTime) {
                onProgress(playerRef.current.getCurrentTime());
              }
            }
            if (e.data === YT.ENDED) {
              onCompleted();
            }
          },
        },
      });
    };

    if ((window as any).YT?.Player) {
      initPlayer();
    } else {
      (window as any).onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      playerRef.current?.destroy?.();
    };
  }, [videoId]);

  return (
    <div className="w-full aspect-video bg-black">
      <div id="yt-player" className="w-full h-full" />
    </div>
  );
}

export default function VideoPage() {
  const { id: subjectId, videoId } = useParams<{ id: string; videoId: string }>();
  const router = useRouter();
  const { markVideoCompleted } = useSidebarStore();
  const [video, setVideo] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [startAt, setStartAt] = useState(0);
  const [showComplete, setShowComplete] = useState(false);
  const progressTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLoading(true);
    setShowComplete(false);

    Promise.all([
      api.get(`/api/videos/${videoId}`),
      api.get(`/api/progress/videos/${videoId}`),
    ])
      .then(([videoRes, progressRes]) => {
        setVideo(videoRes.data.video);
        setStartAt(progressRes.data.progress.lastPositionSeconds || 0);
      })
      .catch(err => {
        const msg = err.response?.data?.message || 'Failed to load video';
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, [videoId]);

  const handleProgress = useCallback((currentTime: number) => {
    if (progressTimeout.current) clearTimeout(progressTimeout.current);
    progressTimeout.current = setTimeout(() => {
      api.post(`/api/progress/videos/${videoId}`, { lastPositionSeconds: Math.floor(currentTime) })
        .catch(() => {});
    }, 2000);
  }, [videoId]);

  const handleCompleted = useCallback(async () => {
    try {
      await api.post(`/api/progress/videos/${videoId}`, {
        lastPositionSeconds: video?.durationSeconds || 0,
        isCompleted: true,
      });
      markVideoCompleted(parseInt(videoId));
      toast.success('Lesson completed! 🎉');

      if (video?.nextVideoId) {
        setTimeout(() => {
          router.push(`/subjects/${subjectId}/video/${video.nextVideoId}`);
        }, 1500);
      } else {
        setShowComplete(true);
      }
    } catch {}
  }, [videoId, video, subjectId, router, markVideoCompleted]);

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
    </div>
  );

  if (!video) return (
    <div className="flex items-center justify-center h-96 text-gray-500">Video not found</div>
  );

  // Locked screen
  if (video.locked) return (
    <div className="flex flex-col items-center justify-center h-96 px-4 text-center">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <Lock className="w-10 h-10 text-gray-400" />
      </div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">Lesson Locked</h2>
      <p className="text-gray-500 text-sm mb-6 max-w-sm">{video.unlockReason}</p>
      {video.previousVideoId && (
        <Link href={`/subjects/${subjectId}/video/${video.previousVideoId}`} className="btn-primary">
          ← Go to previous lesson
        </Link>
      )}
    </div>
  );

  return (
    <div className="relative z-10 min-h-screen">
      <OrbBackground />
      
      <div className="max-w-5xl mx-auto px-6 py-10 pb-32">
        {/* Course complete modal */}
        {showComplete && (
          <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center px-4 backdrop-blur-md animate-fadeIn">
            <div className="glass p-10 max-w-sm w-full text-center shadow-3xl border border-white/10 animate-fadeUp">
              <div className="w-20 h-20 bg-[var(--amber)]/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-[var(--amber)]/30">
                <Trophy className="w-10 h-10 text-[var(--amber)]" />
              </div>
              <h2 className="text-3xl font-extrabold text-white mb-2 font-heading">Course Complete! 🎉</h2>
              <p className="text-[var(--text3)] text-sm mb-8 font-medium">Incredible job! You've mastered every module in this course.</p>
              <Link href="/profile" className="btn-primary block !py-4 font-bold flex items-center justify-center gap-2">
                View My Achievements <ArrowRight className="w-4 h-4" />
              </Link>
              <button onClick={() => setShowComplete(false)} className="btn-ghost block w-full mt-4 text-xs font-bold uppercase tracking-widest hover:text-white">
                Back to Lessons
              </button>
            </div>
          </div>
        )}

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--text3)] uppercase tracking-[0.2em] mb-8">
          <Link href="/" className="hover:text-[var(--accent2)] transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3 opacity-30" />
          <Link href={`/subjects/${subjectId}`} className="hover:text-[var(--accent2)] transition-colors truncate max-w-[150px]">{video.subjectTitle}</Link>
          <ChevronRight className="w-3 h-3 opacity-30" />
          <span className="text-[var(--text2)] truncate max-w-[150px]">{video.sectionTitle}</span>
        </div>

        {/* Player Container */}
        <div className="glass overflow-hidden shadow-2xl mb-10 border border-white/10 group">
          <YouTubePlayer
            youtubeUrl={video.youtubeUrl!}
            startAt={startAt}
            onProgress={handleProgress}
            onCompleted={handleCompleted}
          />
        </div>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-10 pb-8 border-b border-white/5">
          <div className="flex-1 min-w-0">
             <div className="flex items-center gap-3 mb-3">
               <span className="badge badge-purple !py-1 !px-3 uppercase tracking-widest text-[9px] font-bold">{video.sectionTitle}</span>
               {video.isFree && <span className="badge badge-green !py-1 !px-3 uppercase tracking-widest text-[9px] font-bold">Free Preview</span>}
             </div>
             <h1 className="text-3xl md:text-4xl font-extrabold text-white font-heading leading-tight mb-2">{video.title}</h1>
             <div className="flex items-center gap-4 text-[11px] font-bold text-[var(--text3)] uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><Play className="w-3.5 h-3.5" /> Playing Now</span>
                <span className="h-1 w-1 bg-white/20 rounded-full" />
                <span>{video.durationSeconds ? `${Math.floor(video.durationSeconds / 60)} Minutes` : 'Lesson'}</span>
             </div>
          </div>

          <button onClick={handleCompleted}
            className="shrink-0 flex items-center justify-center gap-3 bg-[var(--green)]/10 hover:bg-[var(--green)]/20 text-[var(--green)] text-sm font-bold px-8 py-4 rounded-2xl border border-[var(--green)]/20 transition-all hover:scale-[1.02] active:scale-95 group">
            <CheckCircle2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Mark Lesson Complete
          </button>
        </div>

        {/* Description */}
        {video.description && (
          <div className="mb-12">
             <h3 className="text-sm font-bold text-[var(--text3)] uppercase tracking-[0.15em] mb-4 pl-1">About this lesson</h3>
             <div className="glass p-8 border border-white/5 text-[var(--text2)] leading-relaxed text-base italic font-medium bg-white/[0.01]">
               {video.description}
             </div>
          </div>
        )}

        {/* Precise Navigation */}
        <div className="flex items-center justify-between gap-6 pt-10 border-t border-white/5">
          {video.previousVideoId ? (
            <Link href={`/subjects/${subjectId}/video/${video.previousVideoId}`}
              className="btn-ghost !py-4 !px-8 flex items-center gap-3 font-bold group">
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> 
              <span>Back to Previous</span>
            </Link>
          ) : <div />}

          {video.nextVideoId ? (
            <Link href={`/subjects/${subjectId}/video/${video.nextVideoId}`}
              className="btn-primary !py-4 !px-10 flex items-center gap-3 font-bold shadow-xl shadow-indigo-500/20 group">
              <span>Up Next: Lesson</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : (
            <button onClick={() => setShowComplete(true)}
              className="btn-primary !py-4 !px-10 flex items-center gap-3 font-bold shadow-xl shadow-indigo-500/20 group">
              <span>Finish Full Course</span>
              <Trophy className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
