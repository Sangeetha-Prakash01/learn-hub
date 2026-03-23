'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/apiClient';
import { useAuthStore } from '../../store/authStore';
import Link from 'next/link';
import { BookOpen, CheckCircle2, Clock, Trophy, Loader2, TrendingUp, ArrowRight, Zap, Target, Sparkles } from 'lucide-react';
import { OrbBackground } from '../components/Design';

interface EnrolledCourse {
  id: number; title: string; thumbnail: string;
  instructor: { name: string };
  progress: { totalVideos: number; completedVideos: number; percentComplete: number; lastVideoId: number | null };
}
interface Badge { id: number; name: string; description: string; icon: string; earnedAt: string; }

function StatCard({ icon, label, value, color, bg }: any) {
  return (
    <div className="glass p-6 border border-white/5 group hover:border-white/10 transition-all">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${bg} ${color}`}>
        {icon}
      </div>
      <div className="text-3xl font-extrabold text-white font-heading mb-1">{value}</div>
      <div className="text-[10px] text-[var(--text3)] font-bold uppercase tracking-widest leading-none">{label}</div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/auth/login'); return; }

    const fetchEnrolled = async () => {
      try {
        const includeDrafts = user?.role === 'ADMIN' || user?.role === 'INSTRUCTOR';
        // Get all subjects, filter enrolled ones
        const { data } = await api.get('/api/subjects', { params: { pageSize: 100, includeDrafts } });
        const enrolled: EnrolledCourse[] = [];

        for (const subject of data.subjects) {
          try {
            const [subjectRes, progressRes] = await Promise.all([
              api.get(`/api/subjects/${subject.id}`),
              api.get(`/api/progress/subjects/${subject.id}`),
            ]);
            if (subjectRes.data.subject.enrolled) {
              enrolled.push({
                ...subject,
                progress: progressRes.data.progress,
              });
            }
          } catch {}
        }
        setCourses(enrolled);
        
        // Fetch Badges
        const badgeRes = await api.get('/api/badges/my');
        setBadges(badgeRes.data.badges);
      } catch {}
      finally { setLoading(false); }
    };
    fetchEnrolled();
  }, [isAuthenticated]);

  const totalCompleted = courses.filter(c => c.progress?.percentComplete === 100).length;
  const totalVideosWatched = courses.reduce((a, c) => a + (c.progress?.completedVideos || 0), 0);
  const avgProgress = courses.length > 0
    ? Math.round(courses.reduce((a, c) => a + (c.progress?.percentComplete || 0), 0) / courses.length)
    : 0;

  return (
    <div className="relative z-10 min-h-screen">
      <OrbBackground />
      
      <div className="max-w-6xl mx-auto px-6 py-20 pb-32">
        {/* Profile header */}
        <div className="glass p-8 md:p-12 mb-12 flex flex-col md:flex-row items-center gap-8 border border-white/10 shadow-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] pointer-events-none rounded-full -mr-32 -mt-32" />
          
          <div className="w-28 h-28 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2.5rem] flex items-center justify-center text-white font-extrabold text-4xl shrink-0 shadow-2xl relative">
            {user?.name?.[0]?.toUpperCase()}
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-[var(--green)] border-4 border-[var(--bg)] rounded-full flex items-center justify-center">
               <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
          
          <div className="text-center md:text-left flex-1 min-w-0">
            <h1 className="text-3xl md:text-5xl font-extrabold text-white font-heading tracking-tight mb-2 truncate">{user?.name}</h1>
            <p className="text-[var(--text3)] text-base font-medium mb-6">{user?.email}</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <span className="badge badge-purple !py-1.5 !px-5 uppercase tracking-widest text-[10px] font-bold">Verified {user?.role}</span>
              <span className="badge badge-amber !py-1.5 !px-5 uppercase tracking-widest text-[10px] font-bold">Premium License</span>
            </div>
          </div>

          <div className="shrink-0">
             <button onClick={() => router.push('/dashboard')} className="btn-ghost !text-xs !py-3 !px-6 font-bold flex items-center gap-2">
                Edit My Profile <ArrowRight className="w-4 h-4" />
             </button>
          </div>
        </div>

        {/* Stats Section Header */}
        <div className="mb-8 flex items-center gap-4">
           <h2 className="text-sm font-bold font-heading text-[var(--text3)] uppercase tracking-[0.2em] pl-1">Performance Overview</h2>
           <div className="h-px bg-[var(--border)] flex-1" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          <StatCard icon={<BookOpen className="w-6 h-6" />} label="Courses Joined"
            value={courses.length} color="text-blue-400" bg="bg-blue-400/10" />
          <StatCard icon={<Trophy className="w-6 h-6" />} label="Graduated"
            value={totalCompleted} color="text-amber-400" bg="bg-amber-400/10" />
          <StatCard icon={<Target className="w-6 h-6" />} label="Lessons Finished"
            value={totalVideosWatched} color="text-emerald-400" bg="bg-emerald-400/10" />
          <StatCard icon={<TrendingUp className="w-6 h-6" />} label="Expertise Score"
            value={`${avgProgress}%`} color="text-purple-400" bg="bg-purple-400/10" />
        </div>

        {/* Badges Section */}
        <div className="mb-20">
          <div className="mb-8 flex items-center gap-4">
             <h2 className="text-sm font-bold font-heading text-[var(--text3)] uppercase tracking-[0.2em] pl-1">Achievements & Badges</h2>
             <div className="h-px bg-[var(--border)] flex-1" />
          </div>

          {badges.length > 0 ? (
            <div className="flex flex-wrap gap-6">
               {badges.map(badge => (
                 <div key={badge.id} className="group relative">
                    <div className="w-16 h-16 md:w-20 md:h-20 glass rounded-[2rem] border border-white/10 flex items-center justify-center text-[var(--accent2)] hover:scale-110 hover:border-indigo-500/50 transition-all cursor-pointer shadow-xl">
                       <Sparkles className="w-8 h-8 md:w-10 md:h-10" />
                    </div>
                    {/* Tooltip */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-48 p-3 glass border border-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none text-center">
                       <p className="text-xs font-bold text-white mb-1">{badge.name}</p>
                       <p className="text-[10px] text-[var(--text3)] uppercase tracking-tight">{badge.description}</p>
                    </div>
                 </div>
               ))}
               {/* Empty badge slots */}
               {[...Array(Math.max(0, 5 - badges.length))].map((_, i) => (
                 <div key={i} className="w-16 h-16 md:w-20 md:h-20 glass rounded-[2rem] border border-dashed border-white/5 opacity-30 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-white/20" />
                 </div>
               ))}
            </div>
          ) : (
            <div className="glass p-10 text-center rounded-[2.5rem] border border-dashed border-white/10">
               <p className="text-sm font-bold text-[var(--text3)] uppercase tracking-widest">No badges earned yet</p>
            </div>
          )}
        </div>

        {/* My Learning Header */}
        <div className="mb-10 flex items-center justify-between">
           <h2 className="text-2xl font-bold font-heading text-white">My Active Learning</h2>
           <span className="badge badge-purple !py-1 !px-4">{courses.length} Units</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => <div key={i} className="skeleton h-64 rounded-[2.5rem]" />)}
          </div>
        ) : courses.length === 0 ? (
          <div className="glass p-20 text-center rounded-[3rem] border border-white/5 animate-fadeUp">
            <BookOpen className="w-20 h-20 text-[var(--text3)] mx-auto mb-8 opacity-20" />
            <h3 className="text-xl font-bold text-[var(--text2)] mb-2">No learning content found</h3>
            <p className="text-[var(--text3)] text-sm mb-10 max-w-sm mx-auto font-medium">Elevate your skills today with our curated selection of industry-grade courses.</p>
            <Link href="/" className="btn-primary px-10 !py-4 font-bold shadow-xl shadow-indigo-500/20">Explore Curriculum</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => {
              const pct = course.progress?.percentComplete || 0;
              const isDone = pct === 100;
              return (
                <div key={course.id} className="glass flex flex-col group overflow-hidden border border-white/5 hover:border-white/10 hover:-translate-y-2 transition-all duration-500 rounded-[2.5rem] shadow-2xl">
                  {/* Card Thumbnail */}
                  <div className="relative h-44 overflow-hidden shadow-inner">
                    <img src={course.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    
                    <div className="absolute bottom-4 left-4 right-4">
                       <div className="flex justify-between items-end mb-2">
                          <span className={`badge ${isDone ? 'badge-green' : 'badge-purple'} !py-0.5 !px-3 !text-[9px] uppercase font-black tracking-widest`}>
                            {isDone ? 'Finished' : 'In Progress'}
                          </span>
                          <span className="text-xs font-black text-white font-heading">{pct}%</span>
                       </div>
                       <div className="w-full bg-white/10 rounded-full h-1 overflow-hidden backdrop-blur-md">
                          <div className={`h-full rounded-full transition-all duration-1000 ${isDone ? 'bg-[var(--green)]' : 'bg-indigo-500'}`} style={{ width: `${pct}%` }} />
                       </div>
                    </div>

                    {isDone && (
                      <div className="absolute top-4 right-4 w-10 h-10 bg-[var(--amber)]/20 text-[var(--amber)] border border-[var(--amber)]/30 backdrop-blur-md rounded-xl flex items-center justify-center animate-pulse">
                        <Trophy className="w-5 h-5" />
                      </div>
                    )}
                  </div>

                  <div className="p-8 flex flex-col flex-1">
                    <h3 className="font-bold text-white text-lg font-heading mb-2 line-clamp-1 group-hover:text-[var(--accent2)] transition-colors">{course.title}</h3>
                    <p className="text-xs font-bold text-[var(--text3)] uppercase tracking-widest mb-8">{course.instructor?.name}</p>

                    <div className="mt-auto space-y-4">
                      <div className="flex items-center gap-3 text-[10px] font-black text-[var(--text3)] uppercase tracking-widest">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        <span>{course.progress?.completedVideos || 0} of {course.progress?.totalVideos || 0} Lessons Complete</span>
                      </div>
                      
                      <Link
                        href={course.progress?.lastVideoId
                          ? `/subjects/${course.id}/video/${course.progress.lastVideoId}`
                          : `/subjects/${course.id}`}
                        className={`btn-primary w-full !py-4 font-bold tracking-tight rounded-2xl flex items-center justify-center gap-2 group/btn ${isDone ? '!bg-green-500 shadow-green-500/10' : ''}`}>
                        {isDone ? 'Revisit Course' : pct > 0 ? 'Resume Learning' : 'Start Journey'}
                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-all" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
