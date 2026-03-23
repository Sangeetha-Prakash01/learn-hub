'use client';
import { useEffect, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import api from '../../../lib/apiClient';
import { useSidebarStore } from '../../../store/sidebarStore';
import { Menu, X, GraduationCap, ChevronLeft, ChevronRight, Play, Lock, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { OrbBackground } from '../../components/Design';

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="w-full bg-[var(--surface3)] rounded-full h-1.5 overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]"
        style={{ width: `${percent}%` }} />
    </div>
  );
}

function SidebarContent({ subjectId, currentVideoId }: { subjectId: string; currentVideoId?: string }) {
  const { sections, subjectTitle, loading } = useSidebarStore();
  const [progress, setProgress] = useState({ completedVideos: 0, totalVideos: 0, percentComplete: 0 });

  useEffect(() => {
    api.get(`/api/progress/subjects/${subjectId}`)
      .then(r => setProgress(r.data.progress))
      .catch(() => {});
  }, [subjectId]);

  if (loading) return (
    <div className="p-6 space-y-4">
      {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-12 rounded-xl" />)}
    </div>
  );

  const totalVideos = sections.reduce((a, s) => a + s.videos.length, 0);
  const completedVideos = sections.reduce((a, s) => a + s.videos.filter(v => v.isCompleted).length, 0);
  const pct = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-[var(--border)] bg-[var(--surface)] backdrop-blur-md">
        <Link href={`/subjects/${subjectId}`} className="text-xs font-bold text-[var(--accent3)] uppercase tracking-[0.2em] mb-4 flex items-center gap-2 group">
          <ChevronLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" /> Back to Subject
        </Link>
        <h2 className="text-lg font-bold text-[var(--text)] font-heading line-clamp-2 mb-4 leading-tight">
          {subjectTitle}
        </h2>
        
        <div className="flex justify-between items-end text-[10px] font-bold text-[var(--text3)] uppercase tracking-wider mb-2">
           <span className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
             {completedVideos} / {totalVideos} Completed
           </span>
           <span className="text-[var(--text)]">{pct}%</span>
        </div>
        <ProgressBar percent={pct} />
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {sections.map((section) => (
          <div key={section.id} className="mb-2">
            <div className="px-6 py-4 bg-white/[0.02] border-y border-[var(--border)]">
              <p className="text-[10px] font-extrabold text-[var(--text3)] uppercase tracking-[0.15em]">{section.title}</p>
            </div>
            <div className="py-1">
              {section.videos.map((video) => {
                const isCurrent = String(video.id) === currentVideoId;
                return (
                  <Link
                    key={video.id}
                    href={`/subjects/${subjectId}/video/${video.id}`}
                    className={`flex items-start gap-3 px-6 py-4 transition-all group relative
                      ${isCurrent ? 'bg-indigo-500/10 text-[var(--text)]' : 'hover:bg-white/[0.04] text-[var(--text2)]'}
                      ${video.locked ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}`}
                  >
                    {isCurrent && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 shadow-[2px_0_10px_rgba(99,102,241,0.8)]" />}
                    
                    <div className="mt-0.5 shrink-0">
                      {video.isCompleted ? (
                        <div className="w-5 h-5 bg-[var(--green)]/20 text-[var(--green)] rounded-full flex items-center justify-center border border-[var(--green)]/30">
                          <CheckCircle2 className="w-3 h-3" />
                        </div>
                      ) : video.locked ? (
                        <Lock className="w-5 h-5 text-[var(--text3)]" />
                      ) : (
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                          ${isCurrent ? 'border-indigo-500 bg-indigo-500' : 'border-[var(--border2)] group-hover:border-[var(--text3)]'}`}>
                          {isCurrent ? <Play className="w-2 h-2 text-white fill-current" /> : <div className="w-1.5 h-1.5 bg-[var(--border2)] rounded-full" />}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] leading-snug line-clamp-2 transition-colors ${isCurrent ? 'font-bold text-white' : 'font-medium group-hover:text-[var(--text)]'}`}>
                        {video.title}
                      </p>
                      {video.durationSeconds && (
                        <p className="text-[10px] text-[var(--text3)] font-bold mt-1.5 uppercase tracking-wide">
                          {Math.floor(video.durationSeconds / 60)}:{(video.durationSeconds % 60).toString().padStart(2, '0')} · {video.isFree ? 'Preview' : 'Lesson'}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SubjectLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ id: string; videoId?: string }>();
  const pathname = usePathname();
  const { setTree, setLoading, setError } = useSidebarStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Extract videoId from path
  const videoIdMatch = pathname.match(/\/video\/(\d+)/);
  const currentVideoId = videoIdMatch?.[1];

  useEffect(() => {
    if (!params.id) return;
    setLoading(true);
    api.get(`/api/subjects/${params.id}/tree`)
      .then(r => setTree(parseInt(params.id), r.data.subject.title, r.data.sections))
      .catch(() => setError('Failed to load course'));
  }, [params.id]);

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden relative">
      <OrbBackground />
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto
        sidebar-custom flex flex-col shadow-2xl
        transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1)
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        top-16 lg:top-0 h-[calc(100vh-4rem)]
      `}>
        <SidebarContent subjectId={params.id} currentVideoId={currentVideoId ?? undefined} />
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto relative z-10 custom-scrollbar">
        {/* Mobile sidebar toggle */}
        <div className="lg:hidden flex items-center justify-between px-6 py-4 bg-[var(--bg)] border-b border-[var(--border)] sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="p-2.5 hover:bg-[var(--surface2)] rounded-xl transition-colors">
              <Menu className="w-5 h-5 text-[var(--accent2)]" />
            </button>
            <span className="text-[11px] font-extrabold text-[var(--text3)] uppercase tracking-[0.2em]">Course Modules</span>
          </div>
          <GraduationCap className="w-6 h-6 text-[var(--accent)]" />
        </div>
        {children}
      </div>
    </div>
  );
}
