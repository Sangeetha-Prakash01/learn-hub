'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../../../lib/apiClient';
import { useAuthStore } from '../../../store/authStore';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  BookOpen, Clock, Users, Star, ChevronDown, ChevronRight,
  Lock, Play, CheckCircle, Loader2, Tag, User, ShieldCheck, Trophy
} from 'lucide-react';
import { OrbBackground } from '../../components/Design';

interface Subject {
  id: number; title: string; slug: string; description: string;
  thumbnail: string; price: string; instructorId: number;
  instructor: { name: string; email: string };
  sections: Section[];
  enrolled: boolean;
  _count: { enrollments: number };
}
interface Section { id: number; title: string; orderIndex: number; videos: Video[]; }
interface Video { id: number; title: string; durationSeconds: number | null; isFree: boolean; orderIndex: number; }

function formatDuration(s: number | null) {
  if (!s) return '';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export default function SubjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [openSections, setOpenSections] = useState<Set<number>>(new Set([0]));

  useEffect(() => {
    api.get(`/api/subjects/${id}`)
      .then(r => setSubject(r.data.subject))
      .catch(() => toast.error('Failed to load course'))
      .finally(() => setLoading(false));
  }, [id]);

  const toggleSection = (idx: number) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const handleEnroll = async () => {
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    const isFree = Number(subject?.price) === 0;
    setEnrolling(true);
    try {
      if (isFree) {
        await api.post(`/api/payments/enroll-free/${id}`);
        toast.success('Enrolled! Start learning 🎉');
        const { data } = await api.get(`/api/subjects/${id}/first-video`);
        router.push(`/subjects/${id}/video/${data.videoId}`);
      } else {
        const { data } = await api.post(`/api/payments/checkout/${id}`);
        window.location.href = data.checkoutUrl;
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Enrollment failed');
    } finally { setEnrolling(false); }
  };

  const handleContinue = async () => {
    try {
      const { data } = await api.get(`/api/subjects/${id}/first-video`);
      router.push(`/subjects/${id}/video/${data.videoId}`);
    } catch { toast.error('Could not load course'); }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
    </div>
  );
  if (!subject) return <div className="text-center py-20 text-gray-500">Course not found</div>;

  const isFree = Number(subject.price) === 0;
  const totalVideos = subject.sections?.reduce((a, s) => a + (s.videos?.length || 0), 0) || 0;
  return (
    <div className="relative z-10">
      <OrbBackground />
      
      {/* Course Header */}
      <section className="pt-24 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-12 items-start">
            <div className="flex-1">
              <div className="flex gap-2 mb-6">
                <span className="badge badge-purple uppercase tracking-wider text-[10px] font-bold">Featured Course</span>
                {isFree && <span className="badge badge-green uppercase tracking-wider text-[10px] font-bold">Free Enrollment</span>}
              </div>
              
              <h1 className="text-3xl md:text-5xl font-extrabold mb-6 font-heading text-[var(--text)] leading-tight">
                {subject.title}
              </h1>
              
              <p className="text-[var(--text2)] text-lg mb-8 leading-relaxed max-w-2xl">
                {subject.description}
              </p>

              <div className="flex flex-wrap gap-8 py-6 border-y border-[var(--border)] max-w-2xl">
                {[
                  { icon: User, label: 'Instructor', val: subject.instructor?.name },
                  { icon: BookOpen, label: 'Content', val: `${totalVideos} lessons` },
                  { icon: Users, label: 'Students', val: subject._count?.enrollments || 0 },
                  { icon: Star, label: 'Rating', val: '4.8 ★', color: 'text-amber-500' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[var(--surface2)] rounded-lg flex items-center justify-center text-[var(--accent2)]">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] text-[var(--text3)] uppercase tracking-wide font-bold">{item.label}</div>
                      <div className={`text-sm font-semibold ${item.color || 'text-[var(--text)]'}`}>{item.val}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating Card */}
            <div className="w-full lg:w-[360px] glass p-6 sticky top-24 shadow-2xl overflow-hidden border border-white/10 group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-600" />
              
              <div className="relative h-48 rounded-xl overflow-hidden mb-6">
                <img src={subject.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-white/30 transition-all border border-white/30">
                    <Play className="w-6 h-6 fill-current" />
                  </div>
                </div>
              </div>

              <div className="flex items-end gap-2 mb-6">
                 <span className="text-4xl font-extrabold text-[var(--text)] font-heading">
                   {isFree ? 'Free' : `$${Number(subject.price).toFixed(0)}`}
                 </span>
                 {!isFree && <span className="text-[var(--text3)] text-sm line-through mb-1.5">$99.99</span>}
                 <span className="badge badge-green ml-auto mb-1.5">Best Value</span>
              </div>

              <div className="space-y-3 mb-8">
                {subject.enrolled ? (
                  <button onClick={handleContinue} className="btn-primary w-full !py-4 font-bold tracking-tight">
                    Continue Learning →
                  </button>
                ) : (
                  <button onClick={handleEnroll} disabled={enrolling} className="btn-primary w-full !py-4 font-bold tracking-tight flex items-center justify-center gap-2 group">
                    {enrolling ? <Loader2 className="w-5 h-5 animate-spin" /> : 
                      isFree ? 'Enroll for Free Now' : `Purchase Course →`}
                  </button>
                )}
                <p className="text-center text-[11px] text-[var(--text3)] font-medium italic">
                  30-day money-back guarantee · Lifetime access
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-[11px] font-bold text-[var(--text3)] uppercase tracking-widest pl-1">Course Includes</h4>
                {[
                  { icon: BookOpen, text: `${totalVideos} Lesson modules` },
                  { icon: ShieldCheck, text: 'Verified Certification' },
                  { icon: Trophy, text: 'Quizzes & Assignments' },
                  { icon: Clock, text: 'Full lifetime access' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-[var(--text2)]">
                    <item.icon className="w-4 h-4 text-[var(--accent2)]" />
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Curriculum */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-bold font-heading text-[var(--text)] mb-8 ml-1 flex items-center gap-3">
          Curriculum <span className="badge badge-purple !py-1 !px-3">{subject.sections?.length} Sections</span>
        </h2>
        
        <div className="space-y-4">
          {subject.sections?.map((section, idx) => (
            <div key={section.id} className="glass overflow-hidden border border-white/5 group hover:border-white/10 transition-all">
              <button onClick={() => toggleSection(idx)}
                className="w-full flex items-center justify-between px-6 py-5 cursor-pointer select-none">
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${openSections.has(idx) ? 'bg-[var(--accent)] text-white' : 'bg-[var(--surface2)] text-[var(--text3)]'}`}>
                    {openSections.has(idx) ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </div>
                  <span className="font-bold text-[var(--text)] font-heading">{section.title}</span>
                </div>
                <span className="text-xs font-bold text-[var(--text3)] uppercase tracking-wide bg-[var(--surface2)] py-1 px-3 rounded-md">{section.videos?.length || 0} lessons</span>
              </button>

              {openSections.has(idx) && (
                <div className="border-t border-white/5 bg-white/5">
                  {section.videos?.map(video => (
                    <div key={video.id} className="flex items-center gap-4 px-8 py-4 hover:bg-white/5 transition-colors group cursor-pointer border-b border-white/[0.02] last:border-0">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-white/10 group-hover:bg-[var(--accent)] group-hover:border-transparent transition-all">
                        {video.isFree ?
                          <Play className="w-4 h-4 text-[var(--accent2)] group-hover:text-white fill-current" /> :
                          <Lock className="w-4 h-4 text-[var(--text3)] group-hover:text-white" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-[var(--text2)] group-hover:text-[var(--text)] transition-colors">{video.title}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                           {video.isFree && <span className="text-[10px] font-bold text-[var(--green)] uppercase tracking-tighter">Free Preview</span>}
                           {video.durationSeconds && <span className="text-[10px] font-medium text-[var(--text3)]">{formatDuration(video.durationSeconds)}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
